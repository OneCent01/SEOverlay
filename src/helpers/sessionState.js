import {ENABLED_FEATURES} from './consts.js';
import {getAvailableVoices} from './utils.js';

export const initHypeTrainData = (startedAt=null) => ({
  events: {},
  users: {},
  images: {},
  startedAt,
  isRunning: false,
  level: 0,
  total: 0,
  goal: 0, 
});

export const initLotteryData = () => ({
  isOpen: false,
  winnersCount: 0,
  users: new Set(),
  winners: [],
});

export const initSessionData = () => {
  const state = {
    users: {},
    events: [],
    hypeTrain: initHypeTrainData(),
    deleteCounters: {},
    shownCounters: new Set(),
    lottery: initLotteryData(),
    audio: {
      isReady: false,
      element: $("#audio"),
      srcElement: $("#audioSource"),
    },
    timer: {
      container: null,
      canvas: null,
      context: null,
    },
    tts: {
      // voicebox is the SpeechUtterance instance
      voicebox: null,
      eventIds: [],
      queue: [],
      isEnabled: true,
      voice: null,
      volume: 0.6,
    }
  };
  if(ENABLED_FEATURES.hype_train) {
    const timerContainer = document.getElementById('timer_container')
    const timerCanvas = document.getElementById('timer');
    state.timer = {
      container: timerContainer,
      canvas: timerCanvas,
      context: timerCanvas?.getContext('2d'),
    }
  }

  return state;
};

export const resetHypeTrainData = (sessionData, startedAt) => {
  sessionData.hypeTrain = initHypeTrainData(startedAt);
};
