import { effect, signal } from '@preact/signals';
import { createContext } from 'preact';

export const appSignals = {
	sdk: {
		type: signal('triton'),
		ready: signal(false),
		ad_blocker_detected: signal(false),
	},

	background_color: signal('#e00'),
	highlight_color: signal('#000'),
	text_color: signal('#fff'),

	offline_label: signal('Listen Live!'),
	button_label: signal('Listen Live!'),
	show_cue_label: signal(true),
	cue_label: signal(''),

	button_width: signal(0),
	button_height: signal(0),
	button_top: signal(0),
	button_offset_top: signal(0),
	button_left: signal(0),
	button_offset_left: signal(0),

	dropdown_open: signal(false),
	dropdown_position: signal(0),
	dropdown_focus_station: signal(),
};

export const AppContext = createContext(appSignals);

effect(() => {
	if (!appSignals.dropdown_open.value) {
		appSignals.dropdown_focus_station.value = null;
	}
});
