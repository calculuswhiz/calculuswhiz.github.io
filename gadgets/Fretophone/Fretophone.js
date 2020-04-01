// Fretted Chordophone Library for Western music.

class Fretophone 
{
    constructor(props) 
    {
        this.name = props.name || 'No name';
        this.courses = props.courses || [];
    }

    copy()
    {
        return new Fretophone(
        {
            name : this.name,
            courses : this.courses.map(course => course.copy())
        });
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
        // An array of the semitones used (relative) contains numbers
        this.frets = props.frets == null ? [] : props.frets;

        if ((options || {}).isChromatic)
            this.populateChromaticFretboard(this.numFrets);
    }

    copy()
    {
        return new Course(
        {
            startPitch : this.startPitch,
            fretOffset : this.fretOffset,
            frets : [...this.frets]
        });
    }

    tuneSteps(vector)
    {
        let startIndex = Scale.findIndex(enharmonic => enharmonic.includes(this.startPitch));
        this.startPitch = Scale[((startIndex + vector) % 12 + 12) % 12][0];
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
        {
            throw new Exception('Bad note: ' + root);
        }

        chordNotes.add(rootIndex);
        chord.forEach(function (semitones)
        {
            chordNotes.add((rootIndex + semitones) % 12);
        });

        let startPitchIndex = Scale.findIndex(enharmonic => enharmonic.includes(this.startPitch));
        
        // Start with nut
        if (chordNotes.has(startPitchIndex))
        {
            fretsInChord.push(
            {
                openSTDiff: 0,
                chordSTDiff: Math.abs(rootIndex - startPitchIndex)
            });
        }

        // Add fret if its pitch is in the chord
        for (let i = 0, len = this.frets.length; i < len; i++)
        {
            let fret = this.frets[i];
            let noteIndex = (startPitchIndex + fret) % 12;
            let isInChord = chordNotes.has(noteIndex);

            if (isInChord)
            {
                fretsInChord.push(
                {
                    openSTDiff: fret,
                    chordSTDiff: (noteIndex - rootIndex + 12) % 12
                });
            }
        }

        return fretsInChord;
    }
}
