import React, { useState } from 'react';
import {
  Globe, Shield, Tv, Check, User, Lock, Mail, ChevronRight, Bell, HelpCircle, LogOut, Sparkles, Smartphone, Key, FileText, Activity, Trash2, Link as LinkIcon, Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { BottomBar } from '../components/BottomBar';
import { IOSBackButton } from '../components/IOSBackButton';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, language, setLanguage, updateProfile, logout } = useAuth();

  // Screen navigation state
  const [screen, setScreen] = useState<
    | 'main'
    | 'general'
    | 'accessibility'
    | 'account_center'
    | 'personal_details'
    | 'connected_services'
    | 'shared_logins'
    | 'apps_and_services'
    | 'accounts_management'
    | 'my_info'
    | 'sessions'
    | 'change_password'
    | 'two_factor'
    | 'deactivate'
    | 'security'
    | 'streaming'
  >('main');

  // Form states
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar_url || '');
  const [defaultCaption, setDefaultCaption] = useState('Streaming live on Garexcell 🕹️ #gaming');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deactivatePassword, setDeactivatePassword] = useState('');
  // 2FA states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(user?.is_2fa_enabled || false);
  const [totpToken, setTotpToken] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [generatedOtpCode, setGeneratedOtpCode] = useState<string>('');
  const [isVerifying2FA, setIsVerifying2FA] = useState<boolean>(false);

  // Submenu preference states
  const [textSize, setTextSize] = useState('Medium');
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [streamQuality, setStreamQuality] = useState('Auto');
  const [streamRegion, setStreamRegion] = useState('Auto (US East)');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePersonalSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      username: editUsername,
      email: editEmail,
      bio: editBio,
      avatar_url: editAvatar,
    });
    showNotification('Personal details updated successfully.');
  };

  const handleDeactivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deactivatePassword) {
      showNotification('Please enter your password to deactivate.');
      return;
    }
    updateProfile({ account_status: 'deactivated' });
    navigate('/deactivated');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 sm:pb-12 font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar showLiveIcon={false} />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg animate-fade-in flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{notification}</span>
        </div>
      )}

      <main className="max-w-xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center space-x-3 pb-2">
          {screen !== 'main' ? (
            <IOSBackButton onClick={() => setScreen('main')} label="Settings" />
          ) : (
            <IOSBackButton onClick={() => navigate('/feed')} label="Feed" />
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {screen === 'main' && 'Settings & Privacy'}
              {screen === 'general' && 'General & Language'}
              {screen === 'accessibility' && 'Accessibility'}
              {screen === 'account_center' && 'Accounts Center'}
              {screen === 'personal_details' && 'Personal Details'}
              {screen === 'connected_services' && 'Connected Services'}
              {screen === 'shared_logins' && 'Shared Logins'}
              {screen === 'apps_and_services' && 'Apps and Websites'}
              {screen === 'accounts_management' && 'Manage Accounts & Profile'}
              {screen === 'my_info' && 'My Info & Permissions'}
              {screen === 'sessions' && 'Login Sessions'}
              {screen === 'change_password' && 'Change Password'}
              {screen === 'two_factor' && 'Two-Factor Authentication'}
              {screen === 'deactivate' && 'Deactivate Account'}
              {screen === 'security' && 'Security & Login'}
              {screen === 'streaming' && 'Cloud Gaming & Streaming'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {screen === 'main' ? 'Manage your account and app preferences' : 'Security & Privacy Control Center'}
            </p>
          </div>
        </div>

        {/* Account Center Banner */}
        {screen === 'main' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                ACC
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Accounts Center</h3>
                <p className="text-xs text-slate-500">Personal details, password, security, connected experiences</p>
              </div>
            </div>
            <button
              onClick={() => setScreen('account_center')}
              className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-1"
            >
              <span>Manage in Accounts Center</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* MAIN SETTINGS LIST */}
        {screen === 'main' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {[
              { id: 'wallet', title: 'Wallet & Top-Up', desc: 'Virtual currency, vouchers, and balance ($' + (user?.wallet_balance || 0) + '.00)', icon: Wallet, action: () => navigate('/wallet') },
              { id: 'account_center', title: 'Accounts Center', desc: 'All connected accounts and security settings', icon: Shield },
              { id: 'general', title: 'General & Language', desc: 'Interface language and preferences', icon: Globe },
              { id: 'accessibility', title: 'Accessibility', desc: 'Display, font size, and motion', icon: Bell },
              { id: 'security', title: 'Security & Login', desc: 'Active sessions and passwords', icon: Lock },
              { id: 'streaming', title: 'Streaming Configuration', desc: 'Cloud server quality and region', icon: Tv },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => item.action ? item.action() : setScreen(item.id as any)}
                  className="w-full p-4 hover:bg-slate-50 flex items-center justify-between transition text-left group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              );
            })}
          </div>
        )}

        {/* ACCOUNTS CENTER FULL MENU */}
        {screen === 'account_center' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {[
              { id: 'personal_details', title: 'Personal Details', desc: 'Manage your contact info, handle, and bio', icon: User },
              { id: 'connected_services', title: 'Connected Service', desc: 'Google, GitHub, and Discord integrations', icon: LinkIcon },
              { id: 'shared_logins', title: 'Shared Logins', desc: 'Cross-platform account synchronization', icon: Shield },
              { id: 'apps_and_services', title: 'Apps and Service', desc: 'Third-party apps with access to your account', icon: Sparkles },
              { id: 'accounts_management', title: 'Accounts Management', desc: 'Avatar, language, captions, verification, review activity', icon: User },
              { id: 'my_info', title: 'My info and permissions', desc: 'Data access, downloads, and privacy controls', icon: FileText },
              { id: 'sessions', title: 'Sessions: Where you are logged in', desc: 'Active devices and browser sessions', icon: Smartphone },
              { id: 'change_password', title: 'Change Password', desc: 'Update secure account password', icon: Lock },
              { id: 'two_factor', title: '2FA Authentications', desc: 'Authenticator app and SMS verification codes', icon: Key },
              { id: 'deactivate', title: 'Deactivate Account', desc: 'Temporarily disable your profile and data', icon: Trash2 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setScreen(item.id as any)}
                  className="w-full p-4 hover:bg-slate-50 flex items-center justify-between transition text-left group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              );
            })}
          </div>
        )}

        {/* 1. PERSONAL DETAILS */}
        {screen === 'personal_details' && (
          <form onSubmit={handlePersonalSave} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">Username Handle</label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">Email Address</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">Bio & Tagline</label>
              <textarea
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              Save Personal Details
            </button>
          </form>
        )}

        {/* 2. CONNECTED SERVICE */}
        {screen === 'connected_services' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            {[
              { name: 'GitHub Developer', status: 'Connected', username: user?.username },
              { name: 'Discord Gaming', status: 'Not Connected', username: null },
            ].map((svc) => (
              <div key={svc.name} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{svc.name}</h4>
                  <p className="text-[11px] text-slate-500">{svc.username || 'Ready to link'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => showNotification(`${svc.name} sync status updated.`)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    svc.status === 'Connected' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {svc.status}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 3. SHARED LOGINS */}
        {screen === 'shared_logins' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Shared logins let you log in seamlessly across linked gaming networks using your primary credentials.
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-900">Master Account</span>
                <p className="text-[11px] text-slate-500">Synchronized across linked apps</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">Active</span>
            </div>
          </div>
        )}

        {/* 4. APPS AND SERVICE */}
        {screen === 'apps_and_services' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <p className="text-xs text-slate-600">
              These third-party applications have authorized access to read your public profile and stream data.
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-900">Garexcell OBS Studio Plugin</span>
                <p className="text-[11px] text-slate-500">Access: Public Profile & Live Chat</p>
              </div>
              <button
                type="button"
                onClick={() => showNotification('App access revoked.')}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs rounded-lg transition"
              >
                Revoke Access
              </button>
            </div>
          </div>
        )}

        {/* 5. ACCOUNTS MANAGEMENT (Avatar, Language, Caption, Request Verification, Review Activity, Delete Account) */}
        {screen === 'accounts_management' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">Avatar URL</label>
              <input
                type="text"
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">Default Post Caption</label>
              <input
                type="text"
                value={defaultCaption}
                onChange={(e) => setDefaultCaption(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => showNotification('Verification badge request submitted to Trust & Safety.')}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Request Gold Verification Badge</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/profile/${user?.username}`)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-xs rounded-xl transition"
              >
                Review Activity & Published Posts
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Permanently delete your account and all data?')) {
                    logout();
                    navigate('/');
                  }
                }}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs rounded-xl transition"
              >
                Permanently Delete Account
              </button>
            </div>
          </div>
        )}

        {/* 6. MY INFO AND PERMISSIONS */}
        {screen === 'my_info' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Your Data & Privacy Controls</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You can download a full copy of your account profile details, security events, and activity history in standard JSON format.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="text-xs font-bold text-slate-800">Archive contents:</p>
              <ul className="text-[11px] text-slate-500 list-disc list-inside space-y-0.5">
                <li>Profile details & gamer tag</li>
                <li>Account security & verification status</li>
                <li>Network settings & connected devices</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => {
                const exportData = {
                  account: {
                    user_id: user?.user_id || 'usr_demo',
                    username: user?.username || 'gamer',
                    email: user?.email || 'user@example.com',
                    bio: user?.bio || '',
                    account_status: user?.account_status || 'active',
                    created_at: user?.created_at || new Date().toISOString()
                  },
                  exported_at: new Date().toISOString(),
                  system: 'Playxcade Security & Privacy Portal'
                };
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `playxcade_data_${user?.username || 'account'}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showNotification('Data archive downloaded successfully.');
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Download My Data Archive (.json)</span>
            </button>
          </div>
        )}

        {/* 7. SESSIONS */}
        {screen === 'sessions' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Where You Are Logged In</h3>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-bold text-xs text-slate-900">Current Session (This Browser)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">IP: 192.168.1.104 • Cloud Run Secure Node</p>
              </div>
              <span className="text-xs font-bold text-emerald-700">Active Now</span>
            </div>
          </div>
        )}

        {/* 8. CHANGE PASSWORD */}
        {screen === 'change_password' && (
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!currentPassword || !newPassword) {
              showNotification('Please fill in both password fields.');
              return;
            }
            showNotification('Password changed successfully.');
            setCurrentPassword('');
            setNewPassword('');
          }} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              Update Password
            </button>
          </form>
        )}

        {/* 9. TWO-FACTOR AUTHENTICATION */}
        {screen === 'two_factor' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <h4 className="font-bold text-xs text-slate-900">Authenticator App (TOTP)</h4>
                <p className="text-[11px] text-slate-500">Use Google Authenticator or Authy for secure 6-digit codes.</p>
              </div>
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setTwoFactorEnabled(enabled);
                  updateProfile({ is_2fa_enabled: enabled });
                  showNotification(enabled ? '2FA enabled successfully' : '2FA disabled');
                }}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl text-xs text-indigo-900 font-medium">
              Your account is currently secured with multi-factor authentication.
            </div>
          </div>
        )}

        {/* 10. DEACTIVATE ACCOUNT */}
        {screen === 'deactivate' && (
          <form onSubmit={handleDeactivate} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 leading-relaxed">
              Deactivating your account is temporary. Your profile, photos, and comments will disappear until you log back in and reactivate.
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">Enter Password to Confirm Deactivation</label>
              <input
                type="password"
                value={deactivatePassword}
                onChange={(e) => setDeactivatePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              Confirm & Deactivate Account
            </button>
          </form>
        )}

        {/* GENERAL & LANGUAGE SCREEN */}
        {screen === 'general' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div>
              <h3 className="font-bold text-sm text-slate-900 mb-3">App Language</h3>
              <div className="space-y-2">
                {[
                  { key: 'en', label: 'English (US)' },
                  { key: 'es', label: 'Spanish (Español)' },
                  { key: 'fr', label: 'French (Français)' },
                  { key: 'system', label: 'Device System Default' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setLanguage(item.key as Language);
                      showNotification(`Language set to ${item.label}`);
                    }}
                    className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition ${
                      language === item.key
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span>{item.label}</span>
                    {language === item.key && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ACCESSIBILITY SCREEN */}
        {screen === 'accessibility' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">Text Size</label>
              <select
                value={textSize}
                onChange={(e) => {
                  setTextSize(e.target.value);
                  showNotification(`Text size updated to ${e.target.value}`);
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              >
                <option value="Small">Small (14px)</option>
                <option value="Medium">Standard (16px)</option>
                <option value="Large">Large (18px)</option>
              </select>
            </div>
          </div>
        )}

        {/* SECURITY & LOGIN SCREEN */}
        {screen === 'security' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <button
              onClick={() => setScreen('change_password')}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold transition"
            >
              <span>Change Account Password</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => setScreen('two_factor')}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold transition"
            >
              <span>Two-Factor Authentication Setup</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        )}

        {/* STREAMING CONFIGURATION SCREEN */}
        {screen === 'streaming' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">Stream Quality</label>
                <select
                  value={streamQuality}
                  onChange={(e) => {
                    setStreamQuality(e.target.value);
                    showNotification(`Quality set to ${e.target.value}`);
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                >
                  <option value="Auto">Auto (60fps adaptive)</option>
                  <option value="720p">720p HD (Low Latency)</option>
                  <option value="1080p">1080p Full HD (Recommended)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">Server Region</label>
                <select
                  value={streamRegion}
                  onChange={(e) => {
                    setStreamRegion(e.target.value);
                    showNotification(`Region set to ${e.target.value}`);
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                >
                  <option value="Auto (US East)">US East (Virginia)</option>
                  <option value="US West">US West (Oregon)</option>
                  <option value="EU Central">EU Central (Frankfurt)</option>
                  <option value="Asia Pacific">Asia Pacific (Tokyo)</option>
                </select>
              </div>
            </div>
          </div>
        )}

      </main>

      <BottomBar />
    </div>
  );
};
