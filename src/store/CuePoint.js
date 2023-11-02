import generateIdFromString from 'Utils/generateIdFromString';

export class CuePoint {
	artist = '';
	title = '';
	track_id;
	artwork;

	static types = {
		TRACK: 'track',
		OFFLINE_TRACK: 'offline-track',
		SPEECH: 'speech',
		AD: 'ad',
		VANITY: 'vanity',
	};

	type = CuePoint.types.VANITY;

	/**
	 *
	 * @param {object} conf
	 * @param {string?} conf.artist
	 * @param {string?} conf.title
	 * @param {string?} conf.artwork Artwork URL
	 * @param {string?} conf.type
	 */
	constructor(conf) {
		this.artist = conf?.artist || '';
		this.title = conf?.title || '';
		this.artwork = conf?.artwork || undefined;
		this.type = conf?.type || undefined;

		this.track_id =
			conf?.track_id ||
			CuePoint.generateTrackId(conf?.artist, conf?.title);
	}

	/**
	 * @param {string} newType
	 */
	set type(newType) {
		if (!newType || !Object.values(CuePoint.types).includes(newType)) {
			console.warn('Cuepoint constructed with an invalid type', conf[k]);
			this.type = CuePoint.types.VANITY;
		} else {
			this.type = newType;
		}
	}

	get track_id() {
		if (!this.track_id) {
			this.track_id = CuePoint.generateTrackId(this.artist, this.title);
		}
		return this.track_id;
	}

	/**
	 * @param {string} newId
	 */
	set track_id(newId) {
		this.track_id = newId;
	}

	/**
	 * Generate a new track ID from the artist and title
	 * @returns {string}
	 */
	static generateTrackId(artist = this.artist, title = this.title) {
		const label = [artist, title]
			.filter((k) => (k?.trim ? k.trim() : ''))
			.join(' – ');
		const track_id = label ? generateIdFromString(label) : Date.now();
		return track_id;
	}
}
