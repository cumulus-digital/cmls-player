import store from 'Store';
import { CuePoint } from 'Store/CuePoint';

import Logger from 'Utils/Logger';
const log = new Logger('Triton SDK / CuePointHandler');

import { SDK } from 'SDK';

export default class CuePointHandler {
	parent;

	adBreakTimeouts = {};

	constructor(parent) {
		this.parent = parent;
		if (!this.parent?.getPlayer()) {
			throw new Error('CuePointHandler instantiated without player.');
		}
	}

	onReady(player) {
		const listeners = {
			'track-cue-point': this.onTrackCuePoint.bind(this),
			'speech-cue-point': this.onSpeechCuePoint.bind(this),
			'custom-cue-point': this.onCustomCuePoint.bind(this),
			'ad-break-cue-point': this.onAdBreakCuePointStart.bind(this),
			'ad-break-cue-point-complete':
				this.onAdBreakCuePointComplete.bind(this),
		};

		for (let ev in listeners) {
			log.debug(
				'Attaching listener',
				{ event: ev, callback_name: listeners[ev].name },
				listeners[ev]
			);
			player.addEventListener(ev, listeners[ev]);
		}
	}

	generateCuePoint(data) {
		const cueData = {
			artist: data?.artistName,
			title: data?.cueTitle,
			type: data?.type,
			track_id: data?.trackId,
		};
		return cueData;
	}

	getMountFromCueData(data) {
		if (!data) {
			return -1;
		}

		const mount = data?.mount;
		if (!mount) {
			return -2;
		}

		return mount;
	}

	sendCuePointEvent(mount, cue, origin_event) {
		SDK.emitEvent('cue-point', {
			mount,
			cuepoint: cue,
			event: origin_event,
		});
	}

	onTrackCuePoint(e) {
		const cueData = e?.data?.cuePoint;

		const logExtra = { event: e };

		const mount = this.getMountFromCueData(cueData);
		if (mount === -1) {
			log.warn(
				'Received a live track cue point without cuePoint data!',
				logExtra
			);
			return;
		}
		if (mount === -2) {
			log.warn(
				'Received a live track cue point without a mount!',
				logExtra
			);
		}

		log.debug('Live track cue point received', logExtra);

		const cuePoint = new CuePoint(this.generateCuePoint(cueData));

		this.sendCuePointEvent(mount, cuePoint, e);

		SDK.setCuePoint({ mount, cue: cuePoint });
		this.clearAdBreakTimeout(mount);
	}

	onSpeechCuePoint(e) {
		const cueData = e?.data?.cuePoint;

		const logExtra = { event: e };

		const mount = this.getMountFromCueData(cueData);
		if (mount === -1) {
			log.warn(
				'Received a live speech cue point without cuePoint data!',
				logExtra
			);
			return;
		}

		if (mount === -2) {
			log.warn(
				'Received a live speech cue point without a mount!',
				logExtra
			);
			return;
		}

		log.debug('Live speech cue point received', logExtra);

		const cuePoint = new CuePoint({
			...this.generateCuePoint(cueData),
			type: CuePoint.types.SPEECH,
		});

		this.sendCuePointEvent(mount, cuePoint, e);

		SDK.setCuePoint({ mount, cue: cuePoint });
		this.clearAdBreakTimeout(mount);
	}

	onCustomCuePoint(e) {
		const cueData = e?.data?.cuePoint;
		const logExtra = { event: e };

		const mount = this.getMountFromCueData(cueData);
		if (mount === -1) {
			log.warn(
				'Received a custom cue point without cuePoint data!',
				logExtra
			);
			return;
		}

		if (mount === -2) {
			log.warn('Received a custom cue point without a mount!', logExtra);
			return;
		}

		log.debug(
			'Custom cue point received. Cue display will be reset.',
			logExtra
		);

		SDK.setCuePoint({ mount, cue: false });

		this.clearAdBreakTimeout(mount);
	}

	parseCueDuration(duration) {
		if (Number.isInteger(duration)) {
			return duration;
		}
	}

	onAdBreakCuePointStart(e) {
		const { playerState } = store.getState();

		const station = playerState.stations[playerState.playing];
		if (!station) {
			log.warn(
				'Received an ad break cue point without a playing station!',
				{
					event: e,
					playerState,
				}
			);
			return;
		}

		if (e?.data?.cuePoint?.adType === 'endbreak') {
			log.debug(
				'Ad break start received with adType "endbreak", ignoring and resetting cue point.',
				{
					mount: station.mount,
					event: e,
				}
			);
			SDK.setCuePoint({ mount: station.mount });
			return;
		}

		log.debug('Ad break start', {
			mount: station.mount,
			event: e,
			isVastInStream: e?.data?.adBreakData?.isVastInStream,
		});

		if (e?.data?.adBreakData?.isVastInStream === false) {
			log.info('Found an ad break with isVastInStream: false!', {
				mount: station.mount,
				event: e,
			});
		} else {
			log.debug(
				'Ad break isVastInStream',
				e.data.adBreakData.isVastInStream
			);
		}

		const cuePoint = {
			artist: station?.name || 'Ad Break',
			title: "We'll return after these messages",
			track_id: e?.data?.cuePoint?.adId || Date.now(),
			type: CuePoint.types.AD,
		};

		SDK.setCuePoint({
			mount: station.mount,
			cue: cuePoint,
		});

		// Infer a cue point end
		this.clearAdBreakTimeout(station.mount);
		if (e?.data?.cuePoint?.cuePointDuration) {
			const duration = this.parseCueDuration(
				e.data.cuePoint.cuePointDuration
			);
			if (duration) {
				log.debug('Using ad break cue duration for inferred complete', {
					mount: station.mount,
					event: e,
					duration,
				});
				this.adBreakTimeouts[station.mount] = setTimeout(() => {
					log.debug('Inferring ad break complete.', {
						mount: station.mount,
						previous_event: e,
					});
					SDK.setCuePoint({ mount: station.mount, cue: false });
				}, duration);
			} else {
				log.debug('Failed to parse ad break duration', {
					mount: station.mount,
					event: e,
					duration,
				});
			}
		}
	}

	onAdBreakCuePointComplete(e) {
		const { playerState } = store.getState();

		const station = playerState.stations[playerState.playing];
		if (!station) {
			log.warn(
				'Received an ad break end cue point without a playing station!',
				{
					event: e,
					playerState,
				}
			);
			return;
		}

		this.clearAdBreakTimeout(station.mount);

		if (
			playerState.cuepoints?.[station.mount]?.type !== CuePoint.types.AD
		) {
			log.warn(
				'Received ad break cue point complete that did not follow an ad!',
				{
					mount: station.mount,
					event: e,
					current_cue: playerState.cuepoints[station.mount],
				}
			);
			return;
		}

		log.debug('Ad break complete', {
			mount: station.mount,
			event: e,
			playerState,
		});

		SDK.setCuePoint({ mount: station.mount });
	}

	clearAdBreakTimeout(mount) {
		if (this.adBreakTimeouts[mount]) {
			clearTimeout(this.adBreakTimeouts[mount]);
			this.adBreakTimeouts[mount] = null;
		}
	}
}
