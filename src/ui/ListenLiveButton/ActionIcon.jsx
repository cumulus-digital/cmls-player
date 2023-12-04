import { h } from 'preact';
import { useLayoutEffect, useMemo } from 'preact/hooks';
import { useSelector } from 'react-redux';
import { playerStateSelects } from 'Store/playerStateSlice';

import { IconPlay, IconPause } from '@/ui/Icons';

import useLogRender from 'Utils/useLogRender';
import { useSignal } from '@preact/signals';

export default function ActionIcon(props) {
	useLogRender('ActionIcon');
	const playing = useSelector(playerStateSelects.playing);

	const icon = useSignal();
	useLayoutEffect(() => {
		if (playing) {
			icon.value = <IconPause />;
		} else {
			icon.value = <IconPlay />;
		}
	}, [playing]);

	return (
		<div class="play-icon-container">
			<div class="play-icon">{icon}</div>
		</div>
	);
}
