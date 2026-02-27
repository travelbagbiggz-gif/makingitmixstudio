import React, { useCallback } from 'react';
import Icon from '../../../components/AppIcon';

// Convert linear gain (0–1) to dB string
const gainToDb = (gain) => {
  if (gain <= 0) return '-∞';
  const db = 20 * Math.log10(gain);
  if (db <= -60) return '-∞';
  return (db >= 0 ? '+' : '') + db?.toFixed(1);
};

// Convert linear gain to fill percentage for visual bar
const gainToPercent = (gain) => Math.round(gain * 100);

const CHANNELS = [
  { key: 'beat',   label: 'Beat',    color: '#a855f7', icon: 'Music' },
  { key: 'verse1', label: 'Verse 1', color: '#ef4444', icon: 'Mic' },
  { key: 'verse2', label: 'Verse 2', color: '#f97316', icon: 'Mic' },
  { key: 'verse3', label: 'Verse 3', color: '#eab308', icon: 'Mic' },
  { key: 'hook',   label: 'Hook',    color: '#22c55e', icon: 'Sparkles' },
];

const ChannelFaders = ({ volumes, onVolumeChange, disabled = false }) => {
  const handleChange = useCallback((key, value) => {
    if (disabled) return;
    onVolumeChange?.(key, parseFloat(value));
  }, [disabled, onVolumeChange]);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="SlidersHorizontal" size={13} color="#a855f7" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Channel Faders</span>
        <span className="ml-auto text-[9px] font-mono text-gray-600">Balance playback levels</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {CHANNELS?.map(({ key, label, color, icon }) => {
          const gain = volumes?.[key] ?? 1.0;
          const pct = gainToPercent(gain);
          const db = gainToDb(gain);
          const isUnity = Math.abs(gain - 1.0) < 0.01;

          return (
            <div key={key} className="flex flex-col items-center gap-1.5">
              {/* Channel icon + label */}
              <div className="flex flex-col items-center gap-0.5">
                <Icon name={icon} size={11} color={color} />
                <span
                  className="text-[8px] font-mono font-bold leading-none"
                  style={{ color }}
                >
                  {label}
                </span>
              </div>
              {/* Vertical fader track */}
              <div className="relative flex flex-col items-center" style={{ height: 80 }}>
                {/* Track background */}
                <div
                  className="absolute inset-x-0 mx-auto rounded-full"
                  style={{
                    width: 6,
                    top: 0,
                    bottom: 0,
                    background: '#374151',
                  }}
                />
                {/* Fill */}
                <div
                  className="absolute inset-x-0 mx-auto rounded-full transition-all"
                  style={{
                    width: 6,
                    bottom: 0,
                    height: `${pct}%`,
                    background: gain > 0.85
                      ? color
                      : gain > 0.4
                      ? `${color}99`
                      : '#4b5563',
                  }}
                />
                {/* Unity mark at 100% */}
                <div
                  className="absolute inset-x-0 mx-auto"
                  style={{
                    width: 12,
                    height: 1,
                    background: isUnity ? '#ffffff40' : '#ffffff18',
                    top: 0, // unity = top of track = 100%
                  }}
                />
                {/* Invisible range input overlaid */}
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={gain}
                  disabled={disabled}
                  onChange={(e) => handleChange(key, e?.target?.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  style={{
                    writingMode: 'vertical-lr',
                    direction: 'rtl',
                    width: '100%',
                    height: '100%',
                  }}
                  title={`${label}: ${db} dB`}
                />
                {/* Visible thumb */}
                <div
                  className="absolute inset-x-0 mx-auto rounded-sm border pointer-events-none transition-all"
                  style={{
                    width: 16,
                    height: 8,
                    bottom: `calc(${pct}% - 4px)`,
                    background: disabled ? '#374151' : color,
                    borderColor: disabled ? '#4b5563' : `${color}80`,
                    boxShadow: disabled ? 'none' : `0 0 6px ${color}60`,
                  }}
                />
              </div>
              {/* dB readout */}
              <div
                className="text-[8px] font-mono font-bold px-1 py-0.5 rounded leading-none"
                style={{
                  background: isUnity ? '#1f2937' : gain > 0 ? '#111827' : '#1f2937',
                  color: gain === 0 ? '#6b7280' : isUnity ? '#9ca3af' : color,
                  minWidth: 28,
                  textAlign: 'center',
                }}
              >
                {db}
              </div>
              {/* Reset to unity button */}
              <button
                onClick={() => handleChange(key, 1.0)}
                disabled={disabled || isUnity}
                className="text-[7px] font-mono text-gray-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors leading-none"
                title="Reset to 0 dB"
              >
                0dB
              </button>
            </div>
          );
        })}
      </div>
      {/* Mute-all / Reset-all row */}
      <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-gray-800">
        <button
          onClick={() => CHANNELS?.forEach(({ key }) => onVolumeChange?.(key, 1.0))}
          disabled={disabled}
          className="text-[8px] font-mono text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-0.5 border border-gray-700 hover:border-gray-500 rounded"
        >
          Reset All
        </button>
      </div>
    </div>
  );
};

export default ChannelFaders;
