import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const ABPreview = ({ isProcessing }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeVersion, setActiveVersion] = useState('master');
  const [playbackPosition, setPlaybackPosition] = useState(45);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const versions = [
    { id: 'original', label: 'Original Mix', icon: 'FileAudio' },
    { id: 'master', label: 'Mastered', icon: 'Sparkles' }
  ];

  return (
    <div className="p-4 md:p-6 rounded-lg bg-card border border-border space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">A/B Comparison</h3>
          <p className="text-sm text-muted-foreground">
            Compare original mix with mastered version
          </p>
        </div>
      </div>

      {/* Version Selector */}
      <div className="flex gap-2">
        {versions?.map((version) => (
          <button
            key={version?.id}
            onClick={() => setActiveVersion(version?.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
              activeVersion === version?.id
                ? "border-accent bg-accent/10" :"border-border hover:border-accent/50"
            )}
          >
            <Icon name={version?.icon} size={18} color={activeVersion === version?.id ? 'var(--color-accent)' : 'currentColor'} />
            <span className="text-sm font-medium">{version?.label}</span>
          </button>
        ))}
      </div>

      {/* Waveform Visualization */}
      <div className="space-y-3">
        <div className="relative h-24 bg-muted rounded-lg overflow-hidden">
          {/* Original waveform (background) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <svg width="100%" height="100%" className="text-muted-foreground">
              <path
                d="M 0 48 Q 50 20, 100 48 T 200 48 T 300 48 T 400 48 T 500 48 T 600 48 T 700 48 T 800 48"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>
          {/* Mastered waveform (foreground) */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity",
            activeVersion === 'master' ? 'opacity-100' : 'opacity-0'
          )}>
            <svg width="100%" height="100%" className="text-accent">
              <path
                d="M 0 48 Q 50 10, 100 48 T 200 48 T 300 48 T 400 48 T 500 48 T 600 48 T 700 48 T 800 48"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
              />
            </svg>
          </div>
          {/* Playback position indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-accent"
            style={{ left: `${playbackPosition}%` }}
          />
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePlayPause}
            disabled={isProcessing}
          >
            <Icon name={isPlaying ? 'Pause' : 'Play'} size={18} />
          </Button>
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="100"
              value={playbackPosition}
              onChange={(e) => setPlaybackPosition(Number(e?.target?.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${playbackPosition}%, var(--color-muted) ${playbackPosition}%, var(--color-muted) 100%)`
              }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground min-w-[60px] text-right">
            {Math.floor((playbackPosition / 100) * 180)}s / 180s
          </span>
        </div>
      </div>

      {/* Comparison Stats */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Original</p>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-data font-semibold">-18.5 LUFS</span>
            <span className="text-xs text-muted-foreground">Peak: -3.2 dB</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Mastered</p>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-data font-semibold text-accent">-14.0 LUFS</span>
            <span className="text-xs text-muted-foreground">Peak: -0.8 dB</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ABPreview;