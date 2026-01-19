<script lang="ts">
	import FileDrop from '$lib/components/FileDrop.svelte';
	import MidiViewer from '$lib/components/MidiViewer.svelte';
	import { parseMidiFile } from '$lib/midi';
	import { Pitch, type Note, type Song, deserializeSong, serializeSong } from '$lib/models/song';
	import type { Midi } from '@tonejs/midi';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let songId = $state<number | null>(null);
	let title = $state('');
	let artist = $state('');
	let midiFile = $state<File | null>(null);
	let audioFile = $state<File | null>(null);
	let midi = $state<Midi | null>(null);
	let selectedTrackIndex = $state<number>(0);
	let error = $state('');
	let isSubmitting = $state(false);
	let isLoading = $state(true);
	let existingSong = $state<Song | null>(null);

	onMount(async () => {
		// Get song ID from URL parameters
		const params = new URLSearchParams(window.location.search);
		const songIdParam = params.get('id');

		if (!songIdParam) {
			goto('/');
			return;
		}

		songId = parseInt(songIdParam, 10);

		// Load song from IndexedDB
		const dbName = 'PitchTrace';
		const request = indexedDB.open(dbName, 1);

		request.onerror = () => {
			console.error('IndexedDB error');
			goto('/');
		};

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains('songs')) {
				db.createObjectStore('songs', { keyPath: 'id', autoIncrement: true });
			}
		};

		request.onsuccess = async (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			const transaction = db.transaction('songs', 'readonly');
			const store = transaction.objectStore('songs');
			const getRequest = store.get(songId!);

			getRequest.onsuccess = async () => {
				const serializedSong = getRequest.result;

				if (!serializedSong) {
					console.error('Song not found');
					goto('/');
					return;
				}

				existingSong = deserializeSong(serializedSong);
				title = existingSong.title;
				artist = existingSong.artist;

				// Reconstruct MIDI from notes
				try {
					midi = {
						tracks: [
							{
								name: existingSong.title,
								notes: existingSong.notes.map((note: Note) => ({
									midi: note.pitch.toMidi(),
									time: note.startTime,
									duration: note.endTime - note.startTime,
									velocity: 0.8
								}))
							} as any
						],
						duration: existingSong.duration
					} as unknown as Midi;

					selectedTrackIndex = 0;
				} catch (err) {
					console.error('Error loading song:', err);
				}

				isLoading = false;
			};

			getRequest.onerror = () => {
				console.error('Failed to load song');
				goto('/');
			};
		};
	});

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

		if (!midi) {
			error = 'MIDI data not available';
			return;
		}

		if (!songId) {
			error = 'Song ID not found';
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

			// Use new audio if provided, otherwise keep existing
			let audioBuffer: ArrayBuffer;
			let duration: number;

			if (audioFile) {
				audioBuffer = await audioFile.arrayBuffer();
				const audioContext = new AudioContext();
				const audioData = await audioContext.decodeAudioData(audioBuffer.slice(0));
				duration = audioData.duration;
				audioContext.close();
			} else {
				// Keep existing audio
				audioBuffer = existingSong!.audio;
				duration = existingSong!.duration;
			}

			// Update in IndexedDB
			const dbName = 'PitchTrace';
			const request = indexedDB.open(dbName, 1);

			request.onerror = () => {
				error = 'Failed to open database';
				isSubmitting = false;
			};

			request.onsuccess = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				const transaction = db.transaction('songs', 'readwrite');
				const store = transaction.objectStore('songs');

				const song: Song = {
					id: songId!,
					title: title.trim(),
					artist: artist.trim(),
					duration,
					notes,
					audio: audioBuffer
				};

				// Serialize the song before storing
				const serializedSong = serializeSong(song);
				const updateRequest = store.put(serializedSong);

				updateRequest.onsuccess = () => {
					console.log('Song updated successfully');
					goto('/');
				};

				updateRequest.onerror = () => {
					error = 'Failed to update song';
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
	<h1>Edit Song</h1>

	{#if isLoading}
		<p>Loading song...</p>
	{:else}
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
				MIDI File (optional - leave empty to keep existing)
				<FileDrop accept=".mid,.midi" onFileSelected={handleMidiFileSelected} />
				{#if midiFile}
					<small>Selected: {midiFile.name}</small>
				{:else if existingSong}
					<small>Using existing MIDI data ({existingSong.notes.length} notes)</small>
				{/if}
			</label>

			<label>
				Audio File (optional - leave empty to keep existing)
				<FileDrop accept=".mp3,audio/mpeg" onFileSelected={handleAudioFileSelected} />
				{#if audioFile}
					<small>Selected: {audioFile.name}</small>
				{:else if existingSong}
					<small>Using existing audio ({existingSong.duration.toFixed(1)}s)</small>
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
					{isSubmitting ? 'Updating Song...' : 'Update Song'}
				</button>
				<button type="button" class="secondary" onclick={() => goto('/')} disabled={isSubmitting}> Cancel </button>
			</div>
		</form>
	{/if}
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
