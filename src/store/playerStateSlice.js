import { createSelector, createSlice } from '@reduxjs/toolkit';

import store from '.';

import config from 'Config';

//import Logger from 'Utils/Logger';
//const log = new Logger('Player Store');

import { Station } from './Station';
import { CuePoint } from './CuePoint';

import { stream_status } from 'Consts';
import { appSignals } from '@/signals';

const playerStateSlice = createSlice({
	name: 'playerState',
	initialState: {
		//sdk: 'triton',
		//ready: false,
		//ad_blocker_detected: false,
		minutes_between_preroll: config.minutes_between_preroll || 5,
		last_preroll: null,
		fetch_nowplaying: true,

		interactive: true,
		show_cue_label: true,
		//dropdown_open: false,
		//dropdown_position: 0,

		playing: false,
		status: 0,
		stations: [],
		cuepoints: {},
		primary_station: null,
		active_station: null,
	},
	reducers: {
		/*
		'set/sdk': (state, { payload }) => {
			state.sdk = !!payload;
		},
		'set/ready': (state, { payload }) => {
			state.ready = !!payload;
		},
		'set/ad_blocker_detected': (state, { payload }) => {
			state.ad_blocker_detected = !!payload;
		},
		*/
		'set/minutes_between_preroll': (state, { payload }) => {
			state.minutes_between_preroll = payload;
		},
		'set/last_preroll': (state, { payload }) => {
			state.last_preroll = payload;
		},

		'set/interactive': (state, { payload }) => {
			state.interactive = !!payload;
		},

		'set/fetch_nowplaying': (state, { payload }) => {
			state.fetch_nowplaying = !!payload;
		},
		'set/show_cue_label': (state, { payload }) => {
			state.show_cue_label = !!payload;
		},

		/*
		'set/dropdown_open': (state, { payload }) => {
			state.dropdown_open = !!payload;
		},
		'set/dropdown_position': (state, { payload }) => {
			state.dropdown_position = payload;
		},
		*/

		'set/playing': (state, { payload }) => {
			state.playing = payload;
		},
		'set/status': (state, { payload }) => {
			state.status = payload;
		},
		'set/station': (state, { payload }) => {
			const stations = { ...state.stations };
			for (let mount in payload) {
				if (!stations[mount]) {
					stations[mount] = Object.assign(
						{},
						new Station(payload[mount])
					);
				} else {
					stations[mount] = Object.assign(
						stations[mount],
						new Station(payload[mount])
					);
				}
			}
			state.stations = stations;
		},
		'set/station/primary': (state, { payload }) => {
			if (payload in state.stations) {
				state.primary_station = payload;
			}
		},
		'set/station/active': (state, { payload }) => {
			if (payload in state.stations) {
				state.active_station = payload;
			}
		},
		'set/station/cuepoint': (state, { payload }) => {
			for (let mount in payload) {
				if (!state.stations?.[mount]) {
					console.error(
						'Attempted to set cue point for an unregistered mount',
						{ mount, payload }
					);
					return;
				}

				const cuePoint = Object.assign(
					{},
					new CuePoint(payload[mount])
				);
				state.cuepoints[mount] = cuePoint;
				if (cuePoint.type?.includes('track')) {
					state.stations[mount].last_cuepoint = Date.now();
				}
			}
		},
		'set/station/last_cuepoint': (state, { payload }) => {
			for (let mount in payload) {
				if (!state.stations?.[mount]) {
					console.error(
						'Attempted to set last cue point timestamp for an unregistered mount',
						{ mount, payload }
					);
					return;
				}

				state.stations[mount].last_cuepoint = payload;
			}
		},
		'set/station/cuepoint/artwork': (state, { payload }) => {
			for (let mount in payload) {
				if (!state.stations?.[mount]) {
					console.error(
						'Attempted to set cue point artwork for an unregistered mount',
						{ mount, payload }
					);
					return;
				}

				if (state.cuepoints[mount]) {
					state.cuepoints[mount].artwork = payload[mount];
				}
			}
		},
		'set/station/fetch_nowplaying': (state, { payload }) => {
			for (let mount in payload) {
				if (!state.stations?.[mount]) {
					console.error(
						'Attempted to set fetch_nowplaying for an unregistered mount',
						{ mount, payload }
					);
					return;
				}

				state.stations[mount].fetch_nowplaying = payload;
			}
		},
		'set/station/unresolved_nowplaying_requests': (state, { payload }) => {
			for (let mount in payload) {
				if (!state.stations?.[mount]) {
					console.error(
						'Attempted to set unresolved nowplaying request count for an unregistered mount',
						{ mount, payload }
					);
					return;
				}
				state.stations[mount].unresolved_nowplaying_requests =
					payload[mount];
			}
		},
		'action/station/unresolved_nowplaying_requests/increment': (
			state,
			{ payload }
		) => {
			const mount = payload;
			if (!state.stations?.[mount]) {
				console.error(
					'Attempted to increment unresolved nowplaying request count for an unregistered mount',
					{ mount }
				);
				return;
			}
			let count = state.stations[mount].unresolved_nowplaying_requests;
			state.stations[mount].unresolved_nowplaying_requests = count + 1;
		},
		'action/station/unresolved_nowplaying_requests/decrement': (
			state,
			{ payload }
		) => {
			const mount = payload;
			if (!state.stations?.[mount]) {
				console.error(
					'Attempted to decrement unresolved nowplaying request count for an unregistered mount',
					{ mount }
				);
				returnl;
			}
			let count = state.stations[mount].unresolved_nowplaying_requests;
			count = count > 0 ? count - 1 : 0;
			state.stations[mount].unresolved_nowplaying_requests = count;
		},

		'select/station/active': (state) => {
			return (
				state.playing || state.active_station || state.primary_station
			);
		},
	},
});

