import { h } from 'preact';
import { useMemo } from 'preact/hooks';
import { useSelector } from 'react-redux';
import { playerStateSelects } from 'Store/playerStateSlice';

import { IconPlay, IconPause } from '@/ui/Icons';

import useLogRender from 'Utils/useLogRender';

export default function ActionIcon(props) {
	useLogRender('ActionIcon');
	const playing = useSelector(playerStateSelects.playing);

	const icon = useMemo(() => {
		return playing ? <IconPause /> : <IconPlay />;
	}, [playing]);

	return (
		<div class="play-icon-container">
			<div class="play-icon">{icon}</div>
		</div>
	);
}
