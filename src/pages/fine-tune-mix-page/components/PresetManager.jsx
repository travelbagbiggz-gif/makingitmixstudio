import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const PresetManager = ({ onLoadPreset, onSavePreset }) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);

  const presets = [
    {
      id: 1,
      name: 'Hip Hop Punch',
      description: 'Heavy bass, crisp highs, tight reverb',
      icon: 'Zap',
      settings: { bass: 3, mid: -1, treble: 2 }
    },
    {
      id: 2,
      name: 'R&B Smooth',
      description: 'Warm mids, subtle reverb, gentle compression',
      icon: 'Heart',
      settings: { bass: 1, mid: 2, treble: 0 }
    },
    {
      id: 3,
      name: 'Pop Bright',
      description: 'Balanced EQ, wide stereo, modern sheen',
      icon: 'Sparkles',
      settings: { bass: 0, mid: 1, treble: 3 }
    },
    {
      id: 4,
      name: 'Jazz Vintage',
      description: 'Natural warmth, room ambience, classic tone',
      icon: 'Music2',
      settings: { bass: 2, mid: 0, treble: -1 }
    }
  ];

  const handleLoadPreset = (preset) => {
    setSelectedPreset(preset?.id);
    onLoadPreset(preset);
  };

  const handleSavePreset = () => {
    if (presetName?.trim()) {
      onSavePreset(presetName);
      setPresetName('');
      setShowSaveDialog(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center bg-primary/15">
            <Icon name="Save" size={24} color="var(--color-primary)" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-semibold text-foreground">Mix Presets</h3>
            <p className="text-xs md:text-sm text-muted-foreground">Load or save mix settings</p>
          </div>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowSaveDialog(!showSaveDialog)}
          iconName="Plus"
          iconPosition="left"
        >
          <span className="hidden md:inline">Save Current</span>
          <span className="md:hidden">Save</span>
        </Button>
      </div>
      {showSaveDialog && (
        <div className="mb-4 md:mb-6 p-4 bg-muted rounded-lg space-y-3">
          <Input
            type="text"
            label="Preset Name"
            placeholder="Enter preset name..."
            value={presetName}
            onChange={(e) => setPresetName(e?.target?.value)}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleSavePreset}
              disabled={!presetName?.trim()}
              fullWidth
            >
              Save Preset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowSaveDialog(false);
                setPresetName('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {presets?.map((preset) => (
          <button
            key={preset?.id}
            onClick={() => handleLoadPreset(preset)}
            className={`p-4 rounded-lg text-left transition-studio ${
              selectedPreset === preset?.id
                ? 'bg-accent/15 border-2 border-accent' :'bg-muted hover:bg-muted/80 border-2 border-transparent'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                selectedPreset === preset?.id ? 'bg-accent/20' : 'bg-background'
              }`}>
                <Icon 
                  name={preset?.icon} 
                  size={20} 
                  color={selectedPreset === preset?.id ? 'var(--color-accent)' : 'var(--color-muted-foreground)'} 
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm md:text-base font-semibold mb-1 ${
                  selectedPreset === preset?.id ? 'text-foreground' : 'text-foreground'
                }`}>
                  {preset?.name}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {preset?.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    B:{preset?.settings?.bass > 0 ? '+' : ''}{preset?.settings?.bass}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    M:{preset?.settings?.mid > 0 ? '+' : ''}{preset?.settings?.mid}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    T:{preset?.settings?.treble > 0 ? '+' : ''}{preset?.settings?.treble}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{presets?.length} presets available</span>
          {selectedPreset && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Preset loaded
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresetManager;