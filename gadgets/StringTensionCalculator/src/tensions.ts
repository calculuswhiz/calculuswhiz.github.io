// From quadratic regression generated on D'Addario strings
import freqs from './frequencyBases.json';
import materialData from './materialQuadraticParams.json';

/** Acceleration due to gravity (m/s^2) */
const g = 9.80621;

export type StringMaterial = keyof typeof materialData;

/**
 * Estimate unit weight (weight per unit length in g/cm) using a quadratic regression
 * @param material
 * @param gauge Gauge given in 1000ths of an inch
 * */
export function estimateUnitWeight(material: StringMaterial, gauge: number) {
    const {a, b} = materialData[material] as MaterialRegressionEntry;
    return .1 * (a * gauge ** 2 + b * gauge);
}

/**
 * Turns Pitch notation into a frequency
 * */
export function pitchToFreq(pitch: string) {
  const [_, base, octave] = pitch.match(/(.+)(\d+)/) ?? [];
  const upperBase = base?.toUpperCase();
  if (base == null || !(upperBase in freqs))
    return null;
  return freqs[upperBase as keyof typeof freqs] * 2 ** +octave;
}

export type AcceptableUnits = 'in' | 'cm';

const cmsInInch = 2.54;
const lbsInKg = 2.2;

/**
 * Calculate tension in kg or lbs depending on unit
 * @param pitch
 * @param material
 * @param gauge in 1/1000ths of inch
 * @param length in cm
 * @param unit Specify unit for length: cm or in. If in, assume output is in lbs, else kg
 */
export function calcTension(
    pitch: string,
    material: StringMaterial,
    gauge: number,
    length: number,
    unit: AcceptableUnits)
{
    const freq = pitchToFreq(pitch) ?? 0;
    const unitWeight = estimateUnitWeight(material, gauge);
    if (unit === 'in') {
        length *= cmsInInch;
        return (2 * freq * length) ** 2 * unitWeight / (g * 1e5) * lbsInKg;
    }
    else {
        return (2 * freq * length) ** 2 * unitWeight / (g * 1e5);
    }
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
