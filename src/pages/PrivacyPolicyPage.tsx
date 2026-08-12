import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar hideLinks={true} showLiveIcon={false} />
      <main className="flex-1 max-w-4xl mx-auto p-4 sm:p-8 space-y-10 my-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
        
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Last Updated: August 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-indigo-600">1. Information We Collect</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            When you interact with the Garexcell network and Playxcade, we collect information that you voluntarily provide to us, including your username, email address, password, date of birth, and any profile information (such as your bio and avatar). Additionally, when you engage with features like identity verification, we collect the necessary documentation such as a government-issued ID and a selfie. We also automatically collect data regarding your device, IP address, browsing actions, and usage patterns across our services via cookies, local storage, and similar technologies. This includes device fingerprinting techniques used to secure the platform and identify fraudulent, abusive, or automated (bot) activities.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-indigo-600">2. How We Use Your Information</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Your data is primarily used to provide, maintain, and improve the Playxcade platform. This includes authenticating your account, securing our network against brute-force attacks and abuse (e.g., through rate-limiting and device tracking), and personalizing your social feed. We also use your information to facilitate in-game purchases through Garexcell Pay, manage your cloud gaming sessions, and respond to customer support or appeal requests. Furthermore, usage metrics help us analyze trends and improve the overall performance and reliability of the Garexcell ecosystem.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-indigo-600">3. AI Processing & Limitations</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Playxcade integrates artificial intelligence (AI) to power certain features, including content moderation, automated customer support (Orion AI), and smart content generation. Please be aware that your interactions, chat inputs, and submitted media may be processed by AI algorithms to provide these services. <strong>Important Notice:</strong> While we strive for high accuracy, AI systems can make mistakes, hallucinate facts, or misinterpret context. You should not rely solely on AI-generated responses for critical, legal, financial, or medical advice. We continually monitor and update our AI models, but users should exercise their own judgment when interacting with AI-driven features on Playxcade.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-indigo-600">4. Data Sharing & Disclosure</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            We do not sell your personal data to third parties. We may share your information with trusted third-party service providers who assist us in operating our platform, conducting our business, or serving our users (for example, cloud hosting providers, payment processors, and automated email services like Resend). These providers are contractually obligated to keep your information confidential. We may also disclose your information when required by law, to enforce our site policies, or to protect our rights, property, or safety, or that of others.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-indigo-600">5. Security & Account Suspension</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            We implement a variety of security measures to maintain the safety of your personal information. This includes encrypted data transmission, secure data storage, rate-limiting on authentication endpoints, and strict device fingerprinting. If our automated systems detect suspicious activity (such as excessive failed login attempts or unusual bot-like behavior), your account may be temporarily or permanently suspended without prior notice to protect the network. If you believe your account was suspended in error, you may submit an appeal via the Trust & Safety portal.
          </p>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-indigo-600">6. Underage User Policy</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Playxcade and the Garexcell Network are designed for a mature gaming audience. We do not knowingly collect, maintain, or process personal data from children under the age of 13 (or under 16 in certain jurisdictions, as mandated by local laws like the GDPR or COPPA). If we discover that an account has been created by a minor below the required age threshold without verifiable parental consent, we will take immediate steps to permanently delete the account and securely purge all associated data. If you are a parent or guardian and believe your child has provided us with personal information, please contact our Trust & Safety team immediately.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-indigo-600">7. Your Rights & Choices</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Depending on your jurisdiction, you may have the right to access, correct, update, or delete your personal information. You can manage your account settings and profile details directly within the Playxcade app. If you wish to permanently delete your account or opt out of certain data processing activities, please contact our support team. Note that some data may be retained for legal, security, or anti-fraud purposes even after an account deletion request.
          </p>
        </section>

      </main>
      <Footer />
    </div>
  );
};
