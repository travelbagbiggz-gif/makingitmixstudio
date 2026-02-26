import React, { useState, useCallback } from 'react';
import Icon from '../../../components/AppIcon';

const TRACK_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#6366f1', '#a855f7', '#ec4899'
];

const volToDB = (vol) => {
  if (vol <= 0) return '-∞';
  const db = 20 * Math.log10(vol);
  return (db >= 0 ? '+' : '') + db?.toFixed(1);
};

const TrackMixer = ({ channels, sectionTitle, onChannelUpdate, disabled }) => {
  const [editingName, setEditingName] = useState(null);
  const [nameInput, setNameInput] = useState('');

  const handleMute = useCallback((channelId) => {
    onChannelUpdate(channelId, { muted: !channels?.find(c => c?.id === channelId)?.muted });
  }, [channels, onChannelUpdate]);

  const handleSolo = useCallback((channelId) => {
    const ch = channels?.find(c => c?.id === channelId);
    const newSolo = !ch?.soloed;
    // When soloing, unsolo others
    channels?.forEach(c => {
      if (c?.id !== channelId) onChannelUpdate(c?.id, { soloed: false });
    });
    onChannelUpdate(channelId, { soloed: newSolo });
  }, [channels, onChannelUpdate]);

  const handleVolume = useCallback((channelId, value) => {
    onChannelUpdate(channelId, { volume: parseFloat(value) });
  }, [onChannelUpdate]);

  const handlePan = useCallback((channelId, value) => {
    onChannelUpdate(channelId, { pan: parseFloat(value) });
  }, [onChannelUpdate]);

  const handleColorChange = useCallback((channelId, color) => {
    onChannelUpdate(channelId, { color });
  }, [onChannelUpdate]);

  const startRename = (ch) => {
    setEditingName(ch?.id);
    setNameInput(ch?.customName || ch?.id);
  };

  const confirmRename = (channelId) => {
    if (nameInput?.trim()) onChannelUpdate(channelId, { customName: nameInput?.trim() });
    setEditingName(null);
  };

  const anySoloed = channels?.some(c => c?.soloed);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
        <Icon name="SlidersHorizontal" size={13} color="#a78bfa" />
        <span className="text-xs font-mono text-gray-300 uppercase tracking-wider">{sectionTitle} Mixer</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-gray-700/50">
        {channels?.map((ch) => {
          const isMuted = ch?.muted || (anySoloed && !ch?.soloed);
          const vol = ch?.volume ?? 1.0;
          const pan = ch?.pan ?? 0;
          const color = ch?.color || TRACK_COLORS?.[0];
          return (
            <div key={ch?.id} className={`flex flex-col items-center gap-1.5 p-2 transition-all ${
              isMuted ? 'opacity-40' : ''
            }`}>
              {/* Color dot + name */}
              <div className="flex items-center gap-1 w-full">
                <div className="relative group">
                  <div className="w-3 h-3 rounded-full cursor-pointer border border-gray-600" style={{ backgroundColor: color }} />
                  <div className="absolute top-4 left-0 z-20 hidden group-hover:flex flex-wrap gap-1 bg-gray-800 border border-gray-600 rounded p-1.5 w-24">
                    {TRACK_COLORS?.map(c => (
                      <div key={c} onClick={() => handleColorChange(ch?.id, c)}
                        className="w-4 h-4 rounded-full cursor-pointer hover:scale-110 transition-transform border border-gray-600"
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                {editingName === ch?.id ? (
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={e => setNameInput(e?.target?.value)}
                    onBlur={() => confirmRename(ch?.id)}
                    onKeyDown={e => { if (e?.key === 'Enter') confirmRename(ch?.id); if (e?.key === 'Escape') setEditingName(null); }}
                    className="flex-1 text-[10px] font-mono bg-gray-700 border border-gray-500 rounded px-1 py-0.5 text-white w-full"
                    maxLength={12}
                  />
                ) : (
                  <span
                    className="flex-1 text-[10px] font-mono text-gray-300 truncate cursor-pointer hover:text-white"
                    onDoubleClick={() => startRename(ch)}
                    title="Double-click to rename"
                  >
                    {ch?.customName || ch?.id?.charAt(0)?.toUpperCase() + ch?.id?.slice(1)}
                  </span>
                )}
              </div>
              {/* Volume fader */}
              <div className="flex flex-col items-center gap-0.5 w-full">
                <span className="text-[9px] font-mono text-gray-500">VOL</span>
                <input
                  type="range" min="0" max="1.5" step="0.01"
                  value={vol}
                  onChange={e => handleVolume(ch?.id, e?.target?.value)}
                  disabled={disabled}
                  className="w-full h-1 accent-green-400 cursor-pointer"
                  style={{ accentColor: color }}
                />
                <span className="text-[9px] font-mono text-green-400">{volToDB(vol)} dB</span>
              </div>
              {/* Pan control */}
              <div className="flex flex-col items-center gap-0.5 w-full">
                <span className="text-[9px] font-mono text-gray-500">PAN</span>
                <input
                  type="range" min="-1" max="1" step="0.05"
                  value={pan}
                  onChange={e => handlePan(ch?.id, e?.target?.value)}
                  disabled={disabled}
                  className="w-full h-1 cursor-pointer"
                  style={{ accentColor: '#60a5fa' }}
                />
                <span className="text-[9px] font-mono text-blue-400">
                  {pan === 0 ? 'C' : pan < 0 ? `L${Math.round(Math.abs(pan) * 100)}` : `R${Math.round(pan * 100)}`}
                </span>
              </div>
              {/* Mute / Solo */}
              <div className="flex gap-1">
                <button
                  onClick={() => handleMute(ch?.id)}
                  disabled={disabled}
                  title="Mute (M)"
                  className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border transition-all ${
                    ch?.muted
                      ? 'bg-yellow-500 border-yellow-400 text-black' :'bg-gray-700 border-gray-600 text-gray-400 hover:border-yellow-500 hover:text-yellow-400'
                  }`}
                >
                  M
                </button>
                <button
                  onClick={() => handleSolo(ch?.id)}
                  disabled={disabled}
                  title="Solo (S)"
                  className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border transition-all ${
                    ch?.soloed
                      ? 'bg-yellow-400 border-yellow-300 text-black' :'bg-gray-700 border-gray-600 text-gray-400 hover:border-yellow-400 hover:text-yellow-300'
                  }`}
                >
                  S
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackMixer;
