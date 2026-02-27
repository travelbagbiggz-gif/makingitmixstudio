import React from 'react';
import Icon from '../../../components/AppIcon';

const features = [
  { icon: 'mic', text: 'Unlimited recording sessions' },
  { icon: 'sliders', text: 'Professional presets (Hip-Hop, R&B, Pop, Jazz)' },
  { icon: 'zap', text: 'Zero latency recording' },
  { icon: 'music', text: 'Automated mixing and mastering' },
  { icon: 'download', text: 'WAV and MP3 export' },
  { icon: 'folder', text: 'Save unlimited projects' },
  { icon: 'activity', text: 'Real-time autotune with adjustable speed' },
  { icon: 'layers', text: 'Multi-layer recording (16 tracks)' },
  { icon: 'headphones', text: 'Professional EQ, reverb, and echo controls' },
  { icon: 'award', text: 'Commercial use license' },
];

const PlanHighlights = () => {
  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Icon name="check-circle" className="w-5 h-5 text-green-400" />
        Everything included:
      </h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {features?.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name="check" className="w-3 h-3 text-green-400" />
            </div>
            <span className="text-sm text-gray-300">{feature?.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanHighlights;
