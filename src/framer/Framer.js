import domReady from 'Utils/domReady';
import Child from './Child';
import Parent from './Parent';

import config from 'Config';
const { siteframe_id } = config;

import Logger from 'Utils/Logger';
const log = new Logger('Framer');

export class Framer {
	iframe;
	loadingIndicator;

	parent;
	child;

	patches = {};

	messageKey = 'cmls_framer:updateLocation';

	constructor() {
		this.loadPatches();

		if (this.isChildWindow()) {
			this.child = new Child(this);
		} else {
			this.parent = new Parent(this);
		}
	}

	loadPatches() {
		const me = this;

		const patchesContext = import.meta.webpackContext('.', {
			chunkName: 'framer/[request]',
			recursive: true,
			regExp: /\/patches\/.*\.js$/,
			mode: 'lazy',
		});
		patchesContext
			.keys()
			.sort()
			.forEach((key) => {
				patchesContext(key).then((mod) => {
					if (mod?.default && typeof mod.default === 'function') {
						const name = mod.default.name;
						log.debug('Registering patch', name);
						me.patches[name] = new mod.default(me);
						me.patches[name].init();
						domReady(() => me.patches[name].init());
					}
				});
			});
	}

	isChildWindow() {
		if (window.self.name === siteframe_id) {
			return true;
		}
		return false;
	}

	/**
	 * Attach listeners to a place.
	 * @param {object} listeners Keyed by event name
	 * @param {object|HTMLElement} place
	 */
	addListeners(listeners, place = window) {
		for (let ev in listeners) {
			const handler = listeners[ev]?.handler || listeners[ev];
			const options = listeners[ev]?.options || {};
			log.debug(
				'Attaching listener',
				{ event: ev, callback_name: handler?.name, options },
				handler
			);
			place.addEventListener(ev, handler, options);
		}
	}

	/**
	 * A link-like may have an href or a data-href attribute added
	 * by a patch. We will give data-hrefs preference.
	 *
	 * @param {HTMLElement} el
	 * @returns {string|null}
	 */
	getResolvedHref(el) {
		const href = el.getAttribute('href');
		const dataHref = el.getAttribute('data-href');
		return dataHref || href || null;
	}

	/**
	 * Given a string or URL, return a URL.
	 *
	 * @param {string|URL} href
	 * @returns {URL}
	 */
	getUrlObject(href = '') {
		if (typeof href !== 'string') {
			try {
				href = String(href);
			} catch (e) {
				return null;
			}
		}
		if (href instanceof URL) {
			href = href.href;
		}
		return new URL(href, window.location.origin);
	}

	/**
	 * Determine if a given URL origin is the current window origin.
	 *
	 * @param {string|URL} url
	 * @returns {boolean}
	 */
	isCrossOrigin(url) {
		url = this.getUrlObject(url);
		return url?.origin !== window.location.origin;
	}

	/**
	 * Determine if a given URL is a link to a hash anchor on the current page
	 * @param {URL|string} url
	 * @param {Location|URL?} origin Defaults to window.location
	 * @returns {boolean}
	 */
	isSamePageHash(url, origin = window.location) {
		const currentUrlWithoutHash = this.getUrlWithoutHash(window.location);
		const newUrlWithoutHash = this.getUrlWithoutHash(url);
		if (currentUrlWithoutHash !== newUrlWithoutHash) {
			log.debug('URLs without hashes do not match', {
				currentUrlWithoutHash,
				newUrlWithoutHash,
			});
			return false;
		}

		if (!url.href.includes('#') && !origin.href.includes('#')) {
			log.debug('Same-page link without hashes', {
				new: url.href,
				current: origin.href,
			});
			return false;
		}

		log.debug('New location is a page hash link', {
			new: url.href,
			current: origin.href,
		});
		return true;
	}

	/**
	 * From a given URL, returns the href *without the hash portion*
	 *
	 * @param {string|URL} url
	 * @returns {string}
	 */
	getUrlWithoutHash(url) {
		url = this.getUrlObject(url);
		let search = url.search;
		for (let p in this.patches) {
			// Patches can alter urls, but we want the original
			if (this.patches[p]?.reverseUrlChange) {
				const newSearch = this.patches[p].reverseUrlChange(url)?.search;
				if (newSearch !== undefined) {
					search = newSearch;
				}
			}
		}
		return `${url.origin}${url.pathname}${search}`;
	}
}
