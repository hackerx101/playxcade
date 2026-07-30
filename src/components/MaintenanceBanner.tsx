import React, { useState, useEffect } from 'react';
import { Wrench, AlertCircle, X } from 'lucide-react';
import { getFeatureFlags } from '../config/featureFlags';

export const MaintenanceBanner: React.FC = () => {
  const [flags, setFlags] = useState(getFeatureFlags());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkFlags = () => setFlags(getFeatureFlags());
    window.addEventListener('storage', checkFlags);
    return () => window.removeEventListener('storage', checkFlags);
  }, []);

  if (!flags.minor_maintenance || dismissed) return null;

  return (
    <div className="bg-slate-900 text-white border-b-2 border-slate-900 px-4 py-3 shadow-md animate-fadeIn">
      <div className="max-w-7xl mx-auto flex items-center justify-between font-sans">
        
        <div className="flex items-center space-x-3 text-xs sm:text-sm font-bold">
          <div className="w-7 h-7 bg-amber-400 text-slate-900 border border-slate-900 flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-black uppercase tracking-wider text-amber-400 mr-2">
              SYSTEM MAINTENANCE NOTICE:
            </span>
            <span className="text-slate-200">
              Minor system maintenance is currently in progress. All core feed and message services remain fully operational.
            </span>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 transition shrink-0 ml-2"
          title="Dismiss Banner"
        >
          <X className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
