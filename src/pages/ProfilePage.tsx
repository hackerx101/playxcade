import React, { useState } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Settings, Edit3, ShieldCheck, Users, Grid, Archive, Trash2, Copy, Check, Calendar, ArrowLeft, MoreHorizontal, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { BottomBar } from '../components/BottomBar';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/PostCard';
import { FollowButton } from '../components/FollowButton';
import { useUsernameValidation } from '../hooks/useUsernameValidation';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, posts, updateProfile, deletePost, archivePost, followingIds, toggleFollow } = useAuth();

  const isOwnProfile = !username || (user && user.username.toLowerCase() === username.toLowerCase());

  const profileUser = isOwnProfile
    ? user
    : {
        id: 'u_' + username,
        user_id: 'u_' + username,
        username: username || 'Gamer',
        email: `${username}@garexcell.com`,
        bio: 'Competitive gamer & stream creator on Playxcade 🕹️',
        dob: '2001-04-10',
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        IsDeleted: false,
        account_status: 'active' as const,
        appeal_status: 'none' as const,
        IsIdentityVerify: true,
        is_private: false,
        followers_count: 840,
        following_count: 120,
        posts_count: 14,
        created_at: new Date().toISOString(),
      };

  const isFollowed = profileUser ? followingIds.includes(profileUser.user_id) : false;

  // Active Tab: 'posts' | 'follows'
  const activeTabParam = searchParams.get('tab') === 'follows' ? 'follows' : 'posts';
  const [activeTab, setActiveTab] = useState<'posts' | 'follows'>(activeTabParam);
  const [followsSubTab, setFollowsSubTab] = useState<'followers' | 'following'>('followers');

  // Edit Profile Modal State
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

  if (!profileUser) return null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20 sm:pb-8 transition-colors">
      <Navbar showLiveIcon={true} />

      <main className="max-w-3xl mx-auto px-3 sm:px-6 pt-4 space-y-5">
        
        {/* Profile Header */}
        <div className="space-y-6 pb-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={profileUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profileUser.username}`}
                alt={profileUser.username}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-sm"
              />
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    @{profileUser.username}
                  </h1>
                  {profileUser.IsIdentityVerify && (
                    <ShieldCheck className="w-5 h-5 text-emerald-500" title="Identity Verified" />
                  )}
                </div>

                <p className="text-xs text-slate-500 font-medium">{profileUser.email}</p>

                {profileUser.dob && (
                  <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Born: {profileUser.dob}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Top Right Settings Gear (Navigates to /settings) */}
            {isOwnProfile ? (
              <Link
                to="/settings"
                className="p-2.5 text-slate-600 hover:text-indigo-600 transition"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>
            ) : (
              <FollowButton
                targetUserId={profileUser.user_id}
                targetUsername={profileUser.username}
                size="md"
              />
            )}
          </div>

          {/* Bio */}
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            {profileUser.bio || 'No bio written yet.'}
          </p>

          {/* Stats Bar */}
          <div className="flex items-center justify-around py-3 border-y border-slate-200 text-center">
            <div>
              <p className="text-base font-extrabold text-slate-900">{userPosts.length}</p>
              <p className="text-[11px] text-slate-500 font-semibold uppercase">Posts</p>
            </div>

            <button
              onClick={() => {
                setActiveTab('follows');
                setFollowsSubTab('followers');
                setSearchParams({ tab: 'follows' });
              }}
              className="hover:opacity-80 transition"
            >
              <p className="text-base font-extrabold text-slate-900">{profileUser.followers_count || 120}</p>
              <p className="text-[11px] text-slate-500 font-semibold uppercase">Followers</p>
            </button>

            <button
              onClick={() => {
                setActiveTab('follows');
                setFollowsSubTab('following');
                setSearchParams({ tab: 'follows' });
              }}
              className="hover:opacity-80 transition"
            >
              <p className="text-base font-extrabold text-slate-900">{profileUser.following_count || 45}</p>
              <p className="text-[11px] text-slate-500 font-semibold uppercase">Following</p>
            </button>
          </div>

          {/* Edit Profile Action */}
          {isOwnProfile && (
            <button
              onClick={() => setEditModalOpen(true)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile Details</span>
            </button>
          )}
        </div>

        {/* Tabs: Posts / Follows */}
        <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1 shadow-sm">
          <button
            onClick={() => {
              setActiveTab('posts');
              setSearchParams({});
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'posts' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900:text-slate-200'
            }`}
          >
            Posts Carousel Grid ({userPosts.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('follows');
              setSearchParams({ tab: 'follows' });
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'follows' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900:text-slate-200'
            }`}
          >
            Followers & Following List
          </button>
        </div>

        {/* Posts Content */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <div key={post.id} className="relative group">
                  <PostCard post={post} />
                  {isOwnProfile && (
                    <div className="absolute top-4 right-16 flex items-center space-x-2 bg-white/90 backdrop-blur px-2 py-1 rounded-xl shadow-sm border border-slate-200 text-xs">
                      <button
                        onClick={() => archivePost(post.id)}
                        className="p-1 text-slate-500 hover:text-amber-500"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="p-1 text-slate-500 hover:text-rose-500"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl p-6">
                <Grid className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-sm">No posts published yet</p>
              </div>
            )}
          </div>
        )}

        {/* Follows Screen Tab (`profile/username?tab=follows`) */}
        {activeTab === 'follows' && (
          <div className="space-y-4">
            <div className="flex border-b border-slate-200 pb-2">
              <button
                onClick={() => setFollowsSubTab('followers')}
                className={`flex-1 py-2 text-xs font-bold transition border-b-2 ${
                  followsSubTab === 'followers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Followers
              </button>
              <button
                onClick={() => setFollowsSubTab('following')}
                className={`flex-1 py-2 text-xs font-bold transition border-b-2 ${
                  followsSubTab === 'following' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Following
              </button>
            </div>

            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => {
                const targetName = followsSubTab === 'followers' ? `FollowerGamer_${i}` : `FollowedPro_${i}`;
                const targetId = `u_gamer_${followsSubTab}_${i}`;
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Link to={`/profile/${targetName}`} className="flex items-center space-x-3 group min-w-0">
                      <img
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=gamer_${followsSubTab}_${i}`}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 group-hover:underline truncate">
                          @{targetName}
                        </p>
                        <p className="text-[10px] text-slate-500">Playxcade Gamer Member</p>
                      </div>
                    </Link>
                    <div className="flex items-center space-x-2">
                      <FollowButton targetUserId={targetId} targetUsername={targetName} size="sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Edit Profile</h3>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Username</span>
                  <span className="text-[10px] text-slate-400 font-normal">5-15 characters</span>
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-900 transition ${
                    editUsername && usernameValidation.warning
                      ? 'border-amber-400 focus:ring-amber-400'
                      : editUsername && usernameValidation.isValid
                      ? 'border-emerald-400 focus:ring-emerald-400'
                      : 'border-slate-200 focus:ring-indigo-500'
                  }`}
                  required
                />

                {/* Real-time username feedback */}
                {editUsername.trim() !== '' && usernameValidation.warning && (
                  <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] font-medium flex items-start space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{usernameValidation.warning}</span>
                  </div>
                )}

                {editUsername.trim() !== '' && usernameValidation.message && (
                  <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] font-medium flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{usernameValidation.message}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <p className="text-[10px] text-amber-600 font-medium">
                Note: Date of Birth cannot be modified after initial creation.
              </p>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                >
                  Save Profile
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
