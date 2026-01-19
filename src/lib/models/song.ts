export interface Song {
	id?: number; // Auto-incremented by IndexedDB
	title: string;
	artist: string;
	duration: number; // in seconds
	notes: Note[];
	audio: ArrayBuffer;
}

export interface Note {
	startTime: number; // in seconds
	endTime: number; // in seconds
	pitch: Pitch; // MIDI pitch number
}

// Serializable format for storing in IndexedDB
interface SerializedNote {
	startTime: number;
	endTime: number;
	pitch: number; // Store as MIDI number
}

interface SerializedSong {
	id?: number;
	title: string;
	artist: string;
	duration: number;
	notes: SerializedNote[];
	audio: ArrayBuffer;
}

export class Pitch {
	private frequency: number;

	constructor(frequency: number) {
		this.frequency = frequency;
	}

	public name(): string {
		const semitones = Math.round(12 * Math.log2(this.frequency / 440)) + 69;
		const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
		const octave = Math.floor(semitones / 12) - 1;
		const noteIndex = semitones % 12;
		return `${noteNames[noteIndex]}${octave}`;
	}

	public toMidi(): number {
		return Math.round(12 * Math.log2(this.frequency / 440)) + 69;
	}

	public octave(): number {
		const semitones = this.toMidi();
		return Math.floor(semitones / 12) - 1;
	}

	public getFrequency(): number {
		return this.frequency;
	}

	static fromMidi(midi: number): Pitch {
		const frequency = 440 * Math.pow(2, (midi - 69) / 12);
		return new Pitch(frequency);
	}
}

// Helper functions to serialize/deserialize songs for IndexedDB
export function serializeSong(song: Song): SerializedSong {
	return {
		...song,
		notes: song.notes.map((note) => ({
			startTime: note.startTime,
			endTime: note.endTime,
			pitch: note.pitch.toMidi()
		}))
	};
}

export function deserializeSong(serialized: SerializedSong): Song {
	return {
		...serialized,
		notes: serialized.notes.map((note) => ({
			startTime: note.startTime,
			endTime: note.endTime,
			pitch: Pitch.fromMidi(note.pitch)
		}))
	};
}
