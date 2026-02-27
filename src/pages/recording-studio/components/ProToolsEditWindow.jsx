import React from 'react';
import ProToolsTrackRow from './ProToolsTrackRow';

const VOCAL_TRACK_TYPES = [
  { id: 'lead', name: 'Lead', color: '#ef4444' },
  { id: 'double', name: 'Double', color: '#f97316' },
  { id: 'adlib', name: 'Adlib', color: '#6366f1' },
  { id: 'extra', name: 'Extra', color: '#22c55e' },
];

const ProToolsEditWindow = ({
  beatInfo,
  isBeatPlaying,
  onBeatPlayPause,
  sections,
  armedChannel,
  auditionChannels,
  onArm,
  onMute,
  onSolo,
  onAudition,
  onPlayback,
  onDelete,
  onPanChange,
  onVolumeChange,
  recordedWaveforms,
  disabled,
}) => {
  return (
    <div
      className="rounded-lg overflow-hidden border border-gray-700"
      style={{ background: '#0d0d0f' }}
    >
      {/* Edit window header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-700">
        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Vocal Tracks</span>
        <span className="text-[9px] font-mono text-gray-600">R = Record  I = Monitor  S = Solo  M = Mute</span>
      </div>

      {/* Beat Track */}
      <div
        className="flex items-stretch border-b border-gray-700"
        style={{ minHeight: 52, background: 'rgba(10,10,15,0.95)' }}
      >
        <div
          className="flex-shrink-0 flex flex-col justify-between px-2 py-1.5 border-r border-gray-700"
          style={{ width: 160, background: 'rgba(15,15,20,0.95)' }}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-4 rounded-sm flex-shrink-0" style={{ background: '#facc15' }} />
            <span className="text-[11px] font-mono font-semibold text-yellow-300 truncate">
              {beatInfo?.name || 'Beat Track'}
            </span>
          </div>
          <div className="flex items-center gap-0.5 mt-1">
            <span className="text-[9px] font-mono text-gray-600 mr-1">Beat</span>
            <button
              onClick={onBeatPlayPause}
              disabled={!beatInfo}
              className={`w-6 h-5 rounded text-[9px] font-bold font-mono border transition-all disabled:opacity-40 ${
                isBeatPlaying
                  ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-green-900/30 hover:border-green-700'
              }`}
              title={isBeatPlaying ? 'Pause beat' : 'Play beat'}
            >
              {isBeatPlaying ? '⏸' : '▶'}
            </button>
          </div>
          {beatInfo && (
            <span className="text-[9px] font-mono text-gray-500 mt-0.5">
              {beatInfo?.bpm ? `${beatInfo?.bpm} BPM` : ''}
            </span>
          )}
        </div>
        {/* Beat waveform */}
        <div className="flex-1 relative flex items-center px-3">
          {beatInfo ? (
            <div className="w-full h-8 flex items-center gap-0.5">
              {Array.from({ length: 80 })?.map((_, i) => {
                const h = 20 + Math.sin(i * 0.7) * 10 + Math.random() * 8;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h}px`,
                      background: isBeatPlaying ? '#facc15' : '#78716c',
                      opacity: 0.7,
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="w-full flex items-center justify-center">
              <span className="text-[10px] font-mono text-gray-600">Import a beat to begin</span>
            </div>
          )}
        </div>
      </div>

      {/* Vocal Tracks */}
      {sections?.map((section) => (
        <div key={section?.key}>
          <div
            className="flex items-center px-3 py-1 border-b border-gray-800"
            style={{ background: 'rgba(20,20,30,0.9)' }}
          >
            <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500">
              {section?.label}
            </span>
          </div>

          {VOCAL_TRACK_TYPES?.map((type) => {
            const channel = section?.channels?.find(c => c?.id === type?.id);
            const channelKey = `${section?.label}-${type?.id}`;
            const wfKey = `${section?.key}-${type?.id}`;
            const wfData = recordedWaveforms?.[wfKey] || null;
            const isArmed = armedChannel === channelKey;
            const isAudition = auditionChannels?.[channelKey] || false;

            return (
              <ProToolsTrackRow
                key={type?.id}
                trackName={type?.name}
                trackColor={type?.color}
                isArmed={isArmed}
                isMuted={channel?.muted || false}
                isSoloed={channel?.soloed || false}
                isAudition={isAudition}
                isRecording={channel?.isRecording || false}
                isPlaying={channel?.isPlaying || false}
                hasRecording={channel?.recorded || false}
                waveformData={wfData}
                duration={channel?.duration}
                pan={channel?.pan ?? 0}
                volume={channel?.volume ?? 1.0}
                onArm={() => onArm(section?.label, type?.id)}
                onMute={() => onMute(section?.label, type?.id)}
                onSolo={() => onSolo(section?.label, type?.id)}
                onAudition={() => onAudition(channelKey)}
                onDelete={() => onDelete(section?.label, type?.id)}
                onPanChange={(val) => onPanChange?.(section?.label, type?.id, val)}
                onVolumeChange={(val) => onVolumeChange?.(section?.label, type?.id, val)}
                disabled={disabled}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ProToolsEditWindow;
