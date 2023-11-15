import { appSignals } from '@/signals';
import { effect } from '@preact/signals';
import { SDK } from 'SDK';
import store from 'Store';

import { stream_status } from 'Consts';
import { observeStore } from 'Store/index';
import { playerStateSelects } from 'Store/playerStateSlice';

import { addReloadAction, addUnloadAction } from 'Utils/unloadActionCue';

import Logger from 'Utils/Logger';
const log = new Logger('MediaSession API');

/**
 * Respond to and provide rich media interactions and data
 * Provides now playing and controls on phone lock screens and browser UIs
 */
if ('mediaSession' in navigator) {
	let initialized = false;
	const unsub = effect(() => {
		if (initialized) return;

		if (appSignals.sdk.ready.value) {
			initialized = true;
			unsub();

			/**
			 * Triton SDK doesn't handle pausing well, so we will intercept
			 * that command and do a real stop.
			 */
			const handleStop = () => {
				if (SDK.isPlayingHere()) {
					log.debug('Handling stop');
					SDK.stop();
				}
			};
			navigator.mediaSession.setActionHandler('stop', handleStop);
			navigator.mediaSession.setActionHandler('pause', handleStop);

			const generateArtistLine = (cuepoint) => {};

			/**
			 * Set cue point metadata when playing
			 */
			const handleCuepointChange = ({
				status,
				playing,
				station,
				cuepoint,
				cuelabel,
			}) => {
				if (!station) return;
				if (!playing) return;

				// Default to station data
				const metadata = {
					title:
						station?.name ||
						station?.mount.substring(
							0,
							station?.mount?.length - 3
						) ||
						null,
					artist: cuelabel || station?.tagline || null,
				};

				if (station?.logo) {
					metadata.artwork = [
						{
							src: station.logo,
						},
					];
				}

				/**
				 * If we're playing but status is not LIVE_PLAYING,
				 * set metadata to our status
				 */
				if (status !== stream_status.LIVE_PLAYING) {
					if (!station.name) return;

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
						metadata.artist = status_msg;
					}
				}

				if (cuepoint?.type === 'ad') {
					// If we're in an ad break, set "we'll return" message
					metadata.artist = "We'll return after these messages";
				} else if (cuepoint?.artwork) {
					// If our cuepoint has artwork, set it
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
					const cuelabel = playerStateSelects['station/cuelabel'](
						state,
						station
					);
					return { status, playing, station, cuepoint, cuelabel };
				}
			);

			addUnloadAction(() => {
				cuePointObserver.unsubscribe();
			});
			addReloadAction(() => {
				if (cuePointObserver) cuePointObserver.subscribe();
			});
		}
	});
}
