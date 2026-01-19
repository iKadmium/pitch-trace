<script lang="ts" module>
	import { KaraokeRenderer } from '$lib/canvas/karaoke';
	import type { Song } from '$lib/models/song';
	import workletUrl from '$lib/pitch-processor.ts?worker&url';
	import { onMount } from 'svelte';

	export interface MidiViewerProps {
		song: Song;
	}
</script>

<script lang="ts">
	let { song }: MidiViewerProps = $props();

	let pitch = $state<number | null>(null);
	let error = $state<string | null>(null);

	let width = $state<number>(0);
	let height = $derived((width * 9) / 16);

	let canvas = $state<HTMLCanvasElement | null>(null);
	let audioPlayer = $state<HTMLAudioElement | null>(null);

	let time = $state<number>(0);
	let playing = $state<boolean>(false);

	let audioInitialised = $state<boolean>(false);
	let audioUrl = $derived.by(() => {
		return URL.createObjectURL(new Blob([song.audio], { type: 'audio/mpeg' }));
	});

	async function initAudio() {
		try {
			const context = new window.AudioContext();

			// Essential for Safari/iOS
			if (context.state === 'suspended') await context.resume();

			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const hardwareRate = stream.getAudioTracks()[0].getSettings().sampleRate;

			// Load the worklet via the Vite-generated URL
			await context.audioWorklet.addModule(workletUrl);

			const source = context.createMediaStreamSource(stream);
			const pitchNode = new AudioWorkletNode(context, 'pitch-processor', {
				processorOptions: { sampleRate: hardwareRate }
			});

			pitchNode.port.onmessage = (e) => {
				pitch = e.data.pitch;
			};

			source.connect(pitchNode);
			// Note: Connecting to destination is required in some browsers to keep the clock running
			pitchNode.connect(context.destination);

			audioInitialised = true;
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			console.error('Audio initialization failed:', err);
		}
	}

	onMount(() => {
		if (!canvas) return;
		const renderer = new KaraokeRenderer({ canvas, width, height, song });
		requestAnimationFrame(() => onAudioFrame(renderer));
	});

	function onAudioFrame(renderer: KaraokeRenderer) {
		if (canvas) {
			renderer.draw(pitch, time, time + 10);
		}
		requestAnimationFrame(() => onAudioFrame(renderer));
	}

	function handlePlayPause() {
		if (!audioInitialised) {
			initAudio();
		}
		playing = !playing;
		if (playing) {
			audioPlayer?.play();
		} else {
			audioPlayer?.pause();
		}
	}

	function handleStop() {
		playing = false;
		time = 0;
		audioPlayer?.pause();
	}

	function handleSeek(newTime: number) {
		time = newTime;
	}
</script>

<div bind:clientWidth={width}>
	{#if error}
		<p style="color: red;">Error: {error}</p>
	{:else}
		<dl>
			<dt>Current Pitch:</dt>
			<dd>{pitch !== null ? `${pitch.toFixed(2)} Hz` : 'Detecting...'}</dd>
		</dl>
	{/if}

	<canvas bind:this={canvas} {width} {height}></canvas>

	<audio onseeked={(e) => handleSeek(e.currentTarget.currentTime)} class="audio-player" src={audioUrl} bind:this={audioPlayer} controls></audio>

	<button onclick={handlePlayPause}>{playing ? 'Pause' : 'Play'}</button>
	<button onclick={handleStop}>Stop</button>
</div>

<style>
	canvas {
		border: 1px solid var(--pico-primary-border);
		display: block;
		margin-top: 1em;
	}

	.audio-player {
		width: 100%;
		margin-top: 1em;
	}
</style>
