import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const ExportPanel = ({ beatInfo, channels, onBounce, disabled }) => {
  const [format, setFormat] = useState('wav24');
  const [sampleRate, setSampleRate] = useState('44100');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [stemExporting, setStemExporting] = useState(null);

  const formats = [
    { id: 'mp3_320', label: 'MP3 320kbps', icon: '🎵', ext: 'mp3' },
    { id: 'wav16', label: 'WAV 16-bit', icon: '🔊', ext: 'wav' },
    { id: 'wav24', label: 'WAV 24-bit', icon: '🔊', ext: 'wav' },
    { id: 'flac', label: 'FLAC', icon: '🎼', ext: 'flac' },
  ];

  const sampleRates = [
    { id: '44100', label: '44.1 kHz' },
    { id: '48000', label: '48 kHz' },
    { id: '96000', label: '96 kHz' },
  ];

  const handleBounce = async () => {
    setIsExporting(true);
    setExportProgress(0);
    try {
      // Simulate export progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(r => setTimeout(r, 150));
        setExportProgress(i);
      }
      if (onBounce) await onBounce({ format, sampleRate });
      // Create a simple download trigger
      const selectedFmt = formats?.find(f => f?.id === format);
      const blob = new Blob([''], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mixdown_${Date.now()}.${selectedFmt?.ext || 'wav'}`;
      a?.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleStemExport = async (stemKey, stemLabel) => {
    setStemExporting(stemKey);
    await new Promise(r => setTimeout(r, 1500));
    const blob = new Blob([''], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stem_${stemLabel?.toLowerCase()?.replace(/\s/g, '_')}_${Date.now()}.wav`;
    a?.click();
    URL.revokeObjectURL(url);
    setStemExporting(null);
  };

  const recordedChannels = channels?.filter(c => c?.recorded);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
        <Icon name="Download" size={13} color="#22c55e" />
        <span className="text-xs font-mono text-gray-300 uppercase tracking-wider">Export & Bounce</span>
      </div>
      <div className="p-3 space-y-3">
        {/* Format Selection */}
        <div>
          <span className="text-[10px] font-mono text-gray-500 uppercase block mb-1.5">Format</span>
          <div className="grid grid-cols-2 gap-1">
            {formats?.map(f => (
              <button
                key={f?.id}
                onClick={() => setFormat(f?.id)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded border text-[10px] font-mono transition-all ${
                  format === f?.id
                    ? 'bg-green-900/30 border-green-500 text-green-300' :'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'
                }`}
              >
                <span>{f?.icon}</span>
                <span>{f?.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sample Rate */}
        <div>
          <span className="text-[10px] font-mono text-gray-500 uppercase block mb-1.5">Sample Rate</span>
          <div className="flex gap-1">
            {sampleRates?.map(sr => (
              <button
                key={sr?.id}
                onClick={() => setSampleRate(sr?.id)}
                className={`flex-1 py-1 rounded border text-[10px] font-mono transition-all ${
                  sampleRate === sr?.id
                    ? 'bg-blue-900/30 border-blue-500 text-blue-300' :'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'
                }`}
              >
                {sr?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bounce to Stereo */}
        <button
          onClick={handleBounce}
          disabled={disabled || isExporting || !beatInfo}
          className="w-full flex items-center justify-center gap-2 py-2 rounded border border-green-600 bg-green-900/20 text-green-300 hover:bg-green-900/40 transition-all text-xs font-mono font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <Icon name="Loader" size={13} className="animate-spin" />
              <span>Bouncing... {exportProgress}%</span>
            </>
          ) : (
            <>
              <Icon name="Combine" size={13} />
              <span>Bounce to Stereo Mix</span>
            </>
          )}
        </button>

        {isExporting && (
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        )}

        {/* Stem Export */}
        {recordedChannels?.length > 0 && (
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase block mb-1.5">Stem Export</span>
            <div className="space-y-1">
              {recordedChannels?.map(ch => (
                <button
                  key={ch?.id}
                  onClick={() => handleStemExport(ch?.id, ch?.customName || ch?.id)}
                  disabled={stemExporting !== null}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded border border-gray-600 bg-gray-800 hover:border-gray-500 text-[10px] font-mono text-gray-300 hover:text-white transition-all disabled:opacity-50"
                >
                  <span>{ch?.customName || ch?.id?.charAt(0)?.toUpperCase() + ch?.id?.slice(1)}</span>
                  {stemExporting === ch?.id ? (
                    <Icon name="Loader" size={11} className="animate-spin text-green-400" />
                  ) : (
                    <Icon name="Download" size={11} color="#6b7280" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportPanel;
