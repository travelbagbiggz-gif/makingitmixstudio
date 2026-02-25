import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';

const DeviceSelector = ({ onDeviceChange, disabled }) => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const deviceList = await navigator.mediaDevices?.enumerateDevices();
      const audioInputs = deviceList?.filter(device => device?.kind === 'audioinput');
      
      const deviceOptions = audioInputs?.map(device => ({
        value: device?.deviceId,
        label: device?.label || `Microphone ${audioInputs?.indexOf(device) + 1}`,
        description: device?.deviceId === 'default' ? 'System default' : ''
      }));

      setDevices(deviceOptions);
      
      // Set default device if none selected
      if (!selectedDevice && deviceOptions?.length > 0) {
        const defaultDevice = deviceOptions?.find(d => d?.value === 'default') || deviceOptions?.[0];
        setSelectedDevice(defaultDevice?.value);
        onDeviceChange?.(defaultDevice?.value);
      }
    } catch (error) {
      console.error('Failed to load audio devices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
    
    // Listen for device changes
    navigator.mediaDevices?.addEventListener('devicechange', loadDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', loadDevices);
    };
  }, []);

  const handleDeviceChange = (deviceId) => {
    setSelectedDevice(deviceId);
    onDeviceChange?.(deviceId);
  };

  return (
    <div className="p-4 rounded-lg bg-card border border-border space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon name="Mic2" size={20} color="var(--color-primary)" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium">Audio Input Device</h4>
          <p className="text-xs text-muted-foreground">Select microphone or audio interface</p>
        </div>
      </div>
      <Select
        options={devices}
        value={selectedDevice}
        onChange={handleDeviceChange}
        placeholder="Select audio input..."
        disabled={disabled || loading}
        loading={loading}
        searchable={devices?.length > 5}
      />
      {devices?.length === 0 && !loading && (
        <div className="flex items-center gap-2 p-2 rounded bg-warning/10 text-warning">
          <Icon name="AlertTriangle" size={16} />
          <span className="text-xs font-medium">No audio input devices found</span>
        </div>
      )}
    </div>
  );
};

export default DeviceSelector;