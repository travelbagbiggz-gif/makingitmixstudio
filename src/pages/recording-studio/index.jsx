import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import PresetSelector from './components/PresetSelector';
import AutotuneControls from './components/AutotuneControls';
import BeatImporter from './components/BeatImporter';
import VocalChannel from './components/VocalChannel';
import AudioMeter from './components/AudioMeter';
import DeviceSelector from './components/DeviceSelector';
import MetronomeControl from './components/MetronomeControl';
import DemoCounter from './components/DemoCounter';
import ProToolsTransport from './components/ProToolsTransport';
import ProToolsTimeline from './components/ProToolsTimeline';
import TrackMixer from './components/TrackMixer';
import TakeManager from './components/TakeManager';
import TimeMarkers, { DEFAULT_MARKERS } from './components/TimeMarkers';
import ExportPanel from './components/ExportPanel';
import ProjectTemplates from './components/ProjectTemplates';
import SessionNotes from './components/SessionNotes';
import TutorialOverlay from './components/TutorialOverlay';
import WaveformZoom from './components/WaveformZoom';
import LatencyDisplay from './components/LatencyDisplay';
import AutoSaveIndicator from './components/AutoSaveIndicator';
import { buildAutotuneChain as buildDSPChain } from './components/AutotuneDSP';

const audioBufferToWav = (buffer) => {
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let length = buffer.length * numberOfChannels * 2;
  let result = new ArrayBuffer(44 + length);
  let view = new DataView(result);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  let offset = 0;
  // RIFF identifier
  writeString(offset, 'RIFF'); offset += 4;
  // file length
  view.setUint32(offset, 36 + length, true); offset += 4;
  // RIFF type
  writeString(offset, 'WAVE'); offset += 4;
  // format chunk identifier
  writeString(offset, 'fmt '); offset += 4;
  // format chunk length
  view.setUint32(offset, 16, true); offset += 4;
  // sample format (raw)
  view.setUint16(offset, format, true); offset += 2;
  // channel count
  view.setUint16(offset, numberOfChannels, true); offset += 2;
  // sample rate
  view.setUint32(offset, sampleRate, true); offset += 4;
  // byte rate (sample rate * block align)
  view.setUint32(offset, sampleRate * numberOfChannels * bitDepth / 8, true); offset += 4;
  // block align (channel count * bytes per sample)
  view.setUint16(offset, numberOfChannels * bitDepth / 8, true); offset += 2;
  // bits per sample
  view.setUint16(offset, bitDepth, true); offset += 2;
  // data chunk identifier
  writeString(offset, 'data'); offset += 4;
  // data chunk length
  view.setUint32(offset, length, true); offset += 4;

  // write the PCM samples
  let index = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      let sample = buffer.getChannelData(channel)[i];
      // clamp
      sample = Math.max(-1, Math.min(1, sample));
      // scale to 16-bit
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(index, sample, true);
      index += 2;
    }
  }

  return new Blob([result], { type: 'audio/wav' });
};

const makeChannels = () => [
  { id: 'lead', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null, muted: false, soloed: false, volume: 1.0, pan: 0, color: '#ef4444', customName: null },
  { id: 'double', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null, muted: false, soloed: false, volume: 1.0, pan: 0, color: '#f97316', customName: null },
  { id: 'adlib', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null, muted: false, soloed: false, volume: 1.0, pan: 0, color: '#6366f1', customName: null },
  { id: 'extra', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null, muted: false, soloed: false, volume: 1.0, pan: 0, color: '#22c55e', customName: null },
];

