import {
  ParentProgressState,
  DyslexiaSettings,
  SpellingWord,
  WordAttempt,
  WordStats,
} from '../types/spelling';
import { INITIAL_WORDS, INITIAL_BADGES } from '../data/words';

const STORAGE_KEY_PROGRESS = 'spellspark_parent_progress_v1';
const STORAGE_KEY_SETTINGS = 'spellspark_dyslexia_settings_v1';

export const DEFAULT_SETTINGS: DyslexiaSettings = {
  font: 'lexend',
  tint: 'cream',
  letterSpacing: 'wide',
  bdHelper: true,
  syllableColoring: true,
  soundEnabled: true,
  voiceSpeed: 0.85,
  uppercaseMode: false,
};

export function getInitialProgress(): ParentProgressState {
  const initialWordStats: Record<string, WordStats> = {};
  INITIAL_WORDS.forEach((w) => {
    initialWordStats[w.id] = {
      correctCount: 0,
      totalAttempts: 0,
      lastPracticed: '',
      masteryStatus: 'not-started',
      troubleLetters: [],
    };
  });

  return {
    childName: 'Alex',
    stars: 5,
    wordStats: initialWordStats,
    history: [],
    customWords: [],
    badges: INITIAL_BADGES,
    streakDays: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
  };
}

export function loadSettings(): DyslexiaSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load dyslexia settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: DyslexiaSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function loadProgress(): ParentProgressState {
  const initial = getInitialProgress();
  if (typeof window === 'undefined') return initial;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (raw) {
      const parsed: ParentProgressState = JSON.parse(raw);
      // Ensure all initial words exist in wordStats
      const wordStats = { ...initial.wordStats, ...parsed.wordStats };
      return {
        ...initial,
        ...parsed,
        wordStats,
      };
    }
  } catch (e) {
    console.error('Failed to load progress', e);
  }
  return initial;
}

export function saveProgress(state: ParentProgressState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save progress', e);
  }
}

export function recordAttempt(
  attempt: Omit<WordAttempt, 'id' | 'timestamp'>,
  currentState: ParentProgressState
): ParentProgressState {
  const timestamp = new Date().toISOString();
  const today = timestamp.split('T')[0];
  const newAttempt: WordAttempt = {
    ...attempt,
    id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp,
  };

  const wordStats = { ...currentState.wordStats };
  const currentStat = wordStats[attempt.wordId] || {
    correctCount: 0,
    totalAttempts: 0,
    lastPracticed: timestamp,
    masteryStatus: 'not-started',
    troubleLetters: [],
  };

  const newCorrectCount = attempt.success ? currentStat.correctCount + 1 : currentStat.correctCount;
  const newTotalAttempts = currentStat.totalAttempts + 1;

  // Add any mistaken letters
  const combinedMistakes = Array.from(new Set([...currentStat.troubleLetters, ...attempt.mistakes]));

  // Mastery logic: 3+ correct attempts with at least 70% success rate
  let masteryStatus: 'not-started' | 'learning' | 'mastered' = 'learning';
  if (newCorrectCount >= 3 && newCorrectCount / newTotalAttempts >= 0.6) {
    masteryStatus = 'mastered';
  } else if (newTotalAttempts > 0) {
    masteryStatus = 'learning';
  }

  wordStats[attempt.wordId] = {
    correctCount: newCorrectCount,
    totalAttempts: newTotalAttempts,
    lastPracticed: timestamp,
    masteryStatus,
    troubleLetters: combinedMistakes,
  };

  // Star logic: +1 star for correct attempt
  const starsEarned = attempt.success ? (attempt.usedHint ? 1 : 2) : 0;
  const newStars = currentState.stars + starsEarned;

  // Streak logic
  let newStreak = currentState.streakDays;
  if (currentState.lastActiveDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (currentState.lastActiveDate === yesterdayStr) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }
  }

  // Check badges unlock
  const newBadges = currentState.badges.map((b) => {
    if (b.unlockedAt) return b;
    let shouldUnlock = false;

    if (b.id === 'first_word' && attempt.success) shouldUnlock = true;
    if (b.id === 'five_stars' && newStars >= 10) shouldUnlock = true;
    if (b.id === 'drag_master' && attempt.gameMode === 'drag-down' && attempt.success) {
      const dragSuccesses = currentState.history.filter((h) => h.gameMode === 'drag-down' && h.success).length + 1;
      if (dragSuccesses >= 5) shouldUnlock = true;
    }
    if (b.id === 'balloon_popper' && attempt.gameMode === 'balloon-pop' && attempt.success) shouldUnlock = true;
    if (b.id === 'syllable_champ' && attempt.gameMode === 'syllable-puzzle' && attempt.success) shouldUnlock = true;

    // Check all words mastered
    if (b.id === 'spelling_champion') {
      const masteredCount = Object.values(wordStats).filter((s) => s.masteryStatus === 'mastered').length;
      if (masteredCount >= INITIAL_WORDS.length) shouldUnlock = true;
    }

    if (shouldUnlock) {
      return { ...b, unlockedAt: timestamp };
    }
    return b;
  });

  const nextState: ParentProgressState = {
    ...currentState,
    stars: newStars,
    wordStats,
    history: [newAttempt, ...currentState.history.slice(0, 199)], // keep last 200
    badges: newBadges,
    streakDays: newStreak,
    lastActiveDate: today,
  };

  saveProgress(nextState);
  return nextState;
}

export function getAllWords(customWords: SpellingWord[]): SpellingWord[] {
  return [...INITIAL_WORDS, ...customWords];
}
