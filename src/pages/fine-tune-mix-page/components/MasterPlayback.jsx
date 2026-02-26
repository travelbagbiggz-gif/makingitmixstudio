import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MasterPlayback = forwardRef(({ isPlaying, onPlayPause, onStop, duration = 180, channels, echo }, ref) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformData, setWaveformData] = useState([]);
  const [audioReady, setAudioReady] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);

  const audioCtxRef = useRef(null);
  const sourceNodesRef = useRef({});
  const gainNodesRef = useRef({});
  const eqNodesRef = useRef({});
  const reverbNodesRef = useRef({});
  const echoNodesRef = useRef({});
  const telephoneNodesRef = useRef({});
  const masterGainRef = useRef(null);
  const analyserRef = useRef(null);
  const startTimeRef = useRef(0);
  const pauseOffsetRef = useRef(0);
  const timerRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioBuffersRef = useRef({});
  const isPlayingRef = useRef(false);

  useEffect(() => {
    const mockWaveform = Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.2);
    setWaveformData(mockWaveform);
  }, []);

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef?.current || audioCtxRef?.current?.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 });
      masterGainRef.current = audioCtxRef?.current?.createGain();
      masterGainRef.current.gain.value = 0.9;
      analyserRef.current = audioCtxRef?.current?.createAnalyser();
      analyserRef.current.fftSize = 2048;
      masterGainRef?.current?.connect(analyserRef?.current);
      analyserRef?.current?.connect(audioCtxRef?.current?.destination);
    }
    return audioCtxRef?.current;
  }, []);

  // Build EQ chain for a channel: bass (lowshelf) + mid (peaking) + treble (highshelf)
  const buildEQChain = useCallback((ctx, sourceNode, channel) => {
    const bassFilter = ctx?.createBiquadFilter();
    bassFilter.type = 'lowshelf';
    bassFilter.frequency.value = 100;
    bassFilter.gain.value = channel?.bass || 0;

    const midFilter = ctx?.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.value = 1000;
    midFilter.Q.value = 1.0;
    midFilter.gain.value = channel?.mid || 0;

    const trebleFilter = ctx?.createBiquadFilter();
    trebleFilter.type = 'highshelf';
    trebleFilter.frequency.value = 8000;
    trebleFilter.gain.value = channel?.treble || 0;

    sourceNode?.connect(bassFilter);
    bassFilter?.connect(midFilter);
    midFilter?.connect(trebleFilter);

    return { bassFilter, midFilter, trebleFilter, output: trebleFilter };
  }, []);

  // Build reverb (convolver with synthetic IR)
  const buildReverb = useCallback((ctx, inputNode, reverbAmount) => {
    const wetGain = ctx?.createGain();
    const dryGain = ctx?.createGain();
    const convolver = ctx?.createConvolver();
    const merger = ctx?.createGain();

    const wet = (reverbAmount || 0) / 100;
    wetGain.gain.value = wet;
    dryGain.gain.value = 1 - wet * 0.5;

    // Synthetic impulse response (exponential decay noise)
    const sampleRate = ctx?.sampleRate;
    const length = sampleRate * 2.5; // 2.5 second reverb tail
    const impulse = ctx?.createBuffer(2, length, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const channelData = impulse?.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
      }
    }
    convolver.buffer = impulse;
    convolver.normalize = true;

    inputNode?.connect(dryGain);
    inputNode?.connect(convolver);
    convolver?.connect(wetGain);
    dryGain?.connect(merger);
    wetGain?.connect(merger);

    return { convolver, wetGain, dryGain, output: merger };
  }, []);

  // Build echo (delay node)
  const buildEcho = useCallback((ctx, inputNode, echoSettings) => {
    const noteMs = { '1/2': 1000, '1/4': 500, '1/8': 250, '1/16': 125 };
    const delayTime = (noteMs?.[echoSettings?.noteValue] || 500) / 1000;
    const wetAmount = (echoSettings?.wet || 0) / 100;
    const feedback = (echoSettings?.duration || 50) / 100 * 0.7; // max 70% feedback

    const delay = ctx?.createDelay(2.0);
    delay.delayTime.value = delayTime;

    const feedbackGain = ctx?.createGain();
    feedbackGain.gain.value = feedback;

    const wetGain = ctx?.createGain();
    wetGain.gain.value = wetAmount;

    const dryGain = ctx?.createGain();
    dryGain.gain.value = 1.0;

    const output = ctx?.createGain();
    output.gain.value = 1.0;

    inputNode?.connect(dryGain);
    inputNode?.connect(delay);
    delay?.connect(feedbackGain);
    feedbackGain?.connect(delay); // feedback loop
    delay?.connect(wetGain);
    dryGain?.connect(output);
    wetGain?.connect(output);

    return { delay, feedbackGain, wetGain, dryGain, output };
  }, []);

  // Build telephone preset (bandpass 300-3400 Hz + slight distortion)
  const buildTelephone = useCallback((ctx, inputNode) => {
    const highpass = ctx?.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 300;
    highpass.Q.value = 0.7;

    const lowpass = ctx?.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3400;
    lowpass.Q.value = 0.7;

    // Slight saturation for telephone character
    const waveshaper = ctx?.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = ((Math.PI + 50) * x) / (Math.PI + 50 * Math.abs(x));
    }
    waveshaper.curve = curve;
    waveshaper.oversample = '2x';

    // Boost mid-presence for telephone character
    const midBoost = ctx?.createBiquadFilter();
    midBoost.type = 'peaking';
    midBoost.frequency.value = 1200;
    midBoost.gain.value = 6;
    midBoost.Q.value = 2.0;

    const outputGain = ctx?.createGain();
    outputGain.gain.value = 0.85;

    inputNode?.connect(highpass);
    highpass?.connect(lowpass);
    lowpass?.connect(waveshaper);
    waveshaper?.connect(midBoost);
    midBoost?.connect(outputGain);

    return { highpass, lowpass, waveshaper, midBoost, output: outputGain };
  }, []);

  // Stop all audio
  const stopAllAudio = useCallback(() => {
    isPlayingRef.current = false;
    Object.values(sourceNodesRef?.current)?.forEach(src => {
      try { src?.stop(); } catch (e) {}
    });
    sourceNodesRef.current = {};
    gainNodesRef.current = {};
    eqNodesRef.current = {};
    reverbNodesRef.current = {};
    echoNodesRef.current = {};
    telephoneNodesRef.current = {};
    if (timerRef?.current) clearInterval(timerRef?.current);
    if (animFrameRef?.current) cancelAnimationFrame(animFrameRef?.current);
  }, []);

  // Update EQ params live (called when faders change during playback)
  const updateEQParams = useCallback((channelId, bass, mid, treble) => {
    const eq = eqNodesRef?.current?.[channelId];
    if (!eq) return;
    if (eq?.bassFilter) eq.bassFilter.gain.value = bass;
    if (eq?.midFilter) eq.midFilter.gain.value = mid;
    if (eq?.trebleFilter) eq.trebleFilter.gain.value = treble;
  }, []);

  // Update reverb wet amount live
  const updateReverbWet = useCallback((channelId, reverbAmount) => {
    const rev = reverbNodesRef?.current?.[channelId];
    if (!rev) return;
    const wet = reverbAmount / 100;
    if (rev?.wetGain) rev.wetGain.gain.value = wet;
    if (rev?.dryGain) rev.dryGain.gain.value = 1 - wet * 0.5;
  }, []);

  // Update echo params live
  const updateEchoParams = useCallback((echoSettings) => {
    const noteMs = { '1/2': 1000, '1/4': 500, '1/8': 250, '1/16': 125 };
    Object.values(echoNodesRef?.current)?.forEach(echoNodes => {
      if (!echoNodes) return;
      const delayTime = (noteMs?.[echoSettings?.noteValue] || 500) / 1000;
      const wetAmount = (echoSettings?.wet || 0) / 100;
      const feedback = (echoSettings?.duration || 50) / 100 * 0.7;
      if (echoNodes?.delay) echoNodes.delay.delayTime.value = delayTime;
      if (echoNodes?.wetGain) echoNodes.wetGain.gain.value = wetAmount;
      if (echoNodes?.feedbackGain) echoNodes.feedbackGain.gain.value = feedback;
    });
  }, []);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    updateEQParams,
    updateReverbWet,
    updateEchoParams,
  }), [updateEQParams, updateReverbWet, updateEchoParams]);

  // React to channel EQ/reverb/telephone changes during playback
  useEffect(() => {
    if (!isPlayingRef?.current) return;
    channels?.forEach(ch => {
      updateEQParams(ch?.id, ch?.bass, ch?.mid, ch?.treble);
      if (ch?.reverb !== undefined) updateReverbWet(ch?.id, ch?.reverb);
    });
  }, [channels, updateEQParams, updateReverbWet]);

  // React to echo changes during playback
  useEffect(() => {
    if (!isPlayingRef?.current) return;
    updateEchoParams(echo);
  }, [echo, updateEchoParams]);

  // Handle play/pause/stop from parent
  useEffect(() => {
    if (isPlaying) {
      startPlayback();
    } else {
      pausePlayback();
    }
  }, [isPlaying]);

  const startPlayback = async () => {
    try {
      const ctx = getAudioContext();
      if (ctx?.state === 'suspended') await ctx?.resume();

      stopAllAudio();
      isPlayingRef.current = true;

      // Create a demo oscillator-based "beat" tone since we don't have actual audio files here
      // In a real scenario, audio buffers from recording studio would be passed in
      // We create a representative audio signal for each channel to demonstrate the effects
      const startOffset = pauseOffsetRef?.current;
      startTimeRef.current = ctx?.currentTime - startOffset;

      // Create a master mix signal using oscillators to represent each channel
      // This demonstrates the effects chain is working
      const channelFreqs = { beat: 110, verse1: 220, verse2: 330, verse3: 440, hook: 550 };

      channels?.forEach(channel => {
        if (!channel) return;
        try {
          // Create oscillator as audio source (represents the channel audio)
          const osc = ctx?.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.value = channelFreqs?.[channel?.id] || 220;

          const channelGain = ctx?.createGain();
          channelGain.gain.value = 0.08; // Low volume for demo tone
          gainNodesRef.current[channel.id] = channelGain;

          osc?.connect(channelGain);

          // 1. Apply EQ (Bass/Mid/Treble)
          const eq = buildEQChain(ctx, channelGain, channel);
          eqNodesRef.current[channel.id] = eq;
          let lastNode = eq?.output;

          // 2. Apply Reverb (vocal channels only)
          if (channel?.reverb !== undefined) {
            const rev = buildReverb(ctx, lastNode, channel?.reverb);
            reverbNodesRef.current[channel.id] = rev;
            lastNode = rev?.output;
          }

          // 3. Apply Echo
          if (echo?.wet > 0) {
            const echoNodes = buildEcho(ctx, lastNode, echo);
            echoNodesRef.current[channel.id] = echoNodes;
            lastNode = echoNodes?.output;
          }

          // 4. Apply Telephone preset if enabled
          if (channel?.telephoneEnabled) {
            const tel = buildTelephone(ctx, lastNode);
            telephoneNodesRef.current[channel.id] = tel;
            lastNode = tel?.output;
          }

          // Connect to master
          lastNode?.connect(masterGainRef?.current);

          osc?.start(ctx?.currentTime);
          sourceNodesRef.current[channel.id] = osc;
        } catch (e) {
          console.error('Error building channel chain for', channel?.id, e);
        }
      });

      // Timer for playhead
      timerRef.current = setInterval(() => {
        const elapsed = ctx?.currentTime - startTimeRef?.current;
        if (elapsed >= duration) {
          stopAllAudio();
          pauseOffsetRef.current = 0;
          setCurrentTime(0);
          onStop();
        } else {
          setCurrentTime(elapsed);
        }
      }, 100);

    } catch (e) {
      console.error('Playback error:', e);
    }
  };

  const pausePlayback = () => {
    if (audioCtxRef?.current && isPlayingRef?.current) {
      pauseOffsetRef.current = audioCtxRef?.current?.currentTime - startTimeRef?.current;
    }
    stopAllAudio();
  };

  useEffect(() => {
    return () => {
      stopAllAudio();
      try { audioCtxRef?.current?.close(); } catch (e) {}
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs?.toString()?.padStart(2, '0')}`;
  };

  const progress = (currentTime / duration) * 100;

  // Count active effects for status display
  const activeEffects = [];
  channels?.forEach(ch => {
    if (ch?.bass !== 0 || ch?.mid !== 0 || ch?.treble !== 0) activeEffects?.push('EQ');
    if (ch?.reverb > 0) activeEffects?.push('Reverb');
    if (ch?.telephoneEnabled) activeEffects?.push('Telephone');
  });
  if (echo?.wet > 0) activeEffects?.push('Echo');
  const uniqueEffects = [...new Set(activeEffects)];

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center bg-primary/15">
            <Icon name="Music" size={24} color="var(--color-primary)" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-semibold text-foreground">Master Playback</h3>
            <p className="text-xs md:text-sm text-muted-foreground">Mixed Audio Preview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {uniqueEffects?.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-mono text-accent">{uniqueEffects?.join(' · ')}</span>
            </div>
          )}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
            <span className="text-xs font-mono text-muted-foreground">{isPlaying ? 'Playing' : 'Ready'}</span>
          </div>
        </div>
      </div>
      <div className="space-y-4 md:space-y-6">
        <div className="relative h-24 md:h-32 bg-muted rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-2">
            {waveformData?.map((height, index) => (
              <div
                key={index}
                className="flex-1 rounded-full transition-all duration-300"
                style={{
                  height: `${height * 100}%`,
                  backgroundColor: index / waveformData?.length < progress / 100
                    ? 'var(--color-accent)'
                    : 'var(--color-border)'
                }}
              />
            ))}
          </div>
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none"
            style={{ left: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs md:text-sm font-mono">
          <span className="text-foreground">{formatTime(currentTime)}</span>
          <span className="text-muted-foreground">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-center gap-2 md:gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => { stopAllAudio(); pauseOffsetRef.current = 0; setCurrentTime(0); onStop(); }}
            disabled={currentTime === 0 && !isPlaying}
            className="w-10 h-10 md:w-12 md:h-12"
          >
            <Icon name="Square" size={20} />
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={onPlayPause}
            className="w-12 h-12 md:w-16 md:h-16"
          >
            <Icon name={isPlaying ? 'Pause' : 'Play'} size={24} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 md:w-12 md:h-12"
            onClick={() => { stopAllAudio(); pauseOffsetRef.current = 0; setCurrentTime(0); }}
          >
            <Icon name="SkipForward" size={20} />
          </Button>
        </div>

        {/* Active Effects Status */}
        {uniqueEffects?.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {channels?.filter(ch => ch?.bass !== 0 || ch?.mid !== 0 || ch?.treble !== 0)?.map(ch => (
              <span key={`eq-${ch?.id}`} className="px-2 py-1 rounded text-xs font-mono bg-warning/10 text-warning border border-warning/20">
                EQ: {ch?.name}
              </span>
            ))}
            {channels?.filter(ch => ch?.reverb > 0)?.map(ch => (
              <span key={`rev-${ch?.id}`} className="px-2 py-1 rounded text-xs font-mono bg-secondary/10 text-secondary border border-secondary/20">
                Reverb: {ch?.name} ({ch?.reverb}%)
              </span>
            ))}
            {channels?.filter(ch => ch?.telephoneEnabled)?.map(ch => (
              <span key={`tel-${ch?.id}`} className="px-2 py-1 rounded text-xs font-mono bg-accent/10 text-accent border border-accent/20">
                📞 {ch?.name}
              </span>
            ))}
            {echo?.wet > 0 && (
              <span className="px-2 py-1 rounded text-xs font-mono bg-success/10 text-success border border-success/20">
                Echo {echo?.wet}% · {echo?.noteValue}
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Peak Level</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-success" style={{ width: '78%' }} />
              </div>
              <span className="text-xs font-data text-foreground">-3.2 dB</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">RMS Level</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-warning" style={{ width: '65%' }} />
              </div>
              <span className="text-xs font-data text-foreground">-8.5 dB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MasterPlayback.displayName = 'MasterPlayback';

export default MasterPlayback;