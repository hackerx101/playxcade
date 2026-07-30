import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, User, Calendar, FileText, CheckCircle2, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUsernameValidation } from '../hooks/useUsernameValidation';
import { Footer } from '../components/Footer';

export const SetupProfilePage: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username || '');
  const [dob, setDob] = useState(user?.dob || '2005-01-01');
  const [bio, setBio] = useState(user?.bio || '');
  const [preferences, setPreferences] = useState('FPS, RPG, Esports');
  const [agreed, setAgreed] = useState(true);
  
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validation = useUsernameValidation(username, user?.email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = username.trim();
    if (trimmed.length < 5) {
      setError('Username must be at least 5 characters long.');
      return;
    }

    if (trimmed.length > 15) {
      setError('Username cannot exceed 15 characters.');
      return;
    }

    const firstChar = trimmed.charAt(0);
    if (/^[0-9_.]/.test(firstChar)) {
      setError('Username cannot start with a number, underscore (_), or dot (.).');
      return;
    }

    if (!dob) {
      setError('Please provide a valid date of birth.');
      return;
    }

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 11) {
      setError('You must be at least 11 years old to set up an account.');
      return;
    }

    if (!agreed) {
      setError('Please accept community policies to complete account setup.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await completeOnboarding({
        username: trimmed,
        dob,
        bio,
        preferences
      });

      setSubmitting(false);

      if (res && res.error) {
        setError(res.error);
      } else {
        navigate('/feed');
      }
    } catch (err: any) {
      setSubmitting(false);
      setError(err?.message || 'Failed to complete profile setup. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      {/* Header */}
      <header className="p-4 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">P</div>
            <span className="font-bold text-lg text-slate-900">Playxcade</span>
          </Link>
          <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Account Setup
          </span>
        </div>
      </header>

      {/* Main Full-Screen Setup Card */}
      <main className="flex-1 flex items-center justify-center p-4 my-8">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 shadow-sm">
              <Sparkles className="w-7 h-7 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Complete Account Setup
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Customize your gamer handle, profile details, and preferences to access Playxcade feeds & streams.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Gamer Handle (Username)</span>
                </span>
                <span className="text-[11px] text-slate-400">5-15 characters</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="gaming_legend"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                required
              />
              {username.trim() !== '' && validation.warning && (
                <p className="mt-1 text-[11px] font-medium text-amber-600">{validation.warning}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Date of Birth</span>
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="mt-1 text-[11px] text-slate-400">Must be at least 11 years old.</p>
            </div>

            {/* Profile Bio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Profile Bio</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 250))}
                rows={3}
                placeholder="Share your favorite games, platforms, or playstyle..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 resize-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Gaming Preferences */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gaming Tags / Categories
              </label>
              <input
                type="text"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="FPS, RPG, Strategy, Esports"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Terms checkbox */}
            <div className="pt-2">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs text-slate-600 leading-tight">
                  I agree to Playxcade Community Policy, Terms of Service, and Fair Play Guidelines.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2 mt-4"
            >
              <span>{submitting ? 'Setting up account...' : 'Complete Account Setup'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};
