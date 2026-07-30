import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface IOSBackButtonProps {
  onClick?: () => void;
  to?: string;
  label?: string;
  className?: string;
}

export const IOSBackButton: React.FC<IOSBackButtonProps> = ({
  onClick,
  to,
  label,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`inline-flex items-center space-x-1.5 text-white bg-slate-900 hover:bg-black active:scale-95 transition-all duration-150 px-3 py-1.5 rounded-full shadow-sm border border-slate-800 shrink-0 select-none ${className}`}
      aria-label="Go back"
    >
      <ChevronLeft className="w-4 h-4 text-white stroke-[2.5]" />
      {label && <span className="text-xs font-bold text-white pr-0.5 tracking-tight">{label}</span>}
    </button>
  );
};
