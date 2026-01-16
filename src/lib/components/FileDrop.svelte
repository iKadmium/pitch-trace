<!-- Drag and drop file upload component -->
<script lang="ts" module>
	export interface FileDropProps {
		accept?: string;
		onFileSelected: (file: File) => void;
	}
</script>

<script lang="ts">
	let { accept, onFileSelected }: FileDropProps = $props();
	let fileInput = $state<HTMLInputElement | null>(null);
	let isDragging = $state(false);

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			processFile(files[0]);
		}
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			processFile(input.files[0]);
		}
	}

	function processFile(file: File) {
		onFileSelected(file);
		isDragging = false;

		// Reset the input value so the same file can be selected again
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
	}

	function handleClick() {
		fileInput?.click();
	}
</script>

<div
	class="file-drop"
	class:dragging={isDragging}
	role="button"
	tabindex="0"
	aria-label="Drag and drop file upload area. Click to select a file."
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	onclick={handleClick}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}}
>
	<p>Drag and drop a file here, or click to select a file.</p>
	<input type="file" onchange={handleFileSelect} hidden bind:this={fileInput} {accept} />
</div>

<style>
	.file-drop {
		border: 2px dashed var(--pico-primary-border);
		border-radius: 8px;
		padding: 2rem;
		text-align: center;
		cursor: pointer;
		transition:
			background-color 0.3s,
			border-color 0.3s;
	}

	.dragging {
		background-color: var(--pico-accent-light);
		border-color: var(--pico-accent);
	}
</style>
