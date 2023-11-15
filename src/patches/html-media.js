import { SDK } from 'SDK/index';
import Logger from 'Utils/Logger';

/**
 * Attach an event listener to HTML media elements to stop the CMLS player
 * when they start, and v/v.
 */

const patchAttrib = 'data-cmlsp-patched';

const log = new Logger('Patches / HTML Media');

const onStreamStart = (e) => {
	document
		.querySelectorAll(`audio[${patchAttrib}],video[${patchAttrib}]`)
		.forEach((el) => {
			log.debug(el?.paused, el);
			if (el?.pause && !el?.paused) {
				log.debug('Pausing element', el);
				el.pause();
			}
		});
};
window.addEventListener('cmls-player-preroll-start', onStreamStart);
window.addEventListener('cmls-player-stream-start', onStreamStart);

export default function htmlMediaInit() {
	document
		.querySelectorAll(
			`audio:not([${patchAttrib}]),video:not([${patchAttrib}])`
		)
		.forEach((el) => {
			el.addEventListener('play', () => {
				SDK.stop();
			});
			el.setAttribute(patchAttrib, true);
		});
}
