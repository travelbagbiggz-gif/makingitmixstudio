import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Icon from '../components/AppIcon';

const SignIn = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError?.message || 'Failed to sign in');
      } else {
        navigate('/recording-studio');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('demo@studio.com');
    setPassword('demo123');
  };

  return (
    <>
      <Helmet>
        <title>Sign In - MAKINGITMIXPROSTUDIO</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
                <Icon name="music" className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-gray-400">Sign in to continue recording</p>
            </div>

            {showDemoCredentials && (
              <div className="mb-6 p-4 bg-purple-900/30 border border-purple-500/50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon name="info" className="w-5 h-5 text-purple-400" />
                    <p className="text-sm font-semibold text-purple-300">Demo Account</p>
                  </div>
                  <button
                    onClick={() => setShowDemoCredentials(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Icon name="x" className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-300 mb-3">Try the app with demo credentials:</p>
                <div className="space-y-1 text-xs text-gray-300 mb-3">
                  <p><span className="text-gray-400">Email:</span> demo@studio.com</p>
                  <p><span className="text-gray-400">Password:</span> demo123</p>
                </div>
                <Button
                  onClick={fillDemoCredentials}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-2"
                >
                  Use Demo Credentials
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon name="alert-circle" className="w-5 h-5 text-red-400" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e?.target?.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e?.target?.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    <Icon name={showPassword ? 'EyeOff' : 'Eye'} className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="loader" className="w-5 h-5 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <Link to="/sign-up" className="text-purple-400 hover:text-purple-300 font-semibold">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignIn;