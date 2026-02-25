import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../AppIcon';
import Button from './Button';

const Header = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut, isProUser } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/sign-in');
  };

  const isAdmin = userProfile?.role === 'admin';
  const showProBadge = isProUser || isAdmin;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Icon name="music" className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">MAKINGITMIXPROSTUDIO</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/recording-studio" className="text-gray-300 hover:text-white transition-colors">
              Studio
            </Link>
            <Link to="/fine-tune-mix-page" className="text-gray-300 hover:text-white transition-colors">
              Mix
            </Link>
            <Link to="/mastering-page" className="text-gray-300 hover:text-white transition-colors">
              Master
            </Link>
            {user && (
              <>
                <Link to="/project-management" className="text-gray-300 hover:text-white transition-colors">
                  Projects
                </Link>
                <Link to="/account-management" className="text-gray-300 hover:text-white transition-colors">
                  Account
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="text-gray-300 hover:text-white transition-colors">
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
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-purple-600/20 border border-purple-600 rounded-full">
                    <Icon name="Crown" size={14} color="#a855f7" />
                    <span className="text-xs font-semibold text-purple-400">PRO</span>
                  </div>
                )}
                <Link to="/account-management">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Icon name="user" className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  onClick={handleSignOut}
                  className="bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/sign-in">
                  <Button className="bg-gray-700 hover:bg-gray-600 text-white">
                    Sign In
                  </Button>
                </Link>
                <Link to="/sign-up">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;