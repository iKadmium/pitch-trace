import { Pitch, type Song } from '$lib/models/song';

export interface DrawOptions {
	canvas: HTMLCanvasElement;
	width: number;
	height: number;
	song: Song;
}

export class KaraokeRenderer {
	private canvas: HTMLCanvasElement;
	private width: number;
	private height: number;
	private song: Song;

	constructor(options: DrawOptions) {
		this.canvas = options.canvas;
		this.width = options.width;
		this.height = options.height;
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.song = options.song;
	}

	public draw(pitch: number | null, startTime: number, endTime: number): void {
		const ctx = this.canvas.getContext('2d');
		if (!ctx) return;
		const width = this.canvas.width;
		const height = this.canvas.height;
		// Clear canvas
		ctx.clearRect(0, 0, width, height);

		console.debug('Drawing notes from', startTime, 'to', endTime);

		const notes = this.song.notes.filter((note) => note.endTime >= startTime && note.startTime <= endTime);
		if (notes.length === 0) return;

		const minNote = notes.reduce((acc, note) => (note.pitch.toMidi() < acc.pitch.toMidi() ? note : acc), notes[0]);
		const maxNote = notes.reduce((acc, note) => (note.pitch.toMidi() > acc.pitch.toMidi() ? note : acc), notes[0]);
		//draw notes

		const minOctave = minNote.pitch.octave();
		const maxOctave = maxNote.pitch.octave();

		const minOctaveFreq = Pitch.fromMidi(minOctave * 12).getFrequency();
		const maxOctaveFreq = Pitch.fromMidi((maxOctave + 1) * 12 - 1).getFrequency();

		const noteRange = (maxOctave - minOctave + 1) * 12;
		const noteHeight = height / noteRange;

		// Draw pitch line
		if (pitch !== null) {
			const y = this.frequencyToY(pitch, minOctaveFreq, maxOctaveFreq, height);
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.strokeStyle = 'red';
			ctx.lineWidth = 2;
			ctx.stroke();
		}

		notes.forEach((note) => {
			const noteStartX = ((note.startTime - startTime) / (endTime - startTime)) * width;
			const noteEndX = ((note.endTime - startTime) / (endTime - startTime)) * width;
			const noteY = this.frequencyToY(note.pitch.getFrequency(), minOctaveFreq, maxOctaveFreq, height);

			ctx.fillStyle = 'blue';
			ctx.fillRect(noteStartX, noteY - noteHeight / 2, noteEndX - noteStartX, noteHeight);
		});
	}

	private frequencyToY(frequency: number, minFrequency: number, maxFrequency: number, height: number): number {
		const minLog = Math.log2(minFrequency);
		const maxLog = Math.log2(maxFrequency);
		const frequencyLog = Math.log2(frequency);
		return height - ((frequencyLog - minLog) / (maxLog - minLog)) * height;
	}
}
