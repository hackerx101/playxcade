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
      className={`inline-flex items-center justify-center text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all duration-150 w-9 h-9 rounded-full shadow-sm border border-slate-200/80 shrink-0 select-none ${className}`}
      aria-label="Go back text-slate-900"
    >
      <ChevronLeft className="w-5 h-5 text-slate-800 stroke-[2.5]" />
    </button>
  );
};
