function ready() {
  try {
    const canvas = document.querySelector('#scope-screen');

    // Set up oscilloscope:
    const audioContext = new (window.AudioContext ?? window.webkitAudioContext)();
    const scope = new Oscilloscope({
      audioContext: audioContext,
      canvas: canvas,
      fftSize: +document.querySelector('#fft-menu').value,
      beamColor: document.querySelector('#scope-color').value,
      domain: Oscilloscope.domainType[document.querySelector('#domain-menu').value]
    });
    scope.getNode().connect(audioContext.destination);
    let scaleCount = 0;
    const scaleOscillators = [];

    function setMessageText(text) {
      document.querySelector('#message').textContent = text;
    }

    document.querySelector('#play-btn').addEventListener('click', () => {
      // Create new oscillator
      const scaleOscillator = new ChromaticScale({ audioContext: audioContext });
      scaleOscillators.push(scaleOscillator);

      const params = {
        semitones: +document.querySelector('#semitones').value,
        octaves: +document.querySelector('#octaves').value,
        scaleBase: +document.querySelector('#scale-base').value,
        startFrequency: +document.querySelector('#start-freq').value,
        waveType: document.querySelector('#wave-menu').value,
        msPerNote: +document.querySelector('#ms-per-note').value
      };

      scaleOscillator.setProperties(params);
      scaleOscillator.turnOn();
      scaleOscillator.getNode().connect(scope.getNode());

      scaleOscillator.getNode().addEventListener('ended', () => {
        scaleCount--;
        setMessageText(`${scaleCount} scales currently playing.`);
        if (scaleCount == 0)
          scaleOscillators.length = 0;
      });
      scaleCount++;
      setMessageText(`${scaleCount} scales currently playing.`);
    });

    function stopAll() {
      // Rip out all connections
      for (const scaleOscillator of scaleOscillators) {
        if (scaleOscillator != null) {
          scaleOscillator.turnOff();
          scaleOscillator.getNode().disconnect();
        }
      }

      scaleOscillators.length = 0;
    }

    document.querySelector('#stop-btn').addEventListener('click', () => {
      stopAll();
    });

    document.querySelector('#reset-btn').addEventListener('click', () => {
      stopAll();

      document.querySelector('#semitones').value = '12';
      document.querySelector('#octaves').value = '1';
      document.querySelector('#scale-base').value = '2';
      document.querySelector('#start-freq').value = '440';
      document.querySelector('#wave-menu').value = 'sine';
      document.querySelector('#ms-per-note').value = '250';
    });

    document.querySelector('#scope-color').addEventListener('keyup', () => {
      scope.beamColor = document.querySelector('#scope-color').value;
    });

    document.querySelector('#fft-menu').addEventListener('change', () => {
      scope.setFFTSize(Number(document.querySelector('#fft-menu').value));
    });

    document.querySelector('#domain-menu').addEventListener('change', () => {
      scope.domain = Oscilloscope.domainType[document.querySelector('#domain-menu').value];
    });

    document.querySelector('#activator').remove();
  }
  catch (exc) {
    document.querySelector('body').textContent = exc.message;
  }
}