import { configureStore, combineReducers } from '@reduxjs/toolkit';
import playerStateReducer from './playerStateSlice';
import {
	createStateSyncMiddleware,
	initMessageListener,
	initStateWithPrevTab,
	withReduxStateSync,
} from 'redux-state-sync';

//import { playerMiddleware } from './playerSdkInjector';

const appReducer = withReduxStateSync(
	combineReducers({
		playerState: playerStateReducer,
	})
);

const store = configureStore({
	reducer: appReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(
			//playerMiddleware,
			createStateSyncMiddleware({
				blacklist: ['persist/PERSIST'],
				channel: 'cmls_player_channel',
			})
		),
});

initMessageListener(store);
initStateWithPrevTab(store);

export default store;
