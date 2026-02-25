import React, { useEffect, useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';

const AudioMeter = ({ isRecording, level = 0 }) => {
  const [peakLevel, setPeakLevel] = useState(0);
  const [maxPeak, setMaxPeak] = useState(0);
  const peakHoldTimeoutRef = useRef(null);

  useEffect(() => {
    if (level > peakLevel) {
      setPeakLevel(level);
      
      // Clear existing timeout
      if (peakHoldTimeoutRef?.current) {
        clearTimeout(peakHoldTimeoutRef?.current);
      }
      
      // Peak hold for 1.5 seconds
      peakHoldTimeoutRef.current = setTimeout(() => {
        setPeakLevel(0);
      }, 1500);
    }

    // Track maximum peak for session
    if (level > maxPeak) {
      setMaxPeak(level);
    }
  }, [level]);

  // Reset max peak when recording stops
  useEffect(() => {
    if (!isRecording) {
      setMaxPeak(0);
    }
  }, [isRecording]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (peakHoldTimeoutRef?.current) {
        clearTimeout(peakHoldTimeoutRef?.current);
      }
    };
  }, []);

  const currentLevel = level;
  const meterColor =
    currentLevel > 85
      ? 'var(--color-error)'
      : currentLevel > 70
      ? 'var(--color-warning)'
      : 'var(--color-success)';

  // More accurate dB calculation
  const dbValue = Math.round((currentLevel / 100) * 60 - 60);
  const peakDbValue = Math.round((peakLevel / 100) * 60 - 60);

  return (
    <div className="p-4 rounded-lg bg-card border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Icon name="Activity" size={20} color="var(--color-accent)" />
          </div>
          <div>
            <h4 className="text-sm font-medium">Input Level</h4>
            <p className="text-xs text-muted-foreground">Microphone signal</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-data font-medium block">
            {dbValue} dB
          </span>
          {peakLevel > 0 && (
            <span className="text-xs text-muted-foreground font-mono">
              Peak: {peakDbValue} dB
            </span>
          )}
        </div>
      </div>
      <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-75"
          style={{
            width: `${currentLevel}%`,
            backgroundColor: meterColor,
          }}
        />
        {peakLevel > 0 && (
          <div
            className="absolute inset-y-0 w-0.5 bg-white shadow-lg transition-all duration-75"
            style={{
              left: `${peakLevel}%`,
            }}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-1">
            {Array.from({ length: 20 })?.map((_, i) => (
              <div
                key={i}
                className={`w-1 h-4 rounded-full transition-colors duration-75 ${
                  i < (currentLevel / 100) * 20
                    ? 'bg-white/80' :'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground font-mono">
        <span>-60 dB</span>
        <span>-40 dB</span>
        <span>-20 dB</span>
        <span>0 dB</span>
      </div>
      {currentLevel > 85 && (
        <div className="flex items-center gap-2 p-2 rounded bg-error/10 text-error animate-pulse">
          <Icon name="AlertTriangle" size={16} />
          <span className="text-xs font-medium">Signal clipping detected - reduce input gain</span>
        </div>
      )}
      {currentLevel < 10 && currentLevel > 0 && (
        <div className="flex items-center gap-2 p-2 rounded bg-warning/10 text-warning">
          <Icon name="Info" size={16} />
          <span className="text-xs font-medium">Input level very low - increase microphone gain</span>
        </div>
      )}
      {currentLevel >= 60 && currentLevel <= 85 && isRecording && (
        <div className="flex items-center gap-2 p-2 rounded bg-success/10 text-success">
          <Icon name="CheckCircle" size={16} />
          <span className="text-xs font-medium">Optimal recording level</span>
        </div>
      )}
      {maxPeak > 0 && isRecording && (
        <div className="text-xs text-muted-foreground font-mono">
          Session max: {Math.round((maxPeak / 100) * 60 - 60)} dB
        </div>
      )}
    </div>
  );
};

export default AudioMeter;