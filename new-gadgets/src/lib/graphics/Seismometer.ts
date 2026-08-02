export class Seismometer {
  canvas: HTMLCanvasElement;
  yMax: number;
  yMin: number;
  numberOfLines: number;
  maxJump: number;
  valueMap: Record<number, string>;
  bgColor: string;
  fgColor: string;
  font: string;
  seismocolor: string;
  dataSet: Float32Array;

  constructor(canvas: HTMLCanvasElement, graphProps: {
    yMax: number;
    yMin: number;
    numberOfLines: number;
    maxJump: number;
    valueMap?: Record<number, string>;
  }, styleProps: {
    fontSize?: number;
    fontFamily?: string;
    bgColor?: string;
    fgColor?: string;
    seismocolor?: string;
  }) {
    this.canvas = canvas;

    this.yMax = graphProps.yMax;
    this.yMin = graphProps.yMin;
    this.numberOfLines = graphProps.numberOfLines;
    this.maxJump = graphProps.maxJump;
    this.valueMap = graphProps.valueMap || {};

    this.bgColor = styleProps.bgColor ?? 'white';
    this.fgColor = styleProps.fgColor ?? 'black';
    this.seismocolor = styleProps.seismocolor ?? 'red';
    this.font = `${styleProps.fontSize ?? 13}px ${styleProps.fontFamily ?? 'sans-serif'}`;

    this.dataSet = new Float32Array(canvas.width);

    this.render();
  }

  pushNewValue(value: number) {
    for (let i = 0; i < this.dataSet.length - 1; i++)
      this.dataSet.set([this.dataSet[i + 1] ?? 0], i);

    this.dataSet[this.dataSet.length - 1] = value;
  }

  reset() {
    for (let i = 0; i < this.dataSet.length; i++)
      this.dataSet[i] = 0;
  }

  render() {
    const canvas = this.canvas;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const dataSet = this.dataSet;
    const yMax = this.yMax;
    const yMin = this.yMin;
    const deltaY = yMax - yMin;
    const numberOfLines = this.numberOfLines;

    if (ctx == null) 
      throw new Error('Canvas context is null');

    // Draw background color:
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set up foreground:
    ctx.strokeStyle = this.fgColor;
    ctx.fillStyle = this.fgColor;
    ctx.lineWidth = 1;
    ctx.font = this.font;

    // Draw gridlines:
    for (let i = 0; i < numberOfLines; i++) {
      const ycalc = height - i * height / numberOfLines;

      ctx.beginPath();
      ctx.moveTo(0, ycalc);
      ctx.lineTo(width, ycalc);
      ctx.stroke();
      const label = Math.round(i * deltaY / numberOfLines) + yMin;
      const mapped = this.valueMap[label];
      if (mapped != null)
        ctx.fillText(mapped, 0, ycalc);
      else
        ctx.fillText(label.toString(), 0, ycalc);
    }

    // Draw graph:
    ctx.strokeStyle = this.seismocolor;
    ctx.beginPath();
    ctx.moveTo(0, height * (1 - ((dataSet[0] ?? 0) - yMin) / deltaY));

    for (let i = 1; i < width; i++) {
      const method = (Math.abs((dataSet[i - 1] ?? 0) - (dataSet[i] ?? 0)) > this.maxJump)
        ? 'moveTo'
        : 'lineTo';

      ctx[method](i, height * (1 - ((dataSet[i] ?? 0) - yMin) / deltaY));
    }

    ctx.stroke();
  }
}
