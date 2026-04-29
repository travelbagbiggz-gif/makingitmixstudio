import React from 'react'
import { Link } from 'react-router-dom'
import { Music, Zap, BarChart3, Lock } from 'lucide-react'

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 gradient-text">MakingMixProStudio</h1>
          <p className="text-xl text-gray-400 mb-8">Professional Recording, Mixing & Mastering Online</p>
          <Link to="/auth" className="btn-primary inline-block px-8 py-3 text-lg rounded-lg">Get Started Free</Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <div className="card">
            <Music className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Record & Import</h3>
            <p className="text-gray-400">Record vocals or import your beats instantly</p>
          </div>
          <div className="card">
            <Zap className="w-12 h-12 text-green-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Pro Tools UI</h3>
            <p className="text-gray-400">Industry-standard interface you know</p>
          </div>
          <div className="card">
            <BarChart3 className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Mix & Master</h3>
            <p className="text-gray-400">Professional mixing and mastering tools</p>
          </div>
          <div className="card">
            <Lock className="w-12 h-12 text-red-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Secure & Fast</h3>
            <p className="text-gray-400">Enterprise-grade security & low latency</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
