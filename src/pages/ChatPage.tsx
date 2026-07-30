import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Search, MessageSquare, CheckCircle2, Plus, Smile, X } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { BottomBar } from '../components/BottomBar';
import { IOSBackButton } from '../components/IOSBackButton';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';

const POPULAR_EMOJIS = ['😊', '😂', '🔥', '🎮', '👍', '🚀', '❤️', '💯', '🙏', '🙌', '⚡', '🎉', '🕹️', '🏆', '😎', '🍿', '👏', '💬', '💙', '💥'];

export const ChatPage: React.FC = () => {
  const { chats, messages, sendMessage, fetchMessages, user, posts, fetchRealUsers } = useAuth();
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedChatId, setSelectedChatId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [realUsers, setRealUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load real registered users from Firestore database
  useEffect(() => {
    let isMounted = true;
    const loadUsers = async () => {
      setLoadingUsers(true);
      const list = await fetchRealUsers();
      if (isMounted) {
        const userMap = new Map<string, UserProfile>();
        list.forEach((u) => userMap.set(u.username.toLowerCase(), u));

        posts.forEach((p) => {
          if (p.author_username && (!user || p.author_username.toLowerCase() !== user.username.toLowerCase())) {
            if (!userMap.has(p.author_username.toLowerCase())) {
              userMap.set(p.author_username.toLowerCase(), {
                id: p.author_username,
                user_id: p.author_username,
                username: p.author_username,
                email: '',
                bio: 'Playxcade Community Creator',
                avatar_url: p.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.author_username}`,
                IsDeleted: false,
                account_status: 'active',
                appeal_status: 'none',
                IsIdentityVerify: !!p.author_is_verified,
                is_private: false,
                created_at: new Date().toISOString()
              });
            }
          }
        });

        if (user && user.username) {
          userMap.delete(user.username.toLowerCase());
        }

        setRealUsers(Array.from(userMap.values()));
        setLoadingUsers(false);
      }
    };
    loadUsers();
    return () => {
      isMounted = false;
    };
  }, [user, posts]);

  const filteredUsers = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return realUsers;
    return realUsers.filter(
      (u) => u.username.toLowerCase().includes(query) || (u.bio && u.bio.toLowerCase().includes(query))
    );
  }, [realUsers, searchQuery]);

  // Handle URL route synchronization
  useEffect(() => {
    if (username) {
      const existingChat = chats.find(
        (c) => c.participant_username.toLowerCase() === username.toLowerCase()
      );
      if (existingChat) {
        setSelectedChatId(existingChat.id);
      } else {
        setSelectedChatId('new_' + username);
      }
    } else {
      setSelectedChatId('');
    }
  }, [username, chats]);

  useEffect(() => {
    if (selectedChatId && !selectedChatId.startsWith('new_')) {
      fetchMessages(selectedChatId);
    }
  }, [selectedChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChatId]);

  const activeChat = selectedChatId.startsWith('new_')
    ? {
        id: selectedChatId,
        participant_id: username || '',
        participant_username: username || '',
        participant_avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        last_message: '',
        updated_at: new Date().toISOString()
      }
    : chats.find((c) => c.id === selectedChatId);

  const chatMessages = messages.filter((m) => m.chat_id === selectedChatId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChatId) return;

    const finalChatId = selectedChatId.startsWith('new_') ? 'chat_' + Date.now() : selectedChatId;
    sendMessage(finalChatId, inputText, activeChat?.participant_username);

    if (selectedChatId.startsWith('new_')) {
      navigate(`/chat/${activeChat?.participant_username}`);
      setSelectedChatId(finalChatId);
    }

    setInputText('');
    setShowEmojiPicker(false);
  };

  const startChatWithUser = (targetUsername: string) => {
    navigate(`/chat/${targetUsername}`);
    setShowSearchModal(false);
    setSearchQuery('');
  };

  const insertEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <Navbar showLiveIcon={true} />

      {/* Main Container - Height tuned so bottom message bar is clear of navbar and bottom bar */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-6 py-2 sm:py-3 flex flex-col md:flex-row gap-3 h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] overflow-hidden">
        
        {/* Chat List Screen (Visible on Desktop OR when no active message thread selected on Mobile) */}
        <div
          className={`w-full md:w-80 lg:w-96 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0 h-full ${
            username ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900">Direct Messages</h2>
                  <p className="text-[10px] text-slate-400 font-medium">Real-time Encrypted Chats</p>
                </div>
              </div>
              <button
                onClick={() => setShowSearchModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-sm"
                title="New Chat"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Chat</span>
              </button>
            </div>

            {/* User Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search community users..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Chat Threads or Filtered Real Users */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 p-2 space-y-1">
            {searchQuery.trim() !== '' ? (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">Matching Registered Users</p>
                {filteredUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No real users found for "{searchQuery}"</p>
                ) : (
                  filteredUsers.map((u) => (
                    <div
                      key={u.username}
                      className="p-2.5 hover:bg-slate-50 rounded-xl flex items-center justify-between transition cursor-pointer"
                      onClick={() => startChatWithUser(u.username)}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <img
                          src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                          alt={u.username}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1">
                            <span className="font-bold text-xs text-slate-900 truncate">@{u.username}</span>
                            {u.IsIdentityVerify && (
                              <CheckCircle2 className="w-3.5 h-3.5 fill-amber-500 text-white stroke-[2] shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{u.bio || 'Playxcade member'}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startChatWithUser(u.username);
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[11px] rounded-lg transition shrink-0 ml-2"
                      >
                        Message
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 text-slate-400 space-y-3 p-4 text-center">
                <MessageSquare className="w-9 h-9 text-indigo-300" />
                <div>
                  <p className="text-xs font-bold text-slate-700">No active chat threads</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Search for registered users to start a conversation.</p>
                </div>
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="px-3.5 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-indigo-700 transition"
                >
                  Find Users to Message
                </button>
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setSelectedChatId(chat.id);
                    navigate(`/chat/${chat.participant_username}`);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl transition text-left ${
                    selectedChatId === chat.id
                      ? 'bg-indigo-50 border border-indigo-200 shadow-sm'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <img
                    src={chat.participant_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${chat.participant_username}`}
                    alt={chat.participant_username}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs text-slate-900 truncate">
                        @{chat.participant_username}
                      </p>
                      <span className="text-[9px] text-slate-400">
                        {chat.updated_at ? new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{chat.last_message || 'Tap to message...'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message Screen (Visible on Desktop OR when an active username thread is selected on Mobile) */}
        <div
          className={`flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden h-full relative ${
            !username ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeChat ? (
            <>
              {/* Message Header with iOS Black Back Button */}
              <div className="p-3 sm:p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="md:hidden">
                    <IOSBackButton to="/chat" label="Chats" />
                  </div>
                  <img
                    src={activeChat.participant_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeChat.participant_username}`}
                    alt={activeChat.participant_username}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                  />
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center space-x-1">
                      <span>@{activeChat.participant_username}</span>
                    </h3>
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      <span>Active now</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/profile/${activeChat.participant_username}`)}
                  className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-sm transition"
                >
                  View Profile
                </button>
              </div>

              {/* Message Stream */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-slate-50/40">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">Start of conversation with @{activeChat.participant_username}</p>
                    <p className="text-[11px] text-slate-400">Send a greeting message.</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMine = msg.sender_id === user?.user_id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-md px-3.5 py-2.5 rounded-2xl text-xs font-medium shadow-sm leading-relaxed ${
                            isMine
                              ? 'bg-indigo-600 text-white rounded-br-none'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                          }`}
                        >
                          <p className="break-words">{msg.text}</p>
                          <p className={`text-[9px] mt-1 text-right ${isMine ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div className="p-2 sm:p-3 bg-white border-t border-slate-200 border-b border-slate-100 grid grid-cols-10 gap-1 animate-in fade-in duration-100 z-10 shrink-0">
                  {POPULAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="text-base sm:text-lg p-1 hover:bg-slate-100 rounded-lg transition text-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Message Input Bar - ALWAYS pinned & clearly visible at bottom of active chat container */}
              <form
                onSubmit={handleSend}
                className="p-2 sm:p-3 border-t border-slate-200 bg-white shrink-0 shadow-inner z-20"
              >
                <div className="flex items-center space-x-2 bg-slate-50 p-1.5 sm:p-2 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-1.5 rounded-xl transition shrink-0 ${
                      showEmojiPicker ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-600'
                    }`}
                    title="Insert Emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    placeholder={`Message @${activeChat.participant_username}...`}
                    className="flex-1 px-2 py-1 bg-transparent border-none focus:ring-0 text-xs font-medium text-slate-900 outline-none min-w-0"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl shadow-sm transition font-bold text-xs flex items-center space-x-1 shrink-0"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Direct Message Center</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">Select a real registered user to start messaging.</p>
              </div>
              <button
                onClick={() => setShowSearchModal(true)}
                className="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 shadow-sm transition"
              >
                Search Users to Message
              </button>
            </div>
          )}
        </div>
      </main>

      {/* User Search & Messaging Selection Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Search User to Message</h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registered username..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Registered Users</p>
              {loadingUsers ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading registered users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No registered users found matching "{searchQuery}".
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.username}
                    onClick={() => startChatWithUser(u.username)}
                    className="p-3 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-100 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                        alt={u.username}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1">
                          <span className="font-bold text-xs text-slate-900 truncate">@{u.username}</span>
                          {u.IsIdentityVerify && (
                            <CheckCircle2 className="w-3.5 h-3.5 fill-amber-500 text-white stroke-[2] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{u.bio || 'Playxcade user'}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startChatWithUser(u.username);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0 ml-2"
                    >
                      Message
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowSearchModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomBar />
    </div>
  );
};
