import { h } from 'Utils/createElement';
import domReady from 'Utils/domReady';
import isParentWindow from 'Utils/isParentWindow';

import config from 'Config';
const { siteframe_id, siteframe_loading_id } = config;

import Logger from 'Utils/Logger';
const log = new Logger('Framer');

export class Framer {
	context = window.self;
	iframe;
	loadingIndicator;

	lastLocation = Object.assign({}, window.location);
	wasHashChange = false;

	updateMessageKey = 'cmls_framer:updateWindowLocation';

	constructor() {
		if (isParentWindow()) {
			this.initParent();
		} else {
			this.initChild();
		}

		this.updateLastLocation();

		// Update all forms that don't have targets to
		// target our iframe
		domReady().then(() => {
			const forms = window.document.querySelectorAll('form');
			forms.forEach((form) => {
				const target = form.getAttribute('target');
				if (!target || target === '_self') {
					form.setAttribute('target', siteframe_id);
				}
			});
		});
	}

	updateLastLocation(location) {
		if (!location instanceof URL) {
			location = new URL(location);
		}
		log.debug(
			'new lastLocation',
			Object.assign({}, location || window.location)
		);
		this.lastLocation = Object.assign({}, location || window.location);
	}

	handleMessage(msg) {
		if (
			msg.source !== this.iframe.contentWindow ||
			msg.data?.message !== this.updateMessageKey
		) {
			return;
		}
		const classList = document.body.classList;
		if (typeof msg.data?.readystate !== 'undefined') {
			this.updateWindowData({
				title: msg.data?.title,
				location: msg.data?.location,
			});

			classList.remove('iframe-loading');
			classList.add('iframe-loaded');

			// Remove all body elements
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

	initParent() {
		log.debug('Loaded in parent', this.lastUrl);
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

		domReady().then(() => {
			window.self.document.body.append(
				this.iframe,
				this.loadingIndicator
			);
		});

		const listeners = {
			message: this.handleMessage.bind(this),
			popstate: this.handlePopState.bind(this),
			click: this.handleClick.bind(this),
		};

		for (let ev in listeners) {
			log.debug(
				'Attaching listener',
				{ event: ev, callback_name: listeners[ev].name },
				listeners[ev]
			);
			window.addEventListener(ev, listeners[ev]);
		}
	}

	sendStateToParent() {
		const msg = {
			message: this.updateMessageKey,
			readystate: document.readyState,
			title: document.title,
			location: window.self.location.href,
		};
		log.debug('Sending message to parent', msg);
		window.parent.postMessage(msg, window.location.originframe);
	}

	initChild() {
		log.debug('Loaded in child.');
		const sendState = () => {
			const msg = {
				message: this.updateMessageKey,
				readystate: document.readyState,
				title: document.title,
				location: window.self.location.href,
			};
			log.debug('Sending message to parent', msg);
			window.parent.postMessage(msg, window.location.originframe);
		};
		const documentListeners = {
			readystatechange: sendState.bind(this),
			DOMContentLoaded: sendState.bind(this),
			click: this.handleClick.bind(this),
		};
		const windowListeners = {
			popstate: this.handlePopState.bind(this),
		};

		for (let ev in documentListeners) {
			log.debug(
				'Attaching document listener',
				{ event: ev, callback_name: documentListeners[ev].name },
				documentListeners[ev]
			);
			document.addEventListener(ev, documentListeners[ev]);
		}
		for (let ev in windowListeners) {
			log.debug(
				'Attaching window listener',
				{ event: ev, callback_name: windowListeners[ev].name },
				windowListeners[ev]
			);
			window.self.addEventListener(ev, windowListeners[ev]);
		}

		sendState();
	}

	handlePopState(e) {
		const removeCacheBuster = (s) =>
			s.replace(/cachebuster=[\d\.]+/, '').replace(/debug(=true)?/, '');
		const oldUrl = `${this.lastLocation?.origin}${
			this.lastLocation?.pathname
		}${removeCacheBuster(this.lastLocation?.search)}`;
		const newUrl = `${window.location.origin}${
			window.location.pathname
		}${removeCacheBuster(window.location.search)}`;
		log.debug('Caught popstate', e, { oldUrl, newUrl });
		if (oldUrl === newUrl) {
			if (!isParentWindow()) {
				this.sendStateToParent();
			}
			return;
		}
		if (isParentWindow()) {
			log.debug('Updating iframe location');
			this.iframe.contentDocument.location.replace(window.location.href);
		} else {
			this.sendStateToParent();
		}
		this.updateLastLocation();
	}

	/**
	 * Checks a link-like HTML element for href, target, and origin
	 * @param {HTMLElement} el
	 * @returns {URL|false}
	 */
	processLink(el) {
		if (el.matches(':any-link,[data-href]')) {
			const href = el.getAttribute('href');
			const dataHref = el.getAttribute('data-href');
			const url = this.processHref(dataHref ? dataHref : href);
			const target = el.getAttribute('target');

			// No empty URLs.
			if (!url?.href) {
				return false;
			}

			// No targeted links
			if (target && target !== '_self') {
				return false;
			}

			return url;
		}

		return false;
	}

	generateUrl(href = '') {
		href = String(href);
		const url = new URL(href, window.location.origin);
		return url;
	}

	/**
	 * Checks if a string is a URL, and if so, checks for length
	 * and same origin.
	 * @param {string} href
	 * @returns {URL|false}
	 */
	processHref(href = '') {
		href = String(href);
		// no empty links!
		if (!href?.length) {
			return false;
		}

		// We don't deal with simple, same-page hashed links
		// NOTE: THIS PREVENTS HASH LINKS FROM UPDATING
		// PARENT WINDOW LOCATION! need a better way.
		if (href.charAt(0) === '#') {
			//return false;
		}

		const url = new URL(href, window.location.origin);
		if (!this.isUrlSameOrigin(url)) {
			return false;
		}

		return url;
	}

	handleClick(e) {
		let target = e.target;

		// Check if target is a link
		if (!target?.matches(':any-link,[data-href]')) {
			target = target.closest(':any-link,[data-href]');
		}

		if (!target) {
			return;
		}

		const path = e.composedPath();
		if (!path.includes(target)) {
			log.debug('Target not in path', { target, path });
			return;
		}

		const href = target.getAttribute('href');
		const dataHref = target.getAttribute('data-href');

		// Ignore empty links
		if (!href && !dataHref) {
			log.debug('Ignoring empty link', { target, href, dataHref });
			return;
		}

		const url = this.generateUrl(dataHref || href);

		if (!url) {
			log.debug('Ignoring malformed url', {
				target,
				href,
				dataHref,
				url,
			});
			return;
		}

		// Handle cross-origin links
		if (url.origin !== window.location.origin) {
			const linkTarget = target.getAttribute('target');
			if (!linkTarget || linkTarget === '_self') {
				target.setAttribute('target', '_parent');
			}
			log.debug('Pass-through cross-origin link', { target, url });
			return;
		}

		// Ignore in-page hashes
		if (
			(dataHref || href).charAt(0) === '#' ||
			(url.pathname === window.location.pathname &&
				url.search === window.location.search &&
				(url.hash.length ||
					url.href.charAt(url.href.length - 1) === '#'))
		) {
			log.debug('Ignoring in-page hash', url.hash);
			return;
		}

		e.preventDefault();
		this.updateLocation(url);
	}

	handleFormSubmitEvent(e) {
		// I think we'll handle this by altering forms themselves?
	}

	updateIframe(options) {
		const { url = window.location.href } = options;
		if (!this.iframe.src) {
			if (isParentWindow()) {
				document.body.classList.add('iframe-loading');
			}
		}
		this.iframe.contentDocument.location.replace(url);
		//window.document.body.append(this.iframe);
	}

	isUrlSameOrigin(url) {
		const newUrl = new URL(url, window.location.origin);
		if (newUrl && newUrl.origin === window.location.origin) {
			return true;
		}
		return false;
	}

	updateLocation(url) {
		const newUrl = new URL(url, window.location.origin);
		if (this.isUrlSameOrigin(newUrl)) {
			if (isParentWindow()) {
				this.updateIframe({ url: newUrl });
			} else {
				window.self.location.href = newUrl;
			}
		}
	}

	updateWindowData(data) {
		const { title = document.title, location = window.location.href } =
			data;
		if (title !== document.title) {
			document.title = title;
		}
		const newUrl = new URL(location, window.location.origin);
		if (newUrl && newUrl.href !== window.location.href) {
			log.debug('Pushing history state', newUrl);
			history.pushState({}, '', newUrl);
		}
	}
}
