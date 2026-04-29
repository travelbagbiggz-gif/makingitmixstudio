import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import Mixer from '../components/Mixer'
import Waveform from '../components/Waveform'
import Autotune from '../components/Autotune'

function StudioPage({ user }) {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(true)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const token = localStorage.getItem('auth_token')

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  const fetchSession = async () => {
    try {
      const response = await fetch(`${apiUrl}/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setSession(data.data)
    } catch (error) {
      console.error('Failed to fetch session:', error)
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const chunks = []

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        await uploadAudio(blob)
      }

      mediaRecorder.start()
      setRecording(true)
    } catch (error) {
      console.error('Microphone access denied:', error)
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    setRecording(false)
  }

  const uploadAudio = async (blob) => {
    const formData = new FormData()
    formData.append('file', blob)

    try {
      const response = await fetch(`${apiUrl}/upload/audio`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      const data = await response.json()
      console.log('Audio uploaded:', data)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8 gradient-text">{session?.title}</h1>

        {/* Recording Controls */}
        <div className="mb-8 flex gap-4">
          {!recording ? (
            <button onClick={startRecording} className="btn-success px-6 py-3 rounded-lg">
              🎤 Start Recording
            </button>
          ) : (
            <button onClick={stopRecording} className="btn-primary px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700">
              ⏹ Stop Recording
            </button>
          )}
        </div>

        {/* Main Studio Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Waveform Display */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Waveform</h2>
              <Waveform />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Autotune Control */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Autotune</h2>
              <Autotune session={session} />
            </div>

            {/* Session Info */}
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Session Info</h3>
              <p className="text-sm text-gray-400 mb-2">Preset: <span className="text-blue-400">{session?.preset}</span></p>
              <p className="text-sm text-gray-400">Status: <span className="text-green-400 capitalize">{session?.status || 'active'}</span></p>
            </div>
          </div>
        </div>

        {/* Mixer */}
        <div className="mt-8 card">
          <h2 className="text-xl font-bold mb-4">Mixer</h2>
          <Mixer />
        </div>
      </div>
    </div>
  )
}

export default StudioPage
