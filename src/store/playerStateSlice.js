import { createSlice } from '@reduxjs/toolkit';

export const playerStateSlice = createSlice({
	name: 'playerState',
	initialState: {
		ready: false,
		playing: false,
		status: 0,
		current_station: null,
		stations: [],
		station_data: {},
		ad_blocker_detected: false,
		dropdown_open: false,
		fetch_nowplaying: null,
	},
	reducers: {
		'set/state': (state, action) => {
			Object.assign(state, { ...state }, action.payload);
		},
		'set/ready': (state, action) => {
			state.ready = action.payload ? true : false;
		},
		'set/ad_blocker_detected': (state, action) => {
			state.ad_blocker_detected = action.payload;
		},
		'set/dropdown_open': (state, action) => {
			state.dropdown_open = action.payload;
		},
		'set/station': (state, action) => {
			state.current_station = action.payload;
		},
		'set/status': (state, action) => {
			state.status = action.payload;
		},
		'set/station/data': (state, action) => {
			const station_data = { ...state.station_data };
			for (let k in action.payload) {
				if (!station_data[k]) {
					station_data[k] = action.payload[k];
				} else {
					Object.assign(station_data[k], action.payload[k]);
				}
			}
			state.station_data = station_data;
		},
		'set/station/cuepoint': (state, action) => {
			if (!action.payload.station && !state.current_station) {
				throw new Error('Attempted to set cuepoint without a station.');
			}
			const station = action.payload.station || state.current_station;
			delete action.payload.station;
			state.station_data[station].cuepoint = {
				...state.station_data[station].cuepoint,
				...action.payload,
			};
		},
		'set/station/cuepoint/artist': (state, action) => {
			if (!action.payload.station && !state.current_station) {
				throw new Error(
					'Attempted to set artist cuepoint without a station.'
				);
			}
			const station = action.payload.station || state.current_station;
			delete action.payload.station;
			state.station_data[station].cuepoint = {
				...state.station_data[station].cuepoint,
				artist: action.payload.artist,
			};
		},
		'set/station/cuepoint/title': (state, action) => {
			if (!action.payload.station && !state.current_station) {
				throw new Error(
					'Attempted to set title cuepoint without a station.'
				);
			}
			const station = action.payload.station || state.current_station;
			delete action.payload.station;
			state.station_data[station].cuepoint = {
				...state.station_data[station].cuepoint,
				title: action.payload.title,
			};
		},
		'set/station/playlist': (state, action) => {
			if (!action.payload.station) {
				throw new Error('Attempted to set playlist without a station.');
			}
			const station = action.payload.station;
			state.station_data[station].playlist = action.payload.list || [];
		},
		'action/fetch/playlists': (state, action) => {
			state.fetch_nowplaying = action.payload || null;
		},
		'action/play': (state, action) => {
			if (action.payload && state.station_data[action.payload]) {
				state.current_station = action.payload;
			}
			if (state.current_station) {
				state.playing = true;
			} else {
				throw new Error('Attempted play without a current station.');
			}
		},
		'action/stop': (state, action) => {
			state.playing = false;
		},
		'action/toggle': (state, action) => {
			state.playing = !state.playing;
		},
		setPlayerState: (state, action) => {
			Object.assign(state, { ...state }, action.payload);
		},
		setPlayerReady: (state, action) => {
			state.ready = action.payload;
		},
		setCurrentStation: (state, action) => {
			state.currentStation = action.payload;
		},
		setStatus: (state, action) => {
			state.status = action.payload;
		},
		setStationData: (state, action) => {
			const stationData = { ...state.station_data };
			for (let k in action.payload) {
				if (!stationData[k]) {
					stationData[k] = action.payload[k];
				} else {
					Object.assign(stationData[k], action.payload[k]);
				}
			}
			state.stationData = stationData;
		},
		setCuePointArtistName: (state, action) => {
			state.cuePointArtistName = action.payload;
		},
		setCuePointTitle: (state, action) => {
			state.cuePointTitle = action.payload;
		},
		playStation: (state, action) => {
			state.current_station = action.payload;
			state.playing = action.payload;
		},
		play: (state, action) => {
			if (action.payload) {
				state.current_station = action.payload;
			}
			state.playing = true;
		},
		stop: (state) => {
			state.playing = false;
		},
		togglePlaying: (state, action) => {
			state.playing = !state.playing;
		},
	},
});

export const selectPlayerState = (state) => state.playerState;

export const playerStateSelects = {
	state: (state) => state.playerState,
	ready: (state) => state.playerState.ready,
	status: (state) => state.playerState.status,
	playing: (state) => state.playerState.playing,
	currentStation: (state) => state.playerState.currentStation,
	stations: (state) => state.playerState.stations,
	stationData: (state) => state.playerState.stationData,
};

/*
export const {
	setPlayerState,
	setPlayerReady,
	setCurrentStation,
	setStatus,
	setStationData,
	playStation,
	play,
	stop,
	togglePlaying,
} = playerStateSlice.actions;

export const playerStateActions = {
	setState: setPlayerState,
	setReady: setPlayerReady,
	setCurrentStation,
	setStatus,
	setStationData,
	playStation,
	play,
	stop,
	togglePlaying,
};
*/
export const playerStateActions = playerStateSlice.actions;

export default playerStateSlice.reducer;
