import React, { useState } from 'react';
import { Shield, FileText, Scale, AlertTriangle, Lock, HelpCircle, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { IOSBackButton } from '../components/IOSBackButton';

export const TOSPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('all');

  const sections = [
    { id: 'sec-1', title: '1. Acceptance & Agreement' },
    { id: 'sec-2', title: '2. Account Registration & Reserved Handles' },
    { id: 'sec-3', title: '3. Community Conduct & Prohibited Behavior' },
    { id: 'sec-4', title: '4. User Content & Intellectual Property' },
    { id: 'sec-5', title: '5. Virtual Currency & Wallet Balance' },
    { id: 'sec-6', title: '6. Account Enforcement & Suspension' },
    { id: 'sec-7', title: '7. Appeals & Identity Verification' },
    { id: 'sec-8', title: '8. Privacy & Data Handling' },
    { id: 'sec-9', title: '9. Limitation of Liability & Disclaimers' },
    { id: 'sec-10', title: '10. Termination & Modifications' },
    { id: 'sec-11', title: '11. Governing Law & Contact' }
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Header */}
      <header className="p-4 border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <IOSBackButton onClick={() => navigate(-1)} label="Back to Playxcade" />
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span className="font-extrabold text-sm text-slate-900">Playxcade Legal Framework</span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-[11px] font-bold">
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            <span>Official Legal Documentation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Terms of Service & User Agreement</h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Please read these Terms of Service carefully before using Playxcade. By creating an account or using our platform, you agree to comply with all terms and community rules outlined herein.
          </p>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Effective Date: July 2026</span>
            </span>
            <span className="flex items-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Version 2.4 (Garexcell Ecosystem)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Table of Contents Sidebar */}
        <aside className="md:col-span-1 hidden md:block">
          <div className="sticky top-24 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Quick Navigation</p>
            <nav className="space-y-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition truncate block ${
                    activeSection === s.id
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content Body */}
        <article className="md:col-span-3 space-y-8 text-slate-700 text-xs leading-relaxed">
          
          {/* Section 1 */}
          <section id="sec-1" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-indigo-600">
              <FileText className="w-5 h-5" />
              <h2 className="font-extrabold text-sm text-slate-900">1. Acceptance & Binding Agreement</h2>
            </div>
            <p>
              Welcome to Playxcade, operated by Garexcell. By accessing, registering for, or using our web applications, interactive social gaming tools, wallet systems, messaging features, or affiliated services (collectively, the &quot;Platform&quot;), you confirm that you have read, understood, and agree to be bound by these Terms of Service (&quot;Terms&quot;).
            </p>
            <p>
              If you do not agree to all of the terms and conditions contained herein, you are expressly prohibited from using the Platform and must immediately discontinue use.
            </p>
          </section>

          {/* Section 2 */}
          <section id="sec-2" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-indigo-600">
              <Lock className="w-5 h-5" />
              <h2 className="font-extrabold text-sm text-slate-900">2. Account Registration, Handles & Reserved Username Policy</h2>
            </div>
            <p>
              To access core features on Playxcade, including creating posts, initiating direct chat conversations, and managing wallet transactions, you must register a unique account.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong className="text-slate-900">Account Accuracy:</strong> You agree to provide accurate, current, and complete registration information and maintain its prompt update.
              </li>
              <li>
                <strong className="text-slate-900">Reserved & Restricted Handles:</strong> Certain system and staff usernames (including but not limited to <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">support</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">login</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">profile</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">admin</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">official</code>, and <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">garexcell</code>) are strictly reserved. Impersonation of official Garexcell staff members or system representatives is forbidden.
              </li>
              <li>
                <strong className="text-slate-900">Domain Exception:</strong> Registration of designated reserved handles is permitted exclusively for verified email accounts ending in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">@garexcell.com</code>.
              </li>
              <li>
                <strong className="text-slate-900">Credential Security:</strong> You are solely responsible for safeguarding your login credentials and for all activities that occur under your account.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="sec-3" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-indigo-600">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="font-extrabold text-sm text-slate-900">3. Community Conduct & Prohibited Acts</h2>
            </div>
            <p>
              Playxcade maintains a high standard of respect, fair play, and safety across all community feeds, direct messages, and comments. You agree NOT to engage in any of the following prohibited activities:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <p className="font-bold text-slate-900 text-[11px]">Hate Speech & Harassment</p>
                <p className="text-slate-500 text-[11px]">Posting content that attacks, intimidates, or harasses individuals or protected groups.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <p className="font-bold text-slate-900 text-[11px]">Cheats & Exploits</p>
                <p className="text-slate-500 text-[11px]">Distributing unauthorized game hacks, bot scripts, or exploiting wallet balances.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <p className="font-bold text-slate-900 text-[11px]">Spam & Unauthorized Ads</p>
                <p className="text-slate-500 text-[11px]">Flooding feeds or private messaging channels with promotional links or repetitive text.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <p className="font-bold text-slate-900 text-[11px]">Malicious Impersonation</p>
                <p className="text-slate-500 text-[11px]">Attempting to deceive users by posing as moderators, administrators, or staff.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="sec-4" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-indigo-600">
              <Scale className="w-5 h-5" />
              <h2 className="font-extrabold text-sm text-slate-900">4. User Content & Intellectual Property Rights</h2>
            </div>
            <p>
              You retain ownership of the original text, images, video clips, and media captions you submit or transmit through Playxcade (&quot;User Content&quot;).
            </p>
            <p>
              By posting User Content, you grant Playxcade a worldwide, non-exclusive, royalty-free license to host, display, reproduce, and distribute such content solely for operating, promoting, and improving the Platform services. You represent and warrant that you own or possess the necessary rights and consents to post all media shared on your profile.
            </p>
          </section>

          {/* Section 5 */}
          <section id="sec-5" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-indigo-600">
              <Shield className="w-5 h-5" />
              <h2 className="font-extrabold text-sm text-slate-900">5. Virtual Currency, Wallet Balance & Transactions</h2>
            </div>
            <p>
              Playxcade provides integrated digital wallet functionality for gaming rewards, micro-transactions, and community tipping (&quot;Wallet Balance&quot;).
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Wallet balances represent virtual utility credits and do not constitute legal tender or bank deposits.</li>
              <li>Unauthorized manipulation of wallet state, fraudulent balance generation, or exploitation of reward algorithms will result in immediate forfeiture of funds and permanent account termination.</li>
              <li>Transactions performed between users on the platform are final once processed by the state database.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="sec-6" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-indigo-600">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="font-extrabold text-sm text-slate-900">6. Account Enforcement, Limitation & Suspension</h2>
            </div>
            <p>
              Playxcade enforces automated and human moderation protocols to protect the ecosystem. Violations may result in one or more enforcement actions:
            </p>
            <div className="space-y-2 pt-1">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <span className="font-bold">Temporary Account Restriction (Limited Status):</span> Accounts flagged for minor violations may be placed in a limited state (e.g. 8-hour posting and social interaction restriction).
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                <span className="font-bold">Full Account Suspension (Banned Status):</span> Severe or repeated infractions lead to complete account suspension and lockout from social feeds and messaging networks.
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section id="sec-7" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-indigo-600">
              <CheckCircle className="w-5 h-5" />
              <h2 className="font-extrabold text-sm text-slate-900">7. Appeals Process & Identity Verification</h2>
            </div>
            <p>
              Users who believe their account was mistakenly suspended or restricted may submit a formal appeal through the dedicated <strong className="text-slate-900">Appeal Center</strong>.
            </p>
            <p>
              Appeals require submitting justification details and may involve an Identity Verification step (governed by our moderation review team). Playxcade reserves final discretion in evaluating appeals and determining account reinstatement.
            </p>
          </section>

          {/* Section 8 */}
          <section id="sec-8" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-indigo-600">
              <Lock className="w-5 h-5" />
              <h2 className="font-extrabold text-sm text-slate-900">8. Privacy & Data Handling</h2>
            </div>
            <p>
              Your privacy is fundamental to us. Playxcade processes personal data, including email addresses, profile avatars, and social interactions, strictly in accordance with modern security protocols and database row-level security (RLS). We do not sell your personal data to third-party data brokers.
            </p>
          </section>

          {/* Section 9 */}
          <section id="sec-9" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-indigo-600">
              <Scale className="w-5 h-5" />
              <h2 className="font-extrabold text-sm text-slate-900">9. Limitation of Liability & Disclaimers</h2>
            </div>
            <p>
              THE PLATFORM IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PLAYXCADE AND GAREXCELL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE PLATFORM.
            </p>
          </section>

          {/* Section 10 */}
          <section id="sec-10" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-indigo-600">
              <Clock className="w-5 h-5" />
              <h2 className="font-extrabold text-sm text-slate-900">10. Modifications to Terms & Platform Updates</h2>
            </div>
            <p>
              Playxcade reserves the right to modify or update these Terms at any time. Notice of significant amendments will be published on this page with an updated effective date. Continued use of Playxcade following modifications constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* Section 11 */}
          <section id="sec-11" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-indigo-600">
              <HelpCircle className="w-5 h-5" />
              <h2 className="font-extrabold text-sm text-slate-900">11. Governing Law & Contact Information</h2>
            </div>
            <p>
              These Terms shall be governed by and construed in accordance with applicable governing laws. If you have any questions, concerns, or legal inquiries regarding these Terms of Service, please reach out to our team:
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono text-[11px] text-slate-800">
              <p>Playxcade Legal Team / Garexcell Support</p>
              <p>Email: legal@garexcell.com</p>
              <p>Help Center: Garexcell Platform Support Desk</p>
            </div>
          </section>

        </article>
      </main>

      <Footer />
    </div>
  );
};

