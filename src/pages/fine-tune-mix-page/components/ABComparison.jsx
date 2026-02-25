import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ABComparison = ({ onCompare, onSaveVersion }) => {
  const [activeVersion, setActiveVersion] = useState('A');
  const [versions, setVersions] = useState({
    A: {
      name: 'Original Mix',
      timestamp: '2026-02-24 08:30:00',
      saved: true
    },
    B: {
      name: 'Current Mix',
      timestamp: '2026-02-24 08:36:00',
      saved: false
    }
  });

  const handleVersionSwitch = (version) => {
    setActiveVersion(version);
    onCompare(version);
  };

  const handleSaveVersion = () => {
    onSaveVersion(activeVersion);
    setVersions(prev => ({
      ...prev,
      [activeVersion]: {
        ...prev?.[activeVersion],
        saved: true,
        timestamp: new Date()?.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })?.replace(',', '')
      }
    }));
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center bg-secondary/15">
            <Icon name="GitCompare" size={24} color="var(--color-secondary)" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-semibold text-foreground">A/B Compare</h3>
            <p className="text-xs md:text-sm text-muted-foreground">Compare mix versions</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
        {['A', 'B']?.map((version) => (
          <button
            key={version}
            onClick={() => handleVersionSwitch(version)}
            className={`p-4 rounded-lg transition-studio ${
              activeVersion === version
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl md:text-3xl font-bold font-heading">{version}</span>
                {versions?.[version]?.saved && (
                  <Icon name="Check" size={18} className={activeVersion === version ? '' : 'text-success'} />
                )}
              </div>
              <div className="text-left">
                <p className="text-xs md:text-sm font-medium truncate">
                  {versions?.[version]?.name}
                </p>
                <p className="text-xs font-mono opacity-80 mt-1">
                  {versions?.[version]?.timestamp}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="space-y-3">
        <Button
          variant="default"
          size="sm"
          onClick={handleSaveVersion}
          iconName="Save"
          iconPosition="left"
          fullWidth
        >
          Save Version {activeVersion}
        </Button>
        <Button
          variant="outline"
          size="sm"
          iconName="Copy"
          iconPosition="left"
          fullWidth
        >
          Copy {activeVersion === 'A' ? 'B' : 'A'} to {activeVersion}
        </Button>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Active Version</span>
          <span className="font-mono font-semibold text-foreground">{activeVersion}</span>
        </div>
      </div>
    </div>
  );
};

export default ABComparison;