import React from 'react';
import Icon from '../../../components/AppIcon';
import { cn } from '../../../utils/cn';

const LoudnessTargetSelector = ({ targets, selectedTarget, onSelectTarget }) => {
  return (
    <div className="p-4 md:p-6 rounded-lg bg-card border border-border">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">Loudness Target</h3>
        <p className="text-sm text-muted-foreground">
          Choose your target loudness level for optimal playback
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {targets?.map((target) => (
          <button
            key={target?.id}
            onClick={() => onSelectTarget(target?.id)}
            className={cn(
              "p-4 rounded-lg border-2 transition-all text-left",
              selectedTarget === target?.id
                ? "border-accent bg-accent/10" :"border-border hover:border-accent/50 hover:bg-accent/5"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${target?.color}20` }}
              >
                <Icon name={target?.icon} size={20} color={target?.color} />
              </div>
              {selectedTarget === target?.id && (
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                  <Icon name="Check" size={14} color="white" />
                </div>
              )}
            </div>
            <h4 className="font-semibold mb-1">{target?.name}</h4>
            <p className="text-2xl font-bold font-data mb-2" style={{ color: target?.color }}>
              {target?.lufs} LUFS
            </p>
            <p className="text-xs text-muted-foreground">{target?.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LoudnessTargetSelector;