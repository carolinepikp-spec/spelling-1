import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SpellingWord, DyslexiaSettings } from '../types/spelling';
import { audio } from '../utils/audio';
import { Volume2, Snail, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';

interface BalloonPopGameProps {
  words: SpellingWord[];
  currentWordIndex: number;
  onSelectWordIndex: (idx: number) => void;
  settings: DyslexiaSettings;
  onWordCompleted: (wordId: string, mistakes: string[], usedHint: boolean, secondsTaken: number) => void;
}

interface BalloonItem {
  id: string;
  char: string;
  color: string;
  isPopped: boolean;
  xOffset: number; // visual float variation
}

const BALLOON_COLORS = [
  'from-pink-400 to-rose-500 border-pink-600',
  'from-sky-400 to-blue-500 border-blue-600',
  'from-emerald-400 to-teal-500 border-teal-600',
  'from-amber-400 to-orange-500 border-orange-600',
  'from-purple-400 to-indigo-500 border-indigo-600',
  'from-cyan-400 to-blue-500 border-cyan-600',
];

export const BalloonPopGame: React.FC<BalloonPopGameProps> = ({
  words,
  currentWordIndex,
  onSelectWordIndex,
  settings,
  onWordCompleted,
}) => {
  const word = words[currentWordIndex] || words[0];
  const targetChars = word.word.toLowerCase().split('');

  const [balloons, setBalloons] = useState<BalloonItem[]>([]);
  const [poppedIndex, setPoppedIndex] = useState<number>(0);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [wobbleId, setWobbleId] = useState<string | null>(null);

  useEffect(() => {
    initGame(word);
  }, [word]);

  const initGame = (currentWord: SpellingWord) => {
    const chars = currentWord.word.toLowerCase().split('');
    const items: BalloonItem[] = chars.map((char, index) => ({
      id: `b_${char}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      char,
      color: BALLOON_COLORS[index % BALLOON_COLORS.length],
      isPopped: false,
      xOffset: (Math.random() - 0.5) * 16,
    }));

    // Randomize the balloons array
    const shuffled = [...items].sort(() => Math.random() - 0.5);

    setBalloons(shuffled);
    setPoppedIndex(0);
    setMistakes([]);
    setIsCompleted(false);
    setWobbleId(null);
    setStartTime(Date.now());

    setTimeout(() => {
      audio.speakWord(currentWord.word);
    }, 200);
  };

  const handleBalloonClick = (balloon: BalloonItem) => {
    if (balloon.isPopped || isCompleted) return;

    const neededChar = targetChars[poppedIndex];

    if (balloon.char === neededChar) {
      // Correct balloon!
      audio.playPop();
      audio.speak(balloon.char.toUpperCase());

      const nextBalloons = balloons.map((b) =>
        b.id === balloon.id ? { ...b, isPopped: true } : b
      );
      setBalloons(nextBalloons);

      const nextIndex = poppedIndex + 1;
      setPoppedIndex(nextIndex);

      if (nextIndex === targetChars.length) {
        // Complete!
        setIsCompleted(true);
        audio.playCelebrationFanfare();
        setTimeout(() => {
          audio.speakEncouragement();
        }, 500);

        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });

        const secondsTaken = Math.max(3, Math.round((Date.now() - startTime) / 1000));
        onWordCompleted(word.id, mistakes, false, secondsTaken);
      }
    } else {
      // Wrong balloon tapped - gentle wobble & audio nudge
      audio.playGentleNudge();
      setWobbleId(balloon.id);
      setTimeout(() => setWobbleId(null), 600);

      setMistakes((prev) => [...prev, balloon.char]);
      audio.speakGentleTryAgain(`We need "${neededChar.toUpperCase()}"!`);
    }
  };

  const nextWord = () => {
    audio.playPop();
    const nextIdx = (currentWordIndex + 1) % words.length;
    onSelectWordIndex(nextIdx);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="p-4 bg-white/80 rounded-2xl border border-sky-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎈</span>
          <div>
            <h3 className="text-lg font-black text-slate-800">
              Balloon Pop Adventure!
            </h3>
            <p className="text-xs font-semibold text-slate-600">
              Pop the balloons in order to spell: <strong className="text-sky-700 font-black text-sm">{word.word}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => audio.speakWord(word.word)}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1 btn-tactile"
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
          <button
            onClick={() => initGame(word)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
            title="Reset balloons"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Spelled Progress Word Train */}
      <div className="p-4 sm:p-6 bg-white/90 rounded-2xl border-2 border-sky-200 shadow-md flex flex-col items-center gap-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Spelling Train:
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {targetChars.map((char, idx) => {
            const isPoppedYet = idx < poppedIndex;
            const isCurrentTarget = idx === poppedIndex;

            return (
              <div
                key={idx}
                className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl flex items-center justify-center font-black text-2xl sm:text-3xl transition-all ${
                  isPoppedYet
                    ? 'bg-sky-500 text-white shadow-md scale-102 border-b-3 border-sky-700'
                    : isCurrentTarget
                    ? 'bg-sky-100 border-2 border-dashed border-sky-400 text-sky-600 animate-pulse'
                    : 'bg-slate-100 border-2 border-dashed border-slate-300 text-slate-300'
                }`}
              >
                {isPoppedYet ? (
                  <span>{settings.uppercaseMode ? char.toUpperCase() : char}</span>
                ) : isCurrentTarget ? (
                  <span className="text-xs text-sky-600 font-bold">NEXT</span>
                ) : (
                  <span>·</span>
                )}
              </div>
            );
          })}
        </div>

        {poppedIndex < targetChars.length && (
          <p className="text-xs font-semibold text-slate-600 flex items-center gap-1 mt-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>
              Next letter to pop: <span className="font-black text-sky-700 uppercase text-sm">"{targetChars[poppedIndex]}"</span>
            </span>
          </p>
        )}
      </div>

      {/* Floating Balloons Field */}
      <div className="p-8 sm:p-12 min-h-72 rounded-3xl bg-linear-to-b from-sky-100 via-sky-50 to-amber-50 border-3 border-sky-200 shadow-inner flex flex-wrap items-center justify-center gap-6 relative overflow-hidden">
        {/* Background clouds */}
        <div className="absolute top-4 left-6 text-4xl opacity-30 select-none pointer-events-none">☁️</div>
        <div className="absolute top-12 right-12 text-3xl opacity-30 select-none pointer-events-none">☁️</div>

        {balloons.map((balloon) => {
          const isWobbling = wobbleId === balloon.id;

          if (balloon.isPopped) {
            return (
              <div
                key={balloon.id}
                className="w-16 h-20 sm:w-20 sm:h-24 opacity-0 pointer-events-none transition-opacity duration-300 flex items-center justify-center"
              >
                💥
              </div>
            );
          }

          return (
            <div
              key={balloon.id}
              onClick={() => handleBalloonClick(balloon)}
              style={{ transform: `translateX(${balloon.xOffset}px)` }}
              className={`relative flex flex-col items-center cursor-pointer group transition-transform hover:scale-110 active:scale-95 ${
                isWobbling ? 'animate-bounce' : ''
              }`}
            >
              {/* Balloon Body */}
              <div
                className={`w-16 h-20 sm:w-20 sm:h-24 rounded-full bg-linear-to-br ${balloon.color} shadow-lg border-2 text-white font-black text-3xl sm:text-4xl flex items-center justify-center relative select-none`}
              >
                {/* Shiny highlight */}
                <div className="absolute top-2 left-3 w-4 h-6 rounded-full bg-white/40 rotate-[-20deg]" />
                
                <span>
                  {settings.uppercaseMode ? balloon.char.toUpperCase() : balloon.char}
                </span>
              </div>

              {/* Balloon Knot and String */}
              <div className="w-2 h-2 bg-slate-600 rounded-xs -mt-0.5" />
              <div className="w-0.5 h-6 bg-slate-400 opacity-60" />
            </div>
          );
        })}
      </div>

      {/* Completed Banner */}
      {isCompleted && (
        <div className="p-5 rounded-2xl bg-emerald-500 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <h4 className="font-black text-lg">Pop-tastic! You spelled {word.word}!</h4>
              <p className="text-xs text-emerald-100">+2 Stars earned! You're super fast!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => initGame(word)}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs"
            >
              Pop Again
            </button>
            <button
              onClick={nextWord}
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-sm flex items-center gap-1.5 btn-tactile shadow-amber-600"
            >
              <span>Next Word</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
