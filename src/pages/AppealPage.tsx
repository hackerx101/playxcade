import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { IOSBackButton } from '../components/IOSBackButton';

export const AppealPage: React.FC = () => {
  const { user, submitAppeal } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [explanation, setExplanation] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!fullName || !phone || !email) return;
      setStep(2);
      return;
    }

    if (!explanation) return;

    submitAppeal(explanation, {
      name: fullName,
      phone,
      email,
      dob: user?.dob || '',
    });
    navigate('/suspended');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col p-6 sm:p-12">
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center">
        <div className="flex items-center space-x-3 pb-8">
          {step === 1 ? (
            <IOSBackButton onClick={() => navigate(-1)} label="" />
          ) : (
            <button onClick={() => setStep(1)} className="flex items-center text-slate-900 font-bold hover:opacity-70 transition">
              <ArrowLeft className="w-5 h-5 mr-1" /> Back
            </button>
          )}
        </div>

        <div className="space-y-2 mb-8">
          <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center mb-6">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {step === 1 ? 'Appeal form' : 'Tell us what happened'}
          </h1>
          <p className="text-base text-slate-600 font-medium">
            {step === 1 ? 'Step 1 of 2: Contact Information' : 'Step 2 of 2: Explanation'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition rounded-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-0199"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition rounded-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition rounded-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm uppercase tracking-wider transition flex items-center justify-center space-x-2 rounded-none"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">Explanation</label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain why your account should be reinstated..."
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition h-40 resize-none rounded-none"
                  required
                />
                <p className="text-xs text-slate-500 mt-2 font-medium">Please provide as much context as possible so our Trust & Safety team can review your case effectively.</p>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm uppercase tracking-wider transition rounded-none"
              >
                Submit Appeal
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

