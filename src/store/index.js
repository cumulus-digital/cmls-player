import { Store, combineReducers, configureStore } from '@reduxjs/toolkit';
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
				channel: `CMLS_PLAYER_V${config.STORE_VERSION}`,
				broadcastChannelOption: {
					webWorkerSupport: false,
				},
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

	/**
	 * Unsubscribe the current observer
	 */
	unsubscribe;

	/**
	 *
	 * @param {Store} store
	 * @param {function} onChange
	 * @param {function} select
	 */
	constructor(store, onChange = () => {}, select = (state) => state) {
		this.#store = store;
		this.#onChange = onChange;
		this.#select = select;
		this.subscribe();
		this.#handleChange();
	}

	subscribe() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
		this.unsubscribe = this.#store.subscribe(this.#handleChange.bind(this));
	}

	#handleChange() {
		let nextState = this.#select(this.#store.getState());
		if (!isEqual(nextState, this.#currentState)) {
			this.#onChange(nextState, this.#currentState);
			this.#currentState = nextState;
		}
	}
}
