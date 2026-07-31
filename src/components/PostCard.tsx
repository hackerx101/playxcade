import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Share2, MoreHorizontal, CheckCircle2, Flag, EyeOff, Copy, ShieldCheck } from 'lucide-react';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { VideoPlayer } from './VideoPlayer';

interface PostCardProps {
  post: Post;
  onCommentClick?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onCommentClick }) => {
  const { likePost, deletePost, user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowMenu(false);
  };

  const isGarexcellOfficial = post.author_username === 'garexcell' || post.is_official;

  return (
    <article className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-5 transition-all">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.author_username}`}>
            <img
              src={post.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.author_username}`}
              alt={post.author_username}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
          </Link>
          <div>
            <div className="flex items-center space-x-1.5">
              <Link
                to={`/profile/${post.author_username}`}
                className="font-bold text-slate-900 hover:underline text-sm flex items-center space-x-1"
              >
                <span>@{post.author_username}</span>
                {isGarexcellOfficial || post.author_is_verified ? (
                  <span className="inline-flex items-center justify-center text-amber-500" title="Verified Gold Badge">
                    <CheckCircle2 className="w-4 h-4 fill-amber-500 text-white stroke-[2]" />
                  </span>
                ) : null}
              </Link>
            </div>
            {/* If official post, no created_at timestamp string as requested */}
            {!isGarexcellOfficial && post.created_at && (
              <p className="text-xs text-slate-400">{post.created_at}</p>
            )}
          </div>
        </div>

        {/* 3 Dots Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-20 text-xs font-medium text-slate-700">
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-slate-50 transition"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
              <button
                onClick={() => {
                  setHidden(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-slate-50 transition"
              >
                <EyeOff className="w-4 h-4" />
                <span>Hide Post</span>
              </button>
              <button
                onClick={() => {
                  alert('Thank you. This post has been flagged for Garexcell moderators review.');
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition"
              >
                <Flag className="w-4 h-4" />
                <span>Report Post</span>
              </button>
              {user && user.username === post.author_username && (
                <button
                  onClick={() => deletePost(post.id)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-rose-600 hover:bg-rose-50 border-t border-slate-100 transition"
                >
                  <span>Delete Post</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Caption Content */}
      <div className="p-4 space-y-3">
        <p className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line">
          {post.caption}
        </p>

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.hashtags.map((tag, idx) => (
              <Link
                key={idx}
                to={`/explore?q=${encodeURIComponent(tag)}`}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Square Media Attachment */}
      {post.media_url && (
        <div className="relative aspect-square w-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {post.type === 'video' || post.media_url.includes('video') || post.media_url.endsWith('.mp4') || post.media_url.endsWith('.webm') || post.media_url.startsWith('data:video') ? (
            <VideoPlayer
              src={post.media_url}
              className="w-full h-full rounded-none"
              loop={true}
            />
          ) : (
            <img
              src={post.media_url}
              alt="Post media"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}

      {/* Post Actions & Footer */}
      <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
        <div className="flex items-center space-x-5">
          <button
            onClick={() => likePost(post.id)}
            className={`flex items-center space-x-1.5 transition ${
              post.is_liked ? 'text-rose-500 font-bold' : 'hover:text-rose-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{post.likes_count}</span>
          </button>

          <Link
            to={`/post/${post.id}`}
            className="flex items-center space-x-1.5 hover:text-indigo-600 transition"
          >
            <MessageSquare className="w-5 h-5" />
            <span>{post.comments_count}</span>
          </Link>

          <button onClick={handleCopyLink} className="hover:text-indigo-600 transition" title="Copy Link">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </article>
  );
};
