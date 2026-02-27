import React, { useRef, useEffect, useState } from 'react';
import Icon from '../../../components/AppIcon';

const MiniWaveform = ({ waveformData, color, isRecording, isArmed }) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef?.current;
    if (!canvas) return;

    const draw = () => {
      const ctx = canvas?.getContext('2d');
      const W = canvas?.width;
      const H = canvas?.height;
      ctx?.clearRect(0, 0, W, H);

      if (isRecording) {
        // Animated recording indicator — live sine wave
        ctx.fillStyle = 'rgba(239,68,68,0.15)';
        ctx?.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx?.beginPath();
        ctx?.moveTo(0, H / 2);
        for (let x = 0; x < W; x++) {
          const y = H / 2 + Math.sin((x / W) * Math.PI * 8 + Date.now() / 200) * (H * 0.3);
          ctx?.lineTo(x, y);
        }
        ctx?.stroke();
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      if (!waveformData || waveformData?.length === 0) {
        // Empty track placeholder
        ctx.fillStyle = 'rgba(55,65,81,0.3)';
        ctx?.fillRect(0, 0, W, H);
        ctx.strokeStyle = isArmed ? 'rgba(239,68,68,0.4)' : 'rgba(107,114,128,0.3)';
        ctx.lineWidth = 1;
        ctx?.beginPath();
        ctx?.moveTo(0, H / 2);
        ctx?.lineTo(W, H / 2);
        ctx?.stroke();
        return;
      }

      // Draw waveform
      ctx.fillStyle = 'rgba(17,24,39,0.8)';
      ctx?.fillRect(0, 0, W, H);

      const barW = W / waveformData?.length;
      ctx.fillStyle = color || '#6366f1';
      waveformData?.forEach((val, i) => {
        const barH = Math.max(2, val * H * 0.85);
        let x = i * barW;
        const y = (H - barH) / 2;
        ctx?.fillRect(x, y, Math.max(barW - 0.5, 1), barH);
      });
    };

    draw();

    return () => {
      if (rafRef?.current) cancelAnimationFrame(rafRef?.current);
    };
  }, [waveformData, color, isRecording, isArmed]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={50}
      className="w-full h-full rounded"
    />
  );
};

