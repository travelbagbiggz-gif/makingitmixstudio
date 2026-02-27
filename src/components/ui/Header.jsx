import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../AppIcon';
import Button from './Button';

const Header = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut, isProUser } = useAuth();
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  const handleSignOut = async () => {
    await signOut();
    navigate('/sign-in');
  };

  const handleCreateSession = () => {
    setNewSessionName('');
    setShowNewSessionModal(true);
  };

  const handleStartSession = () => {
    const name = newSessionName?.trim() || 'Untitled Session';
    setShowNewSessionModal(false);
    navigate('/recording-studio', { state: { sessionName: name } });
  };

  const handleModalKeyDown = (e) => {
    if (e?.key === 'Enter') handleStartSession();
    if (e?.key === 'Escape') setShowNewSessionModal(false);
  };

  const isAdmin = userProfile?.role === 'admin';
  const showProBadge = isProUser || isAdmin;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/98 backdrop-blur-md border-b border-gray-800/60" style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.5)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-amber-500/30 group-hover:ring-amber-500/60 transition-all">
                <img
                  src="/assets/images/JPEG_image-4055-9F47-20-0-1772030553207.jpeg"
                  alt="MakingItMixProStudio logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[11px] font-mono font-semibold tracking-[0.25em] uppercase text-amber-400/80">Making It</span>
                <span
                  className="text-lg font-black tracking-[0.12em] uppercase leading-none"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 30%, #ffffff 55%, #fbbf24 75%, #d97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '0.12em',
                    textShadow: 'none',
                    filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.3))'
                  }}
                >
                  MIX PRO STUDIO
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {user && (
                <Link to="/dashboard-welcome-screen" className="text-gray-300 hover:text-amber-400 transition-colors text-sm font-medium tracking-wide">
                  Dashboard
                </Link>
              )}
              <Link to="/fine-tune-mix-page" className="text-gray-300 hover:text-amber-400 transition-colors text-sm font-medium tracking-wide">
                Mix
              </Link>
              <Link to="/mastering-page" className="text-gray-300 hover:text-amber-400 transition-colors text-sm font-medium tracking-wide">
                Master
              </Link>
              {user && (
                <>
                  <Link to="/project-management" className="text-gray-300 hover:text-amber-400 transition-colors text-sm font-medium tracking-wide">
                    Projects
                  </Link>
                  <Link to="/billing-account-management" className="text-gray-300 hover:text-amber-400 transition-colors text-sm font-medium tracking-wide">
                    Billing
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="text-gray-300 hover:text-amber-400 transition-colors text-sm font-medium tracking-wide">
                      Admin
                    </Link>
                  )}
                </>
              )}
            </nav>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {showProBadge && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/40 rounded-full">
                      <Icon name="Crown" size={14} color="#f59e0b" />
                      <span className="text-xs font-semibold text-amber-400">PRO</span>
                    </div>
                  )}
                  <Link to="/account-management">
                    <Button className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white">
                      <Icon name="user" className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    onClick={handleCreateSession}
                    className="bg-purple-600 hover:bg-purple-700 border border-purple-500 text-white text-sm font-semibold"
                  >
                    <Icon name="Plus" size={14} className="mr-1" />
                    Create New Session
                  </Button>
                  <Button
                    onClick={handleSignOut}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/sign-in">
                    <Button className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/sign-up">
                    <Button className="text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#000', border: 'none' }}>
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowNewSessionModal(false)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center">
                <Icon name="Mic" size={20} color="#a855f7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">New Recording Session</h2>
                <p className="text-sm text-gray-400">Name your project to get started</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
              <input
                type="text"
                value={newSessionName}
                onChange={e => setNewSessionName(e?.target?.value)}
                onKeyDown={handleModalKeyDown}
                placeholder="e.g. Summer Vibes, Track 01..."
                className="w-full bg-gray-800 border border-gray-600 focus:border-purple-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors text-sm"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">Leave blank to use "Untitled Session"</p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowNewSessionModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartSession}
                className="flex-1 bg-purple-600 hover:bg-purple-700 border border-purple-500 text-white text-sm font-semibold"
              >
                <Icon name="Play" size={14} className="mr-1" />
                Start Session
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;