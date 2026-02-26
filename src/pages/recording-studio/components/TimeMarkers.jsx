import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const DEFAULT_MARKERS = [
  { id: 'intro', label: 'Intro', color: '#6366f1', time: 0 },
  { id: 'verse1', label: 'Verse 1', color: '#22c55e', time: null },
  { id: 'chorus1', label: 'Chorus', color: '#f59e0b', time: null },
  { id: 'verse2', label: 'Verse 2', color: '#22c55e', time: null },
  { id: 'bridge', label: 'Bridge', color: '#ec4899', time: null },
  { id: 'outro', label: 'Outro', color: '#ef4444', time: null },
];

const TimeMarkers = ({ currentTime, duration, onSeek, markers, onMarkersChange }) => {
  const [editingId, setEditingId] = useState(null);
  const [labelInput, setLabelInput] = useState('');

  const setMarkerAtCurrent = (markerId) => {
    const updated = markers?.map(m =>
      m?.id === markerId ? { ...m, time: currentTime } : m
    );
    onMarkersChange(updated);
  };

  const clearMarker = (markerId) => {
    const updated = markers?.map(m =>
      m?.id === markerId ? { ...m, time: null } : m
    );
    onMarkersChange(updated);
  };

  const renameMarker = (markerId, newLabel) => {
    const updated = markers?.map(m =>
      m?.id === markerId ? { ...m, label: newLabel } : m
    );
    onMarkersChange(updated);
  };

  const formatTime = (s) => {
    if (s === null || s === undefined) return '--:--';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec?.toString()?.padStart(2, '0')}`;
  };

  const activeMarkers = markers?.filter(m => m?.time !== null);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Icon name="MapPin" size={13} color="#f59e0b" />
          <span className="text-xs font-mono text-gray-300 uppercase tracking-wider">Section Markers</span>
        </div>
        <span className="text-[10px] font-mono text-gray-500">{activeMarkers?.length} set</span>
      </div>
      {/* Marker timeline bar */}
      {duration > 0 && activeMarkers?.length > 0 && (
        <div className="relative h-5 bg-gray-950 border-b border-gray-700 mx-0">
          {activeMarkers?.map(m => (
            <button
              key={m?.id}
              onClick={() => onSeek(m?.time)}
              className="absolute top-0 h-full flex items-center px-1 text-[8px] font-mono font-bold rounded-sm hover:brightness-125 transition-all"
              style={{
                left: `${(m?.time / duration) * 100}%`,
                transform: 'translateX(-50%)',
                backgroundColor: m?.color + '33',
                borderLeft: `2px solid ${m?.color}`,
                color: m?.color,
              }}
              title={`Jump to ${m?.label}`}
            >
              {m?.label?.slice(0, 3)?.toUpperCase()}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-2">
        {markers?.map(m => (
          <div
            key={m?.id}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded border transition-all ${
              m?.time !== null
                ? 'border-gray-600 bg-gray-800/50' :'border-gray-700/50 bg-gray-900/50'
            }`}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m?.color }} />
            {editingId === m?.id ? (
              <input
                autoFocus
                value={labelInput}
                onChange={e => setLabelInput(e?.target?.value)}
                onBlur={() => { renameMarker(m?.id, labelInput); setEditingId(null); }}
                onKeyDown={e => {
                  if (e?.key === 'Enter') { renameMarker(m?.id, labelInput); setEditingId(null); }
                  if (e?.key === 'Escape') setEditingId(null);
                }}
                className="flex-1 text-[10px] font-mono bg-gray-700 border border-gray-500 rounded px-1 text-white w-full"
                maxLength={12}
              />
            ) : (
              <span
                className="flex-1 text-[10px] font-mono text-gray-300 truncate cursor-pointer hover:text-white"
                onDoubleClick={() => { setEditingId(m?.id); setLabelInput(m?.label); }}
                title="Double-click to rename"
              >
                {m?.label}
              </span>
            )}
            <div className="flex items-center gap-0.5">
              {m?.time !== null ? (
                <>
                  <button
                    onClick={() => onSeek(m?.time)}
                    className="text-[9px] font-mono text-green-400 hover:text-green-300 px-1"
                    title={`Jump to ${formatTime(m?.time)}`}
                  >
                    {formatTime(m?.time)}
                  </button>
                  <button
                    onClick={() => setMarkerAtCurrent(m?.id)}
                    className="w-4 h-4 flex items-center justify-center rounded hover:bg-gray-700 text-gray-500 hover:text-amber-400"
                    title="Update to current time"
                  >
                    <Icon name="RefreshCw" size={8} />
                  </button>
                  <button
                    onClick={() => clearMarker(m?.id)}
                    className="w-4 h-4 flex items-center justify-center rounded hover:bg-red-900/30 text-gray-600 hover:text-red-400"
                    title="Clear marker"
                  >
                    <Icon name="X" size={8} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setMarkerAtCurrent(m?.id)}
                  className="text-[9px] font-mono text-gray-500 hover:text-amber-400 px-1 border border-gray-700 hover:border-amber-600 rounded"
                  title="Set marker at current time"
                >
                  SET
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { DEFAULT_MARKERS };
export default TimeMarkers;
