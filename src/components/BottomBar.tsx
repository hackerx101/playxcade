import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, MessageSquare, User, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../lib/i18n';

export const BottomBar: React.FC = () => {
  const { user, language, totalUnreadChatCount } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 sm:hidden shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Home */}
        <NavLink
          to="/feed"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2.5 text-[11px] font-medium transition-colors ${
              isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>{getTranslation(language, 'home')}</span>
        </NavLink>

        {/* For You */}
        <NavLink
          to="/foryou"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2.5 text-[11px] font-medium transition-colors ${
              isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span>{getTranslation(language, 'forYou')}</span>
        </NavLink>

        {/* Middle FAB - Orion AI */}
        <NavLink
          to="/ai"
          className={({ isActive }) =>
            `relative flex flex-col items-center -mt-5 transition-transform active:scale-95 ${
              isActive ? 'scale-105' : ''
            }`
          }
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-indigo-500 text-white shadow-lg border-4 border-white flex items-center justify-center">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <span className="text-[10px] font-extrabold text-purple-700 mt-0.5">Orion AI</span>
        </NavLink>

        {/* Chat */}
        <NavLink
          to="/dm"
          className={({ isActive }) =>
            `relative flex flex-col items-center py-1 px-2.5 text-[11px] font-medium transition-colors ${
              isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 mb-0.5" />
            {totalUnreadChatCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white font-extrabold text-[9px] min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1 border-2 border-white animate-pulse shadow-sm">
                {totalUnreadChatCount > 9 ? '9+' : totalUnreadChatCount}
              </span>
            )}
          </div>
          <span>{getTranslation(language, 'chat')}</span>
        </NavLink>

        {/* Profile */}
        <NavLink
          to={user ? '/profile' : '/auth'}
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2.5 text-[11px] font-medium transition-colors ${
              isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>{getTranslation(language, 'profile')}</span>
        </NavLink>
      </div>
    </nav>
  );
};
