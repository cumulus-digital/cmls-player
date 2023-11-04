import { h } from 'Utils/createElement';
import domReady from 'Utils/domReady';
import isParentWindow from 'Utils/isParentWindow';

import config from 'Config';
const { siteframe_id, siteframe_loading_id } = config;

import Logger from 'Utils/Logger';
const log = new Logger('Framer');

export class Framer {
	iframe;
	loadingIndicator;
	patches = {};

	messageKey = 'cmls_framer:updateLocation';

	lastLocation = Object.assign({}, window.location);

	disablePushstate = false;

	constructor() {
		this.loadPatches();

		if (isParentWindow()) {
			this.initParent();
		} else {
			this.initChild();
		}
	}

	/**
	 * Load all patches into this.patches
	 */
	loadPatches() {
		const me = this;
		function requireAll(r) {
			r.keys()
				.sort()
				.forEach((key) => {
					const mod = r(key);
					if (mod?.default && typeof mod.default === 'function') {
						log.debug('Registering patch', mod.default.name);
						me.patches[mod.default.name] = new mod.default(me);
					}
				});
		}
		requireAll(
			/* webpackChunkName: 'framer/[request]' */
			/* webpackMode: 'lazy' */
			/* webpackPrefetch: true */
			/* webpackPreload: true */
			require.context('./patches/', true, /\.js$/)
		);

		for (let p in this.patches) {
			if (this.patches[p]?.init) {
				this.patches[p].init();
				domReady(() => this.patches[p].init());
			}
		}
	}

