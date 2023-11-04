import { Framer } from './Framer';

import(
	/* webpackChunkName: 'framer' */
	/* webpackMode: 'lazy' */
	/* webpackPrefetch: true */
	/* webpackPreload: true */
	'./styles.scss'
).then((style) => {
	if (style?.default?.use) {
		style.default.use();
	}
});

const framer = new Framer();
window.cmls_player = window.cmls_player || {};
window.cmls_player.updateLocation = framer.updateLocation;
