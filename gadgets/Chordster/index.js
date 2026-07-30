// C0
const baseC = 16.35;
const defaultOctaveMod = 4;
const semitones = 12;
// Backwards scale so that up/down adjusts semitones as expected in the dropdown
const scale =
  [
    'B', 'A#/Bb', 'A',
    'G#/Ab', 'G', 'F#/Gb',
    'F', 'E', 'D#/Eb',
    'D', 'C#/Db', 'C'
  ];
// Swap enharmonics
const swappedScale = scale.map(item => item.split('/').reverse().join('/'));

// 0 is always root
const presets =
{
  'Unison': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

  'Maj': [0, 4, 7, 12, 16, 19, 24, 28, 31, 36],
  'Maj6': [0, 4, 7, 9, 12, 16, 19, 21, 24, 28],
  'Dom7': [0, 4, 7, 10, 12, 16, 19, 22, 24, 28],
  'Maj7': [0, 4, 7, 11, 12, 16, 19, 23, 24, 28],
  'Aug': [0, 4, 8, 12, 16, 20, 24, 28, 32, 36],
  'Aug7': [0, 4, 8, 10, 12, 16, 20, 22, 24, 28],

  'Min': [0, 3, 7, 12, 15, 19, 24, 27, 31, 36],
  'Min6': [0, 3, 7, 9, 12, 15, 19, 21, 24, 27],
  'Min7': [0, 3, 7, 10, 12, 15, 19, 22, 24, 27],
  'Min/maj7': [0, 3, 7, 11, 12, 15, 19, 23, 24, 27],
  'Dim': [0, 3, 6, 12, 15, 18, 24, 27, 30, 36],
  'Dim7': [0, 3, 6, 9, 12, 15, 18, 21, 24, 27],
  '1/2 Dim7': [0, 3, 6, 10, 12, 15, 18, 22, 24, 27]
};
function setPresets() {
  const key = document.querySelector('#presets-menu')?.value ?? "";
  if (key === '') {
    alert('Please select a preset first.')
    return;
  }

  const intervals = presets[key];

  const rootChannel = document.querySelector('#master-controls');
  const rootNoteIndex = +rootChannel.querySelector('.note-selector').value;
  const rootOctaveModifier = +rootChannel.querySelector('.octave-input').value;

  for (const [i, interval] of intervals.entries()) {
    const affectedChannel = document.querySelector(`#channel-ctl-${i}`);
    const offsetIndex = rootNoteIndex + interval;

    const noteSelectorElement = affectedChannel.querySelector('.note-selector');
    noteSelectorElement.value = (offsetIndex % semitones + semitones) % semitones;
    noteSelectorElement.dispatchEvent(new Event('change'));

    const octaveInputElement = affectedChannel.querySelector('.octave-input');
    octaveInputElement.value = rootOctaveModifier + Math.floor(offsetIndex / semitones);
    octaveInputElement.dispatchEvent(new Event('change'));
  }
}

const numOscillators = 10;
let audioContext, scope;

let numActive = 0;

const outputBag = [];

function adjustAllGains() {
  outputBag.forEach(function (channelItem) {
    channelItem.gainNode.gain.setValueAtTime(
      numActive > 0 ?
        1 / (numActive) :
        0,
      0
    );
  });
}

function toggleChannelCallbackGen(i) {
  return (evt) => {
    const channel = document.querySelector(`#channel-ctl-${i}`);
    const channelItem = outputBag[i];
    channelItem.isConnected = !channelItem.isConnected;
    if (channelItem.isConnected) {
      numActive++;
      channel.querySelector('.channel-switch').classList.remove('switch-off');
      channel.querySelector('.channel-switch').classList.add('switch-on');
      channelItem.gainNode.connect(scope.getNode());
      adjustAllGains();
    }
    else {
      numActive--;
      channel.querySelector('.channel-switch').classList.remove('switch-on');
      channel.querySelector('.channel-switch').classList.add('switch-off');
      channelItem.gainNode.disconnect(scope.getNode());
      adjustAllGains();
    }
  };
}

function setChannelFreqGen(i) {
  return (evt) => {
    const channel = document.querySelector(`#channel-ctl-${i}`);
    const oscillatorNode = outputBag[i].oscillatorNode;

    const noteIndex = +channel.querySelector('.note-selector').value;
    const octaveModifier = +channel.querySelector('.octave-input').value;
    const frequency = baseC * 2 ** (octaveModifier + noteIndex / semitones);
    oscillatorNode.frequency.value = frequency;
  };
}

