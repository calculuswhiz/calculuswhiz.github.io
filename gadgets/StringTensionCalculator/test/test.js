const Tensions = require('./src/tensions.js');
const assert = require('assert');

const guitarScaleLength = 25.5;
const lbsInKg = 2.2;
const cmInIn = 2.54;

describe(
	'Tensions', () => {
		describe('pitchToFreq', () => {
			it('Returns 440 for A4', () => {
				assert.equal(Tensions.pitchToFreq('A4'), 440);
			});
		});

		describe('estimateUnitWeight', () => {
			it('Matches D\'Addario data for Plain Steel', () => {
				const result = Tensions.estimateUnitWeight('PL', 12);
				// lbs/in converted to g/cm
				const valFromTable = .00003190 / lbsInKg * 1000 / cmInIn;
				const diff = Math.abs(result - valFromTable) / valFromTable;

				assert.ok(diff < .01);
			});
		});

		describe('calcTension', () => {
			it('Matches D\'Addario data for Plain Steel', () =>
			{
				const result = Tensions.calcTension('E4', 'PL', 12, guitarScaleLength, 'in');
				// lbs to kg
				const valFromTable = 23.3 / lbsInKg;
				const diff = Math.abs(result - valFromTable) / valFromTable;
				assert.ok(diff < .01, `${diff} is outside tolerance range of 1%. Actual result was ${result}`);
			});
		});
	}
);
