function drawFretboard(instrument) {
  const fretboard = document.querySelector('#fretboard');
  fretboard.innerHTML = '';

  // Draw nut
  const stringSegContainer0 = document.createElement('div');
  stringSegContainer0.id = 'string-segment-container-0';
  stringSegContainer0.className = 'string-segment-container';
  stringSegContainer0.textContent = '00';
  fretboard.appendChild(stringSegContainer0);
  for (const [i, course] of instrument.courses.entries()) {
    const startPitch = course.startPitch;
    const innerDiv = document.createElement('div');
    innerDiv.id = `string-segment-0-${i}`;
    innerDiv.title = 'Click to retune';
    innerDiv.className = 'fret-0';
    innerDiv.textContent = startPitch;
    innerDiv.addEventListener('click', (evt) => {
      if (!instrument.name.includes('retuned'))
        instrument.name += ' (retuned)';

      // Retuning
      let retuneNote = prompt(`Input new note or +/- number of steps to retune string ${i + 1} (${startPitch}).`) ||
        '';
      retuneNote = retuneNote.toUpperCase();

      if (!isNaN(+retuneNote))
        course.tuneSteps(+retuneNote);
      else if (ScaleReverse[retuneNote] != null)
        course.startPitch = retuneNote.toUpperCase();
      else
        return;

      redrawAll({ useExistingInstrument: true });
    });
    stringSegContainer0.append(innerDiv);
  }

  // So we cover each fret
  const fretLimit = Math.max(
    ...instrument.courses.map(course =>
      course.frets.length + course.fretOffset))
    + 1;

  // Draw segments
  for (let fretOffset = 1; fretOffset < fretLimit; fretOffset++) {
    // Each segment is bound by this container
    const stringSegContainer = document.createElement('div');
    stringSegContainer.id = `string-segment-container-${fretOffset}`;
    stringSegContainer.className = 'string-segment-container';
    stringSegContainer.textContent = fretOffset.toString().padStart(2, '0');
    fretboard.appendChild(stringSegContainer);

    // Fill each container
    for (const [courseIdx, course] of instrument.courses.entries()) {
      // String does not exist here
      const noString = course.fretOffset > fretOffset;
      // Fret does not exist here (subtract for relative interval)
      const noFret = !course.frets.includes(fretOffset - course.fretOffset);

      const title = !(noFret || noString)
        ? Scale[(ScaleReverse[course.startPitch] + fretOffset) % 12].join('/')
        : '-';

      const innerDiv = document.createElement('div');
      // id: fret-course
      innerDiv.id = `string-segment-${(fretOffset - course.fretOffset).toString().replace('-', 'n')}-${courseIdx}`;
      innerDiv.title = title;
      innerDiv.className = `string-segment ${noString ? 'no-string' : ''} ${noFret ? 'no-fret' : ''}`;
      stringSegContainer.appendChild(innerDiv);
    };
  }
}

function drawChordNotes(instrument, root, chord) {
  updateStatus(`Drew: <${root} ${chord.chordName}> for <${instrument.name}>`);

  for (const el of document.querySelectorAll('.note-marker'))
    el.classList.remove('note-marker');

  const fretboard = document.querySelector('#fretboard');

  const courseFrets = instrument.getCourseFrets(root, chord);

  // Add extra childElements to the fretboard
  for (const [courseIdx, fretList] of courseFrets.entries()) {
    for (const [fretIdx, fret] of fretList.entries()) {
      let segment = document.querySelector(`#string-segment-${fret.openSTDiff}-${courseIdx}`);
      segment.title = `${ReverseIntervals[fret.chordSTDiff]} (${segment.title})`;
      segment.classList.add('note-marker-fret-' + fret.chordSTDiff);
    }
  }
}

function decorateIntervalControl(chord) {
  for (let i = 0, len = ReverseIntervals.length; i < len; i++) {
    if (chord.has(i))
      document.querySelector(`#interval-ctl-btn-${i}`).classList.add('added-interval');
    else
      document.querySelector(`#interval-ctl-btn-${i}`).classList.remove('added-interval');
  }
}

function updateStatus(message) {
  document.querySelector('#status').prepend(document.createTextNode(message + '\n'));
}

let lastInstrumentDrawn;
let lastRootDrawn;
let lastChordDrawn;
function redrawAll(props = {}) {
  const useExistingInstrument = props.useExistingInstrument;
  const useExistingChord = props.useExistingChord;

  const instrument = useExistingInstrument
    ? lastInstrumentDrawn
    : Instruments.find(instrument =>
      instrument.name === document.querySelector('#instrument-select').value
    ).copy();
  const rootNote = document.querySelector('#root-select').value.replace(/s-.*/, '#');
  const chord = useExistingChord
    ? lastChordDrawn
    : ChordIntervals[document.querySelector('#chord-select').value];

  if (!useExistingInstrument) {
    // Update Instrument
    lastInstrumentDrawn = instrument;
  }

  if (!useExistingChord) {
    // Update Chord
    lastRootDrawn = rootNote;
    lastChordDrawn = new Set(chord);
    lastChordDrawn.chordName = chord.chordName;
  }

  drawFretboard(instrument);
  drawChordNotes(instrument, rootNote, chord);
  decorateIntervalControl(new Set(chord));
}

document.addEventListener("DOMContentLoaded", () => {
  // Create Controls:
  for (const instrument of Instruments) {
    const instrumentSelect = document.querySelector('#instrument-select');
    const option = document.createElement('option');
    option.value = instrument.name;
    option.textContent = `${instrument.name} (${instrument.courses.length} courses)`;
    instrumentSelect.appendChild(option);
  }

  for (const note of Scale) {
    const rootSelect = document.querySelector('#root-select');
    const option = document.createElement('option');
    option.value = note.join('').replace('#', 's-');
    option.textContent = note.join('/');
    rootSelect.appendChild(option);
  }

  for (const chord in ChordIntervals) {
    const chordSelect = document.querySelector('#chord-select');
    const option = document.createElement('option');
    option.value = chord;
    option.textContent = chord;
    chordSelect.appendChild(option);
  }

  for (const [i, interval] of ReverseIntervals.entries()) {
    const intervalControl = document.querySelector('#interval-control');
    const button = document.createElement('button');
    button.textContent = interval;
    button.id = `interval-ctl-btn-${i}`;
    button.classList.add('interval-ctl-btn');
    button.addEventListener('click', (evt) => {
      if (!lastChordDrawn.has(i)) {
        lastChordDrawn.add(i);
        updateStatus(`Added: ${ReverseIntervals[i]}`);
      }
      else {
        lastChordDrawn.delete(i);
        updateStatus(`Removed: ${ReverseIntervals[i]}`);
      }

      redrawAll({
        useExistingInstrument: true,
        useExistingChord: true
      });
    });
    intervalControl.appendChild(button);
  }

  // Add event listeners
  document.querySelector('#instrument-select').addEventListener('change', (evt) => {
    redrawAll();
  });

  for (const selector of ['#root-select', '#chord-select']) {
    document.querySelector(selector).addEventListener('change', (evt) => {
      redrawAll({ useExistingInstrument: true });
    });
  }

  // Draw legend
  for (let i = 0; i < Scale.length; i++) {
    const legend = document.querySelector('#legend');
    const div = document.createElement('div');
    div.classList.add('note-marker-' + i);
    div.classList.add('legend-item');
    div.textContent = `${i} (${ReverseIntervals[i]})`;
    legend.appendChild(div);
    if ((i + 1) % 3 === 0)
      legend.appendChild(document.createElement('br'));
  }

  redrawAll();
});