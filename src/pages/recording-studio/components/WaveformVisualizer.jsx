import React, { useEffect, useRef, useState } from 'react';
import Icon from '../../../components/AppIcon';

const WaveformVisualizer = ({ 
  isRecording, 
  audioStream, 
  onPunchInSelect, 
  beatDuration = 180,
  existingRecordingDuration = 0 
}) => {
  const canvasRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const waveformDataRef = useRef([]);
  const [duration, setDuration] = useState(0);
  const [hoveredTime, setHoveredTime] = useState(null);
  const [selectedPunchInTime, setSelectedPunchInTime] = useState(null);

  useEffect(() => {
    const cleanup = () => {
      if (animationRef?.current?.frameId) {
        cancelAnimationFrame(animationRef?.current?.frameId);
      }
      if (animationRef?.current?.timerInterval) {
        clearInterval(animationRef?.current?.timerInterval);
      }
      if (audioContextRef?.current && audioContextRef?.current?.state !== 'closed') {
        audioContextRef?.current?.close();
      }
    };

    if (isRecording && audioStream) {
      setupAnalyzer();
      startTimer();
    } else {
      cleanup();
      setDuration(0);
      waveformDataRef.current = [];
    }

    return cleanup;
  }, [isRecording, audioStream]);

  const setupAnalyzer = () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const analyzer = audioContextRef?.current?.createAnalyser();
      analyzer.fftSize = 2048;
      analyzer.smoothingTimeConstant = 0.3;
      
      const source = audioContextRef?.current?.createMediaStreamSource(audioStream);
      source?.connect(analyzer);
      
      analyzerRef.current = analyzer;
      drawWaveform();
    } catch (error) {
      console.error('Failed to setup audio analyzer:', error);
    }
  };

  const startTimer = () => {
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setDuration(elapsed);
    }, 1000);
    
    animationRef.current = { ...animationRef?.current, timerInterval };
  };

  const drawWaveform = () => {
    const canvas = canvasRef?.current;
    const analyzer = analyzerRef?.current;
    
    if (!canvas || !analyzer) return;

    const ctx = canvas?.getContext('2d');
    const bufferLength = analyzer?.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;

      animationRef.current = { ...animationRef?.current, frameId: requestAnimationFrame(draw) };

      analyzer?.getByteTimeDomainData(dataArray);

      // Store waveform data for later display
      const averageAmplitude = Array.from(dataArray)?.reduce((sum, val) => sum + Math.abs(val - 128), 0) / bufferLength;
      waveformDataRef?.current?.push(averageAmplitude);

      // Clear canvas
      ctx.fillStyle = 'rgb(26, 26, 26)';
      ctx?.fillRect(0, 0, canvas?.width, canvas?.height);

      // Draw live waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(251, 191, 36)';
      ctx?.beginPath();

      const sliceWidth = canvas?.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray?.[i] / 128.0;
        const y = (v * canvas?.height) / 2;

        if (i === 0) {
          ctx?.moveTo(x, y);
        } else {
          ctx?.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx?.lineTo(canvas?.width, canvas?.height / 2);
      ctx?.stroke();

      // Draw stored waveform bars at the bottom
      if (waveformDataRef?.current?.length > 0) {
        const barWidth = canvas?.width / Math.max(waveformDataRef?.current?.length, 100);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
        
        waveformDataRef?.current?.forEach((amplitude, index) => {
          const barHeight = (amplitude / 128) * (canvas?.height / 3);
          let x = index * barWidth;
          const y = canvas?.height - barHeight;
          ctx?.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight);
        });
      }
    };

    draw();
  };

  const handleCanvasClick = (e) => {
    if (!canvasRef?.current || isRecording) return;
    
    const rect = canvasRef?.current?.getBoundingClientRect();
    const clickX = e?.clientX - rect?.left;
    const percentage = clickX / rect?.width;
    const time = Math.max(0, Math.min(percentage * beatDuration, beatDuration));
    
    setSelectedPunchInTime(time);
    if (onPunchInSelect) {
      onPunchInSelect(time);
    }
  };

  const handleCanvasHover = (e) => {
    if (!canvasRef?.current || isRecording) return;
    
    const rect = canvasRef?.current?.getBoundingClientRect();
    const hoverX = e?.clientX - rect?.left;
    const percentage = hoverX / rect?.width;
    const time = Math.max(0, Math.min(percentage * beatDuration, beatDuration));
    
    setHoveredTime(time);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs?.toString()?.padStart(2, '0')}`;
  };

  const formatTimeDetailed = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs?.toString()?.padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="p-4 rounded-lg bg-card border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isRecording ? 'bg-error/20' : 'bg-muted'
          }`}>
            <Icon 
              name="Activity" 
              size={20} 
              color={isRecording ? 'var(--color-error)' : 'var(--color-muted-foreground)'} 
            />
          </div>
          <div>
            <h4 className="text-sm font-medium">Live Waveform</h4>
            <p className="text-xs text-muted-foreground">
              {isRecording ? 'Recording...' : onPunchInSelect ? 'Click to select punch-in point' : 'Waiting for input'}
            </p>
          </div>
        </div>
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-error/10">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
            <span className="text-sm font-mono text-error">{formatTime(duration)}</span>
          </div>
        )}
        {!isRecording && selectedPunchInTime !== null && (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-accent/10">
            <Icon name="MapPin" size={14} color="var(--color-accent)" />
            <span className="text-sm font-mono text-accent">{formatTimeDetailed(selectedPunchInTime)}</span>
          </div>
        )}
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={120}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasHover}
          onMouseLeave={() => setHoveredTime(null)}
          className={`w-full h-[120px] rounded-lg bg-muted ${
            !isRecording && onPunchInSelect ? 'cursor-crosshair' : ''
          }`}
        />
        {!isRecording && waveformDataRef?.current?.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-muted-foreground font-mono">
              {onPunchInSelect ? 'Click on timeline to select punch-in point' : 'Press record to see waveform'}
            </span>
          </div>
        )}
        {!isRecording && hoveredTime !== null && onPunchInSelect && (
          <div
            className="absolute top-0 bottom-0 w-px bg-white/50 pointer-events-none"
            style={{
              left: `${(hoveredTime / beatDuration) * 100}%`
            }}
          >
            <div className="absolute -top-6 left-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono whitespace-nowrap">
              {formatTimeDetailed(hoveredTime)}
            </div>
          </div>
        )}
        {!isRecording && selectedPunchInTime !== null && onPunchInSelect && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-accent pointer-events-none"
            style={{
              left: `${(selectedPunchInTime / beatDuration) * 100}%`
            }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-full" />
          </div>
        )}
        {!isRecording && existingRecordingDuration > 0 && onPunchInSelect && (
          <div
            className="absolute top-0 bottom-0 bg-blue-500/20 border-r-2 border-blue-500 pointer-events-none"
            style={{
              left: 0,
              width: `${(existingRecordingDuration / beatDuration) * 100}%`
            }}
          />
        )}
      </div>
      {!isRecording && onPunchInSelect && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon name="Info" size={12} />
          <span>Click anywhere on the waveform to select your punch-in point</span>
        </div>
      )}
    </div>
  );
};

export default WaveformVisualizer;