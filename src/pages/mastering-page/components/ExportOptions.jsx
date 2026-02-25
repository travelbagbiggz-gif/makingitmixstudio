import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';

const ExportOptions = ({ format, onFormatChange, metadata, onMetadataChange, onExport, disabled }) => {
  const formatOptions = [
    { value: 'wav', label: 'WAV 24-bit', description: 'Uncompressed, highest quality' },
    { value: 'mp3', label: 'MP3 320kbps', description: 'Compressed, universal compatibility' },
    { value: 'flac', label: 'FLAC', description: 'Lossless compression' }
  ];

  const handleMetadataChange = (field, value) => {
    onMetadataChange({ ...metadata, [field]: value });
  };

  return (
    <div className="p-4 md:p-6 rounded-lg bg-card border border-border space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Export Master</h3>
        <p className="text-sm text-muted-foreground">
          Choose format and add metadata
        </p>
      </div>

      {/* Format Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Export Format</label>
        <Select
          options={formatOptions}
          value={format}
          onChange={onFormatChange}
          placeholder="Select format"
        />
      </div>

      {/* Metadata Fields */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-sm font-medium">Track Metadata</h4>
        
        <Input
          label="Artist"
          placeholder="Enter artist name"
          value={metadata?.artist}
          onChange={(e) => handleMetadataChange('artist', e?.target?.value)}
        />

        <Input
          label="Title"
          placeholder="Enter track title"
          value={metadata?.title}
          onChange={(e) => handleMetadataChange('title', e?.target?.value)}
        />

        <Input
          label="Album"
          placeholder="Enter album name"
          value={metadata?.album}
          onChange={(e) => handleMetadataChange('album', e?.target?.value)}
        />
      </div>

      {/* Export Info */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">File Size</span>
          <span className="font-medium">
            {format === 'wav' ? '~45 MB' : format === 'flac' ? '~28 MB' : '~8 MB'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Sample Rate</span>
          <span className="font-medium">44.1 kHz</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Bit Depth</span>
          <span className="font-medium">
            {format === 'wav' ? '24-bit' : format === 'flac' ? '24-bit' : '320 kbps'}
          </span>
        </div>
      </div>

      {/* Export Button */}
      <Button
        variant="default"
        size="lg"
        fullWidth
        onClick={onExport}
        disabled={disabled}
        iconName="Download"
        iconPosition="left"
      >
        Export Master
      </Button>

      {disabled && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 text-warning">
          <Icon name="Info" size={16} className="mt-0.5" />
          <p className="text-xs">
            Complete the mastering process before exporting
          </p>
        </div>
      )}
    </div>
  );
};

export default ExportOptions;