import domReady from 'Utils/domReady';

import Logger from 'Utils/Logger';
const log = new Logger('Framer / Child');

export default class Child {
	framer;

	constructor(framer) {
		this.framer = framer;
		this.init();
	}

	init() {
		log.debug('Initializing child');

		this.framer.addListeners(
			{
				readystatechange: this.sendStateToParent.bind(this),
				DOMContentLoaded: this.sendStateToParent.bind(this),
				click: this.handleClick.bind(this),
			},
			document
		);

		this.framer.addListeners({
			popstate: this.sendStateToParent.bind(this),
		});

		this.sendStateToParent();
	}

	sendStateToParent() {
		const state = {
			message: this.framer.messageKey,
			readystate: document.readyState,
			title: document.title,
			location: window.self.location.href,
		};
		log.debug('Sending state to parent', state);
		window.parent.postMessage(state, window.location.originframe);
	}

	handleClick(ev) {
		let target = ev.target;

		// Ensure target is link-like
		if (!target?.matches(':any-link[href],[data-href]')) {
			target = target.closest(':any-link[href],[data-href]');
		}

		if (!target) {
			log.debug('Click target is not actionable', { target, event: ev });
			return;
		}

		const path = ev.composedPath();
		if (!path.includes(target)) {
			log.debug('Click target not in event path', {
				target,
				path,
				event: ev,
			});
			return;
		}

		// Ignore links with targets
		if (target.target) {
			log.debug('Ignoring targeted link', { target, event: ev });
			return;
		}

		const href = this.framer.getResolvedHref(target);

		// ignore empty links
		if (!href || !href.length) {
			log.debug('Click target has an empty destination', {
				target,
				href,
			});
			return;
		}

		const url = this.framer.getUrlObject(href);

		if (!url) {
			log.debug('Click target generates malformed URL', {
				target,
				href,
				url,
			});
			return;
		}

		// Cross-origin links go to parent
		if (this.framer.isCrossOrigin(url)) {
			log.debug('Sending cross-origin link to parent', {
				target,
				href,
				url,
			});
			target.target = '_parent';
			return;
		}
	}
}
