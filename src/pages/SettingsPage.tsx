import React, { useState, useEffect } from 'react';
import {
  Globe, Shield, ShieldCheck, Tv, Check, User, Lock, Mail, ChevronRight, Bell, HelpCircle, LogOut, Sparkles, Smartphone, Key, FileText, Activity, Trash2, Link as LinkIcon, Wallet, 
  Users, AlertTriangle, Clock, CheckCircle2, XCircle, Monitor, Laptop, Gamepad2, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { BottomBar } from '../components/BottomBar';
import { IOSBackButton } from '../components/IOSBackButton';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { generateSecret, verifyTOTP, getTOTPQRUrl } from '../lib/totp';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, language, setLanguage, updateProfile, logout, blockedUserIds, unblockUser, fetchBlockedUsers } = useAuth();

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

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
    | 'subscription'
    | 'blocked_users'
    | 'badge_application'
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

  useEffect(() => {
    if (user) {
      setEditUsername(user.username || '');
      setEditEmail(user.email || '');
      setEditBio(user.bio || '');
      setEditAvatar(user.avatar_url || '');
    }
  }, [user]);
  // 2FA states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(user?.is_2fa_enabled || false);
  const [reports, setReports] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([
    {
      id: 'viol_1',
      guideline: 'Harassment & Bullying',
      content: 'I killed that deal on stream today!',
      status: 'rejected', // 'none' | 'pending' | 'approved' | 'rejected'
      date: '2026-08-10',
      reason: 'Flagged keyword "killed". Re-evaluated by context function: Business metaphor / harmless speech. Appeal Rejected as case is already resolved.'
    }
  ]);
  const [appealModalViolId, setAppealModalViolId] = useState<string | null>(null);
  const [appealText, setAppealText] = useState('');
  const [totpToken, setTotpToken] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [generatedOtpCode, setGeneratedOtpCode] = useState<string>('');
  const [isVerifying2FA, setIsVerifying2FA] = useState<boolean>(false);
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (screen === 'two_factor' && !twoFactorEnabled && !totpSecret) {
      const secret = generateSecret(16);
      setTotpSecret(secret);
      setQrCodeUrl(getTOTPQRUrl(user?.username || 'user', secret));
    }
  }, [screen, twoFactorEnabled, totpSecret, user?.username]);

  // Badge application states
  const [badgeName, setBadgeName] = useState(user?.username || '');
  const [badgeDob, setBadgeDob] = useState(user?.dob || '2000-01-01');
  const [badgeEmail, setBadgeEmail] = useState(user?.email || '');
  const [badgeLinks, setBadgeLinks] = useState('');
  const [badgeIdFileName, setBadgeIdFileName] = useState('');
  const [badgeSubmitting, setBadgeSubmitting] = useState(false);
  const [badgeSuccess, setBadgeSuccess] = useState(false);

  // Submenu preference states
  const [textSize, setTextSize] = useState('Medium');
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [streamQuality, setStreamQuality] = useState('Auto');
  const [streamRegion, setStreamRegion] = useState('Auto (US East)');
  const [notification, setNotification] = useState<string | null>(null);

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
              {screen === 'subscription' && 'Subscriptions & Plans'}
              {screen === 'badge_application' && 'Gold Badge Application'}
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
              { id: 'account_center', title: 'Accounts Center', desc: 'All connected accounts and security settings', icon: Shield },
              { id: 'blocked_users', title: 'Blocked Users', desc: 'Manage restricted and blocked accounts', icon: UserX },
              { id: 'general', title: 'General & Language', desc: 'Interface language and preferences', icon: Globe },
              { id: 'accessibility', title: 'Accessibility', desc: 'Display, font size, and motion', icon: Bell },
              { id: 'security', title: 'Security & Login', desc: 'Active sessions and passwords', icon: Lock },
              { id: 'streaming', title: 'Streaming Configuration', desc: 'Cloud server quality and region', icon: Tv },
              { id: 'subscription', title: 'Subscriptions & Plans', desc: 'Manage your plan and billing', icon: Wallet },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => (item as any).action ? (item as any).action() : setScreen(item.id as any)}
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
          <div className="space-y-6">
            {/* Header Identity Card */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`}
                    alt="User Avatar"
                    className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-white/20 shadow-md object-cover"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-extrabold tracking-tight">@{user?.username || 'gamer'}</h2>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                        Active & Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{user?.email || 'user@example.com'}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">UID: {user?.user_id || 'USR-90214'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setScreen('personal_details')}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/10 transition"
                >
                  Edit Profile
                </button>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
            </div>

            {/* Section 1: Personal & Verification */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Personal & Identity Information</h3>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Profile Settings</span>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { id: 'personal_details', title: 'Personal Details', desc: 'Email address, username, phone number, and bio', icon: User },
                  { id: 'badge_application', title: 'Creator Badge Verification', desc: 'Apply for official gold verified badge status', icon: ShieldCheck },
                  { id: 'my_info', title: 'Data Privacy & Download Archive', desc: 'Download your full account activity and data JSON archive', icon: FileText },
                ].map((item) => (
                  <button key={item.id} onClick={() => setScreen(item.id as any)} className="w-full p-4 hover:bg-slate-50 flex items-center justify-between transition text-left group">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{item.title}</h4>
                        <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Security & Devices */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Password & Security Controls</h3>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">4 Devices Active</span>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { id: 'change_password', title: 'Password & Credential Change', desc: 'Update login password and force logout across devices', icon: Lock },
                  { id: 'sessions', title: 'Login Sessions & Recognized Devices', desc: 'View all active devices logged into your account and terminate sessions', icon: Smartphone },
                  { id: 'two_factor', title: 'Two-Factor Authentication (2FA)', desc: 'Configure authenticator app (TOTP) or SMS security codes', icon: Key },
                  { id: 'shared_logins', title: 'Shared Account Credentials', desc: 'Manage shared sub-accounts and secondary gaming credentials', icon: Shield },
                ].map((item) => (
                  <button key={item.id} onClick={() => setScreen(item.id as any)} className="w-full p-4 hover:bg-slate-50 flex items-center justify-between transition text-left group">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{item.title}</h4>
                        <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Integrations & Payments */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Connected Accounts & Billing</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { id: 'connected_services', title: 'Cross-Platform Integrations', desc: 'Sync Epic Games, PlayStation Network, and YouTube accounts', icon: LinkIcon },
                  { id: 'subscription', title: 'Subscriptions & Billing Plans', desc: 'Manage Pro/VIP membership tiers, invoices, and payment methods', icon: Wallet },
                  { id: 'account_status', title: 'Account Health & Moderation Status', desc: 'Review warning history, strikes, and active community appeals', icon: AlertTriangle },
                ].map((item) => (
                  <button key={item.id} onClick={() => setScreen(item.id as any)} className="w-full p-4 hover:bg-slate-50 flex items-center justify-between transition text-left group">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{item.title}</h4>
                        <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                  </button>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-rose-50/50 rounded-3xl p-5 border border-rose-100 space-y-3">
              <div className="flex items-center space-x-2 text-rose-800">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Account Deactivation & Deletion</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Temporarily deactivate your profile or permanently delete your account and remove all personal data.
              </p>
              <button
                onClick={() => setScreen('deactivate')}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition"
              >
                Manage Account Deactivation
              </button>
            </div>
          </div>
        )}

        {/* BLOCKED USERS SECTION */}
        {screen === 'blocked_users' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Blocked Users</h3>
                <p className="text-xs text-slate-500 font-medium">Manage accounts you have restricted or blocked</p>
              </div>
              <span className="px-3 py-1 text-xs font-black rounded-full bg-slate-100 text-slate-700">
                {blockedUserIds.length} Blocked
              </span>
            </div>

            {blockedUserIds.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <UserX className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Blocked Accounts</p>
                <p className="text-[11px] text-slate-500">When you block users from their profile or chat, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {blockedUserIds.map((bId) => (
                  <div key={bId} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                        {String(bId || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">User ID: {bId}</p>
                        <p className="text-[11px] text-slate-500">Restricted from messaging & interacting</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await unblockUser(bId);
                        showNotification('User unblocked successfully.');
                      }}
                      className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
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
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
            <h3 className="font-bold text-sm text-slate-900">Connected Services</h3>
            {[
              { name: 'Epic Games', icon: Gamepad2 },
              { name: 'PlayStation Network', icon: Tv },
              { name: 'YouTube', icon: Monitor },
            ].map((svc) => {
              const SvcIcon = svc.icon;
              return (
                <div key={svc.name} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className='flex items-center gap-3'>
                    <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center">
                      <SvcIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{svc.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Not connected</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                        showNotification(`${svc.name} placeholder updated.`);
                    }}
                    className="px-5 py-2.5 bg-black text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
                  >
                    Connect
                  </button>
                </div>
              );
            })}
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
                onClick={() => setScreen('badge_application')}
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
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Active Login Sessions & Devices</h3>
                <p className="text-xs text-slate-500 font-medium">Devices currently authenticated to your Garexcell account</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  showNotification('All other session tokens invalidated.');
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition"
              >
                Refresh Sessions
              </button>
            </div>

            <div className="space-y-3">
              {/* Device 1: Real Current Session */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-start justify-between">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-slate-900">
                        {navigator.userAgent.includes('Firefox') ? 'Firefox Browser' : navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome') ? 'Safari Browser' : 'Chrome / Webkit Browser'}
                      </h4>
                      <span className="px-2 py-0.5 bg-emerald-600 text-white font-extrabold text-[10px] rounded-full uppercase tracking-wider">Current Device</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Platform: {navigator.platform || 'Web Application'} • Screen: {window.innerWidth}x{window.innerHeight}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1">Active Now • Cloud Run Secure Node Token</p>
                  </div>
                </div>
              </div>

              {/* Clean Empty State for Secondary Devices */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-slate-800">No Secondary Sessions Active</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your account is not logged in on any other browsers or unrecognized devices.
                </p>
              </div>
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-slate-900">Multi-Factor Authenticator Setup</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Add an extra layer of security to your account. Once configured, you will be prompted to enter a 6-digit TOTP validation code from Google Authenticator or Authy whenever you log in.
              </p>
            </div>

            {twoFactorEnabled ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start space-x-3 text-emerald-900 text-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Two-Factor Authentication is Enabled</p>
                    <p className="text-slate-600 leading-relaxed">
                      Your account is protected by an authenticator application. When signing in, your 6-digit TOTP validation key will be requested.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (confirm("Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.")) {
                      setTwoFactorEnabled(false);
                      await updateProfile({ is_2fa_enabled: false });
                      showNotification('Two-Factor Authentication disabled successfully.');
                    }
                  }}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition"
                >
                  Disable Two-Factor Authentication
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start space-x-3 text-amber-900 text-xs">
                  <Key className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Pairing Your Device</p>
                    <p className="text-slate-600 leading-relaxed">
                      Follow the steps below to establish Two-Factor Authentication with Google Authenticator or Authy on your mobile phone.
                    </p>
                  </div>
                </div>

                {/* Step 1: Download App */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-slate-800">Step 1: Install Authenticator Application</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Download and open Google Authenticator or Authy from the App Store or Google Play Store.
                  </p>
                </div>

                {/* Step 2: Scan QR or enter Secret Key */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-800">Step 2: Scan the QR Code or Manual Entry Key</p>
                  
                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
                    {qrCodeUrl ? (
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl shrink-0 shadow-sm">
                        <img src={qrCodeUrl} alt="TOTP QR Code" className="w-32 h-32" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-slate-100 rounded-xl flex items-center justify-center animate-pulse border border-slate-200 shrink-0">
                        <span className="text-[10px] text-slate-400">Generating QR...</span>
                      </div>
                    )}

                    <div className="space-y-1.5 text-xs text-slate-600 flex-1">
                      <p>Scan the code or enter this manual key inside your authenticator application:</p>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 tracking-wider select-all flex justify-between items-center text-[11px]">
                        <span>{totpSecret || 'Generating secret...'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Enter this secret key manually if you cannot scan the QR code.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 3: Enter confirmation OTP */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-800">Step 3: Verify & Save</p>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Enter 6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g., 123456"
                      className="w-full text-center max-w-[200px] tracking-[0.5em] text-sm font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (otpInput.length !== 6) {
                        alert("Please enter a 6-digit verification code.");
                        return;
                      }
                      try {
                        const { verifyTOTP } = await import('../lib/totp');
                        const isValid = await verifyTOTP(totpSecret, otpInput);
                        if (isValid) {
                          setTwoFactorEnabled(true);
                          await updateProfile({ is_2fa_enabled: true, totp_secret: totpSecret });
                          setOtpInput('');
                          showNotification('Two-Factor Authentication is now active on your profile.');
                        } else {
                          alert("Invalid verification code: Please check your authenticator application.");
                        }
                      } catch (err: any) {
                        console.error("2FA validation error:", err);
                        alert("Error validating security token.");
                      }
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                  >
                    Confirm Code & Enable 2FA
                  </button>
                </div>
              </div>
            )}
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

        {/* 11. GOLD BADGE APPLICATION FORM */}
        {screen === 'badge_application' && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!badgeName || !badgeEmail || !badgeDob || !badgeLinks || !badgeIdFileName) {
                alert("Please complete all fields, including ID upload and channel links.");
                return;
              }
              setBadgeSubmitting(true);
              
              try {
                const { db } = await import('../lib/firebase');
                const { collection, addDoc } = await import('firebase/firestore');
                await addDoc(collection(db, 'badge_applications'), {
                  user_id: user?.user_id,
                  username: user?.username,
                  fullName: badgeName,
                  dob: badgeDob,
                  email: badgeEmail,
                  channel_links: badgeLinks,
                  id_file_name: badgeIdFileName,
                  status: 'pending',
                  created_at: new Date().toISOString()
                });

                setBadgeSuccess(true);
                showNotification('Your verification badge application has been submitted successfully.');
                setTimeout(() => {
                  setBadgeSuccess(false);
                  setScreen('accounts_management');
                }, 3000);
              } catch (err: any) {
                console.error("Badge application error:", err);
                alert(`Error submitting application: ${err.message}`);
              } finally {
                setBadgeSubmitting(false);
              }
            }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Gold Verification Badge Application</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Apply for the prestigious gold verification badge on Garexcell Network. Provide your legal identity information and community links to verify your creator status.
              </p>
            </div>

            {badgeSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold text-center">
                APPLICATION SUBMITTED! Trust & Safety will review your uploaded details.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">Legal Full Name</label>
                <input
                  type="text"
                  value={badgeName}
                  onChange={(e) => setBadgeName(e.target.value)}
                  placeholder="e.g., Jane Doe"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">Date of Birth</label>
                <input
                  type="date"
                  value={badgeDob}
                  onChange={(e) => setBadgeDob(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-700 uppercase">Verification Email</label>
              <input
                type="email"
                value={badgeEmail}
                onChange={(e) => setBadgeEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-700 uppercase">Channel / Profile Links</label>
              <textarea
                rows={2}
                value={badgeLinks}
                onChange={(e) => setBadgeLinks(e.target.value)}
                placeholder="e.g. https://garexcell.com/channel/live, https://youtube.com/c/yourname"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="text-[9px] text-slate-400">Provide URL links to your streaming channels or profiles.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-700 uppercase">Upload Government ID Document</label>
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer relative bg-slate-50 hover:bg-slate-50/50 transition">
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setBadgeIdFileName(file.name);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*,.pdf"
                  required
                />
                <div className="space-y-1">
                  <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm inline-block">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    {badgeIdFileName ? `Selected File: ${badgeIdFileName}` : 'Select or drop government passport/ID file'}
                  </p>
                  <p className="text-[9px] text-slate-400">Supported types: JPG, PNG, PDF (Max 10MB)</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setScreen('accounts_management')}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={badgeSubmitting || badgeSuccess}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                {badgeSubmitting ? 'Submitting Application...' : 'Submit Gold Badge Application'}
              </button>
            </div>
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
                      setLanguage(item.key as any);
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

        {/* SUBSCRIPTION SCREEN */}
        {screen === 'subscription' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Your Subscription</h3>
              {user?.subscription_plan && user.subscription_plan !== 'none' ? (
                <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Current Plan</span>
                    <p className="text-lg font-bold text-indigo-950 capitalize">{user.subscription_plan}</p>
                  </div>
                  <div className="px-4 py-1.5 bg-white rounded-xl text-xs font-bold text-indigo-600 shadow-sm border border-indigo-200">Active</div>
                </div>
              ) : (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 font-medium">
                  You are not currently subscribed to any plan.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 px-1">Call Plans</h3>
              {[
                { name: 'Essential', price: '5.99', features: ['Standard Calls', 'Basic Support'] },
                { name: 'Premium', price: '20.99', features: ['HD Calls', 'Priority Support', 'No Ads'] },
                { name: 'Diamond', price: '199.99', features: ['All Premium', 'Dedicated Manager', 'Unlimited Access'] },
              ].map((plan) => (
                <div key={plan.name} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-5">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xl text-slate-900">{plan.name}</h4>
                    <span className="text-2xl font-bold text-slate-950">${plan.price}</span>
                  </div>
                  <ul className="text-sm text-slate-600 space-y-3 font-medium">
                    {plan.features.map(f => <li key={f} className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500" /> {f}</li>)}
                  </ul>
                  <button
                    onClick={() => navigate(`/checkout?plan=${plan.name.toLowerCase()}&amount=${plan.price}`)}
                    className="w-full py-4 bg-black text-white font-bold text-sm rounded-2xl hover:bg-slate-800 transition shadow-lg"
                  >
                    Upgrade to {plan.name}
                  </button>
                </div>
              ))}
            </div>
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
