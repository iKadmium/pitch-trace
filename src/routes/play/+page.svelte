<script lang="ts">
	import { goto } from '$app/navigation';
	import KaraokeView from '$lib/components/KaraokeView.svelte';
	import type { Song } from '$lib/models/song';
	import { deserializeSong } from '$lib/models/song';
	import { onMount } from 'svelte';

	let song = $state<Song | null>(null);

	onMount(async () => {
		// Get song ID from URL parameters
		const params = new URLSearchParams(window.location.search);
		const songIdParam = params.get('id');

		if (!songIdParam) {
			goto('/');
			return;
		}

		const songId = parseInt(songIdParam, 10);

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
			const getRequest = store.get(songId);

			getRequest.onsuccess = async () => {
				const serializedSong = getRequest.result;

				if (!serializedSong) {
					console.error('Song not found');
					goto('/');
					return;
				}

				song = deserializeSong(serializedSong);
			};

			getRequest.onerror = () => {
				console.error('Failed to load song');
				goto('/');
			};
		};
	});

	function handleBack() {
		goto('/');
	}
</script>

<main class="container">
	<button class="secondary" onclick={handleBack}>← Back to Songs</button>

	{#if song}
		<h1>{song.artist} - {song.title}</h1>
		<KaraokeView {song} />
	{:else}
		<p>Loading song...</p>
	{/if}
</main>

<style>
	button {
		margin-bottom: 1rem;
	}
</style>
