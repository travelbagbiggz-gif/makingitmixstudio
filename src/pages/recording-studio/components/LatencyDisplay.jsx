import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';

const LatencyDisplay = ({ audioContext, isRecording, isBluetoothDevice, compensationMs }) => {
  const [latency, setLatency] = useState(null);
  const [bufferSize, setBufferSize] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const measure = () => {
      if (audioContext && audioContext?.state !== 'closed') {
        const baseLatency = (audioContext?.baseLatency || 0) * 1000;
        const outputLatency = (audioContext?.outputLatency || 0) * 1000;
        const total = baseLatency + outputLatency;
        setLatency(total > 0 ? total : (isBluetoothDevice ? 8 : 5));
        setBufferSize(audioContext?.sampleRate ? Math.round(audioContext?.sampleRate / 200) : 256);
      } else {
        setLatency(isBluetoothDevice ? 8 : 5);
        setBufferSize(256);
      }
    };
    measure();
    intervalRef.current = setInterval(measure, 2000);
    return () => clearInterval(intervalRef?.current);
  }, [audioContext, isBluetoothDevice]);

  const getLatencyColor = (ms) => {
    if (!ms) return '#6b7280';
    if (ms < 10) return '#22c55e';
    if (ms < 20) return '#f59e0b';
    return '#ef4444';
  };

  const getLatencyLabel = (ms) => {
    if (!ms) return 'N/A';
    if (ms < 10) return 'Excellent';
    if (ms < 20) return 'Good';
    return 'High';
  };

  // Visual feedback for compensation offset level
  const getCompColor = (ms) => {
    if (!ms || ms === 0) return '#6b7280';
    if (ms <= 50) return '#22c55e';
    if (ms <= 200) return '#60a5fa';
    return '#f97316';
  };

  const getCompLabel = (ms) => {
    if (!ms || ms === 0) return 'None';
    if (ms <= 50) return 'Wired';
    if (ms <= 200) return 'BT';
    return 'High';
  };

  const color = getLatencyColor(latency);
  const compColor = getCompColor(compensationMs);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg">
      <Icon name="Gauge" size={13} color={color} />
      <div className="flex flex-col">
        <span className="text-[9px] font-mono text-gray-500 uppercase">Latency</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-mono font-bold" style={{ color }}>
            {latency ? latency?.toFixed(1) : '--'}
          </span>
          <span className="text-[9px] font-mono text-gray-500">ms</span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] font-mono text-gray-500 uppercase">Status</span>
        <span className="text-[10px] font-mono" style={{ color }}>
          {getLatencyLabel(latency)}
        </span>
      </div>
      {/* Compensation offset visual feedback — always shown */}
      <div className="flex flex-col border-l border-gray-700 pl-2">
        <span className="text-[9px] font-mono text-gray-500 uppercase">Offset</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono font-bold" style={{ color: compColor }}>
            {compensationMs ? `${Math.round(compensationMs)}ms` : '0ms'}
          </span>
          <span
            className="text-[8px] font-mono px-1 rounded"
            style={{
              background: compensationMs > 0 ? `${compColor}22` : '#1f2937',
              color: compColor,
            }}
          >
            {getCompLabel(compensationMs)}
          </span>
        </div>
      </div>
      {isBluetoothDevice && (
        <div className="flex flex-col">
          <span className="text-[9px] font-mono text-blue-500 uppercase">BT</span>
          <span className="text-[10px] font-mono text-blue-400">Active</span>
        </div>
      )}
      {isRecording && (
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px] font-mono text-red-400">LIVE</span>
        </div>
      )}
    </div>
  );
};

export default LatencyDisplay;
