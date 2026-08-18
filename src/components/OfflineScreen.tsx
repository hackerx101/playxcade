import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

export const OfflineScreen: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      // Test connectivity with a lightweight fetch request or navigator.onLine
      const onlineStatus = navigator.onLine;
      if (onlineStatus) {
        // Try fetching favicon or a small asset to verify actual network connectivity
        await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' }).catch(() => {});
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    } catch (e) {
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  if (isOnline) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[32px] p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 bg-rose-500/15 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto shadow-inner text-rose-400">
          <WifiOff className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-white">Internet Not Available</h2>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
            You are currently offline. Please check your network connection or Wi-Fi settings to continue enjoying Playxcade.
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-left flex items-start space-x-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-400">
            Real-time messaging, live feeds, and cloud synchronization are paused until connection is restored.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking Connection...' : 'Retry Connection'}</span>
          </button>
          <button
            onClick={() => setIsOnline(true)}
            className="w-full py-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-2xl transition"
          >
            Continue to App
          </button>
        </div>
      </div>
    </div>
  );
};
