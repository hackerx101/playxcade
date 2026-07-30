import React, { useState } from 'react';
import { Shield, Sparkles, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { user, completeOnboarding } = useAuth();
  const [page, setPage] = useState<1 | 2>(1);

  const [username, setUsername] = useState(user?.username || '');
  const [dob, setDob] = useState(user?.dob || '2008-01-01');
  const [bio, setBio] = useState(user?.bio || '');
  const [preferences, setPreferences] = useState('FPS, RPG, Esports');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validatePage1 = () => {
    setError(null);
    const trimmed = username.trim();

    // Check if less than 4 is entered (prompt says: if less than 4 is enter thts when you should say)
    if (trimmed.length < 5) {
      setError('Username must be at least 5 characters long.');
      return false;
    }

    if (trimmed.length > 11) {
      setError('Username cannot exceed 11 characters.');
      return false;
    }

    const firstChar = trimmed.charAt(0);
    if (/^[0-9_.]/.test(firstChar)) {
      setError('Username cannot start with a number, underscore (_), or dot (.).');
      return false;
    }

    // Check age at least 11
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 11) {
        setError('You must be at least 11 years old to create a Playxcade account.');
        return false;
      }
    } else {
      setError('Please provide a valid date of birth.');
      return false;
    }

    return true;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePage1()) {
      setPage(2);
    }
  };

  const handleFinalSubmit = () => {
    if (!agreed) {
      setError('You must agree to the Garexcell terms and community policies.');
      return;
    }
    completeOnboarding({ username, dob, bio, preferences });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-indigo-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-slate-900 text-lg">
              {page === 1 ? 'Step 1: Setup Profile Details' : 'Step 2: Community Terms & Finalize'}
            </h3>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-full">
            Page {page} of 2
          </span>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {page === 1 ? (
          <form onSubmit={handleNext} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Unique username (e.g., Gamer123_)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 text-slate-900"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Must be between 5-11 characters, no starting number/dot/underscore.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the Playxcade gaming community about yourself..."
                rows={2}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gaming Preferences
              </label>
              <input
                type="text"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="e.g. FPS, Cyberpunk, Esports"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-md transition"
              >
                <span>Continue to Policy</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-600">
              <p className="font-bold text-slate-900 text-sm">Garexcell Community Policy Agreement</p>
              <p>By creating a profile on Playxcade, you agree to respect community members, refrain from toxic behavior, impersonation, or harassment, and abide by the Garexcell Terms of Service.</p>
              <p>Your profile data will be synchronized securely across all Garexcell products.</p>
            </div>

            <label className="flex items-start space-x-3 cursor-pointer p-2">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700 font-medium">
                I agree to the Playxcade Community Guidelines and Garexcell Privacy Policy.
              </span>
            </label>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPage(1)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800:text-slate-200"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-md transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Complete Account Setup</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
