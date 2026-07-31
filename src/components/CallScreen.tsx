import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize, Minimize, Users, RefreshCw, Volume2, Shield, PhoneCall } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CallScreenProps {
  type: 'video' | 'voice';
  channelId: string;
  channelName: string;
  onEndCall: () => void;
  isInitiator?: boolean;
  targetUserId?: string;
  incomingOffer?: RTCSessionDescriptionInit;
}

// Web Audio API phone ringtone synthesizer that outputs to speaker
function createRingtonePlayer() {
  let audioCtx: AudioContext | null = null;
  let intervalId: any = null;
  let isPlaying = false;

  const start = () => {
    if (isPlaying) return;
    isPlaying = true;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();

      const playTonePattern = () => {
        if (!audioCtx || audioCtx.state === 'closed') return;
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }

        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        // 440Hz + 480Hz standard dual phone ringing tone
        osc1.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc2.frequency.setValueAtTime(480, audioCtx.currentTime);

        osc1.type = 'sine';
        osc2.type = 'sine';

        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime + 1.8);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);

        osc1.start(audioCtx.currentTime);
        osc2.start(audioCtx.currentTime);

        osc1.stop(audioCtx.currentTime + 2.0);
        osc2.stop(audioCtx.currentTime + 2.0);
      };

      playTonePattern();
      intervalId = setInterval(playTonePattern, 3500);
    } catch (e) {
      console.warn('Could not start ringtone synthesizer:', e);
    }
  };

  const stop = () => {
    isPlaying = false;
    if (intervalId) clearInterval(intervalId);
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
    }
  };

  return { start, stop };
}

