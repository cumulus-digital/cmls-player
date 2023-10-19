import { appSignals } from '@/signals';
import { effect } from '@preact/signals';
import { SDK } from '.';
import store from 'Store/index';

import Logger from 'Utils/Logger';
import { shallowEqual } from 'react-redux';
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
					artsrc = cuepoint.artwork;
				} else if (station.logo) {
					artsrc = station.logo;
				}

				if (artsrc) {
					metadata.artwork = [
						{
							src: artsrc,
						},
					];
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
