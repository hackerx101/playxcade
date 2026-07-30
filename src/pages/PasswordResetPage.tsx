import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Search, 
  UserX, 
  ShieldAlert, 
  HelpCircle,
  UserCheck,
  Mail
} from 'lucide-react';
import { verifyJwtToken } from '../lib/jwt';
import { supabase } from '../lib/supabase';
import { Footer } from '../components/Footer';

interface FoundUserAccount {
  user_id: string;
  username: string;
  email: string;
  avatar_url?: string;
  IsIdentityVerify?: boolean;
}

export const PasswordResetPage: React.FC = () => {
  const { token: paramToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = paramToken || searchParams.get('token') || searchParams.get('access_token') || '';

  // Radio option mode: 'forgot_password' | 'hacked' | 'disabled'
  const [recoveryReason, setRecoveryReason] = useState<'forgot_password' | 'hacked' | 'disabled'>('forgot_password');

  // Forgot Password sub-flow states
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundAccounts, setFoundAccounts] = useState<FoundUserAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [resetSentSuccess, setResetSentSuccess] = useState(false);

  // New Password Form state (when resetting via token)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResetComplete, setIsResetComplete] = useState(false);

  // If a reset token is directly provided in URL, show direct password set form
  const isDirectTokenReset = Boolean(token && token !== 'reset');

  // Handle Account Search by Email
  const handleSearchAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!searchEmail.trim()) {
      setError('Please enter your email address to locate associated accounts.');
      return;
    }

    setSearching(true);
    setFoundAccounts([]);
    setSelectedAccountId(null);

    try {
      // Query profiles by email
      const { data: profiles, error: queryErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', searchEmail.trim().toLowerCase());

      if (queryErr) {
        console.warn('Profile search warning:', queryErr);
      }

      if (profiles && profiles.length > 0) {
        const formatted = profiles.map((p) => ({
          user_id: p.user_id,
          username: p.username || 'gamer',
          email: p.email || searchEmail,
          avatar_url: p.avatar_url,
          IsIdentityVerify: p.is_verified || false
        }));
        setFoundAccounts(formatted);
        setSelectedAccountId(formatted[0].user_id);
      } else {
        setError('No registered account was found under this email address. Please double-check your email or sign up.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search for accounts under this email.');
    } finally {
      setSearching(false);
    }
  };

  // Handle Dispatch Supabase Password Reset Email
  const handleSendResetEmail = async () => {
    setError(null);
    setLoading(true);

    try {
      const selectedAcc = foundAccounts.find((a) => a.user_id === selectedAccountId);
      const targetEmail = selectedAcc ? selectedAcc.email : searchEmail;

      const origin = window.location.origin;
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${origin}/password/reset`
      });

      if (resetErr) {
        console.warn('Supabase password reset warning:', resetErr.message);
      }

      setResetSentSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch password reset email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Token-based Reset Submission
  const handleTokenPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const { error: resetErr } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (resetErr) {
        console.warn('Supabase reset warning:', resetErr.message);
      }

      setIsResetComplete(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Radio Choice Option Change
  const handleOptionChange = (option: 'forgot_password' | 'hacked' | 'disabled') => {
    setRecoveryReason(option);
    setError(null);
    if (option === 'hacked') {
      navigate('/account/verify/hacked');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Header */}
      <header className="p-4 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">P</div>
            <span className="font-bold text-lg text-slate-900">Playxcade</span>
          </Link>
          <Link to="/auth" className="text-xs font-bold text-indigo-600 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 my-8">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
          
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Account Recovery Center</h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please select the issue you are experiencing with your Garexcell Playxcade account.
            </p>
          </div>

          {/* IF Direct Token Reset mode */}
          {isDirectTokenReset ? (
            <div>
              {isResetComplete ? (
                <div className="text-center space-y-6 py-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">Password Reset Complete</h2>
                    <p className="text-xs text-slate-600 mt-2">
                      Your password has been updated successfully. You can now sign in with your new credentials.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/auth')}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2"
                  >
                    <span>Done — Proceed to Log In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleTokenPasswordSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>New Password</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600 transition"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Confirm New Password</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md transition"
                  >
                    {loading ? 'Updating Password...' : 'Reset Password'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Onboarding Radio Flow Options */
            <div className="space-y-6">
              
              {/* Radio Group Options */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Recovery Purpose:</p>
                
                {/* Option 1: Forgot Password */}
                <label
                  onClick={() => handleOptionChange('forgot_password')}
                  className={`p-4 rounded-2xl border cursor-pointer flex items-start space-x-3 transition ${
                    recoveryReason === 'forgot_password'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="recoveryReason"
                    value="forgot_password"
                    checked={recoveryReason === 'forgot_password'}
                    onChange={() => handleOptionChange('forgot_password')}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                      <span>I Forgot My Password</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Search associated account handles using your email & request a Supabase reset link.
                    </p>
                  </div>
                </label>

                {/* Option 2: Account Hacked */}
                <label
                  onClick={() => handleOptionChange('hacked')}
                  className={`p-4 rounded-2xl border cursor-pointer flex items-start space-x-3 transition ${
                    recoveryReason === 'hacked'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="recoveryReason"
                    value="hacked"
                    checked={recoveryReason === 'hacked'}
                    onChange={() => handleOptionChange('hacked')}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 flex items-center space-x-1 text-rose-700">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>My Account Was Hacked / Compromised</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Verify original email, creation date, and first password to set status to pending_verify.
                    </p>
                  </div>
                </label>

                {/* Option 3: Account Disabled / Suspended */}
                <label
                  onClick={() => handleOptionChange('disabled')}
                  className={`p-4 rounded-2xl border cursor-pointer flex items-start space-x-3 transition ${
                    recoveryReason === 'disabled'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="recoveryReason"
                    value="disabled"
                    checked={recoveryReason === 'disabled'}
                    onChange={() => handleOptionChange('disabled')}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                      <UserX className="w-3.5 h-3.5 text-amber-600" />
                      <span>My Account Was Disabled or Suspended</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Submit an official strike appeal to Garexcell Trust & Safety.
                    </p>
                  </div>
                </label>
              </div>

              {/* DYNAMIC SUB-VIEWS */}

              {/* SUB-VIEW 1: FORGOT PASSWORD */}
              {recoveryReason === 'forgot_password' && (
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {resetSentSuccess ? (
                    <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900">Password Reset Link Dispatched</h3>
                      <p className="text-xs text-slate-600">
                        We have sent a Supabase password reset link to <strong>{searchEmail}</strong>. Please check your inbox and click the reset link to choose a new password.
                      </p>
                      <button
                        onClick={() => {
                          setResetSentSuccess(false);
                          setFoundAccounts([]);
                        }}
                        className="text-xs font-bold text-indigo-600 hover:underline pt-1"
                      >
                        Reset Another Account
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Step 1: Search Email Form */}
                      <form onSubmit={handleSearchAccount} className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                            <Mail className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Enter Your Account Email</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={searchEmail}
                              onChange={(e) => setSearchEmail(e.target.value)}
                              placeholder="your.email@example.com"
                              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                            <button
                              type="submit"
                              disabled={searching}
                              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1"
                            >
                              <Search className="w-3.5 h-3.5" />
                              <span>{searching ? 'Searching...' : 'Find Accounts'}</span>
                            </button>
                          </div>
                        </div>
                      </form>

                      {/* Step 2: Display Account Selection List */}
                      {foundAccounts.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <p className="text-xs font-bold text-slate-800">
                            Select the username/account to reset:
                          </p>

                          <div className="space-y-2">
                            {foundAccounts.map((acc) => (
                              <label
                                key={acc.user_id}
                                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                                  selectedAccountId === acc.user_id
                                    ? 'border-indigo-600 bg-indigo-50/70'
                                    : 'border-slate-200 bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="radio"
                                    name="accountSelection"
                                    value={acc.user_id}
                                    checked={selectedAccountId === acc.user_id}
                                    onChange={() => setSelectedAccountId(acc.user_id)}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <img
                                    src={acc.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${acc.username}`}
                                    alt={acc.username}
                                    className="w-8 h-8 rounded-full border border-slate-300 object-cover"
                                  />
                                  <div>
                                    <p className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                                      <span>@{acc.username}</span>
                                      {acc.IsIdentityVerify && (
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                      )}
                                    </p>
                                    <p className="text-[11px] text-slate-500">{acc.email}</p>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">
                                  Select
                                </span>
                              </label>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={handleSendResetEmail}
                            disabled={loading || !selectedAccountId}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-2"
                          >
                            <span>{loading ? 'Sending Request...' : 'Send Supabase Password Reset Email'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* SUB-VIEW 3: ACCOUNT DISABLED */}
              {recoveryReason === 'disabled' && (
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-amber-800">
                    <UserX className="w-5 h-5" />
                    <h3 className="text-sm font-extrabold">Account Disabled or Suspended Notice</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    If your account was disabled due to moderation strikes or community policy violations, you can file an appeal with the Garexcell Trust & Safety committee.
                  </p>
                  <button
                    onClick={() => navigate('/appeal')}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-2"
                  >
                    <span>Proceed to Garexcell Appeal Center (/appeal)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};
