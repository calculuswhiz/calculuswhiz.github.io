/*
	Adds an oscillator source to an existing audioContext. This does not automatically connect anything for you.
*/
let ChromaticScale = (function ()
{
	let map = new WeakMap();
	
	let internal = function (object)
	{
        if (!map.has(object))
            map.set(object, {});
        return map.get(object);
    };
	
	class ChromaticScale
	{
		constructor(props)
		{
			let my = internal(this);
			
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
			this.octaves = coalesce(props, 'octaves', 1);
			
 			my.playing = false;
			my.timer = null;
			
			my.audioContext = props.audioContext;
		}
		
		setProperties(props)
		{
			for (let prop in props)
			{
				this[prop] = props[prop];
			}
		}
		
		turnOn()
		{
			let my = internal(this);

			if (my.playing)
				return;
			else
				my.playing = true;
			
			// Add oscillator to the existing context
			my.oscillator = my.audioContext.createOscillator();
				
			// Initial conditions:
			let { semitones, scaleBase, startFrequency, waveType, msPerNote, octaves } = this;
			let oscillator = my.oscillator;
			oscillator.type = waveType;
			oscillator.frequency.value = startFrequency;
			let step = 0;
			let notesToPlay = octaves * semitones;
			
			oscillator.start();
			
			my.timer = setInterval(function ()
			{
				if (step < notesToPlay)
				{
					oscillator.frequency.value = startFrequency * Math.pow(scaleBase, ++step / semitones);
				}
				else
				{
					oscillator.stop();
					clearInterval(this._timer);
					my.playing = false;
				}
			}.bind(this), msPerNote);
		}
		
		turnOff()
		{
			let my = internal(this);
			
			my.oscillator.stop();
			clearInterval(my.timer);
			my.playing = false;
		}
		
		get active()
		{
			return internal(this).playing;
		}
		
		getPlayingFrequency()
		{
			return internal(this).oscillator.frequency.value;
		}
		
		getNode()
		{
			return internal(this).oscillator;
		}
	}
	
	return ChromaticScale;
})();
