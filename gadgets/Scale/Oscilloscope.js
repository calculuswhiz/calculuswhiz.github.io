/*
	Create a scope Node.
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
			
			my.canvas = props.canvas;
			my.canvas2d = my.canvas.getContext('2d');
			
			my.analyzer = props.audioContext.createAnalyser();
			this.setFFTSize(props.fftSize || 2048);
			
			this.render();
		}
		
		setFFTSize(newSize)
		{
			let my = internal(this);
			
			if (newSize >= 0)
				internal(this).analyzer.fftSize = newSize;
			
			my.dataBuffer = new Uint8Array(my.analyzer.frequencyBinCount);
		}
		
		render()
		{
			let my = internal(this);
			
			let bufferLength = my.analyzer.frequencyBinCount;
			
			// Code adapted from MDN website
			my.analyzer.getByteTimeDomainData(my.dataBuffer);
			
			my.canvas2d.fillStyle = '#000000';
			my.canvas2d.fillRect(0, 0, my.canvas.width, my.canvas.height);

			my.canvas2d.lineWidth = 2;
			my.canvas2d.strokeStyle = this.beamColor;

			my.canvas2d.beginPath();

			let sliceWidth = my.canvas.width * 1.0 / bufferLength;
			let x = 0;

			for (let i = 0; i < bufferLength; i++) 
			{
				let v = my.dataBuffer[i] / 128.0;
				let y = v * my.canvas.height / 2;

				if (i === 0) 
				{
				  	my.canvas2d.moveTo(x, y);
				} 
				else 
				{
				  	my.canvas2d.lineTo(x, y);
				}

				x += sliceWidth;
			}

			my.canvas2d.lineTo(my.canvas.width, my.canvas.height / 2);
			my.canvas2d.stroke();
			
			requestAnimationFrame(this.render.bind(this));
		}
		
		getNode()
		{
			return internal(this).analyzer;
		}
	}
	
	return Oscilloscope;
})();
