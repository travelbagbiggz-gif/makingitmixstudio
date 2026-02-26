import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import ChannelStrip from './components/ChannelStrip';
import EchoControl from './components/EchoControl';
import MasterPlayback from './components/MasterPlayback';
import MixHistory from './components/MixHistory';
import PresetManager from './components/PresetManager';
import ABComparison from './components/ABComparison';

const FineTuneMixPage = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const masterPlaybackRef = useRef(null);
  const [channels, setChannels] = useState([
    {
      id: 'beat',
      name: 'Beat',
      type: 'Instrumental',
      icon: 'Music',
      bass: 0,
      mid: 0,
      treble: 0,
      level: -6.2,
      telephoneEnabled: false
    },
    {
      id: 'verse1',
      name: 'Verse 1',
      type: 'Lead Vocal',
      icon: 'Mic',
      bass: 0,
      mid: 0,
      treble: 0,
      reverb: 30,
      level: -8.5,
      telephoneEnabled: false
    },
    {
      id: 'verse2',
      name: 'Verse 2',
      type: 'Lead Vocal',
      icon: 'Mic',
      bass: 0,
      mid: 0,
      treble: 0,
      reverb: 30,
      level: -7.8,
      telephoneEnabled: false
    },
    {
      id: 'verse3',
      name: 'Verse 3',
      type: 'Lead Vocal',
      icon: 'Mic',
      bass: 0,
      mid: 0,
      treble: 0,
      reverb: 30,
      level: -8.1,
      telephoneEnabled: false
    },
    {
      id: 'hook',
      name: 'Hook',
      type: 'Lead Vocal',
      icon: 'Mic2',
      bass: 0,
      mid: 0,
      treble: 0,
      reverb: 40,
      level: -5.9,
      telephoneEnabled: false
    }
  ]);

  const [echo, setEcho] = useState({
    wet: 25,
    noteValue: '1/4',
    duration: 50
  });

  const [mixHistory, setMixHistory] = useState([
    {
      id: 1,
      action: 'Initial auto-mix applied',
      timestamp: '2026-02-24 08:30:15',
      icon: 'Sparkles'
    }
  ]);

  const [historyIndex, setHistoryIndex] = useState(0);

  const handleFaderChange = (channelId, faderType, value) => {
    setChannels(prev => prev?.map(ch =>
      ch?.id === channelId ? { ...ch, [faderType]: value } : ch
    ));
    // Apply EQ live during playback
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
    // Apply reverb live during playback
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
    // Apply echo live during playback
    if (isPlaying && masterPlaybackRef?.current) {
      masterPlaybackRef?.current?.updateEchoParams(newEcho);
    }
    addToHistory('Modified echo settings', 'Radio');
  };

  const addToHistory = (action, icon) => {
    const timestamp = new Date()?.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })?.replace(',', '');

    const newEntry = {
      id: Date.now(),
      action,
      timestamp,
      icon
    };

    setMixHistory(prev => [...prev?.slice(0, historyIndex + 1), newEntry]);
    setHistoryIndex(prev => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < mixHistory?.length - 1) {
      setHistoryIndex(prev => prev + 1);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  const handleLoadPreset = (preset) => {
    setChannels(prev => prev?.map(ch => ({
      ...ch,
      bass: preset?.settings?.bass,
      mid: preset?.settings?.mid,
      treble: preset?.settings?.treble
    })));
    addToHistory(`Loaded preset: ${preset?.name}`, 'Download');
  };

  const handleSavePreset = (name) => {
    addToHistory(`Saved preset: ${name}`, 'Save');
  };

  const handleCompare = (version) => {
    addToHistory(`Switched to version ${version}`, 'GitCompare');
  };

  const handleSaveVersion = (version) => {
    addToHistory(`Saved version ${version}`, 'Check');
  };

  const handleProceedToMastering = () => {
    navigate('/mastering-page');
  };

  const handleBackToRecording = () => {
    navigate('/recording-studio');
  };

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
                >
                  <span className="hidden md:inline">Back to Recording</span>
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