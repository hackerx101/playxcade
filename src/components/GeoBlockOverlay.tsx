import React, { useState, useEffect } from 'react';
import { Globe, AlertTriangle, ExternalLink, X, ShieldAlert, Sparkles } from 'lucide-react';

export const GeoBlockOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [detectedRegion, setDetectedRegion] = useState<string>('Detecting...');
  const [isRestricted, setIsRestricted] = useState(false);

  useEffect(() => {
    // Check local storage override or detect timezone/locale
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = navigator.language || '';
    
    let country = 'US';
    let regionName = 'United States';

    if (tz.includes('Pyongyang') || lang.toLowerCase().includes('kp')) {
      country = 'KP';
      regionName = 'North Korea (DPRK)';
    } else if (tz.includes('Moscow') || tz.includes('Kamchatka') || tz.includes('Vladivostok') || lang.toLowerCase().includes('ru')) {
      country = 'RU';
      regionName = 'Russian Federation';
    } else if (tz.includes('El_Salvador') || lang.toLowerCase().includes('sv')) {
      country = 'SV';
      regionName = 'El Salvador';
    }

    setDetectedRegion(regionName);

    // If restricted country, open overlay by default
    if (['KP', 'RU', 'SV'].includes(country)) {
      setIsRestricted(true);
      setIsOpen(true);
    } else {
      // Check if user saved a test state in sessionStorage
      const testRegion = sessionStorage.getItem('simulated_geo_region');
      if (testRegion && ['KP', 'RU', 'SV'].includes(testRegion)) {
        setIsRestricted(true);
        setIsOpen(true);
        setDetectedRegion(
          testRegion === 'KP' ? 'North Korea' : testRegion === 'RU' ? 'Russian Federation' : 'El Salvador'
        );
      }
    }
  }, []);

  const handleSimulate = (code: string) => {
    if (code === 'CLEAR') {
      sessionStorage.removeItem('simulated_geo_region');
      setIsRestricted(false);
      setIsOpen(false);
      setDetectedRegion('United States / Unrestricted');
    } else {
      sessionStorage.setItem('simulated_geo_region', code);
      setIsRestricted(true);
      setIsOpen(true);
      setDetectedRegion(
        code === 'KP' ? 'North Korea (DPRK)' : code === 'RU' ? 'Russian Federation' : 'El Salvador'
      );
    }
  };

  if (!isOpen) {
    // Floating test pill so tester can easily test geo-blocking anytime
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-slate-900/90 text-white text-[11px] font-mono px-3 py-1.5 rounded-full border border-slate-700 shadow-xl flex items-center space-x-2">
        <Globe className="w-3.5 h-3.5 text-indigo-400" />
        <span>Region: {detectedRegion}</span>
        <button
          onClick={() => handleSimulate('KP')}
          className="hover:text-amber-400 underline font-bold"
        >
          Test Geo-Block
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 selection:bg-rose-500 selection:text-white">
      <div className="relative w-full max-w-lg bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center overflow-hidden">
        
        {/* Glow backdrop effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button top right */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 p-2 rounded-full transition border border-slate-700"
          title="Dismiss Overlay"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon Header */}
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <span className="bg-rose-500/20 text-rose-300 font-mono text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-rose-500/30">
            Regional Access Notice ({detectedRegion})
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Garexcell is not accessible in your region
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Due to local service compliance regulations and regulatory sanctions, Garexcell full platform services are restricted for users located in <strong className="text-rose-400">North Korea</strong>, <strong className="text-rose-400">Russian Federation</strong>, and <strong className="text-rose-400">El Salvador</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Go to Lite Button */}
          <a
            href="https://play.garexcell.com/lite"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition transform active:scale-95"
          >
            <span>Go to Lite (https://play.garexcell.com/lite)</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-2xl text-xs border border-slate-700 transition"
          >
            Close & Continue Preview
          </button>
        </div>

        {/* Region Tester Bar at Bottom */}
        <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-2">
          <p className="font-semibold text-slate-500">Simulate Geo Location for Testing:</p>
          <div className="flex flex-wrap justify-center gap-1.5 font-mono">
            <button
              onClick={() => handleSimulate('KP')}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-rose-500/50 rounded-lg text-rose-300"
            >
              North Korea
            </button>
            <button
              onClick={() => handleSimulate('RU')}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-rose-500/50 rounded-lg text-rose-300"
            >
              Russia
            </button>
            <button
              onClick={() => handleSimulate('SV')}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-rose-500/50 rounded-lg text-rose-300"
            >
              El Salvador
            </button>
            <button
              onClick={() => handleSimulate('CLEAR')}
              className="px-2.5 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg text-slate-300"
            >
              Clear Test
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
