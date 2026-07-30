import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertOctagon, ShieldAlert, ChevronDown, ChevronUp, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Footer } from '../components/Footer';

export const SuspendedPage: React.FC = () => {
  const { user, logout, restoreAccountStatus } = useAuth();
  const navigate = useNavigate();
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-white">
        <Link to="/auth" className="px-6 py-2.5 bg-indigo-600 font-bold rounded-xl text-xs">
          Go to Login
        </Link>
      </div>
    );
  }

  // If approved: tell them account restored + Done button
  if (user.appeal_status === 'approved') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Account Restored!</h1>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Your appeal has been reviewed and approved by Garexcell Trust & Safety. Your account access has been fully restored.
              </p>
            </div>

            <button
              onClick={() => {
                restoreAccountStatus();
                navigate('/feed');
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
            >
              Done - Back to Feed
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If rejected: account disabled + logout + learn more link to /tos
  if (user.appeal_status === 'rejected' || user.account_status === 'disabled') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Account Has Been Disabled</h1>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Following appeal review, your account has been permanently disabled for repeated policy violations.
              </p>
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>

            <div>
              <Link to="/tos" className="text-xs text-indigo-600 font-semibold hover:underline">
                Learn More (Terms of Service)
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If pending appeal
  if (user.appeal_status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Appeal Under Review</h1>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Your appeal is currently being reviewed by Garexcell moderators and may take us over a day.
              </p>
            </div>

            {/* Dropdown for Guidelines */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-left bg-white">
              <button
                onClick={() => setGuidelinesOpen(!guidelinesOpen)}
                className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100"
              >
                <span>Review Community Guidelines</span>
                {guidelinesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {guidelinesOpen && (
                <div className="p-4 text-[11px] text-slate-600 space-y-2 border-t border-slate-200">
                  <p>• Avoid spam, toxic remarks, or harassing other gamers.</p>
                  <p>• Do not impersonate official Garexcell network accounts.</p>
                  <p>• Identity verification appeals require government ID scan & selfie check.</p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition"
            >
              Log Out
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Default Suspended View -> Go to Appeal
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6 text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <AlertOctagon className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Account Suspended</h1>
            <p className="text-xs text-rose-600 mt-1 font-semibold">
              Reason: {user.suspension_reason || 'Policy Guideline Violation'}
            </p>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Your Playxcade account features have been temporarily restricted. Submit an appeal to request account review.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              to="/appeal"
              className="block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition"
            >
              Submit Appeal Request
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition"
            >
              Log Out
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
