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
			
			my.canvas = props.canvas;
			my.canvas2d = my.canvas.getContext('2d');
			
			my.analyzer = props.audioContext.createAnalyser();
			my.analyzer.fftSize = props.fftSize || 2048;
			
			my.dataBuffer = new Uint8Array(my.analyzer.frequencyBinCount);
			
			this.render();
		}
		
		render()
		{
			let my = internal(this);
			
			let bufferLength = my.analyzer.frequencyBinCount;
			
			my.analyzer.getByteTimeDomainData(my.dataBuffer);
			
			my.canvas2d.fillStyle = '#000000';
			my.canvas2d.fillRect(0, 0, my.canvas.width, my.canvas.height);

			my.canvas2d.lineWidth = 2;
			my.canvas2d.strokeStyle = '#00ff00';

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
