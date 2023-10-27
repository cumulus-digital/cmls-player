import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
	createStateSyncMiddleware,
	initMessageListener,
	initStateWithPrevTab,
	withReduxStateSync,
} from 'redux-state-sync';
import isEqual from 'Utils/isEqual';

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

export class observeStore {
	#currentState;
	#store;
	#onChange;
	#select;
	unsubscribe;

	constructor(store, onChange = () => {}, select = (state) => state) {
		this.#store = store;
		this.#onChange = onChange;
		this.#select = select;
		this.unsubscribe = this.#store.subscribe(this.#handleChange.bind(this));
		this.#handleChange();
	}

	#handleChange() {
		let nextState = this.#select(this.#store.getState());
		if (!isEqual(nextState, this.#currentState)) {
			this.#onChange(nextState, this.#currentState);
			this.#currentState = nextState;
		}
	}
}
