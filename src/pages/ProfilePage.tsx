import React, { useState } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Settings, Edit3, CheckCircle2, Users, Grid, Archive, Trash2, Calendar, ArrowLeft, AlertTriangle } from 'lucide-react';
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
  const { user, posts, updateProfile, deletePost, archivePost, followingIds } = useAuth();

  const isOwnProfile = !username || (user && user.username.toLowerCase() === username.toLowerCase());

  // Check if profile exists or is suspended
  const isSuspended = username?.toLowerCase() === 'suspended_user' || username?.toLowerCase() === 'banned';
  const isNotFound = username?.toLowerCase() === 'nonexistent' || username?.toLowerCase() === 'unknown';

  const profileUser = isOwnProfile
    ? user
    : isSuspended || isNotFound
    ? null
    : {
        id: 'u_' + username,
        user_id: 'u_' + username,
        username: username || 'Gamer',
        email: `${username}@garexcell.com`,
        bio: 'Competitive gamer & stream creator on Garexcell Network 🕹️',
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

  // Suspended view (avatar alone, username, and "This profile was suspended")
  if (isSuspended) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
        <Navbar showLiveIcon={true} />
        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
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
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-sm transition"
          >
            Go Back
          </button>
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
          <h1 className="text-2xl font-bold text-slate-900">
            This user is not found
          </h1>
          <p className="text-xs text-slate-500">
            The profile you are looking for does not exist or has been deleted.
          </p>
          <button
            onClick={() => navigate('/feed')}
            className="px-6 py-3 bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-sm transition"
          >
            Go Back
          </button>
        </main>
        <BottomBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 sm:pb-8 font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar showLiveIcon={true} />

      <main className="max-w-2xl mx-auto px-3 sm:px-6 pt-4 space-y-5">
        
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
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

                <p className="text-xs text-slate-500 font-medium">{profileUser.email}</p>

                {profileUser.dob && (
                  <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Born: {profileUser.dob}</span>
                  </p>
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
              <FollowButton
                targetUserId={profileUser.user_id}
                targetUsername={profileUser.username}
                size="md"
              />
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
              <p className="text-lg font-bold text-slate-900">{profileUser.followers_count || 840}</p>
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
              <p className="text-lg font-bold text-slate-900">{profileUser.following_count || 120}</p>
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
                setSearchParams({});
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content: Posts */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <div key={post.id} className="relative group">
                  <PostCard post={post} />
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <Grid className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-sm">No posts published yet</p>
              </div>
            )}
          </div>
        )}

        {/* Content: Media */}
        {activeTab === 'media' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {userPosts.filter(p => p.media_url).length > 0 ? (
              userPosts.filter(p => p.media_url).map((p) => (
                <div key={p.id} className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  <img src={p.media_url} alt="Media" className="w-full h-full object-cover" />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-xs text-slate-500">
                No media posts found.
              </div>
            )}
          </div>
        )}

        {/* Content: Replies */}
        {activeTab === 'replies' && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-xs text-slate-500">
            No thread replies recorded.
          </div>
        )}

        {/* Content: Reposts */}
        {activeTab === 'reposts' && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-xs text-slate-500">
            No reposts recorded.
          </div>
        )}

        {/* Follows List Tab (?tab=follows) */}
        {(activeTab === 'follows' || searchParams.get('tab') === 'follows') && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex border-b border-slate-100 pb-3">
              <button
                onClick={() => setFollowsSubTab('followers')}
                className={`flex-1 py-2 font-semibold text-xs rounded-xl transition ${
                  followsSubTab === 'followers' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Followers
              </button>
              <button
                onClick={() => setFollowsSubTab('following')}
                className={`flex-1 py-2 font-semibold text-xs rounded-xl transition ${
                  followsSubTab === 'following' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Following
              </button>
            </div>

            <div className="space-y-3">
              {[
                { username: 'Valkyrie99', bio: 'Tactical FPS Main', verified: true },
                { username: 'CyberGhost', bio: 'Streamer & Moderator', verified: true },
                { username: 'ApexHunter', bio: 'Ranked Predator', verified: false },
                { username: 'NeoMatrix', bio: 'Retro RPG collector', verified: false },
              ].map((u) => (
                <Link
                  key={u.username}
                  to={`/profile/${u.username}`}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between transition"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                      alt={u.username}
                      className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                    />
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="font-bold text-xs text-slate-900">@{u.username}</span>
                        {u.verified && (
                          <CheckCircle2 className="w-3.5 h-3.5 fill-amber-500 text-white stroke-[2]" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{u.bio}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600">View</span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
          <form onSubmit={handleSaveProfile} className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Edit Profile Details</h3>
            
            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl">
                {editError}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">Username Handle</label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">Bio & Tagline</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <BottomBar />
    </div>
  );
};
