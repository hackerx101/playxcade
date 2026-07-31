import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Settings, Edit3, CheckCircle2, MessageSquare, Upload } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<string>(activeTabParam);
  const [followsSubTab, setFollowsSubTab] = useState<'followers' | 'following'>('followers');

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
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans">
        <Navbar showLiveIcon={true} />
        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
          <IOSBackButton onClick={() => navigate(-1)} label="Back" className="mx-auto" />
          <h1 className="text-xl font-bold text-white">@{username}</h1>
          <div className="p-4 bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 rounded-2xl shadow-sm">
            This profile was suspended.
          </div>
        </main>
        <BottomBar />
      </div>
    );
  }

  if (isNotFound || !profileUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans">
        <Navbar showLiveIcon={true} />
        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
          <IOSBackButton to="/feed" label="Feed" className="mx-auto" />
          <h1 className="text-2xl font-bold text-white">This user is not found</h1>
        </main>
        <BottomBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 sm:pb-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar showLiveIcon={true} />
      
      <main className="max-w-2xl mx-auto px-0 sm:px-6 pt-0 sm:pt-4 space-y-4">
        {!isOwnProfile && (
          <div className="flex items-center space-x-2 px-3 sm:px-0 pt-4 sm:pt-0">
            <IOSBackButton onClick={() => navigate(-1)} label="Back" />
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
          
          {/* Banner */}
          <div className="h-32 sm:h-48 w-full bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-50 relative">
            <div className="absolute inset-0 bg-black/5" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-10 mix-blend-multiply"></div>
          </div>

          <div className="p-5 sm:p-6 space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 mb-4 sm:mb-0 gap-4">
              <div className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <img
                    src={profileUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profileUser.username}`}
                    alt={profileUser.username}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-white shadow-lg bg-slate-100"
                  />
                  {profileUser.IsIdentityVerify && (
                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1">
                      <CheckCircle2 className="w-6 h-6 fill-amber-400 text-white stroke-[2]" />
                    </div>
                  )}
                </div>
                <div className="space-y-1 pb-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    {profileUser.username}
                  </h1>
                  <p className="text-indigo-600 font-mono text-xs font-bold">@{profileUser.username}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 shrink-0">
                {isOwnProfile ? (
                  <Link
                    to="/settings"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-900 font-bold text-sm shadow-sm transition flex items-center space-x-2"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Edit</span>
                  </Link>
                ) : (
                  <div className="flex items-center space-x-2">
                    <FollowButton
                      targetUserId={profileUser.user_id}
                      targetUsername={profileUser.username}
                      size="md"
                    />
                    <button
                      onClick={() => navigate(`/chat/${profileUser.username}`)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition flex items-center space-x-1.5 shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Message</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {profileUser.bio || 'No bio written yet.'}
            </p>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-lg font-bold text-slate-950">{userPosts.length}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Posts</p>
              </div>

              <button
                onClick={() => {
                  setActiveTab('follows');
                  setFollowsSubTab('followers');
                  setSearchParams({ tab: 'follows' });
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition text-center"
              >
                <p className="text-lg font-bold text-slate-950">{displayedFollowersCount}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Followers</p>
              </button>

              <button
                onClick={() => {
                  setActiveTab('follows');
                  setFollowsSubTab('following');
                  setSearchParams({ tab: 'follows' });
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition text-center"
              >
                <p className="text-lg font-bold text-slate-950">{displayedFollowingCount}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Following</p>
              </button>
            </div>

            {isOwnProfile && (
              <button
                onClick={() => setEditModalOpen(true)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-2xl shadow-sm transition flex items-center justify-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile Details</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 grid grid-cols-4 gap-1">
          {[
            { id: 'posts', label: 'Posts' },
            { id: 'replies', label: 'Replies' },
            { id: 'media', label: 'Media' },
            { id: 'follows', label: 'Follows' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'follows') {
                   navigate(`/profile/${profileUser.username}/follows`);
                } else {
                   setActiveTab(tab.id);
                   setSearchParams({ tab: tab.id });
                }
              }}
              className={`py-2 text-[10px] font-extrabold rounded-xl transition ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
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
              <div className="bg-slate-900 rounded-2xl p-8 text-center text-slate-400 space-y-2 border border-slate-800">
                <p className="font-bold text-white text-sm">No posts published yet</p>
                <p className="text-xs">When @{profileUser.username} shares content, it will appear here.</p>
              </div>
            ) : (
              userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )
          )}

          {activeTab === 'follows' && (
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex space-x-2 border-b border-slate-800 pb-3">
                <button
                  onClick={() => setFollowsSubTab('followers')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                    followsSubTab === 'followers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Followers ({displayedFollowersCount})
                </button>
                <button
                  onClick={() => setFollowsSubTab('following')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                    followsSubTab === 'following' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Following ({displayedFollowingCount})
                </button>
              </div>

              {followsSubTab === 'followers' ? (
                displayedFollowersCount === 0 ? (
                  <p className="font-bold text-slate-500 text-xs py-4 text-center">No followers yet</p>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={`https://api.dicebear.com/7.x/bottts/svg?seed=follower1`}
                          alt="Follower"
                          className="w-9 h-9 rounded-full border border-slate-800"
                        />
                        <div>
                          <p className="font-bold text-xs text-white">Community Member</p>
                          <p className="text-[10px] text-slate-400">Following @{profileUser.username}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                followingIds && followingIds.length > 0 ? (
                  <div className="space-y-2">
                    {followingIds.map((id) => (
                      <div key={id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${id}`}
                            alt={id}
                            className="w-9 h-9 rounded-full border border-slate-800"
                          />
                          <div>
                            <p className="font-bold text-xs text-white">@{id.replace('u_', '')}</p>
                            <p className="text-[10px] text-slate-400">Gamer</p>
                          </div>
                        </div>
                        <FollowButton targetUserId={id} size="sm" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-bold text-slate-500 text-xs py-4 text-center">Not following anyone yet</p>
                )
              )}
            </div>
          )}
        </div>
      </main>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-white">Edit Profile</h3>
            
            {editError && (
              <p className="text-xs font-semibold text-rose-400 bg-rose-950/50 p-2.5 rounded-xl border border-rose-900">
                {editError}
              </p>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Profile Photo</label>
                <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <img
                    src={editAvatar || profileUser?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profileUser?.username}`}
                    alt="Profile Preview"
                    className="w-12 h-12 rounded-full object-cover border border-slate-800 shadow-sm shrink-0"
                  />
                  <label className="cursor-pointer px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold text-xs rounded-xl border border-indigo-500/30 transition inline-flex items-center space-x-1.5">
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setEditAvatar(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm"
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
