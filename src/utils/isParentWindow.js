import config from '../config.json';

/**
 * Determine if the current window matches the configured
 * siteframe_id.
 *
 * @returns {boolean}
 */
const isParentWindow = () => {
	return window.name !== config.siteframe_id;
};

export default isParentWindow;
