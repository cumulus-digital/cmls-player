/**
 * Finds elements with onclick attributes that attempt to load new
 * pages using window.location. The onclick attribute is removed, and
 * a data-href attribute is added with the intended URL.
 */

import domReady from 'Utils/domReady';

import Logger from 'Utils/Logger';
const log = new Logger('Framer / onclicks');

function alterOnClicks() {
	const onclicks = window.document.querySelectorAll(
		'[onclick*="window.location"]'
	);
	if (onclicks) {
		onclicks.forEach((item) => {
			const onclick = item.getAttribute('onclick');
			const hrefTest = onclick.match(
				/window\.location(\.[.]*)?=\'([^\']+)/i
			);
			if (hrefTest.length) {
				const url = hrefTest.pop();
				if (url.length) {
					const newHref = new URL(url, window.self.location.origin);
					if (
						newHref &&
						newHref.origin === window.self.location.origin
					) {
						item.removeAttribute('onclick');
						item.setAttribute('data-href', newHref);
					}
				}
			}
		});
	}
}

alterOnClicks();
domReady(alterOnClicks);
