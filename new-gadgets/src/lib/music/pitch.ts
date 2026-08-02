export const allowableFFTSizes = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];

// I found this YIN implementation by Alejandro Perez, but I found a lot of things to optimize for efficiency.
let threshold: number;
export function yinPitch(inputBuffer: Uint8Array, sampleRate: number): { p: number; pitch: number } {
  const halfBufferLength = inputBuffer.length / 2;
  const meanBuffer = new Float32Array(halfBufferLength);
  meanBuffer[0] = 1;
  let accumulator = 0;
  let found = false;
  let minMean = Infinity;
  let minTau = 0;

  for (let tau = 1; tau < halfBufferLength; tau++) {
    // Squared difference:
    for (let i = 0; i < halfBufferLength; i++) {
      const diff = (inputBuffer[i] ?? 0) - (inputBuffer[i + tau] ?? 0);
      meanBuffer[tau] = (meanBuffer[tau] ?? 0) + diff * diff;
    }

    // Cumulative mean:
    accumulator += meanBuffer[tau] ?? 0;
    meanBuffer[tau] = (meanBuffer[tau] ?? 0) / accumulator;

    // Threshold cutoff:
    if (found) {
      if ((meanBuffer[tau] ?? 0) < minMean) {
        minMean = meanBuffer[tau] ?? 0;
        minTau = tau;
      }
      else
        break;
    }
    else if ((meanBuffer[tau] ?? 0) < threshold) {
      found = true;
      minTau = tau;
      minMean = meanBuffer[tau] ?? 0;
    }
  }

  if (minTau === 0)
    return { p: 0, pitch: 0 };
  else {
    // Interpolate to enhance precision:
    const prevMean = meanBuffer[minTau - 1] ?? 0;
    const nextMean = meanBuffer[minTau + 1] ?? 0;
    minTau += (nextMean - prevMean) / (2 * (2 * (meanBuffer[minTau] ?? 0) - prevMean - nextMean));

    return {
      p: 1 - minMean,
      pitch: sampleRate / minTau
    };
  }
}

export class PitchAnalyser {
  analyser: AnalyserNode;
  dataBuffer: Uint8Array<ArrayBuffer>;

  constructor(props: { audioContext: AudioContext; fftSize?: number; threshold?: number }) {
    this.analyser = props.audioContext.createAnalyser();
    this.analyser.fftSize = props.fftSize ?? 2048;
    this.dataBuffer = new Uint8Array(this.analyser.frequencyBinCount);
    if (props.threshold == null)
      threshold = 0.05;
    else
      threshold = props.threshold;
  }

  getPitchFromSource() {
    // For time-domain analysis
    this.analyser.getByteTimeDomainData(this.dataBuffer);

    return yinPitch(this.dataBuffer, this.analyser.context.sampleRate);
  }
}