import { YIN } from 'pitchfinder';
import type { PitchDetector } from 'pitchfinder/lib/detectors/types';

class PitchProcessor extends AudioWorkletProcessor {
	private detector: PitchDetector;
	private bufferSize: number;
	private rollingBuffer: Float32Array;

	constructor(options: AudioWorkletNodeOptions) {
		super();
		const sampleRate = (options.processorOptions?.sampleRate as number) || 44100;
		this.detector = YIN({ sampleRate });
		this.bufferSize = 4096;
		this.rollingBuffer = new Float32Array(this.bufferSize);
	}

	process(inputs: Float32Array[][], _outputs: Float32Array[][], _parameters: Record<string, Float32Array>): boolean {
		const input = inputs[0];
		if (input && input[0]) {
			const channelData = input[0];

			// Sliding window
			this.rollingBuffer.set(this.rollingBuffer.subarray(channelData.length));
			this.rollingBuffer.set(channelData, this.bufferSize - channelData.length);

			const pitch = this.detector(this.rollingBuffer);

			if (pitch !== null && !isNaN(pitch)) {
				if (pitch > 50 && pitch < 8000) {
					this.port.postMessage({ pitch });
				} else {
					this.port.postMessage({ pitch: null });
				}
			}
		}
		return true;
	}
}

registerProcessor('pitch-processor', PitchProcessor);
