import React, { useState } from 'react'
import { Volume2, Sliders } from 'lucide-react'

function Mixer() {
  const [tracks, setTracks] = useState([
    { id: 1, name: 'Vocal', volume: 75, pan: 0, muted: false },
    { id: 2, name: 'Beat', volume: 80, pan: 0, muted: false },
    { id: 3, name: 'Drums', volume: 70, pan: 0, muted: false },
    { id: 4, name: 'Bass', volume: 65, pan: 0, muted: false }
  ])

  const updateTrack = (id, key, value) => {
    setTracks(tracks.map(t => t.id === id ? { ...t, [key]: value } : t))
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 pb-4">
        {tracks.map((track) => (
          <div key={track.id} className="bg-gray-700/50 rounded-lg p-4 min-w-[150px] border border-gray-600">
            <div className="text-center mb-4">
              <h3 className="font-bold text-white">{track.name}</h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Volume2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">{track.volume}%</span>
              </div>
            </div>

            {/* Volume Fader */}
            <div className="flex justify-center mb-4">
              <input
                type="range"
                min="0"
                max="100"
                value={track.volume}
                onChange={(e) => updateTrack(track.id, 'volume', parseInt(e.target.value))}
                className="mixer-fader"
                style={{
                  height: '150px',
                  background: `linear-gradient(to top, #3b82f6 0%, #3b82f6 ${track.volume}%, #4b5563 ${track.volume}%, #4b5563 100%)`
                }}
              />
            </div>

            {/* Pan */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-2">Pan: {track.pan}%</label>
              <input
                type="range"
                min="-100"
                max="100"
                value={track.pan}
                onChange={(e) => updateTrack(track.id, 'pan', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Mute Button */}
            <button
              onClick={() => updateTrack(track.id, 'muted', !track.muted)}
              className={`w-full py-2 rounded font-bold text-sm transition ${
                track.muted ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
              }`}
            >
              {track.muted ? 'MUTED' : 'MUTE'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Mixer
