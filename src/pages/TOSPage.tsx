import React from 'react';
import { ArrowLeft, Shield, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';

export const TOSPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <header className="p-4 border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-xs font-bold text-indigo-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <span className="font-extrabold text-sm text-slate-900">Playxcade Terms of Service</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-slate-700 text-xs leading-relaxed">
        <div className="space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
            <FileText className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Terms of Service</h1>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-extrabold text-sm text-slate-900">1. Acceptance of Terms</h2>
            <p>By accessing Playxcade, you agree to be bound by these Terms of Service.</p>
          </div>

          <div className="space-y-2">
            <h2 className="font-extrabold text-sm text-slate-900">2. Accounts</h2>
            <p>Account registration requires a valid identity. Users are responsible for maintaining the confidentiality of their credentials.</p>
          </div>

          <div className="space-y-2">
            <h2 className="font-extrabold text-sm text-slate-900">3. Content Guidelines</h2>
            <p>Playxcade is dedicated to fostering a safe gaming community. Prohibited activities include hate speech, harassment, and spam.</p>
          </div>

          <div className="space-y-2">
            <h2 className="font-extrabold text-sm text-slate-900">4. Account Suspension</h2>
            <p>Accounts flagged for community guideline violations may be placed in a suspended status.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
