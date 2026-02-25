import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const MasteringMeter = ({ selectedTarget, isProcessing, audioMetrics }) => {
  const [currentLUFS, setCurrentLUFS] = useState(audioMetrics?.currentLUFS || -18.5);
  const [peakLevel, setPeakLevel] = useState(audioMetrics?.peakLevel || -3.2);
  const [dynamicRange, setDynamicRange] = useState(audioMetrics?.dynamicRange || 8.5);
  const [stereoCorrelation, setStereoCorrelation] = useState(audioMetrics?.stereoCorrelation || 0.85);

  // Update metrics when audioMetrics prop changes
  useEffect(() => {
    if (audioMetrics) {
      setCurrentLUFS(audioMetrics?.currentLUFS || -18.5);
      setPeakLevel(audioMetrics?.peakLevel || -3.2);
      setDynamicRange(audioMetrics?.dynamicRange || 8.5);
      setStereoCorrelation(audioMetrics?.stereoCorrelation || 0.85);
    }
  }, [audioMetrics]);

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setCurrentLUFS(prev => {
          const target = selectedTarget?.lufs || -14;
          const diff = target - prev;
          return prev + diff * 0.1;
        });
        setPeakLevel(prev => Math.max(-0.1, prev + (Math.random() - 0.5) * 0.5));
        setDynamicRange(prev => Math.max(6, Math.min(12, prev + (Math.random() - 0.5) * 0.3)));
        setStereoCorrelation(prev => Math.max(0.7, Math.min(1, prev + (Math.random() - 0.5) * 0.05)));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isProcessing, selectedTarget]);

  const getLUFSColor = () => {
    const diff = Math.abs(currentLUFS - (selectedTarget?.lufs || -14));
    if (diff < 0.5) return 'var(--color-success)';
    if (diff < 2) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  const getPeakColor = () => {
    if (peakLevel > -0.5) return 'var(--color-error)';
    if (peakLevel > -1.5) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  const lufsPercentage = Math.min(100, Math.max(0, ((currentLUFS + 30) / 30) * 100));
  const peakPercentage = Math.min(100, Math.max(0, ((peakLevel + 60) / 60) * 100));

  return (
    <div className="p-4 md:p-6 rounded-lg bg-card border border-border space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">Mastering Meter</h3>
          <p className="text-sm text-muted-foreground">
            Real-time analysis of your master
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-medium">Live</span>
        </div>
      </div>

      {/* LUFS Meter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Activity" size={18} color="var(--color-accent)" />
            <span className="text-sm font-medium">Integrated LUFS</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Target: {selectedTarget?.lufs} LUFS</span>
            <span className="text-lg font-data font-bold" style={{ color: getLUFSColor() }}>
              {currentLUFS?.toFixed(1)} LUFS
            </span>
          </div>
        </div>
        <div className="relative h-10 bg-muted rounded-lg overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-300"
            style={{
              width: `${lufsPercentage}%`,
              background: `linear-gradient(to right, var(--color-success), var(--color-warning), var(--color-error))`
            }}
          />
          <div className="absolute inset-0 flex items-center px-3">
            <div className="flex justify-between w-full text-xs font-mono text-white/80">
              <span>-30</span>
              <span>-20</span>
              <span>-10</span>
              <span>0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Peak Level */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="BarChart3" size={18} color="var(--color-accent)" />
            <span className="text-sm font-medium">Peak Level</span>
          </div>
          <span className="text-lg font-data font-bold" style={{ color: getPeakColor() }}>
            {peakLevel?.toFixed(1)} dB
          </span>
        </div>
        <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-100"
            style={{
              width: `${peakPercentage}%`,
              backgroundColor: getPeakColor()
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-1">
              {Array.from({ length: 24 })?.map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-4 rounded-full ${
                    i < (peakPercentage / 100) * 24 ? 'bg-white/80' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Icon name="Waves" size={16} color="var(--color-accent)" />
            <span className="text-sm">Dynamic Range</span>
          </div>
          <span className="text-sm font-data font-semibold">{dynamicRange?.toFixed(1)} dB</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Icon name="Headphones" size={16} color="var(--color-accent)" />
            <span className="text-sm">Stereo Correlation</span>
          </div>
          <span className="text-sm font-data font-semibold">{(stereoCorrelation * 100)?.toFixed(0)}%</span>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="space-y-2">
        {peakLevel > -0.5 && (
          <div className="flex items-center gap-2 p-2 rounded bg-error/10 text-error">
            <Icon name="AlertTriangle" size={16} />
            <span className="text-xs font-medium">Peak level too high - clipping may occur</span>
          </div>
        )}
        {Math.abs(currentLUFS - (selectedTarget?.lufs || -14)) < 0.5 && (
          <div className="flex items-center gap-2 p-2 rounded bg-success/10 text-success">
            <Icon name="CheckCircle" size={16} />
            <span className="text-xs font-medium">Target loudness achieved</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasteringMeter;