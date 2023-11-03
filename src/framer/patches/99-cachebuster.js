import domReady from 'Utils/domReady';

import Logger from 'Utils/Logger';
const log = new Logger('Framer / Cache Buster');

/**
 * Adds a cache buster and debug to all links
 */
if (window.location.search.includes('debug')) {
	domReady(() => {
		const hrefs = window.document.querySelectorAll(
			':any-link[href],[data-href]'
		);
		if (hrefs) {
			hrefs.forEach((link) => {
				const href = link.getAttribute('href');
				const dataHref = link.getAttribute('data-href');
				if ((dataHref || href)?.length) {
					const url = new URL(
						dataHref || href,
						window.location.origin
					);
					if (url.origin === window.self.location.origin) {
						if (
							(dataHref || href)?.charAt(0) === '#' ||
							url.hash.length ||
							url.href === window.location.href + '#'
						) {
							return;
						} else {
							//log.debug('Added', link);
							url.searchParams.set('cachebuster', Math.random());
							url.searchParams.set('debug', true);
							log.debug('setting cache buster', link, url);
							if (dataHref) {
								link.setAttribute('data-href', url);
							} else {
								link.setAttribute('href', url);
							}
						}
					}
				}
			});
		}
		console.groupEnd();
	});
}
