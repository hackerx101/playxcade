import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Gamepad2, 
  Wifi, 
  Tv, 
  ShieldCheck, 
  Lock, 
  Search, 
  Sparkles, 
  SlidersHorizontal, 
  Zap, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  Star, 
  ArrowLeft,
  Server,
  CloudLightning,
  MonitorPlay,
  Volume2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface GameItem {
  id: string;
  title: string;
  genre: string;
  rating: number;
  coverImage: string;
  badge?: string;
  fps: string;
  resolution: string;
  rayTracing: boolean;
  category: 'featured' | 'action' | 'shooter' | 'rpg' | 'indie';
}

const CLOUD_GAMES: GameItem[] = [
  {
    id: 'cyberpunk-2077',
    title: 'Cyberpunk 2077: Phantom Liberty',
    genre: 'Sci-Fi RPG / Action',
    rating: 4.9,
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    badge: '4K ULTRA HDR',
    fps: '120 FPS',
    resolution: '4K (3840x2160)',
    rayTracing: true,
    category: 'rpg'
  },
  {
    id: 'elden-ring',
    title: 'Elden Ring: Shadow of the Erdtree',
    genre: 'Action RPG / Open World',
    rating: 4.9,
    coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    badge: 'MUST PLAY',
    fps: '120 FPS',
    resolution: '4K (3840x2160)',
    rayTracing: true,
    category: 'rpg'
  },
  {
    id: 'valorant-cloud',
    title: 'Valorant Cloud Pro Arena',
    genre: 'Tactical FPS / Competitive',
    rating: 4.8,
    coverImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
    badge: 'LOW LATENCY 12ms',
    fps: '240 FPS',
    resolution: '1440p (2560x1440)',
    rayTracing: false,
    category: 'shooter'
  },
  {
    id: 'forza-horizon-5',
    title: 'Forza Horizon 5: Rally Adventure',
    genre: 'Racing / Simulation',
    rating: 4.8,
    coverImage: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
    badge: 'DOLBY ATMOS',
    fps: '120 FPS',
    resolution: '4K (3840x2160)',
    rayTracing: true,
    category: 'featured'
  },
  {
    id: 'street-fighter-6',
    title: 'Street Fighter VI Ultra',
    genre: 'Fighting / Multiplayer',
    rating: 4.7,
    coverImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
    badge: 'ROLLBACK NETCODE',
    fps: '120 FPS',
    resolution: '4K (3840x2160)',
    rayTracing: true,
    category: 'action'
  },
  {
    id: 'hollow-knight-silksong',
    title: 'Hollow Knight: Silksong',
    genre: 'Metroidvania / Platformer',
    rating: 5.0,
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    badge: 'INDIE GEM',
    fps: '120 FPS',
    resolution: '1440p',
    rayTracing: false,
    category: 'indie'
  }
];

