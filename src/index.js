import {handleMessageDeleteEvent, handleMessagesDeleteEvent} from './eventHandlers/deleteMessage.js';
import {handleSubscriptionEvent} from './eventHandlers/sub.js';
import {handleTipEvent} from './eventHandlers/tip.js';
import {handleMessageEvent} from './eventHandlers/message.js';
import {resizePage, loadElevenLabsVoices} from './helpers/utils.js';
import {initSessionData} from './helpers/sessionState.js';
import {loadDeleteCounters} from './helpers/deleteCounters.js';
// import {loadImages} from './helpers/loadImages.js';
import {loadTtsRedemptionEventIds} from './eventHandlers/redemption.js';
import {ENABLED_FEATURES} from './helpers/consts.js';

const sessionData = initSessionData();

(async () => {
  const loaders = [];
  if(ENABLED_FEATURES.delete_counter) {
    loaders.push(loadDeleteCounters(sessionData));
  }
  if(ENABLED_FEATURES.tts) {
    loaders.push(loadTtsRedemptionEventIds(sessionData));
    loaders.push(loadElevenLabsVoices(sessionData));
  }

  await Promise.all(loaders);
  
  // TODO ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // await loadCanvasShapes(sessionData);
  
  // loads images for use in applying textures to the hype train carts
  // await loadImages(sessionData);
})();

if(ENABLED_FEATURES.hype_train) {
  window.devicePixelRatio = 2;
  window.addEventListener('load', resizePage);
  window.addEventListener('resize', resizePage);
}

window.addEventListener('onEventReceived', event => {
  switch(event.detail.listener) {
    case('message'):
      handleMessageEvent(event.detail.event, sessionData);
      break;
    case('delete-messages'):
      ENABLED_FEATURES.delete_counter && handleMessagesDeleteEvent(event.detail.event, sessionData);
      break;
    case('delete-message'):
      ENABLED_FEATURES.delete_counter && handleMessageDeleteEvent(event.detail.event, sessionData);
      break;
    case('subscriber-latest'):
      ENABLED_FEATURES.hype_train && handleSubscriptionEvent(event.detail.event, sessionData);
      break;
    case('tip-latest'):
    case('cheer-latest'):
      ENABLED_FEATURES.hype_train && handleTipEvent(event.detail.event, sessionData);
      break;
  }
});
