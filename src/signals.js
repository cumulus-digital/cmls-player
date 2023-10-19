import { signal } from '@preact/signals';
import { createContext } from 'preact';

export const appSignals = {
	sdk: {
		type: signal('triton'),
		ready: signal(false),
		ad_blocker_detected: signal(false),
	},
	button_height: signal(0),
	button_right: signal(0),
	dropdown_open: signal(false),
	dropdown_position: signal(0),
};

export const AppContext = createContext(appSignals);
