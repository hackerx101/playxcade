import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { IOSBackButton } from '../components/IOSBackButton';

export const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const plan = searchParams.get('plan');
  const amount = searchParams.get('amount');

  const handlePay = () => {
    // Redirect to real PayPal
    window.location.href = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=payments@garexcell.com&amount=${amount}&currency_code=USD&item_name=Plan:${plan}`;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 font-sans">
      <div className="max-w-xl mx-auto px-4 py-8">
        <IOSBackButton onClick={() => navigate(-1)} label="Back" />
        
        <div className="mt-8 p-8 border border-slate-200 rounded-3xl shadow-sm space-y-6">
          <h1 className="text-2xl font-bold">Checkout</h1>
          <div className="space-y-4">
            <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
              <span className="font-medium text-slate-500">Plan:</span>
              <span className="font-bold uppercase">{plan}</span>
            </div>
            <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
              <span className="font-medium text-slate-500">Total:</span>
              <span className="font-bold text-xl">${amount}</span>
            </div>
          </div>
          
          <button
            onClick={handlePay}
            className="w-full py-4 bg-black text-white font-bold rounded-2xl hover:bg-slate-800 transition"
          >
            Pay Now with PayPal
          </button>
        </div>
      </div>
    </div>
  );
};
