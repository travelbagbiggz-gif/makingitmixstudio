import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const SessionNotes = ({ sessionId, onNotesChange }) => {
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('notes');
  const [lyrics, setLyrics] = useState('');
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    const key = `studio_notes_${sessionId || 'default'}`;
    const lyricsKey = `studio_lyrics_${sessionId || 'default'}`;
    const saved = localStorage.getItem(key);
    const savedLyrics = localStorage.getItem(lyricsKey);
    if (saved) setNotes(saved);
    if (savedLyrics) setLyrics(savedLyrics);
  }, [sessionId]);

  const handleNotesChange = (val) => {
    setNotes(val);
    const key = `studio_notes_${sessionId || 'default'}`;
    localStorage.setItem(key, val);
    setLastSaved(new Date());
    onNotesChange?.(val);
  };

  const handleLyricsChange = (val) => {
    setLyrics(val);
    const key = `studio_lyrics_${sessionId || 'default'}`;
    localStorage.setItem(key, val);
    setLastSaved(new Date());
  };

  const formatSaved = (date) => {
    if (!date) return '';
    const diff = Math.floor((Date.now() - date?.getTime()) / 1000);
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-all ${
              activeTab === 'notes' ?'bg-gray-700 text-white' :'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon name="FileText" size={11} />
            Notes
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-all ${
              activeTab === 'lyrics' ?'bg-gray-700 text-white' :'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon name="Music" size={11} />
            Lyrics
          </button>
        </div>
        {lastSaved && (
          <span className="text-[9px] font-mono text-gray-600">Saved {formatSaved(lastSaved)}</span>
        )}
      </div>
      <div className="p-2">
        {activeTab === 'notes' ? (
          <textarea
            value={notes}
            onChange={e => handleNotesChange(e?.target?.value)}
            placeholder="Session notes, ideas, chord progressions..."
            className="w-full h-28 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs font-mono text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-gray-500"
          />
        ) : (
          <textarea
            value={lyrics}
            onChange={e => handleLyricsChange(e?.target?.value)}
            placeholder="Verse 1:\n\nChorus:\n\nVerse 2:\n\nBridge:"
            className="w-full h-28 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs font-mono text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-gray-500"
          />
        )}
      </div>
    </div>
  );
};

export default SessionNotes;
