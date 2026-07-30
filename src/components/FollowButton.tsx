import React from 'react';
import { UserPlus, UserCheck, UserMinus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface FollowButtonProps {
  targetUserId: string;
  targetUsername?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  targetUsername,
  size = 'md',
  className = '',
}) => {
  const { user, followingIds, toggleFollow } = useAuth();

  // Do not show follow button for self
  if (user && (user.user_id === targetUserId || (targetUsername && user.username.toLowerCase() === targetUsername.toLowerCase()))) {
    return null;
  }

  const isFollowing = followingIds.includes(targetUserId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFollow(targetUserId);
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs space-x-1 rounded-lg',
    md: 'px-4 py-1.5 text-xs font-bold space-x-1.5 rounded-xl',
    lg: 'px-5 py-2.5 text-sm font-extrabold space-x-2 rounded-xl',
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`inline-flex items-center justify-center font-bold transition-all duration-200 group shadow-sm ${sizeClasses[size]} ${
        isFollowing
          ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200'
          : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
      } ${className}`}
      title={isFollowing ? `Click to unfollow @${targetUsername || 'gamer'}` : `Follow @${targetUsername || 'gamer'}`}
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-3.5 h-3.5 group-hover:hidden text-indigo-600" />
          <UserMinus className="w-3.5 h-3.5 hidden group-hover:inline text-rose-600" />
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:inline">Unfollow</span>
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5" />
          <span>Follow</span>
        </>
      )}
    </button>
  );
};