const selectPlaying = (state) => state.playerState.playing;
const selectActive = (state) => state.playerState.active_station;
const selectPrimary = (state) => state.playerState.primary_station;
const selectStatus = (state) => state.playerState?.status;
//const selectDropdownOpen = (state) => state.playerState?.dropdown_open;
const selectStation = (state, station) => {
	if (station?.mount) {
		return station;
	} else {
		return state.playerState?.stations?.[station];
	}
};
const selectStations = (state) => state.playerState.stations;
const selectCuePoints = (state) => state.playerState.cuepoints;
const selectCuePoint = (state, station) => {
	const stationObj = selectStation(state, station);
	return state.playerState.cuepoints?.[stationObj?.mount];
};

export const selectCurrentStation = createSelector(
	[selectPlaying, selectActive, selectPrimary],
	(playing, active, primary) => playing || active || primary
);

export const playerStateSelect = (state) => state.playerState;

export const playerStateSelects = new (class Selectors {
	/*
	ready = createSelector(
		(state) => state.playerState.ready,
		(ready) => ready
	);
	*/

	playing = createSelector(selectPlaying, (playing) => playing);

	interactive = createSelector(
		(state) => state.playerState.interactive,
		(interactive) => interactive
	);

	show_cue_label = createSelector(
		[selectPlaying, selectActive, selectStations],
		(playing, active, stations) => {
			const current = playing || active;
			return stations?.[current]?.fetch_nowplaying;
		}
	);

	status = selectStatus;

	/*
	dropdown_open = selectDropdownOpen;
	*/

	'station/active' = selectActive;

	'station/primary' = selectPrimary;

	'station/current' = createSelector(
		[selectPlaying, selectActive, selectPrimary],
		(playing, active, primary) => {
			const { playerState } = store.getState();
			return playerState.stations?.[playing || active || primary];
		}
	);

	'stations/count' = createSelector(
		selectStations,
		(stations) => Object.keys(stations).length
	);

	'station/status_labels' = createSelector(
		[
			selectStatus,
			(state, station) => selectStation(state, station),
			(state, station) => this['station/cuelabel'](state, station),
		],
		(status, station, cuelabel) => {
			let newButtonLabel = 'Listen Live!';
			let newCueLabel = station?.fetch_nowplaying ? cuelabel : '';
			switch (status) {
				case stream_status.LIVE_PREROLL:
				case stream_status.LIVE_CONNECTING:
				case stream_status.LIVE_RECONNECTING:
					newButtonLabel = 'Connecting…';
					newCueLabel = 'The stream will begin momentarily…';
					break;
				case stream_status.LIVE_BUFFERING:
					newButtonLabel = 'Buffering…';
					break;
				case stream_status.LIVE_PLAYING:
					newButtonLabel = station?.name || 'Now Playing';
					break;
				case stream_status.LIVE_FAILED:
					newButtonLabel = 'Stream failed!';
					newCueLabel = 'Please try again later';
					break;
				case stream_status.STATION_NOT_FOUND:
					newButtonLabel = 'Station not found!';
					newCueLabel =
						'Player is misconfigured, please contact the station';
					break;
				case stream_status.PLAY_NOT_ALLOWED:
					newButtonLabel = 'Not Allowed';
					newCueLabel =
						'Playback is not allowed at this time, please try again later';
					break;
				case stream_status.STREAM_GEOBLOCKED:
				case stream_status.STREAM_GEO_BLOCKED_ALTERNATE:
				case stream_status.STREAM_GEO_BLOCKED_NO_ALTERNATE:
					newButtonLabel = 'Unavailable!';
					newCueLabel =
						'Sorry, this content is not available in your area.';
					break;
			}
			return { buttonLabel: newButtonLabel, cueLabel: newCueLabel };
		}
	);

	'station/cuepoint' = createSelector(
		(state, station) => selectCuePoint(state, station),
		(cuepoint) => {
			return cuepoint;
		}
	);
	'station/cuelabel' = createSelector(
		(state, station) => this['station/cuepoint'](state, station),
		(cuepoint) => {
			return [cuepoint?.artist, cuepoint?.title]
				.filter((k) => (k?.trim ? k.trim() : null))
				.join(' – ');
		}
	);

	stations = selectStations;
	station = selectStation;
	cuepoints = selectCuePoints;
})();

export const playerStateActions = playerStateSlice.actions;

export const getPlayerState = () => {
	const { playerState } = store.getState();
	return playerState;
};

export default playerStateSlice.reducer;
