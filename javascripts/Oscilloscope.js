/*
	Create a scope Node.
	How it works:
	1. Instantiate the scope.
	2. Call the getNode().connect() method on the audioContext's destination.
	3. The scope should automatically render to the canvas
*/
let Oscilloscope = (function ()
{
	let map = new WeakMap();
	
	let internal = function (object)
	{
        if (!map.has(object))
            map.set(object, {});
        return map.get(object);
    };
    
	class Oscilloscope
	{
		static get domainType()
		{
			return (
			{
				frequency : 0,
				time : 1
			});
		}
		
		/*
			props: 
			audioContext - an AudioContext object to attach to
			canvas - the cavas to render to
			fftSize - the size of the Fourier Transform
			beamColor = 'green' - html color string
			domain = 1 - One of the values in Oscilloscope.domainType, specifies frequency or time domain
		*/
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
			
			this.beamColor = coalesce(props, 'beamColor', 'green');
			
			this.domain = props.domain == null ? Oscilloscope.domainType.time : props.domain;
			
			my.canvas = props.canvas;
			my.canvas2d = my.canvas.getContext('2d');
			my.canvas2d.font = '14px monospace';
			my.canvas2d.textBaseline = 'top';
			
			my.analyzer = props.audioContext.createAnalyser();
			this.setFFTSize(props.fftSize || 2048);

			// Sets up my.freqRange
			this.setFrequencyWindow(0, 22050);
			
			this.render();
		}
		
		/*
			newSize: the size of the Fourier Transform
		*/
		setFFTSize(newSize)
		{
			let my = internal(this);
			
			if (newSize >= 0)
				my.analyzer.fftSize = newSize;
			
			my.dataBuffer = new Uint8Array(my.analyzer.frequencyBinCount);
		}
		
		/*
			Scale the x axis to match the desired frequency range.
			min : minimum frequency 0-22049
			max : maximum frequency 1-22050
		*/
		setFrequencyWindow(min, max)
		{
			let my = internal(this);

			if (min < 0)
				min = 0;
			else if (min > 22049)
				min = 22049;

			if (max < 1)
				max = 1;
			else if (max > 22050)
				max = 22050;

			if (min > max)
				max = min + 1;

			my.freqRange = 
			{
				min : min,
				max : max
			};
		}

		/*
			No need to call this function.
		*/
		render()
		{
			let my = internal(this);
			
			let bufferLength = my.analyzer.frequencyBinCount;
			
			my.canvas2d.fillStyle = '#000000';
			my.canvas2d.fillRect(0, 0, my.canvas.width, my.canvas.height);
			my.canvas2d.lineWidth = 2;
			my.canvas2d.strokeStyle = this.beamColor;
			
			// Code adapted from MDN website
			let isFreqMode = false;
			if (this.domain === Oscilloscope.domainType.time)
			{
				my.analyzer.getByteTimeDomainData(my.dataBuffer);
			}
			else if (this.domain === Oscilloscope.domainType.frequency)
			{
				my.analyzer.getByteFrequencyData(my.dataBuffer);
				let maxValue = Math.max.apply(null, my.dataBuffer);
				let maxIndex = my.dataBuffer.lastIndexOf(maxValue);

				my.canvas2d.strokeText((maxIndex * 22050 / my.dataBuffer.length).toString(), 0, 0);
				isFreqMode = true;
			}
			else
			{
				my.analyzer.getByteTimeDomainData(my.dataBuffer);
			}

			my.canvas2d.beginPath();

			let freqStep = 22050 / bufferLength;
			let freqToIndex = freq => Math.floor(freq / freqStep);
			// let indexToFreq = index => Math.floor(index * freqStep);

			let x = 0;
			let minIndex = isFreqMode ? 
				freqToIndex(my.freqRange.min) :
				0;
			let maxIndex = isFreqMode ? 
				freqToIndex(my.freqRange.max) :
				bufferLength;

			let xStep = my.canvas.width / (maxIndex - minIndex);
			for (let i = minIndex; i < maxIndex; i++) 
			{
				// Scales to 0-2 range
				let v = my.dataBuffer[i] / 128;
				let y = v * my.canvas.height / 2;

				if (i === 0) 
				{
				  	my.canvas2d.moveTo(x, my.canvas.height - y);
				} 
				else 
				{
				  	my.canvas2d.lineTo(x, my.canvas.height - y);
				}

				x += xStep;
			}

			// If we're in time domain, the axis is at middle:
			my.canvas2d.lineTo(
				my.canvas.width, 
				my.canvas.height >> Number(!isFreqMode)
			);
			my.canvas2d.stroke();
			
			requestAnimationFrame(this.render.bind(this));
		}
		
		/*
			Return the Analyzer Node.
		*/
		getNode()
		{
			return internal(this).analyzer;
		}
	}
	
	return Oscilloscope;
})();