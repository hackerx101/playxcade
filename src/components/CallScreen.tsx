import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize, Minimize, Users, Settings } from 'lucide-react';

interface CallScreenProps {
  type: 'video' | 'voice';
  channelName: string;
  onEndCall: () => void;
  appId?: string; // Cloudflare Realtime App ID
  isInitiator?: boolean;
}

export const CallScreen: React.FC<CallScreenProps> = ({ type, channelName, onEndCall, appId, isInitiator = true }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(type === 'voice');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isRinging, setIsRinging] = useState(isInitiator);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Mute/Unmute audio track
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = !isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    // Enable/Disable video track
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !isVideoOff;
    }
  }, [isVideoOff]);

  useEffect(() => {
    // Play outgoing ringing sound if initiator
    if (isInitiator && isRinging) {
      const audio = new Audio('https://www.soundjay.com/phone/telephone-ring-04.mp3');
      audio.loop = true;
      audio.play().catch(e => console.warn('Audio play blocked:', e));
      audioRef.current = audio;

      // Simulate connection after 5 seconds
      const timeout = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsRinging(false);
      }, 5000);

      return () => {
        clearTimeout(timeout);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
      };
    }
  }, [isInitiator, isRinging]);
  useEffect(() => {
    const timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Start local camera
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        localStream.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Apply initial states
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = !isMuted;
        
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) videoTrack.enabled = !isVideoOff;

        // Add tracks to peer connection
        // (Simplified for this prototype)
      } catch (e) {
        console.warn('Camera access denied or unavailable', e);
      }
    };
    
    startCamera();

    return () => {
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []); // Only run once on mount

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-0 z-50 bg-black flex flex-col ${isFullscreen ? '' : 'sm:p-4'}`}>
      <div className={`relative flex-1 w-full max-w-5xl mx-auto flex flex-col overflow-hidden bg-[#1c1c1e] sm:rounded-[40px] shadow-2xl ${isFullscreen ? 'sm:rounded-none max-w-full' : ''}`}>
        
        {/* Header - iOS style */}
        <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start z-20 bg-gradient-to-b from-black/60 to-transparent">
          <div className="text-white">
            <h2 className="text-xl font-medium tracking-wide">#{channelName}</h2>
            <p className="text-sm text-gray-300 font-mono mt-1">{formatTime(callDuration)} • Cloudflare Live</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition">
              <Users className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition hidden sm:flex"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative w-full h-full bg-[#000000] flex items-center justify-center">
          {isVideoOff ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold shadow-xl border-4 border-[#2c2c2e]">
                {channelName.charAt(0).toUpperCase()}
              </div>
              <p className="text-white text-lg font-medium tracking-wide animate-pulse">{isRinging ? 'Ringing...' : 'Voice Call Active'}</p>
            </div>
          ) : (
            <>
              {/* Remote Video Placeholder (simulate cloudflare remote stream) */}
              <div className="absolute inset-0 flex items-center justify-center bg-[#1c1c1e]">
                <div className="text-white/30 flex flex-col items-center">
                  <Video className="w-16 h-16 mb-4" />
                  <p className="text-sm font-medium">{isRinging ? 'Ringing...' : 'Waiting for others to join...'}</p>
                </div>
              </div>
              
              {/* Local PiP Video */}
              <div className="absolute bottom-[120px] right-6 w-28 sm:w-40 aspect-[3/4] bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 z-10">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              </div>
            </>
          )}
        </div>

        {/* Controls - iOS style */}
        <div className="absolute bottom-0 inset-x-0 p-8 pb-12 flex justify-center items-center gap-6 sm:gap-8 bg-gradient-to-t from-black/80 to-transparent z-20">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-white text-black' : 'bg-white/20 text-white backdrop-blur-md'
            }`}
          >
            {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>
          
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isVideoOff ? 'bg-white text-black' : 'bg-white/20 text-white backdrop-blur-md'
            }`}
          >
            {isVideoOff ? <VideoOff className="w-7 h-7" /> : <Video className="w-7 h-7" />}
          </button>
          
          <button
            onClick={onEndCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-lg"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
