export class Station {
	mount;
	name;
	tagline;
	logo;
	vast;
	primary = false;
	fetch_nowplaying = true;
	unresolved_nowplaying_requests = 0;
	last_track_cuepoint = 0;
	last_unresolved_cuepoint = 0;
	order = Number.MAX_SAFE_INTEGER;

	/**
	 *
	 * @param {object} conf
	 * @param {string} conf.mount
	 * @param {string?} conf.name
	 * @param {string?} conf.tagline
	 * @param {string?} conf.logo URL
	 * @param {string?} conf.vast Vast ad URL
	 * @param {boolean?} conf.primary
	 * @param {boolean?} conf.fetch_nowplaying
	 * @param {int?} conf.order
	 */
	constructor(conf) {
		if (conf) {
			for (let k in conf) {
				this[k] = conf[k];
			}
		}

		if (!this.mount) {
			throw new Error('Station must have a mount.', this);
		}
	}
}
