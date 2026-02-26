import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Icon from '../components/AppIcon';

const SignUp = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password?.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase?.auth?.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'free'
          }
        }
      });

      if (signUpError) {
        setError(signUpError?.message || 'Failed to create account');
      } else if (data?.session) {
        // Session exists — auto-confirmed, go straight to studio
        navigate('/recording-studio');
      } else if (data?.user) {
        // User created but no session yet — email confirmation may be required
        // Try signing in immediately
        const { data: signInData, error: signInError } = await supabase?.auth?.signInWithPassword({
          email,
          password
        });
        if (!signInError && signInData?.session) {
          navigate('/recording-studio');
        } else {
          // Email confirmation required
          setSuccess(true);
        }
      } else {
        setError('Account creation failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Helmet>
          <title>Sign Up - MAKINGITMIXPROSTUDIO</title>
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
                <Icon name="Check" className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Account Created!</h1>
              <p className="text-gray-400 mb-6">Check your email to confirm your account, then sign in.</p>
              <Link
                to="/sign-in"
                className="inline-block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors text-center"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sign Up - MAKINGITMIXPROSTUDIO</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
                <Icon name="Music" className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
              <p className="text-gray-400">Start your recording journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon name="AlertCircle" className="w-5 h-5 text-red-400" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e?.target?.value)}
                  placeholder="John Doe"
                  required
                  className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

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
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e?.target?.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e?.target?.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="Loader" className="w-5 h-5 animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  'Sign Up'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <Link to="/sign-in" className="text-purple-400 hover:text-purple-300 font-semibold">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;