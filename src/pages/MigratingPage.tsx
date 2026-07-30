import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, ArrowRight, Shield, ExternalLink, Loader2 } from 'lucide-react';
import { getFeatureFlags, saveFeatureFlags } from '../config/featureFlags';
import { Footer } from '../components/Footer';

export const MigratingPage: React.FC = () => {
  const [flags, setFlags] = useState(getFeatureFlags());

  // Simulated progress values
  const [userInfoProgress, setUserInfoProgress] = useState(0);
  const [messagesProgress, setMessagesProgress] = useState(0);
  const [profileSettingsProgress, setProfileSettingsProgress] = useState(0);

  useEffect(() => {
    if (flags.migration_status === 'pending' || flags.is_migration) {
      const interval = setInterval(() => {
        setUserInfoProgress((prev) => (prev < 100 ? Math.min(100, prev + 15) : 100));
        setMessagesProgress((prev) => (prev < 100 ? Math.min(100, prev + 10) : 100));
        setProfileSettingsProgress((prev) => (prev < 100 ? Math.min(100, prev + 20) : 100));
      }, 500);

      return () => clearInterval(interval);
    }
  }, [flags]);

  const handleToggleCompleted = () => {
    const updated = saveFeatureFlags({
      is_migration: true,
      migration_status: 'completed'
    });
    setFlags(updated);
  };

  const handleResetMigration = () => {
    const updated = saveFeatureFlags({
      is_migration: false,
      migration_status: 'none'
    });
    setFlags(updated);
    window.location.href = '/feed';
  };

  const isCompleted = flags.migration_status === 'completed';

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between font-sans selection:bg-slate-900 selection:text-white border-t-8 border-slate-900">
      
      {/* Top Header */}
      <header className="p-4 border-b-2 border-slate-900 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center font-black text-lg">P</div>
            <span className="font-black text-xl text-slate-900 tracking-tight">PLAYXCADE CLOUD</span>
          </div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-900 border border-slate-900 px-3 py-1">
            System Migration Protocol
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-6 sm:p-10 my-8 flex flex-col justify-center">
        
        {isCompleted ? (
          /* REDIRECTION NOTICE SCREEN FOR COMPLETED MIGRATION */
          <div className="border-4 border-slate-900 p-8 space-y-6 text-center bg-white shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
            
            <div className="w-20 h-20 bg-emerald-100 border-2 border-slate-900 flex items-center justify-center mx-auto text-slate-900">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div className="space-y-2">
              <span className="bg-slate-900 text-white font-mono text-[10px] font-black px-3 py-1 uppercase tracking-widest inline-block">
                STATUS: MIGRATION COMPLETED
              </span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Data Redirection Notice
              </h1>
              <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-lg mx-auto">
                Your account data, messages, and profile settings have been successfully migrated to the Garexcell Cloud cluster.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-2 border-slate-900 font-mono text-xs text-slate-900 space-y-1 text-left">
              <p className="font-bold">Target Cloud Server:</p>
              <p className="text-indigo-600 font-black text-sm">https://cloud.garexcell.com</p>
              <p className="text-[11px] text-slate-500">Redirecting session token securely...</p>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href="https://cloud.garexcell.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm border-2 border-slate-900 flex items-center justify-center space-x-2 transition shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
              >
                <span>Proceed to cloud.garexcell.com</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={handleResetMigration}
                className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs border-2 border-slate-900 transition"
              >
                Exit Migration Mode
              </button>
            </div>

          </div>
        ) : (
          /* PENDING MIGRATION PROGRESS SCREEN */
          <div className="border-4 border-slate-900 p-8 space-y-8 bg-white shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
            
            {/* Truck Icon Representation */}
            <div className="text-center space-y-3">
              <div className="w-24 h-24 bg-slate-100 border-4 border-slate-900 flex items-center justify-center mx-auto text-slate-900 relative">
                <Truck className="w-12 h-12 text-slate-900 stroke-[2.5]" />
                <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-[9px] font-mono font-bold px-2 py-0.5 border border-slate-900">
                  MOVING DATA
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Migrating Account Data
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Please wait while your account is securely transferred to Garexcell Cloud infrastructure.
              </p>
            </div>

            {/* Progress Bars for each component */}
            <div className="space-y-5 border-t-2 border-b-2 border-slate-900 py-6">
              
              {/* Option 1: User Info */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="flex items-center space-x-2">
                    {userInfoProgress === 100 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-slate-900 animate-spin" />
                    )}
                    <span>Loading User Info</span>
                  </span>
                  <span className="font-mono">{userInfoProgress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 border-2 border-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-slate-900 transition-all duration-300"
                    style={{ width: `${userInfoProgress}%` }}
                  />
                </div>
              </div>

              {/* Option 2: Messages */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="flex items-center space-x-2">
                    {messagesProgress === 100 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-slate-900 animate-spin" />
                    )}
                    <span>Messages</span>
                  </span>
                  <span className="font-mono">{messagesProgress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 border-2 border-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-slate-900 transition-all duration-300"
                    style={{ width: `${messagesProgress}%` }}
                  />
                </div>
              </div>

              {/* Option 3: Profile Settings */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="flex items-center space-x-2">
                    {profileSettingsProgress === 100 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-slate-900 animate-spin" />
                    )}
                    <span>Profile Settings</span>
                  </span>
                  <span className="font-mono">{profileSettingsProgress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 border-2 border-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-slate-900 transition-all duration-300"
                    style={{ width: `${profileSettingsProgress}%` }}
                  />
                </div>
              </div>

            </div>

            {/* Test Action Controls */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleToggleCompleted}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs border-2 border-slate-900 transition shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
              >
                Mark Migration as Completed & View Redirection Notice
              </button>

              <button
                onClick={handleResetMigration}
                className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border-2 border-slate-300 transition"
              >
                Cancel Migration & Return to App
              </button>
            </div>

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};
