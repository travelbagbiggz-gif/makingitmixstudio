import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import ChannelStrip from './components/ChannelStrip';
import EchoControl from './components/EchoControl';
import MasterPlayback from './components/MasterPlayback';
import MixHistory from './components/MixHistory';
import PresetManager from './components/PresetManager';
import ABComparison from './components/ABComparison';

// Default gain levels for auto-mix (in dB)
const AUTO_MIX_LEVELS = {
  lead: -6,
  double: -9,
  adlib: -12,
  extra: -10,
  beat: -6.2,
};

// Convert dB to linear gain
const dbToLinear = (db) => Math.pow(10, db / 20);

// Default EQ/pan for intelligent auto-mix when user hasn't fine-tuned
const AUTO_MIX_EQ = {
  lead: { bass: -2, mid: 3, treble: 2, pan: 0 },
  double: { bass: -3, mid: 1, treble: 1, pan: -25 },
  adlib: { bass: -4, mid: 0, treble: 2, pan: 25 },
  extra: { bass: -3, mid: 1, treble: 1, pan: 15 },
};

const buildChannelsFromSession = (sessionMixData) => {
  if (!sessionMixData) return null;

  const { sections, userFineTuned, channelFaderVolumes } = sessionMixData;
  const result = [];

  // Add beat channel
  result?.push({
    id: 'beat',
    name: 'Beat',
    type: 'Instrumental',
    icon: 'Music',
    bass: 0,
    mid: 0,
    treble: 0,
    level: AUTO_MIX_LEVELS?.beat,
    pan: 0,
    telephoneEnabled: false,
    trackType: 'beat',
  });

  // Map section channels to mix channels
  const sectionLabels = {
    verse1: 'Verse 1',
    verse2: 'Verse 2',
    verse3: 'Verse 3',
    hook: 'Hook',
  };

  Object.entries(sections || {})?.forEach(([sectionKey, channels]) => {
    channels?.forEach(ch => {
      if (!ch?.recorded) return;

      const trackType = ch?.id; // lead, double, adlib, extra
      const sectionLabel = sectionLabels?.[sectionKey] || sectionKey;
      const channelName = ch?.customName || `${sectionLabel} ${ch?.id?.charAt(0)?.toUpperCase() + ch?.id?.slice(1)}`;

      // Determine level: use user's volume if they fine-tuned, else use auto-mix defaults
      let level;
      if (userFineTuned && Math.abs((ch?.volume ?? 1.0) - 1.0) > 0.01) {
        // Convert user's linear volume to dB
        level = 20 * Math.log10(Math.max(ch?.volume, 0.001));
      } else {
        level = AUTO_MIX_LEVELS?.[trackType] ?? -9;
      }

      // Determine EQ and pan
      let bass, mid, treble, pan;
      if (userFineTuned && Math.abs((ch?.pan ?? 0) - 0) > 0.01) {
        // User set pan — preserve it (convert -1..1 to -50..50 display range)
        pan = Math.round((ch?.pan ?? 0) * 50);
        bass = 0; mid = 0; treble = 0;
      } else {
        // Apply intelligent defaults
        const eqDefaults = AUTO_MIX_EQ?.[trackType] || { bass: 0, mid: 0, treble: 0, pan: 0 };
        bass = eqDefaults?.bass;
        mid = eqDefaults?.mid;
        treble = eqDefaults?.treble;
        pan = eqDefaults?.pan;
      }

      result?.push({
        id: `${sectionKey}-${ch?.id}`,
        name: channelName,
        type: trackType === 'lead' ? 'Lead Vocal' : trackType === 'double' ? 'Double' : trackType === 'adlib' ? 'Ad-lib' : 'Extra',
        icon: trackType === 'lead' ? 'Mic' : trackType === 'double' ? 'Mic2' : 'Radio',
        bass,
        mid,
        treble,
        level,
        pan,
        reverb: trackType === 'lead' ? 30 : trackType === 'double' ? 20 : 15,
        telephoneEnabled: false,
        trackType,
        sectionKey,
        originalVolume: ch?.volume,
        originalPan: ch?.pan,
        userFineTuned,
      });
    });
  });

  return result?.length > 1 ? result : null;
};

const FineTuneMixPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionMixData = location?.state?.sessionMixData || null;

  const [isPlaying, setIsPlaying] = useState(false);
  const masterPlaybackRef = useRef(null);
  const [autoMixApplied, setAutoMixApplied] = useState(false);
  const [autoMixMode, setAutoMixMode] = useState('default'); // 'preserved' | 'intelligent'

  const getDefaultChannels = () => [
    { id: 'beat', name: 'Beat', type: 'Instrumental', icon: 'Music', bass: 0, mid: 0, treble: 0, level: -6.2, telephoneEnabled: false },
    { id: 'verse1', name: 'Verse 1', type: 'Lead Vocal', icon: 'Mic', bass: 0, mid: 0, treble: 0, reverb: 30, level: -8.5, telephoneEnabled: false },
    { id: 'verse2', name: 'Verse 2', type: 'Lead Vocal', icon: 'Mic', bass: 0, mid: 0, treble: 0, reverb: 30, level: -7.8, telephoneEnabled: false },
    { id: 'verse3', name: 'Verse 3', type: 'Lead Vocal', icon: 'Mic', bass: 0, mid: 0, treble: 0, reverb: 30, level: -8.1, telephoneEnabled: false },
    { id: 'hook', name: 'Hook', type: 'Lead Vocal', icon: 'Mic2', bass: 0, mid: 0, treble: 0, reverb: 40, level: -5.9, telephoneEnabled: false },
  ];

  const [channels, setChannels] = useState(() => {
    const built = buildChannelsFromSession(sessionMixData);
    return built || getDefaultChannels();
  });

  const [echo, setEcho] = useState({ wet: 25, noteValue: '1/4', duration: 50 });

  const [mixHistory, setMixHistory] = useState([{ id: 1, action: 'Initial auto-mix applied', timestamp: '2026-02-24 08:30:15', icon: 'Sparkles' }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Apply auto-mix on mount when session data is present
  useEffect(() => {
    if (!sessionMixData) return;
    const built = buildChannelsFromSession(sessionMixData);
    if (!built) return;

    const mode = sessionMixData?.userFineTuned ? 'preserved' : 'intelligent';
    setAutoMixMode(mode);
    setAutoMixApplied(true);

    const historyMsg = mode === 'preserved' ?'Auto-mix applied — preserved your custom settings' :'Auto-mix applied — intelligent defaults (lead -6dB, doubles -9dB, adlibs -12dB)';

    addToHistory(historyMsg, 'Sparkles');
  }, []);

  const handleFaderChange = (channelId, faderType, value) => {
    setChannels(prev => prev?.map(ch =>
      ch?.id === channelId ? { ...ch, [faderType]: value } : ch
    ));
    if (isPlaying && masterPlaybackRef?.current) {
      const ch = channels?.find(c => c?.id === channelId);
      if (ch) {
        const updated = { ...ch, [faderType]: value };
        masterPlaybackRef?.current?.updateEQParams(channelId, updated?.bass, updated?.mid, updated?.treble);
      }
    }
    addToHistory(`Adjusted ${faderType} on ${channels?.find(ch => ch?.id === channelId)?.name}`, 'Sliders');
  };

  const handleReverbChange = (channelId, value) => {
    setChannels(prev => prev?.map(ch =>
      ch?.id === channelId ? { ...ch, reverb: value } : ch
    ));
    if (isPlaying && masterPlaybackRef?.current) {
      masterPlaybackRef?.current?.updateReverbWet(channelId, value);
    }
    addToHistory(`Changed reverb on ${channels?.find(ch => ch?.id === channelId)?.name}`, 'Waves');
  };

  const handleTelephoneToggle = (channelId) => {
    setChannels(prev => prev?.map(ch =>
      ch?.id === channelId ? { ...ch, telephoneEnabled: !ch?.telephoneEnabled } : ch
    ));
    const channel = channels?.find(ch => ch?.id === channelId);
    addToHistory(`${channel?.telephoneEnabled ? 'Disabled' : 'Enabled'} telephone preset on ${channel?.name}`, 'Phone');
  };

  const handleEchoChange = (newEcho) => {
    setEcho(newEcho);
    if (isPlaying && masterPlaybackRef?.current) {
      masterPlaybackRef?.current?.updateEchoParams(newEcho);
    }
    addToHistory('Modified echo settings', 'Radio');
  };

  const addToHistory = (action, icon) => {
    const timestamp = new Date()?.toLocaleString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    })?.replace(',', '');
    const newEntry = { id: Date.now(), action, timestamp, icon };
    setMixHistory(prev => [...prev?.slice(0, historyIndex + 1), newEntry]);
    setHistoryIndex(prev => prev + 1);
  };

  const handleUndo = () => { if (historyIndex > 0) setHistoryIndex(prev => prev - 1); };
  const handleRedo = () => { if (historyIndex < mixHistory?.length - 1) setHistoryIndex(prev => prev + 1); };
  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleStop = () => setIsPlaying(false);

  const handleLoadPreset = (preset) => {
    setChannels(prev => prev?.map(ch => ({ ...ch, bass: preset?.settings?.bass, mid: preset?.settings?.mid, treble: preset?.settings?.treble })));
    addToHistory(`Loaded preset: ${preset?.name}`, 'Download');
  };

  const handleSavePreset = (name) => { addToHistory(`Saved preset: ${name}`, 'Save'); };
  const handleCompare = (version) => { addToHistory(`Switched to version ${version}`, 'GitCompare'); };
  const handleSaveVersion = (version) => { addToHistory(`Saved version ${version}`, 'Check'); };

  const handleProceedToMastering = () => navigate('/mastering-page');

  const handleBackToRecording = () => navigate('/recording-studio');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[60px]">
        <div className="container-studio py-6 md:py-8 lg:py-12">
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-semibold text-foreground mb-2">
                  Fine Tune Mix
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Balance your mix with professional EQ, effects, and spatial processing
                </p>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToRecording}
                  iconName="ArrowLeft"
                  iconPosition="left"
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-900/30"
                >
                  <span className="hidden md:inline">Back to Recording Studio</span>
                  <span className="md:hidden">Back</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleProceedToMastering}
                  iconName="ArrowRight"
                  iconPosition="right"
                >
                  <span className="hidden md:inline">Proceed to Mastering</span>
                  <span className="md:hidden">Master</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Auto-mix applied banner */}
          {autoMixApplied && (
            <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
              autoMixMode === 'preserved' ?'bg-green-900/20 border-green-500/40' :'bg-purple-900/20 border-purple-500/40'
            }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                autoMixMode === 'preserved' ? 'bg-green-900/40' : 'bg-purple-900/40'
              }`}>
                <Icon name="Sparkles" size={20} color={autoMixMode === 'preserved' ? '#4ade80' : '#a78bfa'} />
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-semibold mb-1 ${
                  autoMixMode === 'preserved' ? 'text-green-300' : 'text-purple-300'
                }`}>
                  {autoMixMode === 'preserved' ? '✅ Auto-Mix Applied — Your Settings Preserved' : '🎚️ Auto-Mix Applied — Intelligent Defaults'}
                </h3>
                <p className={`text-xs ${
                  autoMixMode === 'preserved' ? 'text-green-400/80' : 'text-purple-400/80'
                }`}>
                  {autoMixMode === 'preserved' ?'Your custom volumes and panning from the recording studio have been preserved. EQ defaults applied where not set.' :'Lead vocals leveled at -6dB, doubles at -9dB (L/R panned), ad-libs at -12dB. High-pass filter and presence boost applied. Go back to recording studio to fine-tune before mixing.'}
                </p>
                {autoMixMode === 'intelligent' && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-900/40 text-red-300 border border-red-500/30">Lead: -6dB · Center</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-900/40 text-orange-300 border border-orange-500/30">Doubles: -9dB · L/R Pan</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-500/30">Ad-libs: -12dB · Wide</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setAutoMixApplied(false)}
                className="text-gray-500 hover:text-gray-300 flex-shrink-0"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
          )}

          {/* Fine-tune reminder banner */}
          <div className="mb-6 p-3 rounded-lg bg-blue-900/15 border border-blue-500/30 flex items-center gap-3">
            <Icon name="Info" size={16} color="#60a5fa" />
            <p className="text-xs text-blue-300 flex-1">
              Want to adjust volumes, panning, or autotune before mixing?
              <button onClick={handleBackToRecording} className="ml-1 underline text-blue-200 hover:text-white font-medium">
                Go back to Recording Studio
              </button>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              <MasterPlayback
                ref={masterPlaybackRef}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onStop={handleStop}
                duration={180}
                channels={channels}
                echo={echo}
              />

              <div className="bg-muted/30 rounded-xl p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center bg-accent/15">
                    <Icon name="Sliders" size={24} color="var(--color-accent)" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
                      Channel Strips
                    </h2>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      EQ and level controls for each channel
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {channels?.map((channel) => (
                    <ChannelStrip
                      key={channel?.id}
                      channel={channel}
                      onFaderChange={handleFaderChange}
                      onReverbChange={handleReverbChange}
                      onTelephoneToggle={handleTelephoneToggle}
                      showReverb={channel?.id !== 'beat'}
                    />
                  ))}
                </div>
              </div>

              <EchoControl echo={echo} onChange={handleEchoChange} />
            </div>

            <div className="space-y-4 md:space-y-6">
              {/* Back to recording CTA */}
              <div className="bg-card rounded-lg border border-purple-500/30 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-900/40">
                    <Icon name="Mic" size={18} color="#a78bfa" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Fine-Tune in Studio</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Not happy with the levels? Go back to the recording studio to adjust volumes, panning, and autotune settings.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToRecording}
                  iconName="ArrowLeft"
                  iconPosition="left"
                  className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-900/30"
                >
                  Back to Recording Studio
                </Button>
              </div>

              <MixHistory
                history={mixHistory}
                currentIndex={historyIndex}
                onUndo={handleUndo}
                onRedo={handleRedo}
              />

              <PresetManager
                onLoadPreset={handleLoadPreset}
                onSavePreset={handleSavePreset}
              />

              <ABComparison
                onCompare={handleCompare}
                onSaveVersion={handleSaveVersion}
              />

              <div className="bg-card rounded-lg border border-border p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-success/15">
                    <Icon name="Info" size={20} color="var(--color-success)" />
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-foreground">Quick Tips</h3>
                </div>
                <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={16} className="flex-shrink-0 mt-0.5 text-success" />
                    <span>Use A/B comparison to evaluate mix changes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={16} className="flex-shrink-0 mt-0.5 text-success" />
                    <span>Telephone preset adds vintage lo-fi character</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={16} className="flex-shrink-0 mt-0.5 text-success" />
                    <span>Plate reverb creates natural vocal space</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={16} className="flex-shrink-0 mt-0.5 text-success" />
                    <span>Echo note values sync with your track tempo</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FineTuneMixPage;