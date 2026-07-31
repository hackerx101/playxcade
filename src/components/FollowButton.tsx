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
    sm: 'px-4 py-1.5 text-xs rounded-full',
    md: 'px-5 py-2 text-sm font-bold rounded-full',
    lg: 'px-6 py-2.5 text-sm font-extrabold rounded-full',
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`inline-flex items-center justify-center font-bold transition-all duration-200 group shadow-sm ${sizeClasses[size]} ${
        isFollowing
          ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200'
          : 'bg-black hover:bg-slate-800 text-white active:scale-95'
      } ${className}`}
      title={isFollowing ? `Click to unfollow @${targetUsername || 'gamer'}` : `Follow @${targetUsername || 'gamer'}`}
    >
      {isFollowing ? (
        <>
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:inline">Unfollow</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          <span>Follow</span>
        </>
      )}
    </button>
  );
};
