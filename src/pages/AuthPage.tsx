import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Shield,
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Sun,
  Moon,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
  Globe,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../lib/i18n';
import { Footer } from '../components/Footer';
import { useUsernameValidation } from '../hooks/useUsernameValidation';

interface AuthPageProps {
  defaultEngine?: 'supabase' | 'firebase';
}

export const AuthPage: React.FC<AuthPageProps> = ({ defaultEngine = 'supabase' }) => {
  const {
    user,
    login,
    signup,
    loginWithSupabase,
    signupWithSupabase,
    logout,
    language,
    theme,
    setTheme
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active authentication engine (Supabase as main default, Firebase for /sso/third)
  const isSecondaryRoute = location.pathname.includes('/third');
  const [authEngine, setAuthEngine] = useState<'supabase' | 'firebase'>(
    isSecondaryRoute || defaultEngine === 'firebase' ? 'firebase' : 'supabase'
  );

  const [mode, setMode] = useState<'login' | 'signup' | 'sso'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('2002-01-01');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);

  const usernameValidation = useUsernameValidation(username, email);

  // Perma ban check
  const [isPermaBanned, setIsPermaBanned] = useState<boolean>(false);

  // Authentication Progress Overlay State
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authProgress, setAuthProgress] = useState<number>(0);
  const [authStatusStep, setAuthStatusStep] = useState<string>('Initializing authentication handshake...');

  useEffect(() => {
    const banFlag = localStorage.getItem('perma_ban');
    if (banFlag === 'true') {
      setIsPermaBanned(true);
    }
  }, []);

  // Sync route engine selection if path changes
  useEffect(() => {
    if (location.pathname.includes('/third')) {
      setAuthEngine('firebase');
    }
  }, [location.pathname]);

  // If user is already logged in
  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
        <header className="p-4 border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">P</div>
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
          <div className="w-full max-w-md p-8 text-center space-y-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="relative inline-block mx-auto">
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.username || 'User'}
                className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500 shadow-lg"
              />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Signed in as</p>
              <h2 className="text-2xl font-extrabold text-slate-900">@{user.username || 'Garexcell User'}</h2>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigate('/feed')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 shadow-md transition"
              >
                <span>Continue to Social Feed</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => logout()}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Sign Out / Switch Account
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
    setAuthProgress(20);
    setAuthStatusStep('Connecting to secure authentication service...');

    await new Promise((r) => setTimeout(r, 250));
    setAuthProgress(60);
    setAuthStatusStep('Creating user credentials & security token...');

    await new Promise((r) => setTimeout(r, 250));
    setAuthProgress(90);
    setAuthStatusStep('Finalizing profile data...');

    const res = authEngine === 'supabase'
      ? await signupWithSupabase(email, password, username.trim(), dob, bio)
      : await signup(email, password, username.trim(), dob, bio);

    setAuthProgress(100);

    if (res.success) {
      await new Promise((r) => setTimeout(r, 150));
      setIsAuthenticating(false);
      navigate('/feed');
    } else {
      setIsAuthenticating(false);
      setError(res.error || 'Account registration failed.');
    }
  };

  const handleLoginProgress = async () => {
    setIsAuthenticating(true);
    setAuthProgress(30);
    setAuthStatusStep('Verifying credentials...');

    await new Promise((r) => setTimeout(r, 250));
    setAuthProgress(80);
    setAuthStatusStep('Loading user profile and network session...');

    const res = authEngine === 'supabase'
      ? await loginWithSupabase(email, password)
      : await login(email, password);

    setAuthProgress(100);

    if (res.success) {
      await new Promise((r) => setTimeout(r, 150));
      setIsAuthenticating(false);
      navigate('/feed');
    } else {
      setIsAuthenticating(false);
      setError(res.error || 'Authentication failed. Please verify email & password.');
    }
  };

  const handleSSOAccess = async () => {
    setIsAuthenticating(true);
    setAuthProgress(40);
    setAuthStatusStep('Initiating Single Sign-On session...');

    await new Promise((r) => setTimeout(r, 300));
    setAuthProgress(90);
    setAuthStatusStep('Authorizing credentials...');

    const ssoEmail = email || `user_${Math.random().toString(36).substring(2, 7)}@garexcell.com`;
    const ssoPass = password || 'GarexcellSSOPass2026!';
    const ssoUsername = username || `sso_${Math.random().toString(36).substring(2, 7)}`;

    const res = await loginWithSupabase(ssoEmail, ssoPass);
    if (!res.success) {
      // Auto register for SSO
      await signupWithSupabase(ssoEmail, ssoPass, ssoUsername);
    }

    setAuthProgress(100);
    await new Promise((r) => setTimeout(r, 150));
    setIsAuthenticating(false);
    navigate('/feed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'sso') {
      handleSSOAccess();
      return;
    }

    if (mode === 'signup') {
      if (isPermaBanned) return;
      if (!usernameValidation.isValid) {
        setError(usernameValidation.warning || 'Please choose a valid username.');
        return;
      }
      handleSignupProgress();
    } else {
      handleLoginProgress();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between transition-colors font-sans">
      {/* Loading Overlay */}
      {isAuthenticating && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-8 text-center space-y-6 shadow-2xl border border-slate-200">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 shadow-sm">
              <KeyRound className="w-8 h-8 animate-pulse text-indigo-600" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">Authenticating</h3>
              <p className="text-xs font-medium text-slate-500">{authStatusStep}</p>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${authProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
                <span>Secure Auth Gateway</span>
                <span className="text-indigo-600">{authProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="p-4 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">P</div>
            <span className="font-bold text-lg text-slate-900">Playxcade</span>
          </Link>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Secure Authentication</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 my-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Mode Switch Tabs (Log In / Sign Up / SSO) */}
          <div className="flex border-b border-slate-200 p-1 bg-slate-100">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold transition rounded-xl ${
                mode === 'login'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold transition rounded-xl ${
                mode === 'signup'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => {
                setMode('sso');
                setError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold transition rounded-xl flex items-center justify-center space-x-1 ${
                mode === 'sso'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>SSO</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="text-center pb-1">
              <h2 className="text-xl font-extrabold text-slate-900">
                {mode === 'login'
                  ? 'Welcome Back'
                  : mode === 'signup'
                  ? 'Create Your Account'
                  : 'Single Sign-On Access'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {mode === 'login'
                  ? 'Sign in using your account credentials'
                  : mode === 'signup'
                  ? 'Register a new user account'
                  : 'Instant one-click authentication gateway'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {mode === 'sso' ? (
              <div className="space-y-4 pt-2">
                <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2 text-center">
                  <Globe className="w-8 h-8 text-indigo-600 mx-auto" />
                  <h4 className="font-extrabold text-sm text-slate-900">SSO Quick Access</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Authenticate instantly across the network with standard Single Sign-On credentials.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>Account Email (Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@garexcell.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Continue with SSO Access</span>
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
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
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Password</span>
                    </span>
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
                          <User className="w-3.5 h-3.5 text-slate-500" />
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
                        Profile Bio
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value.slice(0, 250))}
                        rows={2}
                        placeholder="Tell the community about your gaming style..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 resize-none"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition"
                >
                  {mode === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              </>
            )}
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};
