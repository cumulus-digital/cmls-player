import { appSignals } from '@/signals';
import { effect } from '@preact/signals';
import { SDK } from '.';
import store from 'Store/index';

import Logger from 'Utils/Logger';
import { shallowEqual } from 'react-redux';
import { stream_status } from 'Consts';
const log = new Logger('MediaSession API');

/**
 * Respond to and provide rich media
 */
if ('mediaSession' in navigator) {
	let initialized = false;
	effect(() => {
		if (initialized) return;

		if (appSignals.sdk.ready.value) {
			initialized = true;

			// Don't allow pausing, this is live!
			const handleStop = () => {
				if (SDK.isPlayingHere()) {
					log.debug('Handling stop');
					SDK.stop();
				}
			};
			navigator.mediaSession.setActionHandler('stop', handleStop);
			navigator.mediaSession.setActionHandler('pause', handleStop);

			/**
			 * Set cue point metadata when playing
			 */
			let oldCuepoint;
			store.subscribe(() => {
				const { playerState } = store.getState();

				if (!playerState.playing) {
					return;
				}

				const station = playerState.stations?.[playerState.playing];
				if (!station) {
					return;
				}

				// If we're "playing" but not PLAYING, give a status...
				if (playerState.status !== stream_status.LIVE_PLAYING) {
					const notPlayingMeta = {
						title: station.name,
						artist: station.tagline,
						artwork: [{ src: station.logo }],
					};
					switch (playerState.status) {
						case stream_status.LIVE_BUFFERING:
							notPlayingMeta.artist = 'Buffering…';
							break;
						case stream_status.LIVE_RECONNECTING:
						case stream_status.LIVE_CONNECTING:
							notPlayingMeta.artist = 'Connecting…';
							break;
						case stream_status.LIVE_PREROLL:
							notPlayingMeta.artist =
								'Your stream will begin soon!';
							break;
					}
					navigator.mediaSession.metadata = new MediaMetadata(
						notPlayingMeta
					);
					return;
				}

				const cuepoint = playerState.cuepoints?.[playerState.playing];
				if (!cuepoint?.title) {
					// If there's no cuepoint, set station data as mediameta
					const stationMeta = {
						title: station.name,
						artist: station.tagline,
					};
					if (
						Object.values(stationMeta).filter((k) =>
							k.trim ? k.trim() : null
						).length
					) {
						navigator.mediaSession.metadata = new MediaMetadata(
							stationMeta
						);
					}
					return;
				}

				if (shallowEqual(cuepoint, oldCuepoint)) {
					return;
				}

				const metadata = {
					title: cuepoint.title || station.name,
					artist: cuepoint.artist || station.tagline,
				};

				let artsrc;

				if (cuepoint.type.includes('track') && cuepoint.artwork) {
					if (oldCuepoint?.artist === metadata.artist) {
						metadata.artist += '­';
					}
					metadata.artwork = [{ src: cuepoint.artwork }];
				} else if (station.logo) {
					metadata.artwork = [{ src: station.logo }];
				}

				// Ad tracks use the station tagline for the artist.
				// We will want that to include the station name.
				if (cuepoint.type === 'ad') {
					metadata.title = station.name;
					metadata.artist = "We'll return after these messages";
				}

				if (
					Object.values(metadata).filter((k) =>
						k.trim ? k.trim() : null
					).length
				) {
					log.debug('Setting metadata', metadata);
					oldCuepoint = cuepoint;
					navigator.mediaSession.metadata = new MediaMetadata(
						metadata
					);
				}
			});
		}
	});
}
