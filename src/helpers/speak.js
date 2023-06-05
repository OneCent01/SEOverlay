import {
	fetchElevenLabsVoices,
	fetchBrianSpeech,
	fetchElevenLabsSpeech,
	fetchMicrosoftSpeech,
} from './fetch.js';
import {SPEAKER_TEMPLATES, ELEVEN_LABS_VOICE_NAMES} from './consts.js';
import {runTimer} from './timer.js';
import {pick} from 'lodash';

export const sanitizeSpeechText = text => {
	let finalString = '';

	// first split each letter up to get rid of excessive puntuation and repeated characters
	text.split('').forEach(letter => {
		if(!finalString.length) {
			// Only add if it's a letter and not a punctionation mark of whitespace
			if(!(/(\p{P}|\s)/u.test(letter))) {
				finalString += letter;
			}
		} else {
			const lastCharacter = finalString[finalString.length - 1];
			const secondToLastCharacter = finalString[finalString.length - 2];
			const thirdToLastCharacter = finalString[finalString.length - 3];
			if(/\p{P}/u.test(lastCharacter)) {
				// if the last character was punctionation, don't allow more punctuation. 
				if(!(/\p{P}/u.test(letter))) {
					// if it's not punctuation, check if it's a space. 
					// If it's not, add a space.
					if(!(/(\s)/u.test(secondToLastCharacter))) {
						finalString += ' ';
					}
					finalString += letter;
				}
			} else if (/\s/.test(lastCharacter)) {
				// if the last letter was a space and the current character is puncation
				if((/\p{P}/u.test(letter))) {
					// check to see if the chatacter before the space is a letter.
					if(!(/(\p{P}|\s)/u.test(secondToLastCharacter))) {
						// if it was, replace the space with the punctionation.
					}
					// otherwise, ignore it. 
				} else if(!(/\s/.test(letter))) {
					// otherwise, check if it's a not whitespace character.
					// this means it's a letter. Allow it!
					finalString += letter;
				}
			} else {
				finalString += letter;
			}
		}
	});

	return finalString.trim();
};

export const nativeSpeech = (sessionData, text) => new Promise(async (resolve) => {
	if(sessionData.tts.shouldSkipNext) {
		resolve(true);
		return;
	}
	const utterance = new SpeechSynthesisUtterance();
	utterance.volume = sessionData.tts.volume;
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
	speechText = sanitizeSpeechText(speechText);
	
	if(!speechText) {
		return;
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

export const loadElevenLabsVoices = async (sessionData) => {
	const res = await fetchElevenLabsVoices();
	res?.voices.forEach(voice => {
		const lowerVoice = voice.name.toLowerCase();
		if(ELEVEN_LABS_VOICE_NAMES.has(lowerVoice)) {
		  sessionData.tts.elevenLabsVoices[lowerVoice] = voice.voice_id;
		}
	});
};

const fetchNextSpeech = async (sessionData) => {
	sessionData.tts.timer.container.style.opacity = '0';
	const nextText = sessionData.tts.msgIdToTextMap[sessionData.tts.currentMsgId];
	if(!nextText) {
		return;
	}
	await fetchSpeech(sessionData, nextText);
	return;
}

const speakNext = (sessionData) => new Promise(async (resolve) => {
	sessionData.tts.shouldSkipNext = false;
	sessionData.tts.timer.container.style.opacity = '1';
	const msgId = sessionData.tts.queue.shift();
	sessionData.tts.currentMsgId = msgId;
	if(!sessionData.tts.msgIdToTextMap[msgId]) {
		resolve();
		return;
	};

	if(
		typeof sessionData.tts.delay !== 'number' && 
		sessionData.tts.delay <= 0
	) {
		await fetchNextSpeech(sessionData);
		resolve();
		return;
	}

	const {pause, resume, end} = runTimer(sessionData, {
		onComplete: async () => {
			if(sessionData.tts.shouldSkipNext) {
				sessionData.tts.timer.container.style.opacity = '0';
				resolve();
				return;
			}
			await fetchNextSpeech(sessionData);
			resolve();
		},
		canvas: sessionData.tts.timer.canvas,
		seconds: sessionData.tts.delay,
	});

	sessionData.tts.skip = () => {
		sessionData.tts.shouldSkipNext = true;
		sessionData.tts.msgIdToTextMap = pick(
			sessionData.tts.msgIdToTextMap, 
			sessionData.tts.queue,
		);
		sessionData.tts.timer.container.style.opacity = '0';
		end();
		resolve();
	}
});

export const speak = async (sessionData, text, msgId, userId) => {
	const user = sessionData.users[userId]
	sessionData.tts.queue.push(msgId);

	sessionData.tts.msgIdToTextMap[msgId] = text;

	if(!sessionData.tts.userMsgIds[userId]) {
		sessionData.tts.userMsgIds[userId] = [];
	}
	sessionData.tts.userMsgIds[userId].push(msgId);

	if(!sessionData.tts.isSpeaking) {
		sessionData.tts.isSpeaking = true;
		
		while(sessionData.tts.queue.length) {
			await speakNext(sessionData);
		};

		sessionData.tts.isSpeaking = false;
	}
};