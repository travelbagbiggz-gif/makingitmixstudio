import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MetronomeControl = ({ enabled, bpm = 120, onToggle, disabled }) => {
  return (
    <div className="p-4 rounded-lg bg-card border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-studio ${
            enabled ? 'bg-accent/20' : 'bg-muted'
          }`}>
            <Icon 
              name="Music2" 
              size={20} 
              color={enabled ? 'var(--color-accent)' : 'var(--color-muted-foreground)'} 
            />
          </div>
          <div>
            <h4 className="text-sm font-medium">Metronome</h4>
            <p className="text-xs text-muted-foreground">
              {enabled ? `Active at ${bpm} BPM` : 'Click to enable'}
            </p>
          </div>
        </div>
        <Button
          variant={enabled ? 'default' : 'outline'}
          size="sm"
          onClick={onToggle}
          disabled={disabled}
          iconName={enabled ? 'Volume2' : 'VolumeX'}
          iconPosition="left"
        >
          {enabled ? 'On' : 'Off'}
        </Button>
      </div>
      {enabled && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent animate-pulse"
              style={{ 
                width: '25%',
                animation: `pulse ${60 / bpm}s cubic-bezier(0.4, 0, 0.6, 1) infinite`
              }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{bpm} BPM</span>
        </div>
      )}
    </div>
  );
};

export default MetronomeControl;