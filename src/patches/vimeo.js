import { h } from 'Utils/createElement';
import { SDK } from 'SDK/index';
import Logger from 'Utils/Logger';
import waitForVariable from 'Utils/waitForVariable';
/**
 * Attach an event listener to Vimeo embeds to stop the CMLS player
 * when a vimeo embed begins to play.
 */

const vimeoEmbedDomains = ['player.vimeo.com'];

const log = new Logger('Patches / Vimeo');

const patchAttrib = 'data-cmlsp-patched';

function getVimeoIframes() {
	return document.querySelectorAll(
		vimeoEmbedDomains
			.map((d) => `iframe[src*="${d}"]:not([${patchAttrib}])`)
			.join(',')
	);
}

/**
 * Handle pausing videos if the stream starts
 */
const vps = [];
const onStreamStart = () => {
	vps.forEach((vp) => {
		if (vp?.getPaused) {
			vp.getPaused().then((paused) => {
				if (!paused) {
					log.debug('Pausing vimeo video', vp?.element);
					vp.pause();
				}
			});
		}
	});
};
window.addEventListener('cmls-player-preroll-start', onStreamStart);
window.addEventListener('cmls-player-stream-start', onStreamStart);

export default function vimeoPatchInit() {
	const vimeos = getVimeoIframes();

	if (vimeos.length) {
		if (
			!document.querySelector(
				'script[src*="player.vimeo.com/api/player.js"]'
			)
		) {
			document.head.append(
				<script
					async
					src="https://player.vimeo.com/api/player.js"
				></script>
			);
		}

		waitForVariable(null, () => typeof window.Vimeo?.Player !== 'undefined')
			.then(() => {
				const vimeos = getVimeoIframes();
				vimeos.forEach((v) => {
					if (v.getAttribute(patchAttrib)) {
						return;
					}
					const vimeoPlayer = new window.Vimeo.Player(v);
					vimeoPlayer.on('play', function () {
						SDK.stop();
					});

					v.setAttribute(patchAttrib, true);
					vps.push(vimeoPlayer);
					log.debug('Assigned listener', v);
				});
			})
			.catch((e) => {});
	}
}
