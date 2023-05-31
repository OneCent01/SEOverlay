import {STREAMER_ID, ACCESS_TOKEN, SPEAKER_TEMPLATES, ELEVEN_LABS_VOICE_NAMES} from './consts.js';
import {APPLICATION_ID, MICROSOFT_TTS_SUBSCRIPTION_KEY, ELEVEN_LABS_API_KEY} from '../keys.js';

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

export const fetchBrianSpeech = (sessionData, text) => new Promise(async (resolve) => {
  const speak = await fetch('https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=' + encodeURIComponent(text.trim()));

  if (speak.status != 200) {
    resolve(false);
    return;
  }

  const mp3 = await speak.blob();
  const audioBlob = URL.createObjectURL(mp3);

  const audio = new Audio(audioBlob);
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

  try {
    audio.play();
  } catch(err) {
    handleEnded(false);
  }
});

export const fetchElevenLabsVoices = async () => {
  const res = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: new Headers({
      accept: 'application/json',
      'xi-api-key': ELEVEN_LABS_API_KEY,
    })
  })
  return res.json()
};

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
        "stability": 0.1,
        "similarity_boost": 0.85,
      }
    }),
  });
  if(!res.blob) {
    resolve(false);
    return;
  }
  const audioBlob = await res?.blob();
  if(!audioBlob) {
    resolve(false);
    return;
  }
  const audio = new Audio(URL.createObjectURL(audioBlob));
  let handleEndedEvent; 
  const handleEnded = (success) => {
    audio.removeEventListener('ended', handleEndedEvent);
    sessionData.tts.skip = null;
    resolve(success);
  }
  handleEndedEvent = () => {
    handleEnded(true);
  }
  audio.addEventListener('ended', handleEndedEvent);
  sessionData.tts.skip = () => {
    audio.pause();
    handleEnded(true);
  };

  try {
    audio.play();
  } catch(err) {
    handleEnded(false);
  }
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

  const reader = res.body?.getReader();
  if(!reader) {
    resolve(false);
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
  let handleEndedEvent; 
  const handleEnded = (success) => {
    audio.removeEventListener('ended', handleEndedEvent);
    sessionData.tts.skip = null;
    resolve(success);
  }
  handleEndedEvent = () => {
    handleEnded(true);
  }
  audio.addEventListener('ended', handleEndedEvent);
  sessionData.tts.skip = () => {
    audio.pause();
    handleEnded(true);
  };

  try {
    audio.play();
  } catch(err) {
    handleEnded(false);
  }
});

export const nativeSpeech = (sessionData, text) => new Promise(async (resolve) => {
  const utterance = new SpeechSynthesisUtterance();
  utterance.volume = 0.6;
  utterance.text = text;

  let handleEndedEvent;
  const handleEnded = (success) => {
    utterance.removeEventListener('end', handleEndedEvent);
    sessionData.tts.skip = null;
    resolve(success);
  };

  handleEndedEvent = () => handleEnded(true);
  utterance.addEventListener('end', handleEndedEvent);

  sessionData.tts.skip = () => {
    if(speechSynthesis?.speaking) {
      speechSynthesis.cancel();
    }

    handleEnded(true);
  }

  try {
    window.speechSynthesis.speak(utterance);
  } catch(err) {
    handleEnded(false);
  }
});

export const fetchSpeech = async (sessionData, text) => {
  let speechText = text.slice();
  const lowerText = text.toLowerCase();

  let targetVoice = sessionData.tts.voice;
  
  if(lowerText.startsWith('brian::')) {
    targetVoice = 'brian';
    speechText = speechText.slice(targetVoice.length + 2);
  } else {
    const textVoice = Object.keys(SPEAKER_TEMPLATES).find(
      voice => lowerText.startsWith(`${voice}::`)
    );

    if(textVoice) {
      targetVoice = textVoice;
      speechText = speechText.slice(targetVoice.length + 2);
    } else {
      const elevenLabsVoice = Object.keys(sessionData.tts.elevenLabsVoices).find(
        voice => lowerText.startsWith(`${voice}::`)
      );

      if(elevenLabsVoice) {
        targetVoice = elevenLabsVoice;
        speechText = speechText.slice(targetVoice.length + 2);
      }
    }
  }

  const speechFallbackOrder = [];

  if(ELEVEN_LABS_VOICE_NAMES.has(targetVoice)) {
    speechFallbackOrder.push(fetchElevenLabsSpeech);
    speechFallbackOrder.push(fetchBrianSpeech);
    speechFallbackOrder.push(fetchMicrosoftSpeech);
    speechFallbackOrder.push(nativeSpeech);
  } else if(targetVoice === 'brian') {
    speechFallbackOrder.push(fetchBrianSpeech);
    speechFallbackOrder.push(fetchMicrosoftSpeech);
    speechFallbackOrder.push(nativeSpeech);
    speechFallbackOrder.push(fetchElevenLabsSpeech);
  } else {
    speechFallbackOrder.push(fetchMicrosoftSpeech);
    speechFallbackOrder.push(fetchBrianSpeech);
    speechFallbackOrder.push(nativeSpeech);
    speechFallbackOrder.push(fetchElevenLabsSpeech);
  }


  let ttsComplete = false,
    index = 0;

  while(!ttsComplete) {
    const speechFn = speechFallbackOrder[index];
    if(speechFn) {
      ttsComplete = await speechFn(sessionData, speechText, targetVoice)
    } else {
      ttsComplete = true;
    }
    index++;
  }
};

