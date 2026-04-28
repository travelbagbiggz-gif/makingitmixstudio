import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import PresetSelector from './components/PresetSelector';
import AutotuneControls from './components/AutotuneControls';
import BeatImporter from './components/BeatImporter';
import { buildAutotuneChain, updateAutotuneParams } from './components/AutotuneDSP';

import AudioMeter from './components/AudioMeter';
import DeviceSelector from './components/DeviceSelector';
import MetronomeControl from './components/MetronomeControl';
import DemoCounter from './components/DemoCounter';
import ProToolsTransport from './components/ProToolsTransport';
import TrackMixer from './components/TrackMixer';
import TakeManager from './components/TakeManager';
import ExportPanel from './components/ExportPanel';
import ProjectTemplates from './components/ProjectTemplates';
import SessionNotes from './components/SessionNotes';
import TutorialOverlay from './components/TutorialOverlay';
import AutoSaveIndicator from './components/AutoSaveIndicator';
import ChannelFaders from './components/ChannelFaders';
import ProToolsEditWindow from './components/ProToolsEditWindow';
import SubscriptionPaywall from './components/SubscriptionPaywall';

const audioBufferToWav = (buffer) => {
  const numberOfChannels = buffer?.numberOfChannels;
  const sampleRate = buffer?.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let length = buffer?.length * numberOfChannels * 2;
  let result = new ArrayBuffer(44 + length);
  let view = new DataView(result);

  const writeString = (offset, string) => {
    for (let i = 0; i < string?.length; i++) {
      view?.setUint8(offset + i, string?.charCodeAt(i));
    }
  };

  let offset = 0;
  writeString(offset, 'RIFF'); offset += 4;
  view?.setUint32(offset, 36 + length, true); offset += 4;
  writeString(offset, 'WAVE'); offset += 4;
  writeString(offset, 'fmt '); offset += 4;
  view?.setUint32(offset, 16, true); offset += 4;
  view?.setUint16(offset, format, true); offset += 2;
  view?.setUint16(offset, numberOfChannels, true); offset += 2;
  view?.setUint32(offset, sampleRate, true); offset += 4;
  view?.setUint32(offset, sampleRate * numberOfChannels * bitDepth / 8, true); offset += 4;
  view?.setUint16(offset, numberOfChannels * bitDepth / 8, true); offset += 2;
  view?.setUint16(offset, bitDepth, true); offset += 2;
  writeString(offset, 'data'); offset += 4;
  view?.setUint32(offset, length, true); offset += 4;

  let index = 44;
  for (let i = 0; i < buffer?.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      let sample = buffer?.getChannelData(channel)?.[i];
      sample = Math.max(-1, Math.min(1, sample));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view?.setInt16(index, sample, true);
      index += 2;
    }
  }

  return new Blob([result], { type: 'audio/wav' });
};

const DEFAULT_MARKERS = [
  { time: 0, label: 'Start', color: '#10b981' },
];

const makeChannels = () => [
  { id: 'lead', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null, muted: false, soloed: false, volume: 1.0, pan: 0, color: '#ef4444', customName: null },
  { id: 'double', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null, muted: false, soloed: false, volume: 1.0, pan: 0, color: '#f97316', customName: null },
  { id: 'adlib', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null, muted: false, soloed: false, volume: 1.0, pan: 0, color: '#6366f1', customName: null },
  { id: 'extra', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null, muted: false, soloed: false, volume: 1.0, pan: 0, color: '#22c55e', customName: null },
];

