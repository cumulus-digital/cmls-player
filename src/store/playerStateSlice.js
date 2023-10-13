import { createSlice } from '@reduxjs/toolkit';

import config from 'Config';

import Logger from 'Utils/Logger';

const log = new Logger('Player Store');

let stationTemplate = {
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

export const playerStateSlice = createSlice({
	name: 'playerState',
	initialState: {
		sdk: 'triton',
		ready: false,
		playing: false,
		interactive: false,
		status: 0,
		stations: [],
		station_primary: null,
		station_data: {},
		ad_blocker_detected: false,
		dropdown_open: false,
		fetch_nowplaying: null,
		offline_cuelabel: true,

		minutes_between_preroll: config.minutes_between_preroll,
		last_preroll: null,
	},
	reducers: {
		'set/sdk': (state, action) => {
			state.sdk = action.payload;
		},
		'set/ready': (state, { payload }) => {
			state.ready = !!payload;
		},
		'set/interactive': (state, { payload }) => {
			state.interactive = !!payload;
		},
		'set/ad_blocker_detected': (state, { payload }) => {
			state.ad_blocker_detected = !!payload;
		},
		'set/status': (state, { payload }) => {
			//log.debug('set/status', payload);
			state.status = payload;
		},

		'set/offline_cuelabel': (state, { payload }) => {
			state.offline_cuelabel = !!payload;
		},

		'set/minutes_between_preroll': (state, { payload }) => {
			if (Number.isInteger(payload)) {
				state.minutes_between_preroll = payload;
			} else {
				state.minutes_between_preroll =
					config.minutes_between_preroll || 0;
			}
		},
		'set/last_preroll': (state, { payload }) => {
			if (typeof payload === 'date' || payload instanceof Date) {
				state.last_preroll = payload.now();
			} else if (Number.isInteger(payload)) {
				state.last_preroll = payload;
			} else {
				state.last_preroll = null;
			}
		},

		// Set station data
		'set/station': (state, { payload }) => {
			//log.debug('set/station', payload);
			const station_data = { ...state.station_data };
			for (let mount in payload) {
				if (!station_data[mount]) {
					station_data[mount] = {
						...stationTemplate,
						...payload[mount],
					};
				} else {
					station_data[mount] = {
						...stationTemplate,
						...station_data[mount],
						...payload[mount],
					};
				}
			}
			state.station_data = station_data;
		},
		'set/station/primary': (state, { payload }) => {
			//log.debug('set/station/primary', payload);
			state.station_primary = payload;
		},
		'set/station/cuepoint': (state, { payload }) => {
			for (let mount in payload) {
				if (!state.station_data[mount]) {
					throw new Error(
						'Attempted to set cuepoint for an unregistered mount.'
					);
				}
				state.station_data[mount].cuepoint = {
					...stationTemplate.cuepoint,
					...state.station_data[mount].cuepoint,
					...payload[mount],
				};
			}
		},
		'set/station/cuepoint/artist': (state, { payload }) => {
			//log.debug('set/station/cuepoint/artist', payload);
			for (let mount in payload) {
				if (!state.station_data[mount]) {
					throw new Error(
						'Attempted to set cuepoint artist for an unregistered mount.'
					);
				}
				state.station_data[mount].cuepoint = {
					...stationTemplate.cuepoint,
					...state.station_data[mount].cuepoint,
					artist: payload[mount],
				};
			}
		},
		'set/station/cuepoint/title': (state, { payload }) => {
			//log.debug('set/station/cuepoint/title', payload);
			for (let mount in payload) {
				if (!state.station_data[mount]) {
					throw new Error(
						'Attempted to set cuepoint title for an unregistered mount.'
					);
				}
				state.station_data[mount].cuepoint = {
					...stationTemplate.cuepoint,
					...state.station_data[mount].cuepoint,
					title: payload[mount],
				};
			}
		},
		'set/station/cuepoint/track_id': (state, { payload }) => {
			//log.debug('set/station/cuepoint/track_id', payload);
			for (let mount in payload) {
				if (!state.station_data[mount]) {
					throw new Error(
						'Attempted to set cuepoint track_id for an unregistered mount.'
					);
				}
				state.station_data[mount].cuepoint = {
					...stationTemplate.cuepoint,
					...state.station_data[mount].cuepoint,
					track_id: payload[mount],
				};
			}
		},
		'set/station/cuepoint/type': (state, { payload }) => {
			//log.debug('set/station/cuepoint/type', payload);
			for (let mount in payload) {
				if (!state.station_data[mount]) {
					throw new Error(
						'Attempted to set cuepoint type for an unregistered mount.'
					);
				}
				state.station_data[mount].cuepoint = {
					...stationTemplate.cuepoint,
					...state.station_data[mount].cuepoint,
					type: payload[mount],
				};
			}
		},
		'set/station/cuepoint/artwork': (state, { payload }) => {
			//log.debug('set/station/cuepoint/artwork', payload);
			for (let mount in payload) {
				if (!state.station_data[mount]) {
					throw new Error(
						'Attempted to set cuepoint artwork for an unregistered mount.'
					);
				}
				state.station_data[mount].cuepoint = {
					...stationTemplate.cuepoint,
					...state.station_data[mount].cuepoint,
					artwork: payload[mount],
				};
			}
		},
		'set/station/fetch_nowplaying': (state, { payload }) => {
			//log.debug('set/station/fetch_nowplaying', payload);
			for (let mount in payload) {
				if (!state.station_data[mount]) {
					throw new Error(
						'Attempted to set unresolved_nowplaying_requests for an unregistered mount.'
					);
				}
				state.station_data[mount].fetch_nowplaying = !!payload[mount];
			}
		},
		'set/station/unresolved_nowplaying_requests': (state, { payload }) => {
			//log.debug('set/station/unresolved_nowplaying_requests', payload);
			for (let mount in payload) {
				if (!state.station_data[mount]) {
					throw new Error(
						'Attempted to set unresolved_nowplaying_requests for an unregistered mount.'
					);
				}
				state.station_data[mount].unresolved_nowplaying_requests =
					payload[mount];
			}
		},
		'set/station/unresolved_nowplaying_requests/increment': (
			state,
			{ payload }
		) => {
			if (!state.station_data[payload]) {
				throw new Error(
					'Attempted to decrement unresolved_nowplaying_requests for an unregistered mount.'
				);
			}
			const requests =
				state.station_data[payload].unresolved_nowplaying_requests;
			let newRequestsCount = 1;
			if (requests) {
				newRequestsCount = requests + 1;
			}
			state.station_data[payload].unresolved_nowplaying_requests =
				newRequestsCount;
		},
		'set/station/unresolved_nowplaying_requests/decrement': (
			state,
			{ payload }
		) => {
			if (!state.station_data[payload]) {
				throw new Error(
					'Attempted to decrement unresolved_nowplaying_requests for an unregistered mount.'
				);
			}
			const requests =
				state.station_data[payload].unresolved_nowplaying_requests;
			let newRequestsCount = requests - 1;
			if (requests < 0) {
				newRequestsCount = 0;
			}
			state.station_data[payload].unresolved_nowplaying_requests =
				newRequestsCount;
		},
		'set/station/last_track_cuepoint_received': (state, { payload }) => {
			for (let mount in payload) {
				if (!state.station_data[mount]) {
					throw new Error(
						'Attempted to set last_track_cuepoint_received for an unregistered mount.',
						mount
					);
				}
				state.station_data[mount].last_track_cuepoint_received =
					payload[mount];
			}
		},

		// Handle play calls
		'action/play': (state, { payload }) => {
			//log.debug('action/play', payload);
			if (!payload || !state.station_data[payload]) {
				log.error('Attempted to play an unregistered mount', payload);
				throw new Error('Attempted to play an unregistered mount');
			}
			state.playing = payload;
			for (let mount in state.station_data) {
				state.station_data[mount].playing =
					mount === payload ? true : false;
			}
		},

		// Handle stop calls
		'action/stop': (state, action) => {
			log.debug('action/stop');
			state.playing = false;
			for (let mount in state.station_data) {
				state.station_data[mount].playing = false;
			}
		},

		// Handle dropdown
		'action/dropdown-open': (state, action) => {
			state.dropdown_open = true;
		},
		'action/dropdown-close': (state, action) => {
			state.dropdown_open = false;
		},
		'action/dropdown-toggle': (state, action) => {
			state.dropdown_open = !state.dropdown_open;
		},
	},
});

export const playerStateSelect = (state) => state.playerState;

export const playerStateActions = playerStateSlice.actions;

export default playerStateSlice.reducer;
