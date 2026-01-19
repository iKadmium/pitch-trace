<script lang="ts">
	import FileDrop from '$lib/components/FileDrop.svelte';
	import MidiViewer from '$lib/components/MidiViewer.svelte';
	import { parseMidiFile } from '$lib/midi';
	import { Pitch, type Note, type Song, serializeSong } from '$lib/models/song';
	import type { Midi } from '@tonejs/midi';
	import { goto } from '$app/navigation';

	let title = $state('');
	let artist = $state('');
	let midiFile = $state<File | null>(null);
	let audioFile = $state<File | null>(null);
	let midi = $state<Midi | null>(null);
	let selectedTrackIndex = $state<number>(0);
	let error = $state('');
	let isSubmitting = $state(false);

	async function handleMidiFileSelected(file: File) {
		midiFile = file;
		error = '';

		try {
			// Parse MIDI file immediately to show preview
			const midiBuffer = await file.arrayBuffer();
			midi = await parseMidiFile(midiBuffer);
			selectedTrackIndex = 0; // Default to first track
		} catch (err) {
			console.error('Error parsing MIDI:', err);
			error = `Error parsing MIDI file: ${err instanceof Error ? err.message : 'Unknown error'}`;
			midi = null;
		}
	}

	function handleAudioFileSelected(file: File) {
		audioFile = file;
		error = '';
	}

	function handleTrackSelect(trackIndex: number) {
		selectedTrackIndex = trackIndex;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		// Validation
		if (!title.trim()) {
			error = 'Please enter a title';
			return;
		}

		if (!artist.trim()) {
			error = 'Please enter an artist';
			return;
		}

		if (!midiFile) {
			error = 'Please select a MIDI file';
			return;
		}

		if (!audioFile) {
			error = 'Please select an audio file';
			return;
		}

		if (!midi) {
			error = 'MIDI file not loaded';
			return;
		}

		isSubmitting = true;

		try {
			// Get notes from selected track only
			const selectedTrack = midi.tracks[selectedTrackIndex];
			const notes: Note[] = selectedTrack.notes.map((note) => ({
				startTime: note.time,
				endTime: note.time + note.duration,
				pitch: Pitch.fromMidi(note.midi)
			}));

			// Read audio file
			const audioBuffer = await audioFile.arrayBuffer();

			// Get audio duration using Web Audio API
			const audioContext = new AudioContext();
			const audioData = await audioContext.decodeAudioData(audioBuffer.slice(0));
			const duration = audioData.duration;
			audioContext.close();

			// Store in IndexedDB
			const dbName = 'PitchTrace';
			const request = indexedDB.open(dbName, 1);

			request.onerror = () => {
				error = 'Failed to open database';
				isSubmitting = false;
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains('songs')) {
					db.createObjectStore('songs', { keyPath: 'id', autoIncrement: true });
				}
			};

			request.onsuccess = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				const transaction = db.transaction('songs', 'readwrite');
				const store = transaction.objectStore('songs');

				const song: Song = {
					title: title.trim(),
					artist: artist.trim(),
					duration,
					notes,
					audio: audioBuffer
				};

				// Serialize the song before storing
				const serializedSong = serializeSong(song);
				const addRequest = store.add(serializedSong);

				addRequest.onsuccess = () => {
					console.log('Song added successfully');
					// Navigate back to home
					goto('/');
				};

				addRequest.onerror = () => {
					error = 'Failed to save song';
					isSubmitting = false;
				};
			};
		} catch (err) {
			console.error('Error processing files:', err);
			error = `Error processing files: ${err instanceof Error ? err.message : 'Unknown error'}`;
			isSubmitting = false;
		}
	}
</script>

<main class="container">
	<h1>Add New Song</h1>

	<form onsubmit={handleSubmit}>
		<label>
			Title
			<input type="text" bind:value={title} placeholder="Song Title" required disabled={isSubmitting} />
		</label>

		<label>
			Artist
			<input type="text" bind:value={artist} placeholder="Artist Name" required disabled={isSubmitting} />
		</label>

		<label>
			MIDI File
			<FileDrop accept=".mid,.midi" onFileSelected={handleMidiFileSelected} />
			{#if midiFile}
				<small>Selected: {midiFile.name}</small>
			{/if}
		</label>

		<label>
			Audio File (MP3)
			<FileDrop accept=".mp3,audio/mpeg" onFileSelected={handleAudioFileSelected} />
			{#if audioFile}
				<small>Selected: {audioFile.name}</small>
			{/if}
		</label>

		{#if midi}
			<div class="midi-preview">
				<h2>MIDI Preview</h2>
				<p>Select the track to use for lyrics/vocals:</p>
				<MidiViewer {midi} onTrackSelect={handleTrackSelect} />
				<p><small>Selected track: {midi.tracks[selectedTrackIndex]?.name || `Track ${selectedTrackIndex + 1}`}</small></p>
			</div>
		{/if}

		{#if error}
			<p style="color: var(--pico-del-color);">{error}</p>
		{/if}

		<div class="button-group">
			<button type="submit" disabled={isSubmitting}>
				{isSubmitting ? 'Adding Song...' : 'Add Song'}
			</button>
			<button type="button" class="secondary" onclick={() => goto('/')} disabled={isSubmitting}> Cancel </button>
		</div>
	</form>
</main>

<style>
	.button-group {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
	}

	label {
		margin-bottom: 1rem;
	}

	.midi-preview {
		margin: 2rem 0;
		padding: 1rem;
		border: 1px solid var(--pico-muted-border-color);
		border-radius: 8px;
		background: var(--pico-card-background-color);
	}

	.midi-preview h2 {
		margin-top: 0;
	}

	small {
		display: block;
		margin-top: 0.5rem;
		color: var(--pico-muted-color);
	}
</style>
