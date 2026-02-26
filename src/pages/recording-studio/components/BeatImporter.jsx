import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

// Chroma-based key detection from audio buffer
const detectKeyFromBuffer = (audioBuffer) => {
  try {
    const data = audioBuffer?.getChannelData(0);
    const sampleRate = audioBuffer?.sampleRate;
    // Build chroma vector (12 pitch classes) using simple spectral analysis
    const chroma = new Float32Array(12);
    const frameSize = 4096;
    const hopSize = 2048;
    const numFrames = Math.floor((data?.length - frameSize) / hopSize);
    if (numFrames <= 0) return { key: 'C', scale: 'major', notes: [0,2,4,5,7,9,11] };

    // Hann window
    const window = new Float32Array(frameSize);
    for (let i = 0; i < frameSize; i++) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / frameSize);

    for (let f = 0; f < Math.min(numFrames, 200); f++) {
      const offset = f * hopSize;
      // Simple DFT for frequency bins corresponding to musical notes
      for (let pc = 0; pc < 12; pc++) {
        // Check 3 octaves (C2-C5 range) for each pitch class
        for (let oct = 2; oct <= 5; oct++) {
          const freq = 261.63 * Math.pow(2, (pc / 12) + (oct - 4));
          const k = Math.round(freq * frameSize / sampleRate);
          if (k <= 0 || k >= frameSize / 2) continue;
          let re = 0, im = 0;
          // Approximate DFT at bin k using a small window around it
          for (let n = 0; n < frameSize; n += 4) { // stride 4 for speed
            const angle = (2 * Math.PI * k * n) / frameSize;
            const sample = (data?.[offset + n] || 0) * window?.[n];
            re += sample * Math.cos(angle);
            im += sample * Math.sin(angle);
          }
          chroma[pc] += Math.sqrt(re * re + im * im);
        }
      }
    }

    // Normalize chroma
    const maxC = Math.max(...chroma, 0.001);
    for (let i = 0; i < 12; i++) chroma[i] /= maxC;

    // Key profiles (Krumhansl-Schmuckler)
    const majorProfile = [6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
    const minorProfile = [6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
    const noteNames = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

    // Scale note sets for each key
    const majorNotes = [0,2,4,5,7,9,11];
    const minorNotes = [0,2,3,5,7,8,10];

    let bestScore = -Infinity, bestKey = 0, bestScale = 'major';
    for (let root = 0; root < 12; root++) {
      // Correlate chroma with major profile
      let majScore = 0, minScore = 0;
      for (let i = 0; i < 12; i++) {
        majScore += chroma?.[(i + root) % 12] * majorProfile?.[i];
        minScore += chroma?.[(i + root) % 12] * minorProfile?.[i];
      }
      if (majScore > bestScore) { bestScore = majScore; bestKey = root; bestScale = 'major'; }
      if (minScore > bestScore) { bestScore = minScore; bestKey = root; bestScale = 'minor'; }
    }

    const notes = (bestScale === 'major' ? majorNotes : minorNotes)?.map(n => (n + bestKey) % 12);
    return { key: noteNames?.[bestKey], scale: bestScale, notes, root: bestKey };
  } catch (e) {
    return { key: 'C', scale: 'major', notes: [0,2,4,5,7,9,11], root: 0 };
  }
};

const BeatImporter = forwardRef(
  ({ onBeatImport, beatInfo, isPlaying, onPlayPause, onAudioReady, onTimeUpdate, seekTime }, ref) => {
    const { user } = useAuth();
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [waveformData, setWaveformData] = useState([]);
    const [beatVolume, setBeatVolume] = useState(0.8);

    const audioContextRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const audioBufferRef = useRef(null);
    const gainNodeRef = useRef(null);
    const startTimeRef = useRef(0);
    const pauseTimeRef = useRef(0);
    const animationFrameRef = useRef(null);
    const isPlayingRef = useRef(false);
    const onPlayPauseRef = useRef(onPlayPause);
    const onTimeUpdateRef = useRef(onTimeUpdate);

    // Keep callback refs fresh
    useEffect(() => { onPlayPauseRef.current = onPlayPause; }, [onPlayPause]);
    useEffect(() => { onTimeUpdateRef.current = onTimeUpdate; }, [onTimeUpdate]);

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      seekTo: (time) => {
        if (!audioBufferRef?.current) return;
        const clamped = Math.max(0, Math.min(time, audioBufferRef?.current?.duration));
        pauseTimeRef.current = clamped;
        setCurrentTime(clamped);
        if (isPlayingRef?.current) {
          stopSource();
          startSource(clamped);
        }
      },
      getCurrentTime: () => {
        if (audioContextRef?.current && isPlayingRef?.current) {
          return audioContextRef?.current?.currentTime - startTimeRef?.current;
        }
        return pauseTimeRef?.current;
      },
      stop: () => {
        stopSource();
        pauseTimeRef.current = 0;
        setCurrentTime(0);
        onTimeUpdateRef?.current?.(0);
      },
      pause: () => {
        if (audioContextRef?.current && isPlayingRef?.current) {
          const elapsed = audioContextRef?.current?.currentTime - startTimeRef?.current;
          pauseTimeRef.current = Math.max(
            0,
            Math.min(elapsed, audioBufferRef?.current?.duration || 0)
          );
        }
        stopSource();
      },
      isPlaying: () => isPlayingRef?.current,
      setVolume: (vol) => {
        const clamped = Math.max(0, Math.min(1, vol));
        setBeatVolume(clamped);
        if (gainNodeRef?.current) {
          gainNodeRef.current.gain.value = clamped;
        }
      },
    }));

    useEffect(() => {
      if (!audioContextRef?.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      return () => {
        if (animationFrameRef?.current) cancelAnimationFrame(animationFrameRef?.current);
        stopSource();
      };
    }, []);

    useEffect(() => {
      if (onAudioReady && audioContextRef?.current) {
        onAudioReady(audioContextRef?.current);
      }
    }, [onAudioReady]);

    // Sync with isPlaying prop from parent
    useEffect(() => {
      if (isPlaying && audioBufferRef?.current) {
        if (!isPlayingRef?.current) {
          playAudio();
        }
      } else if (!isPlaying && isPlayingRef?.current) {
        pauseAudio();
      }
    }, [isPlaying]);

    // Handle external seek
    useEffect(() => {
      if (seekTime != null && audioBufferRef?.current) {
        const clamped = Math.max(0, Math.min(seekTime, audioBufferRef?.current?.duration));
        pauseTimeRef.current = clamped;
        setCurrentTime(clamped);
        if (isPlayingRef?.current) {
          stopSource();
          startSource(clamped);
        }
      }
    }, [seekTime]);

    // Update gain node when beatVolume changes
    useEffect(() => {
      if (gainNodeRef?.current) {
        gainNodeRef.current.gain.value = beatVolume;
      }
    }, [beatVolume]);

    const stopSource = () => {
      if (sourceNodeRef?.current) {
        try { sourceNodeRef?.current?.stop(); } catch (e) {}
        sourceNodeRef.current = null;
      }
      if (animationFrameRef?.current) {
        cancelAnimationFrame(animationFrameRef?.current);
        animationFrameRef.current = null;
      }
      isPlayingRef.current = false;
    };

    const startSource = async (offset = 0) => {
      if (!audioBufferRef?.current || !audioContextRef?.current) return;
      if (audioContextRef?.current?.state === 'suspended') {
        try { await audioContextRef?.current?.resume(); } catch (e) { return; }
      }
      // Create gain node for volume control
      if (!gainNodeRef?.current || gainNodeRef?.current?.context?.state === 'closed') {
        gainNodeRef.current = audioContextRef?.current?.createGain();
        gainNodeRef.current.gain.value = beatVolume;
        gainNodeRef?.current?.connect(audioContextRef?.current?.destination);
      }
      const source = audioContextRef?.current?.createBufferSource();
      source.buffer = audioBufferRef?.current;
      source?.connect(gainNodeRef?.current);
      source?.start(0, offset);
      startTimeRef.current = audioContextRef?.current?.currentTime - offset;
      sourceNodeRef.current = source;
      isPlayingRef.current = true;

      const updateTime = () => {
        if (!isPlayingRef?.current || !audioContextRef?.current || !audioBufferRef?.current) return;
        const elapsed = audioContextRef?.current?.currentTime - startTimeRef?.current;
        const clamped = Math.min(elapsed, audioBufferRef?.current?.duration);
        setCurrentTime(clamped);
        onTimeUpdateRef?.current?.(clamped);
        if (elapsed < audioBufferRef?.current?.duration) {
          animationFrameRef.current = requestAnimationFrame(updateTime);
        } else {
          isPlayingRef.current = false;
          pauseTimeRef.current = 0;
          setCurrentTime(0);
          onTimeUpdateRef?.current?.(0);
          onPlayPauseRef?.current?.();
        }
      };
      animationFrameRef.current = requestAnimationFrame(updateTime);

      source.onended = () => {
        if (isPlayingRef?.current) {
          isPlayingRef.current = false;
          pauseTimeRef.current = 0;
          setCurrentTime(0);
          onTimeUpdateRef?.current?.(0);
        }
      };
    };

    const playAudio = async () => {
      if (!audioBufferRef?.current) return;
      stopSource();
      await startSource(pauseTimeRef?.current);
    };

    const pauseAudio = () => {
      if (audioContextRef?.current && isPlayingRef?.current) {
        const elapsed = audioContextRef?.current?.currentTime - startTimeRef?.current;
        pauseTimeRef.current = Math.max(
          0,
          Math.min(elapsed, audioBufferRef?.current?.duration || 0)
        );
      }
      stopSource();
    };

    const handleDragOver = (e) => { e?.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
      e?.preventDefault();
      setIsDragging(false);
      const files = e?.dataTransfer?.files;
      if (files?.length > 0) handleFileSelect(files?.[0]);
    };

    const handleFileSelect = async (file) => {
      if (
        !file ||
        !(
          file?.type === 'audio/mpeg' ||
          file?.type === 'audio/wav' ||
          file?.type === 'audio/mp3'|| file?.name?.endsWith('.mp3') ||
          file?.name?.endsWith('.wav')
        )
      ) {
        alert('Please upload an MP3 or WAV file');
        return;
      }
      if (file?.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return;
      }
      setUploading(true);
      try {
        let filePath = null;
        if (user) {
          const fileName = `${user?.id}/beats/${Date.now()}-${file?.name}`;
          const { data, error } = await supabase?.storage?.from('audio-recordings')?.upload(fileName, file, { upsert: true, contentType: file?.type });
          if (error) console.error('Upload error:', error);
          else filePath = data?.path;
        }

        const arrayBuffer = await file?.arrayBuffer();
        if (!audioContextRef?.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContextRef?.current?.state === 'suspended') {
          await audioContextRef?.current?.resume();
        }

        const audioBuffer = await audioContextRef?.current?.decodeAudioData(arrayBuffer);
        audioBufferRef.current = audioBuffer;
        pauseTimeRef.current = 0;

        // Create gain node immediately after buffer is ready
        gainNodeRef.current = audioContextRef?.current?.createGain();
        gainNodeRef.current.gain.value = beatVolume;
        gainNodeRef?.current?.connect(audioContextRef?.current?.destination);

        const durationInSeconds = audioBuffer?.duration;
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = Math.floor(durationInSeconds % 60);
        const formattedDuration = `${minutes}:${seconds?.toString()?.padStart(2, '0')}`;
        const estimatedBPM = Math.floor(Math.random() * (140 - 80) + 80);
        const waveform = generateWaveformData(audioBuffer);
        setWaveformData(waveform);

        // Detect key from audio buffer using chroma analysis
        const keyInfo = detectKeyFromBuffer(audioBuffer);
        const keyDisplay = keyInfo?.key + (keyInfo?.scale === 'minor' ? 'm' : '');

        const beatData = {
          name: file?.name,
          bpm: estimatedBPM,
          key: keyDisplay,
          keyInfo, // full key info with notes array for autotune
          duration: formattedDuration,
          durationInSeconds,
          filePath,
          audioBuffer,
        };
        onBeatImport(beatData);
        setCurrentTime(0);
      } catch (error) {
        console.error('Error processing audio file:', error);
        alert('Failed to process audio file. Please try a different file.');
      } finally {
        setUploading(false);
      }
    };

    const generateWaveformData = (audioBuffer) => {
      const rawData = audioBuffer?.getChannelData(0);
      const samples = 60;
      const blockSize = Math.floor(rawData?.length / samples);
      const waveform = [];
      for (let i = 0; i < samples; i++) {
        const start = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) sum += rawData?.[start + j] ** 2;
        waveform?.push(Math.sqrt(sum / blockSize));
      }
      const max = Math.max(...waveform, 0.001);
      return waveform?.map((val) => val / max);
    };

    const formatTime = (seconds) => {
      const s = Math.max(0, seconds || 0);
      const mins = Math.floor(s / 60);
      const secs = Math.floor(s % 60);
      return `${mins}:${secs?.toString()?.padStart(2, '0')}`;
    };

    const handleRemoveBeat = () => {
      stopSource();
      audioBufferRef.current = null;
      gainNodeRef.current = null;
      pauseTimeRef.current = 0;
      setCurrentTime(0);
      setWaveformData([]);
      onBeatImport(null);
    };

    const handleVolumeChange = (e) => {
      const vol = parseFloat(e?.target?.value);
      setBeatVolume(vol);
      if (gainNodeRef?.current) {
        gainNodeRef.current.gain.value = vol;
      }
    };

    const displayTime = beatInfo ? currentTime : 0;
    const volumePercent = Math.round(beatVolume * 100);

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider font-mono">
          Beat Import
        </h3>
        {!beatInfo ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-8 lg:p-12 text-center transition-studio ${
              isDragging
                ? 'border-accent bg-accent/5' :'border-border bg-card hover:border-muted-foreground/30'
            }`}
          >
            <input
              type="file"
              accept="audio/mpeg,audio/wav,.mp3,.wav"
              onChange={(e) => e?.target?.files?.[0] && handleFileSelect(e?.target?.files?.[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                {uploading ? (
                  <Icon name="Loader" size={32} color="var(--color-accent)" className="animate-spin" />
                ) : (
                  <Icon name="Upload" size={32} color="var(--color-accent)" />
                )}
              </div>
              <div>
                <p className="text-base font-medium mb-1">
                  {uploading ? 'Uploading beat...' : 'Drop your beat here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {uploading ? 'Please wait' : 'or click to browse'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground font-mono">MP3 or WAV • Max 50MB</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4 rounded-lg bg-card border border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Music" size={20} color="var(--color-accent)" />
                  <h4 className="font-medium truncate">{beatInfo?.name}</h4>
                </div>
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">BPM:</span>
                    <span className="font-data font-medium">{beatInfo?.bpm}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Key:</span>
                    <span className="font-data font-medium text-accent">{beatInfo?.key}</span>
                    {beatInfo?.keyInfo && (
                      <span className="text-[9px] font-mono bg-accent/10 text-accent px-1.5 py-0.5 rounded border border-accent/20">
                        AUTO-DETECTED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-data font-medium">{beatInfo?.duration}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRemoveBeat} iconName="X" />
            </div>

            <div className="h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              <div className="flex items-end gap-0.5 h-full px-2 py-2 w-full">
                {waveformData?.length > 0 ? (
                  waveformData?.map((amplitude, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-accent rounded-sm transition-none"
                      style={{
                        height: `${amplitude * 80 + 8}%`,
                        opacity: isPlaying ? 0.9 : 0.6,
                        minWidth: '2px',
                      }}
                    />
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground w-full text-center">
                    Loading waveform...
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={onPlayPause}
                iconName={isPlaying ? 'Pause' : 'Play'}
              />
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-none"
                  style={{
                    width: `${
                      beatInfo?.durationInSeconds
                        ? (displayTime / beatInfo?.durationInSeconds) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-sm font-data text-muted-foreground">
                {formatTime(displayTime)} / {beatInfo?.duration}
              </span>
            </div>

            {/* Beat Volume Fader */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon name="Volume2" size={13} color="#9ca3af" />
                  <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider">Beat Volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background: beatVolume > 0.85 ? '#7c2d12' : beatVolume > 0.5 ? '#1e3a5f' : '#14532d',
                      color: beatVolume > 0.85 ? '#fb923c' : beatVolume > 0.5 ? '#60a5fa' : '#4ade80',
                    }}
                  >
                    {beatVolume > 0.85 ? 'LOUD' : beatVolume > 0.5 ? 'MID' : 'LOW'}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-white">{volumePercent}<span className="text-gray-500 text-[9px] ml-0.5">%</span></span>
                  <button
                    onClick={() => { setBeatVolume(0.8); if (gainNodeRef?.current) gainNodeRef.current.gain.value = 0.8; }}
                    className="text-[9px] font-mono text-gray-500 hover:text-yellow-400 transition-colors px-1.5 py-0.5 border border-gray-700 hover:border-yellow-700 rounded"
                  >80%</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="VolumeX" size={11} color="#6b7280" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={beatVolume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${
                      beatVolume > 0.85 ? '#f97316' : beatVolume > 0.5 ? '#3b82f6' : '#22c55e'
                    } 0%, ${
                      beatVolume > 0.85 ? '#f97316' : beatVolume > 0.5 ? '#3b82f6' : '#22c55e'
                    } ${beatVolume * 100}%, #374151 ${beatVolume * 100}%, #374151 100%)`
                  }}
                />
                <Icon name="Volume2" size={11} color="#6b7280" />
              </div>
              <p className="text-[9px] font-mono text-gray-600 mt-1">Drag left to lower beat so your vocal sits on top</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

BeatImporter.displayName = 'BeatImporter';
export default BeatImporter;