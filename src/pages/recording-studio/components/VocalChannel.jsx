import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VocalChannel = ({ 
  title, 
  channels, 
  onRecord, 
  onPlayback, 
  onDelete,
  disabled 
}) => {
  const channelTypes = [
    { id: 'lead', name: 'Lead Vocal', icon: 'Mic', color: 'var(--color-accent)' },
    { id: 'double', name: 'Double Vocal', icon: 'Copy', color: 'var(--color-secondary)' },
    { id: 'adlib', name: 'Adlib Vocal', icon: 'Sparkles', color: 'var(--color-primary)' },
    { id: 'extra', name: 'Extra Vocal', icon: 'Plus', color: 'var(--color-success)' },
  ];

  return (
    <div className="space-y-3 p-4 rounded-lg bg-card border border-border">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium uppercase tracking-wider font-mono">{title}</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            {channels?.filter(c => c?.recorded)?.length}/{channels?.length} recorded
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {channelTypes?.map((type) => {
          const channel = channels?.find(c => c?.id === type?.id);
          const isRecording = channel?.isRecording;
          const isPlaying = channel?.isPlaying;
          const isRecorded = channel?.recorded;

          return (
            <div
              key={type?.id}
              className={`p-3 rounded-lg border transition-studio ${
                isRecording
                  ? 'border-error bg-error/5'
                  : isRecorded
                  ? 'border-success/30 bg-success/5' :'border-border bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isRecording ? 'bg-error/20' : 'bg-muted'
                    }`}
                  >
                    <Icon
                      name={type?.icon}
                      size={16}
                      color={isRecording ? 'var(--color-error)' : type?.color}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{type?.name}</div>
                    {isRecorded && (
                      <div className="text-xs text-muted-foreground font-data">
                        {channel?.duration || '0:00'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isRecording && (
                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-error/10">
                      <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                      <span className="text-xs font-mono text-error">REC</span>
                    </div>
                  )}

                  {isRecorded && !isRecording && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onPlayback(title, type?.id)}
                        disabled={disabled}
                        iconName={isPlaying ? 'Pause' : 'Play'}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(title, type?.id)}
                        disabled={disabled}
                        iconName="Trash2"
                      />
                    </>
                  )}

                  <Button
                    variant={isRecording ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => onRecord(title, type?.id)}
                    disabled={disabled && !isRecording}
                    iconName={isRecording ? 'Square' : 'Circle'}
                    iconPosition="left"
                  >
                    {isRecording ? 'Stop' : 'Record'}
                  </Button>
                </div>
              </div>
              {isRecording && (
                <div className="mt-3 space-y-2">
                  <div className="h-12 bg-muted rounded flex items-center justify-center overflow-hidden">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 40 })?.map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-error rounded-full animate-pulse"
                          style={{
                            height: `${Math.random() * 30 + 10}px`,
                            animationDelay: `${i * 0.05}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-mono">Recording...</span>
                    <span className="font-data text-error">0:00</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VocalChannel;