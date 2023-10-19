import generateIdFromString from 'Utils/generateIdFromString';

export class CuePoint {
	artist = '';
	title = '';
	track_id;
	artwork;
	type;

	constructor(conf) {
		if (conf) {
			for (let k in conf) {
				this[k] = conf[k];
			}
		}

		if (!this.track_id) {
			const label = [this.artist, this.title].filter((k) =>
				k.trim ? k.trim() : ''
			);
			this.track_id = generateIdFromString(label);
		}
	}
}
