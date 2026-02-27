/**
 * AutotuneDSP.js
 * Voloco-style real-time pitch correction DSP pipeline
 *
 * Architecture:
 *  Mic → HighpassFilter → AutotuneWorklet (YIN + PhaseVocoder + PSOLA) → OutputGain → Destination
 *                                                                        ↘ Analyser (metering)
 *
 * Falls back to ScriptProcessorNode if AudioWorklet is unavailable.
 */

let workletLoaded = false;
let workletLoadPromise = null;

/**
 * Load the AudioWorklet module (once)
 */
export async function loadAutotuneWorklet(audioContext) {
  if (workletLoaded) return true;
  if (workletLoadPromise) return workletLoadPromise;

  workletLoadPromise = (async () => {
    try {
      await audioContext?.audioWorklet?.addModule('/autotune-processor.js');
      workletLoaded = true;
      return true;
    } catch (e) {
      console.warn('AudioWorklet not available, will use ScriptProcessor fallback:', e);
      workletLoaded = false;
      return false;
    }
  })();

  return workletLoadPromise;
}

/**
 * Build the complete autotune DSP chain
 *
 * @param {AudioContext} ctx
 * @param {MediaStream} rawStream
 * @param {object} params
 * @param {AnalyserNode} analyserNode - existing analyser for metering
 * @returns {{ processedStream: MediaStream, workletNode: AudioWorkletNode|ScriptProcessorNode, cleanup: Function }}
 */
export async function buildAutotuneChain(ctx, rawStream, params, analyserNode) {
  const {
    enabled = true,
    wetMix = 1.0,
    intensity = 1.0,
    retuneSpeed = 0.5,
    beatKeyNotes = null,
  } = params;

  const dryMix = 1.0 - wetMix;
  const nodes = [];

  // Source from mic stream
  const source = ctx?.createMediaStreamSource(rawStream);
  nodes?.push(source);

  // Highpass filter: remove sub-bass rumble before pitch detection
  const highpass = ctx?.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 80;
  highpass.Q.value = 0.707;
  nodes?.push(highpass);

  // Output gain
  const outputGain = ctx?.createGain();
  outputGain.gain.value = 1.0; // Full gain — no permanent attenuation
  nodes?.push(outputGain);

  // Destination stream
  const dest = ctx?.createMediaStreamDestination();

  let workletNode = null;
  let useWorklet = false;

  // Try AudioWorklet first
  const workletAvailable = await loadAutotuneWorklet(ctx);

  if (workletAvailable && enabled) {
    try {
      workletNode = new AudioWorkletNode(ctx, 'autotune-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        processorOptions: {},
      });

      // Send initial params
      workletNode?.port?.postMessage({
        type: 'params',
        enabled,
        wetMix,
        dryMix,
        intensity,
        retuneSpeed,
        beatKeyNotes,
      });

      source?.connect(highpass);
      highpass?.connect(workletNode);
      workletNode?.connect(outputGain);
      outputGain?.connect(dest);
      if (analyserNode) outputGain?.connect(analyserNode);

      nodes?.push(workletNode);
      useWorklet = true;
    } catch (e) {
      console.warn('AudioWorkletNode creation failed, falling back to ScriptProcessor:', e);
      useWorklet = false;
    }
  }

  // ScriptProcessor fallback
  if (!useWorklet) {
    workletNode = buildScriptProcessorFallback(
      ctx, source, highpass, outputGain, dest, analyserNode, nodes,
      { enabled, wetMix, dryMix, intensity, retuneSpeed, beatKeyNotes }
    );
  }

  const cleanup = () => {
    nodes?.forEach(n => {
      try { n?.disconnect(); } catch (e) {}
    });
    try { dest?.stream?.getTracks()?.forEach(t => t?.stop()); } catch (e) {}
  };

  return {
    processedStream: dest?.stream,
    workletNode,
    cleanup,
    usingWorklet: useWorklet,
  };
}

/**
 * Update autotune parameters on an existing worklet/processor node
 */
export function updateAutotuneParams(workletNode, params) {
  if (!workletNode) return;
  try {
    if (workletNode?.port) {
      // AudioWorkletNode
      workletNode?.port?.postMessage({ type: 'params', ...params });
    } else if (workletNode?._updateParams) {
      // ScriptProcessor fallback
      workletNode?._updateParams(params);
    }
  } catch (e) {
    console.warn('updateAutotuneParams error:', e);
  }
}

/**
 * ScriptProcessor fallback with YIN pitch detection + PSOLA
 * Used when AudioWorklet is not available
 */
