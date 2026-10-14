import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SpellingWord, DyslexiaSettings } from '../types/spelling';
import { audio } from '../utils/audio';
import { Volume2, Snail, ArrowRight, Search, Sparkles } from 'lucide-react';

interface MissingLetterGameProps {
  words: SpellingWord[];
  currentWordIndex: number;
  onSelectWordIndex: (idx: number) => void;
  settings: DyslexiaSettings;
  onWordCompleted: (wordId: string, mistakes: string[], usedHint: boolean, secondsTaken: number) => void;
}

interface QuestionConfig {
  word: SpellingWord;
  missingChunk: string;
  displayPrefix: string;
  displaySuffix: string;
  options: string[];
}

export const MissingLetterGame: React.FC<MissingLetterGameProps> = ({
  words,
  currentWordIndex,
  onSelectWordIndex,
  settings,
  onWordCompleted,
}) => {
  const word = words[currentWordIndex] || words[0];

  const [config, setConfig] = useState<QuestionConfig | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Generate tricky question for current word
  useEffect(() => {
    initQuestion(word);
  }, [word]);

  const initQuestion = (currentWord: SpellingWord) => {
    let missingChunk = '';
    let prefix = '';
    let suffix = '';
    let distractors: string[] = [];

    const w = currentWord.word;
    if (w === 'gazed') {
      prefix = 'ga';
      missingChunk = 'z';
      suffix = 'ed';
      distractors = ['s', 'x'];
    } else if (w === 'soggy') {
      prefix = 'so';
      missingChunk = 'gg';
      suffix = 'y';
      distractors = ['g', 'bb'];
    } else if (w === 'mildly') {
      prefix = 'mild';
      missingChunk = 'ly';
      suffix = '';
      distractors = ['lee', 'ley'];
    } else if (w === 'refuge') {
      prefix = 'ref';
      missingChunk = 'uge';
      suffix = '';
      distractors = ['ooge', 'udge'];
    } else if (w === 'tossed') {
      prefix = 'to';
      missingChunk = 'ss';
      suffix = 'ed';
      distractors = ['s', 'zz'];
    } else if (w === 'darting') {
      prefix = 'd';
      missingChunk = 'ar';
      suffix = 'ting';
      distractors = ['er', 'or'];
    } else if (w === 'startled') {
      prefix = 'star';
      missingChunk = 'tled';
      suffix = '';
      distractors = ['teld', 'tld'];
    } else if (w === 'regarded') {
      prefix = 're';
      missingChunk = 'gard';
      suffix = 'ed';
      distractors = ['guard', 'gord'];
    } else if (w === 'delightful') {
      prefix = 'de';
      missingChunk = 'light';
      suffix = 'ful';
      distractors = ['lite', 'liht'];
    } else if (w === 'exhausted') {
      prefix = 'ex';
      missingChunk = 'haust';
      suffix = 'ed';
      distractors = ['host', 'hauste'];
    } else {
      // Fallback for custom words
      const mid = Math.floor(w.length / 2);
      prefix = w.slice(0, mid - 1);
      missingChunk = w.slice(mid - 1, mid + 1);
      suffix = w.slice(mid + 1);
      distractors = ['ee', 'er'];
    }

    const options = [missingChunk, ...distractors].sort(() => Math.random() - 0.5);

    setConfig({
      word: currentWord,
      missingChunk,
      displayPrefix: prefix,
      displaySuffix: suffix,
      options,
    });

    setSelectedOption(null);
    setIsCompleted(false);
    setMistakes([]);
    setStartTime(Date.now());

    setTimeout(() => {
      audio.speak(`Find the missing secret letters for ${currentWord.word}!`);
    }, 200);
  };

  const handleChoose = (opt: string) => {
    if (isCompleted || !config) return;

    if (opt === config.missingChunk) {
      // Success!
      setSelectedOption(opt);
      setIsCompleted(true);
      audio.playCelebrationFanfare();
      setTimeout(() => audio.speakEncouragement(), 500);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      const secondsTaken = Math.max(2, Math.round((Date.now() - startTime) / 1000));
      onWordCompleted(word.id, mistakes, false, secondsTaken);
    } else {
      // Gentle Try Again
      audio.playGentleNudge();
      setMistakes((prev) => [...prev, opt]);
      audio.speakGentleTryAgain(`Listen closely to how "${word.word}" sounds.`);
    }
  };

  const nextWord = () => {
    audio.playPop();
    const nextIdx = (currentWordIndex + 1) % words.length;
    onSelectWordIndex(nextIdx);
  };

  if (!config) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-4 bg-white/80 rounded-2xl border border-purple-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">
              Spelling Detective!
            </h3>
            <p className="text-xs font-semibold text-slate-600">
              Find the missing secret puzzle letters to complete the word.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => audio.speakWord(word.word)}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 btn-tactile"
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

      {/* Detective Board */}
      <div className="p-6 sm:p-10 bg-white/95 rounded-3xl border-3 border-purple-300 shadow-md space-y-8 text-center">
        {/* Kid image hint */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">{word.emoji}</span>
          <p className="text-sm font-bold text-slate-600 max-w-md">
            "{word.definition}"
          </p>
        </div>

        {/* Word Display with Missing Slot */}
        <div className="p-6 rounded-2xl bg-purple-50/70 border-2 border-dashed border-purple-300 flex items-center justify-center gap-2 sm:gap-3 text-3xl sm:text-5xl font-black text-slate-800 select-none">
          <span>{settings.uppercaseMode ? config.displayPrefix.toUpperCase() : config.displayPrefix}</span>

          {/* Mystery Slot */}
          <div
            className={`min-w-20 sm:min-w-28 px-4 h-16 sm:h-20 rounded-2xl flex items-center justify-center font-black transition-all ${
              isCompleted
                ? 'bg-emerald-400 text-emerald-950 border-b-4 border-emerald-600 scale-105 shadow-md'
                : 'bg-white border-3 border-dashed border-purple-400 text-purple-600 shadow-inner animate-pulse'
            }`}
          >
            {isCompleted ? (
              <span>{settings.uppercaseMode ? config.missingChunk.toUpperCase() : config.missingChunk}</span>
            ) : (
              <span className="text-2xl sm:text-3xl font-black text-purple-400">? ?</span>
            )}
          </div>

          <span>{settings.uppercaseMode ? config.displaySuffix.toUpperCase() : config.displaySuffix}</span>
        </div>

        {/* Options to Choose */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Which letters belong in the mystery box?
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {config.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleChoose(opt)}
                className={`min-w-28 sm:min-w-36 h-18 sm:h-20 px-6 rounded-2xl font-black text-2xl sm:text-3xl border-b-4 btn-tactile transition-all ${
                  isCompleted && opt === config.missingChunk
                    ? 'bg-emerald-400 text-emerald-950 border-emerald-600 ring-4 ring-emerald-300'
                    : 'bg-amber-400 hover:bg-amber-300 text-amber-950 border-amber-600 shadow-md'
                }`}
              >
                <span>{settings.uppercaseMode ? opt.toUpperCase() : opt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Detective Tip */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span><strong>Detective Clue:</strong> {word.trickyPart}</span>
        </div>

        {/* Complete State */}
        {isCompleted && (
          <div className="p-5 rounded-2xl bg-emerald-500 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95 text-left">
            <div>
              <h4 className="font-black text-lg">Case Solved, Super Detective!</h4>
              <p className="text-xs text-emerald-100">
                You spotted the correct spelling for "{word.word}"!
              </p>
            </div>
            <button
              onClick={nextWord}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-sm flex items-center gap-2 btn-tactile shadow-amber-600"
            >
              <span>Next Mystery Word</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
