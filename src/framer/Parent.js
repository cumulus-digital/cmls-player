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

	useFrame = false;
	isPopState = false;

	constructor(framer) {
		this.framer = framer;
		this.init();
	}

	init() {
		log.debug('Initializing parent');

		this.framer.iframe = (
			<iframe
				id={siteframe_id}
				name={siteframe_id}
				width={0}
				height={0}
				frameborder={0}
				class="do-not-remove"
			/>
		);
		this.framer.loadingIndicator = (
			<div id={siteframe_loading_id} class="do-not-remove">
				<div id="js8d">
					{Array.from(Array(5).keys()).map((i) => (
						<div />
					))}
				</div>
			</div>
		);

		document.body.append(this.framer.iframe, this.framer.loadingIndicator);

		this.framer.addListeners({
			message: this.handleMessage.bind(this),
			popstate: this.handlePopState.bind(this),
			click: this.handleClick.bind(this),
		});
	}

	clearBody() {
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

	updateWindowState(state) {
		if (this.isPopState) {
			return;
		}

		const { title = document.title, location = window.location.href } =
			state;

		if (title !== document.title) {
			log.debug('Updating parent title', {
				was: document.title,
				now: title,
			});
			document.title = title;
		}

		const url = this.framer.getUrlObject(location);
		if (url?.href !== window.location.href) {
			log.debug('Updating parent location', {
				was: window.location.href,
				now: url.href,
			});
			history.pushState(null, '', url.href);
		}
	}

	handleMessage(ev) {
		const classList = document.body.classList;
		if (
			ev.source !== this.framer.iframe?.contentWindow ||
			ev.data?.message !== this.framer.messageKey
		) {
			return;
		}

		if (this.isPopState) {
			classList.remove('iframe-loading');
			return;
		}

		classList.remove('iframe-loading');
		classList.add('iframe-loaded');

		if (ev.data?.readystate === 'complete') {
			this.framer.iframe.contentDocument.close();
		}
		this.updateWindowState({
			title: ev.data?.title,
			location: ev.data?.location,
		});

		this.clearBody();
		this.useFrame = true;
		this.isPopState = false;
	}

	handlePopState(ev) {
		if (this.useFrame === false) {
			log.debug('Not in frame yet, ignoring popstate', { event: ev });
			return;
		}

		log.debug('Caught parent popstate', {
			location: window.location.href,
			event: ev,
		});

		this.isPopState = true;
		this.updateChildLocation(window.location.href);
	}

	handleClick(ev) {
		let target = ev.target;

		// Ensure target is link-like
		if (!target?.matches(':any-link[href],[data-href]')) {
			target = target.closest(':any-link[href],[data-href]');
		}

		if (!target) {
			log.debug('Click target is not actionable', target);
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

		// Ignore cross-origin links
		if (this.framer.isCrossOrigin(url)) {
			log.debug('Passing through cross-origin link', { target, url });
			return;
		}

		// Ignore hash links to the same page
		if (this.framer.isSamePageHash(url)) {
			log.debug('Ignoring same-page hash link.', { target, url });
			return;
		}

		log.debug('Handing click target to iframe', {
			href,
			target,
			event: ev,
		});
		ev.preventDefault();
		this.updateChildLocation(url);
	}

	updateChildLocation(url) {
		url = this.framer.getUrlObject(url);
		if (this.framer.isCrossOrigin(url)) {
			log.debug('Ignoring cross-origin link', url);
			return;
		}

		this.framer.iframe.contentDocument.open();
		this.framer.iframe.focus();
		document.body.classList.add('iframe-loaded', 'iframe-loading');
		const cdl = this.framer.iframe?.contentDocument?.location;
		if (cdl) {
			log.debug('Using CDL', this.framer.iframe);
			if (this.framer.isSamePageHash(url, cdl)) {
				cdl.hash = url.hash;
			} else {
				cdl.replace(url);
			}
		} else {
			log.debug('Using iframe src', this.framer.iframe);
			this.framer.iframe.src = url;
		}
		if (!this.useFrame) {
			this.clearBody();
			this.useFrame = true;
		}
	}
}
