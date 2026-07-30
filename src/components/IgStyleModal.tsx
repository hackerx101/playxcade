import React from 'react';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, Info } from 'lucide-react';

export interface IgModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'warning' | 'error' | 'success' | 'info' | 'limited';
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const IgStyleModal: React.FC<IgModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  primaryActionLabel = 'OK',
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'limited':
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-amber-500" />;
      case 'error':
        return <ShieldAlert className="w-8 h-8 text-rose-500" />;
      case 'success':
        return <CheckCircle2 className="w-8 h-8 text-emerald-500" />;
      default:
        return <Info className="w-8 h-8 text-indigo-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 text-center transform transition-all duration-200 animate-scaleUp">
        
        {/* Header Content */}
        <div className="p-6 space-y-3">
          <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
            {getIcon()}
          </div>

          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            {title || (type === 'limited' ? 'Account Limited' : 'Notice')}
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Instagram-style Divider Buttons */}
        <div className="border-t border-slate-100 divide-y divide-slate-100 font-bold text-xs">
          
          {/* Primary Action Button */}
          <button
            onClick={() => {
              if (onPrimaryAction) onPrimaryAction();
              onClose();
            }}
            className={`w-full py-3.5 hover:bg-slate-50 active:bg-slate-100 transition text-center ${
              type === 'limited' || type === 'warning'
                ? 'text-amber-600 font-black'
                : type === 'error'
                ? 'text-rose-600 font-black'
                : 'text-indigo-600 font-black'
            }`}
          >
            {primaryActionLabel}
          </button>

          {/* Secondary Action Button if provided */}
          {secondaryActionLabel && (
            <button
              onClick={() => {
                if (onSecondaryAction) onSecondaryAction();
                onClose();
              }}
              className="w-full py-3.5 text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition text-center"
            >
              {secondaryActionLabel}
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 active:bg-slate-100 font-semibold transition text-center"
          >
            Close
          </button>

        </div>

      </div>
    </div>
  );
};
