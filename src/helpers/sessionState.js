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

export const initLotteryData = () => {
  const lotteryState = {
    isOpen: false,
    winnersCount: 0,
    users: new Set(),
    winners: [],
    timer: {
      container: null,
      canvas: null,
    },
    skip: null,
  };
  if(ENABLED_FEATURES.chat_lottery) {
    const timerContainer = document.getElementById('timer_container')
    const timerCanvas = document.getElementById('timer');
    lotteryState.timer = {
      container: timerContainer,
      canvas: timerCanvas,
    }
  }

  return lotteryState;
};

const initTtsData = () => {
  const ttsState = {
    eventIds: [],
    elevenLabsVoices: {},
    msgIdToTextMap: {},
    userMsgIds: {},
    currentMsgId: null,
    queue: [],
    isEnabled: true,
    isSpeaking: false,
    skip: null,
    shouldSkipNext: false,
    delay: 3,
    volume: 1,
    voice: 'brian',
    timer: {
      container: null,
      canvas: null,
    }
  };

  if(ENABLED_FEATURES.tts) {
    const ttsTimerContainer = document.getElementById('tts_timer_container');
    const ttsTimerCanvas = document.getElementById('tts_timer');

    ttsState.timer = {
      container: ttsTimerContainer,
      canvas: ttsTimerCanvas,
    }
  }

  return ttsState;
};

export const initSessionData = () => {
  const state = {
    users: {},
    events: [],
    hypeTrain: initHypeTrainData(),
    deleteCounters: {},
    shownCounters: new Set(),
    lottery: initLotteryData(),
    tts: initTtsData(),
  };

  return state;
};

export const resetHypeTrainData = (sessionData, startedAt) => {
  sessionData.hypeTrain = initHypeTrainData(startedAt);
};
