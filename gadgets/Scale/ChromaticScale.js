/*
	Adds an oscillator source to an existing audioContext. This does not automatically connect anything for you.
*/
class ChromaticScale {
	constructor(props) {
		this.semitones = props?.semitones ?? 12;
		this.scaleBase = props?.scaleBase ?? 2;
		this.startFrequency = props?.startFrequency ?? 440;
		this.waveType = props?.waveType ?? 'sine';
		this.msPerNote = props?.msPerNote ?? 500;
		this.octaves = props?.octaves ?? 1;

		this.playing = false;
		this.timer = null;

		this.audioContext = props.audioContext;
	}

	setProperties(props) {
		for (const prop in props)
			this[prop] = props[prop];
	}

	turnOn() {
		if (this.playing)
			return;
		else
			this.playing = true;

		// Add oscillator to the existing context
		this.oscillator = this.audioContext.createOscillator();

		// Initial conditions:
		const { semitones, scaleBase, startFrequency, waveType, msPerNote, octaves } = this;
		const oscillator = this.oscillator;
		oscillator.type = waveType;
		oscillator.frequency.value = startFrequency;
		let step = 0;
		const notesToPlay = octaves * semitones;

		oscillator.start();

		this.timer = setInterval(() => {
			if (step < notesToPlay) {
				step++;
				oscillator.frequency.value = startFrequency * scaleBase ** (step / semitones);
			}
			else {
				oscillator.stop();
				clearInterval(this.timer);
				this.playing = false;
			}
		}, msPerNote);
	}

	turnOff() {
		this.oscillator.stop();
		clearInterval(this.timer);
		this.playing = false;
	}

	get active() {
		return this.playing;
	}

	getPlayingFrequency() {
		return this.oscillator.frequency.value;
	}

	getNode() {
		return this.oscillator;
	}
}