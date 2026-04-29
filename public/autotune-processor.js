// Web Audio Worklet for Autotune Processing
// Ultra-low latency pitch detection and correction

class AutotuneProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.settings = {
      scale: 'major',
      retuneSpeed: 50,
      pitchCorrection: 100,
      humanize: 0
    }
    
    // Musical note frequencies
    this.noteFrequencies = {
      'C': 261.63, 'D': 293.66, 'E': 329.63, 'F': 349.23,
      'G': 391.99, 'A': 440.00, 'B': 493.88
    }
    
    this.scales = {
      'major': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      'minor': ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
      'pentatonic': ['C', 'D', 'E', 'G', 'A'],
      'blues': ['C', 'Eb', 'F', 'Gb', 'G', 'Bb'],
      'chromatic': ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
    }
    
    this.fftSize = 4096
    this.lastPitch = 440
    this.pitchBuffer = new Float32Array(this.fftSize)
    
    this.port.onmessage = this.handleMessage.bind(this)
  }

  handleMessage(event) {
    if (event.data.type === 'UPDATE_SETTINGS') {
      this.settings = { ...this.settings, ...event.data.settings }
    }
  }

  // YIN algorithm for pitch detection - ultra-low latency
  detectPitch(frame) {
    const threshold = 0.1
    const bufferSize = frame.length
    let tmin = 0
    let tmax = bufferSize / 2
    let p_abs = 0
    let p_processed = 0
    let yin = new Float32Array(bufferSize)
    let tau

    // Compute autocorrelation
    for (tau = 0; tau < bufferSize; tau++) {
      p_abs = 0
      p_processed = 0
      
      for (let x = 0; x < bufferSize - tau; x++) {
        const delta = frame[x] - frame[x + tau]
        p_abs += frame[x + tau] * frame[x + tau]
        p_processed += delta * delta
      }
      
      yin[tau] = p_processed / (p_abs + 0.0001)
      
      if (tau > 2 && yin[tau] < threshold && yin[tau] < yin[tau + 1]) {
        let shift = tau - 3
        let shift_abs = yin[shift]
        
        if (shift_abs < yin[shift + 1]) {
          return 44100 / (shift + 3 * shift_abs / (yin[shift + 1] - shift_abs))
        }
      }
    }

    return this.lastPitch
  }

  // Find nearest scale degree
  findNearestScaleDegree(pitch) {
    const scale = this.scales[this.settings.scale] || this.scales.major
    const baseFreq = this.noteFrequencies['C']
    let minDistance = Infinity
    let nearestFreq = pitch

    for (const note of scale) {
      const noteFreq = this.noteFrequencies[note] || baseFreq
      // Check across octaves
      for (let octave = -2; octave <= 2; octave++) {
        const freq = noteFreq * Math.pow(2, octave)
        const distance = Math.abs(pitch - freq)
        
        if (distance < minDistance) {
          minDistance = distance
          nearestFreq = freq
        }
      }
    }

    return nearestFreq
  }

  // Phase vocoder for pitch shifting
  shiftPitch(frame, currentPitch, targetPitch) {
    const pitchRatio = targetPitch / (currentPitch + 0.0001)
    const retuneSpeed = (this.settings.retuneSpeed + 1) / 100
    const correction = this.settings.pitchCorrection / 100
    
    // Smooth transition to target pitch
    const interpRatio = 1 - (1 - pitchRatio) * (1 - retuneSpeed * correction)
    
    // Simple pitch shift using phase vocoder principles
    const shifted = new Float32Array(frame.length)
    const hopSize = Math.max(1, Math.round(frame.length * (1 - interpRatio)))
    
    for (let i = 0; i < frame.length - hopSize; i++) {
      shifted[i] = frame[i * interpRatio] || 0
    }
    
    return shifted
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]
    
    if (!input || !input[0]) return true

    const inputChannel = input[0]
    const outputChannel = output[0]

    // Copy input to buffer
    for (let i = 0; i < this.fftSize; i++) {
      this.pitchBuffer[i] = inputChannel[i] || 0
    }

    // Detect current pitch
    const currentPitch = this.detectPitch(this.pitchBuffer)
    this.lastPitch = currentPitch

    // Find nearest scale degree
    const targetPitch = this.findNearestScaleDegree(currentPitch)

    // Apply pitch shift
    const corrected = this.shiftPitch(inputChannel, currentPitch, targetPitch)

    // Copy to output with smoothing
    for (let i = 0; i < inputChannel.length; i++) {
      outputChannel[i] = corrected[i] || inputChannel[i]
    }

    return true
  }
}

registerProcessor('autotune-processor', AutotuneProcessor)
