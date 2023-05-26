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