import domReady from 'Utils/domReady';

import Logger from 'Utils/Logger';
const log = new Logger('Framer / Cache Buster');

/**
 * Adds a cache buster to all links
 */
domReady(() => {
	const hrefs = window.document.querySelectorAll('a[href]');
	if (hrefs) {
		hrefs.forEach((link) => {
			const href = link.getAttribute('href');
			if (href.length) {
				const url = new URL(href, window.location.origin);
				if (url.origin === window.self.location.origin) {
					if (
						href.charAt(0) === '#' ||
						url.hash.length ||
						url.href === window.location.href + '#'
					) {
						return;
					} else {
						//log.debug('Added', link);
						url.searchParams.set('cachebuster', Math.random());
						url.searchParams.set('debug', true);
						link.setAttribute('href', url);
					}
				}
			}
		});
	}
	console.groupEnd();
});
