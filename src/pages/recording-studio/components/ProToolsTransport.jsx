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
    return `${mins?.toString()?.padStart(2, '0')}:${secs
      ?.toString()
      ?.padStart(2, '0')}:${frames?.toString()?.padStart(2, '0')}`;
  };

  const formatBars = (seconds, bpmVal = 120) => {
    const s = Math.max(0, seconds || 0);
    const beatsPerSecond = bpmVal / 60;
    const totalBeats = s * beatsPerSecond;
    const bars = Math.floor(totalBeats / 4) + 1;
    const beats = Math.floor(totalBeats % 4) + 1;
    const ticks = Math.floor((totalBeats % 1) * 960);
    return `${bars?.toString()?.padStart(3, '0')}|${beats}|${ticks
      ?.toString()
      ?.padStart(3, '0')}`;
  };

  const progress =
    beatDuration > 0 ? Math.min(((currentTime || 0) / beatDuration) * 100, 100) : 0;
  const canStop = isRecording || isPlaying;

  return (
    <div
      className="bg-[#050507] border border-gray-800 rounded-lg p-3 shadow-[0_10px_28px_rgba(0,0,0,0.85)]"
      style={{
        boxShadow:
          '0 10px 28px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.25em]">
          Transport
        </span>
        <div className="flex items-center gap-2">
          {activeChannel && !isRecording && (
            <div className="flex items-center gap-2 px-2 py-1 bg-red-900/40 border border-red-500/50 rounded">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-mono text-red-300">
                {String(activeChannel).split('-').pop()?.toUpperCase()} — ARMED
              </span>
            </div>
          )}
          {isRecording && (
            <div className="flex items-center gap-2 px-2 py-1 bg-red-600/30 border border-red-500 rounded">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] font-mono text-red-300 font-bold">● REC</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex flex-col gap-0.5 bg-black border border-gray-700 rounded px-3 py-2 min-w-[130px]">
          <span className="text-[9px] font-mono text-gray-500 uppercase">Time</span>
          <span className="text-lg font-mono text-emerald-400 tracking-widest leading-none">
            {formatTime(currentTime)}
          </span>
        </div>

        <div className="flex flex-col gap-0.5 bg-black border border-gray-700 rounded px-3 py-2 min-w-[120px]">
          <span className="text-[9px] font-mono text-gray-500 uppercase">
            Bars|Beats
          </span>
          <span className="text-lg font-mono text-cyan-400 tracking-widest leading-none">
            {formatBars(currentTime, bpm)}
          </span>
        </div>

        <div className="w-px h-10 bg-gray-800" />

        <div className="flex items-center gap-1">
          <button
            onClick={onRewind}
            disabled={isRecording}
            className="w-9 h-9 flex items-center justify-center rounded bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Return to Zero"
          >
            <Icon name="SkipBack" size={15} color="#9ca3af" />
          </button>

          <button
            onClick={onPlay}
            disabled={disabled || isRecording}
            className={`w-11 h-9 flex items-center justify-center rounded border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              isPlaying
                ? 'bg-emerald-600 border-emerald-500 hover:bg-emerald-700'
                : 'bg-gray-900 border-gray-700 hover:bg-gray-800 hover:border-gray-500'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            <Icon
              name={isPlaying ? 'Pause' : 'Play'}
              size={16}
              color={isPlaying ? '#ffffff' : '#e5e7eb'}
            />
          </button>

          <button
            onClick={onStop}
            disabled={!canStop}
            className="w-9 h-9 flex items-center justify-center rounded bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Stop"
          >
            <Icon
              name="Square"
              size={15}
              color={canStop ? '#e5e7eb' : '#6b7280'}
            />
          </button>

          <button
            onClick={onFastForward}
            disabled={disabled || isRecording}
            className="w-9 h-9 flex items-center justify-center rounded bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Fast Forward"
          >
            <Icon name="SkipForward" size={15} color="#9ca3af" />
          </button>
        </div>

        <div className="w-px h-10 bg-gray-800" />

        <button
          onClick={onRecord}
          disabled={disabled}
          className={`w-11 h-9 flex items-center justify-center rounded border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            isRecording
              ? 'bg-red-600 border-red-500 hover:bg-red-700 shadow-lg shadow-red-900/50'
              : 'bg-gray-900 border-red-800 hover:bg-red-900/40 hover:border-red-600'
          }`}
          title={isRecording ? 'Stop Recording' : 'Record (arm a track first)'}
        >
          <div
            className={`w-4 h-4 rounded-full border-2 ${
              isRecording
                ? 'bg-white border-white animate-pulse'
                : 'bg-red-500 border-red-400'
            }`}
          />
        </button>

        <div className="w-px h-10 bg-gray-800" />

        <div className="flex items-center gap-1">
          <button
            onClick={onTogglePunchIn}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 h-9 rounded border transition-all text-[10px] font-mono font-semibold disabled:opacity-40 disabled:cursor-not-allowed ${
              isPunchInEnabled
                ? 'bg-orange-600/25 border-orange-500 text-orange-200 hover:bg-orange-600/35'
                : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800 hover:border-gray-500'
            }`}
            title="Toggle Punch-In"
          >
            <Icon
              name="Crosshair"
              size={13}
              color={isPunchInEnabled ? '#fb923c' : '#6b7280'}
            />
            <span>PUNCH</span>
          </button>

          <button
            onClick={onToggleLoop}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 h-9 rounded border transition-all text-[10px] font-mono font-semibold disabled:opacity-40 disabled:cursor-not-allowed ${
              isLoopEnabled
                ? 'bg-sky-600/25 border-sky-500 text-sky-200 hover:bg-sky-600/35'
                : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800 hover:border-gray-500'
            }`}
            title="Toggle Loop"
          >
            <Icon
              name="Repeat"
              size={13}
              color={isLoopEnabled ? '#60a5fa' : '#6b7280'}
            />
            <span>LOOP</span>
          </button>

          <button
            onClick={onToggleMetronome}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 h-9 rounded border transition-all text-[10px] font-mono font-semibold disabled:opacity-40 disabled:cursor-not-allowed ${
              isMetronomeEnabled
                ? 'bg-amber-600/25 border-amber-500 text-amber-200 hover:bg-amber-600/35'
                : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800 hover:border-gray-500'
            }`}
            title="Toggle Metronome"
          >
            <Icon
              name="Music"
              size={13}
              color={isMetronomeEnabled ? '#fbbf24' : '#6b7280'}
            />
            <span>CLICK</span>
          </button>
        </div>

        <div className="ml-auto flex flex-col gap-0.5 bg-black border border-gray-700 rounded px-3 py-2">
          <span className="text-[9px] font-mono text-gray-500 uppercase">BPM</span>
          <span className="text-lg font-mono text-amber-300 leading-none">
            {bpm || '---'}
          </span>
        </div>
      </div>

      {beatDuration > 0 && (
        <div className="mt-2 h-1.5 bg-gray-900 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-none ${
              isRecording ? 'bg-red-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ProToolsTransport;
