import { h } from 'preact';
import { useContext, useMemo } from 'preact/hooks';

import ScrollLabel from '@/ui/Generics/ScrollLabel';
import { playerStateSelects } from 'Store/playerStateSlice';
import { shallowEqual, useSelector } from 'react-redux';
import { stream_status } from 'Consts';

import { AppContext } from '@/signals';
import useLogRender from 'Utils/useLogRender';
import ShuffleLabel from '@/ui/Generics/ShuffleLabel';

export default function LabelArea() {
	useLogRender('LabelArea');

	const appState = useContext(AppContext);
	const status = useSelector(playerStateSelects.status);
	const playing = useSelector(playerStateSelects.playing);
	const current_station = useSelector(
		playerStateSelects['station/current'],
		shallowEqual
	);
	const buttonLabel = useMemo(
		() => [appState.button_label, current_station?.name],
		[appState.button_label.value, current_station]
	);

	const classnames = useMemo(() => {
		const list = ['label-area'];
		if (appState.cue_label.value?.length) {
			list.push('has-cue-label');
		}
		return list.join(' ');
	}, [appState.cue_label.value]);

	const showNowPlaying = useMemo(() => {
		// don't show if we're not playing
		if (status !== stream_status.LIVE_PLAYING || !playing) {
			return;
		}

		// don't show if there's a cue label and our button is short
		if (
			!(
				appState.show_cue_label.value &&
				appState.button_height.value > 55
			)
		) {
			return;
		}

		return <div class="playing-label">Now playing</div>;
	}, [status, appState.button_height.value, playing]);

	return (
		<div class={classnames}>
			{showNowPlaying}
			<ShuffleLabel
				tagName="h1"
				speedModifier="3"
				class="state"
				labels={buttonLabel}
			/>
			{appState.cue_label.value?.length ? (
				<ScrollLabel class="cue" label={appState.cue_label} />
			) : null}
		</div>
	);
}
