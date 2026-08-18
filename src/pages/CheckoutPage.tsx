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
  const initialPlan = (routePlan || searchParams.get('plan') || 'premium').toLowerCase();

  // Determine pricing based on plan name
  const planDefaultAmounts: Record<string, string> = {
    essential: '5.99',
    premium: '20.99',
    diamond: '49.99'
  };
  const initialAmount = searchParams.get('amount') || planDefaultAmounts[initialPlan] || '20.99';

  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [selectedAmount, setSelectedAmount] = useState(initialAmount);

  const AVAILABLE_PLANS = [
    { id: 'essential', name: 'Essential', price: '5.99', badge: 'Starter', desc: 'Essential verified badge & community perks' },
    { id: 'premium', name: 'Premium', price: '20.99', badge: 'Popular', desc: 'Gold badge, unlimited AI, HD streaming' },
    { id: 'diamond', name: 'Diamond VIP', price: '49.99', badge: 'VIP', desc: 'Diamond badge & priority VIP access' }
  ];

  const handlePlanSelect = (planId: string, price: string) => {
    setSelectedPlan(planId);
    setSelectedAmount(price);
    setError(null);
  };

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
  const [canceled, setCanceled] = useState<boolean>(false);
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
            ? `Gift Garexcell Subscription [${selectedPlan.toUpperCase()}] to user @${giftUserObj?.username}`
            : `Garexcell Subscription Plan: ${selectedPlan.toUpperCase()}`;

          return actions.order.create({
            purchase_units: [{
              amount: {
                currency_code: 'USD',
                value: selectedAmount
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
                  subscription_plan: selectedPlan.toLowerCase(),
                  is_upgraded: true
                });

                // 2. Update recipient Supabase profile
                await supabase.from('profiles').update({
                  subscription_plan: selectedPlan.toLowerCase(),
                  is_upgraded: true
                }).eq('user_id', giftUserObj.id);

                // 3. Dispatch real-time system notification to the gifted user
                await addDoc(collection(db, 'notifications'), {
                  recipient_id: giftUserObj.id,
                  sender_id: user?.user_id || 'system',
                  sender_username: user?.username || 'Garexcell Sponsor',
                  type: 'gift',
                  title: 'Subscription Gifted!',
                  body: `@${user?.username || 'Someone'} has gifted you a subscription plan: ${selectedPlan.toUpperCase()}! All premium benefits are now active on your account.`,
                  created_at: new Date().toISOString(),
                  read: false
                });

              } else {
                // Personal Upgrade
                await updateProfile({
                  subscription_plan: selectedPlan.toLowerCase() as any,
                  is_upgraded: true
                });

                // Send self notification
                await addDoc(collection(db, 'notifications'), {
                  recipient_id: user?.user_id,
                  sender_id: 'system',
                  sender_username: 'playxcade_system',
                  type: 'system',
                  title: 'Subscription Upgraded!',
                  body: `Your account has been successfully upgraded to ${selectedPlan.toUpperCase()}! Thank you for supporting the platform.`,
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
          setCanceled(true);
          setError('Transaction was cancelled. You can retry paying using the PayPal controls below.');
        }
      }).render('#paypal-button-container');
    } catch (renderErr: any) {
      console.error("Error rendering PayPal buttons:", renderErr);
      setError('Could not initialize the PayPal checkout gateway.');
    }
  }, [sdkReady, selectedAmount, selectedPlan, success, canceled, isGift, giftUserObj, checkingUser, user, updateProfile]);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-slate-100 selection:text-slate-900">
      <div className="flex-1 flex flex-col">
        <div className="p-6">
          <IOSBackButton onClick={() => navigate(-1)} label="" />
        </div>

        <div className="w-full max-w-lg mx-auto flex-1 flex flex-col">
          <div className="px-6 pb-8 text-center space-y-4">
            {isGift ? (
              <Gift className="w-12 h-12 mx-auto text-slate-900" />
            ) : (
              <ShieldCheck className="w-12 h-12 mx-auto text-slate-900" />
            )}
            <div>
              <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">
                {isGift ? 'Gift Subscription' : 'Checkout'}
              </h1>
              <p className="text-sm text-slate-600 font-medium">
                {isGift ? 'Surprise another member with a premium plan!' : 'Complete your subscription securely.'}
              </p>
            </div>
          </div>

          <div className="px-6 pb-12 space-y-8 flex-1">
            {success ? (
              <div className="text-center space-y-6 animate-fade-in flex flex-col justify-center h-full">
                <div className="w-20 h-20 bg-slate-50 flex items-center justify-center mx-auto border-2 border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-slate-900" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment Approved!</h2>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    {isGift ? (
                      <span>
                        You have successfully gifted the <strong className="text-slate-900 uppercase">{selectedPlan}</strong> plan to <strong className="text-slate-900">@{giftUsername}</strong>. They have been upgraded and notified immediately!
                      </span>
                    ) : (
                      <span>
                        Your account has been successfully upgraded to <strong className="text-slate-900 uppercase">{selectedPlan}</strong>. All premium benefits are now active.
                      </span>
                    )}
                  </p>
                </div>

                <div className="bg-slate-50 border-2 border-slate-200 p-6 text-left space-y-3 text-sm font-bold">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order ID</span>
                    <span className="text-slate-900 font-mono text-xs">{orderDetails?.id || 'N/A'}</span>
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
                    <span className="text-slate-900 truncate ml-4 text-right">{orderDetails?.payer?.email_address || 'N/A'}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full py-4 bg-slate-900 text-white font-bold text-sm uppercase tracking-wider hover:bg-slate-800 transition rounded-none"
                  >
                    Return to Settings
                  </button>
                </div>
              </div>
            ) : canceled ? (
              <div className="text-center space-y-6 animate-fade-in flex flex-col justify-center h-full">
                <div className="w-20 h-20 bg-rose-50 flex items-center justify-center mx-auto border-2 border-rose-200">
                  <XCircle className="w-10 h-10 text-rose-600" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment Canceled</h2>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    Your checkout process was canceled. No charges were made to your account. Would you like to try again?
                  </p>
                </div>
                <div className="space-y-3 pt-4">
                  <button
                    onClick={() => setCanceled(false)}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wide transition-all shadow-md active:scale-95 uppercase text-sm"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate(-1)}
                    className="w-full py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-bold tracking-wide transition-all uppercase text-sm"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Gifting Recipient Form */}
                {isGift && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Recipient Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={giftUsername}
                        onChange={(e) => setGiftUsername(e.target.value)}
                        placeholder="Enter Garexcell username..."
                        className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 text-sm font-bold focus:outline-none focus:border-slate-900 transition text-slate-900 rounded-none"
                      />
                      {checkingUser && (
                        <div className="absolute right-4 top-4">
                          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                        </div>
                      )}
                    </div>

                    {giftUserObj ? (
                      <div className="flex items-center space-x-2 text-slate-900 text-sm font-bold">
                        <UserCheck className="w-5 h-5" />
                        <span>Recipient @{giftUserObj.username} verified!</span>
                      </div>
                    ) : userSearchError ? (
                      <div className="flex items-start space-x-2 text-rose-600 text-sm font-bold leading-relaxed">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{userSearchError}</span>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-2 text-slate-500 text-sm font-bold leading-relaxed">
                        <HelpCircle className="w-5 h-5 shrink-0" />
                        <span>Enter the recipient's username to verify their account before paying.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Select Subscription Plan */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Select Plan
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {AVAILABLE_PLANS.map((p) => {
                      const isSelected = selectedPlan === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handlePlanSelect(p.id, p.price)}
                          className={`p-3.5 text-left border-2 transition flex flex-col justify-between space-y-2 rounded-none ${
                            isSelected
                              ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-extrabold text-xs uppercase tracking-wider">{p.name}</span>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.5 uppercase tracking-widest ${
                                  isSelected ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-800'
                                }`}
                              >
                                {p.badge}
                              </span>
                            </div>
                            <p className={`text-[10px] line-clamp-2 leading-tight ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                              {p.desc}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-slate-300/20 flex items-baseline justify-between">
                            <span className="font-black text-sm">${p.price}</span>
                            <span className={`text-[10px] font-bold ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>/ mo</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center p-4 bg-slate-50 border-2 border-slate-200">
                    <span className="font-bold text-slate-500 text-sm">Selected Plan</span>
                    <span className="font-black text-slate-900 uppercase tracking-wider text-sm">{selectedPlan}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 border-2 border-slate-200">
                    <span className="font-bold text-slate-500 text-sm">Total Amount</span>
                    <span className="font-black text-slate-900 text-xl">${selectedAmount} <span className="text-xs text-slate-500">USD</span></span>
                  </div>
                  {token && (
                    <div className="flex justify-between items-center p-4 bg-slate-50 border-2 border-slate-900">
                      <span className="font-bold text-slate-900 text-sm flex items-center space-x-1">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Token Applied</span>
                      </span>
                      <span className="font-bold text-slate-900 text-xs truncate max-w-[100px]">{token}</span>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 border-2 border-rose-200 flex items-start space-x-3 text-rose-800 text-sm font-bold leading-relaxed">
                    <XCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-2">
                  {!sdkReady ? (
                    <div className="py-8 flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Establishing secure connection...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {loading && (
                        <div className="p-4 bg-slate-50 border-2 border-slate-200 flex items-center space-x-3 text-slate-900 text-sm font-bold">
                          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                          <span>Verifying your real-time payment approval...</span>
                        </div>
                      )}

                      {/* Require recipient verification for gifting before showing PayPal buttons */}
                      {isGift && !giftUserObj ? (
                        <div className="p-4 bg-amber-50 border-2 border-amber-200 flex items-start space-x-3 text-amber-900 text-sm font-bold leading-relaxed">
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          <span>Please verify a valid recipient username above to unlock checkout.</span>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border-2 border-slate-200 p-4">
                          <div id="paypal-button-container" className="w-full relative z-0"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