const RecordingStudio = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedPreset, setSelectedPreset] = useState('hiphop');
  const [autotuneEnabled, setAutotuneEnabled] = useState(true);
  const [retuneSpeed, setRetuneSpeed] = useState(50);
  const [autotuneIntensity, setAutotuneIntensity] = useState(100);
  const [autotuneWetMix, setAutotuneWetMix] = useState(100);
  const [beatVolumeState, setBeatVolumeState] = useState(80);
  const [beatInfo, setBeatInfo] = useState(null);
  const [isBeatPlaying, setIsBeatPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('verse1');
  const [isRecording, setIsRecording] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionTitle, setSessionTitle] = useState('Untitled Session');
  const [saving, setSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [micPermissionError, setMicPermissionError] = useState(null);
  const [recordingError, setRecordingError] = useState(null);
  const [autoMixing, setAutoMixing] = useState(false);
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  // Add this block - Manual latency compensation state
  const [manualLatencyMs, setManualLatencyMs] = useState(() => {
    const saved = localStorage.getItem('studio_latency_compensation_ms');
    return saved !== null ? Number(saved) : 0;
  });
  const [showLatencyFader, setShowLatencyFader] = useState(false);
  // End of added block

  // Pro Tools transport state
  const [currentTime, setCurrentTime] = useState(0);
  const [armedChannel, setArmedChannel] = useState(null);
  const [isPunchInEnabled, setIsPunchInEnabled] = useState(false);
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);
  const [punchInPoint, setPunchInPoint] = useState(null);
  const [punchOutPoint, setPunchOutPoint] = useState(null);
  const [seekTime, setSeekTime] = useState(null);
  const [recordedWaveforms, setRecordedWaveforms] = useState({});

  // New DAW features state
  const [timeMarkers, setTimeMarkers] = useState(DEFAULT_MARKERS);
  const [waveformZoom, setWaveformZoom] = useState(1);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [gridSize, setGridSize] = useState(1);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [takes, setTakes] = useState({});
  const [undoStack, setUndoStack] = useState([]);
  const [rightPanel, setRightPanel] = useState('controls'); // controls | mixer | export | notes

  // Audio refs
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioBuffersRef = useRef({});
  const recordingStartTimeRef = useRef(null);
  const retryCountRef = useRef(0);
  const deviceInitializedRef = useRef(false);
  const audioPlayersRef = useRef({});
  const beatImporterRef = useRef(null);
  // Autotune processing nodes
  const autotuneSourceRef = useRef(null);
  const autotuneDestRef = useRef(null);
  const autotuneNodesRef = useRef([]);
  const processedStreamRef = useRef(null);
  // Track which audio elements already have Web Audio nodes connected
  const connectedAudioElementsRef = useRef(new WeakSet());

  // Bluetooth latency optimization refs
  const bluetoothCompensationRef = useRef(null);
  const monitoringGainRef = useRef(null);
  const isBluetoothDeviceRef = useRef(false);
  const latencyCompensationMsRef = useRef(0);
  // Autotune ScriptProcessor ref for real-time pitch correction
  const pitchProcessorRef = useRef(null);
  const pitchShiftBufferRef = useRef(null);
  const autotuneCleanupRef = useRef(null);

  // Metronome refs
  const metronomeCtxRef = useRef(null);
  const metronomeIntervalRef = useRef(null);
  const metronomeBeatRef = useRef(0);

  // Playhead tracking
  const playheadIntervalRef = useRef(null);
  const playStartWallRef = useRef(null);
  const playStartTimeRef = useRef(0);

  const [verse1Channels, setVerse1Channels] = useState(makeChannels());
  const [verse2Channels, setVerse2Channels] = useState(makeChannels());
  const [verse3Channels, setVerse3Channels] = useState(makeChannels());
  const [hookChannels, setHookChannels] = useState(makeChannels());

  // Add this block - Define tabs array before it's used
  const tabs = [
    { id: 'verse1', label: 'Verse 1', icon: 'Music2' },
    { id: 'verse2', label: 'Verse 2', icon: 'Music3' },
    { id: 'verse3', label: 'Verse 3', icon: 'Music4' },
    { id: 'hook', label: 'Hook', icon: 'Sparkles' },
  ];

  const rightPanelTabs = [
    { id: 'controls', label: 'Controls', icon: 'Settings' },
    { id: 'mixer', label: 'Mixer', icon: 'SlidersHorizontal' },
    { id: 'export', label: 'Export', icon: 'Download' },
    { id: 'notes', label: 'Notes', icon: 'FileText' },
  ];
  // End of added block

  // Check first-time user
  useEffect(() => {
    const seen = localStorage.getItem('studio_tutorial_seen');
    if (!seen) setShowTutorial(true);
  }, []);

  // Persist manualLatencyMs to localStorage — does NOT add delay to monitoring
  // It only offsets the recording start time for sync alignment
  useEffect(() => {
    localStorage.setItem('studio_latency_compensation_ms', String(manualLatencyMs));
    // NOTE: We intentionally do NOT update a DelayNode here.
    // The latency fader only shifts recordingStartTimeRef (recording sync offset),
    // it does NOT add delay to the monitoring path (that would make latency worse).
  }, [manualLatencyMs]);

  // Auto-suggest latency range when Bluetooth device is detected
  useEffect(() => {
    if (isBluetoothDeviceRef?.current && manualLatencyMs === 0) {
      // Only auto-suggest if user hasn't set a value yet
      const savedMs = localStorage.getItem('studio_latency_compensation_ms');
      if (!savedMs || savedMs === '0') {
        setManualLatencyMs(150); // Default BT suggestion: 150ms
      }
    }
  }, []);

  const handleTutorialComplete = () => {
    localStorage.setItem('studio_tutorial_seen', '1');
    setShowTutorial(false);
  };

  useEffect(() => {
    if (!authLoading && !user) navigate('/sign-in');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    initializeAudioContext();
    return () => cleanup();
  }, []);

  // Playhead ticker
  useEffect(() => {
    if (isBeatPlaying || isRecording) {
      playStartWallRef.current = Date.now();
      playStartTimeRef.current = currentTime;
      playheadIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - playStartWallRef?.current) / 1000;
        const newTime = playStartTimeRef?.current + elapsed;
        const maxDur = beatInfo?.durationInSeconds || 180;
        if (newTime >= maxDur) {
          if (isLoopEnabled && !isRecording) {
            setCurrentTime(0);
            playStartWallRef.current = Date.now();
            playStartTimeRef.current = 0;
            setSeekTime(0);
          } else {
            setCurrentTime(maxDur);
            if (!isRecording) setIsBeatPlaying(false);
            clearInterval(playheadIntervalRef?.current);
          }
        } else {
          setCurrentTime(newTime);
        }
      }, 50);
    } else {
      if (playheadIntervalRef?.current) {
        clearInterval(playheadIntervalRef?.current);
        playheadIntervalRef.current = null;
      }
    }
    return () => { if (playheadIntervalRef?.current) clearInterval(playheadIntervalRef?.current); };
  }, [isBeatPlaying, isRecording, beatInfo, isLoopEnabled]);

  // Metronome
  useEffect(() => {
    if (metronomeEnabled && (isBeatPlaying || isRecording) && beatInfo?.bpm) {
      startMetronome(beatInfo?.bpm);
    } else {
      stopMetronome();
    }
    return () => stopMetronome();
  }, [metronomeEnabled, isBeatPlaying, isRecording, beatInfo?.bpm]);

  // ─── Keyboard Shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't fire when typing in inputs
      if (e?.target?.tagName === 'INPUT' || e?.target?.tagName === 'TEXTAREA') return;

      if (e?.code === 'Space') {
        e?.preventDefault();
        if (beatInfo) handleTransportPlay();
      } else if (e?.code === 'KeyR' && !e?.ctrlKey && !e?.metaKey) {
        e?.preventDefault();
        handleTransportRecord();
      } else if ((e?.ctrlKey || e?.metaKey) && e?.code === 'KeyZ') {
        e?.preventDefault();
        handleUndo();
      } else if ((e?.ctrlKey || e?.metaKey) && e?.code === 'KeyS') {
        e?.preventDefault();
        handleSaveSession();
      } else if (e?.code === 'KeyM' && !e?.ctrlKey) {
        e?.preventDefault();
        if (armedChannel) {
          const [sec, chId] = armedChannel?.split('-');
          handleChannelUpdate(sec, chId, { muted: !getChannelState(sec)?.channels?.find(c => c?.id === chId)?.muted });
        }
      } else if (e?.code === 'KeyS' && !e?.ctrlKey) {
        e?.preventDefault();
        if (armedChannel) {
          const [sec, chId] = armedChannel?.split('-');
          let ch = getChannelState(sec)?.channels?.find(c => c?.id === chId);
          handleChannelUpdate(sec, chId, { soloed: !ch?.soloed });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [beatInfo, armedChannel, isRecording, isBeatPlaying, undoStack]);

  // ─── Auto-save ────────────────────────────────────────────────────────────────
  const autoSaveData = {
    verse1: verse1Channels, verse2: verse2Channels,
    verse3: verse3Channels, hook: hookChannels,
    beatInfo, selectedPreset, autotuneEnabled, retuneSpeed,
    sessionTitle, timeMarkers, takes,
  };

  const handleAutoSave = useCallback(async (data) => {
    if (!user || !beatInfo) return;
    try {
      if (currentSessionId) {
        await supabase?.from('audio_sessions')?.update({
          title: sessionTitle,
          session_data: data,
          status: 'in_progress',
        })?.eq('id', currentSessionId);
      }
    } catch (e) { console.error('Auto-save error:', e); }
  }, [user, beatInfo, currentSessionId, sessionTitle]);

  // ─── Undo ─────────────────────────────────────────────────────────────────────
  const pushUndo = (state) => {
    setUndoStack(prev => [...prev?.slice(-19), state]);
  };

  const handleUndo = () => {
    if (undoStack?.length === 0) return;
    const prev = undoStack?.[undoStack?.length - 1];
    setUndoStack(s => s?.slice(0, -1));
    if (prev?.verse1) setVerse1Channels(prev?.verse1);
    if (prev?.verse2) setVerse2Channels(prev?.verse2);
    if (prev?.verse3) setVerse3Channels(prev?.verse3);
    if (prev?.hook) setHookChannels(prev?.hook);
    if (prev?.recordedWaveforms) setRecordedWaveforms(prev?.recordedWaveforms);
    if (prev?.takes) setTakes(prev?.takes);
  };

  // ─── Channel update helper ────────────────────────────────────────────────────
  const handleChannelUpdate = (section, channelId, updates) => {
    const { channels, setChannels } = getChannelState(section);
    setChannels(channels?.map(c => c?.id === channelId ? { ...c, ...updates } : c));
  };

  const handleMixerChannelUpdate = (section) => (channelId, updates) => {
    handleChannelUpdate(section, channelId, updates);
  };

  // ─── Project Templates ────────────────────────────────────────────────────────
  const handleApplyTemplate = (template) => {
    setSelectedPreset(template?.preset);
    setAutotuneEnabled(template?.autotune);
    setRetuneSpeed(template?.retuneSpeed);
  };

  const startMetronome = (bpm) => {
    stopMetronome();
    if (!metronomeCtxRef?.current || metronomeCtxRef?.current?.state === 'closed') {
      metronomeCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (metronomeCtxRef?.current?.state === 'suspended') metronomeCtxRef?.current?.resume();
    metronomeBeatRef.current = 0;
    const intervalMs = (60 / bpm) * 1000;
    const clickBeat = () => {
      if (!metronomeCtxRef?.current) return;
      const ctx = metronomeCtxRef?.current;
      const osc = ctx?.createOscillator();
      const gain = ctx?.createGain();
      osc?.connect(gain);
      gain?.connect(ctx?.destination);
      const isAccent = metronomeBeatRef?.current % 4 === 0;
      osc.frequency.value = isAccent ? 1000 : 800;
      gain?.gain?.setValueAtTime(isAccent ? 0.4 : 0.2, ctx?.currentTime);
      gain?.gain?.exponentialRampToValueAtTime(0.001, ctx?.currentTime + 0.05);
      osc?.start(ctx?.currentTime);
      osc?.stop(ctx?.currentTime + 0.05);
      metronomeBeatRef.current++;
    };
    clickBeat();
    metronomeIntervalRef.current = setInterval(clickBeat, intervalMs);
  };

  const stopMetronome = () => {
    if (metronomeIntervalRef?.current) {
      clearInterval(metronomeIntervalRef?.current);
      metronomeIntervalRef.current = null;
    }
  };

  const cleanup = () => {
    if (animationFrameRef?.current) { cancelAnimationFrame(animationFrameRef?.current); animationFrameRef.current = null; }
    if (mediaRecorderRef?.current && mediaRecorderRef?.current?.state !== 'inactive') { try { mediaRecorderRef?.current?.stop(); } catch (e) {} }
    if (mediaStreamRef?.current) { mediaStreamRef?.current?.getTracks()?.forEach(t => { try { t?.stop(); } catch (e) {} }); mediaStreamRef.current = null; }
    if (analyserRef?.current) { try { analyserRef?.current?.disconnect(); } catch (e) {} analyserRef.current = null; }
    if (audioContextRef?.current && audioContextRef?.current?.state !== 'closed') { try { audioContextRef?.current?.close(); } catch (e) {} }
    if (playheadIntervalRef?.current) clearInterval(playheadIntervalRef?.current);
    stopMetronome();
  };

  const initializeAudioContext = async (forceReinit = false) => {
    try {
      if (deviceInitializedRef?.current && !forceReinit) return true;
      setMicPermissionError(null);
      setRecordingError(null);
      if (!audioContextRef?.current || audioContextRef?.current?.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          latencyHint: 0, // Use 0 for absolute minimum latency (overrides 'interactive')
          sampleRate: 48000,
        });
      }
      if (audioContextRef?.current?.state === 'suspended') await audioContextRef?.current?.resume();
      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          latency: 0,
          sampleRate: 48000,
          channelCount: 1,
          // Request smallest possible buffer for minimum latency
          googHighpassFilter: false,
          googNoiseSuppression: false,
          googEchoCancellation: false,
          googAutoGainControl: false,
        }
      };
      if (selectedDevice && selectedDevice !== 'default') constraints.audio.deviceId = { exact: selectedDevice };
      const stream = await navigator.mediaDevices?.getUserMedia(constraints);
      if (!stream?.active) throw new Error('Failed to get active media stream');
      const audioTracks = stream?.getAudioTracks();
      if (!audioTracks?.length) throw new Error('No audio tracks found');
      const primaryTrack = audioTracks?.[0];
      if (!primaryTrack?.enabled || primaryTrack?.readyState !== 'live') throw new Error('Audio track not ready');

      // Detect Bluetooth device by checking track label and settings
      const trackLabel = primaryTrack?.label?.toLowerCase() || '';
      const trackSettings = primaryTrack?.getSettings?.() || {};
      const isBluetooth = trackLabel?.includes('bluetooth') ||
        trackLabel?.includes('bt ') ||
        trackLabel?.includes('airpod') ||
        trackLabel?.includes('wireless') ||
        trackLabel?.includes('headset') ||
        (trackSettings?.latency && trackSettings?.latency > 0.05);
      isBluetoothDeviceRef.current = isBluetooth;

      // Bluetooth devices typically add 100-200ms latency in SCO mode
      // We compensate by pre-rolling the recording start time
      if (isBluetooth) {
        const btLatency = trackSettings?.latency ? trackSettings?.latency * 1000 : 150;
        latencyCompensationMsRef.current = Math.min(btLatency, 200);
      } else {
        latencyCompensationMsRef.current = 0;
      }

      if (mediaStreamRef?.current) mediaStreamRef?.current?.getTracks()?.forEach(t => { try { t?.stop(); } catch (e) {} }); mediaStreamRef.current = null;
      mediaStreamRef.current = stream;
      
      // Add this block - setupInputMonitoring function call
      setupInputMonitoring(stream);
      // End of added block
      
      retryCountRef.current = 0;
      deviceInitializedRef.current = true;
      return true;
    } catch (error) {
      deviceInitializedRef.current = false;
      let errorMessage = 'Microphone access failed';
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
      else if (error?.name === 'NotFoundError') errorMessage = 'No microphone found. Please connect a microphone.';
      else if (error?.name === 'NotReadableError') errorMessage = 'Microphone is in use by another app. Please close other apps and retry.';
      else errorMessage = `Microphone error: ${error?.message || 'Unknown error'}`;
      setMicPermissionError(errorMessage);
      return false;
    }
  };

  const handleAudioReady = useCallback((audioCtx) => {
    console.log('Beat audio context ready');
  }, []);

  // Add this block - setupInputMonitoring function definition
  const setupInputMonitoring = (stream) => {
    try {
      if (!audioContextRef?.current || !stream) return;
      
      // Clean up previous monitoring chain
      if (analyserRef?.current) {
        try { analyserRef?.current?.disconnect(); } catch(e) {}
      }
      
      const ctx = audioContextRef?.current;
      const source = ctx?.createMediaStreamSource(stream);
      
      // Create analyser for input level metering
      const analyser = ctx?.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      // Create monitoring gain node
      const monitorGain = ctx?.createGain();
      monitorGain.gain.value = 0; // Start muted, enable when armed
      monitoringGainRef.current = monitorGain;
      
      // Connect: source → analyser → monitorGain → destination
      source?.connect(analyser);
      analyser?.connect(monitorGain);
      monitorGain?.connect(ctx?.destination);
      
      // Start monitoring input level
      monitorInputLevel();
    } catch (err) {
      console.error('Setup monitoring error:', err);
    }
  };
  // End of added block

  // Handle monitoring toggle — turn on/off live vocal monitoring
  const handleMonitoringToggle = () => {
    const newVal = !monitoringEnabled;
    setMonitoringEnabled(newVal);
    if (monitoringGainRef?.current && audioContextRef?.current) {
      // Only activate monitoring if a channel is armed
      const shouldMonitor = newVal && !!armedChannel;
      monitoringGainRef?.current?.gain?.setTargetAtTime(
        shouldMonitor ? 0.85 : 0,
        audioContextRef?.current?.currentTime || 0,
        0.02
      );
    }
  };

  // ─── Voloco-style Autotune: real pitch quantization ───────────────────────────
  // Uses autocorrelation to detect fundamental frequency, then shifts pitch
  // to the nearest note in the beat's musical key (or chromatic if no key detected).
  // retuneSpeed 0 = slow/natural glide, 100 = instant snap (robotic)
  const buildAutotuneChain = async (rawStream) => {
    try {
      if (!audioContextRef?.current || !rawStream) return rawStream;

      // Clean up previous chain
      if (autotuneCleanupRef?.current) {
        try { autotuneCleanupRef?.current(); } catch (e) {}
        autotuneCleanupRef.current = null;
      }
      autotuneNodesRef.current = [];
      if (processedStreamRef?.current) {
        processedStreamRef?.current?.getTracks()?.forEach(t => t?.stop());
        processedStreamRef.current = null;
      }
      if (pitchProcessorRef?.current) {
        try { pitchProcessorRef?.current?.disconnect(); } catch (e) {}
        pitchProcessorRef.current = null;
      }

      if (!autotuneEnabled) return rawStream;

      const ctx = audioContextRef?.current;
      if (ctx?.state === 'suspended') await ctx?.resume();

      const params = {
        enabled: autotuneEnabled,
        wetMix: (autotuneWetMix ?? 100) / 100,
        intensity: (autotuneIntensity ?? 100) / 100,
        retuneSpeed: retuneSpeed / 100,
        beatKeyNotes: beatInfo?.keyInfo?.notes || null,
      };

      const result = await buildDSPChain(ctx, rawStream, params, analyserRef?.current);

      pitchProcessorRef.current = result?.workletNode;
      autotuneCleanupRef.current = result?.cleanup;
      processedStreamRef.current = result?.processedStream;

      console.log(`Autotune DSP: ${result?.usingWorklet ? 'AudioWorklet (YIN + PhaseVocoder)' : 'ScriptProcessor (YIN + PSOLA)'} active`);

      return result?.processedStream;
    } catch (err) {
      console.error('Autotune chain error:', err);
      return rawStream;
    }
  };

  const monitorInputLevel = () => {
    if (!analyserRef?.current) return;
    const bufferLength = analyserRef?.current?.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const updateLevel = () => {
      if (!analyserRef?.current) return;
      analyserRef?.current?.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) { const n = (dataArray?.[i] - 128) / 128; sum += n * n; }
      let rms = Math.sqrt(sum / bufferLength);
      const db = 20 * Math.log10(Math.max(rms, 0.00001));
      setInputLevel(Math.max(0, Math.min(100, ((db + 60) / 60) * 100)));
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };
    updateLevel();
  };

  const handleDeviceChange = async (deviceId) => {
    setSelectedDevice(deviceId);
    deviceInitializedRef.current = false;
    if (mediaStreamRef?.current) { mediaStreamRef?.current?.getTracks()?.forEach(t => t?.stop()); mediaStreamRef.current = null; }
    await initializeAudioContext(true);
  };

  const getChannelState = (section) => {
    switch (section) {
      case 'Verse 1': return { channels: verse1Channels, setChannels: setVerse1Channels, sectionKey: 'verse1' };
      case 'Verse 2': return { channels: verse2Channels, setChannels: setVerse2Channels, sectionKey: 'verse2' };
      case 'Verse 3': return { channels: verse3Channels, setChannels: setVerse3Channels, sectionKey: 'verse3' };
      case 'Hook': return { channels: hookChannels, setChannels: setHookChannels, sectionKey: 'hook' };
      default: return { channels: verse1Channels, setChannels: setVerse1Channels, sectionKey: 'verse1' };
    }
  };

  const handleArm = (section, channelId) => {
    const key = `${section}-${channelId}`;
    const newArmed = armedChannel === key ? null : key;
    setArmedChannel(newArmed);

    // Enable/disable direct monitoring based on arm state AND monitoring toggle
    if (monitoringGainRef?.current && audioContextRef?.current) {
      if (newArmed && monitoringEnabled) {
        // Arm + monitoring ON: enable monitoring so user can hear themselves
        audioContextRef?.current?.resume();
        monitoringGainRef?.current?.gain?.setTargetAtTime(0.85, audioContextRef?.current?.currentTime || 0, 0.02);
      } else {
        // Disarm OR monitoring OFF: mute monitoring
        monitoringGainRef?.current?.gain?.setTargetAtTime(0, audioContextRef?.current?.currentTime || 0, 0.02);
      }
    }
  };

  const handleTransportPlay = async () => {
    if (!beatInfo) return;
    if (isBeatPlaying) {
      // Pause: stop beat and all vocal players
      setIsBeatPlaying(false);
      beatImporterRef?.current?.pause();
      Object.values(audioPlayersRef?.current)?.forEach(a => { if (a && !a?.paused) { try { a?.pause(); } catch(e) {} } });
      setVerse1Channels(prev => prev?.map(c => ({ ...c, isPlaying: false })));
      setVerse2Channels(prev => prev?.map(c => ({ ...c, isPlaying: false })));
      setVerse3Channels(prev => prev?.map(c => ({ ...c, isPlaying: false })));
      setHookChannels(prev => prev?.map(c => ({ ...c, isPlaying: false })));
      return;
    }

    const allSections = [
      { label: 'Verse 1', key: 'verse1', channels: verse1Channels, setChannels: setVerse1Channels },
      { label: 'Verse 2', key: 'verse2', channels: verse2Channels, setChannels: setVerse2Channels },
      { label: 'Verse 3', key: 'verse3', channels: verse3Channels, setChannels: setVerse3Channels },
      { label: 'Hook', key: 'hook', channels: hookChannels, setChannels: setHookChannels },
    ];

    // Stop any currently playing audio first
    Object.entries(audioPlayersRef?.current)?.forEach(([k, a]) => { if (a) { try { a?.pause(); a.currentTime = 0; } catch(e) {} } });
    setVerse1Channels(prev => prev?.map(c => ({ ...c, isPlaying: false })));
    setVerse2Channels(prev => prev?.map(c => ({ ...c, isPlaying: false })));
    setVerse3Channels(prev => prev?.map(c => ({ ...c, isPlaying: false })));
    setHookChannels(prev => prev?.map(c => ({ ...c, isPlaying: false })));

    // Collect ALL recorded, non-muted channels across ALL sections
    const channelsToPlay = [];
    for (const sec of allSections) {
      for (let ch of sec?.channels) {
        if (ch?.recorded && !ch?.muted && ch?.filePath) {
          channelsToPlay?.push({ channel: ch, section: sec });
        }
      }
    }

    if (channelsToPlay?.length === 0) {
      // No recorded vocals — just play the beat
      playStartWallRef.current = Date.now();
      playStartTimeRef.current = 0;
      beatImporterRef?.current?.seekTo(0);
      setCurrentTime(0);
      setIsBeatPlaying(true);
      return;
    }

    // Fetch signed URLs and build audio players for all channels
    const audioSetups = await Promise.all(
      channelsToPlay?.map(async ({ channel, section }) => {
        try {
          const { data, error } = await supabase?.storage?.from('audio-recordings')?.createSignedUrl(channel?.filePath, 3600);
          if (error || !data?.signedUrl) { console.error('Signed URL error for', channel?.filePath, error); return null; }
          return { channel, section, url: data?.signedUrl };
        } catch (e) { console.error('Signed URL exception:', e); return null; }
      })
    );

    const validSetups = audioSetups?.filter(Boolean);

    if (validSetups?.length === 0) {
      // URL fetch failed — just play beat
      playStartWallRef.current = Date.now();
      playStartTimeRef.current = 0;
      beatImporterRef?.current?.seekTo(0);
      setCurrentTime(0);
      setIsBeatPlaying(true);
      return;
    }

    // Build audio elements with effects chain for each vocal
    const audioElements = [];
    for (const setup of validSetups) {
      const { channel, section, url } = setup;
      const audio = new Audio(url);
      audio.crossOrigin = 'anonymous';
      audio.volume = channel?.volume ?? 1.0;
      const playerKey = `${section?.label}-${channel?.id}`;

      if (audioContextRef?.current && !connectedAudioElementsRef?.current?.has(audio)) {
        try {
          const ctx = audioContextRef?.current;
          if (ctx?.state === 'suspended') await ctx?.resume();
          connectedAudioElementsRef?.current?.add(audio);
          const source = ctx?.createMediaElementSource(audio);
          let currentNode = source;

          if (autotuneEnabled) {
            const speedNorm = retuneSpeed / 100;
            const highpass = ctx?.createBiquadFilter();
            highpass.type = 'highpass';
            highpass.frequency.value = 80;
            const presence = ctx?.createBiquadFilter();
            presence.type = 'peaking';
            presence.frequency.value = 3000 + speedNorm * 2000;
            presence.gain.value = 3 + speedNorm * 4;
            presence.Q.value = 1.5;
            const air = ctx?.createBiquadFilter();
            air.type = 'highshelf';
            air.frequency.value = 8000;
            air.gain.value = speedNorm * 5;
            const waveshaper = ctx?.createWaveShaper();
            const curve = new Float32Array(256);
            const amount = 20 + speedNorm * 200;
            for (let i = 0; i < 256; i++) {
              const x = (i * 2) / 256 - 1;
              curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
            }
            waveshaper.curve = curve;
            waveshaper.oversample = '4x';
            currentNode?.connect(highpass);
            highpass?.connect(presence);
            presence?.connect(air);
            air?.connect(waveshaper);
            currentNode = waveshaper;
          }

          const volGain = ctx?.createGain();
          volGain.gain.value = channel?.volume ?? 1.0;
          currentNode?.connect(volGain);
          currentNode = volGain;

          const pan = channel?.pan ?? 0;
          if (pan !== 0) {
            const panner = ctx?.createStereoPanner();
            panner.pan.value = pan;
            currentNode?.connect(panner);
            currentNode = panner;
          }

          const outputGain = ctx?.createGain();
          outputGain.gain.value = autotuneEnabled ? 0.9 : 1.0;
          currentNode?.connect(outputGain);
          outputGain?.connect(ctx?.destination);
        } catch (e) {
          console.warn('Effects chain failed for', playerKey, e);
          // Connect directly to destination as fallback
          try {
            const ctx = audioContextRef?.current;
            const source = ctx?.createMediaElementSource(audio);
            source?.connect(ctx?.destination);
          } catch (e2) {}
        }
      }

      audioPlayersRef.current[playerKey] = audio;
      audioElements?.push({ audio, channel, section, playerKey });
    }

    // Track how many vocals are still playing; stop beat when all done
    let playingCount = audioElements?.length;
    const onVocalEnd = (section, channelId) => {
      section?.setChannels(prev => prev?.map(c => c?.id === channelId ? { ...c, isPlaying: false } : c));
      playingCount--;
      if (playingCount <= 0) {
        setIsBeatPlaying(false);
        beatImporterRef?.current?.pause();
      }
    };

    for (const { audio, channel, section, playerKey } of audioElements) {
      audio.onended = () => onVocalEnd(section, channel?.id);
      audio.onerror = (e) => {
        console.error('Vocal playback error:', e);
        onVocalEnd(section, channel?.id);
      };
    }

    // Seek beat to beginning
    beatImporterRef?.current?.seekTo(0);
    setCurrentTime(0);
    playStartWallRef.current = Date.now();
    playStartTimeRef.current = 0;

    // Start all vocals simultaneously with the beat
    try {
      await Promise.all(audioElements?.map(({ audio }) => audio?.play()));
      // Mark all as playing
      for (const { channel, section } of audioElements) {
        section?.setChannels(prev => prev?.map(c => c?.id === channel?.id ? { ...c, isPlaying: true } : c));
      }
      setIsBeatPlaying(true);
    } catch (err) {
      console.error('Transport play error:', err);
      beatImporterRef?.current?.seekTo(0);
      setCurrentTime(0);
      setIsBeatPlaying(true);
    }
  };

  const handleTransportStop = async () => {
    if (isRecording) {
      if (armedChannel) {
        const dashIdx = armedChannel?.indexOf('-');
        const section = armedChannel?.substring(0, dashIdx);
        const channelId = armedChannel?.substring(dashIdx + 1);
        stopRecording(section, channelId);
      } else {
        setIsRecording(false);
      }
      setIsBeatPlaying(false);
      beatImporterRef?.current?.stop();
      setCurrentTime(0);
      setSeekTime(0);
      return;
    }

    if (!armedChannel) {
      setRecordingError('Please arm a channel first by clicking the red circle (●) button next to Lead, Double, Adlib, or Extra.');
      return;
    }
    if (!beatInfo) {
      setRecordingError('Please import a beat before recording.');
      return;
    }

    if (!mediaStreamRef?.current || !mediaStreamRef?.current?.active || !deviceInitializedRef?.current) {
      const initialized = await initializeAudioContext(true);
      if (!initialized) return;
    }
    const audioTracks = mediaStreamRef?.current?.getAudioTracks();
    if (!audioTracks?.length || audioTracks?.[0]?.readyState !== 'live') {
      setRecordingError('Microphone not active. Please check your device.');
      return;
    }

    const dashIdx = armedChannel?.indexOf('-');
    const section = armedChannel?.substring(0, dashIdx);
    const channelId = armedChannel?.substring(dashIdx + 1);

    let startPos = currentTime;
    if (isPunchInEnabled && punchInPoint != null) {
      startPos = punchInPoint;
      setCurrentTime(punchInPoint);
      setSeekTime(punchInPoint);
    }

    playStartWallRef.current = Date.now();
    playStartTimeRef.current = startPos;
    setIsBeatPlaying(true);
    await startRecording(section, channelId, startPos);
  };

  const handleTransportRewind = () => {
    if (isRecording) return;
    setCurrentTime(0);
    setSeekTime(0);
    playStartTimeRef.current = 0;
    if (isBeatPlaying) playStartWallRef.current = Date.now();
  };

  const handleTransportFastForward = () => {
    if (isRecording) return;
    const maxDur = beatInfo?.durationInSeconds || 180;
    const newTime = Math.min(currentTime + 10, maxDur);
    setCurrentTime(newTime);
    setSeekTime(newTime);
    if (isBeatPlaying) {
      playStartWallRef.current = Date.now();
      playStartTimeRef.current = newTime;
    }
  };

  const handleSeek = (time) => {
    if (isRecording) return;
    // Apply grid snap if enabled
    let snappedTime = time;
    if (snapEnabled && beatInfo?.bpm) {
      const beatDuration = 60 / beatInfo?.bpm;
      const snapInterval = beatDuration * gridSize;
      snappedTime = Math.round(time / snapInterval) * snapInterval;
    }
    setCurrentTime(snappedTime);
    setSeekTime(snappedTime);
    if (isBeatPlaying) {
      playStartWallRef.current = Date.now();
      playStartTimeRef.current = snappedTime;
    }
  };

  const handleTransportRecord = async () => {
    if (isRecording) {
      if (armedChannel) {
        const dashIdx = armedChannel?.indexOf('-');
        const section = armedChannel?.substring(0, dashIdx);
        const channelId = armedChannel?.substring(dashIdx + 1);
        stopRecording(section, channelId);
      } else {
        setIsRecording(false);
      }
      setIsBeatPlaying(false);
      beatImporterRef?.current?.stop();
      setCurrentTime(0);
      setSeekTime(0);
      return;
    }

    if (!armedChannel) {
      setRecordingError('Please arm a channel first by clicking the red circle (●) button next to Lead, Double, Adlib, or Extra.');
      return;
    }
    if (!beatInfo) {
      setRecordingError('Please import a beat before recording.');
      return;
    }

    if (!mediaStreamRef?.current || !mediaStreamRef?.current?.active || !deviceInitializedRef?.current) {
      const initialized = await initializeAudioContext(true);
      if (!initialized) return;
    }
    const audioTracks = mediaStreamRef?.current?.getAudioTracks();
    if (!audioTracks?.length || audioTracks?.[0]?.readyState !== 'live') {
      setRecordingError('Microphone not active. Please check your device.');
      return;
    }

    const dashIdx = armedChannel?.indexOf('-');
    const section = armedChannel?.substring(0, dashIdx);
    const channelId = armedChannel?.substring(dashIdx + 1);

    let startPos = currentTime;
    if (isPunchInEnabled && punchInPoint != null) {
      startPos = punchInPoint;
      setCurrentTime(punchInPoint);
      setSeekTime(punchInPoint);
    }

    playStartWallRef.current = Date.now();
    playStartTimeRef.current = startPos;
    setIsBeatPlaying(true);
    await startRecording(section, channelId, startPos);
  };

  const startRecording = async (section, channelId, startTime = 0) => {
    try {
      setRecordingError(null);
      const { channels, setChannels } = getChannelState(section);
      // Push undo state before recording
      pushUndo({ verse1: verse1Channels, verse2: verse2Channels, verse3: verse3Channels, hook: hookChannels, recordedWaveforms, takes });
      recordedChunksRef.current = [];

      // Apply latency compensation: only manual fader offset (auto BT removed from monitoring path)
      // This shifts the recording start time so vocals align with the beat
      const totalCompMs = manualLatencyMs + (latencyCompensationMsRef?.current || 0);
      const compensationSec = totalCompMs / 1000;
      recordingStartTimeRef.current = startTime + compensationSec;

      // Monitoring during recording: only if monitoring toggle is ON
      if (monitoringGainRef?.current && audioContextRef?.current) {
        const shouldMonitor = monitoringEnabled;
        monitoringGainRef?.current?.gain?.setTargetAtTime(
          shouldMonitor ? 0.85 : 0,
          audioContextRef?.current?.currentTime || 0,
          0.01
        );
      }

      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      let selectedMimeType = null;
      for (const mt of mimeTypes) { if (MediaRecorder.isTypeSupported(mt)) { selectedMimeType = mt; break; } }
      if (!selectedMimeType) throw new Error('No supported audio format');

      // Build autotune chain — use processed stream if autotune enabled
      const streamToRecord = autotuneEnabled
        ? await buildAutotuneChain(mediaStreamRef?.current)
        : mediaStreamRef?.current;

      // Use smallest timeslice (10ms) for minimal buffering latency
      mediaRecorderRef.current = new MediaRecorder(streamToRecord, { mimeType: selectedMimeType, audioBitsPerSecond: 128000 });
      mediaRecorderRef.current.ondataavailable = (event) => { if (event?.data?.size > 0) recordedChunksRef?.current?.push(event?.data); };
      mediaRecorderRef.current.onerror = (event) => {
        const msg = event?.error?.message || 'Recording error';
        setRecordingError(`Recording failed: ${msg}`);
        stopRecording(section, channelId);
      };
      mediaRecorderRef?.current?.start(10); // 10ms timeslice for near-zero buffering latency
      setChannels(channels?.map(c => c?.id === channelId ? { ...c, isRecording: true } : { ...c, isRecording: false }));
      setIsRecording(true);
    } catch (error) {
      setRecordingError(`Failed to start recording: ${error?.message}`);
      setIsRecording(false);
    }
  };

  const stopRecording = async (section, channelId) => {
    if (!mediaRecorderRef?.current) return;
    // Keep monitoring on if channel is still armed after recording stops
    if (monitoringGainRef?.current && audioContextRef?.current) {
      const stillArmed = armedChannel === `${section}-${channelId}`;
      const targetGain = stillArmed ? 0.85 : 0;
      monitoringGainRef?.current?.gain?.setTargetAtTime(targetGain, audioContextRef?.current?.currentTime || 0, 0.02);
    }
    const { setChannels, sectionKey } = getChannelState(section);
    const recStartTime = recordingStartTimeRef?.current || 0;
    try {
      if (mediaRecorderRef?.current?.state !== 'inactive') mediaRecorderRef?.current?.stop();
      mediaRecorderRef.current.onstop = async () => {
        try {
          if (!recordedChunksRef?.current?.length) throw new Error('No audio data recorded');
          const newBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
          if (!newBlob?.size) throw new Error('Recorded audio is empty');
          let finalBlob = newBlob;
          let totalDuration = newBlob?.size / (128000 / 8);

          const existingBuffer = audioBuffersRef?.current?.[`${sectionKey}-${channelId}`];
          if (existingBuffer && audioContextRef?.current) {
            try {
              const newArrayBuffer = await newBlob?.arrayBuffer();
              const newAudioBuffer = await audioContextRef?.current?.decodeAudioData(newArrayBuffer);
              const totalLength = existingBuffer?.length + newAudioBuffer?.length;
              const mergedBuffer = audioContextRef?.current?.createBuffer(newAudioBuffer?.numberOfChannels, totalLength, newAudioBuffer?.sampleRate);
              for (let ch = 0; ch < mergedBuffer?.numberOfChannels; ch++) {
                const merged = mergedBuffer?.getChannelData(ch);
                merged?.set(existingBuffer?.getChannelData(ch), 0);
                merged?.set(newAudioBuffer?.getChannelData(ch), existingBuffer?.length);
              }
              const offlineCtx = new OfflineAudioContext(mergedBuffer.numberOfChannels, mergedBuffer.length, mergedBuffer.sampleRate);
              const src = offlineCtx?.createBufferSource();
              src.buffer = mergedBuffer;
              src?.connect(offlineCtx?.destination);
              src?.start();
              const rendered = await offlineCtx?.startRendering();
              finalBlob = await audioBufferToWav(rendered);
              totalDuration = mergedBuffer?.duration;
              delete audioBuffersRef?.current?.[`${sectionKey}-${channelId}`];
            } catch (e) { console.error('Merge error:', e); }
          }

          let actualDuration = totalDuration;
          try {
            const ab = await finalBlob?.arrayBuffer();
            const decoded = await audioContextRef?.current?.decodeAudioData(ab);
            actualDuration = decoded?.duration;
            // Extract waveform — decoded channel data is float -1 to 1
            const rawData = decoded?.getChannelData(0);
            const samples = 100;
            const blockSize = Math.max(Math.floor(rawData?.length / samples), 1);
            const wfData = [];
            for (let i = 0; i < samples; i++) {
              let sum = 0;
              for (let j = 0; j < blockSize; j++) {
                sum += Math.abs(rawData?.[i * blockSize + j] || 0);
              }
              wfData?.push(sum / blockSize); // 0-1 float range
            }
            // Normalize
            const maxVal = Math.max(...wfData, 0.001);
            const normalizedWf = wfData?.map(v => v / maxVal);
            setRecordedWaveforms(prev => ({
              ...prev,
              [`${sectionKey}-${channelId}`]: { data: normalizedWf, startTime: recStartTime, endTime: recStartTime + actualDuration },
            }));
          } catch (e) { console.error('Decode error:', e); }

          // Upload recording
          const fileName = `${user?.id}/${Date.now()}-${sectionKey}-${channelId}.webm`;
          const { data: uploadData, error: uploadError } = await supabase?.storage
            ?.from('audio-recordings')
            ?.upload(fileName, finalBlob, { contentType: 'audio/webm', upsert: true });

          if (uploadError) throw uploadError;

          const filePath = uploadData?.path || fileName;
          const mins = Math.floor(actualDuration / 60);
          const secs = Math.floor(actualDuration % 60);
          const durationStr = `${mins}:${secs?.toString()?.padStart(2, '0')}`;

          // Use functional updater to avoid stale closure
          setChannels(prev => prev?.map(c => c?.id === channelId ? {
            ...c,
            recorded: true,
            isRecording: false,
            duration: durationStr,
            filePath: filePath,
          } : c));

          // Add take
          addTake(sectionKey, channelId, { duration: durationStr, filePath });

          setIsRecording(false);
          recordingStartTimeRef.current = null;
          recordedChunksRef.current = [];
          setRecordingError(null);
          // NOTE: Do NOT auto-navigate — let user press play to hear their recording
        } catch (error) {
          setRecordingError('Failed to save recording');
          setChannels(prev => prev?.map(c => c?.id === channelId ? { ...c, isRecording: false } : c));
          setIsRecording(false);
          recordedChunksRef.current = [];
        }
      };
    } catch (error) {
      setRecordingError('Failed to stop recording properly.');
      setIsRecording(false);
    }
  };

  const handleRecord = async (section, channelId) => {
    const { channels } = getChannelState(section);
    const channel = channels?.find(c => c?.id === channelId);
    if (channel?.isRecording) {
      stopRecording(section, channelId);
      setIsBeatPlaying(false);
      beatImporterRef?.current?.stop();
      setCurrentTime(0);
      setSeekTime(0);
    }
  };

  const handlePlayback = async (section, channelId) => {
    const { channels, setChannels } = getChannelState(section);
    const channel = channels?.find(c => c?.id === channelId);
    if (!channel) return;
    const playerKey = `${section}-${channelId}`;

    // Stop all currently playing vocals
    ['Verse 1','Verse 2','Verse 3','Hook']?.forEach(sec => {
      const { channels: sc, setChannels: ssc } = getChannelState(sec);
      ssc(sc?.map(c => ({ ...c, isPlaying: false })));
    });
    Object.entries(audioPlayersRef?.current)?.forEach(([k, a]) => { if (a) { a?.pause(); a.currentTime = 0; } });

    if (channel?.isPlaying) {
      // Also stop beat
      if (isBeatPlaying) {
        setIsBeatPlaying(false);
        beatImporterRef?.current?.pause();
      }
      return;
    }
    if (!channel?.filePath) return;
    try {
      const { data, error } = await supabase?.storage?.from('audio-recordings')?.createSignedUrl(channel?.filePath, 3600);
      if (error || !data?.signedUrl) return;

      const audio = new Audio(data.signedUrl);

      // Apply autotune effect on playback via Web Audio API if enabled
      if (autotuneEnabled && audioContextRef?.current) {
        try {
          const ctx = audioContextRef?.current;
          if (ctx?.state === 'suspended') await ctx?.resume();
          const source = ctx?.createMediaElementSource(audio);
          const speedNorm = retuneSpeed / 100;

          const highpass = ctx?.createBiquadFilter();
          highpass.type = 'highpass';
          highpass.frequency.value = 80;

          const presence = ctx?.createBiquadFilter();
          presence.type = 'peaking';
          presence.frequency.value = 3000 + speedNorm * 2000;
          presence.gain.value = 3 + speedNorm * 4;
          presence.Q.value = 1.5;

          const air = ctx?.createBiquadFilter();
          air.type = 'highshelf';
          air.frequency.value = 8000;
          air.gain.value = speedNorm * 5;

          const waveshaper = ctx?.createWaveShaper();
          const curve = new Float32Array(256);
          const amount = 20 + speedNorm * 200;
          for (let i = 0; i < 256; i++) {
            const x = (i * 2) / 256 - 1;
            curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
          }
          waveshaper.curve = curve;
          waveshaper.oversample = '4x';
          const outputGain = ctx?.createGain();
          outputGain.gain.value = 0.9;

          source?.connect(highpass);
          highpass?.connect(presence);
          presence?.connect(air);
          air?.connect(waveshaper);
          waveshaper?.connect(outputGain);
          outputGain?.connect(ctx?.destination);
        } catch (e) {
          console.warn('Autotune playback chain failed, using direct playback:', e);
        }
      }

      audioPlayersRef.current[playerKey] = audio;
      audio.onended = () => {
        setChannels(prev => prev?.map(c => c?.id === channelId ? { ...c, isPlaying: false } : c));
        // Stop beat when vocal ends
        setIsBeatPlaying(false);
        beatImporterRef?.current?.pause();
      };
      audio.onerror = () => {
        setChannels(prev => prev?.map(c => c?.id === channelId ? { ...c, isPlaying: false } : c));
        setIsBeatPlaying(false);
        beatImporterRef?.current?.pause();
      };

      // Start vocal playback
      await audio?.play();
      setChannels(prev => prev?.map(c => c?.id === channelId ? { ...c, isPlaying: true } : { ...c, isPlaying: false }));

      // Also start beat playback from beginning (or current position)
      if (beatInfo) {
        // Seek beat to start and play
        beatImporterRef?.current?.seekTo(0);
        setCurrentTime(0);
        playStartWallRef.current = Date.now();
        playStartTimeRef.current = 0;
        setIsBeatPlaying(true);
      }
    } catch (err) { console.error('Playback error:', err); }
  };

  // Add this block - Take management functions
  const addTake = (sectionKey, channelId, takeData) => {
    const key = `${sectionKey}-${channelId}`;
    setTakes(prev => ({
      ...prev,
      [key]: [...(prev?.[key] || []), { ...takeData, id: Date.now(), timestamp: new Date()?.toISOString() }]
    }));
  };

  const handleSelectTake = (channelKey, takeId) => {
    const takesArr = takes?.[channelKey] || [];
    const selectedTake = takesArr?.find(t => t?.id === takeId);
    if (!selectedTake) return;
    
    // Parse channelKey to get section and channelId
    const [sectionKey, channelId] = channelKey?.split('-');
    const sectionMap = {
      'verse1': 'Verse 1',
      'verse2': 'Verse 2',
      'verse3': 'Verse 3',
      'hook': 'Hook'
    };
    const section = sectionMap?.[sectionKey];
    
    if (section) {
      const { channels, setChannels } = getChannelState(section);
      setChannels(channels?.map(c => 
        c?.id === channelId 
          ? { ...c, filePath: selectedTake?.filePath, duration: selectedTake?.duration }
          : c
      ));
    }
  };

  const handleDeleteTake = async (channelKey, takeId) => {
    const takesArr = takes?.[channelKey] || [];
    const takeToDelete = takesArr?.find(t => t?.id === takeId);
    
    if (takeToDelete?.filePath && user) {
      await supabase?.storage?.from('audio-recordings')?.remove([takeToDelete?.filePath]);
    }
    
    setTakes(prev => ({
      ...prev,
      [channelKey]: prev?.[channelKey]?.filter(t => t?.id !== takeId)
    }));
  };

  const handleRenameTake = (channelKey, takeId, newName) => {
    setTakes(prev => ({
      ...prev,
      [channelKey]: prev?.[channelKey]?.map(t => 
        t?.id === takeId ? { ...t, name: newName } : t
      )
    }));
  };
  // End of added block

  const handleDelete = async (section, channelId) => {
    const { channels, setChannels, sectionKey } = getChannelState(section);
    const channel = channels?.find(c => c?.id === channelId);
    pushUndo({ verse1: verse1Channels, verse2: verse2Channels, verse3: verse3Channels, hook: hookChannels, recordedWaveforms, takes });
    if (channel?.filePath && user) await supabase?.storage?.from('audio-recordings')?.remove([channel?.filePath]);
    setChannels(channels?.map(c => c?.id === channelId ? { ...c, recorded: false, isPlaying: false, duration: null, filePath: null } : c));
    setRecordedWaveforms(prev => { const next = { ...prev }; delete next?.[`${sectionKey}-${channelId}`]; return next; });
  };

  const handleSaveSession = async () => {
    if (!user) { alert('Please sign in to save sessions'); navigate('/sign-in'); return; }
    setShowSaveDialog(true);
  };

  const confirmSaveSession = async () => {
    setSaving(true);
    try {
      const sessionData = { verse1: verse1Channels, verse2: verse2Channels, verse3: verse3Channels, hook: hookChannels, beatInfo, selectedPreset, autotuneEnabled, retuneSpeed };
      if (currentSessionId) {
        const { error } = await supabase?.from('audio_sessions')?.update({ title: sessionTitle, preset: selectedPreset, autotune_enabled: autotuneEnabled, retune_speed: retuneSpeed, beat_file_path: beatInfo?.filePath, beat_duration: beatInfo?.duration, beat_bpm: beatInfo?.bpm, session_data: sessionData, status: 'in_progress' })?.eq('id', currentSessionId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase?.from('audio_sessions')?.insert([{ user_id: user?.id, title: sessionTitle, preset: selectedPreset, autotune_enabled: autotuneEnabled, retune_speed: retuneSpeed, beat_file_path: beatInfo?.filePath, beat_duration: beatInfo?.duration, beat_bpm: beatInfo?.bpm, session_data: sessionData, status: 'in_progress' }])?.select()?.single();
        if (error) throw error;
        setCurrentSessionId(data?.id);
      }
      alert('Session saved successfully!');
      setShowSaveDialog(false);
    } catch (error) { alert('Failed to save session'); }
    finally { setSaving(false); }
  };

  const handleProceedToMix = () => {
    const allChannels = [...verse1Channels, ...verse2Channels, ...verse3Channels, ...hookChannels];
    if (!beatInfo) { alert('Please import a beat before proceeding to mix.'); return; }
    if (!allChannels?.some(c => c?.recorded)) { alert('Please record at least one vocal channel before proceeding to mix.'); return; }
    navigate('/fine-tune-mix-page');
  };

  const handleBounce = async (format, quality) => {
    try {
      console.log('Bouncing audio with format:', format, 'quality:', quality);
      // Placeholder for bounce logic
      alert('Bounce functionality will process and export your audio');
    } catch (error) {
      console.error('Bounce error:', error);
      alert('Failed to bounce audio');
    }
  };

  const handleBeatImport = (beatData) => {
    if (!beatData && isBeatPlaying) setIsBeatPlaying(false);
    setBeatInfo(beatData);
    setCurrentTime(0);
    setSeekTime(0);
  };

  const handleBeatTimeUpdate = useCallback((time) => {
    if (isBeatPlaying && !isRecording) {
      setCurrentTime(time);
      playStartWallRef.current = Date.now();
      playStartTimeRef.current = time;
    }
  }, [isBeatPlaying, isRecording]);

  const allChannelsFlat = [...verse1Channels, ...verse2Channels, ...verse3Channels, ...hookChannels];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-foreground">
          <Icon name="Loader" size={24} className="animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Recording Studio - makingitmixstudio</title>
        <meta name="description" content="Professional audio recording studio with Pro Tools-style transport and waveform visualization" />
      </Helmet>
      <Header />
      {showTutorial && <TutorialOverlay onComplete={handleTutorialComplete} />}
      <div className="min-h-screen bg-background pt-[60px]">
        <div className="container-studio py-4 lg:py-6">

          {/* Page header */}
          <div className="mb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h1 className="text-h2 font-heading mb-0.5">Recording Studio</h1>
                <p className="text-muted-foreground text-xs">Pro Tools-style DAW workflow</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <AutoSaveIndicator
                  sessionData={autoSaveData}
                  sessionId={currentSessionId}
                  onAutoSave={handleAutoSave}
                />
                <button
                  onClick={() => setShowTutorial(true)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded border border-gray-700 bg-gray-800 text-xs font-mono text-gray-400 hover:text-white hover:border-gray-600 transition-all"
                  title="Open Tutorial"
                >
                  <Icon name="HelpCircle" size={13} />
                  <span className="hidden sm:inline">Tutorial</span>
                </button>
                <Button variant="outline" size="sm" onClick={handleSaveSession} iconName="Save" iconPosition="left" disabled={saving} className="hidden sm:flex">
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="default" onClick={handleProceedToMix} iconName="ArrowRight" iconPosition="right" className="hidden sm:flex bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2.5 text-base shadow-lg shadow-purple-900/40 border-2 border-purple-400/30">
                  🎚️ Mix
                </Button>
              </div>
            </div>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="mb-3 flex items-center gap-3 px-3 py-1.5 bg-gray-900/50 border border-gray-700/50 rounded-lg overflow-x-auto">
            <Icon name="Keyboard" size={12} color="#6b7280" className="flex-shrink-0" />
            {[
              ['Space', 'Play/Pause'],
              ['R', 'Record'],
              ['M', 'Mute'],
              ['S', 'Solo'],
              ['Ctrl+Z', 'Undo'],
              ['Ctrl+S', 'Save'],
            ]?.map(([key, label]) => (
              <div key={key} className="flex items-center gap-1 flex-shrink-0">
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-gray-800 border border-gray-600 rounded text-gray-300">{key}</kbd>
                <span className="text-[9px] font-mono text-gray-600">{label}</span>
              </div>
            ))}
          </div>

          {/* Transport */}
          <div className="mb-3">
            <ProToolsTransport
              isPlaying={isBeatPlaying}
              isRecording={isRecording}
              isPunchInEnabled={isPunchInEnabled}
              isLoopEnabled={isLoopEnabled}
              isMetronomeEnabled={metronomeEnabled}
              currentTime={currentTime}
              beatDuration={beatInfo?.durationInSeconds || 0}
              bpm={beatInfo?.bpm || 120}
              onPlay={handleTransportPlay}
              onStop={handleTransportStop}
              onRecord={handleTransportRecord}
              onRewind={handleTransportRewind}
              onFastForward={handleTransportFastForward}
              onTogglePunchIn={() => setIsPunchInEnabled(p => !p)}
              onToggleLoop={() => setIsLoopEnabled(p => !p)}
              onToggleMetronome={() => setMetronomeEnabled(p => !p)}
              disabled={!beatInfo}
              activeChannel={armedChannel}
            />
          </div>

          {/* Waveform Zoom + Latency row */}
          <div className="mb-3 flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <WaveformZoom
                zoom={waveformZoom}
                onZoomChange={setWaveformZoom}
                snapEnabled={snapEnabled}
                onSnapToggle={() => setSnapEnabled(p => !p)}
                gridSize={gridSize}
                onGridSizeChange={setGridSize}
              />
            </div>
            <LatencyDisplay
              audioContext={audioContextRef?.current}
              isRecording={isRecording}
              isBluetoothDevice={isBluetoothDeviceRef?.current}
              compensationMs={manualLatencyMs}
            />
          </div>

          {/* Manual Latency Compensation Fader */}
          <div className="mb-3">
            <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowLatencyFader(p => !p)}
                    className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-gray-400 hover:text-white transition-colors"
                  >
                    <span className="text-blue-400">⏱</span>
                    <span>Latency Compensation</span>
                    <span className="text-gray-600">{showLatencyFader ? '▲' : '▼'}</span>
                  </button>
                  {isBluetoothDeviceRef?.current && (
                    <span className="text-[9px] font-mono bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded">BT</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Color-coded visual feedback for current offset level */}
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background: manualLatencyMs === 0 ? '#1f2937' : manualLatencyMs <= 50 ? '#14532d' : manualLatencyMs <= 200 ? '#1e3a5f' : '#7c2d12',
                      color: manualLatencyMs === 0 ? '#6b7280' : manualLatencyMs <= 50 ? '#4ade80' : manualLatencyMs <= 200 ? '#60a5fa' : '#fb923c',
                    }}
                  >
                    {manualLatencyMs === 0 ? 'OFF' : manualLatencyMs <= 50 ? 'WIRED' : manualLatencyMs <= 200 ? 'BT' : 'MAX'}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-white">{manualLatencyMs}<span className="text-gray-500 text-[9px] ml-0.5">ms</span></span>
                  <button
                    onClick={() => setManualLatencyMs(0)}
                    className="text-[9px] font-mono text-gray-500 hover:text-red-400 transition-colors px-1.5 py-0.5 border border-gray-700 hover:border-red-700 rounded"
                  >RESET</button>
                </div>
              </div>
              {showLatencyFader && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-gray-600 w-6">0</span>
                    <input
                      type="range"
                      min={0}
                      max={500}
                      step={1}
                      value={manualLatencyMs}
                      onChange={e => setManualLatencyMs(Number(e?.target?.value))}
                      className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${
                          manualLatencyMs <= 50 ? '#22c55e' : manualLatencyMs <= 200 ? '#3b82f6' : '#f97316'
                        } 0%, ${
                          manualLatencyMs <= 50 ? '#22c55e' : manualLatencyMs <= 200 ? '#3b82f6' : '#f97316'
                        } ${(manualLatencyMs / 500) * 100}%, #374151 ${(manualLatencyMs / 500) * 100}%, #374151 100%)`
                      }}
                    />
                    <span className="text-[9px] font-mono text-gray-600 w-8">500ms</span>
                  </div>
                  {/* Zone labels */}
                  <div className="relative px-6">
                    <div className="flex h-1 rounded overflow-hidden">
                      <div className="bg-green-700/40" style={{ width: '10%' }} />
                      <div className="bg-blue-700/40" style={{ width: '30%' }} />
                      <div className="bg-orange-700/40" style={{ width: '60%' }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-[8px] font-mono px-6">
                    <span className="text-green-500">Wired (0–50ms)</span>
                    <span className="text-blue-400">Bluetooth (100–200ms)</span>
                    <span className="text-orange-400">Max</span>
                  </div>
                  {isBluetoothDeviceRef?.current && (
                    <div className="flex items-center gap-1.5 mt-0.5 px-1 py-1 bg-blue-900/20 border border-blue-700/30 rounded">
                      <span className="text-[9px] font-mono text-blue-400">💡 BT device detected — recommended range: 100–200ms</span>
                      <button
                        onClick={() => setManualLatencyMs(150)}
                        className="ml-auto text-[8px] font-mono text-blue-300 hover:text-blue-100 border border-blue-700 hover:border-blue-500 px-1.5 py-0.5 rounded transition-colors"
                      >SET 150ms</button>
                    </div>
                  )}
                  {!isBluetoothDeviceRef?.current && (
                    <div className="flex items-center gap-1.5 mt-0.5 px-1 py-1 bg-gray-800/50 border border-gray-700/30 rounded">
                      <span className="text-[9px] font-mono text-gray-500">Wired mic detected — recommended: 0–50ms. Adjust if vocals feel early/late.</span>
                    </div>
                  )}
                  <p className="text-[9px] font-mono text-gray-500 mt-0.5">
                    Offsets recording start time to align vocals with the beat. Saved automatically between sessions.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-3">
            <ProToolsTimeline
              beatDuration={beatInfo?.durationInSeconds || 180}
              currentTime={currentTime}
              isPlaying={isBeatPlaying}
              isRecording={isRecording}
              audioStream={isRecording ? mediaStreamRef?.current : null}
              bpm={beatInfo?.bpm || 120}
              punchInPoint={punchInPoint}
              punchOutPoint={punchOutPoint}
              isPunchInEnabled={isPunchInEnabled}
              isLoopEnabled={isLoopEnabled}
              onSeek={handleSeek}
              onSetPunchIn={setPunchInPoint}
              onSetPunchOut={setPunchOutPoint}
              activeChannel={armedChannel}
              recordedWaveforms={recordedWaveforms}
            />
          </div>

          {/* Time Markers */}
          <div className="mb-4">
            <TimeMarkers
              currentTime={currentTime}
              duration={beatInfo?.durationInSeconds || 180}
              onSeek={handleSeek}
              markers={timeMarkers}
              onMarkersChange={setTimeMarkers}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Left/Main column */}
            <div className="lg:col-span-2 space-y-4">
              <BeatImporter
                ref={beatImporterRef}
                onBeatImport={handleBeatImport}
                beatInfo={beatInfo}
                isPlaying={isBeatPlaying}
                onPlayPause={handleTransportPlay}
                onAudioReady={handleAudioReady}
                onTimeUpdate={handleBeatTimeUpdate}
                seekTime={seekTime}
              />

              {/* Punch-in banner */}
              {isPunchInEnabled && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-900/20 border border-orange-500/40">
                  <Icon name="Crosshair" size={16} color="#f97316" />
                  <div className="flex-1">
                    <p className="text-sm text-orange-300">
                      <strong>Punch-In Mode Active</strong> — Click SET IN / SET OUT on the timeline to mark your punch region.
                      {punchInPoint != null && <span className="ml-2 font-mono text-xs">IN: {Math.floor(punchInPoint / 60)}:{Math.floor(punchInPoint % 60)?.toString()?.padStart(2, '0')}</span>}
                      {punchOutPoint != null && <span className="ml-2 font-mono text-xs">OUT: {Math.floor(punchOutPoint / 60)}:{Math.floor(punchOutPoint % 60)?.toString()?.padStart(2, '0')}</span>}
                    </p>
                  </div>
                  <button onClick={() => { setPunchInPoint(null); setPunchOutPoint(null); }} className="text-xs text-orange-400 hover:text-orange-300">Clear</button>
                </div>
              )}

              {/* Loop banner */}
              {isLoopEnabled && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-900/20 border border-blue-500/40">
                  <Icon name="Repeat" size={16} color="#60a5fa" />
                  <p className="text-sm text-blue-300"><strong>Loop Mode Active</strong> — Beat will loop continuously during playback.</p>
                </div>
              )}

              {/* Arm instruction */}
              {!armedChannel && beatInfo && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <Icon name="Info" size={16} color="var(--color-accent)" />
                  <p className="text-sm text-accent/90"><strong>Arm a channel</strong> by clicking the red circle (●) next to Lead, Double, Adlib, or Extra — then press Record.</p>
                </div>
              )}

              {/* Mobile tabs */}
              <div className="lg:hidden">
                {activeTab === 'verse1' && <VocalChannel title="Verse 1" channels={verse1Channels} onRecord={handleRecord} onPlayback={handlePlayback} onDelete={handleDelete} onArm={handleArm} armedChannel={armedChannel} disabled={!beatInfo} />}
                {activeTab === 'verse2' && <VocalChannel title="Verse 2" channels={verse2Channels} onRecord={handleRecord} onPlayback={handlePlayback} onDelete={handleDelete} onArm={handleArm} armedChannel={armedChannel} disabled={!beatInfo} />}
                {activeTab === 'verse3' && <VocalChannel title="Verse 3" channels={verse3Channels} onRecord={handleRecord} onPlayback={handlePlayback} onDelete={handleDelete} onArm={handleArm} armedChannel={armedChannel} disabled={!beatInfo} />}
                {activeTab === 'hook' && <VocalChannel title="Hook" channels={hookChannels} onRecord={handleRecord} onPlayback={handlePlayback} onDelete={handleDelete} onArm={handleArm} armedChannel={armedChannel} disabled={!beatInfo} />}
              </div>

              {/* Vocal Channels */}
              <div className="space-y-3">
                <div className="lg:hidden">
                  {activeTab === 'verse1' && <VocalChannel title="Verse 1" channels={verse1Channels} onRecord={handleRecord} onPlayback={handlePlayback} onDelete={handleDelete} onArm={handleArm} armedChannel={armedChannel} disabled={!beatInfo} />}
                  {activeTab === 'verse2' && <VocalChannel title="Verse 2" channels={verse2Channels} onRecord={handleRecord} onPlayback={handlePlayback} onDelete={handleDelete} onArm={handleArm} armedChannel={armedChannel} disabled={!beatInfo} />}
                  {activeTab === 'verse3' && <VocalChannel title="Verse 3" channels={verse3Channels} onRecord={handleRecord} onPlayback={handlePlayback} onDelete={handleDelete} onArm={handleArm} armedChannel={armedChannel} disabled={!beatInfo} />}
                  {activeTab === 'hook' && <VocalChannel title="Hook" channels={hookChannels} onRecord={handleRecord} onPlayback={handlePlayback} onDelete={handleDelete} onArm={handleArm} armedChannel={armedChannel} disabled={!beatInfo} />}
                </div>
                <div className="hidden lg:block space-y-3">
                  <VocalChannel title="Verse 1" channels={verse1Channels} onRecord={handleRecord} onPlayback={handlePlayback} onDelete={handleDelete} onArm={handleArm} armedChannel={armedChannel} disabled={!beatInfo} />
                  <VocalChannel title="Verse 2" channels={verse2Channels} onRecord={handleRecord} onPlayback={handlePlayback} onDelete={handleDelete} onArm={handleArm} armedChannel={armedChannel} disabled={!beatInfo} />
                  <VocalChannel title="Verse 3" channels={verse3Channels} onRecord={handleRecord} onPlayback={handlePlayback} onDelete={handleDelete} onArm={handleArm} armedChannel={armedChannel} disabled={!beatInfo} />
                  <VocalChannel title="Hook" channels={hookChannels} onRecord={handleRecord} onPlayback={handlePlayback} onDelete={handleDelete} onArm={handleArm} armedChannel={armedChannel} disabled={!beatInfo} />
                </div>
              </div>

              {/* Track Mixer — always visible below channels */}
              <div className="space-y-3">
                <TrackMixer
                  channels={verse1Channels}
                  sectionTitle="Verse 1"
                  onChannelUpdate={handleMixerChannelUpdate('Verse 1')}
                  disabled={!beatInfo}
                />
                <div className="hidden lg:block space-y-3">
                  <TrackMixer channels={verse2Channels} sectionTitle="Verse 2" onChannelUpdate={handleMixerChannelUpdate('Verse 2')} disabled={!beatInfo} />
                  <TrackMixer channels={verse3Channels} sectionTitle="Verse 3" onChannelUpdate={handleMixerChannelUpdate('Verse 3')} disabled={!beatInfo} />
                  <TrackMixer channels={hookChannels} sectionTitle="Hook" onChannelUpdate={handleMixerChannelUpdate('Hook')} disabled={!beatInfo} />
                </div>
              </div>

              {/* Take Manager */}
              {Object.keys(takes)?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono text-gray-500 uppercase tracking-wider px-1">Take Management</h4>
                  {Object.entries(takes)?.map(([key, takesArr]) => (
                    <TakeManager
                      key={key}
                      takes={takesArr}
                      channelKey={key}
                      onSelectTake={handleSelectTake}
                      onDeleteTake={handleDeleteTake}
                      onRenameTake={handleRenameTake}
                      disabled={isRecording}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right panel */}
            <div className="space-y-4">
              {/* Right panel tabs */}
              <div className="flex gap-1 bg-gray-900 border border-gray-700 rounded-lg p-1">
                {rightPanelTabs?.map(tab => (
                  <button
                    key={tab?.id}
                    onClick={() => setRightPanel(tab?.id)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded text-[9px] font-mono transition-all ${
                      rightPanel === tab?.id
                        ? 'bg-gray-700 text-white' :'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Icon name={tab?.icon} size={12} />
                    {tab?.label}
                  </button>
                ))}
              </div>

              {rightPanel === 'controls' && (
                <>
                  <ProjectTemplates onApplyTemplate={handleApplyTemplate} currentPreset={selectedPreset} />
                  <PresetSelector selectedPreset={selectedPreset} onPresetChange={setSelectedPreset} disabled={!beatInfo} />
                  <AutotuneControls
                    enabled={autotuneEnabled}
                    retuneSpeed={retuneSpeed}
                    onToggle={() => setAutotuneEnabled(v => !v)}
                    onSpeedChange={setRetuneSpeed}
                    disabled={isRecording}
                    beatKey={beatInfo?.key}
                    monitoringEnabled={monitoringEnabled}
                    onMonitoringToggle={() => setMonitoringEnabled(v => !v)}
                    intensity={autotuneIntensity}
                    onIntensityChange={setAutotuneIntensity}
                    wetMix={autotuneWetMix}
                    onWetMixChange={setAutotuneWetMix}
                    beatVolume={beatVolumeState}
                    onLoadPreset={(preset) => {
                      if (preset?.intensity != null) setAutotuneIntensity(preset?.intensity);
                      if (preset?.wetMix != null) setAutotuneWetMix(preset?.wetMix);
                      if (preset?.retuneSpeed != null) setRetuneSpeed(preset?.retuneSpeed);
                      if (preset?.beatVolume != null) {
                        const vol = Math.max(0, Math.min(100, preset?.beatVolume));
                        setBeatVolumeState(vol);
                        beatImporterRef?.current?.setVolume(vol / 100);
                      }
                    }}
                  />
                  <DemoCounter />
                  <DeviceSelector onDeviceChange={handleDeviceChange} disabled={isRecording} />
                  <MetronomeControl enabled={metronomeEnabled} bpm={beatInfo?.bpm || 120} onToggle={() => setMetronomeEnabled(p => !p)} disabled={isRecording} />
                  <AudioMeter isRecording={isRecording} isArmed={!!armedChannel} level={inputLevel} />
                </>
              )}

              {rightPanel === 'mixer' && (
                <div className="space-y-3">
                  <TrackMixer channels={verse1Channels} sectionTitle="Verse 1" onChannelUpdate={handleMixerChannelUpdate('Verse 1')} disabled={!beatInfo} />
                  <TrackMixer channels={verse2Channels} sectionTitle="Verse 2" onChannelUpdate={handleMixerChannelUpdate('Verse 2')} disabled={!beatInfo} />
                  <TrackMixer channels={verse3Channels} sectionTitle="Verse 3" onChannelUpdate={handleMixerChannelUpdate('Verse 3')} disabled={!beatInfo} />
                  <TrackMixer channels={hookChannels} sectionTitle="Hook" onChannelUpdate={handleMixerChannelUpdate('Hook')} disabled={!beatInfo} />
                </div>
              )}

              {rightPanel === 'export' && (
                <ExportPanel
                  beatInfo={beatInfo}
                  channels={allChannelsFlat?.filter(c => c?.recorded)}
                  disabled={!beatInfo}
                  onBounce={handleBounce}
                />
              )}

              {rightPanel === 'notes' && (
                <SessionNotes
                  sessionId={currentSessionId}
                  onNotesChange={() => {}}
                />
              )}

              {autoMixing && (
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 space-y-3">
                  <div className="flex items-start gap-3">
                    <Icon name="Loader" size={20} color="var(--color-accent)" className="animate-spin" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-accent mb-1">Auto-Mixing</h4>
                      <p className="text-xs text-accent/80">Processing your recording with AI mixing...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile bottom actions */}
          <div className="lg:hidden mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveSession} disabled={saving} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white">
              {saving ? 'Saving...' : 'Save Session'}
            </Button>
            <Button variant="default" onClick={handleProceedToMix} iconName="ArrowRight" iconPosition="right" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-base py-3 shadow-lg shadow-purple-900/40 border-2 border-purple-400/30">
              🎚️ Proceed to Mix
            </Button>
          </div>
        </div>
      </div>
      {/* Error modal */}
      {(micPermissionError || recordingError) && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center flex-shrink-0">
                <Icon name="AlertTriangle" size={24} color="var(--color-error)" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{micPermissionError ? 'Microphone Error' : 'Recording Error'}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{micPermissionError || recordingError}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => { setMicPermissionError(null); setRecordingError(null); }} disabled={saving} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white">Dismiss</Button>
              {micPermissionError && (
                <Button onClick={() => { setMicPermissionError(null); setRecordingError(null); initializeAudioContext(true); }} className="flex-1 bg-accent hover:bg-accent/90 text-white">Retry Microphone</Button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Save dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Save Session</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Session Title</label>
              <input type="text" value={sessionTitle} onChange={e => setSessionTitle(e?.target?.value)} placeholder="Enter session title" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowSaveDialog(false)} disabled={saving} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white">Cancel</Button>
              <Button onClick={confirmSaveSession} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                {saving ? <span className="flex items-center gap-2"><Icon name="Loader" size={16} className="animate-spin" />Saving...</span> : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecordingStudio;