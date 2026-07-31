import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Send, MessageSquare, Heart, Share2, CornerDownRight, Loader2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { BottomBar } from '../components/BottomBar';
import { PostCard } from '../components/PostCard';
import { IOSBackButton } from '../components/IOSBackButton';
import { useAuth } from '../context/AuthContext';
import { useMetaTags } from '../hooks/useMetaTags';
import { Comment } from '../types';

export const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { posts, user, fetchComments, addComment } = useAuth();

  const targetPost = posts.find((p) => p.id === postId);

  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useMetaTags({
    title: targetPost ? `Post by ${targetPost.author_username}` : 'Post Details',
    description: targetPost?.content || 'Check out this post on Playxcade.',
    image: targetPost?.media_url || targetPost?.author_avatar
  });

  useEffect(() => {
    if (postId) {
      setLoadingComments(true);
      fetchComments(postId)
        .then((fetched) => setComments(fetched))
        .finally(() => setLoadingComments(false));
    }
  }, [postId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user || !postId || submitting) return;

    setSubmitting(true);
    const added = await addComment(postId, commentText.trim());
    if (added) {
      setComments((prev) => [...prev, added]);
      setCommentText('');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20 sm:pb-8 transition-colors">
      <Navbar showLiveIcon={false} />

      <main className="max-w-xl mx-auto px-2 sm:px-4 pt-4">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center space-x-3 mb-4">
          <IOSBackButton onClick={() => navigate(-1)} label="Back" />
          <div>
            <h1 className="font-extrabold text-base text-slate-900">
              Post #{postId}
            </h1>
            <p className="text-[11px] text-slate-500">Playxcade Permanent Media Link</p>
          </div>
        </div>

        {targetPost ? (
          <div>
            <PostCard post={targetPost} />

            {/* Comments Section */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2 border-b border-slate-100 pb-3">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Comments ({comments.length})</span>
              </h3>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment to this post..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
                <button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{submitting ? 'Posting...' : 'Reply'}</span>
                </button>
              </form>

              {/* Comments List */}
              <div className="space-y-3 pt-2">
                {loadingComments ? (
                  <div className="flex items-center justify-center py-6 text-slate-400 space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-xs">Loading comments...</span>
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50/70">
                      <img
                        src={c.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.author_username}`}
                        alt={c.author_username}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <Link
                            to={`/profile/${c.author_username}`}
                            className="font-bold text-xs text-slate-900 hover:underline"
                          >
                            @{c.author_username}
                          </Link>
                          <span className="text-[10px] text-slate-400">{c.created_at}</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 space-y-3">
            <p className="font-bold text-lg text-slate-900">Post Not Found</p>
            <p className="text-xs text-slate-500">The 12-digit post #{postId} may have been deleted or archived.</p>
            <Link
              to="/feed"
              className="inline-block px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md mt-2"
            >
              Back to Social Feed
            </Link>
          </div>
        )}
      </main>

      <BottomBar />
    </div>
  );
};