function buildScriptProcessorFallback(
  ctx, source, highpass, outputGain, dest, analyserNode, nodes,
  initialParams
) {
  const BUFFER_SIZE = 4096;
  const sampleRate = ctx?.sampleRate;

  let params = { ...initialParams };
  let currentPitchRatio = 1.0;
  let targetPitchRatio = 1.0;

  // Hann window
  const hannWindow = new Float32Array(BUFFER_SIZE);
  for (let i = 0; i < BUFFER_SIZE; i++) {
    hannWindow[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (BUFFER_SIZE - 1)));
  }

  // YIN pitch detection
  const yinBuffer = new Float32Array(BUFFER_SIZE / 2);
  const detectPitchYIN = (buffer) => {
    const W = buffer?.length;
    const halfW = W >> 1;
    const threshold = 0.15;

    yinBuffer[0] = 1.0;
    let runningSum = 0.0;
    for (let tau = 1; tau < halfW; tau++) {
      let diff = 0.0;
      for (let i = 0; i < halfW; i++) {
        const delta = buffer?.[i] - buffer?.[i + tau];
        diff += delta * delta;
      }
      runningSum += diff;
      yinBuffer[tau] = runningSum === 0 ? 1.0 : diff * tau / runningSum;
    }

    for (let tau = 2; tau < halfW; tau++) {
      if (yinBuffer?.[tau] < threshold) {
        while (tau + 1 < halfW && yinBuffer?.[tau + 1] < yinBuffer?.[tau]) tau++;
        // Parabolic interpolation
        if (tau > 0 && tau < halfW - 1) {
          const s0 = yinBuffer?.[tau - 1], s1 = yinBuffer?.[tau], s2 = yinBuffer?.[tau + 1];
          const denom = 2 * s1 - s2 - s0;
          const refined = Math.abs(denom) < 1e-10 ? tau : tau + 0.5 * (s0 - s2) / denom;
          if (refined > 0) return sampleRate / refined;
        }
        return sampleRate / tau;
      }
    }
    return 0;
  };

  const quantizePitch = (freq) => {
    if (!freq || freq < 60 || freq > 2000) return 1.0;
    const semitones = 12 * Math.log2(freq / 440);
    let semitoneShift = 0;

    if (params?.beatKeyNotes && params?.beatKeyNotes?.length > 0) {
      const pitchClass = ((Math.round(semitones) % 12) + 12) % 12;
      let minDist = 12;
      let nearestNote = params?.beatKeyNotes?.[0];
      for (const note of params?.beatKeyNotes) {
        const dist = Math.min(Math.abs(pitchClass - note), 12 - Math.abs(pitchClass - note));
        if (dist < minDist) { minDist = dist; nearestNote = note; }
      }
      semitoneShift = nearestNote - pitchClass;
      if (semitoneShift > 6) semitoneShift -= 12;
      if (semitoneShift < -6) semitoneShift += 12;
    } else {
      semitoneShift = Math.round(semitones) - semitones;
    }

    semitoneShift *= params?.intensity;
    return Math.pow(2, semitoneShift / 12);
  };

  const psolaShift = (input, output, ratio) => {
    const N = input?.length;
    if (Math.abs(ratio - 1.0) < 0.005) {
      for (let i = 0; i < N; i++) output[i] = input?.[i];
      return;
    }
    for (let i = 0; i < N; i++) {
      const srcPos = i * ratio;
      const srcIdx = Math.floor(srcPos);
      const frac = srcPos - srcIdx;
      const s0 = srcIdx < N ? input?.[srcIdx] : 0;
      const s1 = (srcIdx + 1) < N ? input?.[srcIdx + 1] : 0;
      // No Hann window here — windowing caused ~50% amplitude loss on every sample
      output[i] = s0 + frac * (s1 - s0);
    }
  };

  const scriptNode = ctx?.createScriptProcessor(BUFFER_SIZE, 1, 1);
  const wetBuffer = new Float32Array(BUFFER_SIZE);

  scriptNode.onaudioprocess = (e) => {
    const input = e?.inputBuffer?.getChannelData(0);
    const output = e?.outputBuffer?.getChannelData(0);

    if (!params?.enabled) {
      for (let i = 0; i < input?.length; i++) output[i] = input?.[i];
      return;
    }

    // Detect pitch
    const freq = detectPitchYIN(input);
    if (freq > 0) {
      const ratio = quantizePitch(freq);
      const smoothFactor = 0.02 + params?.retuneSpeed * 0.98;
      targetPitchRatio = ratio;
      currentPitchRatio += (targetPitchRatio - currentPitchRatio) * smoothFactor;
    } else {
      currentPitchRatio += (1.0 - currentPitchRatio) * 0.05;
    }

    // PSOLA pitch shift
    psolaShift(input, wetBuffer, currentPitchRatio);

    // Wet/dry blend — no extra boost to prevent clipping
    const wet = params?.wetMix;
    const dry = params?.dryMix;
    for (let i = 0; i < BUFFER_SIZE; i++) {
      output[i] = input?.[i] * dry + wetBuffer?.[i] * wet;
    }
  };

  // Expose param update method
  scriptNode._updateParams = (newParams) => {
    Object.assign(params, newParams);
    if (newParams?.wetMix !== undefined) params.dryMix = 1.0 - newParams?.wetMix;
  };

  source?.connect(highpass);
  highpass?.connect(scriptNode);
  scriptNode?.connect(outputGain);
  outputGain?.connect(dest);
  if (analyserNode) outputGain?.connect(analyserNode);

  nodes?.push(scriptNode);
  return scriptNode;
}
