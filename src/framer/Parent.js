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

	currentUrl = window.location.href;

	firstIframeLoad = false;
	ignoreNextPopState = false;

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

		try {
			const url = this.framer.testLink(
				this.framer.getResolvedHref(target)
			);

			log.debug('Navigating to target destination', { target, url });
			ev.preventDefault();
			this.navigateTo(url);
		} catch (e) {
			if (e instanceof this.framer.linkErrors.SAME_PAGE_HASH) {
				log.debug('Handling same-page hash', {
					target,
					error: e.message,
				});

				ev.preventDefault();

				// Hash changes cause a popstate, we need to ignore it
				this.ignoreNextPopState = true;
				const oldHref = window.location.href;
				window.location.hash = e.message;
				history.replaceState(
					{ url: oldHref },
					'',
					window.location.href
				);
			} else {
				log.debug('Passing through target', {
					target,
					error: e.message,
				});
			}
		}
	}

	navigateTo(url) {
		url = this.framer.getUrlObject(url);
		if (this.currentUrl !== url.href) {
			log.debug('navigateTo', url.href);
			this.loadIframe(url);
			//this.currentUrl = url.href;
		}
		/*
		const currentState = history.state;
		if (!currentState || currentState.url !== url.href) {
			this.loadIframe(url);
		}
		*/
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
		if (url.href !== this.currentUrl) {
			const currentState = history.state;
			log.debug('Current state', Object.assign({}, currentState));
			if (!currentState || currentState.url !== url.href) {
				log.debug('Pushing new history state', url.href);
				history.pushState({ url: url.href }, '', url);
			}
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

					// Don't alter history for popstate changes
					if (this.wasPopState) {
						this.wasPopState = false;
					} else {
						if (this.firstIframeLoad) {
							this.replaceHistory(url);
						} else {
							this.pushHistory(url);
						}

						if (!this.firstIframeLoad) {
							this.firstIframeLoad = true;
							this.clearBody();
						}
					}
					this.currentUrl = url;
				}
				if (title && title !== document.title) {
					document.title = title;
					this.framer.iframe.setAttribute('title', title);
				}
				break;
			case 'showLoading':
				this.framer.showLoading();
				break;
			case 'hideLoading':
				this.framer.hideLoading();
				break;
		}
	}

	handlePopState(ev) {
		if (this.ignoreNextPopState) {
			log.debug('Ignoring popstate', { event: ev });
			this.ignoreNextPopState = false;
			return;
		}

		log.debug('Caight popstate', {
			event: ev,
			wlh: window.location.href,
			currentUrl: this.currentUrl,
		});
		if (window.location.href !== this.currentUrl) {
			this.wasPopState = true;
			const url = window.location.href;
			//this.currentUrl = window.location.href;
			const cw = this.framer.iframe.contentWindow;
			if (!cw) {
				log.error('Could not access iframe!');
				throw new Error('Could not access iframe!');
			}
			log.debug('Popstate replacing iframe url', url);
			cw.location.replace(url);
		}
	}
}
