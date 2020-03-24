let Instruments = [
	new Fretophone({
		name: 'Standard Guitar',
		courses : [
			new Course({startPitch: 'E'}, {isChromatic : true}),
			new Course({startPitch: 'A'}, {isChromatic : true}),
			new Course({startPitch: 'D'}, {isChromatic : true}),
			new Course({startPitch: 'G'}, {isChromatic : true}),
			new Course({startPitch: 'B'}, {isChromatic : true}),
			new Course({startPitch: 'E'}, {isChromatic : true})
		]
	}),
	new Fretophone({
		name: 'DADGAD Guitar',
		courses : [
			new Course({startPitch: 'D'}, {isChromatic : true}),
			new Course({startPitch: 'A'}, {isChromatic : true}),
			new Course({startPitch: 'D'}, {isChromatic : true}),
			new Course({startPitch: 'G'}, {isChromatic : true}),
			new Course({startPitch: 'A'}, {isChromatic : true}),
			new Course({startPitch: 'D'}, {isChromatic : true})
		]
	}),
	new Fretophone({
		name: 'Russian Guitar',
		courses : [
			new Course({startPitch: 'D'}, {isChromatic : true}),
			new Course({startPitch: 'G'}, {isChromatic : true}),
			new Course({startPitch: 'B'}, {isChromatic : true}),
			new Course({startPitch: 'D'}, {isChromatic : true}),
			new Course({startPitch: 'G'}, {isChromatic : true}),
			new Course({startPitch: 'B'}, {isChromatic : true}),
			new Course({startPitch: 'D'}, {isChromatic : true})
		]
	}),
	new Fretophone({
		name: 'Standard Mandolin',
		courses : [
			new Course({startPitch: 'G'}, {isChromatic : true}),
			new Course({startPitch: 'D'}, {isChromatic : true}),
			new Course({startPitch: 'A'}, {isChromatic : true}),
			new Course({startPitch: 'E'}, {isChromatic : true})
		]
	}),
	new Fretophone({
		name: 'Prima Balalaika',
		courses : [
			new Course({startPitch: 'E'}, {isChromatic : true}),
			new Course({startPitch: 'E'}, {isChromatic : true}),
			new Course({startPitch: 'A'}, {isChromatic : true})
		]
	})
];

Instruments.findInstrument = function (name)
{
	return this.find(instrument => instrument.name === name);
};
