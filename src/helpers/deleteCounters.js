import {getUsers} from './fetch.js';
import {MAV_USER_ID} from './consts.js';
import {SE_API_COUNTER_KEY} from '../keys.js';

export const initDeleteCounterData = async (sessionData, userId, nicknames, count=0) => {
  let user = sessionData.users[userId]

  if(!user) {
    const users = await getUsers(sessionData, [userId]);
    if(!users?.length) {
      return;
    }
    user = users[0];
    sessionData.users[userId] = user;
  }

  const counterEl = document.createElement('div');
  counterEl.innerHTML = `${user.display_name} messages deleted: ${count}`;
  counterEl.classList.add('delete_counter');

  counterEl.setAttribute('id', `${userId}-delete_counter`);

  sessionData.deleteCounters[userId] = {
    deletedMessages: count,
    messageIds: {},
    shouldDisplay: false,
    isFlashing: false,
    element: counterEl,
    nicknames,
    userId,
  }

  counterEl.style.opacity = '0';

  const deleteCounterContainer = document.getElementById('delete_counter_container');
  deleteCounterContainer.appendChild(counterEl);

  setTimeout(() => {
    counterEl.style.transition = '';
    counterEl.style.top = `-${counterEl.clientHeight + 10}px`
    setTimeout(() => {
      counterEl.style.opacity = '1';
      counterEl.style.transition = 'top 1s ease';
    }, 1)
  }, 1)
}

export const updateDeleteCounterElement = (sessionData, userId) => {
  const {deletedMessages, element} = sessionData.deleteCounters[userId];
  const previousHtml = element.innerHTML;
  const numberEndPosition = previousHtml.indexOf(' messages deleted: ') + ' messages deleted: '.length;
  element.innerHTML = previousHtml.slice(0, numberEndPosition) + deletedMessages;
}

export const loadDeleteCounters = async (sessionData) => {
  // get the list of tracked users through the SE_API store 
  const counters = await SE_API.store.get(SE_API_COUNTER_KEY);

  if(!counters) {
    // Initialize the delete counters persistent data store, 
    // have it always add Mav by default
    await initDeleteCounterData(sessionData, MAV_USER_ID, ['mav', 'maveric', 'maverick']);
    await saveUserDeletionCounters(sessionData);
  } else {
    await Promise.all(
      Object.entries(counters).map(
        ([userId, counter]) => initDeleteCounterData(sessionData, userId, counter.nicknames, counter.count)
      )
    );
  }
  
  return;
}

export const saveUserDeletionCounters = (sessionData) => {
  const {deleteCounters} = sessionData;
  const updatedCounterData = Object.entries(deleteCounters).reduce((acc, el) => {
    const [userId, counterData] = el;
    const {deletedMessages: count, nicknames} = counterData;

    acc[userId] = { count, nicknames };

    return acc;
  }, {});

  return SE_API.store.set(SE_API_COUNTER_KEY, updatedCounterData)
}

export const removeUserDeletionCounter = async (sessionData, username) => {
  const userDelCounter = getDeleteCounterByNickname(sessionData, username)
  if(!userDelCounter) {
    return;
  }

  hideCounter(sessionData, userDelCounter.element, true);

  const {userId} = userDelCounter;


  // remove the delete counter from session data,
  sessionData.deleteCounters = Object.entries(sessionData.deleteCounters).reduce((acc, el) => {
    const [_userId, deleteCounter] = el;
    if(_userId !== userId) {
      acc[_userId] = deleteCounter;
    }
    return acc;
  }, {});
  // update the saved deletion counters
  return saveUserDeletionCounters(sessionData)
}

export const updateUserDeletionConter = (sessionData, userId, count) => {
  sessionData.deleteCounters[userId].deletedMessages = count;
  updateDeleteCounterElement(sessionData, userId);
  return saveUserDeletionCounters(sessionData)
}

export const incrementUserDeletionCounter = (sessionData, userId) => {
  const newCount = sessionData.deleteCounters[userId].deletedMessages + 1;
  return updateUserDeletionConter(sessionData, userId, newCount);
};

const updateCounterPositions = (sessionData, counter) => {
  let totalOffsetHeight = 0;
  [...sessionData.shownCounters].forEach((_counter, i) => {
    const offsetTop = 10 + (_counter.clientHeight + 10) * i;
    _counter.style.top = `${offsetTop}px`;
    totalOffsetHeight += (_counter.clientHeight + 10);
  });
  sessionData.lottery.timer.container.style.top = `${totalOffsetHeight + 10}px`;
};

export const hideCounter = (sessionData, counter) => {
  if(!sessionData.shownCounters.has(counter)) {
    return;
  }
  sessionData.shownCounters.delete(counter);
  counter.style.top = `-${(counter.clientHeight) + 10}px`;
  updateCounterPositions(sessionData, counter);
};

export const showCounter = (sessionData, counter) => {
  sessionData.shownCounters.add(counter);
  updateCounterPositions(sessionData, counter);
};

export const flashCounter = (sessionData, counter) => {
  showCounter(sessionData, counter);
  setTimeout(() => hideCounter(sessionData, counter), 6000);
};

export const getDeleteCounterByNickname = (sessionData, nickname) => {
  const [userId, counter] = Object.entries(sessionData.deleteCounters).find(([userId, counter]) => {
    const nicknames = [...counter.nicknames]
    const user = sessionData.users[userId];
    if(user?.display_name) {
      nicknames.push(user.display_name);
    }
    if(nicknames.includes(nickname)) {
      return true;
    }
    return false;
  }) || [];

  return counter;
}