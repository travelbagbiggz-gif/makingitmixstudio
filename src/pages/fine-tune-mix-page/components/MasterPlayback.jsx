import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MasterPlayback = ({ isPlaying, onPlayPause, onStop, duration = 180 }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformData, setWaveformData] = useState([]);

  useEffect(() => {
    const mockWaveform = Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.2);
    setWaveformData(mockWaveform);
  }, []);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            onStop();
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration, onStop]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs?.toString()?.padStart(2, '0')}`;
  };

  const progress = (currentTime / duration) * 100;

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
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-mono text-muted-foreground">Ready</span>
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
            onClick={onStop}
            disabled={currentTime === 0}
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
          >
            <Icon name="SkipForward" size={20} />
          </Button>
        </div>

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
};

export default MasterPlayback;