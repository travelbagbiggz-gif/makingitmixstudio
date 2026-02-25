import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import LoudnessTargetSelector from './components/LoudnessTargetSelector';
import MasteringMeter from './components/MasteringMeter';
import ABPreview from './components/ABPreview';
import ExportOptions from './components/ExportOptions';

const MasteringPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTarget, setSelectedTarget] = useState('streaming');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState('wav');
  const [metadata, setMetadata] = useState({
    artist: '',
    title: '',
    album: ''
  });
  const [audioMetrics, setAudioMetrics] = useState({
    currentLUFS: -18.5,
    peakLevel: -3.2,
    dynamicRange: 8.5,
    stereoCorrelation: 0.85
  });
  const [normalizationApplied, setNormalizationApplied] = useState(false);
  const audioContextRef = useRef(null);
  const audioBufferRef = useRef(null);

  const loudnessTargets = [
    {
      id: 'streaming',
      name: 'Streaming',
      lufs: -14,
      description: 'Optimized for Spotify, Apple Music, YouTube',
      icon: 'Radio',
      color: 'var(--color-accent)'
    },
    {
      id: 'loud',
      name: 'Loud',
      lufs: -9,
      description: 'High-energy commercial sound',
      icon: 'Volume2',
      color: 'var(--color-warning)'
    },
    {
      id: 'club',
      name: 'Club',
      lufs: -6,
      description: 'Maximum loudness for club systems',
      icon: 'Zap',
      color: 'var(--color-error)'
    }
  ];

  // Audio normalization function
  const normalizeAudio = async (audioBuffer, targetLUFS) => {
    try {
      const channelData = audioBuffer?.getChannelData(0);
      const sampleRate = audioBuffer?.sampleRate;
      
      // Calculate RMS (Root Mean Square) for loudness estimation
      let sumSquares = 0;
      for (let i = 0; i < channelData?.length; i++) {
        sumSquares += channelData?.[i] * channelData?.[i];
      }
      const rms = Math.sqrt(sumSquares / channelData?.length);
      
      // Convert RMS to dB (approximate LUFS)
      const currentLUFS = 20 * Math.log10(rms) - 0.691; // K-weighting approximation
      
      // Find peak level
      let peakLevel = 0;
      for (let i = 0; i < channelData?.length; i++) {
        const absValue = Math.abs(channelData?.[i]);
        if (absValue > peakLevel) peakLevel = absValue;
      }
      const peakdB = 20 * Math.log10(peakLevel);
      
      // Calculate required gain adjustment
      const gainAdjustmentdB = targetLUFS - currentLUFS;
      const gainMultiplier = Math.pow(10, gainAdjustmentdB / 20);
      
      // Check if normalization would cause clipping
      const newPeakLevel = peakLevel * gainMultiplier;
      const headroom = 0.1; // -0.5 dB headroom to prevent clipping
      
      let finalGainMultiplier = gainMultiplier;
      if (newPeakLevel > (1.0 - headroom)) {
        // Reduce gain to prevent clipping
        finalGainMultiplier = (1.0 - headroom) / peakLevel;
        console.log('Gain reduced to prevent clipping');
      }
      
      // Calculate final metrics
      const finalPeakLevel = peakLevel * finalGainMultiplier;
      const finalPeakdB = 20 * Math.log10(finalPeakLevel);
      const finalLUFS = currentLUFS + (20 * Math.log10(finalGainMultiplier));
      
      return {
        currentLUFS: parseFloat(currentLUFS?.toFixed(1)),
        targetLUFS,
        finalLUFS: parseFloat(finalLUFS?.toFixed(1)),
        peakLevel: parseFloat(peakdB?.toFixed(1)),
        finalPeakLevel: parseFloat(finalPeakdB?.toFixed(1)),
        gainAdjustmentdB: parseFloat(gainAdjustmentdB?.toFixed(1)),
        gainMultiplier: finalGainMultiplier,
        clippingPrevented: newPeakLevel > (1.0 - headroom)
      };
    } catch (error) {
      console.error('Normalization error:', error);
      return null;
    }
  };

  const handleStartMastering = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setNormalizationApplied(false);
    
    try {
      // Initialize audio context if needed
      if (!audioContextRef?.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const targetLUFS = loudnessTargets?.find(t => t?.id === selectedTarget)?.lufs || -14;
      
      // Simulate audio loading (in real implementation, load actual audio file)
      setProcessingProgress(10);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create mock audio buffer for demonstration
      // In production, this would load the actual mixed audio
      const sampleRate = 48000;
      const duration = 3; // 3 seconds
      const mockBuffer = audioContextRef?.current?.createBuffer(2, sampleRate * duration, sampleRate);
      
      // Fill with mock audio data (sine wave with varying amplitude)
      for (let channel = 0; channel < mockBuffer?.numberOfChannels; channel++) {
        const channelData = mockBuffer?.getChannelData(channel);
        for (let i = 0; i < channelData?.length; i++) {
          // Generate audio with peaks around -3dB
          channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.7;
        }
      }
      
      audioBufferRef.current = mockBuffer;
      setProcessingProgress(30);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Perform audio normalization
      const normalizationResult = await normalizeAudio(mockBuffer, targetLUFS);
      
      if (normalizationResult) {
        setProcessingProgress(60);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Update metrics with normalized values
        setAudioMetrics({
          currentLUFS: normalizationResult?.finalLUFS,
          peakLevel: normalizationResult?.finalPeakLevel,
          dynamicRange: 8.5,
          stereoCorrelation: 0.85
        });
        
        setNormalizationApplied(true);
        console.log('Normalization applied:', normalizationResult);
        
        setProcessingProgress(80);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Complete processing
      setProcessingProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error('Mastering error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturnToMix = () => {
    navigate('/fine-tune-mix-page');
  };

  const handleExport = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      // Calculate file size (mock calculation based on format and duration)
      const duration = audioBufferRef?.current?.duration || 180; // 3 minutes default
      const bitrate = exportFormat === 'wav' ? 1411200 : exportFormat === 'flac' ? 800000 : 320000; // bps
      const estimatedFileSize = Math.floor((bitrate * duration) / 8); // bytes

      // Log export start
      const { error: logStartError } = await supabase
        ?.from('export_logs')
        ?.insert({
          user_id: user?.id,
          session_id: null, // Would be actual session ID in production
          action: 'export_started',
          export_format: exportFormat,
          status: 'processing',
          metadata: {
            artist: metadata?.artist,
            title: metadata?.title,
            album: metadata?.album,
            loudness_target: selectedTarget
          }
        });

      if (logStartError) {
        console.error('Error logging export start:', logStartError);
      }

      // Simulate export process
      console.log('Exporting with format:', exportFormat, 'metadata:', metadata);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create mastering export record
      const { data: exportData, error: exportError } = await supabase
        ?.from('mastering_exports')
        ?.insert({
          user_id: user?.id,
          session_id: null, // Would be actual session ID in production
          export_format: exportFormat,
          file_size: estimatedFileSize,
          loudness_target: selectedTarget,
          metadata: {
            artist: metadata?.artist,
            title: metadata?.title,
            album: metadata?.album,
            current_lufs: audioMetrics?.currentLUFS,
            peak_level: audioMetrics?.peakLevel,
            dynamic_range: audioMetrics?.dynamicRange
          }
        })
        ?.select()
        ?.single();

      if (exportError) {
        throw exportError;
      }

      // Log export completion
      const { error: logCompleteError } = await supabase
        ?.from('export_logs')
        ?.insert({
          user_id: user?.id,
          session_id: null,
          export_id: exportData?.id,
          action: 'export_completed',
          export_format: exportFormat,
          file_size: estimatedFileSize,
          status: 'success',
          metadata: {
            artist: metadata?.artist,
            title: metadata?.title,
            album: metadata?.album
          }
        });

      if (logCompleteError) {
        console.error('Error logging export completion:', logCompleteError);
      }

      console.log('Export logged successfully:', exportData);
      alert(`Export successful! Format: ${exportFormat?.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);

      // Log export failure
      if (user) {
        await supabase
          ?.from('export_logs')
          ?.insert({
            user_id: user?.id,
            session_id: null,
            action: 'export_failed',
            export_format: exportFormat,
            status: 'error',
            error_message: error?.message || 'Unknown error',
            metadata: {
              artist: metadata?.artist,
              title: metadata?.title,
              album: metadata?.album
            }
          });
      }

      alert('Export failed. Please try again.');
    }
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
                  Mastering
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Finalize your track with professional loudness targeting and comprehensive metering
                </p>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReturnToMix}
                  iconName="ArrowLeft"
                  iconPosition="left"
                >
                  <span className="hidden md:inline">Return to Mix</span>
                  <span className="md:hidden">Back</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStartMastering}
                  disabled={isProcessing}
                  loading={isProcessing}
                  iconName="Play"
                  iconPosition="left"
                >
                  <span className="hidden md:inline">{isProcessing ? 'Processing...' : 'Start Mastering'}</span>
                  <span className="md:hidden">{isProcessing ? 'Processing' : 'Master'}</span>
                </Button>
              </div>
            </div>

            {isProcessing && (
              <div className="mt-4 p-4 rounded-lg bg-accent/10 border border-accent/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon name="Loader" size={16} color="var(--color-accent)" className="animate-spin" />
                    <span className="text-sm font-medium">
                      {processingProgress < 30 ? 'Loading audio...' :
                       processingProgress < 60 ? 'Analyzing peaks...' :
                       processingProgress < 80 ? 'Normalizing audio...': 'Finalizing master...'}
                    </span>
                  </div>
                  <span className="text-sm font-data">{processingProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {processingProgress < 100 ? 
                    `Estimated time remaining: ${Math.ceil((100 - processingProgress) / 20)} seconds` :
                    'Processing complete!'}
                </p>
              </div>
            )}
            
            {normalizationApplied && !isProcessing && (
              <div className="mt-4 p-4 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-2">
                  <Icon name="CheckCircle" size={18} color="var(--color-success)" />
                  <span className="text-sm font-medium text-success">
                    Audio normalized to {loudnessTargets?.find(t => t?.id === selectedTarget)?.lufs} LUFS - Ready for export
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <LoudnessTargetSelector
                targets={loudnessTargets}
                selectedTarget={selectedTarget}
                onSelectTarget={setSelectedTarget}
              />

              <MasteringMeter
                selectedTarget={loudnessTargets?.find(t => t?.id === selectedTarget)}
                isProcessing={isProcessing}
                audioMetrics={audioMetrics}
              />

              <ABPreview isProcessing={isProcessing} />
            </div>

            <div className="space-y-6">
              <ExportOptions
                format={exportFormat}
                onFormatChange={setExportFormat}
                metadata={metadata}
                onMetadataChange={setMetadata}
                onExport={handleExport}
                disabled={isProcessing || processingProgress < 100}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MasteringPage;