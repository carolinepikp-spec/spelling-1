import React, { useState } from 'react';
import {
  ParentProgressState,
  SpellingWord,
  WordAttempt,
} from '../types/spelling';
import { CertificateModal } from './CertificateModal';
import {
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Lock,
  Unlock,
  RefreshCw,
  FileText,
  User,
  HeartHandshake,
} from 'lucide-react';
import { audio } from '../utils/audio';

interface ParentDashboardProps {
  progress: ParentProgressState;
  words: SpellingWord[];
  onUpdateProgress: (next: ParentProgressState) => void;
  onAddCustomWord: (word: SpellingWord) => void;
  onRemoveCustomWord: (wordId: string) => void;
  onResetProgress: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  progress,
  words,
  onUpdateProgress,
  onAddCustomWord,
  onRemoveCustomWord,
  onResetProgress,
}) => {
  // Simple parent lock gate to prevent accidental changes by kids
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinAnswer, setPinAnswer] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [childNameInput, setChildNameInput] = useState(progress.childName);

  // Custom word modal form
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [newWordText, setNewWordText] = useState('');
  const [newSyllablesText, setNewSyllablesText] = useState('');
  const [newDefinitionText, setNewDefinitionText] = useState('');
  const [newSentenceText, setNewSentenceText] = useState('');
  const [newTrickyPartText, setNewTrickyPartText] = useState('');
  const [newEmoji, setNewEmoji] = useState('⭐');

  // Math challenge for unlocking: 4 + 5 = 9
  const handleUnlockCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinAnswer.trim() === '9') {
      setIsUnlocked(true);
      setPinError(false);
      audio.playPop();
    } else {
      setPinError(true);
      audio.playGentleNudge();
    }
  };

  const handleSaveChildName = () => {
    if (!childNameInput.trim()) return;
    onUpdateProgress({ ...progress, childName: childNameInput.trim() });
    setEditingName(false);
    audio.playPop();
  };

  // Compute statistics
  const totalAttempts = progress.history.length;
  const successfulAttempts = progress.history.filter((h) => h.success).length;
  const accuracyRate = totalAttempts > 0 ? Math.round((successfulAttempts / totalAttempts) * 100) : 100;

  const totalTimeSeconds = progress.history.reduce((sum, h) => sum + (h.secondsTaken || 10), 0);
  const totalMinutesPracticed = Math.round(totalTimeSeconds / 60);

  const masteredCount = Object.values(progress.wordStats).filter(
    (s) => s.masteryStatus === 'mastered'
  ).length;

  const handleCreateWord = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWord = newWordText.trim().toLowerCase();
    if (!cleanWord) return;

    const syllables = newSyllablesText
      ? newSyllablesText.split(/[\s,-]+/).map((s) => s.trim().toLowerCase()).filter(Boolean)
      : [cleanWord];

    const newWord: SpellingWord = {
      id: 'custom_' + Date.now(),
      word: cleanWord,
      syllables: syllables.length > 0 ? syllables : [cleanWord],
      definition: newDefinitionText.trim() || 'A fun practice spelling word.',
      sentence: newSentenceText.trim() || `We practiced spelling "${cleanWord}".`,
      emoji: newEmoji || '⭐',
      partOfSpeech: 'word',
      trickyPart: newTrickyPartText.trim() || 'Look out for the tricky vowels!',
      phonics: cleanWord.split('').map((c) => ({ text: c, type: 'consonant' })),
      isCustom: true,
    };

    onAddCustomWord(newWord);
    setIsAddingWord(false);
    setNewWordText('');
    setNewSyllablesText('');
    setNewDefinitionText('');
    setNewSentenceText('');
    setNewTrickyPartText('');
    audio.playSuccessChime();
  };

  // If locked, render Parent Lock Gate
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-8 p-8 bg-white/95 rounded-3xl border-3 border-amber-300 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl font-black text-slate-800">Grown-Up Zone</h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Please answer this quick question so your child doesn't accidentally change settings:
          </p>
        </div>

        <form onSubmit={handleUnlockCheck} className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <label className="block text-sm font-black text-slate-700 mb-2">
              What is 4 + 5 ?
            </label>
            <input
              type="number"
              value={pinAnswer}
              onChange={(e) => {
                setPinAnswer(e.target.value);
                setPinError(false);
              }}
              placeholder="Enter answer"
              className="w-32 text-center text-2xl font-black py-2 rounded-xl border-2 border-amber-300 focus:outline-hidden focus:border-amber-500 bg-white"
              autoFocus
            />
            {pinError && (
              <p className="text-xs text-rose-600 font-bold mt-2">
                Oops, try again! 4 + 5 = 9
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm btn-tactile shadow-amber-300 flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            <span>Enter Parent Dashboard</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Banner */}
      <div className="p-6 bg-white/90 rounded-3xl border border-amber-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <HeartHandshake className="w-4 h-4" />
            <span>Parent & Educator Learning Insights</span>
          </div>
          <div className="flex items-center gap-3">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={childNameInput}
                  onChange={(e) => setChildNameInput(e.target.value)}
                  className="px-3 py-1 text-xl font-black rounded-lg border-2 border-amber-400"
                />
                <button
                  onClick={handleSaveChildName}
                  className="px-3 py-1 bg-amber-500 text-white font-bold text-xs rounded-lg"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
                  {progress.childName}'s Spelling Journey
                </h2>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-xs text-amber-700 hover:underline"
                >
                  Edit Name
                </button>
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track mastery, common phonetic hurdles, practice streaks, and celebrate growth.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCertificate(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm flex items-center gap-2 btn-tactile shadow-amber-300"
          >
            <Award className="w-4 h-4" />
            <span>View Award Certificate</span>
          </button>
          <button
            onClick={() => setIsUnlocked(false)}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
            title="Lock Parent Zone"
          >
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Mastered */}
        <div className="p-5 bg-white/90 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-extrabold uppercase tracking-wider">
              Words Mastered
            </span>
            <CheckCircle className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-emerald-950">
            {masteredCount} <span className="text-sm font-semibold text-slate-400">/ {words.length}</span>
          </p>
          <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round((masteredCount / words.length) * 100)}%` }}
            />
          </div>
        </div>

        {/* Accuracy */}
        <div className="p-5 bg-white/90 rounded-2xl border-2 border-blue-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-extrabold uppercase tracking-wider">
              Accuracy Rate
            </span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-blue-950">
            {accuracyRate}%
          </p>
          <p className="text-[11px] font-semibold text-slate-500">
            {successfulAttempts} of {totalAttempts} attempts correct
          </p>
        </div>

        {/* Practice Time */}
        <div className="p-5 bg-white/90 rounded-2xl border-2 border-purple-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-xs font-extrabold uppercase tracking-wider">
              Time Practiced
            </span>
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-purple-950">
            {totalMinutesPracticed} <span className="text-sm font-semibold text-slate-400">mins</span>
          </p>
          <p className="text-[11px] font-semibold text-slate-500">
            Total multisensory engagement
          </p>
        </div>

        {/* Gold Stars */}
        <div className="p-5 bg-white/90 rounded-2xl border-2 border-amber-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-extrabold uppercase tracking-wider">
              Stars & Streaks
            </span>
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-amber-950">
            ⭐ {progress.stars}
          </p>
          <p className="text-[11px] font-semibold text-slate-500">
            🔥 {progress.streakDays} Day Learning Streak
          </p>
        </div>
      </div>

      {/* Dyslexia Educational Guide for Parents */}
      <div className="p-6 bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border border-indigo-200 space-y-3">
        <div className="flex items-center gap-2 text-indigo-900 font-black text-sm">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span>Dyslexia-Friendly Home Practice Strategies for 7-Year-Olds</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          Children with dyslexia thrive when words are broken into <strong>syllable chunks</strong> rather than single isolated letters. Notice how our app highlights <span className="font-semibold text-indigo-800">prefixes (re-, de-)</span>, <span className="font-semibold text-indigo-800">roots (gard, light, haust)</span>, and <span className="font-semibold text-indigo-800">suffixes (-ed, -ing, -ful, -ly)</span>. Celebrate effort, maintain zero-stress encouragement, and practice 5–10 minutes daily!
        </p>
      </div>

      {/* Detailed Word-by-Word Mastery & Phonetic Diagnostics Table */}
      <div className="p-6 bg-white/95 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-800">
              Word Mastery & Phonetic Diagnostic Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Tracks attempts, completion rates, and identified trouble spots.
            </p>
          </div>

          <button
            onClick={() => setIsAddingWord(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Weekly School Word</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px] font-black">
                <th className="pb-3 px-3">Word</th>
                <th className="pb-3 px-3">Syllables</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Success / Tries</th>
                <th className="pb-3 px-3">Trouble Letters / Notes</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {words.map((w) => {
                const stat = progress.wordStats[w.id] || {
                  correctCount: 0,
                  totalAttempts: 0,
                  masteryStatus: 'not-started',
                  troubleLetters: [],
                };

                return (
                  <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-black text-slate-800 flex items-center gap-2">
                      <span className="text-lg">{w.emoji}</span>
                      <span>{w.word}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        {w.syllables.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {stat.masteryStatus === 'mastered' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Mastered
                        </span>
                      ) : stat.masteryStatus === 'learning' ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Learning ({stat.correctCount}/3)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs">
                          Not Started
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {stat.correctCount} / {stat.totalAttempts}
                    </td>
                    <td className="py-3 px-3">
                      {stat.troubleLetters && stat.troubleLetters.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[11px] text-rose-600 font-bold">Struggled with:</span>
                          {stat.troubleLetters.map((tl, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs font-mono font-bold"
                            >
                              {tl}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {w.trickyPart}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {w.isCustom && (
                        <button
                          onClick={() => onRemoveCustomWord(w.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                          title="Delete Custom Word"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Practice History Log */}
      <div className="p-6 bg-white/95 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-800">
          Recent Practice History Log
        </h3>

        {progress.history.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-400 italic text-center py-6">
            No practice sessions recorded yet today. Jump into the Drag-Down Boxes or Balloon Pop to start!
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {progress.history.slice(0, 15).map((att) => {
              const formattedTime = new Date(att.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={att.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                        att.success ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                    >
                      {att.success ? '✓' : '•'}
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 uppercase">
                        {att.word}
                      </span>
                      <span className="text-slate-400 ml-2">
                        via {att.gameMode}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500">
                    <span>{att.secondsTaken}s</span>
                    <span className="text-slate-400">{formattedTime}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs">
        <div>
          <span className="font-bold text-rose-900">Reset Practice Data</span>
          <p className="text-rose-700 text-[11px]">
            Wipe all stars and history if you want to start fresh with a new child.
          </p>
        </div>
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to reset all practice data and start fresh?")) {
              onResetProgress();
            }
          }}
          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
        >
          Reset All
        </button>
      </div>

      {/* Modal: Add Custom Word */}
      {isAddingWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl border-2 border-indigo-200">
            <h3 className="text-xl font-black text-slate-800">
              Add Custom Spelling Word
            </h3>
            <p className="text-xs text-slate-500">
              Add your child's weekly school spelling list to practice together!
            </p>

            <form onSubmit={handleCreateWord} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Word (e.g., blanket)
                </label>
                <input
                  type="text"
                  required
                  value={newWordText}
                  onChange={(e) => setNewWordText(e.target.value)}
                  placeholder="Type word"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Syllables (separated by space or dash, e.g. blan - ket)
                </label>
                <input
                  type="text"
                  value={newSyllablesText}
                  onChange={(e) => setNewSyllablesText(e.target.value)}
                  placeholder="e.g. blan ket"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Emoji Icon
                </label>
                <input
                  type="text"
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  placeholder="⭐"
                  className="w-20 px-3 py-2 rounded-xl border border-slate-300 text-center text-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Child-Friendly Definition
                </label>
                <input
                  type="text"
                  value={newDefinitionText}
                  onChange={(e) => setNewDefinitionText(e.target.value)}
                  placeholder="e.g. A warm, cozy cover for bedtime."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Story Sentence
                </label>
                <input
                  type="text"
                  value={newSentenceText}
                  onChange={(e) => setNewSentenceText(e.target.value)}
                  placeholder="e.g. She curled up under the fuzzy blue blanket."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Dyslexia Tricky Spot Tip
                </label>
                <input
                  type="text"
                  value={newTrickyPartText}
                  onChange={(e) => setNewTrickyPartText(e.target.value)}
                  placeholder="e.g. Remember: 'ket' ends with 'et'!"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddingWord(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  Save Word
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificate && (
        <CertificateModal
          progress={progress}
          words={words}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
};
