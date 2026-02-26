import React from 'react';
import Icon from '../../../components/AppIcon';
import AutotunePresetManager from './AutotunePresetManager';

const INTENSITY_PRESETS = [
  { id: 'subtle',   label: 'Subtle',    value: 20,  color: '#22c55e', desc: 'Light correction' },
  { id: 'natural',  label: 'Natural',   value: 40,  color: '#84cc16', desc: 'Smooth & musical' },
  { id: 'medium',   label: 'Medium',    value: 60,  color: '#eab308', desc: 'Noticeable tune' },
  { id: 'strong',   label: 'Strong',    value: 80,  color: '#f97316', desc: 'Heavy correction' },
  { id: 'hard',     label: 'Hard\nT-Pain', value: 100, color: '#ef4444', desc: 'Full robot effect' },
];

const AutotuneControls = ({
  enabled,
  retuneSpeed,
  onToggle,
  onSpeedChange,
  disabled,
  beatKey,
  monitoringEnabled,
  onMonitoringToggle,
  intensity,
  onIntensityChange,
  wetMix,
  onWetMixChange,
  beatVolume,
  onLoadPreset,
}) => {
  const activePreset = INTENSITY_PRESETS?.find(p => p?.value === intensity) || null;

  return (
    <div className="space-y-4 p-4 rounded-lg bg-card border border-border">
      {/* Autotune Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Icon name="Sparkles" size={20} color="var(--color-accent)" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Autotune</h3>
            <p className="text-xs text-muted-foreground">
              {beatKey ? `Key: ${beatKey} — Voloco style` : 'Pitch correction'}
            </p>
          </div>
        </div>
        <button
          onClick={onToggle}
          disabled={disabled}
          className={`relative w-14 h-7 rounded-full transition-studio ${
            enabled ? 'bg-accent' : 'bg-muted'
          } disabled:opacity-50`}
        >
          <span
            className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-studio ${
              enabled ? 'translate-x-7' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      {/* Status badge */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono ${
        enabled ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-muted/30 text-muted-foreground border border-border'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          enabled ? 'bg-accent animate-pulse' : 'bg-muted-foreground'
        }`} />
        {enabled
          ? beatKey
            ? `KEY-LOCKED: ${beatKey} — Voloco pitch correction active`
            : 'AUTOTUNE ACTIVE — chromatic pitch correction' :'AUTOTUNE OFF'}
      </div>
      {/* Beat key info */}
      {enabled && beatKey && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-900/20 border border-green-700/30">
          <Icon name="Music" size={13} color="#4ade80" />
          <span className="text-[10px] font-mono text-green-400">
            Vocals auto-tuned to <strong>{beatKey}</strong> scale — matches your beat's key
          </span>
        </div>
      )}
      {enabled && (
        <div className="space-y-4 pt-2 border-t border-border">

          {/* ── INTENSITY PRESETS ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground font-mono">INTENSITY PRESET</label>
              {activePreset && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: activePreset?.color + '22', color: activePreset?.color, border: `1px solid ${activePreset?.color}44` }}>
                  {activePreset?.label?.replace('\n', ' ')}
                </span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-1">
              {INTENSITY_PRESETS?.map(preset => (
                <button
                  key={preset?.id}
                  onClick={() => onIntensityChange?.(preset?.value)}
                  title={preset?.desc}
                  className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-md border text-[9px] font-mono transition-all ${
                    intensity === preset?.value
                      ? 'border-current text-white' :'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                  }`}
                  style={intensity === preset?.value ? { background: preset?.color + '33', borderColor: preset?.color, color: preset?.color } : {}}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: intensity === preset?.value ? preset?.color : '#4b5563' }} />
                  {preset?.label?.split('\n')?.map((line, i) => <span key={i}>{line}</span>)}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-muted-foreground/60 font-mono">
              {activePreset?.desc || 'Select a preset above'} — {intensity ?? 0}% intensity
            </p>
          </div>

          {/* ── WET / DRY MIX ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground font-mono">WET / DRY MIX</label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">DRY</span>
                <span className="text-sm font-medium font-data" style={{ color: wetMix >= 80 ? '#ef4444' : wetMix >= 50 ? '#f97316' : '#22c55e' }}>
                  {wetMix ?? 100}%
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">WET</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={wetMix ?? 100}
              onChange={(e) => onWetMixChange?.(parseInt(e?.target?.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #374151 0%, #374151 ${100 - (wetMix ?? 100)}%, var(--color-accent) ${100 - (wetMix ?? 100)}%, var(--color-accent) 100%)`,
              }}
            />
            <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
              <span>0% — Original only</span>
              <span>100% — Full autotune</span>
            </div>
            <p className="text-[9px] font-mono" style={{ color: (wetMix ?? 100) < 30 ? '#6b7280' : (wetMix ?? 100) >= 80 ? '#ef4444' : '#f97316' }}>
              {(wetMix ?? 100) < 30 ? '⚠ Too dry — raise wet mix to hear autotune effect' :
               (wetMix ?? 100) >= 80 ? '🔥 Full wet — maximum autotune effect (T-Pain mode)': '✓ Blended — natural autotune sound'}
            </p>
          </div>

          {/* ── RETUNE SPEED ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground font-mono">RETUNE SPEED</label>
              <span className="text-sm font-medium font-data">{retuneSpeed}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={retuneSpeed}
              onChange={(e) => onSpeedChange?.(parseInt(e?.target?.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted"
              style={{
                background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${retuneSpeed}%, var(--color-muted) ${retuneSpeed}%, var(--color-muted) 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>Natural</span>
              <span>Robotic (T-Pain)</span>
            </div>
          </div>
        </div>
      )}
      {/* Live Monitoring Toggle */}
      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
              monitoringEnabled ? 'bg-green-900/40' : 'bg-gray-800'
            }`}>
              <Icon name="Headphones" size={14} color={monitoringEnabled ? '#4ade80' : '#6b7280'} />
            </div>
            <div>
              <p className="text-xs font-medium">Live Monitoring</p>
              <p className="text-[10px] text-muted-foreground">
                {monitoringEnabled ? 'Hearing your voice live' : 'Off — no latency delay'}
              </p>
            </div>
          </div>
          <button
            onClick={onMonitoringToggle}
            className={`relative w-12 h-6 rounded-full transition-all ${
              monitoringEnabled ? 'bg-green-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                monitoringEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <p className="text-[9px] font-mono text-gray-600 mt-1.5">
          Turn OFF if you hear echo/delay in headphones. Turn ON to hear yourself while recording.
        </p>
      </div>

      {/* Preset Manager */}
      <AutotunePresetManager
        intensity={intensity}
        wetMix={wetMix}
        beatVolume={beatVolume}
        retuneSpeed={retuneSpeed}
        onLoadPreset={onLoadPreset}
      />
    </div>
  );
};

export default AutotuneControls;