import { BroadcastChannel, createLeaderElection } from 'broadcast-channel';
import config from 'Config';

import {
	addReloadAction,
	addUnloadAction,
	removeUnloadAction,
} from 'Utils/unloadActionCue';

import Logger from 'Utils/Logger';
const log = new Logger('LeaderElection');

let channel;
export const createChannel = () => {
	channel = new BroadcastChannel(`CMLS_PLAYER_V${config.STORE_VERSION}`, {
		webWorkerSupport: false,
		idb: {
			onclose: () => {
				channel.close();
				channel = createChannel();
			},
		},
	});
	const closeChannel = () => {
		if (channel?.close) {
			channel.close();
		}
	};
	removeUnloadAction(closeChannel);
	addUnloadAction(closeChannel, Number.MAX_SAFE_INTEGER);
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
const elector = createLeaderElection(channel);

/**
 * Check if the current window is the leader
 * @returns {Promise}
 */
export const isLeader = () => {
	return new Promise((resolve, reject) => {
		elector.hasLeader().then((hasLeader) => {
			if (!hasLeader) {
				log.debug('No current leader');
				elector.awaitLeadership().then(() => {
					isLeader().then((areWeLeader) => resolve(areWeLeader));
				});
			} else {
				resolve(elector.isLeader);
			}
		});
	});
};

export const becomeLeader = () => {
	log.debug('Becoming leader');
	return elector.awaitLeadership();
};

elector.hasLeader().then((hasLeader) => {
	log.debug({
		'Loader exists?': hasLeader,
		'Is it this window?': elector.isLeader,
	});
	if (!hasLeader) {
		becomeLeader();
	}
});
