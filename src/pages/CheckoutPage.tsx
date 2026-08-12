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
                        You have successfully gifted the <strong className="text-slate-900 uppercase">{plan}</strong> plan to <strong className="text-slate-900">@{giftUsername}</strong>. They have been upgraded and notified immediately!
                      </span>
                    ) : (
                      <span>
                        Your account has been successfully upgraded to <strong className="text-slate-900 uppercase">{plan}</strong>. All premium benefits are now active.
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

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-50 border-2 border-slate-200">
                    <span className="font-bold text-slate-500 text-sm">Selected Plan</span>
                    <span className="font-black text-slate-900 uppercase tracking-wider text-sm">{plan}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 border-2 border-slate-200">
                    <span className="font-bold text-slate-500 text-sm">Total Amount</span>
                    <span className="font-black text-slate-900 text-xl">${amount} <span className="text-xs text-slate-500">USD</span></span>
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

                <div className="pt-4">
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
                          <span>Please verify a valid username to unlock checkout.</span>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border-2 border-slate-200 p-4">
                          <div id="paypal-button-container" className="w-full relative z-0"></div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="my-6 flex items-center justify-center space-x-4">
                    <div className="h-[2px] bg-slate-100 flex-1"></div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
                    <div className="h-[2px] bg-slate-100 flex-1"></div>
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
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm uppercase tracking-wider transition flex items-center justify-center space-x-2 rounded-none"
                  >
                    <Sparkles className="w-5 h-5 text-white" />
                    <span>Sandbox Bypass (1-Click)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
