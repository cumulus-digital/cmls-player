import { BroadcastChannel } from 'broadcast-channel';
import { deepSignal, peek } from 'deepsignal';
import { isEqual } from 'lodash/isEqual';

import config from 'Config';
import { effect } from '@preact/signals';

export const sdkState = deepSignal({
	sdk: 'triton',
	ready: false,
	minutes_between_preroll: 30,
});

export const buttonState = deepSignal({
	show_cue_label: true,
	height: '0px',
});

export const playerState = deepSignal({
	playing: false,
	interactive: false,
	status: 0,
	ad_blocker_detected: false,
	dropdown_open: false,
	fetch_nowplaying: null,
	display_offline_cuelabel: true,

	stations: {},
	primary_station: null,
	active_station: null,
});

/*
const channel = new BroadcastChannel(
	`CMLS_PLAYER_CHANNEL_V${config.STORE_VERSION}`
);
channel.addEventListener('message', (msg) => {
	const parsed = JSON.parse(msg);
	if (!isEqual(playerState, parsed)) {
		console.log('got channel message', msg);
		Object.assign(playerState, {}, parsed);
	}
});
*/

const stateKey = `CMLS_PLAYER_V${config.STORE_VERSION}`;
function jsonStoredState() {
	let storedState = {};
	try {
		storedState = JSON.parse(sessionStorage.getItem(stateKey));
	} catch (e) {}
	return storedState;
}
function loadFromStorage() {
	let storedState = jsonStoredState();
	if (storedState && !isEqual(playerState, storedState)) {
		Object.assign(playerState, storedState);
	}
}

window.addEventListener('storage', (e) => {
	console.log('storage event', e);
	loadFromStorage();
});
loadFromStorage();

const onStateChange = () => {
	//const stateJson = JSON.stringify(Object.assign({}, playerState));
	let storedState = jsonStoredState();
	if (!isEqual(playerState, storedState)) {
		sessionStorage.setItem(stateKey, JSON.stringify(playerState));
	}
	console.log('signal change', {
		sdkState: Object.assign({}, sdkState),
		playerState: Object.assign({}, playerState),
		buttonState: Object.assign({}, buttonState),
	});
	//channel.postMessage(JSON.stringify(playerState));
};

effect(onStateChange);

/*
export const playerState = deepSignal({
	sdk: 'triton',
	ready: false,
	playing: false,
	interactive: false,
	status: 0,
	ad_blocker_detected: false,
	dropdown_open: false,
	fetch_nowplaying: null,
	display_offline_cuelabel: true,
});

const stationTemplate = {
	mount: '',
	name: '',
	tagline: '',
	logo: '',
	vast: '',
	primary: false,
	fetch_nowplaying: true,
	unresolved_nowplaying_requests: 0,
	last_track_cuepoint_received: null,
	cuepoint: {
		artist: '',
		title: '',
		track_id: '',
		artwork: '',
		type: '',
	},
};
export const stationsState = deepSignal({});
*/
