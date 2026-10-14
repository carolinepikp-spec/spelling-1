import React, { useState, useRef } from 'react';
import { SpellingWord, DyslexiaSettings } from '../types/spelling';
import { audio } from '../utils/audio';
import {
  Volume2,
  Snail,
  Mic,
  Square,
  Play,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

interface WordExplorerLabProps {
  words: SpellingWord[];
  currentWordIndex: number;
  onSelectWordIndex: (idx: number) => void;
  settings: DyslexiaSettings;
}

export const WordExplorerLab: React.FC<WordExplorerLabProps> = ({
  words,
  currentWordIndex,
  onSelectWordIndex,
  settings,
}) => {
  const word = words[currentWordIndex] || words[0];

  // Voice recording state for child practice
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        audio.speak("Microphone practice is ready!");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      audio.playPop();
    } catch {
      audio.speak("Say the word loud and proud: " + word.word);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      audio.playSnap();
    }
  };

  const playRecordedAudio = () => {
    if (audioUrl) {
      const player = new Audio(audioUrl);
      player.play();
    }
  };

  const nextWord = () => {
    setAudioUrl(null);
    audio.playPop();
    onSelectWordIndex((currentWordIndex + 1) % words.length);
  };

  const prevWord = () => {
    setAudioUrl(null);
    audio.playPop();
    onSelectWordIndex((currentWordIndex - 1 + words.length) % words.length);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Selector ribbon */}
      <div className="flex items-center justify-between p-3 bg-white/80 rounded-2xl border border-amber-200">
        <button
          onClick={prevWord}
          className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-2">
          {words.map((w, idx) => (
            <button
              key={w.id}
              onClick={() => {
                audio.playPop();
                setAudioUrl(null);
                onSelectWordIndex(idx);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-all ${
                idx === currentWordIndex
                  ? 'bg-amber-500 text-white shadow-sm scale-105'
                  : 'bg-white/60 text-slate-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span>{w.emoji} {w.word}</span>
            </button>
          ))}
        </div>

        <button
          onClick={nextWord}
          className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Main Flashcard Card */}
      <div className="p-8 sm:p-10 bg-white/95 rounded-3xl border-3 border-amber-300 shadow-xl space-y-8 text-center">
        {/* Emoji & Word Header */}
        <div className="space-y-3">
          <span className="text-6xl inline-block transform hover:scale-115 transition-transform cursor-pointer" onClick={() => audio.playStarSound()}>
            {word.emoji}
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-wide">
            {settings.uppercaseMode ? word.word.toUpperCase() : word.word}
          </h2>
          <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
            {word.partOfSpeech}
          </span>
        </div>

        {/* Syllable Blocks */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Tap chunks to sound out:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {word.syllables.map((syl, i) => (
              <button
                key={i}
                onClick={() => {
                  audio.playSnap();
                  audio.speak(syl);
                }}
                className="px-5 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 text-indigo-950 font-black text-2xl btn-tactile flex items-center gap-2"
                title="Tap to hear chunk"
              >
                <span>{settings.uppercaseMode ? syl.toUpperCase() : syl}</span>
                <Volume2 className="w-4 h-4 text-indigo-500 opacity-60" />
              </button>
            ))}
          </div>
        </div>

        {/* Letter-by-Letter Tappable Tiles */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Tap each letter to hear its name:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {word.word.split('').map((char, index) => (
              <button
                key={index}
                onClick={() => {
                  audio.playSnap();
                  audio.speak(char);
                }}
                className={`w-12 h-14 rounded-xl bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 text-amber-950 font-black text-2xl flex items-center justify-center btn-tactile ${
                  settings.bdHelper && char === 'b' ? 'ring-2 ring-blue-500 text-blue-700' : ''
                } ${
                  settings.bdHelper && char === 'd' ? 'ring-2 ring-pink-500 text-pink-700' : ''
                }`}
              >
                {settings.uppercaseMode ? char.toUpperCase() : char}
              </button>
            ))}
          </div>
        </div>

        {/* Meaning & Sentence Box */}
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 text-left">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                What does it mean?
              </p>
              <p className="text-sm sm:text-base font-bold text-slate-700">
                "{word.definition}"
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-2 border-t border-amber-200/60">
            <BookOpen className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                Story Sentence:
              </p>
              <p className="text-sm sm:text-base text-slate-700 italic">
                "{word.sentence}"
              </p>
            </div>
            <button
              onClick={() => audio.speakSentence(word.sentence)}
              className="p-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 shrink-0"
              title="Hear sentence read aloud"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tricky Dyslexia Note */}
        <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-left flex items-start gap-3 text-xs sm:text-sm text-purple-900">
          <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-purple-950">Memory Helper: </strong>
            <span>{word.trickyPart}</span>
          </div>
        </div>

        {/* Kid Voice Studio: Record & Listen Back! */}
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-3">
          <p className="text-xs font-extrabold text-teal-900 uppercase tracking-wider">
            🎙️ Kid Voice Booth: Say "{word.word}" into your mic!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 btn-tactile"
              >
                <Mic className="w-4 h-4" />
                <span>Record My Voice</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 animate-pulse btn-tactile"
              >
                <Square className="w-4 h-4" />
                <span>Stop Recording</span>
              </button>
            )}

            {audioUrl && (
              <button
                onClick={playRecordedAudio}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 btn-tactile"
              >
                <Play className="w-4 h-4" />
                <span>Hear My Recording</span>
              </button>
            )}

            <button
              onClick={() => audio.speakWord(word.word)}
              className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 btn-tactile"
            >
              <Volume2 className="w-4 h-4" />
              <span>Hear Teacher Voice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
