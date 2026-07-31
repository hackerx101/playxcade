import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, MoreVertical, RefreshCw, Flame, Tag, Flag, EyeOff, Copy, Film, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { BottomBar } from '../components/BottomBar';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const ForYouPage: React.FC = () => {
  const { posts, likePost, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'video' | 'image'>('video');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const mediaPosts = posts
    .filter((p) => p.type === activeTab || (activeTab === 'video' && p.media_url))
    .sort((a, b) => {
        if (user?.interests && user.interests.length > 0) {
            const aMatches = user.interests.includes(a.category || '');
            const bMatches = user.interests.includes(b.category || '');
            if (aMatches && !bMatches) return -1;
            if (!aMatches && bMatches) return 1;
        }
        return 0;
    });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 sm:pb-8 flex flex-col">
      <Navbar showLiveIcon={true} />

      {/* Top Media Switcher Bar */}
      <div className="sticky top-14 z-20 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 w-48">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition ${
              activeTab === 'video' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Videos</span>
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition ${
              activeTab === 'image' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Images</span>
          </button>
        </div>

        <button
          onClick={handleRefresh}
          className={`p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 transition ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          title="Swipe / Refresh Feed"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Reel Feed Stream */}
      <main className="flex-1 max-w-md mx-auto w-full px-2 py-4 space-y-6">
        {mediaPosts.length > 0 ? (
          mediaPosts.map((post) => (
            <div
              key={post.id}
              className="relative aspect-[9/14] w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between"
            >
            {/* Background Media */}
            {post.type === 'video' ? (
              <video
                src={post.media_url || 'https://assets.mixkit.co/videos/preview/mixkit-gameplay-of-a-futuristic-shooter-game-41527-large.mp4'}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <img
                src={post.media_url || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80'}
                alt="For you media"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 pointer-events-none" />

            {/* Top Category Tag */}
            <div className="relative z-10 p-4 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur text-indigo-400 font-bold text-xs border border-indigo-500/30 flex items-center space-x-1">
                <Tag className="w-3 h-3" />
                <span>{post.category || 'Warlands'}</span>
              </span>
              <span className="text-[10px] text-slate-300 font-medium bg-black/50 px-2 py-0.5 rounded-md">
                12-digit #{post.id}
              </span>
            </div>

            {/* Bottom Details & Side Floating Action Bar */}
            <div className="relative z-10 p-5 flex items-end justify-between gap-4">
              
              {/* Bottom Caption */}
              <div className="flex-1 space-y-2">
                <Link to={`/profile/${post.author_username}`} className="flex items-center space-x-2 group">
                  <img
                    src={post.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.author_username}`}
                    alt={post.author_username}
                    className="w-10 h-10 rounded-full border-2 border-indigo-500 object-cover"
                  />
                  <div>
                    <p className="font-bold text-sm text-white group-hover:underline flex items-center space-x-1">
                      <span>@{post.author_username}</span>
                      {post.author_is_verified && (
                        <ShieldCheck className="w-4 h-4 text-emerald-400" title="Identity Verified" />
                      )}
                    </p>
                    <p className="text-[10px] text-indigo-300">Playxcade Creator</p>
                  </div>
                </Link>

                <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed font-medium">
                  {post.caption}
                </p>

                {post.hashtags && (
                  <div className="flex flex-wrap gap-1 text-xs text-indigo-400 font-semibold">
                    {post.hashtags.map((h, i) => (
                      <span key={i}>{h}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Side Floating Icons (Like, Comment, Share, 3 Dots) */}
              <div className="flex flex-col items-center space-y-5">
                <button
                  onClick={() => likePost(post.id)}
                  className="flex flex-col items-center space-y-1 group"
                >
                  <div className={`p-3 rounded-full backdrop-blur transition ${post.is_liked ? 'bg-rose-600 text-white' : 'bg-black/50 text-white hover:bg-rose-600'}`}>
                    <Heart className={`w-6 h-6 ${post.is_liked ? 'fill-current' : ''}`} />
                  </div>
                  <span className="text-xs font-bold">{post.likes_count}</span>
                </button>

                <Link to={`/post/${post.id}`} className="flex flex-col items-center space-y-1">
                  <div className="p-3 rounded-full bg-black/50 backdrop-blur hover:bg-indigo-600 transition text-white">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold">{post.comments_count}</span>
                </Link>

                <button
                  onClick={() => {
                      if (navigator.share) {
                          navigator.share({ title: post.caption, url: `${window.location.origin}/post/${post.id}` });
                      } else {
                          navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                          alert('Link copied to clipboard!');
                      }
                  }}
                  className="flex flex-col items-center space-y-1"
                  title="Share"
                >
                  <div className="p-3 rounded-full bg-black/50 backdrop-blur hover:bg-indigo-600 transition text-white">
                    <Share2 className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold">Share</span>
                </button>

                {/* 3 Dots Menu */}
                <div className="relative">
                  <button
                    onClick={() => setActiveMenuId(activeMenuId === post.id ? null : post.id)}
                    className="p-3 rounded-full bg-black/50 backdrop-blur hover:bg-slate-800 transition text-white"
                  >
                    <MoreVertical className="w-6 h-6" />
                  </button>

                  {activeMenuId === post.id && (
                    <div className="absolute right-12 bottom-0 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-30 text-xs font-medium text-slate-200">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-slate-800 transition"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-slate-800 transition"
                      >
                        <EyeOff className="w-4 h-4" />
                        <span>Hide Post</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveMenuId(null);
                          navigate(`/report/${post.id}`);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-rose-400 hover:bg-rose-950/40 transition"
                      >
                        <Flag className="w-4 h-4" />
                        <span>Report Video</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Film className="w-12 h-12 mb-3 opacity-50" />
            <p className="font-semibold">No media posts found.</p>
          </div>
        )}
      </main>

      <BottomBar />
    </div>
  );
};
