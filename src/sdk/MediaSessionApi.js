import { appSignals } from '@/signals';
import { effect } from '@preact/signals';
import { SDK } from 'SDK';
import store from 'Store';

import { stream_status } from 'Consts';
import { observeStore } from 'Store/index';
import { playerStateSelects } from 'Store/playerStateSlice';

import Logger from 'Utils/Logger';
const log = new Logger('MediaSession API');

/**
 * Respond to and provide rich media
 */
if ('mediaSession' in navigator) {
	let initialized = false;
	const unsub = effect(() => {
		if (initialized) return;

		if (appSignals.sdk.ready.value) {
			initialized = true;
			unsub();

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
			const handleCuepointChange = ({
				status,
				playing,
				station,
				cuepoint,
			}) => {
				if (!station) return;
				if (!playing) return;

				// If we're playing but status is not LIVE_PLAYING, set metadata to our status
				if (status !== stream_status.LIVE_PLAYING) {
					if (!station.name) return;

					const notPlayingMeta = {
						title: station.name,
					};
					if (station?.tagline) {
						notPlayingMeta.artist = station.tagline;
					}
					if (station?.logo) {
						notPlayingMeta.artwork = [{ src: station.logo }];
					}
					let status_msg;
					switch (status) {
						case stream_status.LIVE_BUFFERING:
							status_msg = 'Buffering…';
							break;
						case stream_status.LIVE_RECONNECTIVE:
						case stream_status.LIVE_CONNECTING:
							status_msg = 'Connecting…';
							break;
						case stream_status.LIVE_PREROLL:
							status_msg = 'Your stream will begin soon!';
							break;
					}
					if (status_msg) {
						notPlayingMeta.artist = status_msg;
					}
					log.debug('Setting metadata to status', notPlayingMeta);
					navigator.mediaSession.metadata = new MediaMetadata(
						notPlayingMeta
					);
					return;
				}

				// If there's no cuepoint or it's an ad, set station data as mediameta
				if (!cuepoint?.title || cuepoint?.type === 'ad') {
					const stationMeta = {
						title: station?.name,
						artist:
							cuepoint?.type === 'ad'
								? "We'll return after these messages"
								: station?.tagline,
					};
					if (
						Object.values(stationMeta).filter((k) =>
							k.trim ? k.trim() : null
						).length
					) {
						log.debug('Setting metadata to station data', {
							cuepoint,
							metadata: stationMeta,
						});
						navigator.mediaSession.metadata = new MediaMetadata(
							stationMeta
						);
					}
					return;
				}

				// If we're in a commercial break, set station data

				const metadata = {
					title: cuepoint?.title || station?.name,
					artist: cuepoint?.artist || station?.tagline,
				};

				// If there's no cuepoint artwork, try to use the station logo
				if (!cuepoint?.artwork && station?.logo) {
					metadata.artwork = [{ src: station.logo }];
				} else if (cuepoint?.artwork) {
					metadata.artwork = [{ src: cuepoint.artwork }];
				}

				if (
					Object.values(metadata).filter((k) =>
						k.trim ? k.trim() : null
					).length
				) {
					log.debug('Setting metadata', metadata);
					navigator.mediaSession.metadata = new MediaMetadata(
						metadata
					);
				}
			};
			const cuePointObserver = new observeStore(
				store,
				handleCuepointChange,
				(state) => {
					const status = playerStateSelects.status(state);
					const playing = playerStateSelects.playing(state);
					const station =
						playerStateSelects['station/current'](state);
					const cuepoint = playerStateSelects['station/cuepoint'](
						state,
						station
					);
					return { status, playing, station, cuepoint };
				}
			);

			window.addEventListener('pagehide', () => {
				cuePointObserver.unsubscribe();
			});
			window.addEventListener('pageshow', () => {
				if (cuePointObserver) cuePointObserver.subscribe();
			});
		}
	});
}
