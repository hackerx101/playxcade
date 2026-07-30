import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserX, Power, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Footer } from '../components/Footer';

export const DeactivatedPage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleReactivate = () => {
    updateProfile({ account_status: 'active' });
    navigate('/feed');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <UserX className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900">Your Account is Deactivated</h1>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              You temporarily deactivated your Garexcell account. You can reactivate it at any time by logging back in or clicking the button below.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleReactivate}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2"
            >
              <Power className="w-4 h-4" />
              <span>Reactivate Account</span>
            </button>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
