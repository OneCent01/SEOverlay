import {
	LOCKCHAIN_ACCESS_TOKEN,
	KDAWG_ACCESS_TOKEN,
} from '../keys.js';

export const JENNA_USER_ID = '254125538';
export const KDAWG_USER_ID = '221785400';
export const LOCKCHAIN_USER_ID = '733084443';
export const FATED_USER_ID = '184426448';
export const MAV_USER_ID = '170166760';
export const FATE_BOT_USER_ID = '904052148';
export const NIGHTBOT_USER_ID = '19264788';
export const KSOF_GAMER_YT_USER_ID = '768972758';
export const KADRIUM_USER_ID = '684479679';
export const BELLA_NOT_FOUND_USER_ID = '909721585';

export const LOTTERY_BLACKLIST = new Set([
	KSOF_GAMER_YT_USER_ID, 
	KADRIUM_USER_ID, 
	BELLA_NOT_FOUND_USER_ID
]);

export const ONE_SECOND = 1000;
export const ONE_MINUTE = 60 * ONE_SECOND;
export const FIVE_MINUTES = 5 * ONE_MINUTE;

export const DAMASCUS_TEXTURE_LINK = 'https://docs.google.com/uc?export=open&id=1iuGXpWlsagq6P7W6G8HZcZQ5idFUUrsZ';
export const IMAGE_LINKS = [DAMASCUS_TEXTURE_LINK];

export const JOIN_COMMANDS = ['!join', '!play'];

export const STREAMERS = {
	KDAWG: {
		id: KDAWG_USER_ID,
		token: KDAWG_ACCESS_TOKEN,
		features: {
			tts: true,
			hype_train: true,
			delete_counter: true,
			chat_lottery: true,
		},
		admins: [
			KDAWG_USER_ID, 
			FATED_USER_ID, 
			NIGHTBOT_USER_ID, 
			JENNA_USER_ID,
		],
	},
	LOCKCHAIN: {
		id: LOCKCHAIN_USER_ID,
		token: LOCKCHAIN_ACCESS_TOKEN,
		features: {tts: true},
		admins: [LOCKCHAIN_USER_ID, FATED_USER_ID, NIGHTBOT_USER_ID],
	}
};

export const STREAMER = 'KDAWG';

export const ACCESS_TOKEN = STREAMERS[STREAMER].token;
export const ENABLED_FEATURES = STREAMERS[STREAMER].features;
export const STREAMER_ID = STREAMERS[STREAMER].id;
export const ADMIN_USERS = STREAMERS[STREAMER].admins;

const SHOUT_TEMPLATE = text => `
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="en-US-DavisNeural"><s /><mstts:express-as style="shouting">${text}</mstts:express-as><s /></voice></speak>
`;
const ANGRY_TEMPLATE = text => `
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="en-US-DavisNeural"><s /><mstts:express-as style="angry">${text}</mstts:express-as><s /></voice></speak>
`;
const BRITISH_TEMPLATE = text => `
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="en-GB-RyanNeural"><mstts:express-as style="chat">${text}</mstts:express-as><s /> </voice></speak>
`;
const SWEDISH_TEMPLATE = text => `
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="sv-SE-MattiasNeural"><s />${text}</voice></speak>
`;
const FRENCH_TEMPLATE = text => `
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="fr-CA-JeanNeural"><s />${text}</voice></speak>
`;
const AMERICAN_TEMPLATE = text => `
<speak version='1.0' xml:lang='en-US'><voice xml:lang='en-US' xml:gender='Male'
  name='en-US-ChristopherNeural'>
    ${text}
</voice></speak>
`;
const IRISH_TEMPLATE = text => `
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="ga-IE-ColmNeural">${text}</voice></speak>
`;
const NORWEGIAN_TEMPLATE = text => `
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="nb-NO-FinnNeural">${text}</voice></speak>
`;
const LITTLE_GIRL_TEMPLATE = text => `
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="en-US-AnaNeural">${text}</voice></speak>
`;
const MALE_ASMR_TEMPLATE = text => `
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="en-US-JasonNeural"><s /><mstts:express-as style="whispering">${text}</mstts:express-as><s /></voice></speak>
`;

export const SPEAKER_TEMPLATES = {
	british: BRITISH_TEMPLATE,
	charles: BRITISH_TEMPLATE,

	american: AMERICAN_TEMPLATE,
	paul: AMERICAN_TEMPLATE,

	swedish: SWEDISH_TEMPLATE,
	felix: SWEDISH_TEMPLATE,

	french: FRENCH_TEMPLATE,
	pierre: FRENCH_TEMPLATE,

	irish: IRISH_TEMPLATE,
	murphy: IRISH_TEMPLATE,

	norwegian: NORWEGIAN_TEMPLATE,
	finn: NORWEGIAN_TEMPLATE,

	shout: SHOUT_TEMPLATE,
	tim: SHOUT_TEMPLATE,

	mad: ANGRY_TEMPLATE,
	andy: ANGRY_TEMPLATE,

	annie: LITTLE_GIRL_TEMPLATE,

	asmr: MALE_ASMR_TEMPLATE,
	ari: MALE_ASMR_TEMPLATE,
};
