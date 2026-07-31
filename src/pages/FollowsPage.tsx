import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { IOSBackButton } from '../components/IOSBackButton';
import { Navbar } from '../components/Navbar';
import { BottomBar } from '../components/BottomBar';
import { FollowButton } from '../components/FollowButton';
import { useAuth } from '../context/AuthContext';

export const FollowsPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeSubTab = searchParams.get('subtab') || 'followers';

  // For this prototype, we'll simulate followers/following data
  // In a real app, we'd fetch this from Firebase
  const followers = ['gamer1', 'pro_player', 'streamer_x'];
  const following = ['dev_user', 'game_studio'];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 font-sans">
      <Navbar showLiveIcon={false} />
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        <div className="flex items-center space-x-2">
            <IOSBackButton onClick={() => navigate(-1)} label="Back" />
            <h1 className="font-bold text-lg">@{username}</h1>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setSearchParams({ subtab: 'followers' })}
            className={`flex-1 py-3 text-sm font-bold ${
              activeSubTab === 'followers' ? 'text-slate-950 border-b-2 border-slate-950' : 'text-slate-500'
            }`}
          >
            Followers
          </button>
          <button
            onClick={() => setSearchParams({ subtab: 'following' })}
            className={`flex-1 py-3 text-sm font-bold ${
              activeSubTab === 'following' ? 'text-slate-950 border-b-2 border-slate-950' : 'text-slate-500'
            }`}
          >
            Following
          </button>
        </div>

        <div className="space-y-4">
          {(activeSubTab === 'followers' ? followers : following).map((u) => (
            <div key={u} className="flex items-center justify-between p-3">
              <div className="flex items-center space-x-3">
                <img
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${u}`}
                  alt={u}
                  className="w-10 h-10 rounded-full bg-slate-100"
                />
                <span className="font-bold text-sm">@{u}</span>
              </div>
              <FollowButton targetUserId={`u_${u}`} targetUsername={u} size="sm" className="rounded-full bg-black text-white hover:bg-slate-800" />
            </div>
          ))}
        </div>
      </main>
      <BottomBar />
    </div>
  );
};