function buildMixer(audioContext) {
  let channelsRoot = document.querySelector('#channels-root');
  scope = new Oscilloscope({
    audioContext: audioContext,
    canvas: document.querySelector('canvas'),
    fftSize: 4096,
    beamColor: '#0f0',
    domain: Oscilloscope.domainType.time
  });
  scope.getNode().connect(audioContext.destination);

  for (let i = 0; i < numOscillators; i++) {
    const oscillatorNode = audioContext.createOscillator();
    oscillatorNode.type = 'sine';
    oscillatorNode.frequency.value = baseC * 2 ** defaultOctaveMod;
    oscillatorNode.start();

    const gainNode = audioContext.createGain();
    oscillatorNode.connect(gainNode);

    outputBag.push({
      oscillatorNode: oscillatorNode,
      gainNode: gainNode,
      isConnected: false
    });

    // To play, connect it to destination
    // To stop, disconnect it

    const channelDiv = document.createElement('div');
    channelDiv.id = `channel-ctl-${i}`;
    channelDiv.className = 'channel-ctl';

    const channelInd = document.createElement('span');
    channelInd.className = 'channel-ind';
    channelInd.textContent = `Channel: ${i}`;
    channelDiv.appendChild(channelInd);

    const channelSwitch = document.createElement('span');
    channelSwitch.id = `channel-switch-${i}`;
    channelSwitch.className = 'channel-switch switch-off';
    channelSwitch.addEventListener('click', toggleChannelCallbackGen(i));
    channelDiv.appendChild(channelSwitch);

    const noteDiv = document.createElement('div');
    const noteLabel = document.createElement('span');
    noteLabel.className = 'label';
    noteLabel.textContent = 'Note: ';
    noteDiv.appendChild(noteLabel);

    const noteSelect = document.createElement('select');
    noteSelect.className = 'note-selector';
    swappedScale.forEach((noteName, index) => {
      const option = document.createElement('option');
      option.value = swappedScale.length - index - 1;
      if (index === swappedScale.length - 1)
        option.selected = true;
      option.textContent = noteName;
      noteSelect.appendChild(option);
    });
    noteSelect.addEventListener('change', setChannelFreqGen(i));
    noteDiv.appendChild(noteSelect);
    channelDiv.appendChild(noteDiv);

    const octaveDiv = document.createElement('div');
    const octaveLabel = document.createElement('span');
    octaveLabel.className = 'label';
    octaveLabel.textContent = 'Octave Modifier: ';
    octaveDiv.appendChild(octaveLabel);

    const octaveInput = document.createElement('input');
    octaveInput.type = 'text';
    octaveInput.className = 'octave-input';
    octaveInput.value = defaultOctaveMod;
    octaveInput.addEventListener('change', setChannelFreqGen(i));
    octaveDiv.appendChild(octaveInput);
    channelDiv.appendChild(octaveDiv);

    channelsRoot.appendChild(channelDiv);
  }

  for (let preset in presets) {
    const option = document.createElement('option');
    option.value = preset;
    option.textContent = preset;
    document.querySelector('#presets-menu').append(option);
  }
  document.querySelector('#apply-preset').addEventListener('click', setPresets);

  document.querySelector('#master-killswitch').addEventListener('click', () => {
    for (let i = 0; i < numOscillators; i++) {
      const channelSwitch = document.querySelector(`#channel-switch-${i}`);
      if (channelSwitch.classList.contains('switch-on'))
        channelSwitch.click();
    }
  });

  document.querySelector('#master-onswitch').addEventListener('click', function () {
    for (let i = 0; i < numOscillators; i++) {
      const channelSwitch = document.querySelector(`#channel-switch-${i}`);
      if (channelSwitch.classList.contains('switch-off'))
        channelSwitch.click();
    }
  });

  document.querySelector('#single-octave-btn').addEventListener('click', function () {
    const rootChannel = document.querySelector('#master-controls');
    const rootNoteIndex = +rootChannel.querySelector('.note-selector').value;
    const rootOctaveModifier = +rootChannel.querySelector('.octave-input').value;

    for (let i = 0; i < numOscillators; i++) {
      const channelSwitch = document.querySelector(`#channel-switch-${i}`);
      const channel = document.querySelector(`#channel-ctl-${i}`);
      const noteIndex = +channel.querySelector('.note-selector').value;
      const octaveModifier = +channel.querySelector('.octave-input').value;

      const semitoneDifference = (octaveModifier - rootOctaveModifier) * 12 + (noteIndex - rootNoteIndex);

      if (semitoneDifference < 12 && semitoneDifference >= 0) {
        if (channelSwitch.classList.contains('switch-off'))
          channelSwitch.click();
      }
      else {
        if (channelSwitch.classList.contains('switch-on'))
          channelSwitch.click();
      }
    }
  });
}

function keyboardHandler(evt) {
  for (let i = 0; i < numOscillators; i++) {
    if (evt.ctrlKey && evt.key === i.toString()) {
      document.querySelector(`#channel-switch-${i}`).click();
      break;
    }
  }
}

function ready() {
  audioContext = new (window.AudioContext ?? window.webkitAudioContext)();

  buildMixer(audioContext);

  document.body.addEventListener('keyup', keyboardHandler);
  document.querySelector('#activator').remove();
}