const RecordingStudio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, hasProAccess, isProUser } = useAuth();

  const [selectedPreset, setSelectedPreset] = useState('hiphop');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [autotuneEnabled, setAutotuneEnabled] = useState(false);
  const [retuneSpeed, setRetuneSpeed] = useState(50);
  const [autotuneIntensity, setAutotuneIntensity] = useState(100);
  const [autotuneWetMix, setAutotuneWetMix] = useState(80);
  const [beatVolumeState, setBeatVolumeState] = useState(80);
  const [channelFaderVolumes, setChannelFaderVolumes] = useState({
    beat: 0.8,
    verse1: 1.0,
    verse2: 1.0,
    verse3: 1.0,
    hook: 1.0,
  });
  const channelFaderVolumesRef = useRef({ beat: 0.8, verse1: 1.0, verse2: 1.0, verse3: 1.0, hook: 1.0 });
  const [beatInfo, setBeatInfo] = useState(null);
  const [isBeatPlaying, setIsBeatPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('verse1');
  const [isRecording, setIsRecording] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionTitle, setSessionTitle] = useState(location?.state?.sessionName || 'Untitled Session');
  const [saving, setSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [micPermissionError, setMicPermissionError] = useState(null);
  const [recordingError, setRecordingError] = useState(null);
  const [autoMixing, setAutoMixing] = useState(false);
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [manualLatencyMs, setManualLatencyMs] = useState(() => {
    const saved = localStorage.getItem('studio_latency_compensation_ms');
    return saved !== null ? Number(saved) : 0;
  });
  const [showLatencyFader, setShowLatencyFader] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [armedChannel, setArmedChannel] = useState(null);
  const [isPunchInEnabled, setIsPunchInEnabled] = useState(false);
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);
  const [punchInPoint, setPunchInPoint] = useState(null);
  const [punchOutPoint, setPunchOutPoint] = useState(null);
  const [seekTime, setSeekTime] = useState(null);
  const [recordedWaveforms, setRecordedWaveforms] = useState({});
  const [auditionChannels, setAuditionChannels] = useState({});
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
  const [rightPanel, setRightPanel] = useState('controls');

  const pushUndo = (state) => {
    setUndoStack(prev => [...prev, state]?.slice(-20));
  };

  const handleAutoSave = async (data) => {
    if (!user || !currentSessionId) return;
    try {
      await supabase?.from('audio_sessions')?.update({
        session_data: data,
        updated_at: new Date()?.toISOString(),
      })?.eq('id', currentSessionId);
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  // Audio refs
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingMimeTypeRef = useRef('audio/webm');
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioBuffersRef = useRef({});
  const recordingStartTimeRef = useRef(null);
  const retryCountRef = useRef(0);
  const deviceInitializedRef = useRef(false);
  const audioPlayersRef = useRef({});
  const beatImporterRef = useRef(null);
  const autotuneSourceRef = useRef(null);
  const autotuneDestRef = useRef(null);
  const autotuneNodesRef = useRef([]);
  const processedStreamRef = useRef(null);
  const connectedAudioElementsRef = useRef(new WeakSet());
  const sectionGainNodesRef = useRef({ verse1: [], verse2: [], verse3: [], hook: [] });
  const trackVolumeGainNodesRef = useRef({});
  const trackPanNodesRef = useRef({});

  const bluetoothCompensationRef = useRef(null);
  const monitoringGainRef = useRef(null);
  const isBluetoothDeviceRef = useRef(false);
  const latencyCompensationMsRef = useRef(0);
  const pitchProcessorRef = useRef(null);
  const pitchShiftBufferRef = useRef(null);
  const autotuneCleanupRef = useRef(null);

  const metronomeCtxRef = useRef(null);
  const metronomeIntervalRef = useRef(null);
  const metronomeBeatRef = useRef(0);

  const playheadIntervalRef = useRef(null);
  const playStartWallRef = useRef(null);
  const playStartTimeRef = useRef(0);

  const sessionImportRef = useRef(null);

  const [verse1Channels, setVerse1Channels] = useState(makeChannels());
  const [verse2Channels, setVerse2Channels] = useState(makeChannels());
  const [verse3Channels, setVerse3Channels] = useState(makeChannels());
  const [hookChannels, setHookChannels] = useState(makeChannels());

  const autoSaveData = {
    verse1: verse1Channels,
    verse2: verse2Channels,
    verse3: verse3Channels,
    hook: hookChannels,
    beatInfo,
    selectedPreset,
    autotuneEnabled,
    retuneSpeed,
    takes,
    recordedWaveforms,
  };

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

  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);

  const seen = localStorage.getItem('studio_tutorial_seen');

  // NEW: build the autotune + monitoring chain
  const setupAutotuneChain = useCallback(async () => {
    const ctx = audioContextRef.current;
    const rawStream = mediaStreamRef.current;
    if (!ctx || !rawStream) return;

    if (autotuneCleanupRef.current) {
      autotuneCleanupRef.current();
      autotuneCleanupRef.current = null;
    }

    const { processedStream, workletNode, cleanup, usingWorklet } = await buildAutotuneChain(
      ctx,
      rawStream,
      {
        enabled: autotuneEnabled,
        wetMix: autotuneWetMix / 100,
        intensity: autotuneIntensity / 100,
        retuneSpeed: retuneSpeed / 100,
        beatKeyNotes: beatInfo?.keyInfo?.notes ?? null,
      },
      analyserRef.current || null
    );

    pitchProcessorRef.current = workletNode;
    processedStreamRef.current = processedStream;
    autotuneCleanupRef.current = cleanup;

    if (monitoringGainRef.current) {
      try {
        monitoringGainRef.current.disconnect();
      } catch (e) {}
      monitoringGainRef.current = null;
    }

    const monitoringSource = ctx.createMediaStreamSource(processedStream);
    const monitoringGain = ctx.createGain();
    monitoringGain.gain.value = monitoringEnabled ? 1.0 : 0.0;

    monitoringSource.connect(monitoringGain);
    monitoringGain.connect(ctx.destination);

    monitoringGainRef.current = monitoringGain;

    console.log('Autotune chain set up, usingWorklet:', usingWorklet);
  }, [autotuneEnabled, autotuneWetMix, autotuneIntensity, retuneSpeed, beatInfo, monitoringEnabled]);

  const handleImportFileChange = (e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const sessionData = JSON.parse(event?.target?.result);
          if (sessionData?.verse1) setVerse1Channels(sessionData?.verse1);
          if (sessionData?.verse2) setVerse2Channels(sessionData?.verse2);
          if (sessionData?.verse3) setVerse3Channels(sessionData?.verse3);
          if (sessionData?.hook) setHookChannels(sessionData?.hook);
          if (sessionData?.beatInfo) setBeatInfo(sessionData?.beatInfo);
        } catch (error) {
          console.error('Failed to import session:', error);
        }
      };
      reader?.readAsText(file);
    }
  };

  const handleImportSession = () => {
    sessionImportRef?.current?.click();
  };

  const handleExportSession = () => {
    const sessionData = JSON.stringify(autoSaveData, null, 2);
    const blob = new Blob([sessionData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessionTitle}.mims`;
    a?.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSession = () => {
    setShowSaveDialog(true);
  };

  const confirmSaveSession = async () => {
    setSaving(true);
    try {
      if (currentSessionId) {
        await supabase?.from('audio_sessions')?.update({
          title: sessionTitle,
          session_data: autoSaveData,
          updated_at: new Date()?.toISOString(),
        })?.eq('id', currentSessionId);
      } else {
        const { data } = await supabase?.from('audio_sessions')?.insert({
          user_id: user?.id,
          title: sessionTitle,
          session_data: autoSaveData,
        })?.select()?.single();
        if (data) setCurrentSessionId(data?.id);
      }
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleProceedToMix = () => {
    navigate('/mix', { state: { sessionData: autoSaveData } });
  };

  const handleTransportPlay = () => {
    if (isBeatPlaying) {
      setIsBeatPlaying(false);
      beatImporterRef?.current?.pause();
    } else {
      setIsBeatPlaying(true);
      beatImporterRef?.current?.play();
    }
  };

  const handleTransportStop = () => {
    setIsBeatPlaying(false);
    setIsRecording(false);
    beatImporterRef?.current?.pause();
    beatImporterRef?.current?.setCurrentTime(0);
    setCurrentTime(0);
  };

  const handleTransportRecord = () => {
    if (!armedChannel) return;
    setIsRecording(!isRecording);
  };

  const handleTransportRewind = () => {
    const newTime = Math.max(0, currentTime - 5);
    setCurrentTime(newTime);
    beatImporterRef?.current?.setCurrentTime(newTime);
  };

  const handleTransportFastForward = () => {
    const newTime = Math.min(beatInfo?.durationInSeconds || 180, currentTime + 5);
    setCurrentTime(newTime);
    beatImporterRef?.current?.setCurrentTime(newTime);
  };

  const handleBeatImport = (info) => {
    setBeatInfo(info);
    if (pitchProcessorRef?.current && info?.keyInfo?.notes) {
      updateAutotuneParams(pitchProcessorRef?.current, {
        beatKeyNotes: info?.keyInfo?.notes,
      });
    }
  };

  const handleAudioReady = () => {};

  const handleBeatTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const handleMonitoringToggle = () => {
    setMonitoringEnabled((prev) => {
      const next = !prev;
      if (monitoringGainRef.current) {
        monitoringGainRef.current.gain.value = next ? 1.0 : 0.0;
      }
      return next;
    });
  };

  // TODO: keep the rest of your existing handlers, useEffects, JSX, etc.
  // I am not rewriting all UI here, only the audio/autotune wiring.
  // Make sure you keep your ProToolsEditWindow, TrackMixer, ExportPanel, etc.

  return (
    <>
      {/* Your existing JSX layout goes here.
          Because your file is long, keep your original JSX return block.
          Only the top logic above has been changed. */}
    </>
  );
};

export default RecordingStudio;
