import { Framer } from '../Framer';

import Logger from 'Utils/Logger';
const log = new Logger('Framer / Patch / Cache Buster');

/**
 * Adds a cache buster and debug to all links
 */
export default class CacheBuster {
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

	process(el, attr = 'href') {
		const nodeName = el.nodeName?.toLowerCase();
		if (!nodeName) return;

		const href = el.getAttribute('href');
		const dataHref = el.getAttribute('data-cmls-href');
		const val = el?.value;

		let dest = dataHref || href;
		if (dataHref) {
			attr = 'data-cmls-href';
		}
		if (val !== undefined) {
			dest = val;
			attr = 'value';
		}

		if (
			dest?.length &&
			!(dest.includes('cachebuster') && dest.includes('debug'))
		) {
			const url = this.framer.getUrlObject(dest);
			if (url.origin === window.location.origin) {
				// skip in-page hashes
				if (this.framer.isSamePageHash(dest)) return;
				url.searchParams.set('debug', true);
				url.searchParams.set(
					'cachebuster',
					Math.floor(Math.random() * 100000000000)
				);
				log.debug('Altering link', { was: dest, now: url.href });
				el.setAttribute(attr, url.href);
			}
		}
	}

	init() {
		if (!window.location.search.includes('debug')) {
			return;
		}

		const els = window.document.querySelectorAll(
			':any-link[href], [data-cmls-href], select.selectnav option'
		);
		if (els) {
			els.forEach((el) => this.process(el));
		}
	}

	reverseUrlChange(url) {
		this.framer.getUrlObject(url);
		url.searchParams.delete('cachebuster');
		url.searchParams.delete('debug');
		return url;
	}
}
