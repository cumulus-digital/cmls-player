import store from 'Store';

import Logger from 'Utils/Logger';
const log = new Logger('iTunes Helper');

const SEARCH_API_URL = 'https://itunes.apple.com/search';

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
			.map((k) => {
				if (typeof k === 'string' || k instanceof String) {
					k.trim();
				} else if (typeof k !== 'undefined') {
					String(k).trim();
				} else {
					k = null;
				}
				return k;
			})
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

				resolve(data.results[0].artworkUrl100);
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

export const searchItunes = (term) => {
	const { playerState } = store.getState();

	term = sanitizeTerm(term);

	const url = new URL(SEARCH_API_URL);
	url.search = new URLSearchParams({
		term,
		country: playerState.country || 'us',
		media: 'music',
		entity: 'song',
		attribute: 'songTerm',
		limit: 1,
		lang: playerState.lang || 'en_us',
		explicit: playerState.allow_explicit_covers || 'No',
		version: 2,
	}).toString();

	const controller = new AbortController();
	let abort = setTimeout(() => controller.abort(), 3000);
	return new Promise((resolve, reject) => {
		fetch(url, { signal: controller.signal })
			.then((response) => response.json())
			.then((data) => {
				if (data?.results?.length) {
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
