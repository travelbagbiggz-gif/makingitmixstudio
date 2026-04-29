import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Music, Settings } from 'lucide-react'

function DashboardPage({ user }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewSession, setShowNewSession] = useState(false)
  const [sessionTitle, setSessionTitle] = useState('')
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const token = localStorage.getItem('auth_token')

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${apiUrl}/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setSessions(data.data || [])
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const createSession = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${apiUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: sessionTitle,
          description: 'New recording session',
          preset: 'hiphop',
          autotune_enabled: true,
          retune_speed: 50
        })
      })
      const data = await response.json()
      setSessions([data.data, ...sessions])
      setSessionTitle('')
      setShowNewSession(false)
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="container mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2 gradient-text">Welcome, {user?.full_name}</h1>
          <p className="text-gray-400">Manage your recording sessions</p>
        </div>

        {/* New Session Button */}
        <button
          onClick={() => setShowNewSession(!showNewSession)}
          className="btn-primary px-6 py-3 rounded-lg mb-8 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Session
        </button>

        {/* New Session Form */}
        {showNewSession && (
          <form onSubmit={createSession} className="card mb-8">
            <input
              type="text"
              placeholder="Session Title"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              className="input mb-4"
              required
            />
            <div className="flex gap-4">
              <button type="submit" className="btn-success px-6 py-2 rounded">Create</button>
              <button
                type="button"
                onClick={() => setShowNewSession(false)}
                className="btn-secondary px-6 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Sessions Grid */}
        {loading ? (
          <div className="flex justify-center">
            <div className="spinner"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="card text-center py-12">
            <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No sessions yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Link
                key={session.id}
                to={`/studio/${session.id}`}
                className="card hover:border-blue-500 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <Music className="w-8 h-8 text-blue-400 group-hover:text-blue-300" />
                  <span className="text-xs bg-gray-700 px-3 py-1 rounded">{session.preset}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{session.title}</h3>
                <p className="text-sm text-gray-400 mb-4">{session.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(session.created_at).toLocaleDateString()}</span>
                  <span className={session.autotune_enabled ? 'text-green-400' : 'text-gray-500'}>Autotune: {session.autotune_enabled ? 'ON' : 'OFF'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
