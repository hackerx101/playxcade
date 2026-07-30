import React, { useState } from 'react';
import { X, Radio, Video, Camera, Settings, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StartStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StartStreamModal: React.FC<StartStreamModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [streamTitle, setStreamTitle] = useState('Ranked Cyber Arena Supremacy | Playxcade Live');
  const [gameCategory, setGameCategory] = useState('Warlands');
  const [isLive, setIsLive] = useState(false);

  if (!isOpen) return null;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLive(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center space-x-2 text-rose-600">
            <Radio className="w-5 h-5 animate-pulse" />
            <h3 className="font-extrabold text-lg">Garexcell Live Broadcast Studio</h3>
          </div>
          <button
            onClick={() => {
              setIsLive(false);
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600:text-slate-200 rounded-lg hover:bg-slate-100:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isLive ? (
          <form onSubmit={handleStart} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Stream Title
              </label>
              <input
                type="text"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Game Category
              </label>
              <select
                value={gameCategory}
                onChange={(e) => setGameCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 text-slate-900"
              >
                <option value="Warlands">Warlands: Cyber Realm</option>
                <option value="Apex Overdrive">Apex Overdrive</option>
                <option value="Mythic Clash">Mythic Clash Online</option>
                <option value="Shadow Rift">Shadow Rift Chronicles</option>
                <option value="PixelFront">PixelFront Operations</option>
              </select>
            </div>

            {/* Camera Preview Simulator */}
            <div className="relative aspect-video w-full rounded-xl bg-slate-950 flex flex-col items-center justify-center text-slate-400 overflow-hidden border border-slate-800">
              <Camera className="w-10 h-10 mb-2 text-rose-500 animate-pulse" />
              <p className="text-xs font-semibold text-slate-300">Camera & Microphone Active</p>
              <p className="text-[10px] text-slate-500">Garexcell Low-Latency Streaming Pipeline Connected</p>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg flex items-center space-x-2 transition"
              >
                <Radio className="w-4 h-4" />
                <span>Go Live Now</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 font-bold text-xs">
              <Radio className="w-4 h-4 animate-ping text-rose-500" />
              <span>LIVE ON PLAYXCADE</span>
            </div>
            <h4 className="text-lg font-bold text-slate-900">{streamTitle}</h4>
            <p className="text-xs text-slate-500">Broadcasting under category: <span className="font-semibold text-indigo-600">{gameCategory}</span></p>

            <div className="aspect-video bg-slate-950 rounded-xl flex items-center justify-center relative overflow-hidden border border-rose-500/30">
              <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                LIVE • 1,248 Viewers
              </div>
              <div className="text-center p-4">
                <Video className="w-12 h-12 text-rose-500 mx-auto mb-2 animate-bounce" />
                <p className="text-xs font-bold text-slate-200">Your Live Stream Stream is Active!</p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsLive(false);
                onClose();
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
            >
              End Broadcast
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
