// Music theory
const Scale = 
[
    ['A'], ['A#', 'Bb'], 
    ['B'], 
    ['C'], ['C#', 'Db'], 
    ['D'], ['D#', 'Eb'], 
    ['E'], 
    ['F'], ['F#', 'Gb'], 
    ['G'], ['G#', 'Ab']
];

// Add reverse indexing
let ScaleReverse = {};
for (let i = 0, len = Scale.length; i < len; i++)
{
    let note = Scale[i];
    for (let j = 0, len = note.length; j < len; j++)
    {
        let enharmonic = note[j];
        ScaleReverse[enharmonic] = i;
    }
}

let ConcertPitch = 440;

const Intervals = 
{
    P1: 0, uni: 0, D2: 0,
    m2: 1, A1: 1, S: 1,
    M2: 2, D3: 2, T: 2,
    m3: 3, A2: 3,
    M3: 4, D4: 4,
    P4: 5, A3: 5,
    D5: 6, A4: 6, TT: 6,
    P5: 7, D6: 7,
    m6: 8, A5: 8,
    M6: 9, D7: 9,
    m7: 10, A6: 10,
    M7: 11, D8: 11,
    oct: 12, P8: 12,

    convertExtended : function (ext)
    {
        let mod = ext[0];
        let int = parseInt(ext.substring(1)) - 7;

        return Intervals[mod + int];
    }
};

const ReverseIntervals = ['Root', 'm2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7'];

// Define chords by semitones. Root is implicit.
let ChordIntervals = 
{
    Root : [],

    // The triads
    Major : [Intervals.M3, Intervals.P5],
    Minor : [Intervals.m3, Intervals.P5],
    Aug : [Intervals.M3, Intervals.A5],
    Dim : [Intervals.m3, Intervals.D5],
};

// Sevenths
ChordIntervals['Dim7'] = ChordIntervals.Dim.concat(Intervals.D7);
ChordIntervals['HalfDim7'] = ChordIntervals.Dim.concat(Intervals.m7);
ChordIntervals['Minor7'] = ChordIntervals.Minor.concat(Intervals.m7);
ChordIntervals['MinMaj7'] = ChordIntervals.Minor.concat(Intervals.M7);
ChordIntervals['Dom7'] = ChordIntervals.Major.concat(Intervals.m7);
ChordIntervals['Maj7'] = ChordIntervals.Major.concat(Intervals.M7);
ChordIntervals['Aug7'] = ChordIntervals.Aug.concat(Intervals.m7);
ChordIntervals['AugMaj7'] = ChordIntervals.Aug.concat(Intervals.M7);

// Extended
ChordIntervals['Dom9'] = ChordIntervals.Dom7.concat(Intervals.convertExtended('M9'));
ChordIntervals['Dom11'] = ChordIntervals.Dom7
    // Omit m3
    .filter(int => int != Intervals.m3)
    .concat(Intervals.convertExtended('M9'), Intervals.convertExtended('P11'));
// Omit P11
ChordIntervals['Dom13'] = ChordIntervals.Dom7.concat(Intervals.convertExtended('M9'), Intervals.convertExtended('P13'));
// Add chordName property
for (let chordName in ChordIntervals)
{
    ChordIntervals[chordName].chordName = chordName;
}
