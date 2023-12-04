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
	default_button_height: signal('50px'),

	offline_label: signal('Listen Live!'),
	show_logo_without_artwork: signal(false),
	show_cue_label: signal(true),
	with_mobile_bar: signal(false),
	mobile_bar_top: signal('0px'),

	button_label: signal('Listen Live!'),
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
