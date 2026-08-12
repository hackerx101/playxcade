import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, LogOut, Lock, Calendar, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SuspendedPage: React.FC = () => {
  const { user, logout, restoreAccountStatus } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.account_status !== 'suspended') {
      navigate('/feed', { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white text-slate-900">
        <Link to="/auth" className="px-6 py-4 bg-slate-900 text-white font-bold text-sm uppercase tracking-wider w-full max-w-sm text-center">
          Go to Login
        </Link>
      </div>
    );
  }

  // If approved: tell them account restored
  if (user.appeal_status === 'approved') {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between p-6 sm:p-12">
        <div className="w-full max-w-xl mx-auto space-y-8 flex-1 flex flex-col justify-center">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Account Restored</h1>
            <p className="text-base text-slate-600 mt-4 leading-relaxed font-medium">
              Your appeal has been reviewed and approved by Garexcell Trust & Safety. Your account access has been fully restored.
            </p>
          </div>
        </div>
        <div className="w-full max-w-xl mx-auto pb-4">
          <button
            onClick={() => {
              restoreAccountStatus();
              navigate('/feed');
            }}
            className="w-full py-4 bg-slate-900 text-white font-bold text-sm uppercase tracking-wider transition hover:bg-slate-800"
          >
            Done - Back to Feed
          </button>
        </div>
      </div>
    );
  }

  // If rejected: account disabled
  if (user.appeal_status === 'rejected' || user.account_status === 'disabled') {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between p-6 sm:p-12">
        <div className="w-full max-w-xl mx-auto space-y-8 flex-1 flex flex-col justify-center">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Account Disabled</h1>
            <p className="text-base text-slate-600 mt-4 leading-relaxed font-medium">
              Following appeal review, your account has been permanently disabled for repeated policy violations.
              <br /><br />
              <Link to="/tos" className="text-slate-900 font-bold underline">
                Read our Terms of Service
              </Link>
            </p>
          </div>
        </div>
        <div className="w-full max-w-xl mx-auto pb-4">
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full py-4 bg-black text-white font-bold text-sm uppercase tracking-wider transition hover:bg-slate-900 flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    );
  }

  // If pending appeal
  if (user.appeal_status === 'pending') {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between p-6 sm:p-12">
        <div className="w-full max-w-xl mx-auto space-y-8 flex-1 flex flex-col justify-center">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Appeal Under Review</h1>
            <p className="text-base text-slate-600 mt-4 leading-relaxed font-medium">
              Your appeal is currently being reviewed by Garexcell moderators. This process typically takes up to 24 hours. We will notify you once a decision is made.
            </p>
          </div>
        </div>
        <div className="w-full max-w-xl mx-auto pb-4">
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full py-4 bg-slate-900 text-white font-bold text-sm uppercase tracking-wider transition hover:bg-slate-800"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // Default Suspended View -> Go to Appeal
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between p-6 sm:p-12">
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center space-y-12">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Your account was suspended</h1>
          <p className="text-base text-slate-600 mt-4 font-medium leading-relaxed">
            Your Playxcade account features have been temporarily restricted. Reason: <strong className="text-slate-900">{user.suspension_reason || 'Policy Guideline Violation'}</strong>
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <Lock className="w-6 h-6 text-slate-900 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Restricted Access</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">No one can view your profile or contact you.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <Calendar className="w-6 h-6 text-slate-900 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Appeal Timeline</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">You have 30 days to submit an appeal before permanent deletion.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <Shield className="w-6 h-6 text-slate-900 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Trust & Safety</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">Our moderation team reviews all appeals manually to ensure fairness.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-xl mx-auto space-y-3 pb-4">
        <Link
          to="/appeal"
          className="block w-full py-4 bg-slate-900 text-white text-center font-bold text-sm uppercase tracking-wider transition hover:bg-slate-800"
        >
          Submit Appeal Request
        </Link>
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="w-full py-4 bg-white border-2 border-slate-900 text-slate-900 font-bold text-sm uppercase tracking-wider transition hover:bg-slate-50"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

