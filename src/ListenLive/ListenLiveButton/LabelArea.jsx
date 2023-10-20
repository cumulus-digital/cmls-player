import { h } from 'preact';
import { useContext, useMemo } from 'preact/hooks';

import ScrollLabel from 'Generics/ScrollLabel';
import { playerStateSelects } from 'Store/playerStateSlice';
import { useSelector } from 'react-redux';
import { stream_status } from 'Consts';

import { AppContext } from '@/signals';
import useLogRender from 'Utils/useLogRender';

export default function LabelArea({ buttonLabel, cueLabel }) {
	useLogRender('LabelArea');
	const appState = useContext(AppContext);
	const status = useSelector(playerStateSelects.status);

	const showNowPlaying = useMemo(() => {
		// don't show if we're not playing
		if (status !== stream_status.LIVE_PLAYING) {
			return;
		}

		// don't show if there's a cue label and our button is short
		if (!(cueLabel?.length && appState.button_height.value > 55)) {
			return;
		}

		return <div class="playing-label">Now playing</div>;
	}, [status, cueLabel, appState.button_height.value]);
	return (
		<div
			class={`
			label-area
			${cueLabel?.length ? 'has-cue-label' : ''}
			`}
		>
			{showNowPlaying}
			<ScrollLabel
				tagName="h1"
				speedModifier="3"
				class="state"
				label={buttonLabel}
			/>
			{cueLabel?.length ? (
				<ScrollLabel class="cue" label={cueLabel} />
			) : null}
		</div>
	);
}
