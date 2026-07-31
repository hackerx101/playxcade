import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Hash, Video, Phone, Users, Shield, Smile, MessageSquare, ChevronDown, Ban, Search, Gift, Wand2, Sparkles, Mic, Trash2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { BottomBar } from '../components/BottomBar';
import { useAuth } from '../context/AuthContext';
import { CallScreen } from '../components/CallScreen';
import { IncomingCallModal } from '../components/IncomingCallModal';

const DEFAULT_CHANNELS = [
  { id: 'world-chat', name: 'World Chat', desc: 'Global community chat', type: 'text' },
  { id: 'general', name: 'general', desc: 'Community wide discussion', type: 'text' },
  { id: 'introductions', name: 'introductions', desc: 'Introduce yourself to the community', type: 'text' },
  { id: 'gaming', name: 'gaming', desc: 'Looking for group & gaming talk', type: 'text' },
  { id: 'support', name: 'support', desc: 'Help & moderation', type: 'text' },
  { id: 'lounge', name: 'Voice Lounge', desc: 'Casual voice chat', type: 'voice' },
  { id: 'squad', name: 'Squad Up', desc: 'Looking for group voice', type: 'voice' },
];

const POPULAR_EMOJIS = ['😊', '😂', '🔥', '🎮', '👍', '🚀', '❤️', '💯', '🙏', '🙌', '⚡', '🎉', '🕹️', '🏆', '😎', '🍿', '👏', '💬', '💙', '💥'];

