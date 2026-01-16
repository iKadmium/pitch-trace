import * as Pitchfinder from 'pitchfinder';

export async function getAudioBuffer(): Promise<AudioBuffer> {
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	const audioContext = new AudioContext();

	// Create a media stream source
	const source = audioContext.createMediaStreamSource(stream);

	// Create an analyser node to capture audio data
	const analyser = audioContext.createAnalyser();
	analyser.fftSize = 2048;
	source.connect(analyser);

	// Capture audio data into a buffer
	const bufferLength = analyser.fftSize;
	const dataArray = new Float32Array(bufferLength);

	// Wait a moment to capture some audio
	await new Promise((resolve) => setTimeout(resolve, 100));
	analyser.getFloatTimeDomainData(dataArray);

	// Create an AudioBuffer from the captured data
	const audioBuffer = audioContext.createBuffer(1, bufferLength, audioContext.sampleRate);
	audioBuffer.copyToChannel(dataArray, 0);

	return audioBuffer;
}

export async function detectAudioPitch() {
	const myAudioBuffer = await getAudioBuffer(); // assume this returns a WebAudio AudioBuffer object
	const float32Array = myAudioBuffer.getChannelData(0); // get a single channel of sound

	const detectPitch = Pitchfinder.YIN();
	const pitch = detectPitch(float32Array); // null if pitch cannot be identified
	return pitch;
}