export const CloudGamingPage: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState('US-East 01 (Virginia)');

  const filteredGames = CLOUD_GAMES.filter((game) => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.genre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Cloud Gaming Status Banner */}
      <div className="bg-gradient-to-r from-indigo-900/80 via-slate-900 to-slate-950 border-b border-indigo-500/20 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* User Logged In Info */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || 'Guest'}`}
                alt={user?.username || 'Gamer'}
                className="w-10 h-10 rounded-xl border-2 border-indigo-400/50 object-cover shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" title="Online" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400">
                  {user ? 'Already logged in as' : 'Browsing Cloud as Guest'}
                </span>
                <span className="text-sm font-black text-white">
                  @{user?.username || 'Guest_Gamer'}
                </span>
                {user?.IsIdentityVerify && (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" title="Verified Player" />
                )}
              </div>
              <p className="text-[11px] text-indigo-300/80 font-medium flex items-center space-x-2">
                <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded text-[10px] font-bold border border-indigo-500/30">
                  {user ? 'CLOUDPASS VIP' : 'GUEST MODE'}
                </span>
                <span>• Garexcell RTX 4090 Cloud Instance Ready</span>
                {!user && (
                  <Link to="/auth" className="text-indigo-400 hover:underline font-bold ml-1">
                    [Sign In to Sync]
                  </Link>
                )}
              </p>
            </div>
          </div>

          {/* Telemetry Quick Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center space-x-1.5 text-emerald-400">
              <Wifi className="w-3.5 h-3.5 animate-pulse" />
              <span>11ms Ping</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center space-x-1.5 text-indigo-400">
              <Server className="w-3.5 h-3.5" />
              <span>{selectedRegion}</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center space-x-1.5 text-amber-400">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Xbox Wireless Controller Connected</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Navigation Breadcrumb & Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/feed"
            className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Social Feed</span>
          </Link>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <CloudLightning className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-200">Playxcade Cloud Engine v3.4</span>
          </div>
        </div>

        {/* Hero Showcase Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-indigo-500/20 bg-slate-900 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10" />
          <img
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80"
            alt="Cyberpunk Cloud Showcase"
            className="w-full h-80 sm:h-96 object-cover object-center opacity-40 scale-105"
          />

          <div className="absolute inset-0 z-20 p-6 sm:p-10 flex flex-col justify-end max-w-2xl space-y-4">
            <div className="flex items-center space-x-2">
              <span className="bg-indigo-600 text-white font-black text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full border border-indigo-400/40">
                Featured Stream
              </span>
              <span className="bg-slate-800/80 text-emerald-400 text-xs font-mono px-2.5 py-1 rounded-full border border-slate-700 flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5" />
                <span>4K @ 120 FPS HDR</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              CYBERPUNK 2077: PHANTOM LIBERTY
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2">
              Stream full ray-traced Night City instantly with zero downloads. Powered by Garexcell enterprise GPU servers with direct hardware sync.
            </p>

            {/* Play Button - Explicitly Disabled as requested */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                disabled={true}
                className="px-6 py-3.5 bg-slate-800/80 text-slate-400 cursor-not-allowed font-extrabold rounded-2xl text-sm border border-slate-700 flex items-center space-x-2.5 opacity-80 shadow-lg"
                title="Play button disabled during Cloud Server Provisioning Beta"
              >
                <Lock className="w-4 h-4 text-slate-500" />
                <span>Play in Cloud (Server Provisioning Beta)</span>
              </button>

              <span className="text-xs font-medium text-slate-400 bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-xl">
                ⚠️ Play buttons disabled while cloud stream clusters undergo maintenance
              </span>
            </div>
          </div>
        </div>

        {/* Search and Category Selector */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cloud gaming library..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Titles' },
              { id: 'rpg', label: 'RPGs & Open World' },
              { id: 'shooter', label: 'FPS & Shooters' },
              { id: 'action', label: 'Fighting & Action' },
              { id: 'indie', label: 'Indie Gems' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

        </div>

        {/* Games Library Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
              <MonitorPlay className="w-5 h-5 text-indigo-400" />
              <span>Available Cloud Stream Titles ({filteredGames.length})</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">RTX 4090 GPU Node Enabled</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game) => (
              <div
                key={game.id}
                className="group bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between shadow-xl"
              >
                {/* Cover Image */}
                <div className="relative h-48 overflow-hidden bg-slate-950">
                  <img
                    src={game.coverImage}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />

                  {/* Badge */}
                  {game.badge && (
                    <span className="absolute top-3 left-3 bg-slate-950/90 text-indigo-300 border border-indigo-500/30 font-extrabold text-[10px] px-2.5 py-1 rounded-lg">
                      {game.badge}
                    </span>
                  )}

                  {/* Rating */}
                  <span className="absolute top-3 right-3 bg-slate-950/90 text-amber-400 border border-amber-500/30 font-bold text-xs px-2 py-0.5 rounded-lg flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{game.rating}</span>
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                      {game.genre}
                    </p>
                    <h3 className="text-lg font-extrabold text-white group-hover:text-indigo-300 transition">
                      {game.title}
                    </h3>
                  </div>

                  {/* Specs List */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500">FPS: </span>
                      <span className="text-emerald-400 font-bold">{game.fps}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Resolution: </span>
                      <span className="text-white font-bold">{game.resolution}</span>
                    </div>
                  </div>

                  {/* Action Play Button - Disabled as requested */}
                  <div className="pt-1">
                    <button
                      disabled={true}
                      className="w-full py-3 bg-slate-800/90 text-slate-400 cursor-not-allowed font-bold rounded-xl text-xs border border-slate-700/80 flex items-center justify-center space-x-2 transition opacity-75"
                      title="Play button disabled during Cloud Beta"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Play in Cloud (Disabled)</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cloud Infrastructure Telemetry Footer Panel */}
        <div className="p-6 bg-slate-900/90 border border-indigo-500/20 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-extrabold text-white">Garexcell Cloud Stream Health</h3>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-bold">100% Operational</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">CURRENT PING</span>
              <span className="text-emerald-400 font-bold text-sm">11 ms</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">STREAM BITRATE</span>
              <span className="text-indigo-300 font-bold text-sm">48.5 Mbps</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">PACKET LOSS</span>
              <span className="text-emerald-400 font-bold text-sm">0.00%</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">CLOUD SAVES</span>
              <span className="text-amber-400 font-bold text-sm">Synced with Vault</span>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
