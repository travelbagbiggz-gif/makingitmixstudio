import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MixHistory = ({ history, currentIndex, onUndo, onRedo }) => {
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history?.length - 1;

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center bg-accent/15">
            <Icon name="History" size={24} color="var(--color-accent)" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-semibold text-foreground">Mix History</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              {history?.length} {history?.length === 1 ? 'change' : 'changes'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            iconName="Undo"
            iconPosition="left"
            className="hidden md:flex"
          >
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            iconName="Redo"
            iconPosition="left"
            className="hidden md:flex"
          >
            Redo
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onUndo}
            disabled={!canUndo}
            className="md:hidden w-10 h-10"
          >
            <Icon name="Undo" size={18} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onRedo}
            disabled={!canRedo}
            className="md:hidden w-10 h-10"
          >
            <Icon name="Redo" size={18} />
          </Button>
        </div>
      </div>
      <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
        {history?.slice()?.reverse()?.map((item, index) => {
          const actualIndex = history?.length - 1 - index;
          const isCurrent = actualIndex === currentIndex;
          const isPast = actualIndex < currentIndex;
          
          return (
            <div
              key={item?.id}
              className={`p-3 rounded-lg transition-studio ${
                isCurrent 
                  ? 'bg-accent/15 border border-accent' 
                  : isPast 
                  ? 'bg-muted/50 opacity-60' :'bg-muted/30 opacity-40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon 
                      name={item?.icon} 
                      size={14} 
                      className={isCurrent ? 'text-accent' : 'text-muted-foreground'} 
                    />
                    <p className={`text-xs md:text-sm font-medium truncate ${
                      isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {item?.action}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {item?.timestamp}
                  </p>
                </div>
                {isCurrent && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-accent/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="text-xs font-mono text-accent">Current</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Position: {currentIndex + 1} of {history?.length}</span>
          <span className="font-mono">{canUndo ? `${currentIndex} undo available` : 'No undo'}</span>
        </div>
      </div>
    </div>
  );
};

export default MixHistory;