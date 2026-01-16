<script lang="ts" module>
	import type { Midi } from '@tonejs/midi';

	export interface MidiViewerProps {
		midi: Midi;
		onTrackSelect: (trackIndex: number) => void;
	}
</script>

<script lang="ts">
	let { midi, onTrackSelect }: MidiViewerProps = $props();

	function handleSubmit(event: Event) {
		event.preventDefault();
		// Handle form submission logic here
	}
</script>

<h1>{midi.name}</h1>

<select name="trackSelect" onchange={(e) => onTrackSelect(parseInt(e.currentTarget.value))}>
	{#each midi.tracks as track, index}
		<option value={index}>{track.name || `Track ${index + 1}`}</option>
	{/each}
</select>

<div>
	{#each midi.tracks as track, index}
		<details>
			<summary>{track.name}</summary>
			{#each track.notes as note}
				<div>
					<strong>Note:</strong>
					{note.name} |
					<strong>Time:</strong>
					{note.time.toFixed(2)}s |
					<strong>Duration:</strong>
					{note.duration.toFixed(2)}s |
					<strong>Velocity:</strong>
					{note.velocity.toFixed(2)}
				</div>
			{/each}
		</details>
	{/each}
</div>
