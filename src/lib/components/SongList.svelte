<script lang="ts" module>
	import type { Song } from '$lib/models/song';
	import { deserializeSong } from '$lib/models/song';
	import { onMount } from 'svelte';

	export interface SongListProps {
		onSelect: (song: Song) => void;
	}
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { onSelect }: SongListProps = $props();
	let songs = $state<Song[]>([]);

	function loadSongs() {
		const dbName = 'PitchTrace';
		const request = indexedDB.open(dbName, 1);

		request.onerror = (event) => {
			console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
		};

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains('songs')) {
				db.createObjectStore('songs', { keyPath: 'id', autoIncrement: true });
			}
		};

		request.onsuccess = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			const transaction = db.transaction('songs', 'readonly');
			const store = transaction.objectStore('songs');
			const getAllRequest = store.getAll();

			getAllRequest.onsuccess = () => {
				const serializedSongs = getAllRequest.result;
				songs = serializedSongs.map((s: any) => deserializeSong(s));
			};

			getAllRequest.onerror = (e) => {
				console.error('Failed to retrieve songs:', (e.target as IDBRequest).error);
			};
		};
	}

	onMount(() => {
		loadSongs();
	});

	function handleEdit(songId: number, e: Event) {
		e.stopPropagation();
		goto(`/edit?id=${songId}`);
	}

	function handleDelete(songId: number, songTitle: string, e: Event) {
		e.stopPropagation();

		if (!confirm(`Are you sure you want to delete "${songTitle}"?`)) {
			return;
		}

		const dbName = 'PitchTrace';
		const request = indexedDB.open(dbName, 1);

		request.onerror = () => {
			console.error('IndexedDB error');
		};

		request.onsuccess = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			const transaction = db.transaction('songs', 'readwrite');
			const store = transaction.objectStore('songs');
			const deleteRequest = store.delete(songId);

			deleteRequest.onsuccess = () => {
				console.log('Song deleted successfully');
				loadSongs(); // Reload the list
			};

			deleteRequest.onerror = () => {
				console.error('Failed to delete song');
			};
		};
	}
</script>

{#each songs as song (song.id)}
	<article>
		<header>{song.artist} - {song.title}</header>
		{song.duration}s
		<footer>
			<div class="button-group">
				<button onclick={() => onSelect(song)}>Play</button>
				<button class="secondary" onclick={(e) => handleEdit(song.id!, e)}>Edit</button>
				<button class="secondary" onclick={(e) => handleDelete(song.id!, song.title, e)}>Delete</button>
			</div>
		</footer>
	</article>
{/each}

<a href={resolve('/add')}>Add New Song</a>

<style>
	.button-group {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.button-group button {
		margin: 0;
		flex: 1;
		min-width: fit-content;
	}
</style>
