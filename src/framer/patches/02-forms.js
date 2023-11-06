import { Framer } from '../Framer';

import config from 'Config';
const { siteframe_id } = config;

import Logger from 'Utils/Logger';
const log = new Logger('Framer / Patch / AlterFormTargets');

/**
 * Update the target on all form elements to point to our iframe
 */
export default class AlterFormTargets {
	framer;

	/**
	 * @param {Framer} framer
	 */
	constructor(framer) {
		this.framer = framer;
	}

	init() {
		const forms = window.document.querySelectorAll('form');
		if (forms) {
			forms.forEach((form) => {
				const target = form.target;
				if (!target || target === '_self') {
					log.debug('Setting form target to siteframe', {
						siteframe_id,
						form,
					});
					form.target = siteframe_id;
				}
			});
		}
	}
}
