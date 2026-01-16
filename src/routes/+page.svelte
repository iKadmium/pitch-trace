<script lang="ts">
	import FileDrop from '$lib/components/FileDrop.svelte';
	import KaraokeView from '$lib/components/KaraokeView.svelte';
	import MidiViewer from '$lib/components/MidiViewer.svelte';
	import { parseMidiFile } from '$lib/midi';
	import { Track, type Midi } from '@tonejs/midi';

	let midi = $state<Midi | null>(null);
	let selectedTrack = $state<Track | null>(null);

	async function onFileSelected(file: File) {
		const buf = await file.arrayBuffer();
		const parsed = await parseMidiFile(buf);
		midi = parsed;
		selectedTrack = midi.tracks[0];
	}

	function onTrackSelect(trackIndex: number) {
		// Handle track selection logic here
		selectedTrack = midi?.tracks[trackIndex] || null;
	}
</script>

{#if midi === null}
	<FileDrop {onFileSelected} accept=".mid,.midi" />
{:else if selectedTrack !== null}
	<KaraokeView track={selectedTrack} />
{/if}
{#if midi !== null}
	<MidiViewer {midi} {onTrackSelect} />
{/if}
