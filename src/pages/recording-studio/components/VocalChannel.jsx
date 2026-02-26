import React from 'react';
import Icon from '../../../components/AppIcon';

const VocalChannel = ({
  title,
  channels,
  onRecord,
  onPlayback,
  onDelete,
  onArm,
  armedChannel,
  disabled
}) => {
  const channelTypes = [
    { id: 'lead', name: 'Lead', icon: 'Mic', color: 'var(--color-accent)' },
    { id: 'double', name: 'Double', icon: 'Copy', color: 'var(--color-secondary)' },
    { id: 'adlib', name: 'Adlib', icon: 'Sparkles', color: 'var(--color-primary)' },
    { id: 'extra', name: 'Extra', icon: 'Plus', color: 'var(--color-success)' },
  ];

  const recordedCount = channels?.filter(c => c?.recorded)?.length;

  return (
    <div className="p-4 rounded-lg bg-card border border-border space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wider font-mono">{title}</h4>
        <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
          {recordedCount}/{channels?.length}
        </span>
      </div>

      <div className="space-y-2">
        {channelTypes?.map((type) => {
          const channel = channels?.find(c => c?.id === type?.id);
          const isRecording = channel?.isRecording;
          const isPlaying = channel?.isPlaying;
          const isRecorded = channel?.recorded;
          const isArmed = armedChannel === `${title}-${type?.id}`;

          return (
            <div
              key={type?.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${
                isRecording
                  ? 'border-error/50 bg-error/5'
                  : isArmed
                  ? 'border-red-500/60 bg-red-900/10'
                  : isRecorded
                  ? 'border-success/30 bg-success/5' :'border-border bg-muted/30'
              }`}
            >
              {/* Icon */}
              <div
                className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${
                  isRecording ? 'bg-error/20' : isArmed ? 'bg-red-900/30' : 'bg-muted'
                }`}
              >
                <Icon
                  name={isRecording ? 'Mic' : type?.icon}
                  size={14}
                  color={isRecording ? 'var(--color-error)' : isArmed ? '#ef4444' : type?.color}
                />
              </div>

              {/* Label + duration */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{type?.name}</span>
                {isRecorded && !isRecording && (
                  <span className="ml-2 text-xs text-muted-foreground font-mono">{channel?.duration || '0:00'}</span>
                )}
                {isRecording && (
                  <span className="ml-2 text-xs text-error font-mono animate-pulse">● REC</span>
                )}
                {isArmed && !isRecording && (
                  <span className="ml-2 text-xs text-red-400 font-mono">ARMED</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {isRecorded && !isRecording && (
                  <>
                    <button
                      onClick={() => onPlayback(title, type?.id)}
                      disabled={disabled}
                      className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      <Icon name={isPlaying ? 'Pause' : 'Play'} size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(title, type?.id)}
                      disabled={disabled}
                      className="w-7 h-7 rounded flex items-center justify-center hover:bg-error/10 text-muted-foreground hover:text-error transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                  </>
                )}

                {/* Arm button (REC arm like Pro Tools) */}
                {!isRecording && (
                  <button
                    onClick={() => onArm && onArm(title, type?.id)}
                    disabled={disabled}
                    className={`w-7 h-7 rounded flex items-center justify-center transition-colors disabled:opacity-50 ${
                      isArmed
                        ? 'bg-red-600 hover:bg-red-700' :'bg-muted border border-border hover:bg-red-900/20 hover:border-red-700'
                    }`}
                    title={isArmed ? 'Disarm' : 'Arm for Recording'}
                  >
                    <div className={`w-3 h-3 rounded-full ${
                      isArmed ? 'bg-white' : 'bg-red-500'
                    }`} />
                  </button>
                )}

                {isRecording && (
                  <button
                    onClick={() => onRecord(title, type?.id)}
                    className="px-3 py-1 rounded text-xs font-medium bg-error text-white hover:bg-error/90 transition-colors"
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VocalChannel;