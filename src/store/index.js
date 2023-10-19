import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
	createStateSyncMiddleware,
	initMessageListener,
	initStateWithPrevTab,
	withReduxStateSync,
} from 'redux-state-sync';

import config from 'Config';

import playerStateReducer from './playerStateSlice';

const appReducer = withReduxStateSync(
	combineReducers({ playerState: playerStateReducer })
);

const store = configureStore({
	reducer: appReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(
			createStateSyncMiddleware({
				channel: `CMLS_PLAYER_REDUX_V${config.STORE_VERSION}`,
			})
		),
});

initMessageListener(store);
initStateWithPrevTab(store);

export default store;
