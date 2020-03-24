// Fretted Chordophone Library for Western music.

class Fretophone 
{
    constructor(props) 
    {
        this.name = props.name || 'No name';
        this.courses = props.courses || [];
    }

    getCourseFrets(root, chord) 
    {
        let stringFrets = [];

        this.courses.forEach(function (course)
        {
            stringFrets.push(course.getFretsInChord(root, chord));
        });

        return stringFrets;
    }
}

class Course
{
    constructor(props, options)
    {
        this.startPitch = props.startPitch == null ? 'A' : props.startPitch;
        // Use the nut as the 0 and count up
        this.fretOffset = props.fretOffset == null ? 0 : props.fretOffset;
        // An array of the semitones used (relative)
        this.frets = props.frets == null ? [] : props.frets;

        if (options.isChromatic)
            this.populateChromaticFretboard(this.numFrets);
    }

    populateChromaticFretboard(limit)
    {
        const defaultLimit = 15;
        limit = limit == null ? defaultLimit : limit;

        for (let i = 0; i < limit; i++)
        {
            this.frets.push(i + 1);
        }
    }

    // Chord is an array of intervals used. See TheoryData.js
    getFretsInChord(root, chord) 
    {
        let fretsInChord = [];

        // Collect proper notes
        let chordNotes = new Set();
        let rootIndex = Scale.findIndex(enharmonic => enharmonic.includes(root));
        
        if (rootIndex === -1)
            throw new Exception('Bad note: ' + root);

        chordNotes.add(rootIndex);
        chord.forEach(function (semitones)
        {
            chordNotes.add((rootIndex + semitones) % 12);
        });

        let startPitchIndex = Scale.findIndex(enharmonic => enharmonic.includes(this.startPitch));
        // Add fret if its pitch is in the chord
        for (let i = 0, len = this.frets.length; i < len; i++)
        {
            let note = (startPitchIndex + i) % 12;
            let isInChord = chordNotes.has(note);
            if (isInChord)
            {
                fretsInChord.push(i);
            }
        }

        return fretsInChord;
    }
}
