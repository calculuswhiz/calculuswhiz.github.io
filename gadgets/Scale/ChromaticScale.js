class ChromaticScale
{
	constructor(props)
	{
		function coalesce(props, key, defaultValue)
		{
			if (props == null || props[key] === undefined)
				return defaultValue;
			else
				return props[key];
		}
		
		this.semitones = coalesce(props, 'semitones', 12);
		this.scaleBase = coalesce(props, 'scaleBase', 2);
		this.startFrequency = coalesce(props, 'startFrequency', 440);
		this.waveType = coalesce(props, 'waveType', 'sine');
		this.msPerNote = coalesce(props, 'msPerNote', 500);
		this.octaves = coalesce(props, 'octaves', 1)
		
		this._playing = false;
		this._timer = null;
		this._audioContext = new AudioContext();
		this._oscillator = this._audioContext.createOscillator();
		this._oscillator.connect(this._audioContext.destination);
	}
	
	play()
	{
		if (this._playing)
			return;
		else
			this._playing = true;
			
		// Initial conditions:
		let { semitones, scaleBase, startFrequency, waveType, msPerNote, octaves } = this;
		let oscillator = this._oscillator;
		oscillator.type = waveType;
		oscillator.frequency.value = startFrequency;
		let step = 0;
		let notesToPlay = octaves * semitones;
		
		oscillator.start();
		
		this._timer = setInterval(function ()
		{
			if (step < notesToPlay)
			{
				oscillator.frequency.value = startFrequency * Math.pow(scaleBase, ++step / semitones);
			}
			else
			{
				oscillator.stop();
				clearInterval(this._timer);
				this._playing = false;
			}
		}.bind(this), msPerNote);
	}
	
	stop()
	{
		this._oscillator.stop();
		clearInterval(this._timer);
		this._playing = false;
	}
	
	isPlaying()
	{
		return this._playing;
	}
	
	getPlayingFrequency()
	{
		return this._oscillator.frequency.value;
	}
}
