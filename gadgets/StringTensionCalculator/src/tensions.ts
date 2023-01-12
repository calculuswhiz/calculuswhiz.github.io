// From quadratic regression generated on D'Addario strings
import freqs from './frequencyBases.json';
import materialData from './materialQuadraticParams.json';

/** Acceleration due to gravity (m/s^2) */
const g = 9.80621;

export type StringMaterial = keyof typeof materialData;

/**
 * Estimate unit mass (mass per unit length in kg/m) using a quadratic regression
 * @param material
 * @param gauge Gauge given in 1000ths of an inch
 * */
function estimateUnitMass(material: StringMaterial, gauge: number) {
    const {a, b} = materialData[material] as MaterialRegressionEntry;
    return a * gauge ** 2 + b * gauge;
}

/**
 * Turns Pitch notation into a frequency
 * */
export function pitchToFreq(pitch: string) {
  const [_, base, octave] = pitch.match(/(.+)(\d+)/) ?? [];
  if (base == null)
    return null;
  return freqs[base.toUpperCase()] * 2 ** +octave;
}

/**
 * Calculate tension in kg
 * @param pitch
 * @param material
 * @param gauge
 * @param length
 */
export function calcTension(
    pitch: string,
    material: StringMaterial,
    gauge: number,
    length: number)
{
    const freq = pitchToFreq(pitch);
    const unitMass = estimateUnitMass(material, gauge);
    return (2 * freq * length) ** 2 * unitMass / (g * 1e5);
}

/**
 * Pressure in MPa. Used as a dummy-check for steel strings to not exceed yield strength
 * @param tension given in kg
 * @param gauge given in 1000ths of inch
 * */
export function calcPressure(gauge: number, tension: number) {
    const radius = gauge / 1000 * 2.54 / 100;
    return tension * g / (Math.PI * radius) ** 2 / 1e6;
}

export const StainlessYieldStrength = 520;