	/**
	 * Get the installed patches
	 * @returns {array}
	 */
	getPatches() {
		return this.patches;
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

	initParent() {
		log.debug('Loaded into parent');

		this.iframe = (
			<iframe
				id={siteframe_id}
				name={siteframe_id}
				width={0}
				height={0}
				frameborder={0}
				class="do-not-remove"
			/>
		);
		this.loadingIndicator = (
			<div id={siteframe_loading_id} class="do-not-remove">
				<div id="js8d">
					{Array.from(Array(5).keys()).map((i) => (
						<div />
					))}
				</div>
			</div>
		);

		document.body.append(this.iframe, this.loadingIndicator);

		this.addListeners({
			message: this.handleMessage.bind(this),
			popstate: this.handlePopState.bind(this),
			click: this.handleClick.bind(this),
		});
	}

	initChild() {
		log.debug('Loaded into child');

		this.addListeners(
			{
				readystatechange: this.sendStateToParent.bind(this),
				DOMContentLoaded: this.sendStateToParent.bind(this),
				click: this.handleClick.bind(this),
			},
			document
		);

		this.addListeners({
			hashchange: this.sendStateToParent.bind(this),
		});

		this.sendStateToParent();
	}

	/**
	 * Handle a postMessage event from a child. Any update
	 * message clears the document body of elements and
	 * makes our iframe visible.
	 *
	 * @param {MessageEvent} ev
	 */
	handleMessage(ev) {
		if (
			ev.source !== this.iframe.contentWindow ||
			ev.data?.message !== this.messageKey
		) {
			return;
		}

		const classList = document.body.classList;
		if (typeof ev.data?.readystate !== 'undefined') {
			this.updateParentState({
				title: ev.data?.title,
				location: ev.data?.location,
			});

			if (!classList.contains('iframe-loaded')) {
				classList.remove('iframe-loading');
				classList.add('iframe-loaded');

				// Clear out the body
				document.querySelectorAll('body > *').forEach((el) => {
					if (
						el.id === siteframe_id ||
						el.classList.contains('do-not-remove')
					) {
						return;
					}
					el.remove();
				});
			}
		}
	}

	updateParentState(data) {
		const { title = document.title, location = window.location.href } =
			data;
		if (title !== document.title) {
			log.debug('Updating parent title', {
				was: document.title,
				now: title,
			});
			document.title = title;
		}
		const url = this.getUrlObject(location);
		if (url?.href !== window.location.href) {
			log.debug('Updating parent url', url);
			history.pushState(null, '', url.href);
		}
	}

	updateLastLocation(url) {
		log.debug('Updating lastLocation', url.href);
		this.lastLocation = url;
	}

	/**
	 * Sends the current state to the parent window.
	 */
	sendStateToParent() {
		const state = {
			message: this.messageKey,
			readystate: document.readyState,
			title: document.title,
			location: window.self.location.href,
		};
		log.debug('Sending state to parent', state);
		window.parent.postMessage(state, window.location.originframe);
	}

	/**
	 * Handles a popstate event, either loading the event request in our iframe
	 * or sending the new state upstairs.
	 *
	 * @param {PopStateEvent} ev
	 */
	handlePopState(ev) {
		const from = ev.state?.from;
		log.debug('Caught popstate', {
			lastLocation: this.lastLocation,
			window: window.name,
			old_location: from,
			new_location: window.location.href,
			event: ev,
		});
		if (window.name === siteframe_id) {
			return;
		}

		this.disablePushstate = true;

		if (this.isSamePageHash(window.location.href, this.lastLocation.href)) {
			this.iframe.contentDocument.location.hash = window.location.hash;
		} else {
			this.iframe.contentDocument.location.replace(window.location.href);
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
		const href = el.href;
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
	 * From a given URL. returns the href *without the hash*
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

	/**
	 * Determine if a given URL links to a hash/anchor on the current page.
	 *
	 * @param {string|URL} href
	 * @param {string|URL} origin
	 * @returns {boolean}
	 */
	isSamePageHash(href, origin = window.location) {
		const currentUrlWithoutHash = this.getUrlWithoutHash(origin);
		const newUrlWithoutHash = this.getUrlWithoutHash(href);

		const currentUrl = this.getUrlObject(origin);
		const newUrl = this.getUrlObject(href);

		const hasHash = (url) => url.hash?.length || url.href.includes('#');

		// only test if one url has hash
		if (hasHash(currentUrl) || hasHash(newUrl)) {
			// If the URLs without hash are the same, we're good.
			if (currentUrlWithoutHash === newUrlWithoutHash) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Handle a generic click event
	 *
	 * @param {PointerEvent} ev
	 * @returns {void}
	 */
	handleClick(ev) {
		let target = ev.target;

		// Ensure a target is link-like
		if (!target?.matches(':any-link[href],[data-href]')) {
			target = target.closest(':any-link[href],[data-href]');
		}

		if (!target) {
			log.debug('Click target is not actionable', ev);
			return;
		}

		const path = ev.composedPath();
		if (!path.includes(target)) {
			log.debug('Click target not in event path', { target, path });
			return;
		}

		const href = this.getResolvedHref(target);

		// Ignore empty links
		if (!href || !href.length) {
			log.debug('Click target has an empty destination', {
				target,
				href,
			});
			return;
		}

		const url = this.getUrlObject(href);

		if (!url) {
			log.debug('Click target generates malformed URL', {
				target,
				href,
				url,
			});
			return;
		}

		if (this.isCrossOrigin(url)) {
			// Cross-origin links target the parent
			const linkTarget = target?.target;
			if (!linkTarget || linkTarget === '_self') {
				target.target = '_parent';
			}
			log.debug('Passing through a cross-origin link', { target, url });
			return;
		}

		if (this.isSamePageHash(href)) {
			log.debug('Ignoring same-page hash link.', { target, href });
			return;
		}

		log.debug('Handling click', { target, href, event: ev });

		ev.preventDefault();
		this.updateLocation(url);
	}

	/**
	 * Update the current location. Parent window updates the iframe,
	 * otherwise we update ourselves.
	 *
	 * @param {string|URL} url
	 * @returns {void}
	 */
	updateLocation(url) {
		url = this.getUrlObject(url);
		if (this.isCrossOrigin(url)) {
			return;
		}

		if (isParentWindow()) {
			log.debug('Sending updated location to iframe', url);
			this.updateIframe({ url });
		} else {
			window.self.location.href = url.href;
		}
	}

	updateIframe(options) {
		let { url = window.location.href } = options;
		url = this.getUrlObject(url);

		if (url) {
			log.debug(
				'Updating iframe location',
				url.href,
				this.iframe.contentDocument.location
			);
			document.body.classList.add('iframe-loading');
			try {
				if (this.iframe.contentDocument?.location) {
					if (
						this.isSamePageHash(
							url,
							this.iframe.contentDocument.location
						)
					) {
						this.iframe.contentDocument.location.hash = url.hash;
					} else {
						this.iframe.contentDocument.location.href = url.href;
					}
				} else if (this.iframe.src) {
					this.iframe.src = url.href;
				}
				this.iframe.classList.add('has-loaded');
			} catch (e) {
				log.error(e);
			}
		}
	}
}

// export class Framer2 {
// 	context = window.self;
// 	iframe;
// 	loadingIndicator;

// 	lastLocation = Object.assign({}, window.location);
// 	wasHashChange = false;

// 	updateMessageKey = 'cmls_framer:updateWindowLocation';

// 	patches = [];

// 	constructor() {
// 		const me = this;
// 		// Load all patches
// 		function requireAll(r) {
// 			r.keys()
// 				.sort()
// 				.forEach((key) => {
// 					const mod = r(key);
// 					if (mod?.default && typeof mod.default === 'function') {
// 						me.patches.push(new mod.default(me));
// 					}
// 				});
// 		}
// 		requireAll(
// 			/* webpackChunkName: 'framer/[request]' */
// 			/* webpackMode: 'lazy' */
// 			/* webpackPrefetch: true */
// 			/* webpackPreload: true */
// 			require.context('./patches/', true, /\.js$/)
// 		);

// 		if (isParentWindow()) {
// 			this.initParent();
// 		} else {
// 			this.initChild();
// 		}

// 		this.updateLastLocation();

// 		// Update all forms that don't have targets to
// 		// target our iframe
// 		domReady().then(() => {
// 			const forms = window.document.querySelectorAll('form');
// 			forms.forEach((form) => {
// 				const target = form.getAttribute('target');
// 				if (!target || target === '_self') {
// 					form.setAttribute('target', siteframe_id);
// 				}
// 			});
// 		});
// 	}

// 	getPatches() {
// 		return this.patches;
// 	}

// 	/**
// 	 * Update the last location cache
// 	 * @param {string|URL} location
// 	 */
// 	updateLastLocation(location) {
// 		if (!location instanceof URL) {
// 			location = new URL(location);
// 		}
// 		log.debug(
// 			'new lastLocation',
// 			Object.assign({}, location || window.location)
// 		);
// 		this.lastLocation = Object.assign({}, location || window.location);
// 	}

// 	handleMessage(msg) {
// 		if (
// 			msg.source !== this.iframe.contentWindow ||
// 			msg.data?.message !== this.updateMessageKey
// 		) {
// 			return;
// 		}
// 		const classList = document.body.classList;
// 		if (typeof msg.data?.readystate !== 'undefined') {
// 			this.updateWindowData({
// 				title: msg.data?.title,
// 				location: msg.data?.location,
// 			});

// 			classList.remove('iframe-loading');
// 			classList.add('iframe-loaded');

// 			// Remove all body elements
// 			document.querySelectorAll('body > *').forEach((el) => {
// 				if (
// 					el.id === siteframe_id ||
// 					el.classList.contains('do-not-remove')
// 				) {
// 					return;
// 				}
// 				el.remove();
// 			});
// 		}
// 	}

// 	initParent() {
// 		log.debug('Loaded in parent', this.lastUrl);
// 		this.iframe = (
// 			<iframe
// 				id={siteframe_id}
// 				name={siteframe_id}
// 				width={0}
// 				height={0}
// 				frameborder={0}
// 				class="do-not-remove"
// 			/>
// 		);
// 		this.loadingIndicator = (
// 			<div id={siteframe_loading_id} class="do-not-remove">
// 				<div id="js8d">
// 					{Array.from(Array(5).keys()).map((i) => (
// 						<div />
// 					))}
// 				</div>
// 			</div>
// 		);

// 		domReady().then(() => {
// 			window.self.document.body.append(
// 				this.iframe,
// 				this.loadingIndicator
// 			);
// 		});

// 		const listeners = {
// 			message: this.handleMessage.bind(this),
// 			popstate: this.handlePopState.bind(this),
// 			click: this.handleClick.bind(this),
// 		};

// 		for (let ev in listeners) {
// 			const handler = listeners[ev]?.handler || listeners[ev];
// 			log.debug(
// 				'Attaching listener',
// 				{ event: ev, callback_name: handler.name },
// 				listeners[ev]
// 			);
// 			window.addEventListener(ev, handler);
// 		}
// 	}

// 	sendStateToParent() {
// 		const msg = {
// 			message: this.updateMessageKey,
// 			readystate: document.readyState,
// 			title: document.title,
// 			location: window.self.location.href,
// 		};
// 		log.debug('Sending message to parent', msg);
// 		window.parent.postMessage(msg, window.location.originframe);
// 	}

// 	initChild() {
// 		log.debug('Loaded in child.');
// 		const sendState = () => {
// 			const msg = {
// 				message: this.updateMessageKey,
// 				readystate: document.readyState,
// 				title: document.title,
// 				location: window.self.location.href,
// 			};
// 			log.debug('Sending message to parent', msg);
// 			window.parent.postMessage(msg, window.location.originframe);
// 		};
// 		const documentListeners = {
// 			readystatechange: sendState.bind(this),
// 			DOMContentLoaded: sendState.bind(this),
// 			click: this.handleClick.bind(this),
// 		};
// 		const windowListeners = {
// 			popstate: this.handlePopState.bind(this),
// 		};

// 		for (let ev in documentListeners) {
// 			log.debug(
// 				'Attaching document listener',
// 				{ event: ev, callback_name: documentListeners[ev].name },
// 				documentListeners[ev]
// 			);
// 			document.addEventListener(ev, documentListeners[ev]);
// 		}
// 		for (let ev in windowListeners) {
// 			log.debug(
// 				'Attaching window listener',
// 				{ event: ev, callback_name: windowListeners[ev].name },
// 				windowListeners[ev]
// 			);
// 			window.self.addEventListener(ev, windowListeners[ev]);
// 		}

// 		sendState();
// 	}

// 	handlePopState(e) {
// 		log.debug('Caught popstate', e, {
// 			old: this.lastLocation.href,
// 			new: window.location.href,
// 		});

// 		// parents need to be informed about child hash changes
// 		if (this.isSamePageHash(window.location.href)) {
// 			if (!isParentWindow()) {
// 				this.sendStateToParent();
// 			}
// 			return;
// 		}

// 		if (isParentWindow()) {
// 			log.debug('Updating iframe location');
// 			this.iframe.contentDocument.location.replace(window.location.href);
// 		} else {
// 			this.sendStateToParent();
// 		}
// 		this.updateLastLocation();
// 	}

// 	removeCacheBuster(s) {
// 		return s
// 			.replace(/cachebuster=[\d\.]+/, '')
// 			.replace(/debug(=true)?/, '');
// 	}

// 	/**
// 	 * Generates a URL object from an href, with our current origin base
// 	 * @param {string} href
// 	 * @returns {URL}
// 	 */
// 	generateUrl(href = '') {
// 		href = String(href);
// 		const url = new URL(href, window.location.origin);
// 		return url;
// 	}

// 	/**
// 	 * Checks if a string is a URL, and if so, checks for length
// 	 * and same origin.
// 	 * @param {string} href
// 	 * @returns {URL|false}
// 	 */
// 	processHref(href = '') {
// 		href = String(href);
// 		// no empty links!
// 		if (!href?.length) {
// 			return false;
// 		}

// 		// We don't deal with simple, same-page hashed links
// 		// NOTE: THIS PREVENTS HASH LINKS FROM UPDATING
// 		// PARENT WINDOW LOCATION! need a better way.
// 		if (href.charAt(0) === '#') {
// 			//return false;
// 		}

// 		const url = new URL(href, window.location.origin);
// 		if (!this.isUrlSameOrigin(url)) {
// 			return false;
// 		}

// 		return url;
// 	}

// 	/**
// 	 * Determine if a given URL is cross-origin
// 	 * @param {URL|String} url
// 	 * @returns {boolean}
// 	 */
// 	isCrossOrigin(url) {
// 		url = this.generateUrl(url);
// 		return url.origin !== window.location.origin;
// 	}

// 	/**
// 	 * Determine if a given URL is a hash link for the existing page.
// 	 * @param {URL|string} newUrl
// 	 * @param {URL|string} oldUrl
// 	 * @returns {boolean}
// 	 */
// 	isSamePageHash(newUrl, oldUrl) {
// 		newUrl = this.generateUrl(newUrl);
// 		oldUrl = this.generateUrl(
// 			oldUrl || this.lastLocation?.href || window.location.href
// 		);

// 		const oldWithoutHash = `${oldUrl.origin}${
// 			oldUrl.pathname
// 		}${this.removeCacheBuster(oldUrl.search)}`;
// 		const newWithoutHash = `${newUrl.origin}${
// 			newUrl.pathname
// 		}${this.removeCacheBuster(newUrl.search)}`;

// 		if (oldWithoutHash === newWithoutHash) {
// 			log.debug('Is an in-page hash link', { newUrl, oldUrl });
// 			return true;
// 		}

// 		if (newUrl.hash.length || newUrl.href.includes('#')) {
// 			log.debug('Is an in-page hash link', { newUrl, oldUrl });
// 			return true;
// 		}

// 		log.debug('Is not a hash link', { newUrl, oldUrl });
// 		return false;
// 	}

// 	handleClick(e) {
// 		let target = e.target;

// 		// Check if target is a link
// 		if (!target?.matches(':any-link,[data-href]')) {
// 			target = target.closest(':any-link,[data-href]');
// 		}

// 		if (!target) {
// 			return;
// 		}

// 		const path = e.composedPath();
// 		if (!path.includes(target)) {
// 			log.debug('Target not in path', { target, path });
// 			return;
// 		}

// 		const href = target.getAttribute('href');
// 		const dataHref = target.getAttribute('data-href');

// 		// Ignore empty links
// 		if (!href && !dataHref) {
// 			log.debug('Ignoring empty link', { target, href, dataHref });
// 			return;
// 		}

// 		const url = this.generateUrl(dataHref || href);

// 		if (!url) {
// 			log.debug('Ignoring malformed url', {
// 				target,
// 				href,
// 				dataHref,
// 				url,
// 			});
// 			return;
// 		}

// 		// Handle cross-origin links
// 		if (this.isCrossOrigin(url)) {
// 			const linkTarget = target.getAttribute('target');
// 			if (!linkTarget || linkTarget === '_self') {
// 				target.setAttribute('target', '_parent');
// 			}
// 			log.debug('Pass-through cross-origin link', { target, url });
// 			return;
// 		}

// 		// Ignore in-page hashes
// 		if (this.isSamePageHash(dataHref || href)) {
// 			log.debug('Ignoring in-page hash', url.hash);
// 			return;
// 		}

// 		e.preventDefault();
// 		this.updateLocation(url);
// 	}

// 	handleFormSubmitEvent(e) {
// 		// I think we'll handle this by altering forms themselves?
// 	}

// 	updateIframe(options) {
// 		const { url = window.location.href } = options;
// 		if (!this.iframe.src) {
// 			if (isParentWindow()) {
// 				document.body.classList.add('iframe-loading');
// 			}
// 		}
// 		this.iframe.contentDocument.location.replace(url);
// 		//window.document.body.append(this.iframe);
// 	}

// 	isUrlSameOrigin(url) {
// 		const newUrl = new URL(url, window.location.origin);
// 		if (newUrl && newUrl.origin === window.location.origin) {
// 			return true;
// 		}
// 		return false;
// 	}

// 	updateLocation(url) {
// 		const newUrl = new URL(url, window.location.origin);
// 		if (this.isUrlSameOrigin(newUrl)) {
// 			if (isParentWindow()) {
// 				this.updateIframe({ url: newUrl });
// 			} else {
// 				window.self.location.href = newUrl;
// 			}
// 		}
// 	}

// 	updateWindowData(data) {
// 		const { title = document.title, location = window.location.href } =
// 			data;
// 		if (title !== document.title) {
// 			document.title = title;
// 		}
// 		const newUrl = new URL(location, window.location.origin);
// 		if (newUrl && newUrl.href !== window.location.href) {
// 			log.debug('Pushing history state', newUrl);
// 			history.pushState({}, '', newUrl);
// 			this.updateLastLocation(newUrl.href);
// 		}
// 	}
// }
