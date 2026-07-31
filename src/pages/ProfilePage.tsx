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
  const [targetFollowingArray, setTargetFollowingArray] = useState<string[]>([]);

  const targetUserId = isOwnProfile ? (user?.user_id || '') : (username ? 'u_' + username : '');

  useEffect(() => {
    if (!isOwnProfile && targetUserId) {
      getDoc(doc(db, 'profiles', targetUserId)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setDbFollowersCount(data.followers_count || 0);
          setDbFollowingCount(data.following?.length || data.following_count || 0);
          setTargetFollowingArray(data.following || []);
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
    : dbFollowersCount;
  
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
      
      <main className="max-w-2xl mx-auto px-0 sm:px-6 pt-0 space-y-4">
        {!isOwnProfile && (
          <div className="flex items-center space-x-4 px-4 py-3 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-100">
            <IOSBackButton onClick={() => navigate(-1)} label="" className="!p-1" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">{profileUser.username}</h1>
              <p className="text-xs text-slate-500">{userPosts.length} posts</p>
            </div>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white sm:rounded-3xl shadow-sm border-x border-b border-slate-200/80 overflow-hidden relative pb-4">
          
          {/* Banner */}
          <div className="h-32 sm:h-48 w-full bg-slate-300 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-400" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
          </div>

          <div className="px-4 relative">
            <div className="flex justify-between items-start -mt-12 sm:-mt-16 mb-3">
              <div className="relative">
                <img
                  src={profileUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profileUser.username}`}
                  alt={profileUser.username}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white bg-slate-100"
                />
                {profileUser.IsIdentityVerify && (
                  <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5">
                    <CheckCircle2 className="w-6 h-6 fill-blue-500 text-white" />
                  </div>
                )}
              </div>
              
              <div className="pt-14 sm:pt-20 flex items-center space-x-2">
                {isOwnProfile ? (
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm rounded-full transition border border-slate-300"
                  >
                    Edit profile
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/chat/${profileUser.username}`)}
                      className="p-1.5 bg-white hover:bg-slate-50 text-slate-900 rounded-full transition border border-slate-300"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <FollowButton
                      targetUserId={profileUser.user_id}
                      targetUsername={profileUser.username}
                      size="md"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">
                  {profileUser.username}
                </h1>
                <p className="text-slate-500 text-sm">@{profileUser.username}</p>
              </div>

              {/* Bio */}
              {profileUser.bio && (
                <p className="text-sm text-slate-900 leading-normal">
                  {profileUser.bio}
                </p>
              )}

              {/* Stats Bar */}
              <div className="flex items-center space-x-5 pt-1">
                <button
                  onClick={() => navigate(`/profile/${profileUser.username}/follows?subtab=following`)}
                  className="flex items-center space-x-1 group"
                >
                  <span className="text-sm font-bold text-slate-900">{displayedFollowingCount}</span>
                  <span className="text-sm text-slate-500 group-hover:underline">Following</span>
                </button>
                <button
                  onClick={() => navigate(`/profile/${profileUser.username}/follows?subtab=followers`)}
                  className="flex items-center space-x-1 group"
                >
                  <span className="text-sm font-bold text-slate-900">{displayedFollowersCount}</span>
                  <span className="text-sm text-slate-500 group-hover:underline">Followers</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher (Posts, Replies, Media) */}
        <div className="bg-white border-b border-x sm:rounded-b-3xl border-slate-200/80 flex">
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
              className={`flex-1 py-4 text-sm font-bold transition relative hover:bg-slate-50 ${
                activeTab === tab.id
                  ? 'text-slate-900'
                  : 'text-slate-500'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-t-full" />
              )}
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
