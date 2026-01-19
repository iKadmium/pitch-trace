<script lang="ts">
	import SongList from '$lib/components/SongList.svelte';
	import { goto } from '$app/navigation';
	import type { Song } from '$lib/models/song';

	function handleSongSelect(song: Song) {
		if (song.id) {
			goto(`/play?id=${song.id}`);
		}
	}
</script>

<main class="container">
	<h1>Pitch-Trace</h1>
	<SongList onSelect={handleSongSelect} />
</main>
