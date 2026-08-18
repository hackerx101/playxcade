import React, { useState, useEffect, useRef } from 'react';
import { X, Radio, Video, Camera, Mic, MicOff, CameraOff, Sparkles, Send, Users, Eye, Play, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StartStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StartStreamModal: React.FC<StartStreamModalProps> = ({ isOpen, onClose }) => {
  const { user, createPost } = useAuth();
  const [streamTitle, setStreamTitle] = useState('Ranked Cyber Arena Supremacy | Playxcade Live');
  const [gameCategory, setGameCategory] = useState('Warlands');
  const [isLive, setIsLive] = useState(false);
  
  // Media Stream state
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [viewerCount, setViewerCount] = useState(1248);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; user: string; text: string; time: string }>>([
    { id: '1', user: 'ProGamerX', text: 'Let’s go! Hype stream!', time: '10:00 AM' },
    { id: '2', user: 'CyberQueen', text: 'What graphics settings are you using?', time: '10:01 AM' },
    { id: '3', user: 'PixelKnight', text: 'Clutch play coming up', time: '10:02 AM' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Initialize camera stream when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopMediaStream();
      setIsLive(false);
      return;
    }

    startCamera();

    return () => {
      stopMediaStream();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraAccess(true);
      }
    } catch (err) {
      console.warn('Webcam access not granted or unavailable:', err);
      setHasCameraAccess(false);
    }
  };

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setHasCameraAccess(false);
  };

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isCameraOff;
      });
    }
    setIsCameraOff(!isCameraOff);
  };

  // Viewer fluctuation interval when live
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 9) - 4);
    }, 4000);
    return () => clearInterval(interval);
  }, [isLive]);

  const handleStartBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create live post on feed
    try {
      if (createPost) {
        await createPost({
          caption: `[LIVE NOW] ${streamTitle}`,
          type: 'media_url',
          media_url: 'https://assets.mixkit.co/videos/preview/mixkit-gameplay-of-a-first-person-shooter-42999-large.mp4',
          category: gameCategory,
          tags: ['live', 'stream', gameCategory.toLowerCase()],
          hashtags: ['#PlayxcadeLive', `#${gameCategory.replace(/\s+/g, '')}`]
        });
      }
    } catch (err) {
      console.warn('Live stream post creation notice:', err);
    }

    setIsLive(true);
  };

  const handleSendLiveChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = {
      id: String(Date.now()),
      user: user?.username || 'You',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  const handleEndBroadcast = () => {
    stopMediaStream();
    setIsLive(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 text-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2.5 text-rose-500">
            <Radio className="w-5 h-5 animate-pulse" />
            <h3 className="font-extrabold text-base sm:text-lg tracking-tight">Playxcade Live Broadcast Studio</h3>
          </div>
          <button
            onClick={handleEndBroadcast}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isLive ? (
          <form onSubmit={handleStartBroadcast} className="p-5 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Stream Title
              </label>
              <input
                type="text"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Give your live stream a catchy title..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Game Category
              </label>
              <select
                value={gameCategory}
                onChange={(e) => setGameCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Warlands">Warlands: Cyber Realm</option>
                <option value="Apex Overdrive">Apex Overdrive</option>
                <option value="Mythic Clash">Mythic Clash Online</option>
                <option value="Free Fire">Free Fire Regional Championship</option>
                <option value="Shadow Rift">Shadow Rift Chronicles</option>
                <option value="PixelFront">PixelFront Operations</option>
              </select>
            </div>

            {/* Live Camera Preview Box */}
            <div className="relative aspect-video w-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center text-slate-400 overflow-hidden border border-slate-800/80 shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isCameraOff || !hasCameraAccess ? 'hidden' : 'block'}`}
              />

              {(isCameraOff || !hasCameraAccess) && (
                <div className="text-center p-6 space-y-2">
                  <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500 mb-2">
                    <Camera className="w-7 h-7" />
                  </div>
                  <p className="text-xs font-bold text-slate-200">
                    {isCameraOff ? 'Camera Turned Off' : 'Webcam Live Stream Active'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Low-Latency RTMP Stream Pipeline Connected & Ready
                  </p>
                </div>
              )}

              {/* Controls overlay */}
              <div className="absolute bottom-3 right-3 flex items-center space-x-2 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-1.5 shadow-lg">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-2 rounded-lg transition ${isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
                  title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`p-2 rounded-lg transition ${isCameraOff ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
                  title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {isCameraOff ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800/60">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-lg shadow-rose-600/20 flex items-center space-x-2 transition active:scale-95"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Go Live Now</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Live Indicator Header */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider animate-pulse">
                  <Radio className="w-3 h-3" />
                  <span>LIVE</span>
                </span>
                <span className="text-xs font-bold text-slate-200">{streamTitle}</span>
              </div>
              <div className="flex items-center space-x-1 text-slate-300 text-xs font-bold bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>{viewerCount.toLocaleString()}</span>
              </div>
            </div>

            {/* Video Feed */}
            <div className="aspect-video bg-slate-950 rounded-2xl flex items-center justify-center relative overflow-hidden border border-rose-500/30 shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isCameraOff || !hasCameraAccess ? 'hidden' : 'block'}`}
              />
              {(isCameraOff || !hasCameraAccess) && (
                <div className="text-center p-4">
                  <Video className="w-10 h-10 text-rose-500 mx-auto mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-slate-200">Broadcast Feed Active</p>
                  <p className="text-[10px] text-slate-500">Category: {gameCategory}</p>
                </div>
              )}
            </div>

            {/* Live Stream Chat Room */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Audience Chat</h5>
              <div className="max-h-36 overflow-y-auto space-y-2 pr-1 text-xs">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/60">
                    <span className="font-bold text-indigo-400 mr-2">{msg.user}:</span>
                    <span className="text-slate-200">{msg.text}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendLiveChat} className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Say something in stream chat..."
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>

            <button
              onClick={handleEndBroadcast}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-rose-600/20 active:scale-[0.98]"
            >
              End Broadcast
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
