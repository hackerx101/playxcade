import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Settings, Edit3, CheckCircle2, MessageSquare, Image as ImageIcon, Film, FileText, Sparkles, X, Upload } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { BottomBar } from '../components/BottomBar';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/PostCard';
import { FollowButton } from '../components/FollowButton';
import { IOSBackButton } from '../components/IOSBackButton';
import { useUsernameValidation } from '../hooks/useUsernameValidation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, posts, updateProfile, followingIds } = useAuth();
  
  const isOwnProfile = !username || (user && user.username.toLowerCase() === username.toLowerCase());

  const isSuspended = username?.toLowerCase() === 'suspended_user' || username?.toLowerCase() === 'banned';
  const isNotFound = username?.toLowerCase() === 'nonexistent' || username?.toLowerCase() === 'unknown';

  const [dbFollowersCount, setDbFollowersCount] = useState<number>(0);
  const [dbFollowingCount, setDbFollowingCount] = useState<number>(0);

  const targetUserId = isOwnProfile ? (user?.user_id || '') : (username ? 'u_' + username : '');

  useEffect(() => {
    if (!isOwnProfile && targetUserId) {
      getDoc(doc(db, 'profiles', targetUserId)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setDbFollowersCount(data.followers_count || 0);
          setDbFollowingCount(data.following_count || 0);
        }
      }).catch(() => {});
    }
  }, [targetUserId, isOwnProfile]);

  const profileUser = isOwnProfile
    ? user
    : isSuspended || isNotFound
    ? null
    : {
        id: targetUserId,
        user_id: targetUserId,
        username: username || 'Gamer',
        email: `${username}@garexcell.com`,
        bio: 'Competitive gamer & stream creator on Garexcell Network 🕹️',
        dob: '2001-04-10',
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        IsDeleted: false,
        account_status: 'active' as const,
        appeal_status: 'none' as const,
        IsIdentityVerify: false,
        is_private: false,
        followers_count: dbFollowersCount,
        following_count: dbFollowingCount,
        posts_count: 0,
        created_at: new Date().toISOString(),
      };

  const isTargetFollowing = targetUserId ? followingIds.includes(targetUserId) : false;

  const displayedFollowersCount = isOwnProfile
    ? (user?.followers_count || 0)
    : Math.max(isTargetFollowing ? 1 : 0, dbFollowersCount + (isTargetFollowing ? 1 : 0));
  
  const displayedFollowingCount = isOwnProfile
    ? followingIds.length
    : dbFollowingCount;

  const activeTabParam = searchParams.get('tab') || 'posts';
  const [activeTab, setActiveTab] = useState<string>(activeTabParam === 'follows' ? 'posts' : activeTabParam);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUsername, setEditUsername] = useState(profileUser?.username || '');
  const [editBio, setEditBio] = useState(profileUser?.bio || '');
  const [editAvatar, setEditAvatar] = useState(profileUser?.avatar_url || '');
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (profileUser) {
      setEditUsername(profileUser.username || '');
      setEditBio(profileUser.bio || '');
      setEditAvatar(profileUser.avatar_url || '');
    }
  }, [profileUser?.username, profileUser?.bio, profileUser?.avatar_url]);

  const usernameValidation = useUsernameValidation(editUsername, user?.email);

  const userPosts = posts.filter(
    (p) => p.author_username.toLowerCase() === (profileUser?.username || '').toLowerCase()
  );

  const userMediaPosts = userPosts.filter((p) => !!p.media_url || p.type === 'image' || p.type === 'video');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (isOwnProfile && profileUser) {
      if (!usernameValidation.isValid) {
        setEditError(usernameValidation.warning || 'Please choose a valid username.');
        return;
      }

      updateProfile({
        username: editUsername,
        bio: editBio,
        avatar_url: editAvatar,
      });
      setEditModalOpen(false);
    }
  };

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-white text-slate-900 pb-20 font-sans">
        <Navbar showLiveIcon={true} />
        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
          <IOSBackButton onClick={() => navigate(-1)} label="Back" className="mx-auto" />
          <h1 className="text-xl font-bold text-slate-900">@{username}</h1>
          <div className="p-4 bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 rounded-2xl shadow-sm">
            This profile was suspended due to community guidelines violation.
          </div>
        </main>
        <BottomBar />
      </div>
    );
  }

  if (isNotFound || !profileUser) {
    return (
      <div className="min-h-screen bg-white text-slate-900 pb-20 font-sans">
        <Navbar showLiveIcon={true} />
        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
          <IOSBackButton to="/feed" label="Feed" className="mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900">This user was not found</h1>
        </main>
        <BottomBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 sm:pb-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar showLiveIcon={true} />
      
      <main className="max-w-2xl mx-auto px-0 sm:px-6 pt-0 sm:pt-4 space-y-4">
        {!isOwnProfile && (
          <div className="flex items-center space-x-2 px-3 sm:px-0 pt-3 sm:pt-0">
            <IOSBackButton onClick={() => navigate(-1)} label="Back" />
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white sm:rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden relative">
          
          {/* Banner */}
          <div className="h-32 sm:h-48 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
          </div>

          <div className="p-5 sm:p-6 space-y-5 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 mb-2 sm:mb-0 gap-4">
              <div className="flex flex-col sm:flex-row sm:items-end space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <img
                    src={profileUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profileUser.username}`}
                    alt={profileUser.username}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white shadow-md bg-slate-100"
                  />
                  {profileUser.IsIdentityVerify && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                      <CheckCircle2 className="w-6 h-6 fill-amber-400 text-white stroke-[2]" />
                    </div>
                  )}
                </div>
                <div className="space-y-0.5 pb-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                    <span>{profileUser.username}</span>
                  </h1>
                  <p className="text-indigo-600 font-mono text-xs font-bold">@{profileUser.username}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 shrink-0">
                {isOwnProfile ? (
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-2 border border-slate-200"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <FollowButton
                      targetUserId={profileUser.user_id}
                      targetUsername={profileUser.username}
                      size="md"
                    />
                    <button
                      onClick={() => navigate(`/chat/${profileUser.username}`)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bio Card */}
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              {profileUser.bio || 'No bio provided yet.'}
            </p>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-3 text-center pt-1">
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                <p className="text-lg font-extrabold text-slate-900">{userPosts.length}</p>
                <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Posts</p>
              </div>

              {/* Click Followers -> Navigate directly to separate Followers page */}
              <button
                onClick={() => navigate(`/profile/${profileUser.username}/follows?subtab=followers`)}
                className="p-3 bg-slate-50/80 hover:bg-indigo-50/80 rounded-2xl border border-slate-100 hover:border-indigo-100 transition text-center group cursor-pointer"
              >
                <p className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-600">{displayedFollowersCount}</p>
                <p className="text-[10px] text-slate-500 group-hover:text-indigo-600 font-extrabold uppercase tracking-wider">Followers</p>
              </button>

              {/* Click Following -> Navigate directly to separate Following page */}
              <button
                onClick={() => navigate(`/profile/${profileUser.username}/follows?subtab=following`)}
                className="p-3 bg-slate-50/80 hover:bg-indigo-50/80 rounded-2xl border border-slate-100 hover:border-indigo-100 transition text-center group cursor-pointer"
              >
                <p className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-600">{displayedFollowingCount}</p>
                <p className="text-[10px] text-slate-500 group-hover:text-indigo-600 font-extrabold uppercase tracking-wider">Following</p>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Switcher (Posts, Replies, Media) */}
        <div className="bg-white rounded-2xl p-1.5 shadow-xs border border-slate-200/80 grid grid-cols-3 gap-1">
          {[
            { id: 'posts', label: 'Posts' },
            { id: 'replies', label: 'Replies' },
            { id: 'media', label: 'Media' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchParams({ tab: tab.id });
              }}
              className={`py-2 text-xs font-extrabold rounded-xl transition ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'posts' && (
            userPosts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-500 space-y-2 border border-slate-200/80 shadow-xs">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-800 text-sm">No posts published yet</p>
                <p className="text-xs text-slate-400">When @{profileUser.username} posts content, it will show up here.</p>
              </div>
            ) : (
              userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )
          )}

          {activeTab === 'media' && (
            userMediaPosts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-500 space-y-2 border border-slate-200/80 shadow-xs">
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-800 text-sm">No media attachments found</p>
                <p className="text-xs text-slate-400">Uploaded videos and photos will appear here.</p>
              </div>
            ) : (
              userMediaPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )
          )}

          {activeTab === 'replies' && (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-500 space-y-2 border border-slate-200/80 shadow-xs">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-800 text-sm">No recent replies</p>
              <p className="text-xs text-slate-400">Public thread replies will be indexed here.</p>
            </div>
          )}
        </div>
      </main>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Edit Profile Details</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username Handle</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  placeholder="Tell the gaming community about yourself..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomBar />
    </div>
  );
};
