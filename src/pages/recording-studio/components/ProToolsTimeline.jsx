import React, { useEffect, useRef, useState, useCallback } from 'react';
import Icon from '../../../components/AppIcon';

const ProToolsTimeline = ({
  beatDuration,
  currentTime,
  isPlaying,
  isRecording,
  audioStream,
  bpm,
  punchInPoint,
  punchOutPoint,
  isPunchInEnabled,
  isLoopEnabled,
  onSeek,
  onSetPunchIn,
  onSetPunchOut,
  recordedWaveforms,
  activeChannel,
}) => {
  const beatCanvasRef = useRef(null);
  const vocalCanvasRef = useRef(null);
  const beatContainerRef = useRef(null);
  const vocalContainerRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);
  const liveWaveformRef = useRef([]);
  const recordingStartTimeRef = useRef(0);
  const lastSampleTimeRef = useRef(0);
  const isDraggingRef = useRef(false);
  const beatWaveDataRef = useRef([]);
  const [hoverTime, setHoverTime] = useState(null);
  const [settingPunch, setSettingPunch] = useState(null);

  const duration = Math.max(beatDuration || 180, 1);

  // Generate deterministic beat waveform
  useEffect(() => {
    const bars = 300;
    const data = [];
    for (let i = 0; i < bars; i++) {
      const seed =
        Math.abs(Math.sin(i * 0.31)) * 0.5 +
        Math.abs(Math.sin(i * 0.73)) * 0.3 +
        Math.abs(Math.sin(i * 1.27)) * 0.2;
      data?.push(seed);
    }
    beatWaveDataRef.current = data;
  }, [beatDuration, bpm]);

  // ─── Draw beat canvas ────────────────────────────────────────────────────────
  const drawBeatCanvas = useCallback(() => {
    const canvas = beatCanvasRef?.current;
    if (!canvas) return;
    const ctx = canvas?.getContext('2d');
    const W = canvas?.width;
    const H = canvas?.height;

    ctx.fillStyle = '#0f1117';
    ctx?.fillRect(0, 0, W, H);

    const data = beatWaveDataRef?.current;
    if (data?.length > 0) {
      const barW = W / data?.length;
      data?.forEach((amp, i) => {
        const h = amp * H * 0.75 + H * 0.08;
        const x = i * barW;
        const y = (H - h) / 2;
        const beatPos = (i / data?.length) * duration * ((bpm || 120) / 60);
        const isBeatAccent = Math.floor(beatPos) % 4 === 0;
        ctx.fillStyle = isBeatAccent
          ? 'rgba(139, 92, 246, 0.9)'
          : 'rgba(99, 102, 241, 0.55)';
        ctx?.fillRect(x, y, Math.max(barW - 0.5, 0.5), h);
      });
    }

    // Time grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    const gridInterval = duration > 120 ? 30 : duration > 60 ? 15 : 10;
    for (let t = 0; t <= duration; t += gridInterval) {
      const x = (t / duration) * W;
      ctx?.beginPath();
      ctx?.moveTo(x, 0);
      ctx?.lineTo(x, H);
      ctx?.stroke();
    }

    // Punch-in zone
    if (isPunchInEnabled && punchInPoint != null) {
      const punchX = (punchInPoint / duration) * W;
      const punchOutX = punchOutPoint != null ? (punchOutPoint / duration) * W : W;
      ctx.fillStyle = 'rgba(251, 146, 60, 0.12)';
      ctx?.fillRect(punchX, 0, punchOutX - punchX, H);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx?.setLineDash([4, 3]);
      ctx?.beginPath();
      ctx?.moveTo(punchX, 0);
      ctx?.lineTo(punchX, H);
      ctx?.stroke();
      ctx?.setLineDash([]);
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 9px monospace';
      ctx?.fillText('IN', punchX + 3, 12);
    }
    if (isPunchInEnabled && punchOutPoint != null) {
      const punchOutX = (punchOutPoint / duration) * W;
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx?.setLineDash([4, 3]);
      ctx?.beginPath();
      ctx?.moveTo(punchOutX, 0);
      ctx?.lineTo(punchOutX, H);
      ctx?.stroke();
      ctx?.setLineDash([]);
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 9px monospace';
      ctx?.fillText('OUT', punchOutX - 22, 12);
    }

    // Loop region
    if (isLoopEnabled && punchInPoint != null && punchOutPoint != null) {
      const loopX1 = (punchInPoint / duration) * W;
      const loopX2 = (punchOutPoint / duration) * W;
      ctx.fillStyle = 'rgba(96, 165, 250, 0.08)';
      ctx?.fillRect(loopX1, 0, loopX2 - loopX1, H);
    }

    // Hover line
    if (hoverTime != null) {
      const hoverX = (hoverTime / duration) * W;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx?.setLineDash([3, 3]);
      ctx?.beginPath();
      ctx?.moveTo(hoverX, 0);
      ctx?.lineTo(hoverX, H);
      ctx?.stroke();
      ctx?.setLineDash([]);
    }

    // Playhead
    const playX = Math.max(0, Math.min((currentTime / duration) * W, W - 1));
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx?.beginPath();
    ctx?.moveTo(playX, 0);
    ctx?.lineTo(playX, H);
    ctx?.stroke();
    // Triangle marker at top
    ctx.fillStyle = '#ffffff';
    ctx?.beginPath();
    ctx?.moveTo(playX - 6, 0);
    ctx?.lineTo(playX + 6, 0);
    ctx?.lineTo(playX, 10);
    ctx?.closePath();
    ctx?.fill();
  }, [currentTime, hoverTime, duration, bpm, isPunchInEnabled, punchInPoint, punchOutPoint, isLoopEnabled]);

  useEffect(() => {
    drawBeatCanvas();
  }, [drawBeatCanvas]);

  // ─── Draw vocal canvas ───────────────────────────────────────────────────────
  const drawVocalCanvas = useCallback(
    (waveData, startTime) => {
      const canvas = vocalCanvasRef?.current;
      if (!canvas) return;
      const ctx = canvas?.getContext('2d');
      const W = canvas?.width;
      const H = canvas?.height;

      ctx.fillStyle = '#0a0c10';
      ctx?.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      const gridInterval = duration > 120 ? 30 : duration > 60 ? 15 : 10;
      for (let t = 0; t <= duration; t += gridInterval) {
        const x = (t / duration) * W;
        ctx?.beginPath();
        ctx?.moveTo(x, 0);
        ctx?.lineTo(x, H);
        ctx?.stroke();
      }

      // Draw previously recorded waveforms
      if (recordedWaveforms) {
        Object.entries(recordedWaveforms)?.forEach(([key, wf]) => {
          if (!wf || !wf?.data || !wf?.data?.length) return;
          const startX = ((wf?.startTime || 0) / duration) * W;
          const endX = ((wf?.endTime || duration) / duration) * W;
          const availW = Math.max(endX - startX, 1);
          const barW = Math.max(availW / wf?.data?.length, 0.5);
          wf?.data?.forEach((amp, i) => {
            // amp is 0-1 float from our fixed waveform extraction
            const barH = Math.min(amp * H * 0.85, H * 0.92);
            const x = startX + i * barW;
            const y = (H - barH) / 2;
            ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
            ctx?.fillRect(x, y, Math.max(barW - 0.5, 0.5), barH);
          });
        });
      }

      // Draw live recording waveform
      if (waveData && waveData?.length > 0) {
        const recStartX = ((startTime || 0) / duration) * W;
        const availableW = W - recStartX;
        const barW = Math.max(availableW / Math.max(waveData?.length, 1), 0.5);
        waveData?.forEach((amp, i) => {
          // amp is 0-128 range from analyser
          const normalized = Math.min(amp / 64, 1);
          const barH = Math.min(normalized * H * 0.85, H * 0.92);
          const x = recStartX + i * barW;
          const y = (H - barH) / 2;
          const alpha = 0.6 + (i / waveData?.length) * 0.4;
          ctx.fillStyle = `rgba(248, 113, 113, ${alpha})`;
          ctx?.fillRect(x, y, Math.max(barW - 0.5, 0.5), barH);
        });
      }

      // Playhead on vocal track
      const playX = Math.max(0, Math.min((currentTime / duration) * W, W - 1));
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx?.beginPath();
      ctx?.moveTo(playX, 0);
      ctx?.lineTo(playX, H);
      ctx?.stroke();
    },
    [currentTime, duration, recordedWaveforms]
  );

  // ─── Live recording analyser loop ────────────────────────────────────────────
  useEffect(() => {
    if (isRecording && audioStream) {
      liveWaveformRef.current = [];
      recordingStartTimeRef.current = currentTime;
      lastSampleTimeRef.current = Date.now();

      try {
        if (!audioCtxRef?.current || audioCtxRef?.current?.state === 'closed') {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef?.current?.state === 'suspended') {
          audioCtxRef?.current?.resume();
        }
        const analyser = audioCtxRef?.current?.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.5;
        const source = audioCtxRef?.current?.createMediaStreamSource(audioStream);
        source?.connect(analyser);
        analyserRef.current = analyser;
      } catch (e) {
        console.error('Timeline analyser error:', e);
      }

      const bufferLength = analyserRef?.current ? analyserRef?.current?.frequencyBinCount : 0;
      const dataArray = bufferLength > 0 ? new Uint8Array(bufferLength) : null;

      const loop = () => {
        animFrameRef.current = requestAnimationFrame(loop);
        if (analyserRef?.current && dataArray) {
          analyserRef?.current?.getByteTimeDomainData(dataArray);
          const avg =
            dataArray?.reduce((s, v) => s + Math.abs(v - 128), 0) / bufferLength;
          const now = Date.now();
          if (now - lastSampleTimeRef?.current >= 33) {
            liveWaveformRef?.current?.push(avg);
            lastSampleTimeRef.current = now;
          }
        }
        drawVocalCanvas(liveWaveformRef?.current, recordingStartTimeRef?.current);
      };
      loop();
    } else {
      if (animFrameRef?.current) {
        cancelAnimationFrame(animFrameRef?.current);
        animFrameRef.current = null;
      }
      drawVocalCanvas(liveWaveformRef?.current, recordingStartTimeRef?.current);
    }

    return () => {
      if (animFrameRef?.current) {
        cancelAnimationFrame(animFrameRef?.current);
        animFrameRef.current = null;
      }
    };
  }, [isRecording, audioStream]);

  // Redraw vocal canvas when playhead moves or recorded waveforms change
  useEffect(() => {
    if (!isRecording) {
      drawVocalCanvas(liveWaveformRef?.current, recordingStartTimeRef?.current);
    }
  }, [currentTime, drawVocalCanvas, isRecording, recordedWaveforms]);

  // ─── Mouse interaction ───────────────────────────────────────────────────────
  const getTimeFromEvent = (e, containerRef) => {
    const rect = containerRef?.current?.getBoundingClientRect();
    if (!rect) return 0;
    const clientX = e?.clientX ?? e?.touches?.[0]?.clientX ?? 0;
    const x = clientX - rect?.left;
    const pct = Math.max(0, Math.min(1, x / rect?.width));
    return pct * duration;
  };

  const handleBeatMouseDown = (e) => {
    const time = getTimeFromEvent(e, beatContainerRef);
    if (settingPunch === 'in') {
      onSetPunchIn?.(time);
      setSettingPunch(null);
    } else if (settingPunch === 'out') {
      onSetPunchOut?.(time);
      setSettingPunch(null);
    } else {
      isDraggingRef.current = true;
      onSeek?.(time);
    }
  };

  const handleBeatMouseMove = (e) => {
    const time = getTimeFromEvent(e, beatContainerRef);
    setHoverTime(time);
    if (isDraggingRef?.current) onSeek?.(time);
  };

  const handleVocalMouseDown = (e) => {
    const time = getTimeFromEvent(e, vocalContainerRef);
    if (!settingPunch) {
      isDraggingRef.current = true;
      onSeek?.(time);
    }
  };

  const handleVocalMouseMove = (e) => {
    if (isDraggingRef?.current) {
      const time = getTimeFromEvent(e, vocalContainerRef);
      onSeek?.(time);
    }
  };

  const handleMouseUp = () => { isDraggingRef.current = false; };
  const handleMouseLeave = () => {
    setHoverTime(null);
    isDraggingRef.current = false;
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec?.toString()?.padStart(2, '0')}`;
  };

  const gridInterval = duration > 120 ? 30 : duration > 60 ? 15 : 10;
  const timeMarkers = [];
  for (let t = 0; t <= duration; t += gridInterval) timeMarkers?.push(t);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden select-none">
      {/* Timeline header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Icon name="Activity" size={14} color="#6366f1" />
          <span className="text-xs font-mono text-gray-300 uppercase tracking-wider">Timeline</span>
          {isRecording && (
            <div className="flex items-center gap-1 ml-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono text-red-400 font-bold">● RECORDING</span>
            </div>
          )}
          {isPlaying && !isRecording && (
            <div className="flex items-center gap-1 ml-2">
              <Icon name="Play" size={10} color="#4ade80" />
              <span className="text-xs font-mono text-green-400">PLAYING</span>
            </div>
          )}
          {isLoopEnabled && (
            <div className="flex items-center gap-1 ml-2">
              <Icon name="Repeat" size={10} color="#60a5fa" />
              <span className="text-xs font-mono text-blue-400">LOOP</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isPunchInEnabled && (
            <>
              <button
                onClick={() => setSettingPunch(settingPunch === 'in' ? null : 'in')}
                className={`px-2 py-1 text-xs font-mono rounded border transition-all ${
                  settingPunch === 'in' ?'bg-orange-500 border-orange-400 text-white' :'bg-gray-700 border-gray-600 text-orange-400 hover:bg-gray-600'
                }`}
              >
                SET IN
              </button>
              <button
                onClick={() => setSettingPunch(settingPunch === 'out' ? null : 'out')}
                className={`px-2 py-1 text-xs font-mono rounded border transition-all ${
                  settingPunch === 'out' ?'bg-orange-500 border-orange-400 text-white' :'bg-gray-700 border-gray-600 text-orange-400 hover:bg-gray-600'
                }`}
              >
                SET OUT
              </button>
            </>
          )}
          <span className="text-xs font-mono text-green-400 min-w-[50px] text-right">
            {formatTime(currentTime)}
          </span>
          {hoverTime != null && (
            <span className="text-xs font-mono text-gray-400">
              → {formatTime(hoverTime)}
            </span>
          )}
        </div>
      </div>
      {/* Beat track */}
      <div className="flex">
        <div className="w-16 flex-shrink-0 bg-gray-800 border-r border-gray-700 flex flex-col items-center justify-center gap-0.5 py-1">
          <Icon name="Music2" size={12} color="#a78bfa" />
          <span className="text-[9px] font-mono text-purple-400 uppercase tracking-wider">Beat</span>
        </div>
        <div
          ref={beatContainerRef}
          className={`flex-1 relative ${
            settingPunch ? 'cursor-crosshair' : 'cursor-pointer'
          }`}
          onMouseDown={handleBeatMouseDown}
          onMouseMove={handleBeatMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <canvas
            ref={beatCanvasRef}
            width={1200}
            height={64}
            className="w-full h-[64px] block"
          />
        </div>
      </div>
      {/* Vocal track */}
      <div className="flex border-t border-gray-700">
        <div className="w-16 flex-shrink-0 bg-gray-800 border-r border-gray-700 flex flex-col items-center justify-center gap-0.5 py-1">
          <Icon name="Mic" size={12} color="#f87171" />
          <span className="text-[9px] font-mono text-red-400 uppercase tracking-wider">Vocal</span>
          {activeChannel && (
            <span className="text-[8px] font-mono text-red-300 truncate px-1 text-center leading-tight">
              {activeChannel?.split('-')?.pop()}
            </span>
          )}
        </div>
        <div
          ref={vocalContainerRef}
          className="flex-1 relative cursor-pointer"
          onMouseDown={handleVocalMouseDown}
          onMouseMove={handleVocalMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { isDraggingRef.current = false; }}
        >
          <canvas
            ref={vocalCanvasRef}
            width={1200}
            height={64}
            className="w-full h-[64px] block"
          />
          {!isRecording &&
            liveWaveformRef?.current?.length === 0 &&
            (!recordedWaveforms || Object.keys(recordedWaveforms)?.length === 0) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs font-mono text-gray-600">
                  {activeChannel
                    ? `${activeChannel?.split('-')?.pop()} — Press Record to start`
                    : 'Arm a channel then press Record'}
                </span>
              </div>
            )}
        </div>
      </div>
      {/* Time ruler */}
      <div className="flex border-t border-gray-700">
        <div className="w-16 flex-shrink-0 bg-gray-800 border-r border-gray-700" />
        <div className="flex-1 relative h-5 bg-gray-900">
          {timeMarkers?.map((t) => (
            <div
              key={t}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${(t / duration) * 100}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-px h-2 bg-gray-600" />
              <span className="text-[9px] font-mono text-gray-500 mt-0.5">{formatTime(t)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProToolsTimeline;
