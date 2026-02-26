import React from 'react';
import Icon from '../../../components/AppIcon';

const WaveformZoom = ({ zoom, onZoomChange, snapEnabled, onSnapToggle, gridSize, onGridSizeChange }) => {
  const zoomLevels = [0.5, 1, 2, 4, 8];
  const gridSizes = [
    { id: '1/4', label: '1/4', beats: 0.25 },
    { id: '1/2', label: '1/2', beats: 0.5 },
    { id: '1', label: '1', beats: 1 },
    { id: '2', label: '2', beats: 2 },
    { id: '4', label: '4', beats: 4 },
  ];

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg">
      {/* Zoom controls */}
      <div className="flex items-center gap-1.5">
        <Icon name="ZoomOut" size={12} color="#6b7280" />
        <div className="flex items-center gap-0.5">
          {zoomLevels?.map(z => (
            <button
              key={z}
              onClick={() => onZoomChange(z)}
              className={`px-1.5 py-0.5 text-[9px] font-mono rounded border transition-all ${
                zoom === z
                  ? 'bg-indigo-900/40 border-indigo-500 text-indigo-300' :'bg-gray-800 border-gray-600 text-gray-500 hover:border-gray-500 hover:text-gray-300'
              }`}
            >
              {z}x
            </button>
          ))}
        </div>
        <Icon name="ZoomIn" size={12} color="#6b7280" />
      </div>
      <div className="w-px h-5 bg-gray-700" />
      {/* Grid snap */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onSnapToggle}
          className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono rounded border transition-all ${
            snapEnabled
              ? 'bg-cyan-900/30 border-cyan-500 text-cyan-300' :'bg-gray-800 border-gray-600 text-gray-500 hover:border-gray-500'
          }`}
        >
          <Icon name="Grid3x3" size={10} color={snapEnabled ? '#67e8f9' : '#6b7280'} />
          SNAP
        </button>
        {snapEnabled && (
          <div className="flex items-center gap-0.5">
            {gridSizes?.map(g => (
              <button
                key={g?.id}
                onClick={() => onGridSizeChange(g?.beats)}
                className={`px-1.5 py-0.5 text-[9px] font-mono rounded border transition-all ${
                  gridSize === g?.beats
                    ? 'bg-cyan-900/30 border-cyan-500 text-cyan-300' :'bg-gray-800 border-gray-600 text-gray-500 hover:border-gray-500'
                }`}
              >
                {g?.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="w-px h-5 bg-gray-700" />
      {/* Zoom slider */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-[9px] font-mono text-gray-500 whitespace-nowrap">ZOOM</span>
        <input
          type="range" min="0.25" max="16" step="0.25"
          value={zoom}
          onChange={e => onZoomChange(parseFloat(e?.target?.value))}
          className="flex-1 h-1 cursor-pointer"
          style={{ accentColor: '#6366f1' }}
        />
        <span className="text-[9px] font-mono text-indigo-400 w-6 text-right">{zoom}x</span>
      </div>
    </div>
  );
};

export default WaveformZoom;
