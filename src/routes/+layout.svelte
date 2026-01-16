<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '@picocss/pico/css/pico.classless.purple.min.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main>
	{@render children()}
</main>

<style>
	header,
	main,
	footer {
		width: 100%;
		margin-right: auto;
		margin-left: auto;
		padding: var(--pico-block-spacing-vertical) var(--pico-block-spacing-horizontal);
	}
	@media (min-width: 576px) {
		header,
		main,
		footer {
			max-width: 510px;
			padding-right: 0;
			padding-left: 0;
		}
	}
	@media (min-width: 768px) {
		header,
		main,
		footer {
			max-width: 700px;
		}
	}
	@media (min-width: 1024px) {
		header,
		main,
		footer {
			max-width: 950px;
		}
	}
	@media (min-width: 1280px) {
		header,
		main,
		footer {
			max-width: 1200px;
		}
	}
	@media (min-width: 1536px) {
		header,
		main,
		footer {
			max-width: 1450px;
		}
	}
</style>
