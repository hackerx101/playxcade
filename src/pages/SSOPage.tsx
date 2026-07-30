import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Sparkles, CheckCircle2, Globe, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Footer } from '../components/Footer';

export const SSOPage: React.FC = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);

  const handleConnect = () => {
    if (!user) {
      login('sso_user@garexcell.com', 'GarexcellSSO');
    }
    setConnected(true);
    setTimeout(() => {
      navigate('/feed');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <header className="p-4 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">P</div>
            <span className="font-bold text-lg text-slate-900">Playxcade SSO</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 my-8">
        <div className="w-full max-w-lg space-y-6 text-center">
          
          <div className="space-y-4">
            <h1 className="text-2xl font-extrabold text-slate-900">Unified Identity Gateway</h1>
          </div>

          {user ? (
            <div className="space-y-4 pt-6">
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.username}
                className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-indigo-500 shadow-md"
              />
              <div>
                <p className="text-lg font-bold text-slate-900">@{user.username}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>

              {connected ? (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Account Connected!</span>
            </div>
          ) : (
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleConnect}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2"
                  >
                    <span>Connect Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => logout()}
                    className="w-full py-2 bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                  >
                    Not you? Switch Account
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Connect your Garexcell master profile to log in without re-entering your password on any Garexcell network domain.
              </p>
              <button
                onClick={handleConnect}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition"
              >
                Connect Account
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
