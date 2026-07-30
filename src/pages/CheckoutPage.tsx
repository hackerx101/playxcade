import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CreditCard, Tag, ShieldCheck, Clock, ArrowLeft, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { BottomBar } from '../components/BottomBar';
import { useAuth } from '../context/AuthContext';

interface DraftOrder {
  paymentId: string;
  amount: number;
  createdAt: number; // timestamp
  expiresAt: number; // timestamp (24 hours)
  status: 'pending' | 'completed' | 'expired';
}

export const CheckoutPage: React.FC = () => {
  const { paymentId } = useParams<{ paymentId?: string }>();
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();

  const [activeMethod, setActiveMethod] = useState<'card' | 'voucher'>('card');
  const [amount, setAmount] = useState<number>(25);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  // Voucher form state
  const [voucherCode, setVoucherCode] = useState('');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [drafts, setDrafts] = useState<DraftOrder[]>([]);

  // Load or initialize drafts in localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('garexcell_draft_orders');
      let currentDrafts: DraftOrder[] = stored ? JSON.parse(stored) : [];

      // Clean up expired or add current if paymentId is new
      const now = Date.now();
      currentDrafts = currentDrafts.filter(d => now < d.expiresAt && d.status === 'pending');

      if (paymentId && paymentId !== 'new') {
        const existing = currentDrafts.find(d => d.paymentId === paymentId);
        if (!existing) {
          currentDrafts.unshift({
            paymentId,
            amount: 25,
            createdAt: now,
            expiresAt: now + 24 * 60 * 60 * 1000,
            status: 'pending'
          });
        }
      }

      localStorage.setItem('garexcell_draft_orders', JSON.stringify(currentDrafts));
      setDrafts(currentDrafts);
    } catch (e) {
      console.warn('Drafts load error:', e);
    }
  }, [paymentId]);

  // Handle card number formatting (#### #### #### ####)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.substring(i, i + 4));
    }
    setCardNumber(parts.join(' '));
  };

  // Luhn algorithm check
  const validateLuhn = (num: string): boolean => {
    const clean = num.replace(/\D/g, '');
    if (clean.length < 13 || clean.length > 19) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  // Prepaid card check
  const isPrepaidCard = (num: string): boolean => {
    const clean = num.replace(/\D/g, '');
    const prepaidBins = ['411111', '555555', '378282', '424242', '510510'];
    return prepaidBins.some(bin => clean.startsWith(bin));
  };

  // Official vouchers
  const OFFICIAL_VOUCHERS: Record<string, number> = {
    'GAREXCELL-25-VALID': 25,
    'PRO-VOUCHER-50': 50,
    'GAMESOURCE-10': 10,
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanCard = cardNumber.replace(/\D/g, '');

    if (isPrepaidCard(cleanCard)) {
      setError('Prepaid cards cannot be used. Please pay by Voucher.');
      return;
    }

    if (!validateLuhn(cleanCard)) {
      setError('Invalid card number. Please enter a valid credit/debit card.');
      return;
    }

    if (!expiry || !cvv || !cardHolder) {
      setError('Please fill in all card security details.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const newBal = (user?.wallet_balance || 0) + amount;
      updateProfile({ wallet_balance: newBal });

      // Mark draft as completed
      if (paymentId) {
        const updated = drafts.map(d => d.paymentId === paymentId ? { ...d, status: 'completed' as const } : d);
        setDrafts(updated);
        localStorage.setItem('garexcell_draft_orders', JSON.stringify(updated.filter(d => d.status === 'pending')));
      }

      setSuccess(`Successfully topped up $${amount}.00 USD via Card!`);
      setTimeout(() => navigate('/settings'), 2000);
    }, 1200);
  };

  const handleVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmed = voucherCode.trim().toUpperCase();
    const voucherValue = OFFICIAL_VOUCHERS[trimmed];

    if (!voucherValue) {
      setError('Invalid or expired official voucher code.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const newBal = (user?.wallet_balance || 0) + voucherValue;
      updateProfile({ wallet_balance: newBal });

      if (paymentId) {
        const updated = drafts.filter(d => d.paymentId !== paymentId);
        setDrafts(updated);
        localStorage.setItem('garexcell_draft_orders', JSON.stringify(updated));
      }

      setSuccess(`Voucher accepted! Successfully added $${voucherValue}.00 to wallet.`);
      setTimeout(() => navigate('/settings'), 2000);
    }, 1200);
  };

  const currentDraft = drafts.find(d => d.paymentId === paymentId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 sm:pb-12 font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar showLiveIcon={false} />

      <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center space-x-3 pb-2">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 bg-white hover:bg-slate-100 rounded-full text-slate-700 shadow-sm border border-slate-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Secure Checkout & Top-Up</h1>
            <p className="text-xs text-slate-500 font-mono">Payment ID: {paymentId || 'NEW_SESSION'}</p>
          </div>
        </div>

        {/* Error / Success Banners */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center space-x-2 shadow-sm animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center space-x-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Active Order Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Order Total</span>
              <p className="text-2xl font-bold text-slate-900">${amount}.00 USD</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-end space-x-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Expires in 24h</span>
              </span>
              <p className="text-xs font-mono text-slate-600">Secure 256-bit SSL</p>
            </div>
          </div>

          {/* Amount Selector */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {[10, 25, 50, 100].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt)}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  amount === amt
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Switcher */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setActiveMethod('card')}
            className={`py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 ${
              activeMethod === 'card' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay by Card</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMethod('voucher')}
            className={`py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 ${
              activeMethod === 'voucher' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Pay by Voucher</span>
          </button>
        </div>

        {/* Card Payment Form */}
        {activeMethod === 'card' ? (
          <form onSubmit={handleCardSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">Card Number (Luhn Verified)</label>
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="4532 •••• •••• ••••"
                maxLength={19}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="text-[10px] text-slate-400">Note: Prepaid cards are strictly blocked and require voucher payment.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">Expiry Date</label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">CVV Security</label>
                <input
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="123"
                  maxLength={4}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">Cardholder Full Name</label>
              <input
                type="text"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Validating & Processing...</span>
              ) : (
                <span>Pay ${amount}.00 USD securely</span>
              )}
            </button>
          </form>
        ) : (
          /* Voucher Payment Form */
          <form onSubmit={handleVoucherSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">Official Voucher Code</label>
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="e.g. GAREXCELL-25-VALID"
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="text-[10px] text-slate-500">
                Test codes available: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">GAREXCELL-25-VALID</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">PRO-VOUCHER-50</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Verifying Voucher...</span>
              ) : (
                <span>Redeem Voucher Code</span>
              )}
            </button>
          </form>
        )}

        {/* Draft Orders List (24-hour expiration) */}
        {drafts.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Pending Draft Orders (24h Expiry)</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">{drafts.length} active</span>
            </div>

            <div className="space-y-2">
              {drafts.map((d) => (
                <div key={d.paymentId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-mono font-bold text-slate-900">ID: {d.paymentId}</p>
                    <p className="text-[10px] text-slate-500">Amount: ${d.amount}.00 • Expires in ~23h</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/checkout/${d.paymentId}`)}
                      className="px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
                    >
                      Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = drafts.filter(item => item.paymentId !== d.paymentId);
                        setDrafts(updated);
                        localStorage.setItem('garexcell_draft_orders', JSON.stringify(updated));
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                      title="Delete draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <BottomBar />
    </div>
  );
};
