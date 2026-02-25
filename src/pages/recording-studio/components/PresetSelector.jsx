import React from 'react';
import Icon from '../../../components/AppIcon';

const PresetSelector = ({ selectedPreset, onPresetChange, disabled }) => {
  const presets = [
    {
      id: 'melodic',
      name: 'Melodic',
      icon: 'Mic2',
      description: 'Autotune Rap',
      color: '#8b5cf6',
    },
    {
      id: 'hiphop',
      name: 'Hip-Hop',
      icon: 'Music2',
      description: 'Classic Rap',
      color: '#f59e0b',
    },
    {
      id: 'rnb',
      name: 'R&B',
      icon: 'Music',
      description: 'Smooth Vocals',
      color: '#ec4899',
    },
    {
      id: 'pop',
      name: 'Pop',
      icon: 'Radio',
      description: 'Bright & Clear',
      color: '#3b82f6',
    },
    {
      id: 'jazz',
      name: 'Jazz',
      icon: 'Music4',
      description: 'Natural & Warm',
      color: '#10b981',
    },
  ];

  const handlePresetClick = (presetId) => {
    if (!disabled && onPresetChange) {
      onPresetChange(presetId);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider font-mono">
        Vocal Preset
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {presets?.map((preset) => {
          const isSelected = selectedPreset === preset?.id;
          return (
            <button
              key={preset?.id}
              onClick={() => handlePresetClick(preset?.id)}
              disabled={disabled}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200 ease-in-out
                ${isSelected
                  ? 'border-accent bg-accent/20 shadow-lg shadow-accent/20 scale-105'
                  : 'border-border bg-card hover:border-accent/50 hover:bg-accent/5 hover:scale-102 active:scale-95'
                }
                ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={{
                transform: isSelected ? 'scale(1.05)' : undefined,
              }}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div
                  className={`
                    w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200
                    ${isSelected ? 'bg-accent/30 shadow-md' : 'bg-muted hover:bg-accent/10'}
                  `}
                >
                  <Icon
                    name={preset?.icon}
                    size={24}
                    color={isSelected ? preset?.color : 'currentColor'}
                    className="transition-all duration-200"
                  />
                </div>
                <div>
                  <div className={`font-semibold text-sm transition-colors ${
                    isSelected ? 'text-accent' : 'text-foreground'
                  }`}>
                    {preset?.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {preset?.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {disabled && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Upload a beat to enable preset selection
        </p>
      )}
    </div>
  );
};

export default PresetSelector;