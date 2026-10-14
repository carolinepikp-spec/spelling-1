import React from 'react';
import { DyslexiaSettings } from '../types/spelling';
import { DyslexiaToolbar } from './DyslexiaToolbar';
import { Sparkles, Award } from 'lucide-react';
import { audio } from '../utils/audio';

export type ActiveTab =
  | 'drag-down'
  | 'balloon-pop'
  | 'syllable-puzzle'
  | 'detective'
  | 'word-lab'
  | 'parent-report';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  stars: number;
  childName: string;
  settings: DyslexiaSettings;
  onUpdateSettings: (settings: DyslexiaSettings) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  stars,
  childName,
  settings,
  onUpdateSettings,
}) => {
  const tabs: { id: ActiveTab; label: string; icon: string; highlight?: boolean }[] = [
    { id: 'drag-down', label: 'Drag-Down Boxes', icon: '📦', highlight: true },
    { id: 'balloon-pop', label: 'Balloon Pop', icon: '🎈' },
    { id: 'syllable-puzzle', label: 'Syllables Puzzle', icon: '🧩' },
    { id: 'detective', label: 'Mystery Detective', icon: '🔍' },
    { id: 'word-lab', label: 'Word Lab & Voice', icon: '🎙️' },
    { id: 'parent-report', label: 'Parent Report', icon: '📊' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-2 border-amber-200/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-3 space-y-2.5">
        {/* Top Row: Brand, Dyslexia Tools, Stars */}
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Child greeting */}
          <div
            onClick={() => {
              audio.playStarSound();
              onSelectTab('drag-down');
            }}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-linear-to-tr from-amber-400 to-amber-200 text-amber-950 flex items-center justify-center text-2xl shadow-md border-2 border-amber-300 group-hover:scale-105 transition-transform">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black text-amber-950 tracking-tight">
                  Spell<span className="text-amber-600">Spark</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider hidden sm:inline">
                  Age 7 Fun
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 hidden sm:block">
                Hi, {childName || 'Champion'}! Ready to spell?
              </p>
            </div>
          </div>

          {/* Right Tools: Dyslexia Toolbar & Star Bank */}
          <div className="flex items-center gap-2 sm:gap-3">
            <DyslexiaToolbar
              settings={settings}
              onUpdateSettings={onUpdateSettings}
            />

            {/* Stars Bank Pill */}
            <div
              onClick={() => {
                audio.playStarSound();
                audio.speak(`You have ${stars} stars! Keep collecting!`);
              }}
              className="px-3.5 py-1.5 rounded-2xl bg-linear-to-r from-amber-400 to-yellow-300 border-2 border-amber-400 text-amber-950 font-black text-sm sm:text-base flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-105 transition-transform"
              title="Your Star Bank"
            >
              <span className="text-lg animate-bounce">⭐</span>
              <span>{stars}</span>
            </div>
          </div>
        </div>

        {/* Bottom Row: Game Navigation Tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  audio.playPop();
                  onSelectTab(tab.id);
                }}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shrink-0 transition-all select-none ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-md border-b-3 border-amber-700 scale-102'
                    : 'bg-amber-50/80 hover:bg-amber-100/80 text-amber-900 border border-amber-200'
                } ${tab.highlight && !isActive ? 'ring-2 ring-amber-300' : ''}`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
