import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams, useLocation } from 'react-router-dom';
import { IOSBackButton } from '../components/IOSBackButton';
import { ShieldCheck, CheckCircle2, Loader2, XCircle, AlertCircle, Sparkles, Gift, UserCheck, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { supabase } from '../lib/supabase';

declare global {
  interface Window {
    paypal?: any;
  }
}

export const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { token } = useParams<{ token?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateProfile } = useAuth();

  // Detect if this is a gift subscription flow
  const isGift = location.pathname.startsWith('/gift');

  // Extract subscription plan from path (e.g., /gift/:plan) or query params
  const { plan: routePlan } = useParams<{ plan?: string }>();
  const plan = (routePlan || searchParams.get('plan') || 'premium').toLowerCase();

  // Determine pricing based on plan name
  const planDefaultAmounts: Record<string, string> = {
    essential: '5.99',
    premium: '20.99',
    diamond: '49.99'
  };
  const amount = searchParams.get('amount') || planDefaultAmounts[plan] || '20.99';

  // Gift recipient state
  const [giftUsername, setGiftUsername] = useState(() => {
    let u = searchParams.get('username') || '';
    if (!u) {
      // Robust custom parser for queries like /gift/plan/?username/amount=/
      const match = window.location.search.match(/username=([^&]+)/i);
      if (match) u = decodeURIComponent(match[1]);
    }
    return u;
  });

  const [giftUserObj, setGiftUserObj] = useState<any>(null);
  const [checkingUser, setCheckingUser] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);

  // Verification states
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Debounced recipient user check in Firestore
  useEffect(() => {
    if (!isGift || !giftUsername.trim()) {
      setGiftUserObj(null);
      setUserSearchError(null);
      return;
    }

    setCheckingUser(true);
    setUserSearchError(null);

    const verifyRecipient = async () => {
      try {
        const q = query(collection(db, 'profiles'), where('username', '==', giftUsername.trim()));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const data = docSnap.data();
          setGiftUserObj({ id: docSnap.id, ...data });
          setUserSearchError(null);
        } else {
          setGiftUserObj(null);
          setUserSearchError(`User "${giftUsername}" does not exist in our database. Please check spelling.`);
        }
      } catch (err) {
        console.error("Error searching recipient profile:", err);
        setUserSearchError("Connection issue. Could not verify recipient user.");
      } finally {
        setCheckingUser(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      verifyRecipient();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [giftUsername, isGift]);

  // Load live PayPal client SDK
  useEffect(() => {
    if (window.paypal) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement('script');
    // Live PayPal Client ID fallback as provided by user
    const liveClientId = 'BAAgm7WLypmZjV4ZaGanVBrbH_58rx2_v67yaCz9AdeXZoH54JWIY3lOqKHYYBUrA_BcDRnL8Xd217aX80';
    const clientId = (import.meta as any).env.VITE_PAYPAL_CLIENT_ID || liveClientId;

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

  // Initialize PayPal Buttons
  useEffect(() => {
    if (!sdkReady || !window.paypal || success) return;

    // Check if we are waiting on a recipient validation for a gift
    if (isGift && (!giftUserObj || checkingUser)) {
      return; // Do not render or allow buttons until user is fully verified
    }

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
          const paymentDescription = isGift
            ? `Gift Garexcell Subscription [${plan.toUpperCase()}] to user @${giftUserObj?.username}`
            : `Garexcell Subscription Plan: ${plan.toUpperCase()}`;

          return actions.order.create({
            purchase_units: [{
              amount: {
                currency_code: 'USD',
                value: amount
              },
              description: paymentDescription
            }]
          });
        },
        onApprove: async (data: any, actions: any) => {
          setLoading(true);
          try {
            const details = await actions.order.capture();

            if (details.status === 'COMPLETED') {
              if (isGift) {
                if (!giftUserObj) {
                  throw new Error("Recipient profile could not be verified at capture time.");
                }

                // 1. Update recipient Firestore profile
                await updateDoc(doc(db, 'profiles', giftUserObj.id), {
                  subscription_plan: plan.toLowerCase(),
                  is_upgraded: true
                });

                // 2. Update recipient Supabase profile
                await supabase.from('profiles').update({
                  subscription_plan: plan.toLowerCase(),
                  is_upgraded: true
                }).eq('user_id', giftUserObj.id);

                // 3. Dispatch real-time system notification to the gifted user
                await addDoc(collection(db, 'notifications'), {
                  recipient_id: giftUserObj.id,
                  sender_id: user?.user_id || 'system',
                  sender_username: user?.username || 'Garexcell Sponsor',
                  type: 'gift',
                  title: 'Subscription Gifted!',
                  body: `🎉 @${user?.username || 'Someone'} has gifted you a subscription plan: ${plan.toUpperCase()}! All premium benefits are now active on your account.`,
                  created_at: new Date().toISOString(),
                  read: false
                });

              } else {
                // Personal Upgrade
                await updateProfile({
                  subscription_plan: plan.toLowerCase() as any,
                  is_upgraded: true
                });

                // Send self notification
                await addDoc(collection(db, 'notifications'), {
                  recipient_id: user?.user_id,
                  sender_id: 'system',
                  sender_username: 'playxcade_system',
                  type: 'system',
                  title: 'Subscription Upgraded!',
                  body: `🎉 Your account has been successfully upgraded to ${plan.toUpperCase()}! Thank you for supporting Garexcell.`,
                  created_at: new Date().toISOString(),
                  read: false
                });
              }

              setOrderDetails(details);
              setSuccess(true);
            } else {
              setError(`Transaction completed with status: ${details.status}. Subscription could not be finalized.`);
            }
          } catch (err: any) {
            console.error("PayPal Capture Error:", err);
            setError(err.message || 'Error executing and verifying your subscription payment with PayPal.');
          } finally {
            setLoading(false);
          }
        },
        onError: (err: any) => {
          console.error("PayPal SDK Error:", err);
          setError('A secure communication error occurred with PayPal. Please check your account or try a different payment card.');
        },
        onCancel: (data: any) => {
          setError('Transaction was cancelled. You can retry paying using the PayPal controls below.');
        }
      }).render('#paypal-button-container');
    } catch (renderErr: any) {
      console.error("Error rendering PayPal buttons:", renderErr);
      setError('Could not initialize the PayPal checkout gateway.');
    }
  }, [sdkReady, amount, plan, success, isGift, giftUserObj, checkingUser, user, updateProfile]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-md mx-auto px-4 py-8">
        <IOSBackButton onClick={() => navigate(-1)} label="Back" />

        <div className="mt-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="bg-slate-900 px-8 py-10 text-center text-white relative overflow-hidden">
            <div className="relative z-10">
              {isGift ? (
                <Gift className="w-12 h-12 mx-auto mb-4 text-pink-400 animate-bounce" />
              ) : (
                <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
              )}
              <h1 className="text-3xl font-black mb-2 tracking-tight">
                {isGift ? 'Gift Subscription' : 'Checkout'}
              </h1>
              <p className="text-sm text-slate-300 font-medium">
                {isGift ? 'Surprise another member with a premium plan!' : 'Complete your subscription securely.'}
              </p>
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
                    {isGift ? (
                      <span>
                        You have successfully gifted the <strong className="text-indigo-600 uppercase">{plan}</strong> plan to <strong className="text-slate-900">@{giftUsername}</strong>. They have been upgraded and notified immediately!
                      </span>
                    ) : (
                      <span>
                        Your account has been successfully upgraded to <strong className="text-indigo-600 uppercase">{plan}</strong>. All premium benefits are now active.
                      </span>
                    )}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order ID</span>
                    <span className="text-slate-900 font-mono text-[11px]">{orderDetails?.id || 'N/A'}</span>
                  </div>
                  {isGift && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Recipient</span>
                      <span className="text-slate-900">@{giftUsername}</span>
                    </div>
                  )}
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
                {/* Gifting Recipient Form */}
                {isGift && (
                  <div className="space-y-3 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                    <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      Recipient Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={giftUsername}
                        onChange={(e) => setGiftUsername(e.target.value)}
                        placeholder="Enter Garexcell username..."
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-slate-900"
                      />
                      {checkingUser && (
                        <div className="absolute right-3 top-3.5">
                          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                        </div>
                      )}
                    </div>

                    {giftUserObj ? (
                      <div className="flex items-center space-x-2 text-emerald-700 text-xs font-semibold">
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                        <span>Recipient @{giftUserObj.username} verified!</span>
                      </div>
                    ) : userSearchError ? (
                      <div className="flex items-start space-x-2 text-rose-600 text-xs font-semibold leading-relaxed">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{userSearchError}</span>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-2 text-slate-500 text-xs font-semibold leading-relaxed">
                        <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>Enter the recipient's username to verify their account before paying.</span>
                      </div>
                    )}
                  </div>
                )}

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
                          <span>Verifying your real-time payment approval with PayPal...</span>
                        </div>
                      )}

                      {/* Require recipient verification for gifting before showing PayPal buttons */}
                      {isGift && !giftUserObj ? (
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start space-x-3 text-amber-800 text-xs font-semibold leading-relaxed">
                          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                          <span>Please verify a valid username to unlock the payment checkout.</span>
                        </div>
                      ) : (
                        <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/60 p-4">
                          <div id="paypal-button-container" className="w-full"></div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="my-4 flex items-center justify-center space-x-3">
                    <div className="h-[1px] bg-slate-200 flex-1"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
                    <div className="h-[1px] bg-slate-200 flex-1"></div>
                  </div>

                  <button
                    onClick={async () => {
                      setLoading(true);
                      setError(null);
                      try {
                        if (isGift) {
                          if (!giftUserObj) {
                            throw new Error("Please enter and verify a recipient username before continuing.");
                          }
                          
                          // 1. Update Firestore recipient
                          await updateDoc(doc(db, 'profiles', giftUserObj.id), {
                            subscription_plan: plan.toLowerCase(),
                            is_upgraded: true
                          });

                          // 2. Update Supabase recipient
                          await supabase.from('profiles').update({
                            subscription_plan: plan.toLowerCase(),
                            is_upgraded: true
                          }).eq('user_id', giftUserObj.id);

                          // 3. Dispatch real-time system notification
                          await addDoc(collection(db, 'notifications'), {
                            recipient_id: giftUserObj.id,
                            sender_id: user?.user_id || 'system',
                            sender_username: user?.username || 'Garexcell Sponsor',
                            type: 'gift',
                            title: 'Subscription Gifted!',
                            body: `🎉 @${user?.username || 'Someone'} has gifted you a subscription plan: ${plan.toUpperCase()}! All premium benefits are now active on your account.`,
                            created_at: new Date().toISOString(),
                            read: false
                          });
                        } else {
                          // Self upgrade
                          await updateProfile({
                            subscription_plan: plan.toLowerCase() as any,
                            is_upgraded: true
                          });

                          // Send self notification
                          await addDoc(collection(db, 'notifications'), {
                            recipient_id: user?.user_id,
                            sender_id: 'system',
                            sender_username: 'playxcade_system',
                            type: 'system',
                            title: 'Subscription Upgraded!',
                            body: `🎉 Your account has been successfully upgraded to ${plan.toUpperCase()}! Thank you for supporting Garexcell.`,
                            created_at: new Date().toISOString(),
                            read: false
                          });
                        }

                        setOrderDetails({
                          id: `DEMO-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                          payer: {
                            name: { given_name: isGift ? giftUserObj.username : (user?.username || 'Garexcell'), surname: 'Member' },
                            email_address: isGift ? (giftUserObj.email || 'gift@garexcell.com') : (user?.email || 'member@garexcell.com')
                          }
                        });
                        setSuccess(true);
                      } catch (err: any) {
                        setError(err.message || 'Failed to complete sandbox upgrade.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition shadow-md flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Instant Sandbox Upgrade (1-Click)</span>
                  </button>
                </div>

                <p className="text-center text-xs text-slate-400 font-semibold flex items-center justify-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Real PayPal Gateway supported. Sandbox Bypass available.</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
