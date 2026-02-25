import React from 'react';
import Icon from '../../../components/AppIcon';

const AutotuneControls = ({ enabled, retuneSpeed, onToggle, onSpeedChange, disabled }) => {
  return (
    <div className="space-y-4 p-4 rounded-lg bg-card border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Icon name="Sparkles" size={20} color="var(--color-accent)" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Autotune</h3>
            <p className="text-xs text-muted-foreground">Pitch correction</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          disabled={disabled}
          className={`relative w-14 h-7 rounded-full transition-studio ${
            enabled ? 'bg-accent' : 'bg-muted'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-studio ${
              enabled ? 'translate-x-7' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      {enabled && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground font-mono">
              RETUNE SPEED
            </label>
            <span className="text-sm font-medium font-data">{retuneSpeed}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={retuneSpeed}
            onChange={(e) => onSpeedChange(parseInt(e?.target?.value))}
            disabled={disabled}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted"
            style={{
              background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${retuneSpeed}%, var(--color-muted) ${retuneSpeed}%, var(--color-muted) 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>Natural</span>
            <span>Robotic</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutotuneControls;