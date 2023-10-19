import config from '../config.json';

/**
 * Determine if we are loaded in a cmls-page-transition frame.
 *
 * @returns {boolean}
 */
const isParentWindow = () => {
	return window.name !== config.siteframe_id;
};

export default isParentWindow;
