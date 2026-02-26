import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const TakeManager = ({ takes, channelKey, onSelectTake, onDeleteTake, onRenameTake, disabled }) => {
  const [editingTake, setEditingTake] = useState(null);
  const [nameInput, setNameInput] = useState('');

  if (!takes || takes?.length === 0) return null;

  const selectedTake = takes?.find(t => t?.isSelected) || takes?.[takes?.length - 1];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Icon name="Layers" size={13} color="#f59e0b" />
          <span className="text-xs font-mono text-gray-300 uppercase tracking-wider">Takes — {channelKey}</span>
        </div>
        <span className="text-xs font-mono text-gray-500">{takes?.length} take{takes?.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="divide-y divide-gray-700/50 max-h-48 overflow-y-auto">
        {takes?.map((take, idx) => (
          <div
            key={take?.id}
            className={`flex items-center gap-2 px-3 py-2 transition-all cursor-pointer ${
              take?.isSelected
                ? 'bg-amber-900/20 border-l-2 border-amber-500' :'hover:bg-gray-800/50 border-l-2 border-transparent'
            }`}
            onClick={() => !disabled && onSelectTake(channelKey, take?.id)}
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              take?.isSelected ? 'bg-amber-400' : 'bg-gray-600'
            }`} />
            {editingTake === take?.id ? (
              <input
                autoFocus
                value={nameInput}
                onChange={e => setNameInput(e?.target?.value)}
                onBlur={() => { onRenameTake(channelKey, take?.id, nameInput); setEditingTake(null); }}
                onKeyDown={e => {
                  if (e?.key === 'Enter') { onRenameTake(channelKey, take?.id, nameInput); setEditingTake(null); }
                  if (e?.key === 'Escape') setEditingTake(null);
                }}
                onClick={e => e?.stopPropagation()}
                className="flex-1 text-xs font-mono bg-gray-700 border border-gray-500 rounded px-1 py-0.5 text-white"
                maxLength={20}
              />
            ) : (
              <span className={`flex-1 text-xs font-mono ${
                take?.isSelected ? 'text-amber-300' : 'text-gray-400'
              }`}>
                {take?.name || `Take ${idx + 1}`}
              </span>
            )}
            <span className="text-[10px] font-mono text-gray-600">{take?.duration || '--'}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={e => { e?.stopPropagation(); setEditingTake(take?.id); setNameInput(take?.name || `Take ${idx + 1}`); }}
                disabled={disabled}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300"
                title="Rename take"
              >
                <Icon name="Pencil" size={10} />
              </button>
              <button
                onClick={e => { e?.stopPropagation(); onDeleteTake(channelKey, take?.id); }}
                disabled={disabled}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400"
                title="Delete take"
              >
                <Icon name="Trash2" size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TakeManager;
