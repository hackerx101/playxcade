import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Search, UserCheck, ShieldCheck, Users } from 'lucide-react';
import { IOSBackButton } from '../components/IOSBackButton';
import { Navbar } from '../components/Navbar';
import { BottomBar } from '../components/BottomBar';
import { FollowButton } from '../components/FollowButton';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const FollowsPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, fetchRealUsers, followingIds } = useAuth();
  
  const activeSubTab = searchParams.get('subtab') || 'followers';
  const [searchQuery, setSearchQuery] = useState('');
  const [communityUsers, setCommunityUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [targetFollowingIds, setTargetFollowingIds] = useState<string[]>([]);
  const [targetFollowerIds, setTargetFollowerIds] = useState<string[]>([]);

  const displayHandle = username || user?.username || 'user';

  const isTargetOwn = !username || (user && user.username.toLowerCase() === username.toLowerCase());
  const targetUser = communityUsers.find(u => u.username.toLowerCase() === displayHandle.toLowerCase());
  const targetUserId = targetUser?.user_id || (isTargetOwn && user ? user.user_id : (username ? `u_${username}` : ''));

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchRealUsers(true).then((users) => {
      if (isMounted) {
        setCommunityUsers(users);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [fetchRealUsers]);

  useEffect(() => {
    let isMounted = true;
    if (!targetUserId) return;

    if (isTargetOwn) {
      setTargetFollowingIds(followingIds);
    } else {
      // Fetch target user's following list
      supabase.from('follows').select('following_id').eq('follower_id', targetUserId)
        .then(({ data }) => {
          if (isMounted && data) {
            setTargetFollowingIds(data.map(d => d.following_id));
          }
        });
    }

    // Fetch target user's followers list
    supabase.from('follows').select('follower_id').eq('following_id', targetUserId)
      .then(({ data }) => {
        if (isMounted && data) {
          setTargetFollowerIds(data.map(d => d.follower_id));
        } else {
          // Fallback to Firebase
          const q = query(collection(db, 'followers'), where('following_id', '==', targetUserId));
          getDocs(q).then(snap => {
            if (isMounted) {
              setTargetFollowerIds(snap.docs.map(d => d.data().follower_id));
            }
          }).catch(() => {});
        }
      });
      
    return () => { isMounted = false; };
  }, [targetUserId, followingIds, isTargetOwn]);

  const displayedList = communityUsers.filter((u) => {
    // Exclude target user itself from list
    if (u.username.toLowerCase() === displayHandle.toLowerCase()) return false;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!u.username.toLowerCase().includes(q) && !(u.bio || '').toLowerCase().includes(q)) {
        return false;
      }
    }

    if (activeSubTab === 'following') {
      return targetFollowingIds.includes(u.user_id) || targetFollowingIds.includes(`u_${u.username}`);
    }

    if (activeSubTab === 'followers') {
      return targetFollowerIds.includes(u.user_id) || targetFollowerIds.includes(`u_${u.username}`);
    }

    return true;
  });

  const followersCount = targetFollowerIds.length;

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 sm:pb-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar showLiveIcon={false} />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 space-y-5">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <IOSBackButton onClick={() => navigate(-1)} label="Profile" />
            <div>
              <h1 className="font-extrabold text-lg text-slate-900 tracking-tight">@{displayHandle}</h1>
              <p className="text-xs text-slate-500 font-medium">Network Connections</p>
            </div>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Subtab Toggle Bar */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setSearchParams({ subtab: 'followers' })}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              activeSubTab === 'followers'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Followers ({followersCount})
          </button>
          <button
            onClick={() => setSearchParams({ subtab: 'following' })}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              activeSubTab === 'following'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Following ({targetFollowingIds.length})
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search @${displayHandle}'s ${activeSubTab}...`}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
        </div>

        {/* User List Cards */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Loading connections...</p>
            </div>
          ) : displayedList.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 p-6">
              <p className="font-bold text-slate-800 text-sm">No users found</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery
                  ? `No matching handles for "${searchQuery}"`
                  : `No ${activeSubTab} to display yet.`}
              </p>
            </div>
          ) : (
            displayedList.map((u) => (
              <div
                key={u.user_id}
                className="flex items-center justify-between p-3.5 bg-white border border-slate-100 hover:border-slate-200 rounded-2xl shadow-xs transition hover:shadow-sm"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <Link to={`/profile/${u.username}`} className="relative shrink-0">
                    <img
                      src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                      alt={u.username}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 bg-slate-100"
                    />
                  </Link>

                  <div className="min-w-0">
                    <Link
                      to={`/profile/${u.username}`}
                      className="font-bold text-sm text-slate-900 hover:underline flex items-center space-x-1 truncate"
                    >
                      <span>@{u.username}</span>
                      {u.IsIdentityVerify && (
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" title="Verified" />
                      )}
                    </Link>
                    <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md">
                      {u.bio || 'Garexcell Network Creator'}
                    </p>
                  </div>
                </div>

                <FollowButton
                  targetUserId={u.user_id}
                  targetUsername={u.username}
                  size="sm"
                  className="shrink-0"
                />
              </div>
            ))
          )}
        </div>
      </main>

      <BottomBar />
    </div>
  );
};