const ProToolsTrackRow = ({
  trackName,
  trackColor,
  isArmed,
  isMuted,
  isSoloed,
  isAudition,
  isRecording,
  isPlaying,
  hasRecording,
  waveformData,
  duration,
  pan,
  volume,
  onArm,
  onMute,
  onSolo,
  onAudition,
  onDelete,
  onPanChange,
  onVolumeChange,
  disabled,
}) => {
  const panValue = pan ?? 0;
  const panLabel = panValue === 0 ? 'C' : panValue < 0 ? `L${Math.abs(Math.round(panValue * 100))}` : `R${Math.round(panValue * 100)}`;
  const volValue = volume ?? 1.0;
  const volDb = volValue <= 0 ? '-∞' : volValue >= 1.0 ? '0' : (20 * Math.log10(volValue))?.toFixed(0);

  return (
    <div
      className={`flex items-stretch border-b border-gray-800 transition-all ${
        isRecording
          ? 'bg-red-950/30'
          : isArmed
          ? 'bg-red-950/15'
          : isMuted
          ? 'bg-gray-900/50' : 'bg-gray-900'
      }`}
      style={{ minHeight: 60 }}
    >
      {/* Track header strip */}
      <div
        className="flex-shrink-0 flex flex-col justify-between px-2 py-1.5 border-r border-gray-700"
        style={{ width: 160, background: 'rgba(15,15,20,0.95)' }}
      >
        {/* Track name + color bar */}
        <div className="flex items-center gap-1.5 mb-1">
          <div
            className="w-1.5 h-4 rounded-sm flex-shrink-0"
            style={{ background: trackColor }}
          />
          <span
            className="text-[11px] font-mono font-semibold truncate"
            style={{ color: isRecording ? '#fca5a5' : isArmed ? '#fca5a5' : '#d1d5db' }}
          >
            {trackName}
          </span>
          {isRecording && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          )}
        </div>

        {/* R I S M buttons */}
        <div className="flex items-center gap-0.5">
          {/* R = Record Arm */}
          <button
            onClick={onArm}
            disabled={disabled}
            title={isArmed ? 'Disarm track' : 'Arm to record'}
            className={`w-6 h-5 rounded text-[9px] font-bold font-mono border transition-all disabled:opacity-40 ${
              isArmed || isRecording
                ? 'bg-red-600 border-red-500 text-white shadow-sm shadow-red-900'
                : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-red-900/30 hover:border-red-700 hover:text-red-400'
            }`}
          >
            R
          </button>

          {/* I = Input Monitor (audition) */}
          <button
            onClick={onAudition}
            disabled={disabled}
            title={isAudition ? 'Stop monitoring' : 'Monitor input (hear yourself)'}
            className={`w-6 h-5 rounded text-[9px] font-bold font-mono border transition-all disabled:opacity-40 ${
              isAudition
                ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-green-900/30 hover:border-green-700 hover:text-green-400'
            }`}
          >
            I
          </button>

          {/* S = Solo */}
          <button
            onClick={onSolo}
            disabled={disabled}
            title={isSoloed ? 'Unsolo' : 'Solo track'}
            className={`w-6 h-5 rounded text-[9px] font-bold font-mono border transition-all disabled:opacity-40 ${
              isSoloed
                ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-yellow-900/30 hover:border-yellow-700 hover:text-yellow-400'
            }`}
          >
            S
          </button>

          {/* M = Mute */}
          <button
            onClick={onMute}
            disabled={disabled}
            title={isMuted ? 'Unmute' : 'Mute track'}
            className={`w-6 h-5 rounded text-[9px] font-bold font-mono border transition-all disabled:opacity-40 ${
              isMuted
                ? 'bg-orange-500 border-orange-400 text-black' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-orange-900/30 hover:border-orange-700 hover:text-orange-400'
            }`}
          >
            M
          </button>
        </div>

        {/* Volume fader */}
        <div
          className="flex items-center gap-1 mt-1 px-1 py-0.5 rounded"
          style={{ background: `${trackColor}22`, border: `1px solid ${trackColor}55` }}
        >
          <span
            className="text-[8px] font-mono font-bold w-5"
            style={{ color: trackColor, textShadow: `0 0 6px ${trackColor}` }}
          >VOL</span>
          <div className="flex-1 relative">
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={volValue}
              onChange={(e) => onVolumeChange?.(parseFloat(e?.target?.value))}
              disabled={disabled}
              className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-40"
              style={{
                background: `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${volValue * 100}%, #1f2937 ${volValue * 100}%, #1f2937 100%)`,
                accentColor: trackColor,
                boxShadow: volValue > 0 ? `0 0 6px ${trackColor}88` : 'none',
              }}
              title={`Volume: ${volDb} dB`}
            />
          </div>
          <span
            className="text-[8px] font-mono w-6 text-right font-bold"
            style={{
              color: volValue === 1.0 ? '#9ca3af' : trackColor,
              textShadow: volValue !== 1.0 ? `0 0 4px ${trackColor}` : 'none',
            }}
          >
            {volDb}
          </span>
        </div>

        {/* Pan fader */}
        <div
          className="flex items-center gap-1 mt-1 px-1 py-0.5 rounded"
          style={{ background: '#0ea5e922', border: '1px solid #0ea5e955' }}
        >
          <span
            className="text-[8px] font-mono font-bold w-5"
            style={{ color: '#38bdf8', textShadow: '0 0 6px #0ea5e9' }}
          >PAN</span>
          <div className="flex-1 relative">
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={panValue}
              onChange={(e) => onPanChange?.(parseFloat(e?.target?.value))}
              disabled={disabled}
              className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-40"
              style={{
                background: panValue === 0
                  ? 'linear-gradient(to right, #1f2937 0%, #1f2937 50%, #1f2937 50%, #1f2937 100%)'
                  : panValue < 0
                    ? `linear-gradient(to right, #1f2937 0%, #1f2937 ${((panValue + 1) / 2) * 100}%, #0ea5e9 ${((panValue + 1) / 2) * 100}%, #0ea5e9 50%, #1f2937 50%, #1f2937 100%)`
                    : `linear-gradient(to right, #1f2937 0%, #1f2937 50%, #0ea5e9 50%, #0ea5e9 ${((panValue + 1) / 2) * 100}%, #1f2937 ${((panValue + 1) / 2) * 100}%, #1f2937 100%)`,
                accentColor: '#38bdf8',
                boxShadow: panValue !== 0 ? '0 0 6px #0ea5e988' : 'none',
              }}
              title={`Pan: ${panLabel}`}
            />
          </div>
          <span
            className="text-[8px] font-mono w-6 text-right font-bold"
            style={{
              color: panValue === 0 ? '#9ca3af' : '#38bdf8',
              textShadow: panValue !== 0 ? '0 0 4px #0ea5e9' : 'none',
            }}
          >
            {panLabel}
          </span>
        </div>

        {/* Status + actions */}
        <div className="flex items-center justify-between mt-0.5">
          {hasRecording && !isRecording && (
            <span className="text-[9px] font-mono text-gray-500">{duration || ''}</span>
          )}
          {isRecording && (
            <span className="text-[9px] font-mono text-red-400 animate-pulse">● REC</span>
          )}
          {isArmed && !isRecording && (
            <span className="text-[9px] font-mono text-red-400">ARMED</span>
          )}
          <div className="flex items-center gap-0.5 ml-auto">
            {hasRecording && !isRecording && (
              <button
                onClick={onDelete}
                disabled={disabled}
                title="Delete recording"
                className="w-5 h-5 flex items-center justify-center rounded bg-gray-700 hover:bg-red-900/40 transition-colors disabled:opacity-40"
              >
                <Icon name="Trash2" size={9} color="#6b7280" />
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Waveform area */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 60 }}>
        <MiniWaveform
          waveformData={waveformData}
          color={trackColor}
          isRecording={isRecording}
          isArmed={isArmed}
        />
        {isMuted && !isRecording && (
          <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center pointer-events-none">
            <span className="text-[9px] font-mono text-orange-400 bg-gray-900/80 px-1.5 py-0.5 rounded">MUTED</span>
          </div>
        )}
        {isSoloed && !isRecording && (
          <div className="absolute top-1 right-1 pointer-events-none">
            <span className="text-[8px] font-mono text-yellow-400 bg-gray-900/80 px-1 py-0.5 rounded">SOLO</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProToolsTrackRow;
