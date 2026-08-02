import "./tuner.css";
import { _nn } from "../lib/AssertNonNull";
import { Seismometer } from "../lib/graphics/Seismometer";
import { PitchAnalyser } from "../lib/music/pitch";

function rotateArray<T>(array: T[], amount: number) {
  amount = amount % array.length;
  if (amount === 0)
    return [...array];

  const right = array.slice(0, -amount);
  const left = array.slice(-amount);
  return left.concat(right);
}

function cycModulo(a: number, b: number) {
  return (a % b + b) % b;
}

const scale = ['A', 'A#/Bb', 'B', 'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab'];
const semitones = 12;

export function ready() {
  let concertA = 440;
  let logConcertA = Math.log2(concertA);

  function getNearestNote(pitch: number) {
    const logPitch = Math.log2(pitch);
    const stepsOff = semitones * (logPitch - logConcertA);
    const intStepsOff = Math.round(stepsOff);
    const noteOffset = cycModulo(intStepsOff, semitones);

    return {
      stepsOff: stepsOff,
      name: scale[noteOffset] ?? '???',
      cents: 1200 * (logPitch - (logConcertA + intStepsOff / semitones))
    };
  }

  const meterCharCount = 50;
  const valuePerChar = 2.5;
  const meterChar = '|';
  const fillerChar = '-';
  function displayCentIMeter(cents: number) {
    if (Number.isNaN(cents))
      cents = 0;

    const offset = Math.floor(cents / valuePerChar);
    const position = meterCharCount / 2 + offset;
    const leftFill = fillerChar.repeat(position - 1);
    const rightFill = fillerChar.repeat(meterCharCount - position - 1);

    // For mixing colors:
    const max = meterCharCount / 4 * valuePerChar;
    const absence = Math.abs(cents) / max;
    const color = `rgb(${absence * 255}, ${(1 - absence) * 255}, 0)`;
    const centIMeter = _nn(document.querySelector<HTMLDivElement>('#cent-i-meter'));
    centIMeter.style.color = color;
    centIMeter.textContent = `[${leftFill}${meterChar}${rightFill}]`;

    const centsDisplay = _nn(document.querySelector<HTMLSpanElement>('#Cents'));
    centsDisplay.style.color = color;
    centsDisplay.textContent = cents.toFixed(0).replace(/^(-?)(\d)$/, '$10$2').replace(/^(\d)/, '+$1');
  }

  const audioContext = new window.AudioContext();

  const tuner = new PitchAnalyser({
    audioContext: audioContext,
    fftSize: 4096,
    threshold: 0.4
  });
  // It will analyze without connecting to destination.

  // Set up mic gain
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(10, audioContext.currentTime);

  // Request microphone
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      const streamNode = audioContext.createMediaStreamSource(stream);
      const analyserNode = tuner.analyser;
      streamNode.connect(gainNode);
      gainNode.connect(analyserNode);
    });

  concertA = +(_nn(document.querySelector<HTMLInputElement>('#ConcertA')).value);
  logConcertA = Math.log2(concertA);

  _nn(document.querySelector<HTMLInputElement>('#ConcertA')).addEventListener('change', (evt) => {
    concertA = +(evt.target as HTMLInputElement).value;
    logConcertA = Math.log2(concertA);
  });

  let graphOffset = +(_nn(document.querySelector<HTMLInputElement>('#GraphOffset')).value);
  _nn(document.querySelector<HTMLInputElement>('#GraphOffset'))
    .addEventListener('change', (evt) => {
      const target = evt.target as HTMLInputElement;
      target.value = (Number.parseInt(target.value) % semitones).toString();
      graphOffset = +target.value;
      seismo.valueMap = [' ', ...rotateArray(scale, graphOffset), ' '];
    });

  const seismo = new Seismometer(
    _nn(document.querySelector<HTMLCanvasElement>('#seismo1')),
    {
      yMax: semitones + 2,
      yMin: 0,
      numberOfLines: semitones + 2,
      maxJump: 2,
      valueMap: [' ', ...rotateArray(scale, graphOffset), ' ']
    },
    {
      bgColor: 'black',
      fgColor: 'white',
      seismocolor: 'cyan',
      fontSize: 20,
      fontFamily: 'monospace'
    }
  );

  const noteDisplay = _nn(document.querySelector<HTMLSpanElement>('#Note'));
  const pitchDisplay = _nn(document.querySelector<HTMLSpanElement>('#Pitch'));
  const certaintyDisplay = _nn(document.querySelector<HTMLSpanElement>('#Certainty'));

  function frameRender() {
    const pitchData = tuner.getPitchFromSource();

    const note = getNearestNote(pitchData.pitch);

    noteDisplay.textContent = note.name;
    pitchDisplay.textContent = pitchData.pitch.toFixed(2);
    certaintyDisplay.textContent = (pitchData.p * 100).toFixed(2) + '%';

    // +6 so A is moved to not the bottom
    const seismoValue = (note.stepsOff === -Infinity)
      ? -12
      : cycModulo(note.stepsOff + graphOffset, semitones);
    seismo.pushNewValue(seismoValue + 1);
    seismo.pushNewValue(seismoValue + 1);
    seismo.render();

    displayCentIMeter(note.cents);
    requestAnimationFrame(frameRender);
  }

  requestAnimationFrame(frameRender);

  _nn(document.querySelector<HTMLButtonElement>('#Activator')).remove();
}

document.querySelector<HTMLButtonElement>('#Activator')?.addEventListener('click', () => {
  ready();
});