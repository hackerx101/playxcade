import React, { useState, useEffect } from 'react';
import { Search, X, Users, Hash, Grid, UserCheck, Flame, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { BottomBar } from '../components/BottomBar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { FollowButton } from '../components/FollowButton';

interface SearchUser {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  followers: number;
}

export const ExplorePage: React.FC = () => {
  const [users, setUsers] = useState<SearchUser[]>([]);
  
  useEffect(() => {
    supabase.from('profiles').select('*').limit(30).then(({ data }) => {
      if (data) {
        setUsers(data.map((p: any) => ({
          id: p.user_id,
          username: p.username,
          avatar: p.avatar_url,
          bio: p.bio,
          followers: 0
        })));
      }
    });
  }, []);

  const {
    posts,
    followingIds,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'users' | 'posts' | 'hashtags'>('all');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return u.username.toLowerCase().includes(q) || u.bio?.toLowerCase().includes(q);
  }).slice(0, 15);

  const filteredPosts = posts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    if (q.startsWith('#')) {
      return p.hashtags?.some((h) => h.toLowerCase().includes(q));
    }
    return (
      p.caption.toLowerCase().includes(q) ||
      p.author_username.toLowerCase().includes(q) ||
      p.hashtags?.some((h) => h.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 sm:pb-8 font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar showLiveIcon={true} />

      <main className="max-w-2xl mx-auto px-3 sm:px-6 pt-4 space-y-6">
        
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users, posts, or #hashtags..."
              className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Filter Type Pills */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 grid grid-cols-4 gap-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'users', label: 'Users' },
            { id: 'posts', label: 'Posts' },
            { id: 'hashtags', label: 'Hashtags' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`py-2 text-xs font-semibold rounded-xl transition ${
                filterType === f.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Recent Searches */}
        {recentSearches && recentSearches.length > 0 && !searchQuery && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase">Recent Searches</span>
              <button
                onClick={clearRecentSearches}
                className="text-[10px] text-slate-400 font-semibold uppercase hover:underline"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term, i) => (
                <button
                  key={i}
                  onClick={() => setSearchQuery(term)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Users Section */}
        {(filterType === 'all' || filterType === 'users') && filteredUsers.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Suggested Creators & Users</span>
            </h2>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition"
                >
                  <Link to={`/profile/${u.username}`} className="flex items-center space-x-3.5">
                    <img
                      src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                      alt={u.username}
                      className="w-11 h-11 rounded-full border border-slate-200 object-cover"
                    />
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="font-bold text-sm text-slate-900">@{u.username}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 fill-amber-500 text-white stroke-[2]" />
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-[180px] sm:max-w-sm">{u.bio || 'Garexcell Network Creator'}</p>
                    </div>
                  </Link>

                  <FollowButton targetUserId={u.id} targetUsername={u.username} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts & Hashtags Section */}
        {(filterType === 'all' || filterType === 'posts' || filterType === 'hashtags') && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
              <Flame className="w-4 h-4 text-indigo-600" />
              <span>Trending Network Posts</span>
            </h2>

            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Link to={`/profile/${post.author_username}`} className="flex items-center space-x-2.5">
                      <img
                        src={post.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.author_username}`}
                        alt={post.author_username}
                        className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                      />
                      <span className="font-bold text-xs text-slate-900">@{post.author_username}</span>
                    </Link>
                    <span className="text-[10px] text-slate-400">{post.created_at}</span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium leading-relaxed">{post.caption}</p>

                  {post.media_url && (
                    <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      <img src={post.media_url} alt="Media" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {post.hashtags.map((h, i) => (
                        <span key={i} className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-600">
                          #{h}
                        </span>
                      ))}
                    </div>
                  )}
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
