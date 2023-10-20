import { h } from 'preact';
import { AppContext } from '@/signals';
import { FaPlay as IconPlay, FaPause as IconPause } from 'react-icons/fa6';

import useLogRender from 'Utils/useLogRender';
import { useContext } from 'react';

export default function ActionIcon(props) {
	const appState = useContext(AppContext);
	useLogRender('ActionIcon');
	return (
		<div class="play-icon-container">
			<div class="play-icon">
				{appState.sdk.ready.value &&
					(props.playing ? <IconPause /> : <IconPlay />)}
			</div>
		</div>
	);
}
