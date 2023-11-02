/**
 * aohua/redux-state-sync
 *
 * ORIGIN APPEARS ABANDONED!
 * I'm including this directly rather than forking for reasons.
 * I wanted to dump a lot of non-peered dependencies, use a more recent
 * version of broadcast-channel with handling of iDB closure, and use our
 * own UUID generator with a more unique-safe fallback.
 *
 * Note: black/whitelist types start with store!
 * playerState/set/whatever
 *
 * Original license as of 2023-11-01:
 * MIT License
 *
 * Copyright (c) 2018 MU AOHUA
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { BroadcastChannel } from 'broadcast-channel';
import generateUuid from 'Utils/generateUuid';
import {
	addReloadAction,
	addUnloadAction,
	removeUnloadAction,
} from 'Utils/unloadActionCue';

let lastUuid = 0;
export const GET_INIT_STATE = '&_GET_INIT_STATE';
export const SEND_INIT_STATE = '&_SEND_INIT_STATE';
export const RECEIVE_INIT_STATE = '&_RECEIVE_INIT_STATE';
export const INIT_MESSAGE_LISTENER = '&_INIT_MESSAGE_LISTENER';

const defaultConfig = {
	channel: 'redux_state_sync',
	predicate: null,
	blacklist: [],
	whitelist: [],
	broadcastChannelOption: undefined,
	prepareState: (state) => state,
	receiveState: (prevState, nextState) => nextState,
};

const getIniteState = () => ({ type: GET_INIT_STATE });
const sendIniteState = () => ({ type: SEND_INIT_STATE });
const receiveIniteState = (state) => ({
	type: RECEIVE_INIT_STATE,
	payload: state,
});
const initListener = () => ({ type: INIT_MESSAGE_LISTENER });

// generate current window unique id
export const WINDOW_STATE_SYNC_ID = generateUuid();
// export for test
export function generateUuidForAction(action) {
	const stampedAction = action;
	stampedAction.$uuid = generateUuid();
	stampedAction.$wuid = WINDOW_STATE_SYNC_ID;
	return stampedAction;
}
// export for test
export function isActionAllowed({ predicate, blacklist, whitelist }) {
	let allowed = () => true;

	if (predicate && typeof predicate === 'function') {
		allowed = predicate;
	} else if (Array.isArray(blacklist)) {
		allowed = (action) => blacklist.indexOf(action.type) < 0;
	} else if (Array.isArray(whitelist)) {
		allowed = (action) => whitelist.indexOf(action.type) >= 0;
	}

	return allowed;
}
// export for test
export function isActionSynced(action) {
	return !!action.$isSync;
}
// export for test
export function MessageListener({ channel, dispatch, allowed }) {
	let isSynced = false;
	const tabs = {};
	this.handleOnMessage = (stampedAction) => {
		// Ignore if this action is triggered by this window
		if (stampedAction.$wuid === WINDOW_STATE_SYNC_ID) {
			return;
		}
		// IE bug https://stackoverflow.com/questions/18265556/why-does-internet-explorer-fire-the-window-storage-event-on-the-window-that-st
		if (stampedAction.type === RECEIVE_INIT_STATE) {
			return;
		}
		// ignore other values that saved to localstorage.
		if (stampedAction.$uuid && stampedAction.$uuid !== lastUuid) {
			if (
				stampedAction.type === GET_INIT_STATE &&
				!tabs[stampedAction.$wuid]
			) {
				tabs[stampedAction.$wuid] = true;
				dispatch(sendIniteState());
			} else if (
				stampedAction.type === SEND_INIT_STATE &&
				!tabs[stampedAction.$wuid]
			) {
				if (!isSynced) {
					isSynced = true;
					dispatch(receiveIniteState(stampedAction.payload));
				}
			} else if (allowed(stampedAction)) {
				lastUuid = stampedAction.$uuid;
				dispatch(
					Object.assign(stampedAction, {
						$isSync: true,
					})
				);
			}
		}
	};
	this.messageChannel = channel;
	this.messageChannel.onmessage = this.handleOnMessage;
}

export const createStateSyncMiddleware = (config = defaultConfig) => {
	const allowed = isActionAllowed(config);
	let channel;
	const createChannel = () => {
		channel = new BroadcastChannel(config.channel, {
			...config.broadcastChannelOption,
			idb: {
				...config.broadcastChannelOption?.idb,
				onclose: () => {
					channel.close();
					channel = createChannel();
					config.broadcastChannelOption?.idb?.onclose();
				},
			},
		});
		// Close channels when no longer needed
		const closeChannel = () => {
			if (channel?.close && !channel.isClosed) {
				channel.close();
			}
		};
		removeUnloadAction(closeChannel.bind(this));
		addUnloadAction(closeChannel.bind(this), Number.MAX_SAFE_INTEGER);

		return channel;
	};

	addReloadAction(() => {
		if (!channel || channel.isClosed) {
			channel = createChannel();
		}
	});

	if (!channel || channel.isClosed) {
		channel = createChannel();
	}

	const prepareState = config.prepareState || defaultConfig.prepareState;
	let messageListener = null;

	return ({ getState, dispatch }) =>
		(next) =>
		(action) => {
			// create message receiver
			if (!messageListener) {
				messageListener = new MessageListener({
					channel,
					dispatch,
					allowed,
				});
			}
			// post messages
			if (action && !action.$uuid) {
				const stampedAction = generateUuidForAction(action);
				lastUuid = stampedAction.$uuid;
				if (channel.isClosed) {
					console.warn('Message sent while channel was closed.');
				} else {
					try {
						if (action.type === SEND_INIT_STATE) {
							if (getState()) {
								stampedAction.payload = prepareState(
									getState()
								);
								channel.postMessage(stampedAction);
							}
							return next(action);
						}
						if (
							allowed(stampedAction) ||
							action.type === GET_INIT_STATE
						) {
							channel.postMessage(stampedAction);
						}
					} catch (e) {
						console.error(
							'Error while sending broadcast message. Your browser may not support cross-tab communication!',
							e
						);
					}
				}
			}
			return next(
				Object.assign(action, {
					$isSync:
						typeof action.$isSync === 'undefined'
							? false
							: action.$isSync,
				})
			);
		};
};

// eslint-disable-next-line max-len
export const createReduxStateSync =
	(appReducer, receiveState = defaultConfig.receiveState) =>
	(state, action) => {
		let initState = state;
		if (action.type === RECEIVE_INIT_STATE) {
			initState = receiveState(state, action.payload);
		}
		return appReducer(initState, action);
	};

// init state with other tab's state
export const withReduxStateSync = createReduxStateSync;

export const initStateWithPrevTab = ({ dispatch }) => {
	dispatch(getIniteState());
};

/*
if don't dispath any action, the store.dispath will not be available for message listener.
therefor need to trigger an empty action to init the messageListener.

however, if already using initStateWithPrevTab, this function will be redundant
*/
export const initMessageListener = ({ dispatch }) => {
	dispatch(initListener());
};
