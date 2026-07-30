import React from 'react';
import { Gamepad2, Shield, Radio, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-900 text-slate-300 py-12 px-4 sm:px-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              P
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Playxcade</span>
          </div>
          <p className="text-sm text-slate-400">
            The next-generation gaming social network for esports, streaming, and community discovery.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm tracking-wider uppercase">Ecosystem</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="https://accounts.garexcell.com" target="_blank" rel="noreferrer" className="hover:text-white transition">Garexcell Accounts</a></li>
            <li><a href="https://play.garexcell.com" target="_blank" rel="noreferrer" className="hover:text-white transition">Playxcade Cloud</a></li>
            <li><a href="https://pay.garexcell.com" target="_blank" rel="noreferrer" className="hover:text-white transition">Garexcell Pay</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm tracking-wider uppercase">Navigation</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link to="/feed" className="hover:text-white transition">Social Feed</Link></li>
            <li><Link to="/tos" className="hover:text-white transition">Terms of Service</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm tracking-wider uppercase">Garexcell Network</h4>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Playxcade operates as part of the unified Garexcell gaming and streaming ecosystem.
          </p>
          <div className="flex items-center space-x-2 text-xs text-indigo-400">
            <Shield className="w-4 h-4" />
            <span>Garexcell Protected</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <div>
          &copy; {new Date().getFullYear()} Playxcade. All rights reserved.
        </div>
        <div className="font-semibold text-slate-300 flex items-center justify-center space-x-1">
          <span>Powered by Garexcell</span>
        </div>
      </div>
    </footer>
  );
};
