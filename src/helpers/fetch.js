import {STREAMER_ID, ACCESS_TOKEN, SPEAKER_TEMPLATES} from './consts.js';
import {APPLICATION_ID, MICROSOFT_TTS_SUBSCRIPTION_KEY} from '../keys.js';

const getRequestHeaders = () => new Headers({
  "Authorization": `Bearer ${ACCESS_TOKEN}`,
  "Client-Id": APPLICATION_ID,
})

export const _fetch = async (url) => {
  const res = await fetch(url, {headers: getRequestHeaders()});
  return res?.json() || {};
};

export const getRedemptions = () => _fetch(
  `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${STREAMER_ID}`
);

export const getRedemptionEvets = (id) => _fetch(
  `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${STREAMER_ID}&reward_id=${id}&status=UNFULFILLED&first=3`
);

export const getHypeTrainEvents = () => _fetch(
  `https://api.twitch.tv/helix/hypetrain/events?broadcaster_id=${STREAMER_ID}&first=100`
);

export const getUsersColors = async (users) => {
  if(!users.length) {
    return [];
  }
  const usersMap = users.reduce((userMap, user) => {
    userMap[user.id] = user;

    return userMap;
  }, {});

  const userIds = Object.keys(usersMap).map(id => `user_id=${id}`).join('&');
  const res = await _fetch(
    `https://api.twitch.tv/helix/chat/color?${userIds}`
  );

  return res?.data?.map(userColor => ({
    ...(usersMap[userColor.user_id] || {}),
    ...userColor,
  })) || [];
};

export const getUsers = async (sessionData, ids, usernames=[]) => {
  const getByIds = Boolean(ids?.length);

  const existingUsers = new Set();
  const newUserIds = new Set();
  const newUsernames = new Set();

  ids.forEach(id => {
    const user = sessionData.users[id];
    if(user) {
      existingUsers.add(user);
    } else {
      newUserIds.add(id);
    }
  });

  const usernameToIdMap = {};

  Object.entries(sessionData.users).forEach(([userId, user]) => {
    usernameToIdMap[user.display_name] = userId;
  });

  usernames.forEach(username => {
    const userId = usernameToIdMap[username];
    const user = sessionData.users[userId];
    if(user) {
      existingUsers.add(user);
    } else {
      newUsernames.add(username);
    }
  });

  const userIds = [...newUserIds].map(id => `id=${id}`).join('&');
  const userNames = [...newUsernames].map(username => `login=${username}`).join('&');

  const urls = [];

  userIds?.length && urls.push(`https://api.twitch.tv/helix/users?${userIds}`);
  userNames?.length && urls.push(`https://api.twitch.tv/helix/users?${userNames}`);

  const responses = await Promise.all(urls.map(_fetch));
  const fetchedUsers = [];
  responses.forEach(res => {
    if(res?.data?.length) {
      res?.data.forEach(user => fetchedUsers.push(user))
    }
  });

  const usersWithChatColor = await getUsersColors(fetchedUsers);

  usersWithChatColor.forEach(user => {
    sessionData.users[user.id] = user;
  });

  return [
    ...existingUsers,
    ...usersWithChatColor,
  ];
};

export const fetchSpeech = (sessionData, text) => new Promise(async (resolve) => {
  const lowerText = text.toLowerCase();
  const textVoice = Object.keys(SPEAKER_TEMPLATES).find(
    voice => lowerText.startsWith(`${voice}::`)
  );
  const speakerTemplate = 
    SPEAKER_TEMPLATES[textVoice] || 
    SPEAKER_TEMPLATES[sessionData.tts.voice];
  
  const messageText = textVoice ? text.slice(textVoice.length) : text;
  const requestBody = speakerTemplate(messageText);

  const res = await fetch(
    'https://southcentralus.tts.speech.microsoft.com/cognitiveservices/v1',
    {
      method: 'POST',
      headers: new Headers({
        "Content-Type": "application/ssml+xml",
        "Ocp-Apim-Subscription-Key": MICROSOFT_TTS_SUBSCRIPTION_KEY,
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
      }),
      body: requestBody,
    }
  );

  const reader = res.body?.getReader();
  if(!reader) {
    return;
  }

  let isDone = false,
    chunks = [],
    bytes = 0;
  do {
    const {done, value} = await reader.read();
    if(value) {
      chunks.push(value);
      bytes += value.length;
    }
    isDone = done;
  } while(!isDone);

  const buffer = new ArrayBuffer(bytes);
  const audioBytes = new Uint8Array(buffer);
  let offset = 0;
  chunks.forEach(chunk => {
    audioBytes.set(chunk, offset);
    offset += chunk.length;
  });

  const audioBlob = new Blob([audioBytes], {type: 'audio/mp3'});
  const audio = new Audio(URL.createObjectURL(audioBlob));
  const handleEnded = () => {
    audio.removeEventListener('ended', handleEnded);
    sessionData.tts.skip = null;
    resolve();
  }
  audio.addEventListener('ended', handleEnded);
  sessionData.tts.skip = handleEnded;

  try {
    audio.play();
  } catch(err) {
    handleEnded();
  }
});

