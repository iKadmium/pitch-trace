export async function parseMidiFile(arrayBuffer: ArrayBuffer) {
	const { Midi } = await import('@tonejs/midi');
	const midi = new Midi(arrayBuffer);
	for (let i = 0; i < midi.tracks.length; i++) {
		const track = midi.tracks[i];
		const prevTrack = i > 0 ? midi.tracks[i - 1] : null;
		if (track.name === '' && prevTrack && prevTrack.notes.length === 0) {
			track.name = prevTrack.name;
		}
	}
	midi.tracks = midi.tracks.filter((t) => t.notes.length > 0);
	return midi;
}
