import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, Zap, X, Trophy } from 'lucide-react';

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradePromptModal: React.FC<UpgradePromptModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
        
        {/* Decorative background lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-colors z-10 border border-slate-700/50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-600/15 border border-indigo-500/30 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight text-white">Upgrade to Premium</h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
              You have used your <strong className="text-white">2 free messages</strong> limit. Unlock unlimited messaging, calling, and exclusive community badges.
            </p>
          </div>

          {/* Premium Benefits Grid */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-left space-y-3.5">
            <div className="flex items-start space-x-3">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">Unlimited Global Messages</h4>
                <p className="text-[10px] text-slate-500">Send texts, emojis, and media attachments without restrictions.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">Live Voice & Video Calling</h4>
                <p className="text-[10px] text-slate-500">Access high-fidelity end-to-end peer calls anytime.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Trophy className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">Official Verification Badge</h4>
                <p className="text-[10px] text-slate-500">Get a gold badge next to your name to show your community status.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                onClose();
                navigate('/checkout?plan=premium&amount=20.99');
              }}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition"
            >
              Unlock Now for $20.99
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-3 text-xs text-slate-400 hover:text-white font-bold transition"
            >
              Keep Free Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
