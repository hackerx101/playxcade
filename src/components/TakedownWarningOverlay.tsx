import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Lock, Shield, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface WarningNotice {
  id: string;
  guideline: string;
  violatingContent: string;
  severity: 'minor' | 'threat' | 'severe_exploitation';
  timestamp: string;
  appealStatus?: 'none' | 'pending' | 'approved' | 'rejected';
}

export const TakedownWarningOverlay: React.FC = () => {
  const { user } = useAuth();
  const [activeWarning, setActiveWarning] = useState<WarningNotice | null>(null);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealSubmitted, setAppealSubmitted] = useState(false);

  useEffect(() => {
    // Check if user has an unacknowledged warning notice in localStorage
    const saved = localStorage.getItem(`takedown_warning_${user?.user_id || 'active'}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && !parsed.acknowledged) {
          setActiveWarning(parsed);
        }
      } catch (err) {
        console.error('Error parsing takedown warning:', err);
      }
    }
  }, [user]);

  if (!activeWarning) {
    return null;
  }

  const handleAcknowledge = () => {
    const updated = { ...activeWarning, acknowledged: true };
    localStorage.setItem(`takedown_warning_${user?.user_id || 'active'}`, JSON.stringify(updated));
    setActiveWarning(null);
  };

  const handleAppealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim()) return;

    const updated = {
      ...activeWarning,
      appealStatus: 'pending' as const
    };
    localStorage.setItem(`takedown_warning_${user?.user_id || 'active'}`, JSON.stringify(updated));
    setActiveWarning(updated);
    setAppealSubmitted(true);
    setTimeout(() => {
      setShowAppealModal(false);
      setAppealSubmitted(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white text-slate-900 flex flex-col justify-between p-6 sm:p-12 font-sans overflow-y-auto">
      
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center my-auto space-y-8">
        
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 bg-slate-900 text-amber-400 rounded-3xl flex items-center justify-center shadow-lg border border-slate-800">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Main Title & Subtitle */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight lowercase">
            your message or post went against our guidelines
          </h1>
          
          <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 space-y-2">
            <p className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Violated Guideline: <span className="text-rose-600">{activeWarning.guideline}</span>
            </p>
            <p className="text-xs font-mono bg-white p-3 rounded-xl border border-slate-200 text-slate-800 font-bold">
              "{activeWarning.violatingContent}"
            </p>
          </div>
        </div>

        {/* 3 Things Classifying as a Threat */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
            What Classifies as a Threat or Harassment on Playxcade
          </h3>

          <div className="space-y-3">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Direct Physical Threats & Violence</h4>
                <p className="text-xs text-slate-600 font-medium">Statements expressing intent or inciting physical harm against an individual or group.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Doxxing & Private Personal Data</h4>
                <p className="text-xs text-slate-600 font-medium">Publishing phone numbers, home addresses, government IDs, or private credentials without consent.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Severe Targeted Extortion & Harassment</h4>
                <p className="text-xs text-slate-600 font-medium">Persistent unwanted contact, malicious threats to ruin reputation, or coercive extortion.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Context Note regarding AI false positives */}
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-950 font-medium leading-relaxed">
          <strong>Context Analysis Notice:</strong> Garexcell AI algorithms analyze conversational context (e.g., distinguishing gaming terminology like "killing a deal" vs real-world threats). Severe violations are permanently enforced.
        </div>

      </div>

      {/* Action Footer */}
      <div className="w-full max-w-2xl mx-auto pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
        {activeWarning.severity !== 'severe_exploitation' && (
          <button
            onClick={() => setShowAppealModal(true)}
            className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs uppercase tracking-wider rounded-2xl transition"
          >
            Appeal Decision
          </button>
        )}

        <button
          onClick={handleAcknowledge}
          className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition"
        >
          I Understand & Acknowledge
        </button>
      </div>

      {/* Appeal Modal */}
      {showAppealModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Appeal Content Takedown</h3>
              <button onClick={() => setShowAppealModal(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {appealSubmitted ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-extrabold text-slate-900">Appeal Submitted</h4>
                <p className="text-xs text-slate-500 font-medium">Trust & Safety will review your explanation within 10 minutes.</p>
              </div>
            ) : (
              <form onSubmit={handleAppealSubmit} className="space-y-4">
                <p className="text-xs text-slate-600 font-medium">
                  Explain why you believe this post or message did not violate guidelines (e.g. gaming context, joke, or self-referential phrase):
                </p>
                <textarea
                  rows={4}
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Provide context for moderation review..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Submit Takedown Appeal
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
