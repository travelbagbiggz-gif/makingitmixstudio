import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecordingControls = ({ 
  onCountInChange, 
  onLatencyCalibrate, 
  onNoiseGateChange,
  disabled 
}) => {
  const [countIn, setCountIn] = useState(4);
  const [noiseGate, setNoiseGate] = useState(-40);
  const [showCalibration, setShowCalibration] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const handleCountInChange = (value) => {
    setCountIn(value);
    onCountInChange(value);
  };

  const handleNoiseGateChange = (value) => {
    setNoiseGate(value);
    onNoiseGateChange(value);
  };

  const handleTapCalibrate = () => {
    setTapCount(prev => prev + 1);
    if (tapCount >= 3) {
      const mockLatency = Math.floor(Math.random() * 20 + 5);
      onLatencyCalibrate(mockLatency);
      setTapCount(0);
      setShowCalibration(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider font-mono">
        Recording Settings
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-card border border-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Icon name="Timer" size={20} color="var(--color-accent)" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Count-In</h4>
              <p className="text-xs text-muted-foreground">Beats before recording</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {[0, 2, 4, 8]?.map((value) => (
              <button
                key={value}
                onClick={() => handleCountInChange(value)}
                disabled={disabled}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-studio ${
                  countIn === value
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-foreground hover:bg-muted-foreground/10'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {value === 0 ? 'Off' : `${value}`}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Icon name="Gauge" size={20} color="var(--color-secondary)" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Latency Calibration</h4>
              <p className="text-xs text-muted-foreground">Tap tempo sync</p>
            </div>
          </div>
          {!showCalibration ? (
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowCalibration(true)}
              disabled={disabled}
              iconName="Zap"
              iconPosition="left"
            >
              Calibrate Latency
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={handleTapCalibrate}
                disabled={disabled}
              >
                Tap {tapCount}/4
              </Button>
              <Button
                variant="ghost"
                fullWidth
                size="sm"
                onClick={() => {
                  setShowCalibration(false);
                  setTapCount(0);
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 rounded-lg bg-card border border-border space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <Icon name="Volume2" size={20} color="var(--color-success)" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium">Noise Gate</h4>
            <p className="text-xs text-muted-foreground">Silence cleanup threshold</p>
          </div>
          <span className="text-sm font-data font-medium">{noiseGate} dB</span>
        </div>
        <input
          type="range"
          min="-60"
          max="-20"
          value={noiseGate}
          onChange={(e) => handleNoiseGateChange(parseInt(e?.target?.value))}
          disabled={disabled}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--color-success) 0%, var(--color-success) ${
              ((noiseGate + 60) / 40) * 100
            }%, var(--color-muted) ${((noiseGate + 60) / 40) * 100}%, var(--color-muted) 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>More sensitive</span>
          <span>Less sensitive</span>
        </div>
      </div>
    </div>
  );
};

export default RecordingControls;