import React, { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';

interface IncomingCallModalProps {
  callerName: string;
  channelName: string;
  type: 'video' | 'voice';
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  callerName,
  channelName,
  type,
  onAccept,
  onDecline
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Play incoming ringtone
    const audio = new Audio('https://www.soundjay.com/phone/telephone-ring-03a.mp3');
    audio.loop = true;
    audio.play().catch(e => console.warn('Ringtone autoplay blocked', e));
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] text-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col items-center border border-white/10 animate-in zoom-in-95 duration-300">
        
        <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-6">
          Incoming {type === 'video' ? 'Video' : 'Voice'} Call
        </p>

        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-[#2c2c2e] mb-4">
          {callerName.charAt(0).toUpperCase()}
        </div>

        <h3 className="text-2xl font-bold mb-1">{callerName}</h3>
        <p className="text-gray-400 text-sm mb-8">in #{channelName}</p>

        <div className="flex w-full justify-between px-6">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onDecline}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg shadow-red-500/20"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
            <span className="text-xs font-medium text-gray-400">Decline</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onAccept}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all shadow-lg shadow-green-500/20 animate-pulse"
            >
              {type === 'video' ? (
                <Video className="w-7 h-7 text-white" />
              ) : (
                <Phone className="w-7 h-7 text-white" />
              )}
            </button>
            <span className="text-xs font-medium text-gray-400">Accept</span>
          </div>
        </div>

      </div>
    </div>
  );
};
