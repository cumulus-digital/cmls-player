import Logger from 'Utils/Logger';
import { Framer } from '../Framer';

const log = new Logger('Framer / Patch / Headway Mobile Menu');

/**
 * Strips existing event handlers from Headway Mobile Select navs
 * and adds our own change handler to process navigation.
 */
export default class HeadwayMobileMenu {
	/**
	 * @type {Framer}
	 */
	framer;

	/**
	 * @param {Framer} framer
	 */
	constructor(framer) {
		this.framer = framer;

		this.framer.addListeners({
			load: this.init.bind(this),
		});
	}

	init() {
		const selectnavs = document.querySelectorAll('select.selectnav');
		if (selectnavs) {
			selectnavs.forEach((nav) => {
				if (nav.hasAttribute('cmls-player-processed')) return;

				log.debug('Rebuilding change handler for nav', nav);
				const newNav = nav.cloneNode(true);
				nav.parentNode.replaceChild(newNav, nav);

				newNav.addEventListener('change', this.handleChange.bind(this));

				newNav.setAttribute('cmls-player-processed', true);
			});
		}
	}

	handleChange(ev) {
		// I don't think we need to do this, but Frankly does
		// http://www.quirksmode.org/js/events_properties.html
		if (!ev) ev = window.event;
		let target = ev?.target
			? ev.target
			: ev?.srcElement
			? ev.srcElement
			: null;
		if (target.nodeType === 3) target = target.parentNode;
		if (!target) return;

		const destination = target.value;
		log.debug('Caught change', {
			destination,
			event: ev,
		});

		try {
			const url = this.framer.testLink(destination);

			ev.preventDefault();
			ev.stopImmediatePropagation();

			if (this.framer.isChildWindow()) {
				window.location.href = url.href;
			} else {
				this.framer.parent.navigateTo(url);
			}
		} catch (e) {
			log.debug(e);
			if (e instanceof this.framer.linkErrors.CROSS_ORIGIN) {
				ev.preventDefault();
				ev.stopImmediatePropagation();

				log.debug('Passing cross-origin destination to main window', {
					destination,
				});
				if (this.framer.isChildWindow()) {
					window.parent.location.href = destination;
				} else {
					window.location.href = destination;
				}
			}
			if (e instanceof this.framer.linkErrors.SAME_PAGE_HASH) {
				ev.preventDefault();
				ev.stopImmediatePropagation();

				log.debug('Destination is a same-page hash', { destination });
				window.location.hash = e.message;
			}
		}

		return;

		// Ignore empty values
		if (!destination) {
			log.debug('Ignoring empty destination', {
				destination,
				event: ev,
			});
			return;
		}

		const url = this.framer.getUrlObject(destination);

		if (!url) {
			log.debug('Destination generates malformed URL', {
				destination,
				url,
				event: ev,
			});
			return;
		}

		// cross-origin links go to main window
		if (this.framer.isCrossOrigin(url)) {
			log.debug('Passing cross-origin destination to main window', {
				destination,
				url,
				event: ev,
			});
			if (this.framer.isChildWindow()) {
				window.parent.location.href = url.href;
			} else {
				window.location.href = url.href;
			}
			ev.preventDefault();
			return;
		}

		// Handle in-page hashes
		if (this.framer.isSamePageHash(url)) {
			log.debug('Destination is a same-page hash link', {
				destination,
				url,
				event: ev,
			});
			window.location.hash = url.hash;
			ev.preventDefault();
			return;
		}

		// ALL OTHER CASES
		ev.preventDefault();
		ev.stopImmediatePropagation();

		if (this.framer.isChildWindow()) {
			window.location.href = url.href;
		} else {
			this.framer.parent.navigateTo(url);
		}
	}
}
