import { h } from 'Utils/createElement';
import { SDK } from 'SDK/index';
import Logger from 'Utils/Logger';
import waitForVariable from 'Utils/waitForVariable';
/**
 * Attach an event listener to Vimeo embeds to stop the CMLS player
 * when a vimeo embed begins to play.
 */

const vimeoEmbedDomains = ['player.vimeo.com'];
let vimeoSdkLoaded = false;

const onVimeoSdkLoad = () => {
	vimeoSdkLoaded = true;
};

const log = new Logger('Patches / Vimeo');

function getVimeoIframes() {
	return document.querySelectorAll(
		vimeoEmbedDomains
			.map((d) => `iframe[src*="${d}"]:not([cmls-patched])`)
			.join(',')
	);
}

export default function vimeoPatchInit() {
	const vimeos = getVimeoIframes();

	if (vimeos.length) {
		if (
			!document.querySelector(
				'script[src*="https://player.vimeo.com/api/player.js"]'
			)
		) {
			document.head.append(
				<script
					async
					src="https://player.vimeo.com/api/player.js"
					onLoad={onVimeoSdkLoad}
				></script>
			);
		}

		waitForVariable(null, () => typeof window.Vimeo?.Player !== 'undefined')
			.then(() => {
				const vimeos = getVimeoIframes();
				vimeos.forEach((v) => {
					if (v.getAttribute('cmls-patched')) {
						return;
					}
					const vimeoPlayer = new window.Vimeo.Player(v);
					vimeoPlayer.on('play', function () {
						SDK.stop();
					});
					v.setAttribute('cmls-patched', true);
					log.debug('Assigned listener', v);
				});
			})
			.catch((e) => {});
	}
}
