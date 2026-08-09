import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radio, Search, Settings, LogOut, User, ShieldCheck, Gamepad2, Menu, X, Sun, Moon, Bell, MessageSquare, UserPlus, Check, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../lib/i18n';

interface NavbarProps {
  onStartStream?: () => void;
  showLiveIcon?: boolean;
  hideLinks?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onStartStream, showLiveIcon = true, hideLinks = false }) => {
  const { user, logout, language, theme, setTheme, notifications, unreadNotificationCount, totalUnreadChatCount, markNotificationsAsRead } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
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
          {showLiveIcon && (
            <button
              onClick={() => {
                if (onStartStream) {
                  onStartStream();
                } else {
                  navigate('/feed?startStream=true');
                }
              }}
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
            <Link to="/feed" className="hover:text-indigo-600 transition">
              {getTranslation(language, 'home')}
            </Link>
            <Link to="/foryou" className="hover:text-indigo-600 transition">
              {getTranslation(language, 'forYou')}
            </Link>
            <Link to="/cloud" className="hover:text-indigo-600 text-indigo-600 font-bold flex items-center space-x-1.5 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 transition">
              <Gamepad2 className="w-4 h-4 text-indigo-600" />
              <span>Cloud Gaming</span>
            </Link>
            <Link to="/dm" className="hover:text-indigo-600 transition flex items-center space-x-1">
              <span>{getTranslation(language, 'chat')}</span>
              {totalUnreadChatCount > 0 && (
                <span className="bg-rose-500 text-white font-extrabold text-[10px] px-1.5 py-0.2 rounded-full animate-pulse shadow-sm">
                  {totalUnreadChatCount > 9 ? '9+' : totalUnreadChatCount}
                </span>
              )}
            </Link>
          </div>
        )}

        {/* Right Side: Search / Settings / User Menu */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {!hideLinks && (
            <Link
              to="/explore"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900:text-white hover:bg-slate-100:bg-slate-800 transition"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </Link>
          )}

          {/* Real-time Notifications Bell Icon */}
          {user && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (!notifOpen && unreadNotificationCount > 0) {
                    markNotificationsAsRead();
                  }
                }}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition relative flex items-center justify-center"
                title="Notifications"
                aria-label="View Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">Notifications</h4>
                    </div>
                    {unreadNotificationCount > 0 && (
                      <button
                        onClick={markNotificationsAsRead}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 space-y-1">
                        <Bell className="w-6 h-6 mx-auto text-slate-300" />
                        <p className="text-xs font-bold text-slate-600">No new alerts</p>
                        <p className="text-[11px] text-slate-400">You're all caught up with real-time updates.</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setNotifOpen(false);
                            if (n.type === 'message') {
                              navigate(`/chat/${n.sender_username}`);
                            } else {
                              navigate(`/profile/${n.sender_username}`);
                            }
                          }}
                          className={`p-3.5 hover:bg-indigo-50/40 transition cursor-pointer flex items-start space-x-3 ${
                            !n.read ? 'bg-indigo-50/20' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                            {n.type === 'message' ? (
                              <MessageSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <UserPlus className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-xs text-slate-900 truncate">{n.title}</p>
                              <span className="text-[9px] text-slate-400">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed truncate">{n.body}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="flex items-center space-x-2">
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
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 transition"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>View Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 transition"
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
                      className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition text-left font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{getTranslation(language, 'logout')}</span>
                    </button>
                  </div>
                )}
              </div>
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