export const ChatPage: React.FC = () => {
  const { messages, sendMessage, fetchMessages, deleteMessage, editMessage, reportMessage, blockUser, user, chats } = useAuth();
  const { username: roomParam } = useParams<{ username: string }>(); // re-using the param name but it's actually room
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>('general');
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeCall, setActiveCall] = useState<'video' | 'voice' | null>(null);
  const [isInitiator, setIsInitiator] = useState(true);
  const [incomingCall, setIncomingCall] = useState<{ type: 'video' | 'voice', caller: string, roomId: string } | null>(null);
  const [mutedUsers, setMutedUsers] = useState<string[]>([]);
  const [showOptionsId, setShowOptionsId] = useState<string | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState<{id: string, username: string} | null>(null);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice'>('text');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Cloudflare App ID provided by user
  const CLOUDFLARE_APP_ID = 'ce6166e0362af275b7fce968ceb80ba5';

  useEffect(() => {
    if (roomParam) {
      const roomExists = channels.find(c => c.id === roomParam);
      setSelectedRoom(roomExists ? roomExists.id : 'general');
    } else {
      navigate('/chat/general', { replace: true });
    }
  }, [roomParam, navigate]);

  useEffect(() => {
    if (selectedRoom) {
      // Room prefix to avoid collision with old private chats
      fetchMessages(`room_${selectedRoom}`);
    }
  }, [selectedRoom, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedRoom]);

  const activeChannel = channels.find(c => c.id === selectedRoom) || channels[0];
  const roomMessages = messages.filter(m => m.chat_id === `room_${selectedRoom}` && !mutedUsers.includes(m.sender_id || ''));
  
  const filteredMessages = roomMessages.filter(m => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const dateStr = new Date(m.created_at).toLocaleDateString().toLowerCase();
    const senderStr = (m.sender_username || '').toLowerCase();
    return m.text.toLowerCase().includes(lowerQuery) || senderStr.includes(lowerQuery) || dateStr.includes(lowerQuery);
  });

  // Simulated typing effect for immersion
  useEffect(() => {
    if (inputText.length > 0) {
      if (Math.random() > 0.8 && !isTyping) {
        setIsTyping("GamingPro22");
        setTimeout(() => setIsTyping(null), 3000);
      }
    } else {
      setIsTyping(null);
    }
  }, [inputText, isTyping]);

  // Detect incoming calls
  useEffect(() => {
    if (roomMessages.length > 0 && !activeCall) {
      const lastMsg = roomMessages[roomMessages.length - 1];
      if (lastMsg.sender_id !== user?.user_id && lastMsg.text.startsWith('[CALL_STARTED:')) {
        const timeDiff = new Date().getTime() - new Date(lastMsg.created_at).getTime();
        if (timeDiff < 20000) { // Call request is valid for 20 seconds
          const match = lastMsg.text.match(/\[CALL_STARTED:(video|voice)\]/);
          if (match && !incomingCall) {
            setIncomingCall({
              type: match[1] as 'video' | 'voice',
              caller: lastMsg.sender_username || 'Someone',
              roomId: selectedRoom
            });
          }
        }
      }
    }
  }, [roomMessages, user, activeCall, selectedRoom, incomingCall]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedRoom) return;

    // Basic spam & profanity check
    const recentMsgs = roomMessages.filter(m => m.sender_id === user?.user_id && new Date().getTime() - new Date(m.created_at).getTime() < 10000);
    if (recentMsgs.length > 4) {
      alert("Please slow down. You are sending messages too quickly.");
      return;
    }
    const inappropriateWords = ['abuse', 'hate', 'racist', 'slur'];
    const hasBadWord = inappropriateWords.some(word => inputText.toLowerCase().includes(word));
    if (hasBadWord) {
      alert("Your message contains inappropriate content and cannot be sent.");
      return;
    }

    sendMessage(`room_${selectedRoom}`, inputText, user?.username);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const insertEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const startCall = (type: 'video' | 'voice') => {
    setIsInitiator(true);
    setActiveCall(type);
    sendMessage(`room_${selectedRoom}`, `[CALL_STARTED:${type}]`, user?.username);
  };

  const acceptCall = () => {
    if (incomingCall) {
      setIsInitiator(false);
      setActiveCall(incomingCall.type);
      setIncomingCall(null);
    }
  };

  const declineCall = () => {
    setIncomingCall(null);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-white text-slate-900 font-sans overflow-hidden">
      <Navbar showLiveIcon={true} />

      {incomingCall && !activeCall && (
        <IncomingCallModal
          callerName={incomingCall.caller}
          channelName={channels.find(c => c.id === incomingCall.roomId)?.name || 'unknown'}
          type={incomingCall.type}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}

      {activeCall && (
        <CallScreen 
          type={activeCall} 
          channelName={activeChannel.name} 
          onEndCall={() => setActiveCall(null)} 
          appId={CLOUDFLARE_APP_ID}
          isInitiator={isInitiator}
        />
      )}

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col md:flex-row relative overflow-hidden pb-[60px] sm:pb-0">
        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && (
          <div 
            className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Sidebar - Channels */}
        <div className={`fixed inset-y-0 left-0 z-50 md:relative w-[280px] md:w-64 lg:w-72 bg-slate-950 border-r border-slate-800 flex-col shrink-0 h-full transition-transform transform ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <h2 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <span>Servers</span>
            </h2>
            <button 
              onClick={() => setShowCreateChannel(true)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
              title="Create Channel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase px-3 py-2">Text Channels</p>
            {channels.filter(c => c.type === 'text' || !c.type).map((channel) => (
              <div key={channel.id} className="group flex items-center pr-2">
                <button
                  onClick={() => {
                    navigate(`/chat/${channel.id}`);
                    setShowMobileSidebar(false);
                  }}
                  className={`flex-1 flex items-center space-x-3 px-3 py-2 rounded-lg transition text-left ${
                    selectedRoom === channel.id
                      ? 'bg-indigo-600/10 text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-300'
                  }`}
                >
                  <Hash className="w-4 h-4 shrink-0" />
                  <span className="font-semibold text-sm truncate">{channel.name}</span>
                </button>
                <div className='hidden group-hover:flex items-center space-x-1'>
                    <button onClick={() => alert('Invite link copied!')} title='Invite' className='text-slate-500 hover:text-white'><Users className='w-3 h-3'/></button>
                    <button onClick={() => navigate('/settings')} title='Settings' className='text-slate-500 hover:text-white'><Sparkles className='w-3 h-3'/></button>
                </div>
              </div>
            ))}
            
            <p className="text-[10px] font-bold text-slate-500 uppercase px-3 py-2 mt-4 flex justify-between items-center">
                <span>Voice Channels</span>
                <button onClick={() => {
                    const r = joinRandomChat();
                    if(r) navigate(`/chat/${r}`);
                }} className='text-[9px] bg-slate-800 text-white px-2 py-0.5 rounded'>Join Random</button>
            </p>
            {channels.filter(c => c.type === 'voice').map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  setSelectedRoom(channel.id);
                  setShowMobileSidebar(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition text-left ${
                  selectedRoom === channel.id
                    ? 'bg-indigo-600/10 text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-300'
                }`}
              >
                <Phone className="w-4 h-4 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{channel.name}</p>
                </div>
                {selectedRoom === channel.id && (
                    <div className='bg-rose-500 text-white text-[9px] px-1.5 rounded-full'>1</div>
                )}
              </button>
            ))}

            <p className="text-[10px] font-bold text-slate-500 uppercase px-3 py-2 mt-4">Direct Messages</p>
            {chats.map(chat => (
                <button key={chat.id} onClick={() => alert('DM navigation not implemented')} className="w-full flex items-center space-x-3 px-3 py-2 text-slate-400 hover:bg-slate-900 rounded-lg">
                    <div className="relative">
                        <img src={chat.participant_avatar} className="w-8 h-8 rounded-full" alt={chat.participant_username} />
                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${onlineUsers[chat.participant_id] === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                    </div>
                    <span className="text-sm font-semibold text-slate-300">{chat.participant_username}</span>
                </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-slate-900 flex flex-col relative h-full min-w-0">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-950 flex flex-col shadow-sm z-10 shrink-0">
            <div className="flex items-center justify-between min-w-0">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="md:hidden">
                  <button onClick={() => setShowMobileSidebar(true)} className="p-2 -ml-2 text-slate-400 hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                  </button>
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center space-x-1.5">
                    <Hash className="w-5 h-5 text-slate-500" />
                    <span>{activeChannel.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 truncate">{activeChannel.desc}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition flex items-center space-x-2"
                  title="Search Messages"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startCall('voice')}
                  className="p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition flex items-center space-x-2"
                  title="Voice Call"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-bold">Voice</span>
                </button>
                <button
                  onClick={() => startCall('video')}
                  className="p-2 sm:px-3 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center space-x-2"
                  title="Video Call"
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-bold">Video</span>
                </button>
                <div className="hidden sm:flex items-center space-x-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 ml-2">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">Live</span>
                </div>
              </div>
            </div>
            
            {/* Search Bar Dropdown */}
            {showSearch && (
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by keyword, sender, or timestamp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {activeChannel.type === 'voice' ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                    <div className="p-6 bg-slate-800 rounded-full text-indigo-400">
                        <Phone className="w-12 h-12" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Voice Channel: {activeChannel.name}</h2>
                    <p className="text-slate-400 max-w-sm">You are in a voice channel. Click below to start a call.</p>
                    <button onClick={() => startCall('voice')} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold transition">Start Voice Call</button>
                    <button onClick={() => startCall('video')} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold transition">Start Video Call</button>
                </div>
            ) : (
                <>
                    <div className="pb-8 pt-4">
                      <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                        <Hash className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h2 className="text-3xl font-extrabold text-white mb-2">Welcome to #{activeChannel.name}!</h2>
                      <p className="text-slate-400">This is the start of the #{activeChannel.name} channel. {activeChannel.desc}</p>
                    </div>

                    {filteredMessages.map((msg, i) => {
                    // ... existing message rendering ...
                    const isMine = msg.sender_id === user?.user_id;
                    const prevMsg = i > 0 ? filteredMessages[i - 1] : null;
                    const isSameSender = prevMsg?.sender_id === msg.sender_id;
                    const showHeader = !isSameSender;
                    
                    const isCallMsg = msg.text.startsWith('[CALL_STARTED:');
                    if (isCallMsg) {
                        const callType = msg.text.includes('video') ? 'video' : 'voice';
                        return (
                        <div key={msg.id} className="flex justify-center my-4">
                            <div className="bg-slate-800/80 border border-slate-700/50 rounded-full px-4 py-1.5 flex items-center space-x-2 text-xs text-slate-300">
                            {callType === 'video' ? <Video className="w-3.5 h-3.5 text-indigo-400" /> : <Phone className="w-3.5 h-3.5 text-emerald-400" />}
                            <span><strong className="text-slate-100">{msg.sender_username || 'Someone'}</strong> started a {callType} call.</span>
                            </div>
                        </div>
                        );
                    }

                    return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}>
                        <div className={`max-w-[85%] sm:max-w-2xl ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                            
                            {showHeader && (
                            <div className={`flex items-baseline space-x-2 mb-1 relative ${isMine ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                <span 
                                onClick={() => !isMine && setShowOptionsId(showOptionsId === msg.id ? null : msg.id)}
                                className={`text-xs font-bold ${isMine ? 'text-indigo-400' : 'text-slate-300 cursor-pointer hover:underline'}`}
                                title={!isMine ? "Click to block user" : undefined}
                                >
                                {isMine ? user?.username : (msg.sender_username || msg.sender_id || 'Unknown')}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>

                                {/* Moderation Menu */}
                                {showOptionsId === msg.id && !isMine && (
                                <div className="absolute top-6 left-0 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1">
                                    <button
                                    onClick={() => {
                                        const reason = prompt("Why are you reporting this message?");
                                        if (reason) reportMessage(msg.id, reason);
                                        setShowOptionsId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-200 flex items-center space-x-2"
                                    >
                                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Report Message</span>
                                    </button>
                                    <button
                                    onClick={() => {
                                        setUserToBlock({id: msg.sender_id || '', username: msg.sender_username || 'Unknown'});
                                        setBlockModalOpen(true);
                                        setShowOptionsId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-200 flex items-center space-x-2"
                                    >
                                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Block User</span>
                                    </button>
                                    <button
                                    onClick={() => setShowOptionsId(null)}
                                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-400"
                                    >
                                    Cancel
                                    </button>
                                </div>
                                )}
                            </div>
                            )}
                            
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative group/msg ${
                            isMine 
                                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                                : 'bg-slate-800 text-slate-100 rounded-tl-sm'
                            }`}>
                            <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                            {msg.edited && <span className="text-[10px] text-white/70 italic block mt-1">(edited)</span>}
                            {isMine && (
                                <div className="absolute top-1/2 -translate-y-1/2 -left-12 flex flex-col gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                <button
                                    onClick={() => {
                                    const newText = prompt("Edit your message:", msg.text);
                                    if (newText !== null && newText !== msg.text) editMessage(msg.id, newText, `room_${selectedRoom}`);
                                    }}
                                    className="p-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-sm"
                                    title="Edit Message"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => deleteMessage(msg.id, `room_${selectedRoom}`)}
                                    className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-sm"
                                    title="Delete Message"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                </div>
                            )}
                            </div>
                        </div>
                        </div>
                    );
                    })}
                    {/* Typing Indicator */}
                    {isTyping && (
                    <div className="px-4 pt-2 text-[11px] text-slate-400 flex items-center space-x-2">
                        <span className="flex space-x-1">
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </span>
                        <span><strong>{isTyping}</strong> is typing...</span>
                    </div>
                    )}
                    <div ref={messagesEndRef} />
                </>
            )}
          </div>
          </div>

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="absolute bottom-20 left-4 w-72 sm:w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl z-10 p-4 space-y-3">
              <input
                type="text"
                placeholder="Search emoji..."
                onChange={(e) => {
                    // Simple search implementation
                    const query = e.target.value.toLowerCase();
                    // Implementation note: a full list would require a library or a static JSON
                    // Using popular emojis + filter as a base
                }}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm"
              />
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-64 overflow-y-auto">
                {POPULAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="text-xl p-2 hover:bg-slate-100 rounded-lg transition text-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-slate-900 shrink-0">
            <form onSubmit={handleSend} className="relative">
              <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all overflow-hidden pr-2">
                
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-3 transition ${showEmojiPicker ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'}`}
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
                  placeholder={`Message #${activeChannel.name}...`}
                  className="flex-1 py-3.5 bg-transparent border-none focus:ring-0 text-sm text-slate-100 outline-none placeholder-slate-500"
                  autoFocus
                />
                
                {!inputText.trim() ? (
                  <div className="flex items-center space-x-1 pr-2">
                    <button type="button" className="p-2 text-slate-400 hover:text-slate-300 transition" title="Gift"><Gift className="w-5 h-5" /></button>
                    <button type="button" className="p-2 text-slate-400 hover:text-slate-300 transition" title="AI Summary" onClick={async () => {
                      const recentMessages = filteredMessages.slice(-5);
                      const res = await fetch('/api/gemini/summarize', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ messages: recentMessages })
                      });
                      const data = await res.json();
                      alert(data.summary || 'No summary available.');
                    }}><Sparkles className="w-5 h-5" /></button>
                    <button type="button" className="p-2 text-slate-400 hover:text-slate-300 transition" title="Magic Wand"><Wand2 className="w-5 h-5" /></button>
                    <button type="button" className="p-2 text-slate-400 hover:text-slate-300 transition" title="Voice Note"><Mic className="w-5 h-5" /></button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition ml-2 mr-2 shrink-0 flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">Create Channel</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Channel Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewChannelType('text')}
                    className={`py-2 px-3 flex flex-col items-center justify-center rounded-xl border ${newChannelType === 'text' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    <Hash className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">Text</span>
                  </button>
                  <button
                    onClick={() => setNewChannelType('voice')}
                    className={`py-2 px-3 flex flex-col items-center justify-center rounded-xl border ${newChannelType === 'voice' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    <Phone className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">Voice</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Channel Name</label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="new-channel"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowCreateChannel(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  disabled={!newChannelName.trim()}
                  onClick={() => {
                    if (newChannelName.trim()) {
                      const newChannel = {
                        id: newChannelName.trim(),
                        name: newChannelName.trim(),
                        desc: 'Custom user channel',
                        type: newChannelType
                      };
                      setChannels(prev => [...prev, newChannel]);
                      setShowCreateChannel(false);
                      setNewChannelName('');
                      navigate(`/chat/${newChannel.id}`);
                    }
                  }}
                  className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-xl transition shadow-lg shadow-indigo-600/20"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {blockModalOpen && userToBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full space-y-4">
            <h3 className="font-bold text-lg text-slate-950">Block @{userToBlock.username}?</h3>
            <p className="text-sm text-slate-600">Blocking this user will prevent them from messaging you and hide their messages in this chat.</p>
            <div className="flex gap-2">
              <button onClick={() => setBlockModalOpen(false)} className="flex-1 py-2 rounded-xl bg-slate-100 font-bold text-sm">Cancel</button>
              <button onClick={() => {
                blockUser(userToBlock.id);
                setBlockModalOpen(false);
              }} className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold text-sm">Block</button>
            </div>
          </div>
        </div>
      )}
      <BottomBar />
    </div>
  );
};
