import { Framer } from '../Framer';

import Logger from 'Utils/Logger';
const log = new Logger('Framer / Patch / AlterOnClicks');

/**
 * Finds elements with onclick attributes that attempt to load new
 * pages using window.location. The onclick attribute is removed, and
 * a data-cmls-href attribute is added with the intended URL.
 */
export default class AlterOnClicks {
	/**
	 * @type {Framer}
	 */
	framer;

	/**
	 * @param {Framer} framer
	 */
	constructor(framer) {
		this.framer = framer;
	}

	init() {
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
						const newHref = new URL(
							url,
							window.self.location.origin +
								window.location.pathname
						);
						if (
							newHref &&
							newHref.origin === window.self.location.origin
						) {
							log.debug('Altering onClick', {
								item,
								url: newHref.href,
							});
							item.removeAttribute('onclick');
							item.setAttribute('data-cmls-href', newHref);
						}
					}
				}
			});
		}
	}
}
