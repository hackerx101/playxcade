import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Send, MessageSquare, Heart, Share2, CornerDownRight, Loader2, Sparkles, CheckCircle2, Bot, AtSign } from 'lucide-react';
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

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showMentionMenu, setShowMentionMenu] = useState(false);

  // Scorpio AI 3-step summarizing flow state
  const [scorpioStep, setScorpioStep] = useState<number>(0); // 0 = idle, 1, 2, 3
  const [scorpioQueryText, setScorpioQueryText] = useState<string>('');

  useMetaTags({
    title: targetPost ? `Post by ${targetPost.author_username}` : 'Post Details',
    description: targetPost?.caption || 'Check out this post on Playxcade.',
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

  // Available handles for @ mentions
  const CANDIDATE_HANDLES = [
    { username: 'scorpio', name: 'Scorpio AI', desc: 'Assistant 🤖', isBot: true },
    { username: 'playxcade_system', name: 'Playxcade System', desc: 'Official Network Bot 💡', isBot: true },
    { username: 'Esports Carribean', name: 'Esports Carribean', desc: 'Tournament Partner 🔥', isBot: false },
    { username: 'garexcell', name: 'Garexcell Official', desc: 'Platform Admin ⚡', isBot: false },
  ];

  if (targetPost && !CANDIDATE_HANDLES.some((h) => h.username.toLowerCase() === targetPost.author_username.toLowerCase())) {
    CANDIDATE_HANDLES.push({
      username: targetPost.author_username,
      name: `@${targetPost.author_username}`,
      desc: 'Post Author',
      isBot: false
    });
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCommentText(val);

    const lastWord = val.split(' ').pop() || '';
    if (lastWord.startsWith('@')) {
      const q = lastWord.slice(1).toLowerCase();
      setMentionQuery(q);
      setShowMentionMenu(true);
    } else {
      setShowMentionMenu(false);
      setMentionQuery(null);
    }
  };

  const selectMention = (username: string) => {
    const words = commentText.split(' ');
    words.pop(); // remove incomplete @query
    const newText = [...words, `@${username}`].join(' ') + ' ';
    setCommentText(newText);
    setShowMentionMenu(false);
    setMentionQuery(null);
  };

  // Scorpio AI comment reply generator
  const generateScorpioReply = (postCaption: string, userQuestion: string): string => {
    const question = userQuestion.replace(/@scorpio/gi, '').trim();
    const cap = postCaption.toLowerCase();

    if (cap.includes('free fire') || cap.includes('bahamas') || cap.includes('jamaica')) {
      return `🤖 **Scorpio AI Post Insight**:\n\nRegarding this Free Fire Championship post, squad registrations open next week with a $15,000 cash prize pool across Bahamas 🇧🇸 and Jamaica 🇯🇲! ${question ? `In answer to "${question}": Make sure your team forms early and verifies player IDs in settings.` : 'Get your squad ready!'}`;
    }

    if (cap.includes('bitrate') || cap.includes('streaming') || cap.includes('nvenc')) {
      return `🤖 **Scorpio AI Tech Advice**:\n\nStream performance tip analyzed: Setting bitrate to 4500 kbps with hardware NVENC/VAAPI encoding provides 60fps 1080p stability on Playxcade live channels. ${question ? `Regarding your question: "${question}", test your upload latency before going live!` : ''}`;
    }

    if (cap.includes('dark mode') || cap.includes('health')) {
      return `🤖 **Scorpio AI Health Check**:\n\nGamer wellness is essential! Toggle dark mode in app settings and take 5-minute screen breaks to reduce digital eye strain during late night gaming sessions.`;
    }

    return `🤖 **Scorpio AI Contextual Reply**:\n\n${question ? `Great question regarding this post! Based on context: "${question}"` : 'Scorpio AI has summarized this post for the community.'}\n\n• **Post Context**: "${postCaption.slice(0, 100)}..."\n• **AI Analysis**: Verified by Scorpio AI Assistant. Ask me anything on [/ai](/ai)!`;
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user || !postId || submitting) return;

    const submittedText = commentText.trim();
    setSubmitting(true);

    const added = await addComment(postId, submittedText);
    if (added) {
      setComments((prev) => [...prev, added]);
      setCommentText('');
      setShowMentionMenu(false);

      // Check if user mentioned @scorpio
      if (/scorpio/i.test(submittedText)) {
        setScorpioQueryText(submittedText);
        setScorpioStep(1);

        setTimeout(() => setScorpioStep(2), 700);
        setTimeout(() => setScorpioStep(3), 1400);

        setTimeout(() => {
          setScorpioStep(0);
          const scorpioText = generateScorpioReply(targetPost?.caption || '', submittedText);
          const scorpioComment: Comment = {
            id: `comment_scorpio_${Date.now()}`,
            post_id: postId,
            user_id: 'scorpio_ai',
            author_username: 'scorpio',
            author_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=scorpio',
            content: scorpioText,
            created_at: 'Just now'
          };
          setComments((prev) => [...prev, scorpioComment]);
        }, 2100);
      }
    }
    setSubmitting(false);
  };

  // Format mentions inside comment body as clickable links
  const renderCommentContent = (text: string) => {
    const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const handle = part.slice(1);
        const isScorpio = handle.toLowerCase() === 'scorpio';
        return (
          <Link
            key={i}
            to={`/profile/${handle}`}
            className="text-indigo-600 font-bold hover:underline inline-flex items-center space-x-0.5 bg-indigo-50 px-1 rounded mx-0.5"
          >
            <span>{part}</span>
            {isScorpio && (
              <CheckCircle2 className="w-3 h-3 fill-amber-500 text-white stroke-[2] inline ml-0.5" />
            )}
          </Link>
        );
      }
      return part;
    });
  };

  const filteredMentions = CANDIDATE_HANDLES.filter((h) =>
    mentionQuery !== null ? h.username.toLowerCase().includes(mentionQuery) || h.name.toLowerCase().includes(mentionQuery) : true
  );

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
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 relative">
              <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Comments ({comments.length})</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Type @ to mention Scorpio AI</span>
              </h3>

              {/* Add Comment Input with Mention Dropdown */}
              <div className="relative">
                {showMentionMenu && filteredMentions.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in duration-150">
                    <div className="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Mention User or AI
                    </div>
                    {filteredMentions.map((item) => (
                      <button
                        key={item.username}
                        type="button"
                        onClick={() => selectMention(item.username)}
                        className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 flex items-center justify-between transition"
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            item.isBot ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' : 'bg-indigo-600'
                          }`}>
                            {item.isBot ? <Bot className="w-3.5 h-3.5" /> : item.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-900 flex items-center space-x-1">
                              <span>@{item.username}</span>
                              {item.isBot && <CheckCircle2 className="w-3 h-3 fill-amber-500 text-white" />}
                            </p>
                            <p className="text-[10px] text-slate-400">{item.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleAddComment} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={handleInputChange}
                    placeholder="Add a comment... (Type @scorpio to ask Scorpio AI)"
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
              </div>

              {/* 3-Step View Summarizing Card for Scorpio AI */}
              {scorpioStep > 0 && (
                <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl shadow-md border border-purple-500/40 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-white animate-spin" />
                      </div>
                      <span className="font-extrabold text-xs tracking-wide">Scorpio AI Summarizer</span>
                    </div>
                    <span className="text-[10px] font-bold bg-purple-700 px-2 py-0.5 rounded-full">
                      Step {scorpioStep}/3
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className={`flex items-center space-x-2 transition ${scorpioStep >= 1 ? 'text-purple-200 font-bold' : 'text-purple-400/60'}`}>
                      <div className={`w-2 h-2 rounded-full ${scorpioStep >= 1 ? 'bg-amber-400 animate-ping' : 'bg-purple-700'}`} />
                      <span>Step 1: Reading post caption & context...</span>
                    </div>

                    <div className={`flex items-center space-x-2 transition ${scorpioStep >= 2 ? 'text-purple-200 font-bold' : 'text-purple-400/60'}`}>
                      <div className={`w-2 h-2 rounded-full ${scorpioStep >= 2 ? 'bg-amber-400 animate-ping' : 'bg-purple-700'}`} />
                      <span>Step 2: Processing question with Scorpio AI...</span>
                    </div>

                    <div className={`flex items-center space-x-2 transition ${scorpioStep >= 3 ? 'text-purple-200 font-bold' : 'text-purple-400/60'}`}>
                      <div className={`w-2 h-2 rounded-full ${scorpioStep >= 3 ? 'bg-amber-400 animate-ping' : 'bg-purple-700'}`} />
                      <span>Step 3: Synthesizing intelligent answer based on post media & tags...</span>
                    </div>
                  </div>
                </div>
              )}

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
                  comments.map((c) => {
                    const isScorpioComment = c.author_username?.toLowerCase() === 'scorpio';
                    return (
                      <div
                        key={c.id}
                        className={`flex items-start space-x-3 p-3 rounded-xl transition ${
                          isScorpioComment ? 'bg-purple-50/80 border border-purple-200' : 'bg-slate-50/70'
                        }`}
                      >
                        <img
                          src={c.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.author_username}`}
                          alt={c.author_username}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <Link
                              to={`/profile/${c.author_username}`}
                              className="font-bold text-xs text-slate-900 hover:underline flex items-center space-x-1"
                            >
                              <span>@{c.author_username}</span>
                              {isScorpioComment && (
                                <span className="inline-flex items-center space-x-0.5 bg-purple-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>AI BOT</span>
                                </span>
                              )}
                            </Link>
                            <span className="text-[10px] text-slate-400">{c.created_at}</span>
                          </div>
                          <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                            {renderCommentContent(c.content)}
                          </div>
                        </div>
                      </div>
                    );
                  })
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
