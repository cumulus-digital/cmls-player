import { h } from 'preact';
/*
import {
	IconPlayerPlayFilled as IconPlay,
	IconPlayerPauseFilled as IconPause,
} from '@tabler/icons-react';
*/
import { FaPlay as IconPlay, FaPause as IconPause } from 'react-icons/fa6';

import useLogRender from 'Utils/useLogRender';

export default function ActionIcon(props) {
	useLogRender('ActionIcon');
	return (
		<div class="play-icon-container">
			<div class="play-icon">
				{props.playing ? <IconPause /> : <IconPlay />}
			</div>
		</div>
	);
}
