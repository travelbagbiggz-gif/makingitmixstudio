import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import WaveformVisualizer from './WaveformVisualizer';

const PunchInTimeline = ({ 
  beatDuration, 
  existingRecordingDuration,
  onPunchInSelect,
  onCancel 
}) => {
  const [selectedTime, setSelectedTime] = useState(0);
  const [hoveredTime, setHoveredTime] = useState(null);
  const timelineRef = useRef(null);

  const handleTimelineClick = (e) => {
    if (!timelineRef?.current) return;
    
    const rect = timelineRef?.current?.getBoundingClientRect();
    const clickX = e?.clientX - rect?.left;
    const percentage = clickX / rect?.width;
    const time = Math.max(0, Math.min(percentage * beatDuration, beatDuration));
    
    setSelectedTime(time);
  };

  const handleWaveformSelect = (time) => {
    setSelectedTime(time);
  };

  const handleTimelineHover = (e) => {
    if (!timelineRef?.current) return;
    
    const rect = timelineRef?.current?.getBoundingClientRect();
    const hoverX = e?.clientX - rect?.left;
    const percentage = hoverX / rect?.width;
    const time = Math.max(0, Math.min(percentage * beatDuration, beatDuration));
    
    setHoveredTime(time);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs?.toString()?.padStart(2, '0')}.${ms}`;
  };

  const getTimeMarkers = () => {
    const markers = [];
    const interval = beatDuration > 120 ? 30 : beatDuration > 60 ? 15 : 10;
    
    for (let i = 0; i <= beatDuration; i += interval) {
      markers?.push(i);
    }
    
    if (markers?.[markers?.length - 1] !== beatDuration) {
      markers?.push(beatDuration);
    }
    
    return markers;
  };

  const willDeleteAudio = existingRecordingDuration && selectedTime < existingRecordingDuration;
  const deletionRange = willDeleteAudio ? existingRecordingDuration - selectedTime : 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-2">Select Punch-In Point</h3>
        <p className="text-gray-400 text-sm mb-6">
          Click on the timeline to select where you want to start recording. The system will automatically delete any overlapping audio.
        </p>

        <div className="space-y-6">
          {/* Timeline Visualization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300 font-medium">Timeline</span>
              <span className="text-gray-400 font-mono">
                {hoveredTime !== null ? formatTime(hoveredTime) : formatTime(selectedTime)}
              </span>
            </div>

            {/* Waveform Visualizer for Punch-In Selection */}
            <WaveformVisualizer
              isRecording={false}
              audioStream={null}
              onPunchInSelect={handleWaveformSelect}
              beatDuration={beatDuration}
              existingRecordingDuration={existingRecordingDuration}
            />

            {/* Main Timeline */}
            <div
              ref={timelineRef}
              onClick={handleTimelineClick}
              onMouseMove={handleTimelineHover}
              onMouseLeave={() => setHoveredTime(null)}
              className="relative h-32 bg-gray-900 rounded-lg border border-gray-700 cursor-crosshair overflow-hidden"
            >
              {/* Existing Recording Indicator */}
              {existingRecordingDuration > 0 && (
                <div
                  className="absolute top-0 bottom-0 bg-blue-500/20 border-r-2 border-blue-500"
                  style={{
                    left: 0,
                    width: `${(existingRecordingDuration / beatDuration) * 100}%`
                  }}
                >
                  <div className="absolute top-2 left-2 text-xs text-blue-300 font-medium">
                    Existing Recording
                  </div>
                </div>
              )}

              {/* Deletion Zone (if punch-in overlaps) */}
              {willDeleteAudio && (
                <div
                  className="absolute top-0 bottom-0 bg-red-500/30 border-r-2 border-red-500"
                  style={{
                    left: `${(selectedTime / beatDuration) * 100}%`,
                    width: `${(deletionRange / beatDuration) * 100}%`
                  }}
                >
                  <div className="absolute top-2 left-2 text-xs text-red-300 font-medium">
                    Will Delete
                  </div>
                </div>
              )}

              {/* Waveform Visualization (Mock) */}
              <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-2">
                {Array.from({ length: 100 })?.map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gray-600 rounded-full"
                    style={{
                      height: `${Math.sin(i * 0.5) * 20 + 30 + Math.random() * 20}%`,
                      opacity: 0.6
                    }}
                  />
                ))}
              </div>

              {/* Selected Punch-In Point */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-accent z-10"
                style={{
                  left: `${(selectedTime / beatDuration) * 100}%`
                }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-full" />
                <div className="absolute top-1/2 left-2 -translate-y-1/2 bg-accent text-accent-foreground px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                  Punch-In: {formatTime(selectedTime)}
                </div>
              </div>

              {/* Hover Indicator */}
              {hoveredTime !== null && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-white/50 pointer-events-none"
                  style={{
                    left: `${(hoveredTime / beatDuration) * 100}%`
                  }}
                />
              )}
            </div>

            {/* Time Markers */}
            <div className="relative h-6">
              {getTimeMarkers()?.map((time) => (
                <div
                  key={time}
                  className="absolute top-0 flex flex-col items-center"
                  style={{
                    left: `${(time / beatDuration) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="w-px h-2 bg-gray-600" />
                  <span className="text-xs text-gray-500 font-mono mt-1">
                    {formatTime(time)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pre-roll Info */}
            <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="Clock" size={20} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-300 mb-1">Pre-roll: 10 seconds</h4>
                  <p className="text-xs text-blue-200/80">
                    Recording will start automatically after a 10-second countdown, giving you time to prepare.
                  </p>
                </div>
              </div>
            </div>

            {/* Deletion Warning */}
            {willDeleteAudio ? (
              <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon name="AlertTriangle" size={20} className="text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-red-300 mb-1">
                      Will delete {formatTime(deletionRange)}
                    </h4>
                    <p className="text-xs text-red-200/80">
                      Punching in at {formatTime(selectedTime)} will automatically delete the overlapping portion of your existing recording.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon name="CheckCircle" size={20} className="text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-green-300 mb-1">No overlap</h4>
                    <p className="text-xs text-green-200/80">
                      Recording will continue from {formatTime(selectedTime)} without deleting any existing audio.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Time Presets */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Quick Select</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTime(0)}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Start (0:00)
              </button>
              {existingRecordingDuration > 0 && (
                <button
                  onClick={() => setSelectedTime(existingRecordingDuration)}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  After Recording ({formatTime(existingRecordingDuration)})
                </button>
              )}
              <button
                onClick={() => setSelectedTime(beatDuration / 2)}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Middle ({formatTime(beatDuration / 2)})
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <Button
              onClick={onCancel}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={() => onPunchInSelect(selectedTime)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              iconName="Circle"
              iconPosition="left"
            >
              Start Recording at {formatTime(selectedTime)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PunchInTimeline;