import React from 'react';
import { Download, Volume2, VolumeX } from 'lucide-react';

interface TopNavProps {
  activeTab: 'simulator' | 'code' | 'architecture' | 'tuner';
  setActiveTab: (tab: 'simulator' | 'code' | 'architecture' | 'tuner') => void;
  isMuted: boolean;
  toggleMute: () => void;
  onDownloadZip: () => void;
  isDownloadingZip: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  isMuted,
  toggleMute,
  onDownloadZip,
  isDownloadingZip,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text wordmark */}
        <a
          href="#game"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('simulator');
          }}
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors"
        >
          <span className="font-['Chakra_Petch'] text-xl tracking-wider text-amber-400">APEX·RAYLIB</span>
          <span className="hidden sm:inline text-xs text-slate-400 font-mono">C++20 RACER</span>
        </a>

        {/* Zone 2: Clean 4-6 text navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            Play Simulator
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'code'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            C++ Sources
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            Architecture & Guide
          </button>
          <button
            onClick={() => setActiveTab('tuner')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'tuner'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            Physics Tuner
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute procedural audio' : 'Mute audio'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
          </button>

          <button
            onClick={onDownloadZip}
            disabled={isDownloadingZip}
            className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-white active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isDownloadingZip ? 'Archiving...' : 'Download C++ (.ZIP)'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
