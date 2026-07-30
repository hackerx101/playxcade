import React, { useState } from 'react';
import { Search, X, Users, Hash, Grid, UserCheck, Flame, ArrowRight } from 'lucide-react';
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
  React.useEffect(() => {
    supabase.from('profiles').select('*').limit(20).then(({ data }) => {
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
    toggleFollow,
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

  // User search algorithm:
  // Sort users so followed persons appear first, filter by username or 4 digits
  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return u.username.toLowerCase().includes(q) || q.length === 4;
  }).sort((a, b) => {
    const aFollowed = followingIds.includes(a.id);
    const bFollowed = followingIds.includes(b.id);
    if (aFollowed && !bFollowed) return -1;
    if (!aFollowed && bFollowed) return 1;
    return 0;
  }).slice(0, 10); // show 10 persons initial limit

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
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20 sm:pb-8 transition-colors">
      <Navbar showLiveIcon={true} />

      <main className="max-w-3xl mx-auto px-3 sm:px-6 pt-4 space-y-5">
        
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users (e.g. 4 digits or name), posts, or #hashtags..."
              className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>

        {/* Local Storage Recent Search History List */}
        {recentSearches.length > 0 && !searchQuery && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Recent Searches
              </span>
              <button
                onClick={clearRecentSearches}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Clear All
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <div
                  key={term}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700 border border-slate-200"
                >
                  <button
                    onClick={() => {
                      setSearchQuery(term);
                      addRecentSearch(term);
                    }}
                    className="hover:underline"
                  >
                    {term}
                  </button>
                  <button
                    onClick={() => removeRecentSearch(term)}
                    className="text-slate-400 hover:text-rose-500 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex rounded-xl bg-white p-1 border border-slate-200 shadow-sm">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100:bg-slate-800'
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => setFilterType('users')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              filterType === 'users'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100:bg-slate-800'
            }`}
          >
            Gamers & Users
          </button>
          <button
            onClick={() => setFilterType('posts')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              filterType === 'posts'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100:bg-slate-800'
            }`}
          >
            Media Grid
          </button>
        </div>

        {/* Users Search Results Section */}
        {(filterType === 'all' || filterType === 'users') && (
          <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Gamer Community ({filteredUsers.length})</span>
            </h3>

            <div className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((usr) => {
                  const isFollowed = followingIds.includes(usr.id);
                  return (
                    <div key={usr.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                      <Link
                        to={`/profile/${usr.username}`}
                        onClick={() => addRecentSearch(usr.username)}
                        className="flex items-center space-x-3 group min-w-0 flex-1 pr-3"
                      >
                        <img
                          src={usr.avatar}
                          alt={usr.username}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 group-hover:underline truncate">
                            @{usr.username}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{usr.bio}</p>
                        </div>
                      </Link>

                      <FollowButton targetUserId={usr.id} targetUsername={usr.username} size="sm" />
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No gamers found matching your search.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Grid View of Posts Section (tapping on a post routes to /post/:postId) */}
        {(filterType === 'all' || filterType === 'posts') && (
          <section className="space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
              <Grid className="w-4 h-4 text-indigo-600" />
              <span>Post Media Grid View</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    className="relative aspect-square bg-slate-900 rounded-2xl overflow-hidden group shadow-sm border border-slate-200"
                  >
                    {post.media_url ? (
                      post.type === 'video' ? (
                        <video src={post.media_url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={post.media_url} alt="Grid post" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full p-3 bg-gradient-to-br from-indigo-900 to-slate-900 text-white text-xs font-semibold flex items-center justify-center text-center">
                        {post.caption}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold space-x-2">
                      <span>View #{post.id}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-slate-500 text-sm">
                  No media posts available.
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <BottomBar />
    </div>
  );
};
