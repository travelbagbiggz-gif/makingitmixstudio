import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/AppIcon';

const AutotunePresetManager = ({
  intensity,
  wetMix,
  beatVolume,
  retuneSpeed,
  onLoadPreset,
}) => {
  const { user } = useAuth();
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const fetchPresets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase?.from('autotune_presets')?.select('*')?.eq('user_id', user?.id)?.order('created_at', { ascending: false });
      if (!fetchError) {
        setPresets(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch presets:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const handleSave = async () => {
    if (!user) return;
    const trimmed = presetName?.trim();
    if (!trimmed) {
      setError('Please enter a preset name');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { error: saveError } = await supabase?.from('autotune_presets')?.insert({
          user_id: user?.id,
          name: trimmed,
          intensity: intensity ?? 100,
          wet_mix: wetMix ?? 100,
          beat_volume: beatVolume ?? 80,
          retune_speed: retuneSpeed ?? 50,
        });
      if (saveError) {
        setError(saveError?.message || 'Failed to save preset');
      } else {
        setPresetName('');
        setShowSaveForm(false);
        fetchPresets();
      }
    } catch (err) {
      setError('Failed to save preset');
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = (preset) => {
    onLoadPreset?.({
      intensity: preset?.intensity,
      wetMix: preset?.wet_mix,
      beatVolume: preset?.beat_volume,
      retuneSpeed: preset?.retune_speed,
    });
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
    try {
      const { error: delError } = await supabase?.from('autotune_presets')?.delete()?.eq('id', id)?.eq('user_id', user?.id);
      if (!delError) {
        setPresets(prev => prev?.filter(p => p?.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleteId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="Bookmark" size={14} color="var(--color-accent)" />
          <span className="text-xs font-medium font-mono text-muted-foreground">MY PRESETS</span>
        </div>
        <button
          onClick={() => { setShowSaveForm(v => !v); setError(''); }}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 hover:bg-accent/20 text-accent text-[10px] font-mono transition-all"
        >
          <Icon name="Plus" size={11} />
          Save Current
        </button>
      </div>
      {/* Save Form */}
      {showSaveForm && (
        <div className="space-y-2 p-2 rounded-md bg-muted/20 border border-border">
          <p className="text-[9px] font-mono text-muted-foreground">
            Saving: Intensity {intensity}% · Wet {wetMix}% · Beat Vol {beatVolume}% · Speed {retuneSpeed}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e?.target?.value)}
              onKeyDown={(e) => e?.key === 'Enter' && handleSave()}
              placeholder="Preset name (e.g. Hard T-Pain)"
              maxLength={40}
              className="flex-1 bg-gray-800 border border-gray-600 text-white text-xs rounded-md px-2 py-1.5 placeholder-gray-500 focus:outline-none focus:border-accent"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 rounded-md bg-accent text-white text-xs font-mono disabled:opacity-50 hover:bg-accent/80 transition-all"
            >
              {saving ? '...' : 'Save'}
            </button>
          </div>
          {error && <p className="text-[9px] text-red-400 font-mono">{error}</p>}
        </div>
      )}
      {/* Presets List */}
      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <Icon name="Loader" size={12} color="#6b7280" className="animate-spin" />
          <span className="text-[10px] text-muted-foreground font-mono">Loading presets...</span>
        </div>
      ) : presets?.length === 0 ? (
        <p className="text-[10px] text-muted-foreground/60 font-mono py-1">
          No saved presets yet. Save your current settings above.
        </p>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {presets?.map(preset => (
            <div
              key={preset?.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/20 border border-border hover:border-accent/30 group transition-all"
            >
              <button
                onClick={() => handleLoad(preset)}
                className="flex-1 text-left"
              >
                <p className="text-xs font-medium text-white truncate">{preset?.name}</p>
                <p className="text-[9px] font-mono text-muted-foreground">
                  I:{preset?.intensity}% · W:{preset?.wet_mix}% · BV:{preset?.beat_volume}% · S:{preset?.retune_speed}
                </p>
              </button>
              <button
                onClick={() => handleLoad(preset)}
                className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded bg-accent/20 text-accent text-[9px] font-mono transition-all"
              >
                Load
              </button>
              <button
                onClick={() => handleDelete(preset?.id)}
                disabled={deleteId === preset?.id}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-all disabled:opacity-30"
              >
                <Icon name="Trash2" size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutotunePresetManager;
