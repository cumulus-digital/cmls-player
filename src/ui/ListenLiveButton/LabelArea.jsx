import { h } from 'preact';
import { useContext, useLayoutEffect, useMemo } from 'preact/hooks';

import ScrollLabel from '@/ui/Generics/ScrollLabel';
import { playerStateSelects } from 'Store/playerStateSlice';
import { shallowEqual, useSelector } from 'react-redux';
import { stream_status } from 'Consts';

import { AppContext } from '@/signals';
import useLogRender from 'Utils/useLogRender';
import ShuffleLabel from '@/ui/Generics/ShuffleLabel';
import MarqueeText from 'UI/Generics/MarqueeText';
import SlidingText from 'UI/Generics/SlidingText';
import { useSignal, useSignalEffect } from '@preact/signals';
import { useClassNameSignal } from 'UI/hooks/ClassNameSignal';

export default function LabelArea() {
	useLogRender('LabelArea');

	const appState = useContext(AppContext);
	const status = useSelector(playerStateSelects.status);
	const playing = useSelector(playerStateSelects.playing);
	const current_station = useSelector(
		playerStateSelects['station/current'],
		shallowEqual
	);

	const buttonLabel = useMemo(() => {
		if (status === stream_status.LIVE_CONNECTING) {
			return appState.button_label.value;
		}
		return [appState.button_label, current_station?.name];
	}, [appState.button_label.value, current_station, status]);

	const classNames = useClassNameSignal('label-area');
	useSignalEffect(() => {
		if (appState.cue_label.value?.length) {
			classNames.add('has-cue-label');
		}
	});

	const nowPlayingLabel = useSignal();
	useLayoutEffect(() => {
		if (!playing || status !== stream_status.LIVE_PLAYING) {
			nowPlayingLabel.value = null;
			return;
		}

		if (
			appState.show_cue_label.value &&
			appState.cue_label.value?.length &&
			appState.button_height.value < 55
		) {
			nowPlayingLabel.value = null;
		}

		nowPlayingLabel.value = <div class="playing-label">Now playing</div>;
	}, [status, playing, appState.button_height]);

	const cueLabel = useSignal();
	useSignalEffect(() => {
		if (appState.cue_label.value?.length) {
			cueLabel.value = (
				<MarqueeText class="cue" label={appState.cue_label} />
			);
		} else {
			cueLabel.value = null;
		}
	});

	return (
		<div class={classNames}>
			{nowPlayingLabel}
			<SlidingText
				class="state"
				tagname="h1"
				delay={7}
				speed={6}
				labels={buttonLabel}
			/>
			{cueLabel}
		</div>
	);
}
