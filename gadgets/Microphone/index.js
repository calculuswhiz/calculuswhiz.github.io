function ready() {
  const canvas = document.querySelector('#ScopeScreen');
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const scope = new Oscilloscope({
    audioContext: audioContext,
    canvas: canvas,
    fftSize: +document.querySelector('#FFTMenu').value,
    beamColor: document.querySelector('#ScopeColor').value,
    domain: Oscilloscope.domainType[document.querySelector('#DomainMenu').value]
  });
  // It will analyze without connecting to destination.

  const minFreq = 20;
  const maxFreq = 10000;
  const avgFreq = (minFreq + maxFreq) / 2;
  const bandPassFilter = audioContext.createBiquadFilter();
  bandPassFilter.frequency = avgFreq;
  bandPassFilter.Q = avgFreq - minFreq;
  bandPassFilter.type = 'bandpass';

  scope.setFrequencyWindow(minFreq, maxFreq);

  // Request microphone
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      const streamNode = audioContext.createMediaStreamSource(stream);
      const analyserNode = scope.getNode();
      streamNode.connect(analyserNode);
      analyserNode.connect(bandPassFilter);
    });

  document.querySelector('#ScopeColor').addEventListener('keyup', () => {
    scope.beamColor = document.querySelector('#ScopeColor').value;
  });

  document.querySelector('#FFTMenu').addEventListener('change', () => {
    scope.setFFTSize(+(document.querySelector('#FFTMenu').value));
  });

  document.querySelector('#DomainMenu').addEventListener('change', () => {
    scope.domain = Oscilloscope.domainType[document.querySelector('#DomainMenu').value];
  });

  document.querySelector('#Activator').remove();
}