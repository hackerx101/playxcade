import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { IOSBackButton } from '../components/IOSBackButton';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { token } = useParams<{ token?: string }>();
  const navigate = useNavigate();
  const plan = searchParams.get('plan') || 'premium';
  const amount = searchParams.get('amount') || '0.00';

  const [loading, setLoading] = useState(false);

  const handlePay = () => {
    setLoading(true);
    // Redirect to real PayPal
    window.location.href = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=payments@garexcell.com&amount=${amount}&currency_code=USD&item_name=Plan:${plan}${token ? `&custom=${token}` : ''}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-md mx-auto px-4 py-8">
        <IOSBackButton onClick={() => navigate(-1)} label="Back" />
        
        <div className="mt-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="bg-slate-900 px-8 py-10 text-center text-white relative overflow-hidden">
            <div className="relative z-10">
              <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
              <h1 className="text-3xl font-black mb-2 tracking-tight">Checkout</h1>
              <p className="text-sm text-slate-300 font-medium">Complete your subscription securely.</p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="font-bold text-slate-500 text-sm">Selected Plan</span>
                <span className="font-black text-slate-900 uppercase tracking-wider text-sm">{plan}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="font-bold text-slate-500 text-sm">Total Amount</span>
                <span className="font-black text-slate-900 text-xl">${amount} <span className="text-xs text-slate-400">USD</span></span>
              </div>
              {token && (
                <div className="flex justify-between items-center p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <span className="font-bold text-emerald-700 text-sm flex items-center space-x-1"><CheckCircle2 className="w-4 h-4" /> <span>Token Applied</span></span>
                  <span className="font-bold text-emerald-900 text-xs truncate max-w-[100px]">{token}</span>
                </div>
              )}
            </div>
            
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white font-black text-sm uppercase tracking-wider rounded-2xl hover:bg-indigo-700 active:scale-[0.98] transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Pay with PayPal'}
            </button>
            <p className="text-center text-xs text-slate-400 font-medium">Payments are securely processed by PayPal.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
