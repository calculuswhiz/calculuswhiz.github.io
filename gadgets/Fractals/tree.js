let running = false;

class Vector {
  constructor(start, length, angle, depth) {
    this.x0 = start.x;
    this.y0 = start.y;
    this.length = length;
    this.angle = angle;

    // Metadata
    this.depth = depth;
  }

  get displacement() {
    return {
      x: this.x0 + this.length * Math.cos(this.angle),
      y: this.y0 + this.length * Math.sin(this.angle)
    };
  }
}

let eventSwitch;

function go() {
  if (running)
    createjs.Ticker.off('tick', eventSwitch);

  document.querySelector('#status-info').textContent = 'Running';
  running = true;

  const color = document.querySelector('#color-input').value;
  const branches = Number(document.querySelector('#branches-input').value);
  const splitAngle = 2 * Math.PI / (branches + 1);
  const maxDepth = Number(document.querySelector('#depth-input').value);
  const isDepthFirst = document.querySelector('#df-ckbox').checked;

  const stage = new createjs.Stage('main-canvas');
  stage.clear();

  eventSwitch = createjs.Ticker.on('tick', handleTick);
  createjs.Ticker.framerate = 60;

  const initialLengthFactor = 1 / 2;
  const vectorQueue = [
    new Vector(
      {
        x: document.querySelector('#main-canvas').width / 2,
        y: 0
      },
      document.querySelector('#main-canvas').height * initialLengthFactor,
      Math.PI / 2,
      0
    )
  ];

  function drawStick(stick) {
    if (stick.depth >= maxDepth || stick.length < 1) {
      // Do not draw
      return false;
    }

    const stickLine = new createjs.Shape();
    const displacement = stick.displacement;
    stickLine.graphics
      .s(color)
      .mt(stick.x0, stick.y0)
      .lt(displacement.x, displacement.y)
      .cp();

    stage.addChild(stickLine);

    return true;
  }

  function handleTick() {
    if (vectorQueue.length === 0) {
      running = false;
      createjs.Ticker.off('tick', eventSwitch);
      document.querySelector('#status-info').textContent = 'Done!';
      return;
    }

    const currentStick = vectorQueue.pop();

    if (!drawStick(currentStick)) {
      // Did not draw
      return;
    }

    const baseAngle = currentStick.angle - Math.PI;
    const basePos = currentStick.displacement;
    for (let i = 0; i < branches; i++) {
      vectorQueue[isDepthFirst ? 'push' : 'unshift'](new Vector(
        {
          x: basePos.x,
          y: basePos.y
        },
        currentStick.length / branches,
        baseAngle + (i + 1) * splitAngle,
        currentStick.depth + 1
      ));
    }

    //Update stage will render next frame
    stage.update();
  }
}
