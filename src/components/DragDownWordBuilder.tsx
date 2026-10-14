import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { SpellingWord, DyslexiaSettings } from '../types/spelling';
import { audio } from '../utils/audio';
import {
  Volume2,
  Snail,
  Lightbulb,
  RotateCcw,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

interface DragDownWordBuilderProps {
  words: SpellingWord[];
  currentWordIndex: number;
  onSelectWordIndex: (idx: number) => void;
  settings: DyslexiaSettings;
  onWordCompleted: (wordId: string, mistakes: string[], usedHint: boolean, secondsTaken: number) => void;
}

interface LetterItem {
  id: string; // unique id so duplicate letters (e.g. 'g' in 'soggy') have distinct identities
  char: string;
}

export const DragDownWordBuilder: React.FC<DragDownWordBuilderProps> = ({
  words,
  currentWordIndex,
  onSelectWordIndex,
  settings,
  onWordCompleted,
}) => {
  const word = words[currentWordIndex] || words[0];
  const targetChars = word.word.toLowerCase().split('');

  // Letters currently placed in the drop boxes (length equals targetChars.length)
  const [placedSlots, setPlacedSlots] = useState<(LetterItem | null)[]>([]);
  // Letters available in the top tray (scrambled)
  const [availableTray, setAvailableTray] = useState<LetterItem[]>([]);
  // Tracking
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [usedHint, setUsedHint] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [highlightSlot, setHighlightSlot] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<LetterItem | null>(null);
  const [activeDragTarget, setActiveDragTarget] = useState<number | null>(null);

  // Initialize letters whenever the active word changes
  useEffect(() => {
    initWord(word);
  }, [word]);

  const initWord = (currentWord: SpellingWord) => {
    const chars = currentWord.word.toLowerCase().split('');
    const items: LetterItem[] = chars.map((char, index) => ({
      id: `${char}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      char,
    }));

    // Scramble the tray so it's not pre-spelled
    const scrambled = [...items].sort(() => Math.random() - 0.5);
    // If it accidentally scrambled in exact order and length > 2, swap first two
    if (scrambled.map((s) => s.char).join('') === currentWord.word && scrambled.length > 2) {
      const temp = scrambled[0];
      scrambled[0] = scrambled[1];
      scrambled[1] = temp;
    }

    setAvailableTray(scrambled);
    setPlacedSlots(new Array(chars.length).fill(null));
    setMistakes([]);
    setUsedHint(false);
    setIsCompleted(false);
    setHighlightSlot(null);
    setStartTime(Date.now());

    // Play word audio on load
    setTimeout(() => {
      audio.speakWord(currentWord.word);
    }, 200);
  };

  // Check if the current placed slots spell the word
  useEffect(() => {
    if (placedSlots.length === 0 || isCompleted) return;

    const allFilled = placedSlots.every((slot) => slot !== null);
    if (!allFilled) return;

    const spelledWord = placedSlots.map((s) => s?.char).join('');
    if (spelledWord === word.word.toLowerCase()) {
      // SUCCESS!
      setIsCompleted(true);
      audio.playCelebrationFanfare();
      setTimeout(() => {
        audio.speakEncouragement();
      }, 500);

      // Trigger Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
      });

      const secondsTaken = Math.max(2, Math.round((Date.now() - startTime) / 1000));
      onWordCompleted(word.id, mistakes, usedHint, secondsTaken);
    } else {
      // Gentle Try Again cue
      audio.playGentleNudge();
      const firstMistakeSlot = placedSlots.findIndex((s, idx) => s && s.char !== targetChars[idx]);
      if (firstMistakeSlot !== -1 && placedSlots[firstMistakeSlot]) {
        const wrongChar = placedSlots[firstMistakeSlot]!.char;
        setMistakes((prev) => [...prev, wrongChar]);
        audio.speakGentleTryAgain(`Let's check the letters in the boxes.`);
      }
    }
  }, [placedSlots]);

  // Drop a letter item into a specific slot
  const placeInSlot = (item: LetterItem, slotIndex: number) => {
    audio.playSnap();
    audio.speak(item.char);

    // If slot was occupied, return old item to tray
    const existingInSlot = placedSlots[slotIndex];

    const nextSlots = [...placedSlots];
    nextSlots[slotIndex] = item;
    setPlacedSlots(nextSlots);

    // Remove item from tray, add back old one if existed
    setAvailableTray((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      if (existingInSlot) {
        return [...filtered, existingInSlot];
      }
      return filtered;
    });

    setHighlightSlot(null);
  };

  // Tap a letter in the tray -> automatically drops into the first open slot
  const handleTrayLetterClick = (item: LetterItem) => {
    if (isCompleted) return;

    const firstEmptyIndex = placedSlots.findIndex((s) => s === null);
    if (firstEmptyIndex !== -1) {
      placeInSlot(item, firstEmptyIndex);
    } else {
      // All slots full, bounce gentle nudge
      audio.playGentleNudge();
    }
  };

  // Tap a placed letter -> sends it back to the tray
  const handleSlotLetterClick = (slotIndex: number) => {
    if (isCompleted) return;
    const item = placedSlots[slotIndex];
    if (!item) return;

    audio.playSnap();
    const nextSlots = [...placedSlots];
    nextSlots[slotIndex] = null;
    setPlacedSlots(nextSlots);
    setAvailableTray((prev) => [...prev, item]);
  };

  // Drag & drop handlers
  const handleDragStart = (item: LetterItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    setActiveDragTarget(slotIndex);
  };

  const handleDragLeave = () => {
    setActiveDragTarget(null);
  };

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    setActiveDragTarget(null);
    if (draggedItem) {
      placeInSlot(draggedItem, slotIndex);
      setDraggedItem(null);
    }
  };

  // Provide a gentle hint
  const giveHint = () => {
    audio.playStarSound();
    setUsedHint(true);

    // Find the first unfilled or incorrectly filled slot
    const targetIdx = placedSlots.findIndex(
      (s, idx) => s === null || s.char !== targetChars[idx]
    );

    if (targetIdx !== -1) {
      setHighlightSlot(targetIdx);
      const neededChar = targetChars[targetIdx];
      audio.speak(`Look for the letter "${neededChar.toUpperCase()}" for box number ${targetIdx + 1}!`);
    } else {
      audio.speakWord(word.word);
    }
  };

  const nextWord = () => {
    audio.playPop();
    const nextIdx = (currentWordIndex + 1) % words.length;
    onSelectWordIndex(nextIdx);
  };

  const prevWord = () => {
    audio.playPop();
    const prevIdx = (currentWordIndex - 1 + words.length) % words.length;
    onSelectWordIndex(prevIdx);
  };

  // Syllables boundary visual calculator
  let runningCharCount = 0;
  const syllableRanges = word.syllables.map((syl) => {
    const start = runningCharCount;
    const end = start + syl.length - 1;
    runningCharCount += syl.length;
    return { syllable: syl, start, end };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Word Navigator & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white/80 rounded-2xl border border-amber-200/80 shadow-sm backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWord}
            className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-all"
            aria-label="Previous Word"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Word {currentWordIndex + 1} of {words.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{word.emoji}</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                {word.word}
              </h2>
            </div>
          </div>
          <button
            onClick={nextWord}
            className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-all"
            aria-label="Next Word"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => audio.speakWord(word.word)}
            className="px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 btn-tactile shadow-blue-300"
            title="Hear Word Pronunciation"
          >
            <Volume2 className="w-4 h-4" />
            <span>Hear Word</span>
          </button>

          <button
            onClick={() => audio.speakSlow(word.word)}
            className="px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 btn-tactile shadow-teal-300"
            title="Slow Turtle Pronunciation"
          >
            <Snail className="w-4 h-4" />
            <span className="hidden sm:inline">Slow</span>
          </button>

          <button
            onClick={() => audio.speakLetters(word.word)}
            className="px-3 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 btn-tactile shadow-purple-300"
            title="Spell Letters Aloud"
          >
            <span>🔤 Spell</span>
          </button>

          <button
            onClick={giveHint}
            className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold text-xs sm:text-sm flex items-center gap-1.5 btn-tactile shadow-amber-300"
            title="Get a friendly hint"
          >
            <Lightbulb className="w-4 h-4 text-amber-900" />
            <span className="hidden sm:inline">Hint</span>
          </button>
        </div>
      </div>

      {/* Main Drag-Down Interactive Board */}
      <div className="p-6 sm:p-8 bg-white/90 rounded-3xl border-3 border-amber-300/80 shadow-xl space-y-8 relative overflow-hidden">
        {/* Kid-Friendly Meaning & Picture Bar */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-3xl shrink-0 border border-amber-200">
            {word.emoji}
          </div>
          <div className="text-center sm:text-left flex-1 space-y-1">
            <p className="text-sm sm:text-base font-bold text-slate-700">
              "{word.definition}"
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-amber-800">
              <span className="bg-amber-200/60 px-2 py-0.5 rounded-md">
                {word.partOfSpeech}
              </span>
              <span>•</span>
              <button
                onClick={() => audio.speakSentence(word.sentence)}
                className="hover:underline flex items-center gap-1 text-blue-700"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Hear in a sentence</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1. TOP: The Scrambled Letter Tray */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            <span className="flex items-center gap-1">
              <span>👇 Grab Letters & Drag Down to Boxes</span>
              <span className="text-[11px] font-normal normal-case text-slate-400">
                (or tap to drop)
              </span>
            </span>
            <button
              onClick={() => initWord(word)}
              className="text-amber-700 hover:text-amber-900 flex items-center gap-1 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="min-h-20 p-4 rounded-2xl bg-slate-100/80 border-2 border-dashed border-slate-300 flex flex-wrap items-center justify-center gap-3">
            {availableTray.length === 0 ? (
              <p className="text-sm font-semibold text-slate-400 italic">
                All letters placed in the boxes below! ✨
              </p>
            ) : (
              availableTray.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  onClick={() => handleTrayLetterClick(item)}
                  className={`w-14 h-16 sm:w-16 sm:h-20 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 border-b-4 border-amber-600 text-amber-950 font-black text-3xl sm:text-4xl flex items-center justify-center cursor-grab active:cursor-grabbing select-none shadow-md transition-transform hover:-translate-y-1 active:translate-y-1 ${
                    settings.bdHelper && item.char === 'b' ? 'ring-3 ring-blue-500' : ''
                  } ${
                    settings.bdHelper && item.char === 'd' ? 'ring-3 ring-pink-500' : ''
                  }`}
                >
                  {settings.uppercaseMode ? item.char.toUpperCase() : item.char}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. BOTTOM: The Drag-Down Word Boxes (Slots) */}
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ⬇️ Drag-Down Word Construction Boxes
            </p>
          </div>

          {/* Boxes Row */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-2">
            {targetChars.map((targetChar, slotIdx) => {
              const placed = placedSlots[slotIdx];
              const isSlotTarget = activeDragTarget === slotIdx;
              const isHinted = highlightSlot === slotIdx;
              const isCorrect = placed && placed.char === targetChar;

              return (
                <div key={slotIdx} className="flex flex-col items-center">
                  {/* Slot Number */}
                  <span className="text-[10px] font-bold text-slate-400 mb-1">
                    {slotIdx + 1}
                  </span>

                  {/* Drop Box Slot */}
                  <div
                    onDragOver={(e) => handleDragOver(e, slotIdx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, slotIdx)}
                    onClick={() => handleSlotLetterClick(slotIdx)}
                    className={`w-14 h-16 sm:w-16 sm:h-20 rounded-2xl flex items-center justify-center select-none transition-all cursor-pointer relative ${
                      placed
                        ? isCorrect
                          ? 'bg-emerald-100 border-b-4 border-emerald-500 text-emerald-950 shadow-md font-black text-3xl sm:text-4xl scale-102'
                          : 'bg-amber-100 border-b-4 border-amber-400 text-amber-950 shadow-sm font-black text-3xl sm:text-4xl'
                        : isSlotTarget
                        ? 'bg-blue-100 border-3 border-blue-500 ring-4 ring-blue-200 scale-105'
                        : isHinted
                        ? 'bg-amber-100 border-3 border-amber-500 animate-soft-pulse'
                        : 'bg-white border-2 border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50/50'
                    }`}
                  >
                    {placed ? (
                      <span
                        className={`${
                          settings.bdHelper && placed.char === 'b' ? 'text-blue-700 underline' : ''
                        } ${
                          settings.bdHelper && placed.char === 'd' ? 'text-pink-700 underline' : ''
                        }`}
                      >
                        {settings.uppercaseMode ? placed.char.toUpperCase() : placed.char}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-2xl font-bold">
                        {isHinted ? targetChar.toUpperCase() : '·'}
                      </span>
                    )}

                    {/* Remove icon hint when filled */}
                    {placed && !isCompleted && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-400 text-white text-[10px] flex items-center justify-center opacity-0 hover:opacity-100">
                        ✕
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Syllable Chunk Guides Under the Boxes */}
          {settings.syllableColoring && word.syllables.length > 1 && (
            <div className="pt-2 flex items-center justify-center gap-2">
              <span className="text-xs font-bold text-slate-500">Syllable chunks:</span>
              <div className="flex items-center gap-1.5">
                {word.syllables.map((syl, i) => (
                  <span
                    key={i}
                    onClick={() => audio.speak(syl)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold cursor-pointer hover:bg-indigo-100 transition-all"
                    title="Click to hear syllable"
                  >
                    🔊 {syl}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tricky Spot Tip for Dyslexic Learner */}
        <div className="p-3.5 rounded-2xl bg-violet-50 border border-violet-200 flex items-start gap-3 text-xs sm:text-sm text-violet-900">
          <div className="p-1 rounded-lg bg-violet-200 text-violet-800 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-violet-950">Spelling Detective Tip: </span>
            <span>{word.trickyPart}</span>
          </div>
        </div>

        {/* Success Modal / Banner */}
        {isCompleted && (
          <div className="p-5 rounded-2xl bg-emerald-500 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-full bg-white text-emerald-600 flex items-center justify-center text-2xl font-black shadow-md shrink-0">
                ⭐
              </div>
              <div>
                <h4 className="text-lg font-black">
                  Hooray! You spelled "{word.word.toUpperCase()}"!
                </h4>
                <p className="text-xs sm:text-sm text-emerald-100">
                  +{usedHint ? '1 Star' : '2 Stars'} earned! Keep shining bright!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => initWord(word)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm transition-all"
              >
                Play Again
              </button>
              <button
                onClick={nextWord}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-sm flex items-center justify-center gap-2 btn-tactile shadow-amber-600"
              >
                <span>Next Word</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sentence Example Card */}
      <div className="p-4 rounded-2xl bg-white/70 border border-amber-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">📖</span>
          <p className="text-xs sm:text-sm text-slate-700 italic">
            "{word.sentence}"
          </p>
        </div>
        <button
          onClick={() => audio.speakSentence(word.sentence)}
          className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shrink-0"
          title="Read sentence aloud"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
