const freqs = {
    'C': 16.35,
    'Db': 17.32,
    'C#': 17.32,
    'D': 18.35,
    'Eb': 19.45,
    'D#': 19.45,
    'E': 20.6,
    'F': 21.83,
    'Gb': 23.12,
    'F#': 23.12,
    'G': 24.5,
    'Ab': 25.96,
    'G#': 25.96,
    'A': 27.5,
    'Bb': 29.14,
    'A#': 29.14,
    'B': 30.87
};
/** Gravitation constant (m/s^2) */
const g = 9.80621;
const materialData = {
    // From quadratic regression generated on D'Addario strings
    'Steel': { a: 0.0003956109244, b: -0.0000002646193476 },
    'FlatwoundSteel': { a: 0.0003769267706, b: -0.001326558938 },
    'PhosphorBronze': { a: 0.0003504919832, b: 0.0005941710054 }
};
function estimateUnitMass(material, gauge) {
    const coeffs = materialData[material];
    return coeffs.a * Math.pow(gauge, 2) + coeffs.b * gauge;
}
/**
 * Turns Pitch notation into a frequency
 * */
function pitchToFreq(pitch) {
    const [_, base, octave] = pitch.match(/(.+)(\d+)/);
    return freqs[base.toUpperCase()] * Math.pow(2, +octave);
}
/**
 * Calculate tension in kg
 * @param pitch
 * @param material
 * @param gauge
 * @param length
 */
function calcTension(pitch, material, gauge, length) {
    const freq = pitchToFreq(pitch);
    return Math.pow((2 * freq * length), 2) * estimateUnitMass(material, gauge) / g / 1e5;
}
/**
 * Pressure in MPa. Used as a dummy-check for steel strings to not exceed yield strength
 * @param tension given in kg
 * @param gauge given in 1000ths of inch
 * */
function calcPressure(gauge, tension) {
    const radius = gauge / 1000 * 2.54 / 100;
    return tension * g / Math.pow((Math.PI * radius), 2) / 1e6;
}
const StainlessYieldStrength = 520;
export { calcTension, calcPressure, StainlessYieldStrength };
