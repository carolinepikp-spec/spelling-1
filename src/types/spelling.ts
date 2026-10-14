export type DyslexiaFont = 'lexend' | 'comic' | 'fredoka';
export type DyslexiaTint = 'cream' | 'mint' | 'peach' | 'sky' | 'lavender' | 'white';
export type LetterSpacingMode = 'normal' | 'wide' | 'extrawide';

export interface PhonicSegment {
  text: string;
  type: 'vowel' | 'consonant' | 'blend' | 'suffix' | 'silent';
}

export interface SpellingWord {
  id: string;
  word: string;
  syllables: string[];
  definition: string;
  sentence: string;
  emoji: string;
  partOfSpeech: string;
  trickyPart: string;
  phonics: PhonicSegment[];
  isCustom?: boolean;
}

export interface WordAttempt {
  id: string;
  wordId: string;
  word: string;
  timestamp: string; // ISO
  success: boolean;
  mistakes: string[];
  usedHint: boolean;
  secondsTaken: number;
  gameMode: 'drag-down' | 'balloon-pop' | 'syllable-puzzle' | 'detective' | 'flashcards';
}

export interface WordStats {
  correctCount: number;
  totalAttempts: number;
  lastPracticed: string;
  masteryStatus: 'not-started' | 'learning' | 'mastered';
  troubleLetters: string[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface DyslexiaSettings {
  font: DyslexiaFont;
  tint: DyslexiaTint;
  letterSpacing: LetterSpacingMode;
  bdHelper: boolean;
  syllableColoring: boolean;
  soundEnabled: boolean;
  voiceSpeed: number; // 0.6 - 1.0
  uppercaseMode: boolean; // lowercase vs uppercase
}

export interface ParentProgressState {
  childName: string;
  stars: number;
  wordStats: Record<string, WordStats>;
  history: WordAttempt[];
  customWords: SpellingWord[];
  badges: Badge[];
  streakDays: number;
  lastActiveDate: string;
}
