import React from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white text-slate-900 py-12 px-4 sm:px-8 border-t border-slate-200">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-xl">
              P
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">Playxcade</span>
          </div>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            The next-generation gaming social network for esports, streaming, and community discovery.
          </p>
        </div>

        <div>
          <h4 className="text-slate-900 font-bold mb-3 text-xs tracking-wider uppercase">Ecosystem</h4>
          <ul className="space-y-2 text-sm text-slate-600 font-medium">
            <li><Link to="/settings" className="hover:text-slate-900 transition">Account center</Link></li>
            <li><Link to="/cloud" className="hover:text-slate-900 transition">Playxcade Cloud</Link></li>
            <li><Link to="/ai" className="hover:text-slate-900 transition flex items-center space-x-1"><Sparkles className="w-3.5 h-3.5 text-indigo-600" /><span>Orion AI</span></Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-slate-900 font-bold mb-3 text-xs tracking-wider uppercase">Navigation</h4>
          <ul className="space-y-2 text-sm text-slate-600 font-medium">
            <li><Link to="/feed" className="hover:text-slate-900 transition">Social Feed</Link></li>
            <li><Link to="/tos" className="hover:text-slate-900 transition">Terms of Service</Link></li>
            <li><Link to="/privacy" className="hover:text-slate-900 transition">Privacy Policy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-slate-900 font-bold mb-3 text-xs tracking-wider uppercase">Garexcell Network</h4>
          <p className="text-xs text-slate-600 leading-relaxed mb-3 font-medium">
            Playxcade operates as part of the unified Garexcell gaming and streaming ecosystem.
          </p>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Garexcell Protected</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-slate-100 flex flex-col items-center justify-center text-xs text-slate-500 gap-2">
        <div className="font-black text-slate-900 flex items-center justify-center space-x-1 uppercase tracking-widest text-sm mb-1">
          <span>Powered by Garexcell</span>
        </div>
        <div className="font-medium">
          &copy; {new Date().getFullYear()} Playxcade. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

