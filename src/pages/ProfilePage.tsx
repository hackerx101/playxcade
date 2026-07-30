import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Settings, Edit3, CheckCircle2, MessageSquare, Upload, Wallet } from 'lucide-react';
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

  // Check if profile exists or is suspended
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

  // Dynamic live calculation of followers & following
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

  // Suspended view
  if (isSuspended) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
        <Navbar showLiveIcon={true} />
        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
          <IOSBackButton onClick={() => navigate(-1)} label="Back" className="mx-auto" />
          <img
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${username}`}
            alt={username}
            className="w-24 h-24 rounded-full mx-auto border border-slate-200 object-cover shadow-sm"
          />
          <h1 className="text-xl font-bold text-slate-900">
            @{username}
          </h1>
          <div className="p-4 bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 rounded-2xl shadow-sm">
            This profile was suspended.
          </div>
        </main>
        <BottomBar />
      </div>
    );
  }

  // Not Found view
  if (isNotFound || !profileUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
        <Navbar showLiveIcon={true} />
        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
          <IOSBackButton to="/feed" label="Feed" className="mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900">
            This user is not found
          </h1>
          <p className="text-xs text-slate-500">
            The profile you are looking for does not exist or has been deleted.
          </p>
        </main>
        <BottomBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 sm:pb-8 font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar showLiveIcon={true} />

      <main className="max-w-2xl mx-auto px-3 sm:px-6 pt-4 space-y-4">
        
        {/* Top Back Nav if viewing another profile */}
        {!isOwnProfile && (
          <div className="flex items-center space-x-2">
            <IOSBackButton onClick={() => navigate(-1)} label="Back" />
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={profileUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profileUser.username}`}
                alt={profileUser.username}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border border-slate-200 shadow-sm"
              />
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    @{profileUser.username}
                  </h1>
                  {profileUser.IsIdentityVerify && (
                    <span className="inline-flex items-center text-amber-500" title="Verified Gold Badge">
                      <CheckCircle2 className="w-5 h-5 fill-amber-500 text-white stroke-[2]" />
                    </span>
                  )}
                </div>

                {isOwnProfile && (
                  <div className="pt-1">
                    <Link
                      to="/wallet"
                      className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold hover:bg-emerald-100 transition shadow-xs"
                    >
                      <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Wallet: ${user?.wallet_balance || 0}.00</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {isOwnProfile ? (
              <Link
                to="/settings"
                className="p-2.5 bg-white hover:bg-slate-50 rounded-xl text-slate-700 shadow-sm border border-slate-200 transition"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
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
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message</span>
                </button>
              </div>
            )}
          </div>

          {/* Bio */}
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {profileUser.bio || 'No bio written yet.'}
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-lg font-bold text-slate-900">{userPosts.length}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Posts</p>
            </div>

            <button
              onClick={() => {
                setActiveTab('follows');
                setFollowsSubTab('followers');
                setSearchParams({ tab: 'follows' });
              }}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition text-center"
            >
              <p className="text-lg font-bold text-slate-900">{displayedFollowersCount}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Followers</p>
            </button>

            <button
              onClick={() => {
                setActiveTab('follows');
                setFollowsSubTab('following');
                setSearchParams({ tab: 'follows' });
              }}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition text-center"
            >
              <p className="text-lg font-bold text-slate-900">{displayedFollowingCount}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Following</p>
            </button>
          </div>

          {isOwnProfile && (
            <button
              onClick={() => setEditModalOpen(true)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile Details</span>
            </button>
          )}
        </div>

        {/* Tab Switcher: Posts, Media, Replies, Reposts */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 grid grid-cols-4 gap-1">
          {[
            { id: 'posts', label: 'Posts' },
            { id: 'media', label: 'Media' },
            { id: 'replies', label: 'Replies' },
            { id: 'reposts', label: 'Reposts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchParams({ tab: tab.id });
              }}
              className={`py-2 text-xs font-extrabold rounded-xl transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
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
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 space-y-2 border border-slate-200">
                <p className="font-bold text-slate-800 text-sm">No posts published yet</p>
                <p className="text-xs">When @{profileUser.username} shares content, it will appear here.</p>
              </div>
            ) : (
              userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )
          )}

          {activeTab === 'follows' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="flex space-x-2 border-b border-slate-100 pb-3">
                <button
                  onClick={() => setFollowsSubTab('followers')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                    followsSubTab === 'followers' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Followers ({displayedFollowersCount})
                </button>
                <button
                  onClick={() => setFollowsSubTab('following')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                    followsSubTab === 'following' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
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
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={`https://api.dicebear.com/7.x/bottts/svg?seed=follower1`}
                          alt="Follower"
                          className="w-9 h-9 rounded-full border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-xs text-slate-900">Community Member</p>
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
                      <div key={id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${id}`}
                            alt={id}
                            className="w-9 h-9 rounded-full border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-xs text-slate-900">@{id.replace('u_', '')}</p>
                            <p className="text-[10px] text-slate-400">Playxcade Gamer</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Edit Profile</h3>
            {editError && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {editError}
              </p>
            )}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Profile Photo</label>
                <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <img
                    src={editAvatar || profileUser?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profileUser?.username}`}
                    alt="Profile Preview"
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                  />
                  <label className="cursor-pointer px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl border border-indigo-200 transition inline-flex items-center space-x-1.5">
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm"
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
