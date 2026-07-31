import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Gamepad2, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../lib/i18n';

export const BottomBar: React.FC = () => {
  const { user, language, totalUnreadChatCount } = useAuth();

  const navItems = [
    { to: '/feed', icon: Home, label: getTranslation(language, 'home') },
    { to: '/cloud', icon: Gamepad2, label: 'Cloud' },
    { to: '/foryou', icon: Compass, label: getTranslation(language, 'forYou') },
    { to: '/dm', icon: MessageSquare, label: getTranslation(language, 'chat'), isChat: true },
    { to: user ? '/profile' : '/auth', icon: User, label: getTranslation(language, 'profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 sm:hidden shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5 mb-0.5" />
                {item.isChat && totalUnreadChatCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white font-extrabold text-[9px] min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1 border-2 border-white animate-pulse shadow-sm">
                    {totalUnreadChatCount > 9 ? '9+' : totalUnreadChatCount}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
