import { h } from 'Utils/createElement';
import { Framer } from './Framer';
import domReady from 'Utils/domReady';

import config from 'Config';
const { siteframe_id, siteframe_loading_id } = config;

import Logger from 'Utils/Logger';
const log = new Logger('Framer / Parent');

export default class Parent {
	/**
	 * @type {Framer}
	 */
	framer;

	usingIframe = false;

	constructor(framer) {
		this.framer = framer;

		if (this.framer.isChildWindow()) {
			log.warn('Parent class instantiated inside child window!');
			return;
		}

		log.debug('Initializing Parent');

		this.framer.loadingIndicator = (
			<div id={siteframe_loading_id} class="do-not-remove">
				<div id="js8d">
					{Array.from(Array(5).keys()).map((i) => (
						<div />
					))}
				</div>
			</div>
		);

		document.body.append(this.framer.loadingIndicator);

		this.framer.addListeners({
			click: this.handleClick.bind(this),
			message: this.handleMessage.bind(this),
			popstate: this.handlePopState.bind(this),
		});
	}

	handleClick(ev) {
		let target = ev.target;
		const linkLike = ':any-link[href],[data-cmls-href]';

		if (!target) {
			log.debug('No target!', { event: ev });
			return;
		}

		// Ensure target is link-like
		if (!target.matches(linkLike)) {
			target = target.closest(linkLike);
		}

		if (!target) {
			return;
		}

		const href = this.framer.getResolvedHref(target);

		// Ignore empty links
		if (!href?.length) {
			log.debug('Click target destination is empty', { target, href });
			return;
		}

		const url = this.framer.getUrlObject(href);

		if (!url) {
			log.debug('Click target destination generates malformed URL', {
				target,
				href,
			});
			return;
		}

		// Ignore cross-origin links
		if (url.origin !== window.location.origin) {
			log.debug('Passing through cross-origin link', { target, url });
			return;
		}

		log.debug('Navigating to target destination', { target, href, url });
		ev.preventDefault();
		this.navigateTo(url);
	}

	navigateTo(url) {
		url = this.framer.getUrlObject(url);
		const currentState = history.state;
		if (!currentState || currentState.url !== url.href) {
			this.loadIframe(url);
		}
	}

	clearBody() {
		log.debug('Removing elements that do not specify .do-not-remove');
		document.querySelectorAll('body > *').forEach((el) => {
			if (
				el.id === siteframe_id ||
				el.className.includes('do-not-remove')
			) {
				return;
			}
			el.remove();
		});
	}

	loadIframe(url) {
		url = this.framer.getUrlObject(url);

		this.framer.showLoading();

		if (!this.framer.iframe) {
			log.debug('Generating iframe', url.href);
			this.framer.iframe = (
				<iframe
					id={siteframe_id}
					name={siteframe_id}
					src={url.href}
					loading="eager"
					width="0"
					height="0"
					frameborder="0"
					class="do-not-remove"
					aria-hidden="false"
					aria-label="Loading content..."
				/>
			);
			document.body.append(this.framer.iframe);
			this.framer.iframe.addEventListener('load', () => {
				this.framer.iframe.contentWindow.addEventListener(
					'error',
					(e) => {
						log.debug('Error!', e);
						this.framer.hideLoading();
					}
				);
			});
		} else {
			const cw = this.framer.iframe.contentWindow;
			if (!cw) {
				log.error('Could not access iframe!');
				throw new Error('Could not access iframe!');
			}
			log.debug('Replacing iframe url', url.href);
			cw.location.replace(url);
			//cw.location.href = url;
			//this.framer.iframe.src = url;
			cw.history.replaceState({}, '', url);
		}
	}

	pushHistory(url) {
		url = this.framer.getUrlObject(url);
		const currentState = history.state;
		log.debug('Current state', Object.assign({}, currentState));
		if (!currentState || currentState.url !== url.href) {
			log.debug('Pushing new history state', url.href);
			history.pushState({ url: url.href }, '', url);
		}
	}

	replaceHistory(url) {
		url = this.framer.getUrlObject(url);
		log.debug('Replacing state', url.href);
		history.replaceState({ url: url.href }, '', url);
	}

	handleMessage(ev) {
		if (
			ev.source !== this.framer?.iframe?.contentWindow ||
			ev.data?.message?.indexOf(this.framer.messageKey) !== 0
		) {
			log.debug('Ignoring message', {
				sourceMatch: ev.source === this.framer?.iframe?.contentWindow,
				messageKeyMatch:
					ev.data?.message?.indexOf(this.framer.messageKey) === 0,
				event: ev,
			});
			return;
		}

		document.body.classList.add('iframe-loaded');

		const msg = ev.data.message.substring(
			this.framer.messageKey.length + 1
		);
		log.debug('Caught message', msg, ev.data);
		switch (msg) {
			case 'stateChange':
				const { url = null, title = null } = ev.data;
				if (url) {
					this.framer.hideLoading();
					if (this.wasPopState) {
						this.wasPopState = false;
					} else {
						if (this.usingIframe) {
							this.replaceHistory(url);
						} else {
							this.pushHistory(url);
						}
					}
				}
				if (title && title !== document.title) {
					document.title = title;
					this.framer.iframe.setAttribute('title', title);
				}
				break;
			case 'showLoading':
				this.framer.showLoading();
				break;
		}
		if (!this.usingIframe) {
			this.usingIframe = true;
			this.clearBody();
		}
	}

	handlePopState(ev) {
		log.debug('Caight popstate', ev, window.location.href);
		this.wasPopState = true;
		this.loadIframe(window.location.href);
	}
}
