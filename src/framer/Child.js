import domReady from 'Utils/domReady';

import Logger from 'Utils/Logger';
import { Framer } from './Framer';
const log = new Logger('Framer / Child');

export default class Child {
	/**
	 * @type {Framer}
	 */
	framer;

	/**
	 * @type {MutationObserver}
	 */
	titleObserver;

	ready = false;

	constructor(framer) {
		this.framer = framer;

		if (!this.framer.isChildWindow()) {
			log.warn('Child class instantiated outside of child window!');
			return;
		}

		log.debug('Initializing Child');

		this.framer.addListeners({
			readystatechange: this.onStateChange.bind(this),
			DOMContentLoaded: () => {
				if (window.location.hash) {
					const hashEl = document.querySelector(window.location.hash);
					if (hashEl) {
						hashEl.scrollIntoView();
					}
				}
			},
		});

		this.framer.addListeners({
			hashchange: this.sendFullState.bind(this),
			click: this.handleClick.bind(this),
		});
		if (!this.titleObserver) {
			const title = document.querySelector('head title');
			this.titleObserver = new MutationObserver(
				this.onStateChange.bind(this)
			);
			this.titleObserver.observe(title, {
				subtree: true,
				characterData: true,
				childList: true,
			});
		}

		window.parent.postMessage({
			message: `${this.framer.messageKey}:hideLoading`,
		});
		this.sendFullState();
		this.ready = true;
	}

	sendFullState() {
		const state = {
			message: `${this.framer.messageKey}:stateChange`,
			readystate: document.readyState,
			url: window.self.location.href,
			title: document.title,
		};
		log.debug('Sending state to parent', state);
		window.parent.postMessage(state, window.location.origin);
	}

	onStateChange(ev) {
		if (!this.ready) {
			this.sendFullState();
			this.ready = true;
		}
		document.removeEventListener(
			'readystatechange',
			this.onStateChange.bind(this)
		);
	}

	handleClick(ev) {
		let target = ev.target;
		const linkLike = ':any-link[href],[data-cmls-href]';

		if (!target?.matches(linkLike)) {
			target = target.closest(linkLike);
		}

		if (!target) {
			return;
		}

		try {
			const url = this.framer.testLink(
				this.framer.getResolvedHref(target)
			);

			// Handle data-cmls-href
			if (target.getAttribute('data-cmls-href')) {
				ev.preventDefault();
				window.location.href = url.href;
			}

			// Anything else gets passed through
		} catch (e) {
			if (e instanceof this.framer.linkErrors.CROSS_ORIGIN) {
				if (!target.target || target.target === '_self') {
					log.debug(
						'Setting cross-origin link target to parent',
						target
					);
					target.target = '_parent';
				}
			}
		}

		return;

		const href = this.framer.getResolvedHref(target);

		// Ignore empty links
		if (!href?.length) {
			log.debug('Target destination is empty', { target, href });
			return;
		}

		const url = this.framer.getUrlObject(href);

		if (!url) {
			log.debug('Target destination generates malformed URL', {
				target,
				href,
			});
			return;
		}

		// Untargeted, cross-origin links go to parent
		if (
			url.origin !== window.location.origin &&
			(!target.target || target === '_self')
		) {
			log.debug('Setting cross-origin link target to parent', {
				target,
				href,
				url,
			});
			target.target = '_parent';
			return;
		}

		// Ignore targets with target attributes
		if (target.target) {
			log.debug('Ignoring targeted link', { target });
			return;
		}

		// Handle data-cmls-href
		if (target.getAttribute('data-cmls-href')) {
			window.location.href = url.href;
		}
	}
}
