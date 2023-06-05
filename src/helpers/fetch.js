import {STREAMER_ID, ACCESS_TOKEN, SPEAKER_TEMPLATES} from './consts.js';
import {APPLICATION_ID, MICROSOFT_TTS_SUBSCRIPTION_KEY, ELEVEN_LABS_API_KEY} from '../keys.js';

const getRequestHeaders = () => new Headers({
  "Authorization": `Bearer ${ACCESS_TOKEN}`,
  "Client-Id": APPLICATION_ID,
})

export const twitchFetch = async (url) => {
  const res = await fetch(url, {headers: getRequestHeaders()});
  return res?.json() || {};
};

export const getRedemptions = () => twitchFetch(
  `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${STREAMER_ID}`
);

export const getRedemptionEvets = (id) => twitchFetch(
  `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${STREAMER_ID}&reward_id=${id}&status=UNFULFILLED&first=3`
);

export const getHypeTrainEvents = () => twitchFetch(
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
  const res = await twitchFetch(
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

  const responses = await Promise.all(urls.map(twitchFetch));
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

export const fetchElevenLabsVoices = async () => {
  const res = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: new Headers({
      accept: 'application/json',
      'xi-api-key': ELEVEN_LABS_API_KEY,
    })
  })
  return res.json()
};

const normalizedAudio = async (sessionData, res) => {
  if(typeof res?.blob !== 'function') {
    resolve(false);
    return;
  }
  const audioBlob = await res?.blob();
  if(!audioBlob) {
    resolve(false);
    return;
  }
  const audioDataUrl = URL.createObjectURL(audioBlob);
  let audio = new Audio(audioDataUrl);
  if(!audio) {
    resolve(false);
    return;
  }
  var audioCtx = new AudioContext();
  var src = audioCtx.createMediaElementSource(audio);
  var gainNode = audioCtx.createGain();
  gainNode.gain.value = 1.0;

  audio.addEventListener("play", () => {
    src.connect(gainNode);
    gainNode.connect(audioCtx.destination);
  }, true);
  audio.addEventListener("pause", () => {
    // disconnect the nodes on pause, otherwise all nodes always run
    src.disconnect(gainNode);
    gainNode.disconnect(audioCtx.destination);
  }, true);
  const buf = await audioBlob.arrayBuffer();
  const decodedData = await audioCtx.decodeAudioData(buf);

  var decodedBuffer = decodedData.getChannelData(0);
  var sliceLen = Math.floor(decodedData.sampleRate * 0.005);
  var averages = [];
  var sum = 0.0;
  for (var i = 0; i < decodedBuffer.length; i++) {
    sum += decodedBuffer[i] ** 2;
    if (i % sliceLen === 0) {
      sum = Math.sqrt(sum / sliceLen);
      averages.push(sum);
      sum = 0;
    }
  }
  // Take the loudest from the volume averages at each tested interval
  const higestGain = Math.max(...averages);

  var gain = (sessionData.tts.volume / 5) / higestGain;
  // ensure gain isn't cranked aboved 3
  gainNode.gain.value = Math.min(gain, 3);

  return audio;
}

const playAudioResponse = (sessionData, res) => new Promise(async (resolve) => {
  if(sessionData.tts.shouldSkipNext) {
    resolve(true);
    return;
  }
  try {
    const audio = await normalizedAudio(sessionData, res);

    audio.volume = sessionData.tts.volume;
    let handleEndedEvent; 
    const handleEnded = (success) => {
      audio.removeEventListener('ended', handleEndedEvent);
      sessionData.tts.skip = null;
      resolve(success);
    }
    handleEndedEvent = () => handleEnded(true);
    audio.addEventListener('ended', handleEndedEvent);
    sessionData.tts.skip = () => {
      audio.pause();
      handleEnded(true);
    };
    if(sessionData.tts.shouldSkipNext) {
      handleEnded(true);
      return;
    }

    audio.play().catch(err => {
      audio.pause();
      handleEnded(false);
    });
  } catch(err) {
    sessionData.tts.skip = null;
    resolve(false);
  }
});

export const fetchElevenLabsSpeech = (sessionData, text, voice) => new Promise(async (resolve) => {
  const voiceId = sessionData.tts.elevenLabsVoices[voice.toLowerCase()];
  if(!voiceId) {
    resolve(false);
    return;
  }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=0`, {
    method: 'POST',
    headers: new Headers({
      Accept: 'audio/mpeg',
      'xi-api-key': ELEVEN_LABS_API_KEY,
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      "text": text,
      "model_id": "eleven_monolingual_v1",
      "voice_settings": {
        "stability": 0.05,
        "similarity_boost": 0.80,
      }
    }),
  });

  const success = await playAudioResponse(sessionData, res);
  resolve(success);
});

export const fetchMicrosoftSpeech = (sessionData, text, voice) => new Promise(async (resolve) => {
  const speakerTemplate = SPEAKER_TEMPLATES[voice] || SPEAKER_TEMPLATES.american;
  const requestBody = speakerTemplate(text);
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
  const success = await playAudioResponse(sessionData, res);
  resolve(success);
});

export const fetchBrianSpeech = (sessionData, text) => new Promise(async (resolve) => {
  const res = await fetch(
    'https://api.streamelements.com/kappa/v2/speech?voice=Brian&text='
    + encodeURIComponent(text.trim())
  );
  const success = await playAudioResponse(sessionData, res);
  resolve(success);
});
