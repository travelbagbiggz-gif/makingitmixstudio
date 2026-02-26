import React, { useEffect, useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';

const AudioMeter = ({ isRecording, isArmed, level = 0 }) => {
  const [peakLevel, setPeakLevel] = useState(0);
  const [maxPeak, setMaxPeak] = useState(0);
  const [isClipping, setIsClipping] = useState(false);
  const [clipFlash, setClipFlash] = useState(false);
  const peakHoldTimeoutRef = useRef(null);
  const peakDecayRef = useRef(null);
  const clipFlashRef = useRef(null);

  useEffect(() => {
    if (level > peakLevel) {
      setPeakLevel(level);
      if (peakHoldTimeoutRef?.current) clearTimeout(peakHoldTimeoutRef?.current);
      if (peakDecayRef?.current) clearInterval(peakDecayRef?.current);
      // Hold peak for 2 seconds then decay
      peakHoldTimeoutRef.current = setTimeout(() => {
        peakDecayRef.current = setInterval(() => {
          setPeakLevel(prev => {
            const next = prev - 1.5;
            if (next <= 0) { clearInterval(peakDecayRef?.current); return 0; }
            return next;
          });
        }, 30);
      }, 2000);
    }
    // Track session max
    if (level > maxPeak) setMaxPeak(level);
    // Clipping detection
    if (level > 90) {
      setIsClipping(true);
      setClipFlash(true);
      if (clipFlashRef?.current) clearTimeout(clipFlashRef?.current);
      clipFlashRef.current = setTimeout(() => setClipFlash(false), 150);
    } else {
      setIsClipping(false);
    }
  }, [level]);

  useEffect(() => {
    if (!isRecording && !isArmed) {
      setMaxPeak(0);
      setIsClipping(false);
    }
  }, [isRecording, isArmed]);

  useEffect(() => {
    return () => {
      if (peakHoldTimeoutRef?.current) clearTimeout(peakHoldTimeoutRef?.current);
      if (peakDecayRef?.current) clearInterval(peakDecayRef?.current);
      if (clipFlashRef?.current) clearTimeout(clipFlashRef?.current);
    };
  }, []);

  const dbValue = level > 0 ? Math.round((level / 100) * 60 - 60) : -60;
  const peakDbValue = peakLevel > 0 ? Math.round((peakLevel / 100) * 60 - 60) : -60;
  const maxPeakDb = maxPeak > 0 ? Math.round((maxPeak / 100) * 60 - 60) : -60;

  // Gain staging zones
  const getZoneColor = (lvl) => {
    if (lvl > 90) return '#ef4444'; // clipping red
    if (lvl > 75) return '#f97316'; // hot orange
    if (lvl > 55) return '#22c55e'; // optimal green
    if (lvl > 20) return '#84cc16'; // good lime
    return '#6b7280'; // low gray
  };

  const getGainLabel = () => {
    if (level > 90) return { text: 'CLIPPING — reduce gain', color: '#ef4444', icon: 'AlertTriangle' };
    if (level > 75) return { text: 'HOT — slightly reduce gain', color: '#f97316', icon: 'AlertCircle' };
    if (level > 55) return { text: 'OPTIMAL — great level', color: '#22c55e', icon: 'CheckCircle' };
    if (level > 20) return { text: 'GOOD — can increase gain', color: '#84cc16', icon: 'TrendingUp' };
    if (level > 0) return { text: 'LOW — increase mic gain', color: '#6b7280', icon: 'TrendingDown' };
    return null;
  };

  const gainLabel = (isRecording || isArmed) ? getGainLabel() : null;
  const active = isRecording || isArmed;

  // Build segmented meter bars (30 segments)
  const SEGMENTS = 30;
  const filledSegments = Math.round((level / 100) * SEGMENTS);
  const peakSegment = Math.round((peakLevel / 100) * SEGMENTS);

  const getSegmentColor = (i) => {
    const pct = ((i + 1) / SEGMENTS) * 100;
    if (pct > 90) return '#ef4444';
    if (pct > 75) return '#f97316';
    if (pct > 55) return '#22c55e';
    return '#84cc16';
  };

  return (
    <div className={`p-4 rounded-lg bg-card border transition-all ${
      clipFlash ? 'border-red-500 shadow-lg shadow-red-500/30' :
      isClipping ? 'border-red-500/60': isRecording ?'border-red-600/50': isArmed ?'border-red-500/40': 'border-border'
    } space-y-3`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isClipping ? 'bg-red-500/20' : isRecording ? 'bg-red-900/30' : isArmed ? 'bg-red-900/20' : 'bg-accent/10'
          }`}>
            <Icon name="Activity" size={20} color={isClipping ? '#ef4444' : isRecording ? '#ef4444' : isArmed ? '#f87171' : 'var(--color-accent)'} />
          </div>
          <div>
            <h4 className="text-sm font-medium">Input Meter</h4>
            <p className="text-xs text-muted-foreground">
              {isRecording ? '● Recording' : isArmed ? '◉ Armed — monitoring' : 'Microphone signal'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-sm font-data font-bold block font-mono ${
            level > 90 ? 'text-red-400' : level > 75 ? 'text-orange-400' : level > 55 ? 'text-green-400' : 'text-muted-foreground'
          }`}>
            {dbValue} dBFS
          </span>
          {peakLevel > 0 && (
            <span className="text-xs text-yellow-400 font-mono">
              Peak: {peakDbValue} dB
            </span>
          )}
        </div>
      </div>

      {/* Segmented meter */}
      <div className="space-y-1.5">
        <div className="relative flex items-end gap-px h-8">
          {Array.from({ length: SEGMENTS })?.map((_, i) => {
            const isFilled = i < filledSegments;
            const isPeak = i === peakSegment && peakLevel > 0;
            const segColor = getSegmentColor(i);
            return (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all"
                style={{
                  height: '100%',
                  backgroundColor: isPeak
                    ? '#ffffff'
                    : isFilled
                    ? segColor
                    : 'rgba(255,255,255,0.07)',
                  boxShadow: isPeak ? '0 0 4px #fff' : isFilled && i >= SEGMENTS * 0.9 ? `0 0 3px ${segColor}` : 'none',
                  transform: isFilled ? 'scaleY(1)' : 'scaleY(0.6)',
                  transformOrigin: 'bottom',
                }}
              />
            );
          })}
        </div>

        {/* dB scale */}
        <div className="flex justify-between text-[9px] text-muted-foreground font-mono px-0.5">
          <span>-60</span>
          <span>-40</span>
          <span>-20</span>
          <span>-12</span>
          <span>-6</span>
          <span className="text-orange-400">-3</span>
          <span className="text-red-400">0</span>
        </div>

        {/* Zone labels */}
        <div className="flex text-[8px] font-mono">
          <div className="flex-[3] text-center" style={{ color: '#84cc16' }}>GOOD</div>
          <div className="flex-[2] text-center" style={{ color: '#22c55e' }}>OPTIMAL</div>
          <div className="flex-[1] text-center" style={{ color: '#f97316' }}>HOT</div>
          <div className="flex-[0.5] text-center" style={{ color: '#ef4444' }}>CLIP</div>
        </div>
      </div>

      {/* Gain staging feedback */}
      {gainLabel && (
        <div
          className="flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium transition-all"
          style={{ backgroundColor: `${gainLabel?.color}18`, color: gainLabel?.color, border: `1px solid ${gainLabel?.color}40` }}
        >
          <Icon name={gainLabel?.icon} size={13} />
          <span>{gainLabel?.text}</span>
        </div>
      )}

      {/* Session max peak */}
      {maxPeak > 0 && active && (
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>Session max:</span>
          <span className={maxPeakDb > -6 ? 'text-orange-400' : 'text-muted-foreground'}>
            {maxPeakDb} dBFS
            {maxPeakDb > -6 && ' ⚠'}
          </span>
        </div>
      )}

      {/* Clipping flash overlay */}
      {clipFlash && (
        <div className="absolute inset-0 rounded-lg bg-red-500/10 pointer-events-none" />
      )}
    </div>
  );
};

export default AudioMeter;