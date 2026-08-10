import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, Shield, Radio, Sparkles, Users, ArrowRight, X, Play, Zap, Trophy, Database, Download } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { GeoBlockOverlay } from '../components/GeoBlockOverlay';
import { GAMES_LIST } from '../data/games';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../lib/i18n';

export const LandingPage: React.FC = () => {
  const {
    user,
    recentAccounts,
    doNotShowRecent,
    setDoNotShowRecent,
    removeRecentAccount,
    language,
    login,
  } = useAuth();
  const navigate = useNavigate();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/feed');
    }
  }, [user, navigate]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('To install Playxcade, open your browser menu and select "Add to Home Screen" or "Install App".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const [promptRemoveEmail, setPromptRemoveEmail] = useState<string | null>(null);

  const handleRecentClick = (acc: typeof recentAccounts[0]) => {
    login(acc.email, acc.username);
    navigate('/feed');
  };

  const confirmRemoveRecent = () => {
    if (promptRemoveEmail) {
      removeRecentAccount(promptRemoveEmail);
      setPromptRemoveEmail(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col transition-colors">
      <GeoBlockOverlay />
      <Navbar showLiveIcon={false} hideLinks={true} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-8 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 border-b border-slate-200">
          <div className="max-w-6xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs shadow-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Garexcell Social & Gaming Network</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
              {getTranslation(language, 'heroTitle')}
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-medium">
              {getTranslation(language, 'heroSubtitle')}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/feed"
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center space-x-2 text-base"
              >
                <span>Enter Social Feed</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={handleInstallClick}
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center space-x-2 text-base border border-slate-800 cursor-pointer"
              >
                <Download className="w-5 h-5 text-indigo-400" />
                <span>Install Playxcade (PWA)</span>
              </button>
            </div>
          </div>
        </section>

        {/* Game Discovery Feed Section (NO images, button to access each game) */}
        <section className="max-w-7xl mx-auto py-12 px-4 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
                <Gamepad2 className="w-4 h-4" />
                <span>Featured Game Catalog</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {getTranslation(language, 'gameDiscovery')}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-2 md:mt-0 font-medium">
              Access titles instantly through Garexcell Cloud Launcher
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GAMES_LIST.map((game) => (
              <div
                key={game.id}
                className="py-4 flex flex-col justify-between border-b border-slate-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-indigo-600 font-bold text-xs">
                      {game.genre}
                    </span>
                    <div className="flex items-center space-x-1 text-amber-500 text-xs font-bold">
                      <span>★ {game.rating}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">{game.title}</h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {game.description}
                  </p>

                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{game.players}</span>
                  </div>
                </div>

                <div className="pt-5 mt-4">
                  <button
                    onClick={() => {
                      navigate('/feed');
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{getTranslation(language, 'launchGame')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="max-w-7xl mx-auto my-12 px-4 sm:px-8">
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <h2 className="text-3xl font-extrabold tracking-tight">Ready to join the Garexcell Gaming Network?</h2>
              <p className="text-sm text-indigo-100 font-medium">
                Create posts, stream live gameplay, verify your identity, and interact with gamers around the world.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link
                to="/auth"
                className="px-6 py-3 bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-xl text-sm shadow-md transition text-center"
              >
                Create Free Account
              </Link>
              <Link
                to="/foryou"
                className="px-6 py-3 bg-indigo-800/80 hover:bg-indigo-800 text-white font-semibold rounded-xl text-sm border border-indigo-400/30 transition text-center"
              >
                Watch Clips
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
