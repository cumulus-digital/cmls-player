let unloadCue = [];

const addToCue = (cue, action, priority = 10) => {
	if (typeof action === 'function') {
		cue.push({
			action,
			priority,
		});
	} else {
		console.warn('Attempted to add non-function to cue', {
			action,
			priority,
		});
	}
};

const removeFromCue = (cue, action) => {
	return cue.filter((item) => cue.action !== action);
};

const runActions = (cue) => {
	const sortedCue = cue.sort((a, b) => a.priority - b.priority);
	sortedCue.forEach(({ action }) => {
		if (typeof action === 'function') action();
	});
};

/**
 * Add a function to run at "pagehide" event. Actions are run
 * by ascending order of their priority.
 *
 * @param {Function} action
 * @param {int} priority Default 10
 */
export const addUnloadAction = (action, priority = 10) =>
	addToCue(unloadCue, action, priority);

/**
 * Remove the specified function from the unload cue. Functions
 * are referenced by their signature.
 *
 * @param {Function} action
 */
export const removeUnloadAction = (action) => {
	unloadCue = removeFromCue(unloadCue, action);
};

window.addEventListener('pagehide', () => runActions(unloadCue));

let reloadCue = [];

/**
 * Add a function to run at "pageshow" event. Actions are run
 * by ascending order of their priority.
 *
 * @param {Function} action
 * @param {int} priority
 */
export const addReloadAction = (action, priority = 10) =>
	addToCue(reloadCue, action, priority);

/**
 * Remove the specified function from the reload cue. Functions
 * are referenced by their signature.
 *
 * @param {Function} action
 */
export const removeReloadAction = (action) => {
	reloadCue = removeFromCue(reloadCue, action);
};

window.addEventListener('pageshow', () => runActions(reloadCue));
