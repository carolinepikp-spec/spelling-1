import React, { useState, useEffect } from 'react';
import {
  ParentProgressState,
  DyslexiaSettings,
  SpellingWord,
} from './types/spelling';
import {
  loadProgress,
  saveProgress,
  loadSettings,
  saveSettings,
  recordAttempt,
  getAllWords,
} from './utils/storage';
import { audio } from './utils/audio';
import { Navbar, ActiveTab } from './components/Navbar';
import { DragDownWordBuilder } from './components/DragDownWordBuilder';
import { BalloonPopGame } from './components/BalloonPopGame';
import { SyllablePuzzleGame } from './components/SyllablePuzzleGame';
import { MissingLetterGame } from './components/MissingLetterGame';
import { WordExplorerLab } from './components/WordExplorerLab';
import { ParentDashboard } from './components/ParentDashboard';
import { Sparkles, Heart } from 'lucide-react';

export default function App() {
  const [progress, setProgress] = useState<ParentProgressState>(loadProgress);
  const [settings, setSettings] = useState<DyslexiaSettings>(loadSettings);
  const [activeTab, setActiveTab] = useState<ActiveTab>('drag-down');
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);

  // Sync settings audio properties
  useEffect(() => {
    audio.setSoundEnabled(settings.soundEnabled);
    audio.setVoiceSpeed(settings.voiceSpeed);
  }, [settings]);

  const allWords: SpellingWord[] = getAllWords(progress.customWords);

  const handleUpdateSettings = (newSettings: DyslexiaSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleUpdateProgress = (next: ParentProgressState) => {
    setProgress(next);
    saveProgress(next);
  };

  const handleWordCompleted = (
    wordId: string,
    mistakes: string[],
    usedHint: boolean,
    secondsTaken: number
  ) => {
    const updated = recordAttempt(
      {
        wordId,
        word: allWords.find((w) => w.id === wordId)?.word || wordId,
        success: true,
        mistakes,
        usedHint,
        secondsTaken,
        gameMode:
          activeTab === 'balloon-pop'
            ? 'balloon-pop'
            : activeTab === 'syllable-puzzle'
            ? 'syllable-puzzle'
            : activeTab === 'detective'
            ? 'detective'
            : 'drag-down',
      },
      progress
    );
    setProgress(updated);
  };

  const handleAddCustomWord = (newWord: SpellingWord) => {
    const nextWords = [...progress.customWords, newWord];
    const next = { ...progress, customWords: nextWords };
    handleUpdateProgress(next);
  };

  const handleRemoveCustomWord = (wordId: string) => {
    const nextWords = progress.customWords.filter((w) => w.id !== wordId);
    const next = { ...progress, customWords: nextWords };
    handleUpdateProgress(next);
  };

  const handleResetProgress = () => {
    localStorage.removeItem('spellspark_parent_progress_v1');
    const fresh = loadProgress();
    setProgress(fresh);
  };

  // Determine container styling from dyslexia settings
  const tintClass = `tint-${settings.tint}`;
  const fontClass = `font-${settings.font}`;
  const spacingClass = `letter-spacing-${settings.letterSpacing}`;
  const bdClass = settings.bdHelper ? 'bd-assist' : '';

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${tintClass} ${fontClass} ${spacingClass} ${bdClass} flex flex-col`}
    >
      {/* Sticky Accessible Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        stars={progress.stars}
        childName={progress.childName}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Main Learning Playground */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8">
        {/* Quick Word Selection Track (Visible during interactive games) */}
        {activeTab !== 'parent-report' && activeTab !== 'word-lab' && (
          <div className="mb-6 flex items-center justify-between gap-2 overflow-x-auto p-2 bg-white/70 rounded-2xl border border-amber-200/80 shadow-2xs scrollbar-none">
            <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider shrink-0 pl-2">
              Words:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {allWords.map((w, idx) => {
                const stat = progress.wordStats[w.id];
                const isMastered = stat?.masteryStatus === 'mastered';
                const isSelected = idx === currentWordIndex;

                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      audio.playPop();
                      setCurrentWordIndex(idx);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 flex items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-xs scale-105'
                        : isMastered
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                        : 'bg-white/90 text-slate-700 hover:bg-amber-100/70 border border-slate-200'
                    }`}
                  >
                    <span>{w.emoji}</span>
                    <span>{w.word}</span>
                    {isMastered && <span className="text-[10px]">⭐</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 1: Drag-Down Word Boxes (Core Requested Feature) */}
        {activeTab === 'drag-down' && (
          <DragDownWordBuilder
            words={allWords}
            currentWordIndex={currentWordIndex}
            onSelectWordIndex={setCurrentWordIndex}
            settings={settings}
            onWordCompleted={handleWordCompleted}
          />
        )}

        {/* Tab 2: Balloon Pop Game */}
        {activeTab === 'balloon-pop' && (
          <BalloonPopGame
            words={allWords}
            currentWordIndex={currentWordIndex}
            onSelectWordIndex={setCurrentWordIndex}
            settings={settings}
            onWordCompleted={handleWordCompleted}
          />
        )}

        {/* Tab 3: Syllable Puzzle Chunking Game */}
        {activeTab === 'syllable-puzzle' && (
          <SyllablePuzzleGame
            words={allWords}
            currentWordIndex={currentWordIndex}
            onSelectWordIndex={setCurrentWordIndex}
            settings={settings}
            onWordCompleted={handleWordCompleted}
          />
        )}

        {/* Tab 4: Mystery Detective Game */}
        {activeTab === 'detective' && (
          <MissingLetterGame
            words={allWords}
            currentWordIndex={currentWordIndex}
            onSelectWordIndex={setCurrentWordIndex}
            settings={settings}
            onWordCompleted={handleWordCompleted}
          />
        )}

        {/* Tab 5: Word Lab & Kid Voice Recording */}
        {activeTab === 'word-lab' && (
          <WordExplorerLab
            words={allWords}
            currentWordIndex={currentWordIndex}
            onSelectWordIndex={setCurrentWordIndex}
            settings={settings}
          />
        )}

        {/* Tab 6: Parent Progress Reports */}
        {activeTab === 'parent-report' && (
          <ParentDashboard
            progress={progress}
            words={allWords}
            onUpdateProgress={handleUpdateProgress}
            onAddCustomWord={handleAddCustomWord}
            onRemoveCustomWord={handleRemoveCustomWord}
            onResetProgress={handleResetProgress}
          />
        )}
      </main>

      {/* Cheerful Accessible Footer */}
      <footer className="mt-auto py-5 border-t border-amber-200/60 bg-white/50 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>SpellSpark • Designed with love for 7-year-olds & dyslexic learners</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('parent-report')}
              className="text-amber-800 hover:text-amber-950 font-bold hover:underline"
            >
              📊 Parent Progress Portal
            </button>
            <span>•</span>
            <span className="text-slate-400">10 Core Words Included</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
