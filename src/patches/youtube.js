import { h } from 'Utils/createElement';
import { SDK } from 'SDK/index';
import Logger from 'Utils/Logger';
import waitForVariable from 'Utils/waitForVariable';
import generateUuid from 'Utils/generateUuid';

/**
 * Attach an event listener to YouTube embeds to stop the CMLS player
 * when a YT video begins to play.
 */
const ytEmbedDomains = ['youtube.com', 'youtu.be', 'youtube-nocookie.com'];

let ytSdkLoaded = false;

const onYtSdkLoad = () => {
	ytSdkLoaded = true;
};

/**
 * Don't overwrite other onYouTubeIframeAPIReady events, extend them
 */
if (window.onYouTubeIframeAPIReady) {
	window._onYouTubeIframeAPIReady = window.onYouTubeIframeAPIReady;
}
window.onYouTubeIframeAPIReady = () => {
	if (window._onYouTubeIframeAPIReady) {
		window._onYouTubeIframeAPIReady();
	}
	onYtSdkLoad();
};

const log = new Logger('Patches / YouTube');

function getYtIframes() {
	return document.querySelectorAll(
		ytEmbedDomains
			.map((d) => `iframe[src*="${d}"]:not([cmls-patched])`)
			.join(',')
	);
}

/**
 * Handle pausing videos if stream starts
 */
const ytps = [];
function onStreamStart(e) {
	ytps.forEach((ytp) => {
		log.debug('Pausing video', ytp);
		ytp?.pauseVideo();
	});
}
window.addEventListener('cmls-player-preroll-start', onStreamStart);
window.addEventListener('cmls-player-stream-start', onStreamStart);

export default function youtubePatchInit() {
	const yts = getYtIframes();

	if (yts.length) {
		if (
			!document.querySelector(
				'script[src*="https://www.youtube.com/iframe_api"]'
			)
		) {
			document.head.append(
				<script async src="https://www.youtube.com/iframe_api"></script>
			);
		}

		yts.forEach((yt) => {
			const url = new URL(yt.getAttribute('src'));
			if (url.searchParams.get('enablejsapi') !== '1') {
				url.searchParams.set('enablejsapi', 1);
				yt.setAttribute('src', url);
			}
			/*
			const id = yt.getAttribute('id');
			if (!id || !id.length) {
				yt.setAttribute('id', generateUuid());
			}
			*/
		});

		waitForVariable(null, () => {
			if (
				typeof window.YT?.Player !== 'undefined' &&
				ytSdkLoaded === true
			) {
				return true;
			}
		})
			.then(() => {
				const yts = getYtIframes();
				yts.forEach((yt) => {
					if (!yt.getAttribute('cmls-patched')) {
						const id = yt.getAttribute('id');
						const ytp = new window.YT.Player(yt);
						ytp.addEventListener('onStateChange', (e) => {
							if (e.data === window.YT.PlayerState.PLAYING) {
								SDK.stop();
							}
						});

						window.addEventListener(
							'cmls-player-preroll-start',
							() => ytp.pauseVideo()
						);

						yt.setAttribute('cmls-patched', true);
						ytps.push(ytp);

						log.debug('Assigned listener', yt);
					}
				});
			})
			.catch(() => log.debug('YT SDK failed'));
	}
}
