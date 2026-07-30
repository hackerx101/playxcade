import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radio, Search, Settings, LogOut, User, ShieldCheck, Gamepad2, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../lib/i18n';

interface NavbarProps {
  onStartStream?: () => void;
  showLiveIcon?: boolean;
  hideLinks?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onStartStream, showLiveIcon = true, hideLinks = false }) => {
  const { user, logout, language, theme, setTheme } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left Side: Live Icon & Logo */}
        <div className="flex items-center space-x-3">
          {showLiveIcon && onStartStream && (
            <button
              onClick={onStartStream}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-semibold shadow-sm transition active:scale-95"
              title="Start Live Stream"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span className="hidden sm:inline">GO LIVE</span>
            </button>
          )}

          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md group-hover:bg-indigo-700 transition">
              P
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Playxcade
            </span>
          </Link>
        </div>

        {/* Center Navigation Links (Desktop) - Hidden on Landing Page when hideLinks is true */}
        {!hideLinks && (
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
            <Link to="/feed" className="hover:text-indigo-600:text-indigo-400 transition">
              {getTranslation(language, 'home')}
            </Link>
            <Link to="/foryou" className="hover:text-indigo-600:text-indigo-400 transition">
              {getTranslation(language, 'forYou')}
            </Link>
            <Link to="/explore" className="hover:text-indigo-600:text-indigo-400 transition">
              {getTranslation(language, 'explore')}
            </Link>
            <Link to="/dm" className="hover:text-indigo-600:text-indigo-400 transition">
              {getTranslation(language, 'chat')}
            </Link>
          </div>
        )}

        {/* Right Side: Theme Toggle / Search / Settings / User Menu */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Switcher Icon */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100:bg-slate-800 transition flex items-center justify-center"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-600" />
            )}
          </button>

          {!hideLinks && (
            <Link
              to="/explore"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900:text-white hover:bg-slate-100:bg-slate-800 transition"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </Link>
          )}

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center space-x-2 focus:outline-none p-1 rounded-full hover:ring-2 hover:ring-indigo-500 transition"
              >
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                  alt={user.username}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200"
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-400">LOGGED IN AS</p>
                    <p className="text-sm font-bold text-slate-900 truncate">@{user.username}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    {user.IsIdentityVerify && (
                      <div className="mt-1 flex items-center space-x-1 text-xs text-emerald-600 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Identity Verified</span>
                      </div>
                    )}
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-4 py-2.5 text-sm hover:bg-slate-50:bg-slate-700 transition"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>View Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-4 py-2.5 text-sm hover:bg-slate-50:bg-slate-700 transition"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>{getTranslation(language, 'manageAccount')}</span>
                  </Link>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                      navigate('/auth');
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50:bg-rose-950/30 transition text-left font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{getTranslation(language, 'logout')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
            >
              {getTranslation(language, 'login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
