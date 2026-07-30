import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Sparkles, ArrowRight, UserCheck, Lock, Mail, User, ShieldCheck, Sun, Moon, AlertTriangle, ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../lib/i18n';
import { Footer } from '../components/Footer';
import { isReservedUsername, sanitizeDatabaseError } from '../lib/validation';
import { useUsernameValidation } from '../hooks/useUsernameValidation';

export const AuthPage: React.FC = () => {
  const { user, login, signup, logout, language, theme, setTheme } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('2002-01-01');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);

  const usernameValidation = useUsernameValidation(username, email);

  // Perma ban check
  const [isPermaBanned, setIsPermaBanned] = useState<boolean>(false);

  // Authentication Progress Bar State
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authProgress, setAuthProgress] = useState<number>(0);
  const [authStatusStep, setAuthStatusStep] = useState<string>('Initializing Garexcell handshake...');

  useEffect(() => {
    const banFlag = localStorage.getItem('perma_ban');
    if (banFlag === 'true') {
      setIsPermaBanned(true);
    }
  }, []);

  // If user already logged in
  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
        <header className="p-4 border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">P</div>
              <span className="font-bold text-lg text-slate-900">Playxcade</span>
            </Link>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition flex items-center justify-center"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 my-8">
          <div className="w-full max-w-md p-8 text-center space-y-6">
            <div className="relative inline-block mx-auto">
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.username || 'User'}
                className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500 shadow-lg"
              />
              {user.IsIdentityVerify && (
                <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1 rounded-full ring-2 ring-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Signed in as</p>
              <h2 className="text-2xl font-extrabold text-slate-900">@{user.username || 'Garexcell User'}</h2>
              <p className="text-xs text-slate-500 mt-1">{user.email}</p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigate('/feed')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 shadow-md transition"
              >
                <span>Continue to Network</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => logout()}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Not you? Switch Account
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const handleSignupProgress = async () => {
    setIsAuthenticating(true);
    setAuthProgress(15);
    setAuthStatusStep('Establishing encrypted Garexcell connection...');

    await new Promise((r) => setTimeout(r, 400));
    setAuthProgress(45);
    setAuthStatusStep('Verifying security token & user parameters...');

    await new Promise((r) => setTimeout(r, 500));
    setAuthProgress(75);
    setAuthStatusStep('Provisioning profile & cryptographic credentials...');

    await new Promise((r) => setTimeout(r, 400));
    setAuthProgress(95);
    setAuthStatusStep('Finalizing authentication session...');

    const res = await signup(email, password, username.trim(), dob, bio);
    setAuthProgress(100);

    if (res.success) {
      await new Promise((r) => setTimeout(r, 300));
      setIsAuthenticating(false);
      navigate('/feed');
    } else {
      setIsAuthenticating(false);
      setError(res.error || 'Signup failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup') {
      if (isPermaBanned) {
        return;
      }
      if (!usernameValidation.isValid) {
        setError(usernameValidation.warning || 'Please enter a valid username.');
        return;
      }
      handleSignupProgress();
    } else {
      const res = await login(email, password);
      if (res.success) {
        navigate('/feed');
      } else {
        setError(res.error || 'Login failed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between transition-colors">
      <header className="p-4 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">P</div>
            <span className="font-bold text-lg text-slate-900">Playxcade</span>
          </Link>
        </div>
      </header>

      {/* PERMANENT BAN FULL-SCREEN OVERLAY FOR SIGNUP */}
      {isPermaBanned && mode === 'signup' && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-rose-200 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-50">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold mb-3">
                Account Creation Blocked
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900">Signup Not Permitted</h2>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                You cannot sign up or create a new account because a previous account associated with this device violated community guidelines and was permanently disabled.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-1.5 text-slate-600">
              <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Security Enforcement Policy</span>
              </div>
              <p>Hardware and session fingerprinting enforced active <code className="bg-slate-200 px-1 py-0.5 rounded text-rose-700 font-mono">perma_ban</code> restrictions on this browser instance.</p>
            </div>

            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-sm transition"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      )}

      {/* SIGNUP AUTHENTICATION PROGRESS BAR OVERLAY */}
      {isAuthenticating && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center space-y-6 shadow-2xl border border-slate-100 animate-in fade-in duration-200">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto ring-4 ring-indigo-50 border border-indigo-100">
              <KeyRound className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900">Authenticating Account</h3>
              <p className="text-xs font-medium text-slate-500">{authStatusStep}</p>
            </div>

            {/* Progress Bar Component */}
            <div className="space-y-2">
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${authProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 px-1">
                <span>Security Verification</span>
                <span className="text-indigo-600">{authProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex items-center justify-center p-4 my-8">
        <div className="w-full max-w-md overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
          {/* Tab Switch */}
          <div className="flex border-b border-slate-200 p-1 bg-slate-50">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-3 text-xs font-bold transition rounded-xl ${
                mode === 'login'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {getTranslation(language, 'login')}
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-3 text-xs font-bold transition rounded-xl ${
                mode === 'signup'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {getTranslation(language, 'signup')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="text-center pb-2">
              <h2 className="text-xl font-extrabold text-slate-900">
                {mode === 'login' ? 'Welcome Back to Playxcade' : 'Create Your Garexcell Account'}
              </h2>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gamer@garexcell.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900"
                required
              />
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5" />
                      <span>Username</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">5-15 characters</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="gaming_hero"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 text-slate-900 font-medium transition ${
                      username && usernameValidation.warning
                        ? 'border-amber-400 focus:ring-amber-400'
                        : username && usernameValidation.isValid
                        ? 'border-emerald-400 focus:ring-emerald-400'
                        : 'border-slate-200 focus:ring-indigo-500'
                    }`}
                    required
                  />

                  {/* Real-time validation warning / success */}
                  {username.trim() !== '' && usernameValidation.warning && (
                    <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] font-medium flex items-start space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{usernameValidation.warning}</span>
                    </div>
                  )}

                  {username.trim() !== '' && usernameValidation.message && (
                    <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] font-medium flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{usernameValidation.message}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bio
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short bio..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition pt-3"
            >
              {mode === 'login' ? 'Log In to Garexcell' : 'Create Garexcell Account'}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};
