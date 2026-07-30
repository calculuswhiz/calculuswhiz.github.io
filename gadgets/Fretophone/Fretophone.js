// Fretted Chordophone Library for Western music.

class Fretophone {
  constructor(props) {
    this.name = props.name ?? 'No name';
    this.courses = props.courses ?? [];
  }

  copy() {
    return new Fretophone({
      name: this.name,
      courses: this.courses.map(course => course.copy())
    });
  }

  getCourseFrets(root, chord) {
    return this.courses.map(course => course.getFretsInChord(root, chord));
  }
}

class Course {
  constructor(props, options) {
    this.startPitch = props.startPitch ?? 'A';
    // Use the nut as the 0 and count up
    this.fretOffset = props.fretOffset ?? 0;
    // An array of the semitones used (relative) contains numbers
    this.frets = props.frets ?? [];

    if ((options ?? {}).isChromatic)
      this.populateChromaticFretboard(options.numFrets);
  }

  copy() {
    return new Course({
      startPitch: this.startPitch,
      fretOffset: this.fretOffset,
      frets: [...this.frets]
    });
  }

  tuneSteps(vector) {
    const startIndex = Scale.findIndex(enharmonic => enharmonic.includes(this.startPitch));
    this.startPitch = Scale[((startIndex + vector) % 12 + 12) % 12][0];
  }

  populateChromaticFretboard(limit = 15) {
    for (let i = 0; i < limit; i++)
      this.frets.push(i + 1);
  }

  // Chord is an array of intervals used. See TheoryData.js
  getFretsInChord(root, chord) {
    const fretsInChord = [];

    // Collect proper notes
    const chordNotes = new Set();
    const rootIndex = Scale.findIndex(enharmonic => enharmonic.includes(root));

    if (rootIndex === -1)
      throw new Error('Bad note: ' + root);

    for (const semitones of chord)
      chordNotes.add((rootIndex + semitones) % 12);

    const startPitchIndex = Scale.findIndex(enharmonic => enharmonic.includes(this.startPitch));

    // Start with nut
    if (chordNotes.has(startPitchIndex)) {
      fretsInChord.push({
        openSTDiff: 0,
        chordSTDiff: Math.abs(rootIndex - startPitchIndex)
      });
    }

    // Add fret if its pitch is in the chord
    for (const fret of this.frets) {
      const noteIndex = (startPitchIndex + fret) % 12;
      const isInChord = chordNotes.has(noteIndex);

      if (isInChord) {
        fretsInChord.push({
          openSTDiff: fret,
          chordSTDiff: (noteIndex - rootIndex + 12) % 12
        });
      }
    }

    return fretsInChord;
  }
}
