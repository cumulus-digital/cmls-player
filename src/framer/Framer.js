import domReady from 'Utils/domReady';
import Child from './Child';
import Parent from './Parent';

import {
	EmptyLinkError,
	MalformedLinkError,
	CrossOriginLinkError,
	SamePageHashLinkError,
} from './LinkError';

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

	messageKey = 'cmls-framer';

	static safeClass = 'do-not-remove';
	static loadedClass = 'cmls-iframe-loaded';
	static loadingClass = 'cmls-iframe-loading';

	loadingTimeout;

	linkErrors = {
		EMPTY: EmptyLinkError,
		MALFORMED: MalformedLinkError,
		CROSS_ORIGIN: CrossOriginLinkError,
		SAME_PAGE_HASH: SamePageHashLinkError,
	};

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
	 * A link-like may have an href or a data-cmls-href attribute added
	 * by a patch. We will give data-cmls-hrefs preference.
	 *
	 * @param {HTMLElement} el
	 * @returns {string|null}
	 */
	getResolvedHref(el) {
		const href = el.getAttribute('href');
		const dataHref = el.getAttribute('data-cmls-href');
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
		return new URL(href, window.location.origin + window.location.pathname);
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
		const urlObj = this.getUrlObject(url);

		const currentUrlWithoutHash = this.getUrlWithoutHash(window.location);
		const newUrlWithoutHash = this.getUrlWithoutHash(urlObj);
		if (currentUrlWithoutHash !== newUrlWithoutHash) {
			log.debug('URLs without hashes do not match', {
				currentUrlWithoutHash,
				newUrlWithoutHash,
				url,
			});
			return false;
		}

		if (!urlObj.href.includes('#') && !origin.href.includes('#')) {
			log.debug('Same-page link without hashes', {
				new: urlObj.href,
				current: origin.href,
			});
			return false;
		}

		log.debug('New location is a page hash link', {
			new: urlObj.href,
			current: origin.href,
			currentUrlWithoutHash,
			newUrlWithoutHash,
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
		/**
		 * @type {URL}
		 */
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

	showLoading() {
		log.debug('Showing loading');
		document.body.classList.add(Framer.loadingClass);
		if (this.loadingTimeout) {
			clearTimeout(this.loadingTimeout);
			this.loadingTimeout = null;
		}
		this.loadingTimeout = setTimeout(this.hideLoading.bind(this), 10000);
	}

	hideLoading() {
		log.debug('Hiding loading');
		document.body.classList.remove(Framer.loadingClass);
		if (this.loadingTimeout) {
			clearTimeout(this.loadingTimeout);
			this.loadingTimeout = null;
		}
	}

	testLink(link, origin = window.location.origin) {
		if (!link?.length) {
			log.debug('Target destination is empty', { link });
			throw new this.linkErrors.EMPTY();
		}

		const url = this.getUrlObject(link);

		if (!url) {
			log.debug('Target destination generates malformed URL', {
				link,
				url,
			});
			throw new this.linkErrors.MALFORMED();
		}

		if (url.origin !== origin) {
			log.debug('Target destination is a different origin', {
				link,
				url,
			});
			throw new this.linkErrors.CROSS_ORIGIN(url.href);
		}

		if (this.isSamePageHash(url)) {
			throw new this.linkErrors.SAME_PAGE_HASH(url.hash);
		}

		return url;
	}

	emit(name, data) {
		const ev = new CustomEvent(name, {
			detail: data,
		});
		window.dispatchEvent(ev);
	}

	emitEvent(name, data) {
		const ev = new CustomEvent(`${this.messageKey}:${name}`, data);
		window.dispatchEvent(ev);
	}

	updateLocation(newUrl) {
		log.debug('Caught updateLocation call', newUrl);

		try {
			const url = this.testLink(newUrl);

			log.debug('Using location', url.href);
			if (this.isChildWindow()) {
				window.self.location.href = url;
			} else {
				this.parent.navigateTo(url);
			}
		} catch (e) {
			if (e instanceof this.linkErrors.CROSS_ORIGIN) {
				if (this.isChildWindow()) {
					window.parent.location.href = newUrl;
				} else {
					this.parent.navigateTo(newUrl);
				}
				return;
			}
			if (e instanceof this.linkErrors.SAME_PAGE_HASH) {
				log.debug('Same page hash!');
				const url = this.getUrlObject(newUrl);
				if (this.isChildWindow()) {
					window.self.location.hash = url.hash;
				} else {
					if (this.iframe) {
						log.debug('Passing same-page hash to child');
						this.parent.navigateTo(url);
					} else {
						log.debug('Updating parent location hash');
						window.self.location.hash = url.hash;
					}
				}
				return;
			}
			log.error('Failed to update location', e);
			throw e;
		}
	}
}
