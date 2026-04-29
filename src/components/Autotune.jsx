import React, { useState } from 'react'
import { Music, Settings } from 'lucide-react'

function Autotune({ session }) {
  const [autotuneSettings, setAutotuneSettings] = useState({
    enabled: session?.autotune_enabled || true,
    scale: session?.preset || 'major',
    retuneSpeed: session?.retune_speed || 50,
    pitchCorrection: 100,
    humanize: 0
  })

  const scales = ['Major', 'Minor', 'Pentatonic', 'Blues', 'Chromatic']

  const handleChange = (key, value) => {
    setAutotuneSettings({ ...autotuneSettings, [key]: value })
  }

  return (
    <div className="space-y-4">
      {/* Enable/Disable */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autotuneSettings.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">Enable Autotune</span>
        </label>
        <Music className="w-5 h-5 text-purple-400" />
      </div>

      {autotuneSettings.enabled && (
        <>
          {/* Scale Selection */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Scale</label>
            <select
              value={autotuneSettings.scale}
              onChange={(e) => handleChange('scale', e.target.value)}
              className="input"
            >
              {scales.map(scale => (
                <option key={scale} value={scale.toLowerCase()}>{scale}</option>
              ))}
            </select>
          </div>

          {/* Retune Speed */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Retune Speed: {autotuneSettings.retuneSpeed}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={autotuneSettings.retuneSpeed}
              onChange={(e) => handleChange('retuneSpeed', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Pitch Correction */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Pitch Correction: {autotuneSettings.pitchCorrection}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={autotuneSettings.pitchCorrection}
              onChange={(e) => handleChange('pitchCorrection', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Humanize */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Humanize: {autotuneSettings.humanize}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={autotuneSettings.humanize}
              onChange={(e) => handleChange('humanize', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Info */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded p-2 text-xs text-blue-300">
            ⚡ Ultra-low latency &lt;50ms processing
          </div>
        </>
      )}
    </div>
  )
}

export default Autotune
