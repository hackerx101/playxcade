import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles } from 'lucide-react';

export const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also check if dismissed before
    const dismissed = localStorage.getItem('playxcade_pwa_dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback instruction for browsers without direct prompt support
      alert('To install Playxcade, open your browser menu and select "Add to Home Screen" or "Install App".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('playxcade_pwa_dismissed', 'true');
    } catch (e) {}
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white px-4 py-3 border-b border-indigo-700/50 flex items-center justify-between shadow-md relative z-40">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-indigo-300" />
        </div>
        <div>
          <h4 className="text-xs font-bold tracking-tight">Install App</h4>
          <p className="text-[11px] text-indigo-200">Get lightning-fast access, instant notifications, and offline support.</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-white text-indigo-950 hover:bg-indigo-50 font-black text-[11px] uppercase tracking-wider rounded-lg shadow transition flex items-center space-x-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-indigo-300 hover:text-white transition rounded-lg"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
