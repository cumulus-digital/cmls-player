import { configureStore, combineReducers } from '@reduxjs/toolkit';
import playerStateReducer from './playerStateSlice';
import {
	createStateSyncMiddleware,
	initMessageListener,
	initStateWithPrevTab,
	withReduxStateSync,
} from 'redux-state-sync';

const appReducer = withReduxStateSync(
	combineReducers({
		playerState: playerStateReducer,
	})
);

const store = configureStore({
	reducer: appReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(
			createStateSyncMiddleware({
				blacklist: ['persist/PERSIST'],
				channel: 'cmls_player_channel',
			})
		),
});

initMessageListener(store);
initStateWithPrevTab(store);

export default store;
