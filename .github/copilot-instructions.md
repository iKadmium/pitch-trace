# GitHub Copilot Instructions for Pitch-Trace

## Project Overview

Pitch-Trace is a web-based karaoke and pitch detection application built with:

- **SvelteKit** with **Svelte 5** (using runes)
- **TypeScript** for type safety
- **Vite** as the build tool
- **Audio processing** using Web Audio API, AudioWorklet, and pitch detection
- **Pico CSS** for styling
- **IndexedDB** for local storage
- **Vitest** for testing with Playwright browser testing

## Core Technologies

### Svelte 5 Runes

- Use `$state()` for reactive state management
- Use `$derived()` for computed values
- Use `$effect()` for side effects
- Use `$props()` for component props
- Module-level `<script lang="ts" module>` for type definitions
- Instance-level `<script lang="ts">` for component logic

### Audio Processing

- Uses `pitchfinder` library with YIN algorithm for pitch detection
- AudioWorklet for real-time audio processing (`pitch-processor.ts`)
- Handles MIDI files with `@tonejs/midi` library
- Audio data stored as `ArrayBuffer`

## Code Style & Conventions

### File Structure

- Components: `src/lib/components/*.svelte`
- Models: `src/lib/models/*.ts`
- Library code: `src/lib/*.ts`
- Routes: `src/routes/*`

### Naming Conventions

- Components: PascalCase (e.g., `SongList.svelte`, `KaraokeView.svelte`)
- Files: kebab-case (e.g., `pitch-processor.ts`, `midi.ts`)
- Types/Interfaces: PascalCase (e.g., `Song`, `SongListProps`)
- Variables: camelCase

### TypeScript

- Use explicit types for function parameters and return values
- Define interfaces for component props in module script section
- Use type imports: `import type { Song } from '$lib/models/song'`
- Leverage SvelteKit's type safety with `app.d.ts`

### Component Structure

```svelte
<script lang="ts" module>
	// Type definitions and imports
	export interface ComponentProps {
		// props definition
	}
</script>

<script lang="ts">
	// Component logic
	let { propName }: ComponentProps = $props();
	let stateVar = $state(initialValue);
</script>

<!-- Template -->
<div>
	<!-- component markup -->
</div>

<style>
	/* component styles */
</style>
```

### State Management

- Prefer `$state()` over reactive declarations
- Use `$derived()` for computed values that depend on state
- Use `$effect()` for side effects (replaces `$:` reactive statements)
- Use `onMount()` for initialization logic

## Key Features & Implementation

### Song Management

- Songs stored in IndexedDB with structure: `{ title, artist, duration, midiData, audio }`
- File upload via drag-and-drop (`FileDrop.svelte`)
- Support for audio files and MIDI files

### Pitch Detection

- Real-time pitch detection using AudioWorklet
- YIN algorithm via `pitchfinder` library
- Frequency range: 50-8000 Hz
- Buffer size: 4096 samples

### MIDI Processing

- Parse MIDI files using `@tonejs/midi`
- Display MIDI notes visually (`MidiViewer.svelte`)
- Sync MIDI with audio playback for karaoke

## Testing

### Unit Tests

- Use Vitest with browser mode (Playwright)
- Test files: `*.spec.ts`
- Run with: `npm run test:unit` or `npm test`

### Browser Testing

- Uses `@vitest/browser-playwright`
- Component testing with `vitest-browser-svelte`

## Development Guidelines

### When Adding Features

1. Define TypeScript interfaces for new data structures
2. Use Svelte 5 runes consistently
3. Follow existing component patterns
4. Add appropriate error handling for audio/IndexedDB operations
5. Consider browser compatibility for Web Audio APIs

### Audio Considerations

- Always check for browser support of Web Audio API features
- Handle AudioContext resume (required for user gesture)
- Manage AudioWorklet lifecycle properly
- Use appropriate sample rates (default: 44100 Hz)

### Performance

- Use `$derived()` to memoize expensive computations
- Consider debouncing for high-frequency events (e.g., pitch updates)
- Lazy load audio data when possible

### Accessibility

- Ensure audio controls are keyboard accessible
- Provide visual feedback for audio state
- Use semantic HTML where appropriate

## Build & Deploy

- Build: `npm run build`
- Preview: `npm run preview`
- Static adapter configured for deployment
- Lint before committing: `npm run lint`
- Format code: `npm run format`

## Common Patterns

### Loading Songs from IndexedDB

```typescript
const dbName = 'PitchTrace';
const request = indexedDB.open(dbName, 1);
// Handle request.onsuccess, request.onerror, request.onupgradeneeded
```

### Component Props with Callbacks

```typescript
export interface ComponentProps {
	onSelect: (song: Song) => void;
}
```

### Audio Processing

- Use AudioWorklet for real-time processing
- Post messages between worklet and main thread
- Handle pitch detection in worklet processor

## Dependencies to Know

- `@picocss/pico`: Minimal CSS framework
- `@tonejs/midi`: MIDI file parsing
- `pitchfinder`: Pitch detection algorithms
- `svelte`: v5.45.6+ (uses runes)
- `@sveltejs/kit`: SvelteKit framework

## Avoid

- Don't use Svelte 4 patterns (reactive declarations with `$:`)
- Don't use deprecated Svelte APIs
- Avoid synchronous IndexedDB operations
- Don't block the main thread with heavy audio processing (use AudioWorklet)
- Don't forget to handle browser permissions for microphone access

## Questions to Ask

When implementing new features, consider:

- Does this require real-time audio processing?
- Should this be stored in IndexedDB?
- Does this need to sync with MIDI playback?
- What's the user experience for loading/error states?
- Is this accessible via keyboard?
