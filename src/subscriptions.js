/**
 * Global redux subscriptions to update signals
 */
import store, { observeStore } from './store';
import { playerStateSelects } from 'Store/playerStateSlice';
import { appSignals } from './signals';
import { SDK } from './stream-sdk';

// Update button and cue labels
const labelObserverEffect = () => {
	const { buttonLabel, cueLabel } = SDK.generateLabels();
	if (appSignals.button_label.value !== buttonLabel) {
		appSignals.button_label.value = buttonLabel;
	}
	if (appSignals.cue_label.value !== cueLabel) {
		appSignals.cue_label.value = cueLabel;
	}
};
new observeStore(store, labelObserverEffect, (state) => {
	const status = playerStateSelects.status(state);
	const current_station = playerStateSelects['station/current'](state);
	const cuepoint = playerStateSelects['station/cuelabel'](
		state,
		current_station
	);
	return {
		status,
		current_station,
		cuepoint,
	};
});
