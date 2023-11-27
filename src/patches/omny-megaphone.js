import { h } from 'Utils/createElement';
import { SDK } from 'SDK/index';
import Logger from 'Utils/Logger';
import waitForVariable from 'Utils/waitForVariable';
import generateUuid from 'Utils/generateUuid';

/**
 * Attach an event listener to Omny Studio and Megaphone embeds to stop
 * the CMLS player when a podcast is played and v/v
 */

const embedDomains = ['omny.fm', 'megaphone.fm'];

const patchAttrib = 'data-cmlsp-patched';

const log = new Logger('Patches / Omny-Megaphone');

const podPlayers = [];
const onStreamStart = (e) => {
	podPlayers.forEach((pod) => {
		if (pod.supports('getPaused')) {
			pod.getPaused((paused) => {
				if (!paused) pod.pause();
			});
		} else if (pod.supports('pause')) {
			pod.pause();
		}
	});
};
window.addEventListener('cmls-player-preroll-start', onStreamStart);
window.addEventListener('cmls-player-stream-start', onStreamStart);

export default function omnyPatchInit() {
	const getPods = () =>
		document.querySelectorAll(
			embedDomains.map((d) => `iframe[src*="${d}"]`).join(',')
		);

	const pods = getPods();

	if (pods.length) {
		if (
			!document.querySelector(
				'script[src*="cdn.embed.ly/player-0.1.0.min.js"]'
			)
		) {
			document.head.append(
				<script
					async
					src="https://cdn.embed.ly/player-0.1.0.min.js"
				></script>
			);
		}

		waitForVariable(
			null,
			() => typeof window.playerjs?.Player !== 'undefined'
		)
			.then(() => {
				const pods = getPods();
				pods.forEach((pod) => {
					if (pod.getAttribute(patchAttrib)) return;
					if (!pod.getAttribute('id')) {
						pod.setAttribute('id', generateUuid());
					}

					const podPlayer = new window.playerjs.Player(
						pod.getAttribute('id')
					);
					pod.on('play', () => {
						SDK.stop();
					});

					pod.setAttribute(patchAttrib, true);
					podPlayers.push(podPlayer);
					log.debug('Assigned listener', pod);
				});
			})
			.catch((e) => {});
	}
}
