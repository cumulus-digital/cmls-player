import store from 'Store';

import Logger from 'Utils/Logger';
const log = new Logger('iTunes Helper');

const SEARCH_API_URL = 'https://itunes.apple.com/search';

let last_minute = 0.0;
let requests_per_minute = 0;

/**
 * Fetch artwork from iTunes
 *
 * @param {string} artist
 * @param {string} track
 * @returns {Promise}
 */
export const fetchItunesArtwork = (artist, track) => {
	return new Promise((resolve, reject) => {
		if (!artist || !track) {
			log.warn('Must supply an artist and track', { artist, track });
			return reject();
		}

		// Create an array of artist and track strings, trimmed and filtered for null
		const term = [artist, track]
			.map((k) => (k.trim ? k.trim() : null))
			.filter((k) => k);

		// We must have both artist and track
		if (term?.length < 2) {
			log.warn('Must supply an artist and track', { artist, track });
			return reject();
		}

		let searchTerm = term.join(' ');

		searchItunes(searchTerm)
			.then((data) => {
				if (!data?.results?.length || !data.results[0]?.artworkUrl100) {
					log.debug('Failed to find artwork', data);
					return reject();
				}

				resolve(
					data.results[0].artworkUrl100.replace('100x100', '300x300')
				);
			})
			.catch((e) => {
				log.debug('Exception when searching iTunes!', e);
				return reject();
			});
	});
};

/**
 * Sanitize an iTunes search query term, removing "featuring" styles
 * and other invalid characters.
 *
 * @param {string} term
 * @returns {string}
 */
const sanitizeTerm = (term) => {
	term = decodeURIComponent(term);

	// Remove "featuring" styles and other naughty chars
	[
		/F[\.\/]+/gi,
		/\(Feat/gi,
		/ft\./gi,
		/ft[\/\\]+/gi,
		/\(/gi,
		/\/f/gi,
		/Featuring/gi,
		/Live/gi,
		/ +(?= )/g,
		/ {2,}/g,
		/\t\n\r\f\v/g,
		/\./g,
	].forEach((r) => (term = term.replace(r, '')));
	term = term.replace(/%20/g, ' ');

	return term;
};

const artCache = new Map();

export const searchItunes = (term) => {
	const { playerState } = store.getState();

	const now = new Date();
	const hour = now.getHours();
	const minutes = now.getMinutes();
	const timestamp = parseFloat(`${hour}.${minutes}`);

	if (timestamp !== last_minute) {
		last_minute = timestamp;
		requests_per_minute = 0;
	} else if (requests_per_minute > 15) {
		return false;
	} else {
		requests_per_minute++;
	}

	term = sanitizeTerm(term);

	const url = new URL(SEARCH_API_URL);
	const search = new URLSearchParams({
		term,
		country: playerState.country || 'us',
		//media: 'music', // Causes iOS requests to redirect to musics:// urls?!
		entity: 'song',
		attribute: 'mixTerm',
		limit: 1,
		lang: playerState.lang || 'en_us',
		explicit: playerState.allow_explicit_covers || 'No',
		version: 2,
	});
	url.search = search.toString();

	const controller = new AbortController();
	let abort = setTimeout(() => controller.abort(), 3000);

	return new Promise((resolve, reject) => {
		if (artCache.has(search.toString())) {
			log.debug('Loading art from local cache');
			return resolve(artCache.get(search.toString())?.data);
		}
		if (artCache.size > 60) {
			log.debug('Deleting oldest 10 items from art cache');
			Array.from(artCache.keys())
				?.sort(
					(k1, k2) =>
						artCache.get(k1).timestamp - artCache.get(k2).timestamp
				)
				?.slice(10)
				?.forEach((k) => artCache.delete(k));
		}
		log.debug('Making iTunes search request', url.search, artCache);
		fetch(url.toString(), {
			headers: {
				'Content-Type': 'application/json',
			},
			signal: controller.signal,
		})
			.then((response) => response.json())
			.then((data) => {
				if (data?.results?.length) {
					artCache.set(search.toString(), {
						data,
						timestamp: Date.now(),
					});
					return resolve(data);
				}
				return reject('No data returned');
			})
			.catch((e) => {
				return reject(e);
			})
			.finally(() => {
				clearTimeout(abort);
				abort = null;
			});
	});
};
