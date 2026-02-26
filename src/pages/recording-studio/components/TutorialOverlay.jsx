import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const STEPS = [
  {
    id: 1,
    title: 'Welcome to MIX PRO STUDIO! 🎤',
    description: 'This is your professional recording studio. Let\'s walk you through the key features to get you recording in minutes.',
    icon: 'Music',
    color: '#a78bfa',
  },
  {
    id: 2,
    title: 'Step 1: Import Your Beat',
    description: 'Drag & drop an MP3 or WAV beat file into the Beat Importer section, or click to browse. Your beat will load into the timeline automatically.',
    icon: 'Upload',
    color: '#f59e0b',
  },
  {
    id: 3,
    title: 'Step 2: Arm a Channel',
    description: 'Click the red circle (●) button next to Lead, Double, Adlib, or Extra to arm that channel for recording. The channel will glow red when armed.',
    icon: 'Mic',
    color: '#ef4444',
  },
  {
    id: 4,
    title: 'Step 3: Hit Record',
    description: 'Press the Record button in the Transport Panel (or press R on your keyboard). The beat will start automatically and your vocal will be captured.',
    icon: 'Circle',
    color: '#ef4444',
  },
  {
    id: 5,
    title: 'Keyboard Shortcuts',
    description: 'Space = Play/Pause • R = Record • M = Mute armed channel • S = Solo armed channel • Ctrl+Z = Undo last recording • Ctrl+S = Save session',
    icon: 'Keyboard',
    color: '#22c55e',
  },
  {
    id: 6,
    title: 'Mixer & Effects',
    description: 'Use the Track Mixer to adjust volume (dB), pan (L/R), mute, and solo each channel. Apply autotune and select presets from the right panel.',
    icon: 'SlidersHorizontal',
    color: '#06b6d4',
  },
  {
    id: 7,
    title: 'Export Your Mix',
    description: 'When done, use the Export Panel to bounce your mix to MP3, WAV, or FLAC. Export individual stems for collaboration. Then proceed to Fine-Tune Mix!',
    icon: 'Download',
    color: '#22c55e',
  },
];

const TutorialOverlay = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const current = STEPS?.[step];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-5">
          {STEPS?.map((s, i) => (
            <div
              key={s?.id}
              className={`rounded-full transition-all ${
                i === step ? 'w-4 h-2' : 'w-2 h-2'
              }`}
              style={{ backgroundColor: i <= step ? current?.color : '#374151' }}
            />
          ))}
        </div>

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: current?.color + '20', border: `1px solid ${current?.color}40` }}
        >
          <Icon name={current?.icon} size={28} color={current?.color} />
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-white text-center mb-2">{current?.title}</h3>
        <p className="text-sm text-gray-400 text-center leading-relaxed mb-6">{current?.description}</p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-2 rounded-lg border border-gray-600 text-sm font-mono text-gray-400 hover:text-white hover:border-gray-500 transition-all"
            >
              Back
            </button>
          )}
          {step < STEPS?.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 py-2 rounded-lg text-sm font-mono font-bold text-black transition-all"
              style={{ backgroundColor: current?.color }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="flex-1 py-2 rounded-lg text-sm font-mono font-bold text-black bg-green-400 hover:bg-green-300 transition-all"
            >
              Start Recording! 🎤
            </button>
          )}
        </div>

        <button
          onClick={onComplete}
          className="w-full mt-3 text-xs font-mono text-gray-600 hover:text-gray-400 transition-colors"
        >
          Skip tutorial
        </button>
      </div>
    </div>
  );
};

export default TutorialOverlay;
