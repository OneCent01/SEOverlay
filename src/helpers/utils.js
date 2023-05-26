const canvas = document.getElementById('game_board');
const context = canvas?.getContext('2d');

export const resizePage = () => {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
}

export const clearBoard = (context) => context.clearRect(0, 0, context.canvas.width, context.canvas.height);

export const getDefaultGameState = () => ({
  continue: true,
  progress: 0,
});

const calcPercentVal = (val1, val2, percent) =>
  Math.min(val1, val2) + (Math.abs(val1 - val2) * percent);

export const arrayPartialTransformation = (arr1, arr2, percent) =>
  arr1.map((val, i) => calcPercentVal(val, arr2[i], percent));

export const HSVtoRGB = (h, s, v) => {
    var r, g, b, i, f, p, q, t;
    if (h && !s && !v) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
};

export const getRandomColor = () => {
  const r1 = Math.random();
  const r2 = Math.random();
  const r3 = Math.random();

  const h = r1 * 360;
  const s = 50 + 50 * r2;
  const v = 40 + 40 * r2;

  return HSVtoRGB(h, s / 100, v / 100);
};

export const hexToDecimal = hex => parseInt(hex, 16);

export const rfcToUnix = (rfcDate) => (new Date(rfcDate)).getTime();

export const loadNewAudioSrc = async (sessionData, src) => {
  sessionData.audio.isReady = false;
  sessionData.audio.srcElement.attr("src", src);
  await sessionData.audio.element[0].load();
  sessionData.audio.isReady = true;
};

export const playAudio = async (sessionData) => {
  if(!sessionData.audio.isReady) {
    return;
  }

  try {
    await sessionData.audio.element[0].play();
  } catch(e) {
    return;
  }
};

const updateCounterPositions = (sessionData, counter) => {
  let totalOffsetHeight = 0;
  [...sessionData.shownCounters].forEach((_counter, i) => {
    const offsetTop = 10 + (_counter.clientHeight + 10) * i;
    _counter.style.top = `${offsetTop}px`;
    totalOffsetHeight += (_counter.clientHeight + 10);
  });
  sessionData.timer.container.style.top = `${totalOffsetHeight + 10}px`;
}

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

const initTimerState = (interval, options={}) => ({
  expected: Date.now() + interval,
  ticks: 0,
  timeout: null,
  isRunning: false,
  ...options,
});

export const selfCorrectingTimer = (options) => {
  const {onUpdate, interval=1000} = options;

  let timerState = initTimerState(interval);

  const step = () => {
    var drift = Date.now() - timerState.expected;
    timerState.ticks++;
    
    if(typeof onUpdate === 'function') {
      onUpdate(timerState.ticks);
    }

    timerState.expected += interval;
    timerState.timeout = setTimeout(step, Math.max(0, interval - drift)); // take into account drift
  }

  return {
    pause: () => {
      if(!timerState.isRunning || !timerState.timeout) {
        return;
      }
      clearTimeout(timerState.timeout);
      timerState.timeout = null;
      timerState.isRunning = false;
    },
    resume: () => {
      if(timerState.isRunning) {
        return;
      }
      timerState.timeout = setTimeout(step, interval);
      timerState.isRunning = true;
    },
    start: () => {
      if(timerState.isRunning) {
        return;
      }
      timerState = initTimerState(interval, {
        timeout: setTimeout(step, interval),
        isRunning: true,
      });
    }
  }
};

export const getAvailableVoices = () => 
  window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));

export const updateVoice = (sessionData, voiceName) => {
  const lowerVoice  = voiceName.toLowerCase()
  const voice = getAvailableVoices().find(
    v => v.name.toLowerCase() === lowerVoice
  );

  if(voice) {
    sessionData.tts.voice = voice;
  }
};

const startSpeaking = (sessionData) => {
  try {
    const handleEndEvent = () => {
      sessionData.tts.voicebox.removeEventListener('end', handleEndEvent)
      sessionData.tts.voicebox.removeEventListener('error', handleEndEvent)
      if(sessionData.tts.queue.length) {
        startSpeaking(sessionData);
      } else {
        sessionData.tts.voicebox = null;
      }
    }
    sessionData.tts.voicebox.addEventListener('end', handleEndEvent)
    sessionData.tts.voicebox.addEventListener('error', handleEndEvent)
    const nextMessage = sessionData.tts.queue.shift();
    sessionData.tts.voicebox.text = nextMessage;
    if(sessionData.tts.voice) {
      sessionData.tts.voicebox.voice = sessionData.tts.voice;
    }
    window.speechSynthesis.speak(sessionData.tts.voicebox);
  } catch(e) {}
};

export const speak = (sessionData, text) => {
  sessionData.tts.queue.push(text);

  if(!sessionData.tts.voicebox) {
    sessionData.tts.voicebox = new SpeechSynthesisUtterance();
    sessionData.tts.voicebox.volume = sessionData.tts.volume;
    startSpeaking(sessionData);
  }
};

export const loadAvailableVoicesDisplay = () => {
  const voicesElement = document.getElementById('voices');
  while(voicesElement.firstChild) {
    voicesElement.removeChild(voicesElement.firstChild);
  };
  const voices = getAvailableVoices();
  voices.forEach(availableVoice => {
    const voiceRow = document.createElement('div');
    voiceRow.innerHTML = availableVoice.name;
    voicesElement.appendChild(voiceRow);
  });
};