export const CallScreen: React.FC<CallScreenProps> = ({
  type,
  channelId,
  channelName,
  onEndCall,
  isInitiator = true,
  targetUserId,
  incomingOffer,
}) => {
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(type === 'voice');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRinging, setIsRinging] = useState(true);
  const [peerConnected, setPeerConnected] = useState(false);
  const [remotePeerUsername, setRemotePeerUsername] = useState<string>(() => {
    if (!isInitiator) {
      // If we are not the initiator, the channelName is likely the caller name in DMs
      return channelName || 'Caller';
    }
    return 'Gamer';
  });

  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const ringtoneRef = useRef(createRingtonePlayer());

  const currentUserId = user?.user_id || `user_${Math.floor(Math.random() * 10000)}`;
  const currentUsername = user?.username || 'Gamer';

  // Toggle Mute
  useEffect(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = !isMuted;
    }
  }, [isMuted]);

  // Toggle Video
  useEffect(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !isVideoOff;
    }
  }, [isVideoOff]);

  // Duration timer
  useEffect(() => {
    let timer: any;
    if (isConnected || peerConnected) {
      timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isConnected, peerConnected]);

  // WebRTC & WebSockets Real-time Call Setup
  useEffect(() => {
    const pendingIceCandidates: RTCIceCandidateInit[] = [];

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    let pingInterval: any = null;

    if (isInitiator) {
      // 1. Play ringing sound out loud on speaker while establishing connection
      ringtoneRef.current.start();
      setIsRinging(true);
    } else {
      setIsRinging(false);
    }

    // Standard public STUN servers for WebRTC NAT traversal
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
      ],
    });
    pcRef.current = pc;

    const processPendingIceCandidates = async () => {
      while (pendingIceCandidates.length > 0) {
        const candidate = pendingIceCandidates.shift();
        if (candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn('Error adding queued ICE candidate:', e);
          }
        }
      }
    };

    // Receive remote tracks
    pc.ontrack = (event) => {
      ringtoneRef.current.stop();
      setIsRinging(false);
      setPeerConnected(true);
      setIsConnected(true);

      const [remoteStream] = event.streams;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (mainVideoRef.current && !isVideoOff) {
        mainVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    };

    // Send local ICE candidates to remote peer via WebSocket signaling
    pc.onicecandidate = (event) => {
      if (event.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
            targetUserId,
            roomId: channelId,
          })
        );
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        ringtoneRef.current.stop();
        setIsRinging(false);
        setPeerConnected(true);
        setIsConnected(true);
      }
    };

    // Start user camera & mic
    const initCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: type === 'video' ? { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } : false,
          audio: true,
        });

        localStreamRef.current = stream;

        // Show local feed in PiP
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Setup local audio analyzer for level meter
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateLevel = () => {
            if (analyser && !isMuted) {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              setAudioLevel(Math.min(100, Math.round((sum / dataArray.length / 128) * 100)));
            }
            requestAnimationFrame(updateLevel);
          };
          updateLevel();
        }
      } catch (err: any) {
        console.warn('Microphone/Camera access error:', err);
        setCameraError(err?.message || 'Access to camera/mic denied');
      }
    };

    ws.onopen = async () => {
      // Register client on WebSocket signaling server
      ws.send(
        JSON.stringify({
          type: 'register',
          userId: currentUserId,
          username: currentUsername,
          roomId: channelId,
        })
      );

      await initCall();

      if (isInitiator) {
        // Create WebRTC Offer
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(
            JSON.stringify({
              type: 'call-offer',
              callType: type,
              offer,
              roomId: channelId,
              targetUserId,
            })
          );
        } catch (e) {
          console.error('Error creating WebRTC offer:', e);
        }
      } else if (incomingOffer) {
        // Recipient accepting incoming call: set offer and create answer
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
          await processPendingIceCandidates();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(
            JSON.stringify({
              type: 'call-answer',
              answer,
              roomId: channelId,
              targetUserId,
            })
          );
          ringtoneRef.current.stop();
          setIsRinging(false);
          setIsConnected(true);
        } catch (e) {
          console.error('Error setting remote offer / creating answer:', e);
        }
      }

      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 15000);
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'call-answer' && data.answer) {
          // Received answer from remote peer
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          await processPendingIceCandidates();
          ringtoneRef.current.stop();
          setIsRinging(false);
          setIsConnected(true);
          setPeerConnected(true);
        } else if (data.type === 'ice-candidate' && data.candidate) {
          // Received ICE candidate from remote peer
          if (pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (e) {
              console.warn('Failed to add ICE candidate directly:', e);
            }
          } else {
            pendingIceCandidates.push(data.candidate);
          }
        } else if (data.type === 'call-end') {
          ringtoneRef.current.stop();
          onEndCall();
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    return () => {
      clearInterval(pingInterval);
      ringtoneRef.current.stop();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'call-end', roomId: channelName, targetUserId }));
        ws.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      pc.close();
    };
  }, [facingMode]);

  const handleEndCallClick = () => {
    ringtoneRef.current.stop();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'call-end', roomId: channelName, targetUserId }));
    }
    onEndCall();
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-0 z-50 bg-black flex flex-col select-none ${isFullscreen ? '' : 'sm:p-4'}`}>
      {/* Hidden HTML audio element for remote audio stream through speaker */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className={`relative flex-1 w-full max-w-5xl mx-auto flex flex-col overflow-hidden bg-slate-950 sm:rounded-[36px] shadow-2xl border border-slate-800 ${isFullscreen ? 'sm:rounded-none max-w-full' : ''}`}>
        
        {/* Top Header Controls (WhatsApp style) */}
        <div className="absolute top-0 inset-x-0 p-5 flex justify-between items-center z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center space-x-3 text-white">
            <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center font-bold text-sm">
              {channelName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-wide flex items-center space-x-1.5">
                <span>{channelName}</span>
                <span className={`w-2 h-2 rounded-full ${isRinging ? 'bg-amber-400 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
              </h2>
              <p className="text-xs text-slate-300 font-mono flex items-center space-x-2">
                <span>{isRinging ? 'Calling...' : (!isConnected ? 'Connecting...' : `Connected • ${formatTime(callDuration)}`)}</span>
                <span>•</span>
                <span className="text-emerald-400 font-sans font-semibold">WebRTC Peer Connection</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isVideoOff && (
              <button
                onClick={toggleCameraFacing}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition"
                title="Switch Camera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition hidden sm:flex"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Real Call Video / Audio View Area */}
        <div className="flex-1 relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
          
          {/* Voice Mode View or Video Off */}
          {isVideoOff ? (
            <div className="flex flex-col items-center justify-center space-y-6 z-10 p-6 text-center">
              <div className="relative flex items-center justify-center">
                {/* Real-time Microphone Volume Animated Pulse Rings */}
                <div 
                  className="absolute rounded-full bg-indigo-500/20 transition-all duration-75"
                  style={{
                    width: `${140 + (isMuted ? 0 : audioLevel * 1.2)}px`,
                    height: `${140 + (isMuted ? 0 : audioLevel * 1.2)}px`,
                  }}
                />
                <div 
                  className="absolute rounded-full bg-indigo-600/30 transition-all duration-75"
                  style={{
                    width: `${110 + (isMuted ? 0 : audioLevel * 0.8)}px`,
                    height: `${110 + (isMuted ? 0 : audioLevel * 0.8)}px`,
                  }}
                />
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl border-4 border-slate-900 z-10">
                  {channelName.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white">Voice Call</h3>
                <p className="text-xs text-slate-400">
                  {isRinging ? 'Calling...' : isMuted ? 'Your microphone is muted' : audioLevel > 15 ? 'Speaking...' : 'Connected • Audio output live'}
                </p>
              </div>

              {/* Real Audio Wave Meter */}
              <div className="flex items-center space-x-1 h-6">
                {[0.4, 0.8, 1.2, 0.6, 1.0, 0.5, 0.9, 0.3].map((factor, idx) => (
                  <div
                    key={idx}
                    className="w-1.5 bg-emerald-400 rounded-full transition-all duration-75"
                    style={{
                      height: isMuted ? '4px' : `${Math.max(4, audioLevel * factor * 0.3)}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Remote Peer Live Camera Video Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${peerConnected ? 'block' : 'hidden'}`}
              />

              {/* Main Local Camera Preview if Remote Video not yet active */}
              {!peerConnected && (
                <video
                  ref={mainVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
              )}

              {/* PiP Local Video Preview */}
              <div className="absolute bottom-28 right-5 w-28 sm:w-36 aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
              </div>
            </>
          )}

          {cameraError && !isVideoOff && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <VideoOff className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">Camera Unavailable</h4>
              <p className="text-xs text-slate-400 max-w-xs">{cameraError}</p>
              <button
                onClick={() => setIsVideoOff(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                Switch to Voice Call
              </button>
            </div>
          )}
        </div>

        {/* WhatsApp-Style Action Control Bar */}
        <div className="absolute bottom-0 inset-x-0 p-6 pb-8 flex justify-center items-center gap-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-30">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-white text-slate-950 shadow-lg' : 'bg-white/15 text-white backdrop-blur-md hover:bg-white/25'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isVideoOff ? 'bg-white text-slate-950 shadow-lg' : 'bg-white/15 text-white backdrop-blur-md hover:bg-white/25'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
          
          <button
            onClick={handleEndCallClick}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white transition-all shadow-lg shadow-rose-600/30"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>

      </div>
    </div>
  );
};
