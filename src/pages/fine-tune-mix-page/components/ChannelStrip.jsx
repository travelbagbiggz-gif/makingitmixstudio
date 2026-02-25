import React from 'react';
import Icon from '../../../components/AppIcon';

const ChannelStrip = ({ 
  channel, 
  onFaderChange, 
  onReverbChange, 
  onTelephoneToggle,
  showReverb = false 
}) => {
  const handleFaderChange = (type, value) => {
    onFaderChange(channel?.id, type, value);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center bg-accent/15">
            <Icon name={channel?.icon} size={20} color="var(--color-accent)" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-semibold text-foreground">{channel?.name}</h3>
            <p className="text-xs text-muted-foreground">{channel?.type}</p>
          </div>
        </div>
        <button
          onClick={() => onTelephoneToggle(channel?.id)}
          className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-studio ${
            channel?.telephoneEnabled 
              ? 'bg-accent text-accent-foreground' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
          aria-label="Toggle telephone preset"
        >
          <Icon name="Phone" size={18} />
        </button>
      </div>
      <div className="space-y-4 md:space-y-6">
        <FaderControl
          label="Bass"
          value={channel?.bass}
          onChange={(value) => handleFaderChange('bass', value)}
          color="var(--color-error)"
        />
        <FaderControl
          label="Mid"
          value={channel?.mid}
          onChange={(value) => handleFaderChange('mid', value)}
          color="var(--color-warning)"
        />
        <FaderControl
          label="Treble"
          value={channel?.treble}
          onChange={(value) => handleFaderChange('treble', value)}
          color="var(--color-success)"
        />
        
        {showReverb && (
          <FaderControl
            label="Plate Reverb"
            value={channel?.reverb}
            onChange={(value) => onReverbChange(channel?.id, value)}
            color="var(--color-secondary)"
          />
        )}
      </div>
      <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border">
        <div className="flex items-center justify-between text-xs md:text-sm">
          <span className="text-muted-foreground font-mono">Level</span>
          <span className="font-data text-foreground">{channel?.level?.toFixed(1)} dB</span>
        </div>
        <div className="mt-2 h-1.5 md:h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${Math.min(100, (channel?.level + 60) / 60 * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const FaderControl = ({ label, value, onChange, color }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs md:text-sm font-medium text-foreground">{label}</label>
        <span className="text-xs md:text-sm font-data text-muted-foreground">
          {value > 0 ? '+' : ''}{value?.toFixed(1)} dB
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min="-12"
          max="12"
          step="0.1"
          value={value}
          onChange={(e) => onChange(parseFloat(e?.target?.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${((value + 12) / 24) * 100}%, var(--color-muted) ${((value + 12) / 24) * 100}%, var(--color-muted) 100%)`
          }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-border pointer-events-none"
          style={{ left: '50%' }}
        />
      </div>
    </div>
  );
};

export default ChannelStrip;