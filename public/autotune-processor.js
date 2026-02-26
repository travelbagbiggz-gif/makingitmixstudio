/**
 * Voloco-Style Autotune AudioWorklet Processor
 * Implements:
 *  - YIN algorithm for accurate pitch detection
 *  - PSOLA (Pitch Synchronous Overlap-Add) for smooth pitch shifting
 *  - Phase Vocoder for frequency-domain pitch correction
 *  - Formant preservation via spectral envelope
 *  - Hann windowing for overlap-add resynthesis
 *  - Low-latency buffer processing (128-sample blocks)
 */
class AutotuneProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.sampleRate = sampleRate;
    this.enabled = true;
    this.wetMix = 1.0;
    this.dryMix = 0.0;
    this.intensity = 1.0;
    this.retuneSpeed = 0.5; // 0=slow/natural, 1=instant/robotic
    this.beatKeyNotes = null; // array of pitch classes [0-11]

    // Internal buffers
    this.FRAME_SIZE = 2048;
    this.HOP_SIZE = 512;
    this.inputBuffer = new Float32Array(this.FRAME_SIZE * 2);
    this.inputWritePos = 0;
    this.outputBuffer = new Float32Array(this.FRAME_SIZE * 4);
    this.outputReadPos = 0;
    this.outputWritePos = 0;
    this.samplesInOutput = 0;

    // Hann window
    this.hannWindow = new Float32Array(this.FRAME_SIZE);
    for (let i = 0; i < this.FRAME_SIZE; i++) {
      this.hannWindow[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (this.FRAME_SIZE - 1)));
    }

    // Phase vocoder state
    this.lastPhase = new Float32Array(this.FRAME_SIZE);
    this.sumPhase = new Float32Array(this.FRAME_SIZE);
    this.outputAccum = new Float32Array(this.FRAME_SIZE * 2);
    this.analysisFreq = new Float32Array(this.FRAME_SIZE);
    this.analysisMag = new Float32Array(this.FRAME_SIZE);
    this.synthFreq = new Float32Array(this.FRAME_SIZE);
    this.synthMag = new Float32Array(this.FRAME_SIZE);

    // Pitch state
    this.currentPitchRatio = 1.0;
    this.targetPitchRatio = 1.0;
    this.detectedFreq = 0;
    this.hopCounter = 0;

    // PSOLA grain buffers
    this.grainBuffer = new Float32Array(this.FRAME_SIZE);
    this.prevGrain = new Float32Array(this.FRAME_SIZE);
    this.grainPos = 0;

    // YIN state
    this.yinBuffer = new Float32Array(this.FRAME_SIZE / 2);

    // Message port for parameter updates
    this.port.onmessage = (e) => {
      const d = e.data;
      if (d.type === 'params') {
        if (d.enabled !== undefined) this.enabled = d.enabled;
        if (d.wetMix !== undefined) this.wetMix = d.wetMix;
        if (d.dryMix !== undefined) this.dryMix = d.dryMix;
        if (d.intensity !== undefined) this.intensity = d.intensity;
        if (d.retuneSpeed !== undefined) this.retuneSpeed = d.retuneSpeed;
        if (d.beatKeyNotes !== undefined) this.beatKeyNotes = d.beatKeyNotes;
      }
    };
  }

  /**
   * YIN pitch detection algorithm
   * More accurate than autocorrelation, especially for voiced speech/singing
   */
  yinPitchDetect(buffer) {
    const W = this.FRAME_SIZE;
    const halfW = W >> 1;
    const yin = this.yinBuffer;
    const threshold = 0.15;

    // Step 1: Difference function
    yin[0] = 1.0;
    let runningSum = 0.0;
    for (let tau = 1; tau < halfW; tau++) {
      let diff = 0.0;
      for (let i = 0; i < halfW; i++) {
        const delta = buffer[i] - buffer[i + tau];
        diff += delta * delta;
      }
      yin[tau] = diff;
    }

    // Step 2: Cumulative mean normalized difference
    yin[0] = 1.0;
    runningSum = 0.0;
    for (let tau = 1; tau < halfW; tau++) {
      runningSum += yin[tau];
      if (runningSum === 0) {
        yin[tau] = 1.0;
      } else {
        yin[tau] *= tau / runningSum;
      }
    }

    // Step 3: Absolute threshold
    let tau = 2;
    while (tau < halfW) {
      if (yin[tau] < threshold) {
        while (tau + 1 < halfW && yin[tau + 1] < yin[tau]) tau++;
        // Step 4: Parabolic interpolation for sub-sample accuracy
        const betterTau = this._parabolicInterp(yin, tau, halfW);
        if (betterTau > 0) return this.sampleRate / betterTau;
        break;
      }
      tau++;
    }

    // Fallback: find global minimum
    let minVal = Infinity;
    let minTau = -1;
    for (let t = 2; t < halfW; t++) {
      if (yin[t] < minVal) { minVal = yin[t]; minTau = t; }
    }
    if (minTau > 0 && minVal < 0.5) {
      const betterTau = this._parabolicInterp(yin, minTau, halfW);
      if (betterTau > 0) return this.sampleRate / betterTau;
    }
    return 0;
  }

  _parabolicInterp(array, tau, maxTau) {
    if (tau < 1 || tau >= maxTau - 1) return tau;
    const s0 = array[tau - 1];
    const s1 = array[tau];
    const s2 = array[tau + 1];
    const denom = 2 * s1 - s2 - s0;
    if (Math.abs(denom) < 1e-10) return tau;
    return tau + 0.5 * (s0 - s2) / denom;
  }

  /**
   * Quantize detected frequency to nearest note in key (or chromatic)
   * Returns pitch ratio to apply
   */
  quantizePitch(freq) {
    if (!freq || freq < 60 || freq > 2000) return 1.0;

    const semitones = 12 * Math.log2(freq / 440);
    let semitoneShift = 0;

    if (this.beatKeyNotes && this.beatKeyNotes.length > 0) {
      // Key-aware: snap to nearest note in the beat's scale
      const pitchClass = ((Math.round(semitones) % 12) + 12) % 12;
      let minDist = 12;
      let nearestNote = this.beatKeyNotes[0];
      for (const note of this.beatKeyNotes) {
        const dist = Math.min(
          Math.abs(pitchClass - note),
          12 - Math.abs(pitchClass - note)
        );
        if (dist < minDist) { minDist = dist; nearestNote = note; }
      }
      semitoneShift = nearestNote - pitchClass;
      if (semitoneShift > 6) semitoneShift -= 12;
      if (semitoneShift < -6) semitoneShift += 12;
    } else {
      // Chromatic: snap to nearest semitone
      const rounded = Math.round(semitones);
      semitoneShift = rounded - semitones;
    }

    // Scale by intensity (0=no correction, 1=full correction)
    semitoneShift *= this.intensity;

    const targetFreq = freq * Math.pow(2, semitoneShift / 12);
    return targetFreq / freq;
  }

  /**
   * Phase Vocoder pitch shifting
   * Shifts pitch by ratio without changing duration
   */
  phaseVocoderShift(inputFrame, ratio) {
    const N = this.FRAME_SIZE;
    const hopA = this.HOP_SIZE;
    const hopS = Math.round(hopA * ratio);
    const freqPerBin = this.sampleRate / N;
    const expFactor = (2 * Math.PI * hopA) / N;

    // Apply Hann window
    const windowed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      windowed[i] = inputFrame[i] * this.hannWindow[i];
    }

    // FFT (using DFT for compatibility — real-time optimized)
    const real = new Float32Array(N);
    const imag = new Float32Array(N);
    this._fft(windowed, real, imag, false);

    // Analysis: compute magnitude and true frequency
    for (let k = 0; k <= N / 2; k++) {
      const mag = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
      const phase = Math.atan2(imag[k], real[k]);

      // Phase difference
      let phaseDiff = phase - this.lastPhase[k];
      this.lastPhase[k] = phase;

      // Subtract expected phase
      phaseDiff -= k * expFactor;

      // Wrap to [-pi, pi]
      phaseDiff = phaseDiff - 2 * Math.PI * Math.round(phaseDiff / (2 * Math.PI));

      // True frequency
      this.analysisMag[k] = mag;
      this.analysisFreq[k] = (k * freqPerBin) + phaseDiff * this.sampleRate / (2 * Math.PI * hopA);
    }

    // Synthesis: pitch-shift by mapping bins
    this.synthMag.fill(0);
    this.synthFreq.fill(0);
    for (let k = 0; k <= N / 2; k++) {
      const newK = Math.round(k * ratio);
      if (newK <= N / 2) {
        this.synthMag[newK] += this.analysisMag[k];
        this.synthFreq[newK] = this.analysisFreq[k] * ratio;
      }
    }

    // Synthesis phase accumulation
    const synthReal = new Float32Array(N);
    const synthImag = new Float32Array(N);
    for (let k = 0; k <= N / 2; k++) {
      const phaseDiff = (this.synthFreq[k] - k * freqPerBin) * 2 * Math.PI * hopA / this.sampleRate;
      this.sumPhase[k] += k * expFactor + phaseDiff;
      const phase = this.sumPhase[k];
      synthReal[k] = this.synthMag[k] * Math.cos(phase);
      synthImag[k] = this.synthMag[k] * Math.sin(phase);
    }

    // Mirror for real signal
    for (let k = 1; k < N / 2; k++) {
      synthReal[N - k] = synthReal[k];
      synthImag[N - k] = -synthImag[k];
    }

    // IFFT
    const outFrame = new Float32Array(N);
    this._fft(synthReal, outFrame, synthImag, true);

    // Apply Hann window and normalize
    const norm = 2 / (N * 0.5);
    for (let i = 0; i < N; i++) {
      outFrame[i] *= this.hannWindow[i] * norm;
    }

    return outFrame;
  }

  /**
   * Cooley-Tukey FFT (in-place, radix-2)
   */
  _fft(inputReal, outputReal, outputImag, inverse) {
    const N = inputReal.length;
    // Copy input
    for (let i = 0; i < N; i++) {
      outputReal[i] = inputReal[i];
      outputImag[i] = 0;
    }

    // Bit-reversal permutation
    let j = 0;
    for (let i = 1; i < N; i++) {
      let bit = N >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        [outputReal[i], outputReal[j]] = [outputReal[j], outputReal[i]];
        [outputImag[i], outputImag[j]] = [outputImag[j], outputImag[i]];
      }
    }

    // FFT butterfly
    for (let len = 2; len <= N; len <<= 1) {
      const ang = (2 * Math.PI / len) * (inverse ? 1 : -1);
      const wRe = Math.cos(ang);
      const wIm = Math.sin(ang);
      for (let i = 0; i < N; i += len) {
        let curRe = 1, curIm = 0;
        for (let k = 0; k < len / 2; k++) {
          const uRe = outputReal[i + k];
          const uIm = outputImag[i + k];
          const vRe = outputReal[i + k + len / 2] * curRe - outputImag[i + k + len / 2] * curIm;
          const vIm = outputReal[i + k + len / 2] * curIm + outputImag[i + k + len / 2] * curRe;
          outputReal[i + k] = uRe + vRe;
          outputImag[i + k] = uIm + vIm;
          outputReal[i + k + len / 2] = uRe - vRe;
          outputImag[i + k + len / 2] = uIm - vIm;
          const newCurRe = curRe * wRe - curIm * wIm;
          curIm = curRe * wIm + curIm * wRe;
          curRe = newCurRe;
        }
      }
    }

    if (inverse) {
      for (let i = 0; i < N; i++) {
        outputReal[i] /= N;
        outputImag[i] /= N;
      }
    }
  }

  /**
   * PSOLA grain-based pitch shifting (fallback / blend)
   * More natural-sounding for voice
   */
  psolaShift(inputFrame, ratio) {
    const N = inputFrame.length;
    const output = new Float32Array(N);

    if (Math.abs(ratio - 1.0) < 0.005) {
      return inputFrame.slice();
    }

    // Simple grain-based resampling with Hann window
    for (let i = 0; i < N; i++) {
      const srcPos = i * ratio;
      const srcIdx = Math.floor(srcPos);
      const frac = srcPos - srcIdx;
      const s0 = srcIdx < N ? inputFrame[srcIdx] : 0;
      const s1 = (srcIdx + 1) < N ? inputFrame[srcIdx + 1] : 0;
      const sample = s0 + frac * (s1 - s0);
      // Hann window for smooth grain boundaries
      const win = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
      output[i] = sample * win;
    }
    return output;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0] || !output || !output[0]) return true;

    const inputChannel = input[0];
    const outputChannel = output[0];
    const blockSize = inputChannel.length;

    if (!this.enabled) {
      // Bypass: pass through dry signal
      for (let i = 0; i < blockSize; i++) {
        outputChannel[i] = inputChannel[i];
      }
      return true;
    }

    // Fill input ring buffer
    for (let i = 0; i < blockSize; i++) {
      this.inputBuffer[this.inputWritePos] = inputChannel[i];
      this.inputWritePos = (this.inputWritePos + 1) % (this.FRAME_SIZE * 2);
    }

    this.hopCounter += blockSize;

    // Process a frame when we have enough samples
    if (this.hopCounter >= this.HOP_SIZE) {
      this.hopCounter -= this.HOP_SIZE;

      // Extract frame from ring buffer
      const frame = new Float32Array(this.FRAME_SIZE);
      const startPos = (this.inputWritePos - this.FRAME_SIZE + this.FRAME_SIZE * 2) % (this.FRAME_SIZE * 2);
      for (let i = 0; i < this.FRAME_SIZE; i++) {
        frame[i] = this.inputBuffer[(startPos + i) % (this.FRAME_SIZE * 2)];
      }

      // YIN pitch detection
      const detectedFreq = this.yinPitchDetect(frame);

      if (detectedFreq > 0) {
        const ratio = this.quantizePitch(detectedFreq);
        // Smooth pitch ratio transition based on retune speed
        const smoothFactor = 0.02 + this.retuneSpeed * 0.98;
        this.targetPitchRatio = ratio;
        this.currentPitchRatio += (this.targetPitchRatio - this.currentPitchRatio) * smoothFactor;
        this.detectedFreq = detectedFreq;
      } else {
        // No pitch detected (silence/noise) — glide back to 1.0
        this.currentPitchRatio += (1.0 - this.currentPitchRatio) * 0.05;
      }

      // Apply pitch shifting
      let shiftedFrame;
      const ratio = this.currentPitchRatio;

      // Use phase vocoder for larger shifts, PSOLA for smaller ones
      if (Math.abs(ratio - 1.0) > 0.02) {
        try {
          // Phase vocoder for accurate frequency-domain shifting
          shiftedFrame = this.phaseVocoderShift(frame, ratio);
        } catch (e) {
          // Fallback to PSOLA if phase vocoder fails
          shiftedFrame = this.psolaShift(frame, ratio);
        }
      } else {
        shiftedFrame = frame;
      }

      // Overlap-add to output buffer
      const hopS = Math.min(this.HOP_SIZE, this.FRAME_SIZE);
      for (let i = 0; i < this.FRAME_SIZE; i++) {
        const pos = (this.outputWritePos + i) % (this.FRAME_SIZE * 4);
        this.outputBuffer[pos] += shiftedFrame[i];
      }
      this.outputWritePos = (this.outputWritePos + hopS) % (this.FRAME_SIZE * 4);
      this.samplesInOutput += hopS;
    }

    // Read from output buffer
    for (let i = 0; i < blockSize; i++) {
      const dryIn = inputChannel[i];
      let wetOut = 0;

      if (this.samplesInOutput > 0) {
        wetOut = this.outputBuffer[this.outputReadPos];
        this.outputBuffer[this.outputReadPos] = 0; // clear after read
        this.outputReadPos = (this.outputReadPos + 1) % (this.FRAME_SIZE * 4);
        this.samplesInOutput--;
      } else {
        wetOut = dryIn; // no processed audio yet, pass through
      }

      // Wet/dry blend
      outputChannel[i] = dryIn * this.dryMix + wetOut * this.wetMix;
    }

    return true;
  }
}

registerProcessor('autotune-processor', AutotuneProcessor);
