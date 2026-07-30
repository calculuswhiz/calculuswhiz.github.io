function rotateArray(array, amount) {
  amount = amount % array.length;
  if (amount === 0)
    return [...array];

  const right = array.slice(0, -amount);
  const left = array.slice(-amount);
  return left.concat(right);
}

function cycModulo(a, b) {
  return (a % b + b) % b;
}

function ready() {
  let concertA = 440;
  const scale = ['A', 'A#/Bb', 'B', 'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab'];
  const semitones = 12;

  function getNearestNote(pitch) {
    const stepsOff = semitones * Math.log2(pitch / concertA);
    const intStepsOff = Math.round(stepsOff);
    const noteOffset = cycModulo(intStepsOff, semitones);
    const idealFrequency = concertA * 2 ** (intStepsOff / semitones);

    return {
      stepsOff: stepsOff,
      name: scale[noteOffset] ?? '???',
      cents: 1200 * Math.log2(pitch / idealFrequency)
    };
  }

  const meterCharCount = 50;
  const valuePerChar = 2.5;
  const meterChar = '|';
  const fillerChar = '-';
  function displayCentIMeter(cents) {
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
    const centIMeter = document.querySelector('#cent-i-meter');
    centIMeter.style.color = color;
    centIMeter.textContent = `[${leftFill}${meterChar}${rightFill}]`;

    const centsDisplay = document.querySelector('#Cents');
    centsDisplay.style.color = color;
    centsDisplay.textContent = cents.toFixed(0).replace(/^(-?)(\d)$/, '$10$2').replace(/^(\d)/, '+$1');
  }

  const audioContext = new (window.AudioContext ?? window.webkitAudioContext)();
  audioContext.sampleRate
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
      const analyserNode = tuner.getNode();
      streamNode.connect(gainNode);
      gainNode.connect(analyserNode);
    });

  concertA = +document.querySelector('#ConcertA').value;
  document.querySelector('#ConcertA').addEventListener('change', (evt) => {
    concertA = +evt.target.value;
  });

  let graphOffset = +document.querySelector('#GraphOffset').value;
  document.querySelector('#GraphOffset').addEventListener('change', (evt) => {
    evt.target.value = evt.target.value % semitones;
    graphOffset = +evt.target.value;
    seismo.valueMap = [' ', ...rotateArray(scale, graphOffset), ' '];
  });

  const seismo = new Seismometer(
    document.querySelector('#seismo1'),
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
      seismocolor: 'cyan'
    });

  function frameRender() {
    const pitchData = tuner.getPitchFromSource();
    const note = getNearestNote(pitchData.pitch);

    document.querySelector('#Note').textContent = note.name;
    document.querySelector('#Pitch').textContent = pitchData.pitch.toFixed(2);
    document.querySelector('#Certainty').textContent = (pitchData.p * 100).toFixed(2) + '%';

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

  document.querySelector('#Activator').remove();
}