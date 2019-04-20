let PitchAnalyser = (function ()
{
	let map = new WeakMap();
	
	let internal = function (object)
	{
        if (!map.has(object))
            map.set(object, {});
        return map.get(object);
    };

    // I found this implementation by Alejandro Perez, but I found a lot of things to optimize for efficiency.
    const sampleRate = 44100;
    const threshold = 0.05;
    function yinPitch(inputBuffer)
    {
    	let halfBufferLength = inputBuffer.length >> 1;
    	let meanBuffer = new Float32Array(halfBufferLength);
    	meanBuffer[0] = 1;
    	let accumulator = 0;
    	let found = false;
    	let minMean = Infinity;
    	let minTau = 0;

    	// Squared difference:
    	for (let tau = 1; tau < halfBufferLength; tau++)
    	{
    		for (let i = 0; i < halfBufferLength; i++)
    		{
    			let diff = inputBuffer[i] - inputBuffer[i + tau];
    			meanBuffer[tau] += diff * diff;
    		}

	    	// Cumulative mean:
	    	accumulator += meanBuffer[tau];
	    	meanBuffer[tau] *= tau / accumulator;

	    	// Threshold cutoff:
	    	if (found)
	    	{
	    		if (meanBuffer[tau] < minMean)
	    		{
	    			minMean = meanBuffer[tau];
	    			minTau = tau;
	    		}
	    		else
	    			break;
	    	}
	    	else if (meanBuffer[tau] < threshold)
	    	{
	    		found = true;
	    		minTau = tau;
	    		minMean = meanBuffer[tau];
	    	}
    	}

    	if (minTau === 0)
    	{
    		return (
    		{
    			p : 0,
    			pitch : 0
    		});
    	}
    	else
    	{
    		// Interpolate to enhance precision:
    		let prevMean = meanBuffer[minTau - 1];
    		let nextMean = meanBuffer[minTau + 1];
    		minTau += (nextMean - prevMean) / (2 * (2 * meanBuffer[minTau] - prevMean - nextMean));

    		return (
    		{
    			p : 1 - minMean,
    			pitch : sampleRate / minTau
    		});
    	}
    }

    class PitchAnalyser
    {
    	/* Props:
    		audioContext
    		fftSize
    	*/
    	constructor(props)
    	{
    		let my = internal(this);

    		// this.minPitch = props.minPitch;
    		// this.maxPitch = props.maxPitch;

			my.analyser = props.audioContext.createAnalyser();
			this.setFFTSize(props.fftSize || 2048);
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

    	getPitchFromSource()
    	{
    		let my = internal(this);

    		let dataBuffer = my.dataBuffer;

    		// For time-domain analysis
    		my.analyser.getByteTimeDomainData(dataBuffer);

    		return yinPitch(dataBuffer);
    	}

    	/*
			Return the Analyser Node.
		*/
		getNode()
		{
			return internal(this).analyser;
		}
    }

    return PitchAnalyser;
})();