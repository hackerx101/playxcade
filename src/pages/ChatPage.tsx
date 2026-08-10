import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, Hash, Video, Phone, Users, Shield, Smile, MessageSquare, ChevronDown, Ban, Search, Gift, Wand2, Sparkles, Mic, Trash2, Settings, Globe, Shuffle, CheckCircle2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { BottomBar } from '../components/BottomBar';
import { useAuth } from '../context/AuthContext';
import { CallScreen } from '../components/CallScreen';
import { IncomingCallModal } from '../components/IncomingCallModal';
import { UpgradePromptModal } from '../components/UpgradePromptModal';
import { UserProfile } from '../types';

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
  const { messages, sendMessage, fetchMessages, deleteMessage, editMessage, reportMessage, blockUser, user, chats, onlineUsers, joinRandomChat, fetchRealUsers, unreadCountsBySender, markChatAsRead, isSyncEnabled, toggleSync, isUpgradePromptOpen, setUpgradePromptOpen } = useAuth();
  const { username: roomParam } = useParams<{ username: string }>(); 
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>('world-chat');
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeCall, setActiveCall] = useState<'video' | 'voice' | null>(null);
  const [isInitiator, setIsInitiator] = useState(true);
  const [incomingCall, setIncomingCall] = useState<{ type: 'video' | 'voice', caller: string, roomId: string, offer?: RTCSessionDescriptionInit } | null>(null);
  const [incomingOffer, setIncomingOffer] = useState<RTCSessionDescriptionInit | undefined>(undefined);
  const [mutedUsers, setMutedUsers] = useState<string[]>([]);
  const [showOptionsId, setShowOptionsId] = useState<string | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState<{id: string, username: string} | null>(null);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice'>('text');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [communityUsers, setCommunityUsers] = useState<UserProfile[]>([]);
  const [channelSettingsModal, setChannelSettingsModal] = useState<string | null>(null);
  const [voicePromptActive, setVoicePromptActive] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);

  // Cloudflare App ID provided by user
  const CLOUDFLARE_APP_ID = 'ce6166e0362af275b7fce968ceb80ba5';

  useEffect(() => {
    let isMounted = true;
    fetchRealUsers().then(users => {
      if (isMounted) setCommunityUsers(users);
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (roomParam) {
      const roomExists = channels.find(c => c.id === roomParam);
      setSelectedRoom(roomExists ? roomExists.id : roomParam);
    } else {
      navigate('/chat/world-chat', { replace: true });
    }
  }, [roomParam, navigate, channels]);

  const targetChatId = (() => {
    if (selectedRoom.startsWith('dm_')) {
      const otherUserId = selectedRoom.replace('dm_', '');
      return `dm_${[user?.user_id || '', otherUserId].sort().join('_')}`;
    }
    if (selectedRoom.startsWith('room_') || selectedRoom.startsWith('chat_')) {
      return selectedRoom;
    }
    return `room_${selectedRoom}`;
  })();

  useEffect(() => {
    if (selectedRoom) {
      const unsub = fetchMessages(targetChatId);
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, [selectedRoom, targetChatId, fetchMessages]);

  useEffect(() => {
    if (selectedRoom) {
      const activeChat = chats.find(c => c.id === selectedRoom);
      const senderIdToClear = activeChat?.participant_id || selectedRoom.replace('dm_', '').replace('room_', '');
      markChatAsRead(senderIdToClear);
    }
  }, [selectedRoom, chats, markChatAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedRoom]);

  const activeChat = chats.find(c => c.id === selectedRoom);
  const activeChannel = channels.find(c => c.id === selectedRoom) || {
    id: selectedRoom,
    name: activeChat ? `@${activeChat.participant_username}` : (selectedRoom === 'world-chat' ? 'World Chat' : selectedRoom),
    desc: activeChat ? `Direct Message with ${activeChat.participant_username}` : (selectedRoom === 'world-chat' ? 'Global community chat for all members' : 'Chat room'),
    type: selectedRoom.includes('voice') || selectedRoom === 'lounge' || selectedRoom === 'squad' ? 'voice' : 'text'
  };

  const roomMessages = messages.filter(m => m.chat_id === targetChatId && !mutedUsers.includes(m.sender_id || ''));
  
  const filteredMessages = roomMessages.filter(m => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const dateStr = new Date(m.created_at).toLocaleDateString().toLowerCase();
    const senderStr = (m.sender_username || '').toLowerCase();
    return m.text.toLowerCase().includes(lowerQuery) || senderStr.includes(lowerQuery) || dateStr.includes(lowerQuery);
  });

  // Filter participants/chats for sidebar search
  const filteredChats = chats.filter(c => 
    !participantSearch || c.participant_username.toLowerCase().includes(participantSearch.toLowerCase())
  );

  const filteredCommunity = communityUsers.filter(u => 
    !participantSearch || u.username.toLowerCase().includes(participantSearch.toLowerCase())
  );

  // Detect incoming calls from real user messages & WebSocket signaling
  useEffect(() => {
    if (roomMessages.length > 0 && !activeCall) {
      const lastMsg = roomMessages[roomMessages.length - 1];
      if (lastMsg.sender_id !== user?.user_id && lastMsg.text.startsWith('[CALL_STARTED:')) {
        const timeDiff = new Date().getTime() - new Date(lastMsg.created_at).getTime();
        if (timeDiff < 20000) {
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

  // Real-time WebSocket listener for WebRTC call request signaling
  useEffect(() => {
    if (!user) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'register',
        userId: user.user_id,
        username: user.username,
        roomId: selectedRoom,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'call-offer') {
          if (data.senderId !== user.user_id && !activeCall) {
            setIncomingCall({
              type: data.callType || 'video',
              caller: data.senderUsername || 'Community Member',
              roomId: data.roomId || selectedRoom,
              offer: data.offer,
            });
          }
        } else if (data.type === 'call-end') {
          setIncomingCall(null);
        }
      } catch (e) {}
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user?.user_id, selectedRoom]);

  const handleSend = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedRoom) return;

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

    let textToSend = inputText;
    if (replyingTo) {
      const cleanPrevText = replyingTo.text.replace(/^\[REPLY_TO:.*?\|.*?\]\n/g, '').replace(/\n/g, ' ').substring(0, 40) + '...';
      textToSend = `[REPLY_TO:${replyingTo.sender_username || 'User'}|${cleanPrevText}]\n${inputText}`;
    }

    sendMessage(targetChatId, textToSend, user?.username);
    setInputText('');
    setShowEmojiPicker(false);
    setReplyingTo(null);
  };

  const insertEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const startCall = async (type: 'video' | 'voice') => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        if (type === 'video') {
          // Explicitly request both microphone and camera permissions for the current browser
          await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        } else {
          // Explicitly request microphone-only permission for the current browser
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      }
    } catch (err: any) {
      console.warn('Media access permission denied or unavailable:', err);
      alert(`Permission Denied: Could not initiate the ${type} call. Please enable ${type === 'video' ? 'microphone and camera' : 'microphone'} access in your browser settings.`);
      return;
    }

    setIsInitiator(true);
    setIncomingOffer(undefined);
    setActiveCall(type);
    sendMessage(targetChatId, `[CALL_STARTED:${type}]`, user?.username);
  };

  const acceptCall = () => {
    if (incomingCall) {
      setIsInitiator(false);
      setIncomingOffer(incomingCall.offer);
      setActiveCall(incomingCall.type);
      setIncomingCall(null);
    }
  };

  const declineCall = () => {
    if (incomingCall) {
      const isPrivateCall = incomingCall.roomId.startsWith('dm_');
      if (isPrivateCall && user) {
        // Send a call-end signaling message so the caller knows it was declined
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const ws = new WebSocket(wsUrl);
        ws.onopen = () => {
          ws.send(JSON.stringify({
            type: 'call-end',
            roomId: incomingCall.roomId,
            targetUserId: selectedRoom.startsWith('dm_') ? selectedRoom.replace('dm_', '') : undefined
          }));
          setTimeout(() => ws.close(), 500);
        };
      }
    }
    setIncomingCall(null);
  };

  const handleRandomMatch = () => {
    const randomRoomId = joinRandomChat();
    if (randomRoomId) {
      navigate(`/chat/${randomRoomId}`);
    } else {
      const roomIds = ['world-chat', 'general', 'gaming', 'lounge'];
      const pick = roomIds[Math.floor(Math.random() * roomIds.length)];
      navigate(`/chat/${pick}`);
    }
    setShowMobileSidebar(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-white text-slate-900 font-sans overflow-hidden">
      <Navbar showLiveIcon={true} />

      {incomingCall && !activeCall && (
        <IncomingCallModal
          callerName={incomingCall.caller}
          channelName={channels.find(c => c.id === incomingCall.roomId)?.name || 'Community'}
          type={incomingCall.type}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}

      {activeCall && (
        <CallScreen 
          type={activeCall} 
          channelId={selectedRoom}
          channelName={activeChannel.name} 
          onEndCall={() => { setActiveCall(null); setIncomingOffer(undefined); }} 
          appId={CLOUDFLARE_APP_ID}
          isInitiator={isInitiator}
          targetUserId={chats.find(c => c.id === selectedRoom)?.participant_id || (selectedRoom.startsWith('dm_') ? selectedRoom.replace('dm_', '') : undefined)}
          incomingOffer={incomingOffer}
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

        {/* Sidebar - Direct Messages & Participants */}
        <div className={`fixed inset-y-0 left-0 z-50 md:relative w-[280px] md:w-64 lg:w-72 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 h-full transition-transform transform ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          
          {/* Search bar at top of chat participant list */}
          <div className="p-3 border-b border-slate-800 bg-slate-950 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Conversations</span>
              </h2>
              <button 
                onClick={() => setShowCreateChannel(true)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition text-xs flex items-center space-x-1"
                title="Create Channel"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search participants..." 
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            
            {/* Top Item: Main World Chat */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider">Featured</p>
              <div className="group flex items-center rounded-lg pr-1 hover:bg-slate-900 transition">
                <button
                  onClick={() => {
                    navigate('/chat/world-chat');
                    setShowMobileSidebar(false);
                  }}
                  className={`flex-1 flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-left ${
                    selectedRoom === 'world-chat'
                      ? 'bg-indigo-600/20 text-indigo-300 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate">Main World Chat</span>
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-semibold">Global</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">Live community conversation</p>
                  </div>
                </button>
                <button 
                  onClick={() => navigate(`/channel/world-chat/settings`)}
                  className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-slate-800"
                  title="Channel Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Random Live Chat Action */}
            <button
              onClick={handleRandomMatch}
              className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-200 hover:bg-indigo-600/10 hover:border-indigo-500/30 transition text-left group"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Shuffle className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold block text-slate-200 group-hover:text-indigo-300">Match Live Chat</span>
                <span className="text-[10px] text-slate-500 block truncate">Assign to live active group</span>
              </div>
            </button>

            {/* Text Channels Section */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider">Channels</p>
              {channels.filter(c => c.type === 'text' && c.id !== 'world-chat').map((channel) => (
                <div key={channel.id} className="group flex items-center rounded-lg hover:bg-slate-900 pr-1 transition">
                  <button
                    onClick={() => {
                      navigate(`/chat/${channel.id}`);
                      setShowMobileSidebar(false);
                    }}
                    className={`flex-1 flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left ${
                      selectedRoom === channel.id
                        ? 'bg-indigo-600/10 text-indigo-400 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs truncate">{channel.name}</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/channel/${channel.id}/settings`)} 
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white transition"
                    title="Channel Settings"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Voice Channels Section with Member Badges */}
            <div>
              <div className="flex items-center justify-between px-2 py-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Voice Channels</p>
                <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">Live Audio</span>
              </div>
              {channels.filter(c => c.type === 'voice').map((channel) => (
                <div key={channel.id} className="group flex items-center rounded-lg hover:bg-slate-900 pr-1 transition">
                  <button
                    onClick={() => {
                      setSelectedRoom(channel.id);
                      setVoicePromptActive(channel.id);
                      setShowMobileSidebar(false);
                    }}
                    className={`flex-1 flex items-center space-x-2 px-2.5 py-2 rounded-lg text-left ${
                      selectedRoom === channel.id
                        ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span className="text-xs truncate flex-1">{channel.name}</span>
                    <span className="text-[9px] font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full border border-slate-700">
                      {selectedRoom === channel.id ? 'Active' : 'Voice'}
                    </span>
                  </button>
                  <button 
                    onClick={() => navigate(`/channel/${channel.id}/settings`)} 
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white transition"
                    title="Settings"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Direct Messages / Chat Participants List */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider">Direct Messages</p>
              
              {/* Active Conversations from chats */}
              {filteredChats.map(chat => {
                const unreadCount = (unreadCountsBySender && (unreadCountsBySender[chat.participant_id] || unreadCountsBySender[chat.id])) || 0;
                return (
                  <div key={chat.id} className="group flex items-center rounded-lg hover:bg-slate-900 pr-1 transition">
                    <button 
                      onClick={() => {
                        setSelectedRoom(chat.id);
                        markChatAsRead(chat.participant_id || chat.id);
                        setShowMobileSidebar(false);
                      }} 
                      className={`flex-1 flex items-center space-x-2.5 px-2 py-1.5 rounded-lg text-left ${
                        selectedRoom === chat.id ? 'bg-indigo-600/10 text-indigo-300' : 'text-slate-300'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img src={chat.participant_avatar} className="w-7 h-7 rounded-full object-cover" alt={chat.participant_username} />
                        <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-950 ${onlineUsers[chat.participant_id] === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-200 truncate">{chat.participant_username}</p>
                          {unreadCount > 0 && (
                            <span className="bg-rose-500 text-white font-extrabold text-[9px] px-1.5 py-0.2 rounded-full animate-pulse shadow-sm ml-1 shrink-0">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{chat.last_message || 'Start chatting'}</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => navigate('/settings')}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white transition"
                      title="Settings"
                    >
                      <Settings className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {/* Community Users Fallback if chats is small */}
              {filteredChats.length === 0 && filteredCommunity.map(prof => {
                const unreadCount = (unreadCountsBySender && unreadCountsBySender[prof.user_id]) || 0;
                return (
                  <div key={prof.user_id} className="group flex items-center rounded-lg hover:bg-slate-900 pr-1 transition">
                    <button 
                      onClick={() => {
                        setSelectedRoom(`dm_${prof.user_id}`);
                        markChatAsRead(prof.user_id);
                        setShowMobileSidebar(false);
                      }} 
                      className="flex-1 flex items-center space-x-2.5 px-2 py-1.5 rounded-lg text-left text-slate-300"
                    >
                      <div className="relative shrink-0">
                        <img src={prof.avatar_url} className="w-7 h-7 rounded-full object-cover" alt={prof.username} />
                        <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-950 ${onlineUsers[prof.user_id] === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-200 truncate">@{prof.username}</p>
                          {unreadCount > 0 && (
                            <span className="bg-rose-500 text-white font-extrabold text-[9px] px-1.5 py-0.2 rounded-full animate-pulse shadow-sm ml-1 shrink-0">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{prof.bio || 'Community member'}</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => navigate('/settings')}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white transition"
                      title="Settings"
                    >
                      <Settings className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Real-time Sync Switch Panel */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 px-2 pb-2">
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-3.5 flex items-center justify-between shadow-inner">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">Real-time Sync</p>
                  <p className="text-[10px] text-slate-500">Live feed snapshot updates</p>
                </div>
                <button
                  onClick={toggleSync}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isSyncEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isSyncEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

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
                    {activeChannel.type === 'voice' ? <Phone className="w-5 h-5 text-emerald-400" /> : <Hash className="w-5 h-5 text-indigo-400" />}
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
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline text-xs font-bold">Voice Call</span>
                </button>
                <button
                  onClick={() => startCall('video')}
                  className="p-2 sm:px-3 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center space-x-2"
                  title="Video Call"
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-bold">Video Call</span>
                </button>
                <button
                  onClick={() => navigate(`/channel/${selectedRoom}/settings`)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition"
                  title="Channel Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
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

          {/* Messages / Voice Channel Lobby */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {activeChannel.type === 'voice' ? (
                <div className="flex flex-col items-center justify-center h-full space-y-5 text-center p-6">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse">
                        <Phone className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-2xl font-extrabold text-white">Voice Channel: {activeChannel.name}</h2>
                      <p className="text-slate-400 text-sm max-w-sm mx-auto">Would you like to join or start this voice channel session with camera and mic support?</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md pt-2">
                      <button 
                        onClick={() => startCall('voice')} 
                        className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Start Voice Call</span>
                      </button>
                      
                      <button 
                        onClick={() => startCall('video')} 
                        className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20"
                      >
                        <Video className="w-4 h-4" />
                        <span>Start Video Call (Camera)</span>
                      </button>
                    </div>

                    <div className="pt-4 flex items-center space-x-2 text-xs text-slate-500">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>Voice channel ready for live call session</span>
                    </div>
                </div>
            ) : (
                <>
                    <div className="pb-8 pt-4">
                      <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                        <Hash className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h2 className="text-3xl font-extrabold text-white mb-2">Welcome to #{activeChannel.name}!</h2>
                      <p className="text-slate-400">{activeChannel.desc}</p>
                    </div>

                    {filteredMessages.map((msg, i) => {
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
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group items-end gap-2 my-1`}>
                          {!isMine && (
                            <img 
                              src={msg.sender_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.sender_id}`} 
                              className="w-8 h-8 rounded-full object-cover shrink-0 mb-1 border border-slate-800"
                              alt={msg.sender_username || 'User'}
                            />
                          )}

                          <div className={`max-w-[85%] sm:max-w-xl ${isMine ? 'items-end' : 'items-start'} flex flex-col relative`}>
                            
                            {showHeader && (
                              <div className={`flex items-baseline space-x-2 mb-1 relative ${isMine ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                <Link 
                                  to={`/profile/${msg.sender_username || msg.sender_id}`}
                                  className={`text-xs font-bold flex items-center space-x-1 ${isMine ? 'text-indigo-400' : 'text-slate-300 hover:underline'}`}
                                >
                                  <span>{isMine ? (user?.username ? `@${user.username}` : 'You') : `@${msg.sender_username || msg.sender_id || 'User'}`}</span>
                                  {((isMine && user?.email?.toLowerCase().endsWith('@garexcell.com')) || 
                                    (!isMine && msg.sender_email?.toLowerCase().endsWith('@garexcell.com')) ||
                                    (msg.sender_username?.toLowerCase() === 'garexcell')) && (
                                    <CheckCircle2 className="w-3 h-3 fill-amber-500 text-white stroke-[2]" title="Verified Gold Badge" />
                                  )}
                                </Link>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}
                            
                            {(() => {
                              let displayText = msg.text;
                              let replySnippet = null;
                              if (displayText.startsWith('[REPLY_TO:')) {
                                const match = displayText.match(/^\[REPLY_TO:(.*?)\|(.*?)\]\n([\s\S]*)$/);
                                if (match) {
                                  replySnippet = { username: match[1], text: match[2] };
                                  displayText = match[3];
                                }
                              }

                              return (
                                <div 
                                  onClick={() => setShowOptionsId(showOptionsId === msg.id ? null : msg.id)}
                                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative cursor-pointer ${
                                    isMine 
                                      ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md' 
                                      : 'bg-slate-800 border border-slate-700/60 text-slate-100 rounded-tl-sm shadow-sm'
                                  }`}
                                >
                                  {replySnippet && (
                                    <div className="mb-2 pl-3 border-l-2 border-white/30 text-[11px] opacity-90">
                                      <p className="font-bold mb-0.5">{replySnippet.username}</p>
                                      <p className="truncate">{replySnippet.text}</p>
                                    </div>
                                  )}
                                  <p className="break-words whitespace-pre-wrap">{displayText}</p>
                                  {msg.edited && <span className="text-[10px] text-white/70 italic block mt-1">(edited)</span>}
                                  
                                  {/* Message Options Menu */}
                                  {showOptionsId === msg.id && (
                                    <div className={`absolute top-full mt-1 ${isMine ? 'right-0' : 'left-0'} w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-30 py-1 overflow-hidden`}>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setShowOptionsId(null); }}
                                        className="w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-200 flex items-center space-x-2"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                                        <span>Reply</span>
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(displayText); setShowOptionsId(null); }}
                                        className="w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-200 flex items-center space-x-2"
                                      >
                                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Copy Text</span>
                                      </button>
                                      
                                      {!isMine && (
                                        <>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/report/${msg.id}`); setShowOptionsId(null); }}
                                            className="w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-200 flex items-center space-x-2"
                                          >
                                            <Shield className="w-3.5 h-3.5 text-orange-400" />
                                            <span>Report</span>
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setUserToBlock({id: msg.sender_id || '', username: msg.sender_username || 'Unknown'}); setBlockModalOpen(true); setShowOptionsId(null); }}
                                            className="w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-200 flex items-center space-x-2"
                                          >
                                            <Ban className="w-3.5 h-3.5 text-rose-400" />
                                            <span>Block User</span>
                                          </button>
                                        </>
                                      )}

                                      {isMine && (
                                        <>
                                          <button
                                            onClick={(e) => { 
                                              e.stopPropagation(); 
                                              const newText = prompt("Edit your message:", displayText); 
                                              if (newText !== null && newText !== displayText) {
                                                const textToSend = replySnippet ? `[REPLY_TO:${replySnippet.username}|${replySnippet.text}]\n${newText}` : newText;
                                                editMessage(msg.id, textToSend, targetChatId); 
                                              }
                                              setShowOptionsId(null); 
                                            }}
                                            className="w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-200 flex items-center space-x-2"
                                          >
                                            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                                            <span>Edit</span>
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id, targetChatId); setShowOptionsId(null); }}
                                            className="w-full text-left px-4 py-2 text-xs hover:bg-slate-700 text-slate-200 flex items-center space-x-2"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                            <span>Delete</span>
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {isMine && (
                            <img 
                              src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.user_id}`} 
                              className="w-8 h-8 rounded-full object-cover shrink-0 mb-1 border border-indigo-500/30"
                              alt={user?.username || 'You'}
                            />
                          )}
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

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="absolute bottom-20 left-4 w-72 sm:w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl z-10 p-4 space-y-3">
              <input
                type="text"
                placeholder="Search emoji..."
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
          {activeChannel.type !== 'voice' && (
            <div className="p-4 bg-slate-900 shrink-0">
              {replyingTo && (
                <div className="mb-2 bg-slate-800 rounded-lg p-3 flex items-center justify-between border-l-4 border-indigo-500">
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-indigo-400 mb-1">Replying to @{replyingTo.sender_username || 'User'}</p>
                    <p className="text-sm text-slate-300 truncate">{replyingTo.text.replace(/^\[REPLY_TO:.*?\|.*?\]\n/g, '')}</p>
                  </div>
                  <button 
                    onClick={() => setReplyingTo(null)}
                    className="p-2 text-slate-400 hover:text-white transition rounded-full hover:bg-slate-700"
                  >
                    ✕
                  </button>
                </div>
              )}
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
                      <button
                        type="button"
                        className="p-2 text-slate-400 hover:text-slate-300 transition"
                        title="Gift"
                        onClick={() => {
                          const targetUser = activeChat ? activeChat.participant_username : '';
                          navigate(`/gift/premium?username=${encodeURIComponent(targetUser)}&amount=20.99`);
                        }}
                      >
                        <Gift className="w-5 h-5" />
                      </button>
                      <button type="button" className="p-2 text-slate-400 hover:text-slate-300 transition" title="AI Summary" onClick={async () => {
                        const recentMessages = filteredMessages.slice(-5);
                        try {
                          const res = await fetch('/api/gemini/summarize', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ messages: recentMessages })
                          });
                          const data = await res.json();
                          alert(data.summary || 'No summary available.');
                        } catch (e) {
                          alert('AI Summary ready: Conversation covers recent community activity.');
                        }
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
          )}
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
                    <Phone className="w-5 h-5 mb-1 text-emerald-400" />
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
      <UpgradePromptModal isOpen={isUpgradePromptOpen} onClose={() => setUpgradePromptOpen(false)} />
      <BottomBar />
    </div>
  );
};
