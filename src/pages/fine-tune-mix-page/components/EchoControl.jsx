import React from 'react';
import Icon from '../../../components/AppIcon';

const EchoControl = ({ echo, onChange }) => {
  const noteValues = [
    { value: '1/2', label: '1/2', ms: 1000 },
    { value: '1/4', label: '1/4', ms: 500 },
    { value: '1/8', label: '1/8', ms: 250 },
    { value: '1/16', label: '1/16', ms: 125 }
  ];

  const handleWetChange = (value) => {
    onChange({ ...echo, wet: value });
  };

  const handleNoteChange = (noteValue) => {
    onChange({ ...echo, noteValue });
  };

  const handleDurationChange = (value) => {
    onChange({ ...echo, duration: value });
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center bg-secondary/15">
          <Icon name="Radio" size={24} color="var(--color-secondary)" />
        </div>
        <div>
          <h3 className="text-base md:text-lg font-semibold text-foreground">Echo Control</h3>
          <p className="text-xs md:text-sm text-muted-foreground">Delay & Feedback</p>
        </div>
      </div>
      <div className="space-y-4 md:space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs md:text-sm font-medium text-foreground">Wet/Dry Mix</label>
            <span className="text-xs md:text-sm font-data text-muted-foreground">{echo?.wet}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={echo?.wet}
            onChange={(e) => handleWetChange(parseInt(e?.target?.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--color-secondary) 0%, var(--color-secondary) ${echo?.wet}%, var(--color-muted) ${echo?.wet}%, var(--color-muted) 100%)`
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs md:text-sm font-medium text-foreground block mb-3">Note Value</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {noteValues?.map((note) => (
              <button
                key={note?.value}
                onClick={() => handleNoteChange(note?.value)}
                className={`px-3 py-2 md:px-4 md:py-3 rounded-lg text-xs md:text-sm font-mono font-medium transition-studio ${
                  echo?.noteValue === note?.value
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {note?.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {noteValues?.find(n => n?.value === echo?.noteValue)?.ms}ms delay
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs md:text-sm font-medium text-foreground">Duration</label>
            <span className="text-xs md:text-sm font-data text-muted-foreground">{echo?.duration}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={echo?.duration}
            onChange={(e) => handleDurationChange(parseInt(e?.target?.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${echo?.duration}%, var(--color-muted) ${echo?.duration}%, var(--color-muted) 100%)`
            }}
          />
        </div>
      </div>
      <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border">
        <div className="flex items-center justify-between text-xs md:text-sm">
          <span className="text-muted-foreground">Echo Active</span>
          <div className={`w-2 h-2 rounded-full ${echo?.wet > 0 ? 'bg-success animate-pulse' : 'bg-muted'}`} />
        </div>
      </div>
    </div>
  );
};

export default EchoControl;