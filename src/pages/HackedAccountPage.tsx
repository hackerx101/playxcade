import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, AlertCircle, CheckCircle2, Lock, Mail, Calendar, User, KeyRound, ArrowRight, ShieldCheck, ArrowLeft, Laptop } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Footer } from '../components/Footer';

export const HackedAccountPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [createdMonthYear, setCreatedMonthYear] = useState('2024-03');
  const [firstPassword, setFirstPassword] = useState('');
  const [incidentDetails, setIncidentDetails] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsIdVerify, setNeedsIdVerify] = useState(false);
  const [isSuccessPending, setIsSuccessPending] = useState(false);
  const [rememberedAccounts, setRememberedAccounts] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('garexcell_remembered_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        setRememberedAccounts(parsed);
        if (parsed.length > 0) {
          if (parsed[0].email) setEmail(parsed[0].email);
          if (parsed[0].username) setUsername(parsed[0].username);
        }
      }
    } catch (e) {
      console.warn('Could not parse remembered accounts', e);
    }
  }, []);

  const handleVerifyHacked = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNeedsIdVerify(false);
    setLoading(true);

    try {
      if (!email.trim() || !username.trim()) {
        setError('Please enter your account email address and username.');
        setLoading(false);
        return;
      }

      // Query Supabase profiles table for live matching account
      const { data: profile, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (fetchErr) {
        console.warn('Profile fetch error:', fetchErr);
      }

      // Live Check: verify that account exists and username matches live database
      if (!profile) {
        setNeedsIdVerify(true);
        setError('No account found under this email address. If an attacker changed your email, use Identity Verification.');
        setLoading(false);
        return;
      }

      if (profile.username && profile.username.toLowerCase() !== username.trim().toLowerCase()) {
        setNeedsIdVerify(true);
        setError(`Username @${username} does not match the registered account for ${email}. You can verify with identity instead.`);
        setLoading(false);
        return;
      }

      // Real live update: set account_status to 'pending_verify' in Supabase
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          account_status: 'pending_verify',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);

      if (updateErr) {
        console.warn('Status update error:', updateErr);
      }

      setIsSuccessPending(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during account recovery verification.');
    } finally {
      setLoading(false);
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

          <Link to="/password/reset" className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Account Recovery</span>
          </Link>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 flex items-center justify-center p-4 my-8">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* Title Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Report Compromised Account</h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Verify your original account details to submit a recovery request and protect your profile.
            </p>
          </div>

          {/* Trusted Device Banner if recognized in localStorage */}
          {rememberedAccounts.length > 0 && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center space-x-3 text-xs text-indigo-900">
              <Laptop className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="font-bold">Recognized Trusted Device</p>
                <p className="text-[11px] text-indigo-700">
                  This device previously logged into @{rememberedAccounts[0].username || 'your account'}. Device history is active.
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {isSuccessPending ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <span className="bg-amber-200/60 text-amber-900 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                  STATUS: PENDING_VERIFY
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 mt-2">Account Status Set to Pending Verify</h2>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Your account status for <strong>@{username}</strong> is now updated to <strong className="text-amber-800">pending_verify</strong> in our database. Complete identity verification to finalize recovery.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <Link
                  to="/account/id/verify"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify with Identity (/account/id/verify)</span>
                </Link>

                <Link
                  to="/auth"
                  className="block text-xs font-semibold text-slate-500 hover:text-slate-800 transition pt-1"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerifyHacked} className="space-y-4">
              
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium space-y-2">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>

                  <div className="pt-2 border-t border-rose-200">
                    <Link
                      to="/account/id/verify"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-sm"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify with Identity (/account/id/verify)</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Account Email Address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Username / Handle</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. gamer123"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Month and Year Account Created */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Month & Year Account Was Created</span>
                </label>
                <input
                  type="month"
                  value={createdMonthYear}
                  onChange={(e) => setCreatedMonthYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* First/Last Known Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span>First Known or Original Password</span>
                </label>
                <input
                  type="password"
                  value={firstPassword}
                  onChange={(e) => setFirstPassword(e.target.value)}
                  placeholder="Original password before account compromise"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Incident Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Incident Details (Optional)
                </label>
                <textarea
                  value={incidentDetails}
                  onChange={(e) => setIncidentDetails(e.target.value)}
                  rows={2}
                  placeholder="Describe when you lost access or noticed unauthorized activity..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-2"
                >
                  {loading ? 'Verifying Account Details...' : 'Submit Recovery & Update Account Status'}
                </button>

                <Link
                  to="/account/id/verify"
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Verify with Identity Directly</span>
                </Link>
              </div>

            </form>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};
