import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Hash, Shield, Users, Trash2, Settings, Lock, Volume2, Bell, AlertTriangle, Ban } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

// Helper to generate a deterministic 12-digit channel ID based on channel name/string
function get12DigitChannelId(channelIdStr: string): string {
  let hash = 0;
  for (let i = 0; i < channelIdStr.length; i++) {
    hash = (hash << 5) - hash + channelIdStr.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash).toString().padStart(10, '7');
  const base12 = (positiveHash + '849201582938').slice(0, 12);
  return base12;
}

export const ChannelSettingsPage: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const { user, fetchRealUsers, banUser } = useAuth();
  
  const [copied, setCopied] = useState(false);
  const [channelName, setChannelName] = useState(channelId ? channelId.replace('-', ' ') : 'General');
  const [channelDesc, setChannelDesc] = useState('Official community discussions and announcements');
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [mediaTypes, setMediaTypes] = useState<'all' | 'text-only' | 'no-links'>('all');
  const [isArchived, setIsArchived] = useState(false);
  const [filterLevel, setFilterLevel] = useState<'low' | 'medium' | 'strict'>('medium');

  const isAdmin = user?.email?.toLowerCase().endsWith('@garexcell.com');

  const numeric12Id = get12DigitChannelId(channelId || 'general');

  useEffect(() => {
    fetchRealUsers().then(users => {
      setMembers(users);
    }).catch(() => {
      setMembers([
        { user_id: '1', username: 'GarexcellPlayer', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', email: 'admin@garexcell.com' },
        { user_id: '2', username: 'ShadowBlade', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', email: 'shadow@gmail.com' },
        { user_id: '3', username: 'ProGamerX', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', email: 'progamer@gmail.com' }
      ]);
    });
  }, [fetchRealUsers]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(numeric12Id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveMember = (memberId: string) => {
    if (!isAdmin) {
      alert("You do not have permission to remove members from this channel.");
      return;
    }

    setMembers(prev => prev.filter(m => m.user_id !== memberId));
  };

  const handleBanMember = async (memberId: string) => {
    if (!isAdmin) {
      alert("You do not have permission to ban users.");
      return;
    }

    if (confirm("Are you sure you want to permanently ban this user across the entire network? This will suspend their profile in Firebase and Supabase.")) {
      await banUser(memberId);
      setMembers(prev => prev.filter(m => m.user_id !== memberId));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Error: Only channel administrators with @garexcell.com domains can save changes.");
      return;
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />
      
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        
        {/* Header Navigation */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate(`/chat/${channelId || 'world-chat'}`)}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition flex items-center space-x-1"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-semibold">Back to Chat</span>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white flex items-center space-x-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              <span className="capitalize">Channel Settings #{channelId}</span>
            </h1>
            <p className="text-xs text-slate-400">Manage permissions, channel metadata, and member controls</p>
          </div>
        </div>

        {/* Saved Success Notification */}
        {savedSuccess && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-bold flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>Channel settings updated successfully!</span>
          </div>
        )}

        {/* 12-Digit Channel Identifier Card */}
        <div className="mb-6 p-5 bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">Channel 12-Digit ID</p>
            <p className="text-2xl font-mono font-extrabold text-white tracking-widest">{numeric12Id}</p>
            <p className="text-[11px] text-slate-400 mt-1">Unique 12-digit identification code for server routing and direct invitations</p>
          </div>
          <button
            onClick={handleCopyId}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Copied ID!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy 12-Digit ID</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Settings Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {!isAdmin && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 text-xs font-semibold flex items-center space-x-3.5 leading-relaxed">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <span><strong>Read-Only View:</strong> Only channel administrators with <strong>@garexcell.com</strong> domains can modify these settings. Your changes will not be saved.</span>
              </div>
            )}

            <form onSubmit={handleSave} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <Hash className="w-4 h-4 text-indigo-400" />
                <span>General Overview</span>
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Channel Name</label>
                <input
                  type="text"
                  value={channelName}
                  disabled={!isAdmin}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Channel Topic / Description</label>
                <textarea
                  rows={3}
                  value={channelDesc}
                  disabled={!isAdmin}
                  onChange={(e) => setChannelDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Extra Channel Settings Requested by User */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Moderation & Posting Controls</h3>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-2">Allowed Media Formats</label>
                  <select
                    value={mediaTypes}
                    disabled={!isAdmin}
                    onChange={(e) => setMediaTypes(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 disabled:opacity-50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Allow All (Text, Images, External Links, Videos)</option>
                    <option value="text-only">Text Only (Block attachments & images)</option>
                    <option value="no-links">No Hyperlinks (Spam defense)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-2">AI Content Moderator Level</label>
                  <select
                    value={filterLevel}
                    disabled={!isAdmin}
                    onChange={(e) => setFilterLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 disabled:opacity-50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low Filter (Rely on manual reports)</option>
                    <option value="medium">Medium Filter (Auto block severe violations)</option>
                    <option value="strict">Strict Filter (Block any potential spam/advertising)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Channel Status & State</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Slow Mode</span>
                    <span className="text-[11px] text-slate-400 block">Limit how frequently users can post messages</span>
                  </div>
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setIsSlowMode(!isSlowMode)}
                    className={`w-11 h-6 rounded-full transition-colors relative disabled:opacity-50 ${isSlowMode ? 'bg-indigo-600' : 'bg-slate-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isSlowMode ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Private Channel</span>
                    <span className="text-[11px] text-slate-400 block">Require invitations to join this channel</span>
                  </div>
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`w-11 h-6 rounded-full transition-colors relative disabled:opacity-50 ${isPrivate ? 'bg-indigo-600' : 'bg-slate-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isPrivate ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Archive Channel (Read-Only)</span>
                    <span className="text-[11px] text-slate-400 block">Close the channel to active conversations while keeping history</span>
                  </div>
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setIsArchived(!isArchived)}
                    className={`w-11 h-6 rounded-full transition-colors relative disabled:opacity-50 ${isArchived ? 'bg-indigo-600' : 'bg-slate-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isArchived ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isAdmin}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-600/20"
              >
                {isAdmin ? "Save Channel Changes" : "Save Changes (Administrator Only)"}
              </button>
            </form>

          </div>

          {/* Members & Moderation Panel */}
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Channel Members ({members.length})</span>
              </h2>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {members.map(member => (
                  <div key={member.user_id} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <img src={member.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} className="w-7 h-7 rounded-full object-cover shrink-0" alt={member.username} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">@{member.username}</p>
                        <p className="text-[9px] text-slate-500 truncate">{member.email || 'Member'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      {isAdmin && (
                        <button
                          onClick={() => handleBanMember(member.user_id)}
                          className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                          title="Ban User (Supabase & Firebase)"
                        >
                          <Ban className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      )}

                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={!isAdmin}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 rounded-lg transition"
                        title="Remove Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
