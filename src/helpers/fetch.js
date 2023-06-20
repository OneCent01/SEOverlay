import {
  STREAMER_ID, 
  ACCESS_TOKEN, 
  MICROSOFT_SPEAKER_TEMPLATES, 
  UBERDUCK_VOICES,
  PROXY_URL,
} from './consts.js';
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
  const audio = new Audio(audioDataUrl);
  if(!audio) {
    resolve(false);
    return;
  }
  const audioCtx = new AudioContext();
  const src = audioCtx.createMediaElementSource(audio);
  const gainNode = audioCtx.createGain();
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

  const decodedBuffer = decodedData.getChannelData(0);
  const sliceLen = Math.floor(decodedData.sampleRate * 0.005);
  const averages = [];
  let sum = 0.0;
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

  const gain = (sessionData.tts.volume / 5) / higestGain;
  // ensure gain isn't cranked aboved 3 and isnt' reduced below 0.20
  gainNode.gain.value = Math.max(Math.min(gain, 3), 0.2);

  return audio;
};

const playAudioResponse = (sessionData, res) => new Promise(async (resolve) => {
  if(sessionData.tts.shouldSkipNext) {
    resolve({success: true, duration: 0});
    return;
  }
  try {
    const audio = await normalizedAudio(sessionData, res);

    audio.volume = sessionData.tts.volume;
    let handleEndedEvent; 
    const handleEnded = (success) => {
      audio.removeEventListener('ended', handleEndedEvent);
      sessionData.tts.skip = null;
      resolve({success, duration: audio.duration});
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
    resolve({success: false, duration: 0});
  }
});

export const fetchUberduckSpeech = (sessionData, text, voice, availableCredit) => new Promise(async (resolve) => {
  if(!availableCredit || availableCredit <= 0) {
    resolve(false);
    return;
  }
  const options = {
    method: 'POST',
    headers: new Headers({
      accept: 'application/json',
      'uberduck-id': 'anonymous',
      'content-type': 'application/json',
      Authorization: `Basic cHViX2F6YWd3Y251ZndqaGF6amt2ejpwa184ZjZkYTk2Ni01OTQ2LTQ2OWYtOTQ1NC02MDE5OThiNGZmOTA=`,
      "X-Requested-With": "XMLHttpRequest",
    }),
    body: JSON.stringify({voice: UBERDUCK_VOICES[voice] || UBERDUCK_VOICES.betty, pace: 1, speech: text})
  };

  const res = await fetch(
    `${PROXY_URL}/https://api.uberduck.ai/speak-synchronous`,
    options,
  );

  const {success, duration} = await playAudioResponse(sessionData, res);
  
  // Uberduck: $1 / 360 secs audio generated 
  // ---------> cost per second: ~0.0028 / second
  let estimatedCost = Math.ceil(duration) * 0.0027;
  setAvailableCredits(availableCredit - estimatedCost);

  resolve(success);
});

export const fetchElevenLabsSpeech = (sessionData, text, voice, availableCredit) => new Promise(async (resolve) => {
  if(!availableCredit || availableCredit <= 0) {
    resolve(false);
    return;
  }
  const voiceId = sessionData.tts.elevenLabsVoices[voice.toLowerCase()] || sessionData.tts.elevenLabsVoices.biden;
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

  const {success} = await playAudioResponse(sessionData, res);
  
  // Elevenlabs: $3 / 10k chars
  // ------> cost per char: 0.0003
  let estimatedCost = text.length * 0.0003;
  setAvailableCredits(availableCredit - estimatedCost);

  resolve(success);
});

export const fetchMicrosoftSpeech = (sessionData, text, voice, availableCredit) => new Promise(async (resolve) => {
  if(!availableCredit || availableCredit <= 0) {
    resolve(false);
    return;
  }
  const speakerTemplate = MICROSOFT_SPEAKER_TEMPLATES[voice] || MICROSOFT_SPEAKER_TEMPLATES.charles;
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
  const {success} = await playAudioResponse(sessionData, res);
  
  // Microsoft: $1.50 / 10k chars
  // ------> cost per char: 0.00015
  let estimatedCost = text.length * 0.00015;
  setAvailableCredits(availableCredit - estimatedCost);
  
  resolve(success);
});

export const fetchBrianSpeech = (sessionData, text, voice, availableCredit) => new Promise(async (resolve) => {
  const res = await fetch(
    'https://api.streamelements.com/kappa/v2/speech?voice=Brian&text='
    + encodeURIComponent(text.trim())
  );
  const {success} = await playAudioResponse(sessionData, res);
  resolve(success);
});

export const fetchAvailableCredits = async () => {
  const getCreditsUrl = `https://get-fated-tts-credits.pennney.workers.dev?id=${STREAMER_ID}`;
  const res = await fetch(
    `${PROXY_URL}/${getCreditsUrl}`
  );

  const resText = await res?.text();
  let availableCredit = Number(resText);

  if(typeof availableCredit !== 'number' || isNaN(availableCredit)) {
    availableCredit = 0;
  }
  return availableCredit;
};

export const setAvailableCredits = async (value) => {
  if(typeof value !== 'number' || isNaN(value)) {
    return;
  }
  const setCreditsUrl = `https://set-fated-tts-credits.pennney.workers.dev?id=${STREAMER_ID}&value=${Math.max(value, 0).toFixed(4)}`;
  const res = await fetch(
    `${PROXY_URL}/${setCreditsUrl}`
  );

  return true;
};

// cors settings shit...
// (function() {
//     var cors_api_host = PROXY_URL.slice(8);
//     var cors_api_url = PROXY_URL;
//     var slice = [].slice;
//     var origin = window.location.protocol + '//' + window.location.host;
//     var open = XMLHttpRequest.prototype.open;
//     XMLHttpRequest.prototype.open = function() {
//         var args = slice.call(arguments);
//         var targetOrigin = /^https?:\/\/([^\/]+)/i.exec(args[1]);
//         if (targetOrigin && targetOrigin[0].toLowerCase() !== origin &&
//             targetOrigin[1] !== cors_api_host) {
//             args[1] = cors_api_url + args[1];
//         }
//         return open.apply(this, args);
//     };
// })();
