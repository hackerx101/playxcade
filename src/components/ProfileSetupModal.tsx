import React, { useState } from 'react';
import { User, Sparkles, CheckCircle, Shield, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { sanitizeDatabaseError } from '../lib/validation';
import { useUsernameValidation } from '../hooks/useUsernameValidation';

export const ProfileSetupModal: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [dob, setDob] = useState('2002-01-01');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validation = useUsernameValidation(username, user?.email);

  if (!user || !user.needsProfileSetup) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validation.isValid) {
      setError(validation.warning || 'Please provide a valid username.');
      return;
    }

    const cleanUsername = username.trim();
    setLoading(true);

    try {
      // Check if username is taken in profiles
      const { data: existing } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existing && existing.user_id !== user.user_id) {
        setError('Username is already taken. Please choose another handle.');
        setLoading(false);
        return;
      }

      const res = await completeOnboarding({
        username: cleanUsername,
        dob,
        bio: bio.trim()
      });

      if (res && !res.success) {
        setError(res.error || 'Failed to complete profile setup.');
      }
    } catch (err: any) {
      setError(sanitizeDatabaseError(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto ring-4 ring-indigo-50 border border-indigo-100">
            <User className="w-7 h-7" />
          </div>
          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Profile Completion Required</span>
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900">Set Up Your Garexcell Profile</h2>
          <p className="text-xs text-slate-500">
            Your account exists, but requires a handle to operate safely across the network.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Choose Username</span>
              <span className="text-slate-400 font-normal">5-15 characters</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-semibold">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="gaming_hero"
                className={`w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 text-slate-900 font-medium transition ${
                  username && validation.warning
                    ? 'border-amber-400 focus:ring-amber-400'
                    : username && validation.isValid
                    ? 'border-emerald-400 focus:ring-emerald-400'
                    : 'border-slate-200 focus:ring-indigo-500'
                }`}
                required
              />
            </div>

            {/* Real-time username feedback */}
            {username.trim() !== '' && validation.warning && (
              <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] font-medium flex items-start space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{validation.warning}</span>
              </div>
            )}

            {username.trim() !== '' && validation.message && (
              <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] font-medium flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{validation.message}</span>
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
              Bio (Optional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about yourself..."
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Saving Profile...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Complete Profile & Continue</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
