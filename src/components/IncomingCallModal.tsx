import React, { useEffect } from 'react';
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

  useEffect(() => {
    // Play Web Audio API ringtone synthesizer over speaker
    let audioCtx: AudioContext | null = null;
    let intervalId: any = null;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();

        const playTonePattern = () => {
          if (!audioCtx || audioCtx.state === 'closed') return;
          if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc1.frequency.setValueAtTime(440, audioCtx.currentTime);
          osc2.frequency.setValueAtTime(480, audioCtx.currentTime);

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
      }
    } catch (e) {
      console.warn('Ringtone playback error:', e);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
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
