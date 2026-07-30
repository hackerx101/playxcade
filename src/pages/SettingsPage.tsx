import React, { useState } from 'react';
import {
  ChevronDown, ChevronRight, Settings, Globe, Moon, Sun, Shield, Lock, CreditCard,
  Tv, Gamepad2, Bell, Eye, HelpCircle, AlertTriangle, Check, ArrowLeft, Database
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { BottomBar } from '../components/BottomBar';
import { useAuth } from '../context/AuthContext';
import { Language, Theme } from '../types';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, language, setLanguage, theme, setTheme, updateProfile, logout } = useAuth();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    account: true,
  });

  const [modalAction, setModalAction] = useState<string | null>(null);

  // States for setting values
  const [textSize, setTextSize] = useState('Medium');
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [streamQuality, setStreamQuality] = useState('Auto');
  const [streamRegion, setStreamRegion] = useState('Auto (US East)');
  const [bandwidthLimit, setBandwidthLimit] = useState('Unlimited');

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAction = (title: string) => {
    if (title === 'Top-Up Balance') {
      updateProfile({ wallet_balance: (user?.wallet_balance || 0) + 10 });
      setModalAction('Added $10 to Wallet');
    } else {
      setModalAction(title);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-24 sm:pb-12 transition-colors">
      <Navbar showLiveIcon={false} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Settings Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100:bg-slate-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Settings</h1>
              <p className="text-xs text-slate-500">Playxcade & Garexcell Account Configuration</p>
            </div>
          </div>
        </div>

        {/* 1. GENERAL */}
        <section className="mb-6">
          <button
            onClick={() => toggleSection('general')}
            className="w-full p-4 flex items-center justify-between font-extrabold text-base text-slate-900 border-b border-slate-200"
          >
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-indigo-600" />
              <span>General</span>
            </div>
            {openSections['general'] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          {openSections['general'] && (
            <div className="p-5 space-y-6 text-xs divide-y divide-slate-100">
              {/* Language */}
              <div className="pt-2">
                <p className="font-bold text-slate-900 text-sm mb-2">Language</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'en', label: 'English' },
                    { key: 'es', label: 'Spanish' },
                    { key: 'fr', label: 'French' },
                    { key: 'system', label: 'System Default' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setLanguage(item.key as Language)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                        language === item.key
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{item.label}</span>
                      {language === item.key && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accessibility */}
              <div className="pt-4 space-y-3">
                <p className="font-bold text-slate-900 text-sm">Accessibility</p>
                <div className="flex items-center justify-between">
                  <span>Text Size</span>
                  <select
                    value={textSize}
                    onChange={(e) => setTextSize(e.target.value)}
                    className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span>High Contrast</span>
                  <input
                    type="checkbox"
                    checked={highContrast}
                    onChange={(e) => setHighContrast(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Reduced Motion</span>
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={(e) => setReducedMotion(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                </div>
              </div>

              {/* App Version */}
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">App Version</p>
                  <p className="text-slate-500">v4.12.0 (Garexcell Build 2026)</p>
                </div>
                <button
                  onClick={() => alert('Playxcade is up to date!')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg"
                >
                  Check for Updates
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 2. ACCOUNT */}
        <section className="mb-6">
          <button
            onClick={() => toggleSection('account')}
            className="w-full p-4 flex items-center justify-between font-extrabold text-base text-slate-900 border-b border-slate-200"
          >
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span>Account</span>
            </div>
            {openSections['account'] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          {openSections['account'] && (
            <div className="p-5 space-y-5 text-xs divide-y divide-slate-100">
              {/* Profile */}
              <div>
                <p className="font-bold text-slate-900 text-sm mb-2">Profile</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl">
                    <span>Username</span>
                    <span className="font-bold text-slate-900">@{user?.username}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl">
                    <span>Avatar</span>
                    <span className="text-indigo-600 font-bold">Custom SVG</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl">
                    <span>Bio</span>
                    <span className="truncate max-w-[180px]">{user?.bio}</span>
                  </div>
                </div>
              </div>

              {/* Email & Password */}
              <div className="pt-4 space-y-2">
                <p className="font-bold text-slate-900 text-sm">Email & Password</p>
                <div className="flex justify-between items-center">
                  <span>Change Email ({user?.email})</span>
                  <button onClick={() => handleAction('Change Email')} className="text-indigo-600 font-bold hover:underline">
                    Edit
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span>Change Password</span>
                  <button onClick={() => handleAction('Change Password')} className="text-indigo-600 font-bold hover:underline">
                    Update
                  </button>
                </div>
              </div>

              {/* Security */}
              <div className="pt-4 space-y-2">
                <p className="font-bold text-slate-900 text-sm">Security & Community Standing</p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Account Standing</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      user?.account_status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : user?.account_status === 'limited'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {user?.account_status || 'active'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Moderation Strikes</span>
                    <span className="font-extrabold text-slate-900">{user?.strikes_count || 0} / 4 Strikes</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Policy Reminders / Warnings</span>
                    <span className="font-bold text-slate-700">{user?.warnings_count || 0} Warnings</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span>Two-Factor Authentication</span>
                  <button onClick={() => handleAction('2FA Setup')} className="text-indigo-600 font-bold hover:underline">
                    Enable
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span>Login History</span>
                  <button onClick={() => handleAction('Login History')} className="text-indigo-600 font-bold hover:underline">
                    View
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span>Authorized Devices</span>
                  <button onClick={() => handleAction('Authorized Devices')} className="text-indigo-600 font-bold hover:underline">
                    Manage (2)
                  </button>
                </div>
              </div>

              {/* Linked Accounts */}
              <div className="pt-4 space-y-2">
                <p className="font-bold text-slate-900 text-sm">Linked Accounts</p>
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                  <span className="font-bold text-indigo-600">Garexcell Network</span>
                  <span className="text-emerald-600 font-bold">Linked</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                  <span>Steam</span>
                  <span className="text-slate-400">Not Linked</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                  <span>Xbox</span>
                  <span className="text-slate-400">Not Linked</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                  <span>PlayStation</span>
                  <span className="text-slate-400">Not Linked</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 3. PAYMENTS */}
        <section className="mb-6">
          <button
            onClick={() => toggleSection('payments')}
            className="w-full p-4 flex items-center justify-between font-extrabold text-base text-slate-900 border-b border-slate-200"
          >
            <div className="flex items-center space-x-3">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span>Payments</span>
            </div>
            {openSections['payments'] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          {openSections['payments'] && (
            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase">Wallet Balance</p>
                  <p className="text-2xl font-extrabold text-slate-900">${(user?.wallet_balance || 0).toFixed(2)} USD</p>
                </div>
                <button
                  onClick={() => handleAction('Top-Up Balance')}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl"
                >
                  Top-Up Options
                </button>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-900 text-sm">Add Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleAction('Debit Card')} className="p-2.5 bg-slate-50 rounded-xl font-semibold border">
                    Debit Card
                  </button>
                  <button onClick={() => handleAction('Credit Card')} className="p-2.5 bg-slate-50 rounded-xl font-semibold border">
                    Credit Card
                  </button>
                  <button onClick={() => handleAction('Mobile Wallet')} className="p-2.5 bg-slate-50 rounded-xl font-semibold border">
                    Mobile Wallet
                  </button>
                  <button onClick={() => handleAction('Carrier Billing')} className="p-2.5 bg-slate-50 rounded-xl font-semibold border">
                    Carrier Billing
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="font-bold text-slate-900 text-sm">Prepaid Time</p>
                <div className="flex justify-between items-center">
                  <span>Redeem Code</span>
                  <button onClick={() => handleAction('Redeem Code')} className="text-indigo-600 font-bold hover:underline">
                    Redeem
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span>Purchase Time Balance</span>
                  <span className="font-bold text-slate-700">48 Hours Remaining</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 4. STREAMING */}
        <section className="mb-6">
          <button
            onClick={() => toggleSection('streaming')}
            className="w-full p-4 flex items-center justify-between font-extrabold text-base text-slate-900 border-b border-slate-200"
          >
            <div className="flex items-center space-x-3">
              <Tv className="w-5 h-5 text-indigo-600" />
              <span>Streaming</span>
            </div>
            {openSections['streaming'] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          {openSections['streaming'] && (
            <div className="p-5 space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold">Quality</span>
                <select
                  value={streamQuality}
                  onChange={(e) => setStreamQuality(e.target.value)}
                  className="px-3 py-1 bg-slate-100 border rounded-lg text-xs"
                >
                  <option value="Auto">Auto</option>
                  <option value="Low">Low (480p)</option>
                  <option value="Medium">Medium (720p)</option>
                  <option value="High">High (1080p)</option>
                  <option value="Ultra">Ultra (4K)</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-bold">Region</span>
                <select
                  value={streamRegion}
                  onChange={(e) => setStreamRegion(e.target.value)}
                  className="px-3 py-1 bg-slate-100 border rounded-lg text-xs"
                >
                  <option value="Auto (US East)">Auto (US East)</option>
                  <option value="US West">US West</option>
                  <option value="EU Central">EU Central</option>
                  <option value="Asia Pacific">Asia Pacific</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-bold">Bandwidth Limit</span>
                <select
                  value={bandwidthLimit}
                  onChange={(e) => setBandwidthLimit(e.target.value)}
                  className="px-3 py-1 bg-slate-100 border rounded-lg text-xs"
                >
                  <option value="Unlimited">Unlimited</option>
                  <option value="5 Mbps">5 Mbps</option>
                  <option value="10 Mbps">10 Mbps</option>
                  <option value="20 Mbps">20 Mbps</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* 5. DANGER ZONE */}
        <section className="py-5 space-y-4">
          <div className="flex items-center space-x-2 text-rose-600 font-extrabold text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>Danger Zone</span>
          </div>

          <p className="text-xs text-slate-600">
            Permanently remove your account, cloud save files, and Garexcell SSO profile data.
          </p>

          <button
            onClick={() => {
              if (confirm('Warning: Deleting your account is irreversible. Proceed?')) {
                logout();
                navigate('/');
              }
            }}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            Delete Account
          </button>
        </section>
      </main>

      {/* Dynamic Action Modal */}
      {modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-6 space-y-4 text-center">
            <h3 className="font-bold text-lg text-slate-900">{modalAction}</h3>
            <p className="text-xs text-slate-600">
              Settings Handler for <span className="font-semibold text-indigo-600">{modalAction}</span> is configured.
            </p>
            <button
              onClick={() => setModalAction(null)}
              className="w-full py-2 bg-indigo-600 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <BottomBar />
    </div>
  );
};
