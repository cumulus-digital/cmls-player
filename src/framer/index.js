const { Framer } = require('./Framer');

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

// Load all patches
function requireAll(r) {
	r.keys().forEach(r);
}
requireAll(
	/* webpackChunkName: 'framer/[request]' */
	/* webpackMode: 'lazy' */
	/* webpackPrefetch: true */
	/* webpackPreload: true */
	require.context('./patches/', true, /\.js$/)
);

const framer = new Framer();
window.cmls_player = window.cmls_player || {};
window.cmls_player.updateLocation = framer.updateLocation;
