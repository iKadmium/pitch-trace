<script lang="ts" module>
	import type { Midi, Track } from '@tonejs/midi';

	export interface MidiViewerProps {
		track: Track;
	}
</script>

<script lang="ts">
	let { track }: MidiViewerProps = $props();
</script>

<h2>Track: {track.name || 'Unnamed Track'}</h2>
