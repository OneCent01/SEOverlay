import {
  incrementUserDeletionCounter, 
  updateUserDeletionConter
} from '../helpers/deleteCounters.js';
import {pick} from 'lodash';

export const handleMessageDeleteEvent = (event, sessionData) => {
  const {msgId} = event;

  if(
    sessionData.tts.currentMsgId === msgId && 
    typeof sessionData.tts.skip === 'function'
  ) {
    sessionData.tts.skip();
  } else if(sessionData.tts.msgIdToTextMap[msgId]) {
    sessionData.tts.queue = sessionData.tts.queue.filter(id => id !== msgId);
    sessionData.tts.msgIdToTextMap = pick(
      sessionData.tts.msgIdToTextMap,
      sessionData.tts.queue,
    );
  }

  Object.entries(sessionData.deleteCounters).map(([userId, deleteCounterData]) => {
    if(deleteCounterData.messageIds[msgId]) {
      sessionData.deleteCounters[userId].messageIds = Object.entries(sessionData.deleteCounters[userId].messageIds).reduce((acc, el) => {
        const [messageId, val] = el;
        if(msgId !== messageId) {
          acc[msgId] = el;
        }
        return acc;
      }, {});

      incrementUserDeletionCounter(sessionData, userId)
    }
  })
}

export const handleMessagesDeleteEvent = (event, sessionData) => {
  const {userId} = event;

  if(sessionData.tts.userMsgIds[userId]) {
    sessionData.tts.userMsgIds[userId].forEach(msgId => {
      if(
        sessionData.tts.currentMsgId === msgId && 
        typeof sessionData.tts.skip === 'function'
      ) {
        sessionData.tts.skip();
      } else if(sessionData.tts.msgIdToTextMap[msgId]) {
        sessionData.tts.queue = sessionData.tts.queue.filter(id => id !== msgId);
        sessionData.tts.msgIdToTextMap = pick(
          sessionData.tts.msgIdToTextMap,
          sessionData.tts.queue,
        );
      }
    });
  }

  const userDeleteCounterData = sessionData.deleteCounters[userId];

  if(userDeleteCounterData) {
    const deletedMessagesCount = (
      userDeleteCounterData.deletedMessages + 
      Object.values(userDeleteCounterData.messageIds).length
    );

    updateUserDeletionConter(sessionData, userId, deletedMessagesCount)

    sessionData.deleteCounters[userId].messageIds = {};
  }


}