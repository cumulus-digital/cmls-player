export class Station {
	mount;
	name;
	tagline;
	logo;
	vast;
	primary = false;
	fetch_nowplaying = true;
	unresolved_nowplaying_requests = 0;
	last_cuepoint = 0;
	order = Number.MAX_SAFE_INTEGER;

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
