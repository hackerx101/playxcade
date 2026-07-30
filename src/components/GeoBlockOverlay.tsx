import React, { useState, useEffect } from 'react';
import { Globe, ShieldAlert, ExternalLink, X } from 'lucide-react';
import { getFeatureFlags } from '../config/featureFlags';

export const GeoBlockOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [detectedCountryCode, setDetectedCountryCode] = useState<string>('US');
  const [detectedCountryName, setDetectedCountryName] = useState<string>('United States');

  useEffect(() => {
    const flags = getFeatureFlags();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = navigator.language || '';
    
    let activeCode = flags.region_code || 'US';
    if (!flags.region_code) {
      if (tz.includes('Pyongyang') || lang.toLowerCase().includes('kp')) activeCode = 'KP';
      else if (tz.includes('Moscow') || lang.toLowerCase().includes('ru')) activeCode = 'RU';
      else if (tz.includes('El_Salvador') || lang.toLowerCase().includes('sv')) activeCode = 'SV';
    }

    setDetectedCountryCode(activeCode);
    setDetectedCountryName(getCountryName(activeCode));

    if (flags.restricted_regions.includes(activeCode)) {
      setIsOpen(true);
    }
  }, []);

  const getCountryName = (code: string) => {
    switch (code.toUpperCase()) {
      case 'KP':
        return 'North Korea (DPRK)';
      case 'RU':
        return 'Russian Federation';
      case 'SV':
        return 'El Salvador';
      case 'CN':
        return 'China';
      case 'IR':
        return 'Iran';
      default:
        return 'United States';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-900 w-full h-full min-h-screen p-6 sm:p-12 flex flex-col justify-between border-8 border-slate-900 overflow-y-auto selection:bg-slate-900 selection:text-white font-sans">
      
      {/* Full Screen Header */}
      <div className="flex items-center justify-between border-b-4 border-slate-900 pb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center font-black text-xl">
            P
          </div>
          <div>
            <span className="font-black text-xl tracking-tight block leading-none">GAREXCELL SOCIAL</span>
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
              REGIONAL SERVICE COMPLIANCE OVERLAY
            </span>
          </div>
        </div>
      </div>

      {/* Main Center Message Area */}
      <div className="max-w-3xl w-full mx-auto my-auto py-12 space-y-8 text-left">
        
        {/* Exact Country Badge */}
        <div className="inline-flex items-center space-x-2 bg-slate-100 border-2 border-slate-900 px-4 py-2 font-mono text-xs font-black uppercase text-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
          <Globe className="w-4 h-4 text-slate-900 stroke-[2.5]" />
          <span>EXACT COUNTRY DETECTED: {detectedCountryName} [{detectedCountryCode}]</span>
        </div>

        {/* Warning Icon & Big Headline */}
        <div className="space-y-4">
          <div className="w-16 h-16 bg-rose-50 border-4 border-slate-900 text-slate-900 flex items-center justify-center">
            <ShieldAlert className="w-9 h-9 text-slate-900 stroke-[2.5]" />
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-none uppercase">
            Garexcell is Restricted in {detectedCountryName}
          </h1>

          <p className="text-base sm:text-lg text-slate-700 font-semibold leading-relaxed max-w-2xl">
            Due to local service compliance regulations and sanctions, Garexcell full platform services and media feeds are restricted for users located in <strong className="text-slate-900 underline decoration-4 decoration-rose-500">{detectedCountryName}</strong>.
          </p>
        </div>

        {/* Informational Box */}
        <div className="p-6 bg-slate-50 border-4 border-slate-900 space-y-2 font-mono text-xs text-slate-900">
          <p className="font-bold uppercase tracking-wider text-slate-900">
            REGULATORY REFERENCE & ACCESS NOTE:
          </p>
          <p className="text-slate-600 leading-relaxed font-medium">
            Standard interactive features, direct messaging, and cloud gaming nodes are suspended in {detectedCountryName}. You can access our light compliance interface at Lite Web portal below.
          </p>
        </div>

        {/* Main Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
          
          <a
            href="https://play.garexcell.com/lite"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm border-2 border-slate-900 flex items-center justify-center space-x-2 transition shadow-[5px_5px_0px_0px_rgba(15,23,42,1)]"
          >
            <span>GO TO LITE </span>
            <ExternalLink className="w-4 h-4 text-white stroke-[2.5]" />
          </a>

        </div>

      </div>

      <div className="border-t-4 border-slate-900 pt-4 text-center font-mono text-[11px] text-slate-500">
        Garexcell Global Compliance Protocol &copy; 2026
      </div>

    </div>
  );
};
