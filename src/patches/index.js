import domReady from 'Utils/domReady';
import Logger from 'Utils/Logger';

const log = new Logger('Patches');

/**
 * Load patches and execute them immediately and on domReady
 */
export default function initPatches() {
	log.debug('Initializing');

	const patchesContext = import.meta.webpackContext('.', {
		chunkName: 'patches/[request]',
		recursive: true,
		regExp: /.*\.js$/,
		exclude: /index\.js/,
		mode: 'lazy',
	});

	patchesContext
		.keys()
		.sort()
		.forEach((key) => {
			patchesContext(key).then((mod) => {
				if (mod.default && typeof mod.default === 'function') {
					const name = mod.default.name;
					log.debug('Loaded', name);
					mod.default();
					domReady(() => mod.default());
				}
			});
		});
}
