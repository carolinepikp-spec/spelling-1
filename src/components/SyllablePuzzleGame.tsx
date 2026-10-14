import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SpellingWord, DyslexiaSettings } from '../types/spelling';
import { audio } from '../utils/audio';
import { Volume2, Snail, ArrowRight, Sparkles, Puzzle } from 'lucide-react';

interface SyllablePuzzleGameProps {
  words: SpellingWord[];
  currentWordIndex: number;
  onSelectWordIndex: (idx: number) => void;
  settings: DyslexiaSettings;
  onWordCompleted: (wordId: string, mistakes: string[], usedHint: boolean, secondsTaken: number) => void;
}

interface PuzzleChunk {
  id: string;
  text: string;
  originalIndex: number;
  color: string;
}

const CHUNK_COLORS = [
  'bg-amber-400 text-amber-950 border-amber-600',
  'bg-emerald-400 text-emerald-950 border-emerald-600',
  'bg-sky-400 text-sky-950 border-sky-600',
  'bg-purple-400 text-purple-950 border-purple-600',
];

export const SyllablePuzzleGame: React.FC<SyllablePuzzleGameProps> = ({
  words,
  currentWordIndex,
  onSelectWordIndex,
  settings,
  onWordCompleted,
}) => {
  const word = words[currentWordIndex] || words[0];

  // For words with only 1 syllable in the dictionary (e.g. 'gazed', 'tossed'), break into base + suffix
  const rawChunks =
    word.syllables.length > 1
      ? word.syllables
      : word.word.endsWith('ed')
      ? [word.word.slice(0, -2), 'ed']
      : [word.word.slice(0, Math.ceil(word.word.length / 2)), word.word.slice(Math.ceil(word.word.length / 2))];

  const [availableChunks, setAvailableChunks] = useState<PuzzleChunk[]>([]);
  const [placedChunks, setPlacedChunks] = useState<(PuzzleChunk | null)[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [mistakes, setMistakes] = useState<string[]>([]);

  useEffect(() => {
    initPuzzle();
  }, [word]);

  const initPuzzle = () => {
    const chunks: PuzzleChunk[] = rawChunks.map((chunk, idx) => ({
      id: `chk_${chunk}_${idx}_${Math.random()}`,
      text: chunk,
      originalIndex: idx,
      color: CHUNK_COLORS[idx % CHUNK_COLORS.length],
    }));

    // Scramble chunks
    const scrambled = [...chunks].sort(() => Math.random() - 0.5);

    setAvailableChunks(scrambled);
    setPlacedChunks(new Array(rawChunks.length).fill(null));
    setIsCompleted(false);
    setMistakes([]);
    setStartTime(Date.now());

    setTimeout(() => {
      audio.speakWord(word.word);
    }, 200);
  };

  const handleChunkClick = (chunk: PuzzleChunk) => {
    if (isCompleted) return;

    // Find first empty slot
    const emptySlotIdx = placedChunks.findIndex((c) => c === null);
    if (emptySlotIdx === -1) return;

    // Check if it fits the slot
    if (chunk.originalIndex === emptySlotIdx) {
      // Correct chunk!
      audio.playSnap();
      audio.speak(chunk.text);

      const nextPlaced = [...placedChunks];
      nextPlaced[emptySlotIdx] = chunk;
      setPlacedChunks(nextPlaced);

      setAvailableChunks((prev) => prev.filter((c) => c.id !== chunk.id));

      // Check if all placed
      if (emptySlotIdx + 1 === rawChunks.length) {
        setIsCompleted(true);
        audio.playCelebrationFanfare();
        setTimeout(() => audio.speakEncouragement(), 500);

        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
        });

        const secondsTaken = Math.max(2, Math.round((Date.now() - startTime) / 1000));
        onWordCompleted(word.id, mistakes, false, secondsTaken);
      }
    } else {
      // Gentle nudge
      audio.playGentleNudge();
      setMistakes((prev) => [...prev, chunk.text]);
      audio.speakGentleTryAgain(`Which chunk starts first?`);
    }
  };

  const nextWord = () => {
    audio.playPop();
    const nextIdx = (currentWordIndex + 1) % words.length;
    onSelectWordIndex(nextIdx);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Game Header */}
      <div className="p-4 bg-white/80 rounded-2xl border border-emerald-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
            <Puzzle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">
              Syllable Chunk Connector
            </h3>
            <p className="text-xs font-semibold text-slate-600">
              Snap the puzzle chunks in order to build:{' '}
              <strong className="text-emerald-700 font-black text-sm">{word.word}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => audio.speakWord(word.word)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 btn-tactile"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Hear Word</span>
          </button>
          <button
            onClick={() => audio.speakSlow(word.word)}
            className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs flex items-center gap-1 btn-tactile"
          >
            <Snail className="w-3.5 h-3.5" />
            <span>Slow</span>
          </button>
        </div>
      </div>

      {/* Target Puzzle Board */}
      <div className="p-6 sm:p-8 bg-white/90 rounded-3xl border-3 border-emerald-300 shadow-md space-y-8">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-center mb-4">
            🧩 Puzzle Track: Tap chunks to connect
          </span>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {rawChunks.map((_, idx) => {
              const placed = placedChunks[idx];
              const isNextSlot = placedChunks.findIndex((c) => c === null) === idx;

              return (
                <div key={idx} className="flex items-center">
                  <div
                    className={`min-w-28 sm:min-w-36 h-20 sm:h-24 px-4 rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl select-none transition-all ${
                      placed
                        ? `${placed.color} border-b-4 shadow-md scale-102`
                        : isNextSlot
                        ? 'bg-emerald-50 border-3 border-dashed border-emerald-400 text-emerald-600 animate-pulse'
                        : 'bg-slate-100 border-2 border-dashed border-slate-300 text-slate-300'
                    }`}
                  >
                    {placed ? (
                      <div className="flex items-center gap-2">
                        <span>{settings.uppercaseMode ? placed.text.toUpperCase() : placed.text}</span>
                        <span className="text-sm opacity-70">🔊</span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-slate-400">
                        {isNextSlot ? `Chunk #${idx + 1}` : '···'}
                      </span>
                    )}
                  </div>

                  {/* Connector plus sign */}
                  {idx < rawChunks.length - 1 && (
                    <span className="text-2xl font-black text-emerald-600 mx-2">+</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Available Scrambled Pieces */}
        <div className="space-y-3 pt-4 border-t border-emerald-100">
          <p className="text-xs font-bold text-slate-600 text-center uppercase tracking-wider">
            👇 Choose the Next Puzzle Chunk:
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {availableChunks.map((chunk) => (
              <button
                key={chunk.id}
                onClick={() => handleChunkClick(chunk)}
                className={`min-w-28 sm:min-w-36 h-18 sm:h-20 px-5 rounded-2xl font-black text-2xl sm:text-3xl border-b-4 shadow-md btn-tactile flex items-center justify-center gap-2 ${chunk.color}`}
              >
                <span>{settings.uppercaseMode ? chunk.text.toUpperCase() : chunk.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dyslexia Syllable Tip */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-xs sm:text-sm text-amber-900">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>Chunking Superpower:</strong> Breaking words into chunks like{' '}
            <span className="font-mono font-bold text-amber-950">
              {word.syllables.join(' - ')}
            </span>{' '}
            makes big words easy and fun to read!
          </span>
        </div>

        {/* Completion Card */}
        {isCompleted && (
          <div className="p-5 rounded-2xl bg-emerald-500 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95">
            <div>
              <h4 className="font-black text-lg">Brilliant Chunking!</h4>
              <p className="text-xs text-emerald-100">
                You smoothly assembled {word.word.toUpperCase()}!
              </p>
            </div>
            <button
              onClick={nextWord}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-sm flex items-center gap-2 btn-tactile shadow-amber-600"
            >
              <span>Next Puzzle Word</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
