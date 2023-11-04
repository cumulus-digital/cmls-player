import Logger from 'Utils/Logger';
import { Framer } from '../Framer-old';

const log = new Logger('Framer / Patch / Headway Mobile Menu');

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
	}

	init() {
		const selectnavs = document.querySelectorAll('select.selectnav');
		if (selectnavs) {
			selectnavs.forEach((nav) => {
				log.debug('Altering change handler for nav', nav);
				const newNav = nav.cloneNode(true);
				nav.parentNode.replaceChild(newNav, nav);
				newNav.addEventListener('change', (ev) => {
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
						log.debug(
							'Passing cross-origin destination to main window',
							{ destination, url, event: ev }
						);
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
					window.location.href = url.href;
				});
			});
		}
	}

	/*
	init() {
		const selectnavs = document.querySelectorAll('select.selectnav');
		if (selectnavs) {
			selectnavs.forEach((nav) => {
				log.debug('Altering change handler for nav', nav);
				const newNav = nav.cloneNode(true);
				nav.parentNode.replaceChild(newNav, nav);
				newNav.addEventListener('change', (e) => {
					// I don't think we need to do this, but Frankly does
					// http://www.quirksmode.org/js/events_properties.html
					let destination;
					if (!e) e = window.event;
					if (e?.target) destination = e.target;
					else if (e.srcElement) destination = e.srcElement;
					if (destination.nodeType === 3)
						destination = destination.parentNode;

					log.debug('Caught change', {
						destination: destination.value,
						e,
						generateUrl: this.parent?.generateUrl,
					});

					// ignore empty values
					if (!destination.value) {
						log.debug('Ignoring empty destination', {
							destination: destination.value,
							url,
						});
						return;
					}

					const url = this.parent.getUrlObject(destination.value);

					log.debug('Evaluating', url);

					// Ignore malformed urls
					if (!url) {
						log.debug('Ignoring malformed url', {
							destination: destination.value,
							url,
						});
						return;
					}

					// handle cross-domain
					if (this.parent.isCrossOrigin(url)) {
						log.debug('Handling cross-domain destination', url);
						if (isParentWindow()) {
							window.location.href = url.href;
						} else {
							window.parent.location.href = url.href;
						}
						e.preventDefault();
						e.stopImmediatePropagation();
						return;
					}

					// Handle in-page hashes
					if (this.parent.isSamePageHash(destination.value)) {
						log.debug('Handling in-page hash destination', url);
						if (isParentWindow()) {
							window.location.hash = url.hash;
						} else {
							window.parent.location.hash = url.hash;
						}
						e.preventDefault();
						e.stopImmediatePropagation();
						return;
					}

					e.preventDefault();
					e.stopPropagation();
					e.stopImmediatePropagation();
					log.debug('Handling destination', url);
					this.parent.updateLocation(url.href);
				});
			});
		}
	}
	*/
}
