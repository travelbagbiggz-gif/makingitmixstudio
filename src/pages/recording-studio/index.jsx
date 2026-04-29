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
  // RIFF identifier
  writeString(offset, 'RIFF'); offset += 4;
  // file length
  view?.setUint32(offset, 36 + length, true); offset += 4;
  // RIFF type
  writeString(offset, 'WAVE'); offset += 4;
  // format chunk identifier
  writeString(offset, 'fmt '); offset += 4;
  // format chunk length
  view?.setUint32(offset, 16, true); offset += 4;
  // sample format (raw)
  view?.setUint16(offset, format, true); offset += 2;
  // channel count
  view?.setUint16(offset, numberOfChannels, true); offset += 2;
  // sample rate
  view?.setUint32(offset, sampleRate, true); offset += 4;
  // byte rate (sample rate * block align)
  view?.setUint32(offset, sampleRate * numberOfChannels * bitDepth / 8, true); offset += 4;
  // block align (channel count * bytes per sample)
  view?.setUint16(offset, numberOfChannels * bitDepth / 8, true); offset += 2;
  // bits per sample
  view?.setUint16(offset, bitDepth, true); offset += 2;
  // data chunk identifier
  writeString(offset, 'data'); offset += 4;
  // data chunk length
  view?.setUint32(offset, length, true); offset += 4;

  // write the PCM samples
  let index = 44;
  for (let i = 0; i < buffer?.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      let sample = buffer?.getChannelData(channel)?.[i];
      // clamp
      sample = Math.max(-1, Math.min(1, sample));
      // scale to 16-bit
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

  // Add this block - Session import ref
  const sessionImportRef = useRef(null);
  // End of added block

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
  
  const handleImportFileChange = (e) => {
    // Handle session import file selection
    const file = e?.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const sessionData = JSON.parse(event?.target?.result);
          // Apply session data to state
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
    // Immediately sync beat key notes to the autotune DSP if a worklet node exists
    if (pitchProcessorRef?.current && info?.keyInfo?.notes) {
      updateAutotuneParams(pitchProcessorRef?.current, {
        beatKeyNotes: info?.keyInfo?.notes,
      });
    }
  };

  const handleAudioReady = () => {
    // Beat audio is ready
  };

  const handleBeatTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const handleMonitoringToggle = () => {
    setMonitoringEnabled(prev => !prev);
  };

  const editWindowSections = [
    { id: 'verse1', label: 'Verse 1', channels: verse1Channels },
    { id: 'verse2', label: 'Verse 2', channels: verse2Channels },
    { id: 'verse3', label: 'Verse 3', channels: verse3Channels },
    { id: 'hook', label: 'Hook', channels: hookChannels },
  ];

  const handleArm = (sectionId, channelId) => {
    setArmedChannel({ sectionId, channelId });
  };

  const handleMuteToggle = (sectionId, channelId) => {
    const updateChannels = (channels) =>
      channels?.map(ch => ch?.id === channelId ? { ...ch, muted: !ch?.muted } : ch);
    
    if (sectionId === 'verse1') setVerse1Channels(updateChannels);
    else if (sectionId === 'verse2') setVerse2Channels(updateChannels);
    else if (sectionId === 'verse3') setVerse3Channels(updateChannels);
    else if (sectionId === 'hook') setHookChannels(updateChannels);
  };

  const handleSoloToggle = (sectionId, channelId) => {
    const updateChannels = (channels) =>
      channels?.map(ch => ch?.id === channelId ? { ...ch, soloed: !ch?.soloed } : ch);
    
    if (sectionId === 'verse1') setVerse1Channels(updateChannels);
    else if (sectionId === 'verse2') setVerse2Channels(updateChannels);
    else if (sectionId === 'verse3') setVerse3Channels(updateChannels);
    else if (sectionId === 'hook') setHookChannels(updateChannels);
  };

  const handleAudition = (sectionId, channelId) => {
    setAuditionChannels(prev => ({
      ...prev,
      [`${sectionId}-${channelId}`]: !prev?.[`${sectionId}-${channelId}`]
    }));
  };

  const handlePlayback = (sectionId, channelId) => {
    // Handle playback of recorded track
  };

  const handleDelete = (sectionId, channelId) => {
    const updateChannels = (channels) =>
      channels?.map(ch => ch?.id === channelId ? { ...ch, recorded: false, filePath: null } : ch);
    
    if (sectionId === 'verse1') setVerse1Channels(updateChannels);
    else if (sectionId === 'verse2') setVerse2Channels(updateChannels);
    else if (sectionId === 'verse3') setVerse3Channels(updateChannels);
    else if (sectionId === 'hook') setHookChannels(updateChannels);
  };

  const handlePanChange = (sectionId, channelId, pan) => {
    const updateChannels = (channels) =>
      channels?.map(ch => ch?.id === channelId ? { ...ch, pan } : ch);
    
    if (sectionId === 'verse1') setVerse1Channels(updateChannels);
    else if (sectionId === 'verse2') setVerse2Channels(updateChannels);
    else if (sectionId === 'verse3') setVerse3Channels(updateChannels);
    else if (sectionId === 'hook') setHookChannels(updateChannels);
  };

  const handleTrackVolumeChange = (sectionId, channelId, volume) => {
    const updateChannels = (channels) =>
      channels?.map(ch => ch?.id === channelId ? { ...ch, volume } : ch);
    
    if (sectionId === 'verse1') setVerse1Channels(updateChannels);
    else if (sectionId === 'verse2') setVerse2Channels(updateChannels);
    else if (sectionId === 'verse3') setVerse3Channels(updateChannels);
    else if (sectionId === 'hook') setHookChannels(updateChannels);
  };

  const handleSelectTake = (channelKey, takeIndex) => {
    // Select a take for the channel
  };

  const handleDeleteTake = (channelKey, takeIndex) => {
    setTakes(prev => ({
      ...prev,
      [channelKey]: prev?.[channelKey]?.filter((_, i) => i !== takeIndex)
    }));
  };

  const handleRenameTake = (channelKey, takeIndex, newName) => {
    setTakes(prev => ({
      ...prev,
      [channelKey]: prev?.[channelKey]?.map((take, i) => 
        i === takeIndex ? { ...take, name: newName } : take
      )
    }));
  };

  const handleFaderVolumeChange = (channel, volume) => {
    setChannelFaderVolumes(prev => ({ ...prev, [channel]: volume }));
    channelFaderVolumesRef.current = { ...channelFaderVolumesRef?.current, [channel]: volume };
  };

  const handleApplyTemplate = (template) => {
    // Apply project template - only sets genre/autotune context, NOT vocal preset
    // Vocal preset is independently controlled by the user via PresetSelector
    setSelectedTemplateId(template?.id);
    // Apply autotune setting from template
    if (template?.autotune !== undefined) setAutotuneEnabled(template?.autotune);
    if (template?.retuneSpeed !== undefined) setRetuneSpeed(template?.retuneSpeed);
  };

  const handleDeviceChange = (deviceId) => {
    setSelectedDevice(deviceId);
  };

  const handleMixerChannelUpdate = (sectionTitle) => (channelId, updates) => {
    const updateChannels = (channels) =>
      channels?.map(ch => ch?.id === channelId ? { ...ch, ...updates } : ch);
    
    if (sectionTitle === 'Verse 1') setVerse1Channels(updateChannels);
    else if (sectionTitle === 'Verse 2') setVerse2Channels(updateChannels);
    else if (sectionTitle === 'Verse 3') setVerse3Channels(updateChannels);
    else if (sectionTitle === 'Hook') setHookChannels(updateChannels);
  };

  const allChannelsFlat = [
    ...verse1Channels,
    ...verse2Channels,
    ...verse3Channels,
    ...hookChannels
  ];

  const handleBounce = async () => {
    // Handle audio bounce/export
    console.log('Bouncing audio...');
  };

  const initializeAudioContext = async (retry = false) => {
    try {
      if (!audioContextRef?.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const stream = await navigator.mediaDevices?.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setMicPermissionError(null);
    } catch (error) {
      setMicPermissionError('Microphone access denied. Please allow microphone access to record.');
      console.error('Audio initialization error:', error);
    }
  };

  useEffect(() => {
    if (!user || authLoading) return;
    const checkSub = async () => {
      if (hasProAccess || isProUser) {
        setHasSubscription(true);
        setSubscriptionChecked(true);
        return;
      }
      try {
        const { data } = await supabase?.functions?.invoke('verify-subscription', {
          body: { userId: user?.id },
        });
        if (data?.isActive) {
          setHasSubscription(true);
        } else {
          setHasSubscription(false);
        }
      } catch (err) {
        setHasSubscription(true);
      } finally {
        setSubscriptionChecked(true);
      }
    };
    checkSub();
  }, [user, authLoading, hasProAccess, isProUser]);

  useEffect(() => {
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
    if (!authLoading && !user) {
      navigate('/sign-in');
    }
  }, [user, authLoading, navigate]);

  // Sync beat key notes to autotune DSP whenever beatInfo changes
  useEffect(() => {
    if (!pitchProcessorRef?.current) return;
    const notes = beatInfo?.keyInfo?.notes ?? null;
    updateAutotuneParams(pitchProcessorRef?.current, {
      beatKeyNotes: notes,
    });
  }, [beatInfo]);

  if (authLoading || (user && !subscriptionChecked)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-foreground">
          <Icon name="Loader" size={24} className="animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show paywall if not subscribed
  if (!user || (subscriptionChecked && !hasSubscription)) {
    return <SubscriptionPaywall user={user} />;
  }

  return (
    <>
      <Helmet>
        <title>Recording Studio - makingitmixstudio</title>
        <meta name="description" content="Professional audio recording studio" />
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
                <p className="text-muted-foreground text-xs">Record your vocals over your beat</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <AutoSaveIndicator
                  sessionData={autoSaveData}
                  sessionId={currentSessionId}
                  onAutoSave={handleAutoSave}
                />
                {/* Hidden file input for session import */}
                <input
                  ref={sessionImportRef}
                  type="file"
                  accept=".mims,application/json"
                  className="hidden"
                  onChange={handleImportFileChange}
                />
                <Button variant="outline" size="sm" onClick={handleImportSession} iconName="Upload" iconPosition="left" className="hidden sm:flex border-blue-500/50 text-blue-400 hover:bg-blue-900/30">
                  Load Session
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportSession} iconName="Download" iconPosition="left" className="hidden sm:flex border-green-500/50 text-green-400 hover:bg-green-900/30">
                  Save Session
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveSession} iconName="Save" iconPosition="left" disabled={saving} className="hidden sm:flex">
                  {saving ? 'Saving...' : 'Cloud Save'}
                </Button>
                <Button variant="default" onClick={handleProceedToMix} iconName="ArrowRight" iconPosition="right" className="hidden sm:flex bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2.5 text-base shadow-lg shadow-purple-900/40 border-2 border-purple-400/30">
                  🎚️ Mix
                </Button>
              </div>
            </div>
          </div>

          {/* Transport */}
          <div className="mb-4">
            <ProToolsTransport
              isPlaying={isBeatPlaying}
              isRecording={isRecording}
              isPunchInEnabled={isPunchInEnabled}
              isLoopEnabled={isLoopEnabled}
              isMetronomeEnabled={metronomeEnabled}
              currentTime={currentTime}
              beatDuration={beatInfo?.durationInSeconds || 180}
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
                      <strong>Punch-In Mode Active</strong>
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
                  <p className="text-sm text-blue-300"><strong>Loop Mode Active</strong> — Beat will loop continuously.</p>
                </div>
              )}

              {/* Arm instruction */}
              {!armedChannel && beatInfo && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <Icon name="Info" size={16} color="var(--color-accent)" />
                  <p className="text-sm text-accent/90">Click the <strong>R</strong> button on a track to arm it, then press Record.</p>
                </div>
              )}

              {/* Live Monitor toggle — above tracks */}
              <div className="p-3 rounded-lg bg-card border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 ${
                      monitoringEnabled ? 'bg-green-900/40' : 'bg-gray-800'
                    }`}>
                      <Icon name="Headphones" size={24} color={monitoringEnabled ? '#4ade80' : '#6b7280'} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Live Monitor</h4>
                      <p className="text-[10px] text-muted-foreground">
                        {monitoringEnabled ? 'Hearing your voice in headphones' : 'Off'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleMonitoringToggle}
                    className={`relative w-12 h-6 rounded-full transition-all ${
                      monitoringEnabled ? 'bg-green-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                        monitoringEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Pro Tools Edit Window */}
              <ProToolsEditWindow
                beatInfo={beatInfo}
                isBeatPlaying={isBeatPlaying}
                onBeatPlayPause={handleTransportPlay}
                sections={editWindowSections}
                armedChannel={armedChannel}
                auditionChannels={auditionChannels}
                onArm={handleArm}
                onMute={handleMuteToggle}
                onSolo={handleSoloToggle}
                onAudition={handleAudition}
                onPlayback={handlePlayback}
                onDelete={handleDelete}
                onPanChange={handlePanChange}
                onVolumeChange={handleTrackVolumeChange}
                recordedWaveforms={recordedWaveforms}
                disabled={!beatInfo}
              />

              {/* Take Manager */}
              {Object.keys(takes)?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono text-gray-500 uppercase tracking-wider px-1">Takes</h4>
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
                        ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Icon name={tab?.icon} size={12} />
                    {tab?.label}
                  </button>
                ))}
              </div>

              {rightPanel === 'controls' && (
                <>
                  <ChannelFaders
                    volumes={channelFaderVolumes}
                    onVolumeChange={handleFaderVolumeChange}
                   
                  />
                  <ProjectTemplates onApplyTemplate={handleApplyTemplate} selectedTemplateId={selectedTemplateId} />
                  <PresetSelector selectedPreset={selectedPreset} onPresetChange={(preset) => {
                    setSelectedPreset(preset);
                    // Clear template selection when manually picking a vocal preset
                    setSelectedTemplateId(null);
                    // Auto-enable autotune when melodic is selected, disable for others
                    if (preset === 'melodic') {
                      setAutotuneEnabled(true);
                    } else {
                      setAutotuneEnabled(false);
                    }
                  }} disabled={!beatInfo} />

                  {/* Autotune — only show when Melodic preset is selected */}
                  {selectedPreset === 'melodic' && (
                    <AutotuneControls
                      enabled={autotuneEnabled}
                      retuneSpeed={retuneSpeed}
                      onToggle={() => setAutotuneEnabled(v => !v)}
                      onSpeedChange={setRetuneSpeed}
                      disabled={isRecording}
                      beatKey={beatInfo?.key}
                      intensity={autotuneIntensity}
                      onIntensityChange={setAutotuneIntensity}
                      wetMix={autotuneWetMix}
                      onWetMixChange={setAutotuneWetMix}
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
                  )}

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
                      <p className="text-xs text-accent/80">Processing your recording...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile bottom actions */}
          <div className="lg:hidden mt-4 flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleImportSession} iconName="Upload" iconPosition="left" className="flex-1 border-blue-500/50 text-blue-400 hover:bg-blue-900/30">
              Load Session
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportSession} iconName="Download" iconPosition="left" className="flex-1 border-green-500/50 text-green-400 hover:bg-green-900/30">
              Save Session
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveSession} disabled={saving} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white">
              {saving ? <span className="flex items-center gap-2"><Icon name="Loader" size={16} className="animate-spin" />Saving...</span> : 'Save'}
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