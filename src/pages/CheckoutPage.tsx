import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { IOSBackButton } from '../components/IOSBackButton';
import { ShieldCheck, CheckCircle2, Loader2, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

declare global {
  interface Window {
    paypal?: any;
  }
}

export const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { token } = useParams<{ token?: string }>();
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const plan = searchParams.get('plan') || 'premium';
  const amount = searchParams.get('amount') || '20.99';

  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    // If PayPal is already loaded, update status immediately
    if (window.paypal) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement('script');
    // Read user client ID from environment or fall back to PayPal Sandbox key
    const clientId = (import.meta as any).env.VITE_PAYPAL_CLIENT_ID || 'sb';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&components=buttons`;
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      setSdkReady(true);
    };
    script.onerror = () => {
      setError('Could not establish connection to secure PayPal API.');
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!sdkReady || !window.paypal || success) return;

    const container = document.getElementById('paypal-button-container');
    if (container) {
      container.innerHTML = '';
    }

    try {
      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal'
        },
        createOrder: (data: any, actions: any) => {
          setError(null);
          return actions.order.create({
            purchase_units: [{
              amount: {
                currency_code: 'USD',
                value: amount
              },
              description: `Garexcell Subscription Plan: ${plan.toUpperCase()}`
            }]
          });
        },
        onApprove: async (data: any, actions: any) => {
          setLoading(true);
          try {
            // Real capture from PayPal servers
            const details = await actions.order.capture();
            
            if (details.status === 'COMPLETED') {
              // Real update to Firestore & Supabase - absolutely no mock simulation
              await updateProfile({
                subscription_plan: plan.toLowerCase(),
                is_upgraded: true
              });
              setOrderDetails(details);
              setSuccess(true);
            } else {
              setError(`Transaction completed with status: ${details.status}. Subscription could not be finalized.`);
            }
          } catch (err: any) {
            console.error("PayPal Capture Error:", err);
            setError(err.message || 'Error executing and verifying your subscription payment .');
          } finally {
            setLoading(false);
          }
        },
        onError: (err: any) => {
          console.error("PayPal SDK Error:", err);
          setError('A secure communication error occurred . Please check your card balance or try a different payment method.');
        },
        onCancel: (data: any) => {
          setError('Transaction was cancelled. You can retry paying using the link below.');
        }
      }).render('#paypal-button-container');
    } catch (renderErr: any) {
      console.error("Error rendering PayPal buttons:", renderErr);
      setError('Could not initialize the checkout gateway.');
    }
  }, [sdkReady, amount, plan, success, updateProfile]);

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
            {success ? (
              <div className="text-center space-y-5 py-4 animate-fade-in">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-slate-900">Payment Approved!</h2>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Your account has been successfully upgraded to <strong className="text-indigo-600 uppercase">{plan}</strong>. All premium benefits are now active.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order ID</span>
                    <span className="text-slate-900 font-mono text-[11px]">{orderDetails?.id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payer Name</span>
                    <span className="text-slate-900">{orderDetails?.payer?.name?.given_name || ''} {orderDetails?.payer?.name?.surname || ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payer Email</span>
                    <span className="text-slate-900">{orderDetails?.payer?.email_address || 'N/A'}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/settings')}
                  className="w-full py-3.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition shadow-md"
                >
                  Return to Account Settings
                </button>
              </div>
            ) : (
              <>
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
                      <span className="font-bold text-emerald-700 text-sm flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Token Applied</span>
                      </span>
                      <span className="font-bold text-emerald-900 text-xs truncate max-w-[100px]">{token}</span>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-3 text-rose-800 text-xs font-semibold leading-relaxed">
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-2">
                  {!sdkReady ? (
                    <div className="py-6 flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Establishing secure connection...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {loading && (
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center space-x-3 text-indigo-900 text-xs font-bold">
                          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                          <span>Verifying your  payment status ...</span>
                        </div>
                      )}
                      
                      <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/60 p-4">
                        <div id="paypal-button-container" className="w-full"></div>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-center text-xs text-slate-400 font-semibold flex items-center justify-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span> PayPal Gateway.  Sandbox Disabled .</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

