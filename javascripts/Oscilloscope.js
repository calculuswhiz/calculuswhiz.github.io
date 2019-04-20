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

    const maxFrequency = 22050;

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
			canvas - the canvas to render to
			fftSize - the size of the Fourier Transform
			beamColor = 'green' - html color string
			domain = 1 - One of the values in Oscilloscope.domainType, specifies frequency or time domain
		*/
		constructor(props)
		{
			let my = internal(this);
			
			function propagate(props, key, defaultValue)
			{
				if (props == null || props[key] === undefined)
					return defaultValue;
				else
					return props[key];
			}
			
			this.beamColor = propagate(props, 'beamColor', 'green');
			
			this.domain = props.domain == null ? Oscilloscope.domainType.time : props.domain;
			
			my.canvas = props.canvas;
			my.canvas2d = my.canvas.getContext('2d');
			my.canvas2d.font = '14px monospace';
			my.canvas2d.textBaseline = 'top';
			
			my.analyser = props.audioContext.createAnalyser();
			this.setFFTSize(props.fftSize || 2048);

			// Sets up my.freqRange
			this.setFrequencyWindow(0, maxFrequency);
			
			this.render();
		}
		
		/*
			newSize: the size of the Fourier Transform
		*/
		setFFTSize(newSize)
		{
			let my = internal(this);
			
			let allowableFFTSizes = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];

			if (allowableFFTSizes.indexOf(newSize) === -1)
				throw new Error('FFT size invalid:', newSize);

			if (newSize >= 0)
				my.analyser.fftSize = newSize;
			
			my.dataBuffer = new Uint8Array(my.analyser.frequencyBinCount);
		}
		
		/*
			Scale the x axis to match the desired frequency range.
			min : minimum frequency 0-22049
			max : maximum frequency 1-22050
		*/
		setFrequencyWindow(min, max)
		{
			if (min < 0)
				min = 0;
			else if (min > maxFrequency - 1)
				min = maxFrequency - 1;

			if (max < 1)
				max = 1;
			else if (max > maxFrequency)
				max = maxFrequency;

			if (min > max)
				max = min + 1;

			internal(this).freqRange = 
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
			
			let dataBuffer = my.dataBuffer;
			let bufferLength = dataBuffer.length;
			
			let cWidth = my.canvas.width;
			let cHeight = my.canvas.height;
			let ctx2d = my.canvas2d;
			ctx2d.fillStyle = '#000000';
			ctx2d.fillRect(0, 0, cWidth, cHeight);
			ctx2d.lineWidth = 2;
			ctx2d.strokeStyle = this.beamColor;
			
			// Code adapted from MDN website
			let isFreqMode = false;
			if (this.domain === Oscilloscope.domainType.time)
			{
				my.analyser.getByteTimeDomainData(dataBuffer);
			}
			else if (this.domain === Oscilloscope.domainType.frequency)
			{
				my.analyser.getByteFrequencyData(dataBuffer);
				let maxValue = Math.max.apply(null, dataBuffer);
				let maxIndex = dataBuffer.lastIndexOf(maxValue);

				ctx2d.strokeText((maxIndex * maxFrequency / bufferLength).toString(), 0, 0);
				isFreqMode = true;
			}
			else
			{
				my.analyser.getByteTimeDomainData(dataBuffer);
			}

			ctx2d.beginPath();

			let freqStep = maxFrequency / bufferLength;
			let freqToIndex = freq => Math.floor(freq / freqStep);
			// let indexToFreq = index => Math.floor(freqStep * index);

			let x = 0;
			let minIndex = isFreqMode ? 
				freqToIndex(my.freqRange.min) :
				0;
			let maxIndex = isFreqMode ? 
				freqToIndex(my.freqRange.max) :
				bufferLength;

			let xStep = cWidth / (maxIndex - minIndex);
			for (let i = minIndex; i < maxIndex; i++) 
			{
				// Scales to 0-2 range
				let v = dataBuffer[i] / 128;
				let y = v * cHeight / 2;

				if (i === 0) 
				{
				  	ctx2d.moveTo(x, cHeight - y);
				} 
				else 
				{
				  	ctx2d.lineTo(x, cHeight - y);
				}

				x += xStep;
			}

			// If we're in time domain, the axis is at middle:
			ctx2d.lineTo(
				cWidth, 
				cHeight >> Number(!isFreqMode)
			);
			ctx2d.stroke();
			
			requestAnimationFrame(this.render.bind(this));
		}
		
		/*
			Return the Analyser Node.
		*/
		getNode()
		{
			return internal(this).analyser;
		}
	}
	
	return Oscilloscope;
})();