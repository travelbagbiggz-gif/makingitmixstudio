import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';

const AutoSaveIndicator = ({ sessionData, sessionId, onAutoSave }) => {
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const [lastSaved, setLastSaved] = useState(null);
  const timerRef = useRef(null);
  const prevDataRef = useRef(null);

  useEffect(() => {
    const dataStr = JSON.stringify(sessionData);
    if (prevDataRef?.current === dataStr) return;
    prevDataRef.current = dataStr;

    // Debounce auto-save by 3 seconds
    if (timerRef?.current) clearTimeout(timerRef?.current);
    setStatus('idle');
    timerRef.current = setTimeout(async () => {
      setStatus('saving');
      try {
        // Save to localStorage as backup
        const key = `autosave_${sessionId || 'default'}`;
        localStorage.setItem(key, JSON.stringify({
          data: sessionData,
          timestamp: Date.now(),
        }));
        if (onAutoSave) await onAutoSave(sessionData);
        setStatus('saved');
        setLastSaved(new Date());
        setTimeout(() => setStatus('idle'), 3000);
      } catch (e) {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 5000);
      }
    }, 3000);

    return () => { if (timerRef?.current) clearTimeout(timerRef?.current); };
  }, [sessionData, sessionId, onAutoSave]);

  const formatTime = (date) => {
    if (!date) return '';
    return date?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (status === 'idle' && !lastSaved) return null;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono transition-all ${
      status === 'saving' ? 'border-yellow-600/50 bg-yellow-900/10 text-yellow-400' :
      status === 'saved' ? 'border-green-600/50 bg-green-900/10 text-green-400' :
      status === 'error'? 'border-red-600/50 bg-red-900/10 text-red-400' : 'border-gray-700 bg-transparent text-gray-500'
    }`}>
      {status === 'saving' && <Icon name="Loader" size={10} className="animate-spin" />}
      {status === 'saved' && <Icon name="Check" size={10} />}
      {status === 'error' && <Icon name="AlertCircle" size={10} />}
      {status === 'idle' && lastSaved && <Icon name="Cloud" size={10} />}
      <span>
        {status === 'saving' ? 'Saving...' :
         status === 'saved' ? 'Auto-saved' :
         status === 'error' ? 'Save failed' :
         lastSaved ? `Saved ${formatTime(lastSaved)}` : ''}
      </span>
    </div>
  );
};

export default AutoSaveIndicator;
