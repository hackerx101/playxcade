import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Radio, Flame, Sparkles, Filter } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { BottomBar } from '../components/BottomBar';
import { PostCard } from '../components/PostCard';
import { CreatePostModal } from '../components/CreatePostModal';
import { StartStreamModal } from '../components/StartStreamModal';
import { MaintenanceBanner } from '../components/MaintenanceBanner';
import { InstallBanner } from '../components/InstallBanner';
import { useAuth } from '../context/AuthContext';
import { useMetaTags } from '../hooks/useMetaTags';

export const FeedPage: React.FC = () => {
  useMetaTags({
    title: 'Feed & Streams',
    description: 'Explore live gaming feeds, community clips, and esports highlights on Playxcade.'
  });

  const { posts, user } = useAuth();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [streamModalOpen, setStreamModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Only force setup profile if user explicitly needs profile setup (e.g., SSO missing handle)
  const needsOnboarding = user && user.needsProfileSetup === true;

  const categories = ['All', 'Warlands', 'Apex Overdrive', 'Mythic Clash', 'Gaming'];

  const filteredPosts = posts.filter((p) => {
    if (p.is_archived) return false;
    if (categoryFilter === 'All') return true;
    return p.category === categoryFilter || (p.tags && p.tags.includes(categoryFilter));
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20 sm:pb-8 transition-colors">
      <MaintenanceBanner />
      <InstallBanner />
      <Navbar onStartStream={() => setStreamModalOpen(true)} showLiveIcon={true} />

      {/* Main Feed Container */}
      <main className="max-w-xl mx-auto px-2 sm:px-4 pt-4">
        
        {/* Category Pills Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition shadow-sm ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-200:bg-slate-700 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Create Post Area */}
        <div className="mb-5 flex items-center space-x-3 py-2 border-b border-slate-200">
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt="User avatar"
            className="w-10 h-10 rounded-full object-cover border border-slate-200"
          />
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex-1 text-left px-4 py-2.5 bg-slate-50 hover:bg-slate-100:bg-slate-750 text-slate-500 text-xs font-medium rounded-xl border border-slate-200 transition"
          >
            What is happening in your game? Post clips, text, or hashtags...
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition"
            title="Create Post"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Post List */}
        <div className="space-y-4">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl p-6">
              <Sparkles className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
              <p className="font-bold text-slate-800">No posts in this category yet</p>
              <p className="text-xs text-slate-500 mt-1">Be the first gamer to share something!</p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button on Mobile */}
      <button
        onClick={() => setCreateModalOpen(true)}
        className="fixed bottom-20 right-4 sm:hidden z-40 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <CreatePostModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
      <StartStreamModal isOpen={streamModalOpen} onClose={() => setStreamModalOpen(false)} />
      
      {needsOnboarding && (
        <Navigate to="/setup-profile" replace />
      )}

      <BottomBar />
    </div>
  );
};
