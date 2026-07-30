import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Tag, Clock, AlertCircle, CheckCircle2, Trash2, Wallet, QrCode, ArrowDownLeft, ArrowUpRight, Receipt, ShieldCheck } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { BottomBar } from '../components/BottomBar';
import { IOSBackButton } from '../components/IOSBackButton';
import { useAuth } from '../context/AuthContext';

interface DraftOrder {
  paymentId: string;
  amount: number;
  createdAt: number; // timestamp
  expiresAt: number; // timestamp (24 hours)
  status: 'pending' | 'completed' | 'expired';
}

interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  title: string;
  amount: number;
  date: string;
  method: string;
  status: 'completed' | 'pending' | 'failed';
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
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  // Default transactions fallback
  const INITIAL_TRANSACTIONS: WalletTransaction[] = [
    {
      id: 'tx_init_101',
      type: 'credit',
      title: 'Starter Wallet Credit',
      amount: 100,
      date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      method: 'System Welcome Bonus',
      status: 'completed'
    },
    {
      id: 'tx_init_100',
      type: 'credit',
      title: 'Identity Verification Bonus',
      amount: 15,
      date: 'Yesterday',
      method: 'Account Reward',
      status: 'completed'
    }
  ];

  // Load transactions and drafts from localStorage
  useEffect(() => {
    try {
      const storedTx = localStorage.getItem(`garexcell_wallet_tx_${user?.id || 'guest'}`);
      if (storedTx) {
        setTransactions(JSON.parse(storedTx));
      } else {
        setTransactions(INITIAL_TRANSACTIONS);
        localStorage.setItem(`garexcell_wallet_tx_${user?.id || 'guest'}`, JSON.stringify(INITIAL_TRANSACTIONS));
      }
    } catch (e) {
      setTransactions(INITIAL_TRANSACTIONS);
    }

    try {
      const stored = localStorage.getItem('garexcell_draft_orders');
      let currentDrafts: DraftOrder[] = stored ? JSON.parse(stored) : [];

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
  }, [paymentId, user?.id]);

  const addTransaction = (newTx: WalletTransaction) => {
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    try {
      localStorage.setItem(`garexcell_wallet_tx_${user?.id || 'guest'}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save transaction:', e);
    }
  };

  // Handle card number formatting (#### #### #### ####)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.substring(i, i + 4));
    }
    setCardNumber(parts.join(' '));
  };

  const validateCardNumber = (num: string): boolean => {
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

  const isPrepaidCard = (num: string): boolean => {
    const clean = num.replace(/\D/g, '');
    const prepaidBins = ['411111', '555555', '378282', '424242', '510510'];
    return prepaidBins.some(bin => clean.startsWith(bin));
  };

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

    if (!validateCardNumber(cleanCard)) {
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

      addTransaction({
        id: `tx_${Date.now()}`,
        type: 'credit',
        title: 'Card Top-Up',
        amount: amount,
        date: 'Just now',
        method: `Credit Card (••• ${cleanCard.slice(-4)})`,
        status: 'completed'
      });

      if (paymentId) {
        const updated = drafts.map(d => d.paymentId === paymentId ? { ...d, status: 'completed' as const } : d);
        setDrafts(updated);
        localStorage.setItem('garexcell_draft_orders', JSON.stringify(updated.filter(d => d.status === 'pending')));
      }

      setSuccess(`Successfully added $${amount}.00 USD to your wallet!`);
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setCardHolder('');
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

      addTransaction({
        id: `tx_${Date.now()}`,
        type: 'credit',
        title: 'Voucher Redemption',
        amount: voucherValue,
        date: 'Just now',
        method: `Code: ${trimmed}`,
        status: 'completed'
      });

      if (paymentId) {
        const updated = drafts.filter(d => d.paymentId !== paymentId);
        setDrafts(updated);
        localStorage.setItem('garexcell_draft_orders', JSON.stringify(updated));
      }

      setSuccess(`Voucher accepted! Added $${voucherValue}.00 to your wallet balance.`);
      setVoucherCode('');
    }, 1200);
  };

  const walletQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=playxcade:wallet:${encodeURIComponent(user?.username || 'user')}&color=4f46e5`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 sm:pb-12 font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar showLiveIcon={false} />

      <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center space-x-3 pb-2">
          <IOSBackButton onClick={() => navigate('/settings')} label="Settings" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Digital Wallet & Top-Up</h1>
            <p className="text-xs text-slate-500 font-mono">Account Balance & Payment Portal</p>
          </div>
        </div>

        {/* Wallet Balance & QR Code Header Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg border border-indigo-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between gap-4">
            {/* Left Balance Details */}
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Total Wallet Balance</span>
              </div>

              <div>
                <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  ${user?.wallet_balance || 0}.00 <span className="text-xs font-bold text-indigo-200 uppercase">USD</span>
                </p>
              </div>

              <div className="pt-1 flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-mono font-medium text-indigo-100 border border-white/20">
                  ID: WX-{(user?.id || '88392104').substring(0, 8)}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[11px] font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Active & Verified</span>
                </span>
              </div>
            </div>

            {/* Right QR Code */}
            <div className="bg-white p-2.5 rounded-xl shadow-md border border-indigo-200 shrink-0 text-center group">
              <img
                src={walletQrUrl}
                alt="Wallet QR Code"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-contain"
              />
              <p className="text-[10px] font-bold text-slate-600 mt-1 flex items-center justify-center space-x-1">
                <QrCode className="w-3 h-3 text-indigo-600" />
                <span>Scan to Pay</span>
              </p>
            </div>
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

        {/* Top-Up Amount Selection */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Select Top-Up Amount</span>
              <p className="text-2xl font-bold text-slate-900">${amount}.00 USD</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-end space-x-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Instant Deposit</span>
              </span>
              <p className="text-xs font-mono text-slate-600">Secure SSL Gateway</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
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
              <label className="block text-xs font-bold text-slate-700 uppercase">Card Number</label>
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

        {/* Recent Transactions List */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Transactions</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400 font-mono">{transactions.length} Records</span>
          </div>

          <div className="space-y-2.5">
            {transactions.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 font-medium">No recent transactions recorded yet.</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {tx.type === 'credit' ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{tx.title}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{tx.method} • {tx.date}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-xs font-extrabold font-mono ${
                      tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'}${tx.amount}.00
                    </p>
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

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

