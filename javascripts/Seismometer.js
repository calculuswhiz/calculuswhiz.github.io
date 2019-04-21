class Seismometer
{
    constructor(canvas, graphProps, styleProps)
    {
        this.canvas = canvas;
        
        this.yMax          = graphProps.yMax;
        this.yMin          = graphProps.yMin;
        this.numberOfLines = graphProps.numberOfLines;
        this.maxJump       = graphProps.maxJump;
        this.valueMap      = graphProps.valueMap || {};
        
        this.bgColor        = (styleProps && styleProps.bgColor) ? styleProps.bgColor : 'white';
        this.fgColor        = (styleProps && styleProps.fgColor) ? styleProps.fgColor : 'black';
        this.seismocolor    = (styleProps && styleProps.seismocolor) ? styleProps.seismocolor : 'red';

        this.dataSet = new Float32Array(canvas.width);

        this.render();
    }
    
    pushNewValue(value)
    {
        let i = 0;
        for (let len = this.dataSet.length; i < len - 1; i++)
        {
            this.dataSet[i] = this.dataSet[i + 1];
        }
        this.dataSet[i] = value;
    }
    
    reset()
    {
        for (let i = 0, len = this.dataSet.length; i < len; i++)
        {
            this.dataSet[i] = 0;
        }
    }
    
    render()
    {
        let canvas        = this.canvas;
        let ctx           = canvas.getContext('2d');
        let width         = canvas.width;
        let height        = canvas.height;
        let dataSet       = this.dataSet;
        let yMax          = this.yMax;
        let yMin          = this.yMin;
        let deltaY        = yMax - yMin;
        let numberOfLines = this.numberOfLines;
        
        // Draw background color:
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set up foreground:
        ctx.strokeStyle = this.fgColor;
        ctx.fillStyle   = this.fgColor;
        ctx.lineWidth   = 1;
        ctx.font        = '10px sans-serif';
        
        // Draw gridlines:
        for (let i = 0; i < numberOfLines; i++)
        {
            let ycalc = height - i * height / numberOfLines;
            
            ctx.beginPath();
            ctx.moveTo(0, ycalc);
            ctx.lineTo(width, ycalc);
            ctx.stroke();
            let label = Math.round(i * deltaY / numberOfLines) + yMin;
            let mapped = this.valueMap[label];
            if (mapped != null)
                ctx.fillText(mapped, 0, ycalc);
            else
                ctx.fillText(label, 0, ycalc);
        }
        
        // Draw graph:
        ctx.strokeStyle = this.seismocolor;
        ctx.beginPath();
        ctx.moveTo(0, height * (1 - (dataSet[0] - yMin) / deltaY));
        
        for (let i = 1; i < width; i++)
        {
            let method;
            if (Math.abs(dataSet[i - 1] - dataSet[i]) > this.maxJump)
                method = 'moveTo';
            else
                method = 'lineTo';
            
            ctx[method](i, height * (1 - (dataSet[i] - yMin) / deltaY));
        }

        ctx.stroke();
    }
}
