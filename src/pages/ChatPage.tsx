import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Search, User, MessageSquare, Shield, CheckCheck, Edit2, Mic, Image as ImageIcon, Gamepad2, Gift, Smile } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { BottomBar } from '../components/BottomBar';
import { useAuth } from '../context/AuthContext';

export const ChatPage: React.FC = () => {
  const { chats, messages, sendMessage, fetchMessages, user } = useAuth();
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  
  const [selectedChatId, setSelectedChatId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');

  // When username changes in URL, find or create chat
  useEffect(() => {
    if (username) {
      const existingChat = chats.find(c => c.participant_username.toLowerCase() === username.toLowerCase());
      if (existingChat) {
        setSelectedChatId(existingChat.id);
      } else {
        // We will just set a dummy activeChat for now, and create it on first message
        setSelectedChatId('new_' + username);
      }
    } else if (chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0].id);
    }
  }, [username, chats, selectedChatId]);

  useEffect(() => {
    if (selectedChatId && !selectedChatId.startsWith('new_')) {
      fetchMessages(selectedChatId);
    }
  }, [selectedChatId]);

  const activeChat = selectedChatId.startsWith('new_') 
    ? { 
        id: selectedChatId, 
        participant_username: username || '', 
        participant_avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`
      }
    : chats.find((c) => c.id === selectedChatId);

  const chatMessages = messages.filter((m) => m.chat_id === selectedChatId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChatId) return;
    
    // In a real app we'd create the chat in backend first if it's new
    const finalChatId = selectedChatId.startsWith('new_') ? 'chat_' + Date.now() : selectedChatId;
    
    // If it's a new chat, we should probably update the URL or something, but sendMessage creates it
    sendMessage(finalChatId, inputText, activeChat?.participant_username);
    
    if (selectedChatId.startsWith('new_')) {
      navigate('/chat');
      setSelectedChatId(finalChatId);
    }
    
    setInputText('');
  };

  const handleSearchGo = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchUsername.trim()) {
      navigate(`/chat/${searchUsername.trim()}`);
      setShowSearchModal(false);
      setSearchUsername('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20 sm:pb-8 flex flex-col">
      <Navbar showLiveIcon={true} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-2 sm:px-4 py-4 flex flex-col md:flex-row gap-4 h-[calc(100vh-120px)]">
        
        {/* Chat Threads Sidebar */}
        <div className="w-full md:w-80 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <span>Garexcell Direct Messages</span>
            </h2>
            <button 
              onClick={() => setShowSearchModal(true)}
              className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200:bg-slate-700 transition"
              title="New Chat"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1">
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <p className="text-xs font-semibold">No chats yet.</p>
                <p className="text-[10px]">Tap the pencil icon to start a new chat.</p>
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setSelectedChatId(chat.id);
                    navigate('/chat');
                  }}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition text-left ${
                  selectedChatId === chat.id
                    ? 'bg-indigo-50 border border-indigo-200'
                    : 'hover:bg-slate-50:bg-slate-800'
                }`}
              >
                <img
                  src={chat.participant_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${chat.participant_username}`}
                  alt={chat.participant_username}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs text-slate-900 truncate">
                      @{chat.participant_username}
                    </p>
                    <span className="text-[10px] text-slate-400">{chat.updated_at}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{chat.last_message || 'Draft...'}</p>
                </div>
              </button>
            ))
            )}
          </div>
        </div>

        {/* Chat Thread Messages Area */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          {activeChat ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-3">
                  <img
                    src={activeChat.participant_avatar}
                    alt={activeChat.participant_username}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      @{activeChat.participant_username}
                    </h3>
                    <p className="text-[10px] text-emerald-600 font-semibold">Online on Playxcade</p>
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
                {chatMessages.map((msg) => {
                  const isMine = msg.sender_id === user?.user_id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-xs font-medium shadow-sm leading-relaxed ${
                          isMine
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <p className={`text-[9px] mt-1 text-right ${isMine ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {msg.created_at}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input Bar */}
              <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white">
                <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                  <button type="button" className="p-1.5 text-slate-400 hover:text-indigo-500 transition">
                    <Gamepad2 className="w-5 h-5" />
                  </button>
                  <button type="button" className="p-1.5 text-slate-400 hover:text-indigo-500 transition">
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <button type="button" className="p-1.5 text-slate-400 hover:text-indigo-500 transition">
                    <Gift className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Message..."
                    className="flex-1 px-3 py-1.5 bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-900 outline-none"
                  />
                  <button type="button" className="p-1.5 text-slate-400 hover:text-indigo-500 transition">
                    <Smile className="w-5 h-5" />
                  </button>
                  {inputText.trim() ? (
                    <button
                      type="submit"
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-sm transition ml-1"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-indigo-500 transition ml-1"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
              <p className="text-sm font-bold text-slate-600">Your Messages</p>
              <p className="text-xs mt-1">Send private messages and share gameplay clips.</p>
              <button 
                onClick={() => setShowSearchModal(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
              >
                Send Message
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">New Message</h3>
            <form onSubmit={handleSearchGo} className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  placeholder="Search username..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              <button type="submit" className="px-3 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700">
                Go
              </button>
            </form>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSearchModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100:bg-slate-700 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomBar />
    </div>
  );
};
