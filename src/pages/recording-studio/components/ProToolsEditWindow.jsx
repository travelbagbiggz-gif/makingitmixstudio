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
      className="rounded-lg overflow-hidden border border-gray-800 shadow-[0_12px_32px_rgba(0,0,0,0.85)]"
      style={{ background: '#0b0b10' }}
    >
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#050509] border-b border-gray-900">
        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em]">
          Edit Window — Vocal Tracks
        </span>
        <span className="text-[9px] font-mono text-gray-600">
          R = Record · I = Monitor · S = Solo · M = Mute
        </span>
      </div>

      <div
        className="flex items-stretch border-b border-gray-900"
        style={{ minHeight: 54, background: 'rgba(10,10,15,0.96)' }}
      >
        <div
          className="flex-shrink-0 flex flex-col justify-between px-2 py-1.5 border-r border-gray-900"
          style={{ width: 170, background: 'rgba(15,15,20,0.98)' }}
        >
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-4 rounded-sm flex-shrink-0"
              style={{ background: '#facc15' }}
            />
            <span className="text-[11px] font-mono font-semibold text-yellow-300 truncate">
              {beatInfo?.name || 'Beat Track'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-gray-600 mr-1">Beat</span>
              <button
                onClick={onBeatPlayPause}
                disabled={!beatInfo}
                className={`w-6 h-5 rounded text-[9px] font-bold font-mono border transition-all disabled:opacity-40 ${
                  isBeatPlaying
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-emerald-900/40 hover:border-emerald-600'
                }`}
                title={isBeatPlaying ? 'Pause beat' : 'Play beat'}
              >
                {isBeatPlaying ? '⏸' : '▶'}
              </button>
            </div>
            {beatInfo && (
              <span className="text-[9px] font-mono text-gray-500">
                {beatInfo?.bpm ? `${beatInfo?.bpm} BPM` : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 relative flex items-center px-3">
          {beatInfo ? (
            <div className="w-full h-8 flex items-center gap-0.5">
              {Array.from({ length: 90 })?.map((_, i) => {
                const h =
                  20 + Math.sin(i * 0.7) * 10 + (i % 3 === 0 ? 6 : 2);
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h}px`,
                      background: isBeatPlaying ? '#facc15' : '#78716c',
                      opacity: isBeatPlaying ? 0.85 : 0.65,
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="w-full flex items-center justify-center">
              <span className="text-[10px] font-mono text-gray-600">
                Import a beat to start recording.
              </span>
            </div>
          )}
        </div>
      </div>

      {sections?.map((section) => (
        <div key={section?.key || section?.id}>
          <div
            className="flex items-center px-3 py-1 border-b border-gray-900"
            style={{ background: 'rgba(18,18,26,0.96)' }}
          >
            <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-gray-500">
              {section?.label}
            </span>
          </div>

          {VOCAL_TRACK_TYPES?.map((type) => {
            const channel = section?.channels?.find((c) => c?.id === type?.id);
            const channelKey = `${section?.label}-${type?.id}`;
            const wfKey = `${section?.key || section?.id}-${type?.id}`;
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
                onPanChange={(val) =>
                  onPanChange?.(section?.label, type?.id, val)
                }
                onVolumeChange={(val) =>
                  onVolumeChange?.(section?.label, type?.id, val)
                }
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
