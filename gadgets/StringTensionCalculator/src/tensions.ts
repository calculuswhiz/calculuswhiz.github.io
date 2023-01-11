// From quadratic regression generated on D'Addario strings
import freqs from './frequencyBases.json';
import materialData from './materialQuadraticParams.json';

/** Acceleration due to gravity (m/s^2) */
const g = 9.80621;

type StringMaterial = keyof typeof materialData;

interface MaterialRegressionEntry
{
    /** The quadratic term */
    a: number;
    /** The linear term */
    b: number;
    /** The constant term */
    c: number;
    /** R^2 value */
    rSq: number;
    /** Material description*/
    description: string;
}

/**
 * Estimate unit mass (mass per unit length in kg/m) using a quadratic regression
 * @param material
 * @param gauge Gauge given in 1000ths of an inch
 * */
function estimateUnitMass(material: StringMaterial, gauge: number) {
    const {a, b, c} = materialData[material] as MaterialRegressionEntry;
    return a * gauge ** 2 + b * gauge + c;
}

/**
 * Turns Pitch notation into a frequency
 * */
function pitchToFreq(pitch: string) {
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
function calcTension(
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
function calcPressure(gauge: number, tension: number) {
    const radius = gauge / 1000 * 2.54 / 100;
    return tension * g / (Math.PI * radius) ** 2 / 1e6;
}

const StainlessYieldStrength = 520;

export { calcTension, calcPressure, StringMaterial, StainlessYieldStrength, MaterialRegressionEntry };
