import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Gamepad2, 
  Play, 
  Sparkles, 
  Search, 
  Tv, 
  Monitor, 
  Smartphone, 
  Wifi, 
  ShieldCheck, 
  SlidersHorizontal, 
  Star, 
  ChevronRight, 
  Flame, 
  Zap, 
  Award, 
  Info, 
  X, 
  CheckCircle2, 
  Clock, 
  Layers,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { GAMES_LIST } from '../data/games';
import { Game } from '../types';
import { useAuth } from '../context/AuthContext';
import { IgStyleModal } from '../components/IgStyleModal';
import { BottomBar } from '../components/BottomBar';

export const CloudGamingPage: React.FC = () => {
  const { user } = useAuth();

  const [selectedGame, setSelectedGame] = useState<Game | null>(GAMES_LIST[0]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [launchModalGame, setLaunchModalGame] = useState<Game | null>(null);
  
  // IG-style modal state for account limit or cloud notice
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const categories = ['All', 'Action', 'RPG', 'Shooter', 'Sports', 'Racing', 'Strategy', 'Indie'];

  // Filter games based on search and category
  const filteredGames = GAMES_LIST.filter((game) => {
    const matchesCategory = activeCategory === 'All' || game.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.genre.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredGames = GAMES_LIST.slice(0, 5);
  const trendingGames = GAMES_LIST.filter(g => g.rating >= 4.5);
  const recentlyAdded = GAMES_LIST.slice(3, 9);

  const handleLaunchGame = (game: Game) => {
    if (user?.account_status === 'limited') {
      setModalMessage(`Your account is currently limited (${(user as any).account_limit_reason || 'Policy Notice'}). Cloud gaming sessions are currently restricted.`);
      setModalOpen(true);
      return;
    }
    setLaunchModalGame(game);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* IG-style Modal */}
      <IgStyleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Cloud Gaming Notice"
        message={modalMessage}
        type="limited"
        primaryActionLabel="View Account Status"
        onPrimaryAction={() => window.location.href = '/profile'}
      />

      {/* Top Console Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        
        {/* Left Brand */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition transform">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg text-white tracking-wider uppercase block leading-none">
                GAREXCELL <span className="text-indigo-400">CLOUD</span>
              </span>
              <span className="text-[9px] font-mono font-bold text-slate-400 tracking-widest uppercase">
                RTX 4090 SUPERCOMPUTER NODE
              </span>
            </div>
          </Link>

          {/* Quick Category Tabs for Desktop */}
          <nav className="hidden lg:flex items-center space-x-1 pl-4 border-l border-slate-800">
            {['Dashboard', 'Browse', 'Library', 'Cloud Pass'].map((tab, idx) => (
              <button
                key={tab}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  idx === 0 
                    ? 'bg-slate-800 text-white border border-slate-700/80 shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Search & Profile status */}
        <div className="flex items-center space-x-3">
          
          {/* Search bar */}
          <div className="relative hidden sm:block w-48 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cloud games..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-full text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* User Status Pill */}
          {user ? (
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center uppercase">
                {user.username ? user.username.charAt(0) : 'U'}
              </div>
              <span className="text-xs font-bold text-slate-200 hidden md:inline">
                @{user.username}
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                ULTIMATE
              </span>
            </div>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-full transition shadow-md shadow-indigo-600/30"
            >
              Sign In to Play
            </Link>
          )}

        </div>
      </header>

      {/* Main Console Hub */}
      <main className="flex-1 pb-16">
        
        {/* HERO BANNER FEATURED GAME */}
        {selectedGame && (
          <section className="relative w-full h-[380px] sm:h-[460px] overflow-hidden border-b border-slate-800/80">
            {/* Background Image with Gradient Overlay */}
            <img
              src={selectedGame.banner_url || selectedGame.thumbnail_url}
              alt={selectedGame.title}
              className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />

            {/* Hero Details Overlay */}
            <div className="relative max-w-7xl mx-auto h-full px-6 sm:px-8 flex flex-col justify-end pb-10 space-y-4">
              
              <div className="flex items-center space-x-2 text-xs font-mono font-bold">
                <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-md uppercase tracking-wider text-[10px] font-black">
                  FEATURED CLOUD TITLE
                </span>
                <span className="bg-slate-900/80 text-slate-300 border border-slate-700/80 px-2.5 py-0.5 rounded-md text-[10px]">
                  {selectedGame.category}
                </span>
                {selectedGame.developer && (
                  <span className="bg-slate-900/80 text-slate-300 border border-slate-700/80 px-2.5 py-0.5 rounded-md text-[10px] font-semibold text-indigo-300">
                    {selectedGame.developer}
                  </span>
                )}
                <span className="text-amber-400 flex items-center space-x-1 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{selectedGame.rating}</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none drop-shadow-md">
                {selectedGame.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl line-clamp-2 leading-relaxed">
                {selectedGame.description || 'Experience ultra-low latency cloud streaming powered by Garexcell high-performance server clusters. Play instantly across desktop, mobile, and browser.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => handleLaunchGame(selectedGame)}
                  className="px-7 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-indigo-600/30 flex items-center space-x-2.5 transition transform"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>INSTALL</span>
                </button>

                <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300">
                  <Monitor className="w-4 h-4 text-indigo-400" />
                  <span>4K @ 120 FPS Ready</span>
                </div>

                <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300">
                  <Gamepad2 className="w-4 h-4 text-emerald-400" />
                  <span>Controller Supported</span>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* CONTENT CONTAINER */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 space-y-10">
          
          {/* CATEGORY SELECTOR CHIPS */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition border ${
                  activeCategory === cat
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* POPULAR ON CLOUD PASS (CAROUSEL / GRID) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-black text-white tracking-wide uppercase">
                  Popular On Cloud Pass
                </h2>
              </div>
              <span className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer">
                View All ({filteredGames.length})
              </span>
            </div>

            {/* Game Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  onClick={() => setSelectedGame(game)}
                  className={`group relative bg-slate-900 border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-2xl ${
                    selectedGame?.id === game.id
                      ? 'border-indigo-500 ring-2 ring-indigo-500/40'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Poster Thumbnail */}
                  <div className="aspect-square relative overflow-hidden bg-slate-950 rounded-2xl p-1">
                    <img
                      src={game.thumbnail_url}
                      alt={game.title}
                      className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-50 rounded-2xl" />
                    
                    {/* Launch Play Overlay on Hover */}
                    <div className="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-2 backdrop-blur-[2px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLaunchGame(game);
                        }}
                        className="w-11 h-11 bg-white text-indigo-950 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition"
                      >
                        <Play className="w-5 h-5 fill-indigo-950 ml-0.5" />
                      </button>
                    </div>

                    {/* Category Badge top right */}
                    <span className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-800 text-[9px] font-bold px-2 py-0.5 rounded-md">
                      {game.category}
                    </span>
                  </div>

                  {/* Card Label */}
                  <div className="p-3 space-y-1 bg-slate-900">
                    <h3 className="text-xs font-bold text-white truncate group-hover:text-indigo-400 transition">
                      {game.title}
                    </h3>
                    {game.developer && (
                      <p className="text-[10px] text-slate-500 font-medium truncate">
                        {game.developer}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{game.genre}</span>
                      <span className="text-amber-400 font-bold flex items-center space-x-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        <span>{game.rating}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* JUMP BACK IN / RECENTLY PLAYED */}
          <section className="space-y-4 pt-4 border-t border-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-black text-white tracking-wide uppercase">
                  Jump Back In
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {GAMES_LIST.slice(0, 3).map((game) => (
                <div
                  key={`jump-${game.id}`}
                  className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 flex items-center space-x-4 transition cursor-pointer group"
                  onClick={() => handleLaunchGame(game)}
                >
                  <img
                    src={game.thumbnail_url}
                    alt={game.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-800"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">
                      SAVED STATE READY
                    </span>
                    <h4 className="text-sm font-extrabold text-white truncate group-hover:text-indigo-400 transition">
                      {game.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {game.genre} • Last active 2h ago
                    </p>
                  </div>
                  <button className="w-10 h-10 bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white rounded-xl flex items-center justify-center transition border border-indigo-500/30">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      {/* GAME LAUNCH MODAL */}
      {launchModalGame && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-2xl overflow-hidden">
            
            <button
              onClick={() => setLaunchModalGame(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 bg-slate-800 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>

            <img
              src={launchModalGame.thumbnail_url}
              alt={launchModalGame.title}
              className="w-24 h-24 rounded-2xl object-cover mx-auto shadow-2xl border-2 border-indigo-500/40"
            />

            <div className="space-y-1">
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase border border-indigo-500/30">
                APP STORE
              </span>
              <h3 className="text-2xl font-black text-white">{launchModalGame.title}</h3>
              {launchModalGame.developer && (
                <p className="text-sm font-semibold text-indigo-400">{launchModalGame.developer}</p>
              )}
              <p className="text-xs text-slate-400">{launchModalGame.genre} • {launchModalGame.category}</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 text-left">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified by App Store</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">SECURE</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center space-x-2">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>Rating</span>
                </span>
                <span className="font-mono text-amber-400 font-bold">{launchModalGame.rating} / 5.0</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  alert(`Installing ${launchModalGame.title}... You will be notified when it's ready.`);
                  setLaunchModalGame(null);
                }}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>INSTALL GAME</span>
              </button>

              <button
                onClick={() => setLaunchModalGame(null)}
                className="w-full py-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-2xl text-xs font-bold transition"
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
