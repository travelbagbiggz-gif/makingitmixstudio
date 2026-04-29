import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Settings } from 'lucide-react'

function Navigation({ user, setUser }) {
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const token = localStorage.getItem('auth_token')

  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl}/auth/signout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    localStorage.removeItem('auth_token')
    setUser(null)
    navigate('/')
  }

  return (
    <nav className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold gradient-text">🎵 MakingMix</Link>
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-gray-300 hover:text-white transition">
            Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="btn-secondary px-4 py-2 rounded flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
