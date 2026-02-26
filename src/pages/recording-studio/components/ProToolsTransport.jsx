import React from 'react';
import Icon from '../../../components/AppIcon';

const ProToolsTransport = ({
  isPlaying,
  isRecording,
  isPunchInEnabled,
  isLoopEnabled,
  isMetronomeEnabled,
  currentTime,
  beatDuration,
  bpm,
  onPlay,
  onStop,
  onRecord,
  onRewind,
  onFastForward,
  onTogglePunchIn,
  onToggleLoop,
  onToggleMetronome,
  disabled,
  activeChannel,
}) => {
  const formatTime = (seconds) => {
    const s = Math.max(0, seconds || 0);
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    const frames = Math.floor((s % 1) * 30);
    return `${mins?.toString()?.padStart(2, '0')}:${secs?.toString()?.padStart(2, '0')}:${frames?.toString()?.padStart(2, '0')}`;
  };

  const formatBars = (seconds, bpmVal = 120) => {
    const s = Math.max(0, seconds || 0);
    const beatsPerSecond = bpmVal / 60;
    const totalBeats = s * beatsPerSecond;
    const bars = Math.floor(totalBeats / 4) + 1;
    const beats = Math.floor(totalBeats % 4) + 1;
    const ticks = Math.floor((totalBeats % 1) * 960);
    return `${bars?.toString()?.padStart(3, '0')}|${beats}|${ticks?.toString()?.padStart(3, '0')}`;
  };

  const progress = beatDuration > 0 ? Math.min(((currentTime || 0) / beatDuration) * 100, 100) : 0;
  const canStop = isRecording || isPlaying;

  return (
    <div
      className="bg-gray-950 border border-gray-700/80 rounded-lg p-3 shadow-xl"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Transport</span>
        <div className="flex items-center gap-2">
          {activeChannel && !isRecording && (
            <div className="flex items-center gap-2 px-2 py-1 bg-red-900/40 border border-red-500/50 rounded">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono text-red-300">{activeChannel?.split('-')?.pop()?.toUpperCase()} — ARMED</span>
            </div>
          )}
          {isRecording && (
            <div className="flex items-center gap-2 px-2 py-1 bg-red-600/30 border border-red-500 rounded">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs font-mono text-red-300 font-bold">● REC</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Time Display */}
        <div className="flex flex-col gap-0.5 bg-black border border-gray-700 rounded px-3 py-2 min-w-[130px]">
          <span className="text-[9px] font-mono text-gray-500 uppercase">Time</span>
          <span className="text-lg font-mono text-green-400 tracking-widest leading-none">
            {formatTime(currentTime)}
          </span>
        </div>

        {/* Bars:Beats Display */}
        <div className="flex flex-col gap-0.5 bg-black border border-gray-700 rounded px-3 py-2 min-w-[110px]">
          <span className="text-[9px] font-mono text-gray-500 uppercase">Bars|Beats</span>
          <span className="text-lg font-mono text-cyan-400 tracking-widest leading-none">
            {formatBars(currentTime, bpm)}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-gray-700" />

        {/* Transport Buttons */}
        <div className="flex items-center gap-1">
          {/* Rewind to Start */}
          <button
            onClick={onRewind}
            disabled={isRecording}
            className="w-9 h-9 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Return to Zero"
          >
            <Icon name="SkipBack" size={15} color="#9ca3af" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={onPlay}
            disabled={disabled || isRecording}
            className={`w-11 h-9 flex items-center justify-center rounded border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              isPlaying
                ? 'bg-green-600 border-green-500 hover:bg-green-700' :'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            <Icon name={isPlaying ? 'Pause' : 'Play'} size={16} color={isPlaying ? '#fff' : '#9ca3af'} />
          </button>

          {/* Stop */}
          <button
            onClick={onStop}
            disabled={!canStop}
            className="w-9 h-9 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Stop"
          >
            <Icon name="Square" size={15} color={canStop ? '#e5e7eb' : '#6b7280'} />
          </button>

          {/* Fast Forward */}
          <button
            onClick={onFastForward}
            disabled={disabled || isRecording}
            className="w-9 h-9 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Fast Forward 10s"
          >
            <Icon name="SkipForward" size={15} color="#9ca3af" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-gray-700" />

        {/* Record Button */}
        <button
          onClick={onRecord}
          disabled={disabled}
          className={`w-11 h-9 flex items-center justify-center rounded border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            isRecording
              ? 'bg-red-600 border-red-500 hover:bg-red-700 shadow-lg shadow-red-900/50'
              : 'bg-gray-800 border-red-800 hover:bg-red-900/30 hover:border-red-600'
          }`}
          title={isRecording ? 'Stop Recording' : 'Record (arm a channel first)'}
        >
          <div
            className={`w-4 h-4 rounded-full border-2 ${
              isRecording ? 'bg-white border-white animate-pulse' : 'bg-red-500 border-red-400'
            }`}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-10 bg-gray-700" />

        {/* Mode Buttons */}
        <div className="flex items-center gap-1">
          {/* Punch-In Toggle */}
          <button
            onClick={onTogglePunchIn}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 h-9 rounded border transition-all text-xs font-mono font-bold disabled:opacity-40 disabled:cursor-not-allowed ${
              isPunchInEnabled
                ? 'bg-orange-600/30 border-orange-500 text-orange-300 hover:bg-orange-600/40' :'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500'
            }`}
            title="Toggle Punch-In Mode"
          >
            <Icon name="Crosshair" size={13} color={isPunchInEnabled ? '#fb923c' : '#6b7280'} />
            <span>PUNCH</span>
          </button>

          {/* Loop Toggle */}
          <button
            onClick={onToggleLoop}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 h-9 rounded border transition-all text-xs font-mono font-bold disabled:opacity-40 disabled:cursor-not-allowed ${
              isLoopEnabled
                ? 'bg-blue-600/30 border-blue-500 text-blue-300 hover:bg-blue-600/40' :'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500'
            }`}
            title="Toggle Loop Mode"
          >
            <Icon name="Repeat" size={13} color={isLoopEnabled ? '#60a5fa' : '#6b7280'} />
            <span>LOOP</span>
          </button>

          {/* Metronome Toggle */}
          <button
            onClick={onToggleMetronome}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 h-9 rounded border transition-all text-xs font-mono font-bold disabled:opacity-40 disabled:cursor-not-allowed ${
              isMetronomeEnabled
                ? 'bg-yellow-600/30 border-yellow-500 text-yellow-300 hover:bg-yellow-600/40' :'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500'
            }`}
            title="Toggle Metronome (Click Track)"
          >
            <Icon name="Music" size={13} color={isMetronomeEnabled ? '#fbbf24' : '#6b7280'} />
            <span>CLICK</span>
          </button>
        </div>

        {/* BPM Display */}
        <div className="ml-auto flex flex-col gap-0.5 bg-black border border-gray-700 rounded px-3 py-2">
          <span className="text-[9px] font-mono text-gray-500 uppercase">BPM</span>
          <span className="text-lg font-mono text-yellow-400 leading-none">{bpm || '---'}</span>
        </div>
      </div>
      {/* Progress bar */}
      {beatDuration > 0 && (
        <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-none ${
              isRecording ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ProToolsTransport;
