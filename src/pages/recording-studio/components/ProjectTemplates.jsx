import React from 'react';
import Icon from '../../../components/AppIcon';

const TEMPLATES = [
  {
    id: 'hiphop',
    name: 'Hip-Hop',
    emoji: '🎤',
    color: '#6366f1',
    preset: 'hiphop',
    autotune: true,
    retuneSpeed: 30,
    bpmRange: '85-100',
    description: 'Hard-hitting 808s, punchy kicks',
  },
  {
    id: 'rnb',
    name: 'R&B',
    emoji: '🎶',
    color: '#ec4899',
    preset: 'rnb',
    autotune: true,
    retuneSpeed: 70,
    bpmRange: '70-90',
    description: 'Smooth melodies, lush chords',
  },
  {
    id: 'trap',
    name: 'Trap',
    emoji: '🔥',
    color: '#ef4444',
    preset: 'trap',
    autotune: true,
    retuneSpeed: 20,
    bpmRange: '130-145',
    description: 'Hi-hat rolls, heavy 808s',
  },
  {
    id: 'pop',
    name: 'Pop',
    emoji: '⭐',
    color: '#f59e0b',
    preset: 'pop',
    autotune: false,
    retuneSpeed: 80,
    bpmRange: '100-130',
    description: 'Catchy hooks, bright production',
  },
  {
    id: 'drill',
    name: 'Drill',
    emoji: '💎',
    color: '#06b6d4',
    preset: 'hiphop',
    autotune: true,
    retuneSpeed: 15,
    bpmRange: '140-150',
    description: 'Dark melodies, sliding 808s',
  },
  {
    id: 'afrobeats',
    name: 'Afrobeats',
    emoji: '🌍',
    color: '#22c55e',
    preset: 'rnb',
    autotune: true,
    retuneSpeed: 60,
    bpmRange: '95-110',
    description: 'Rhythmic percussion, vibrant energy',
  },
];

const ProjectTemplates = ({ onApplyTemplate, currentPreset }) => {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
        <Icon name="LayoutTemplate" size={13} color="#a78bfa" />
        <span className="text-xs font-mono text-gray-300 uppercase tracking-wider">Project Templates</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 p-2">
        {TEMPLATES?.map(t => (
          <button
            key={t?.id}
            onClick={() => onApplyTemplate(t)}
            className={`flex flex-col items-start gap-0.5 p-2 rounded border transition-all text-left ${
              currentPreset === t?.preset
                ? 'border-opacity-80 bg-opacity-20' :'border-gray-700 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800'
            }`}
            style={currentPreset === t?.preset ? {
              borderColor: t?.color,
              backgroundColor: t?.color + '15',
            } : {}}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{t?.emoji}</span>
              <span className="text-[11px] font-mono font-bold text-gray-200">{t?.name}</span>
            </div>
            <span className="text-[9px] font-mono text-gray-500">{t?.bpmRange} BPM</span>
            <span className="text-[9px] font-mono text-gray-600 leading-tight">{t?.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProjectTemplates;
