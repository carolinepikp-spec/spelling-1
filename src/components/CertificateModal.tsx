import React, { useRef } from 'react';
import { ParentProgressState, SpellingWord } from '../types/spelling';
import { Award, Printer, X, Sparkles } from 'lucide-react';

interface CertificateModalProps {
  progress: ParentProgressState;
  words: SpellingWord[];
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  progress,
  words,
  onClose,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const masteredCount = Object.values(progress.wordStats).filter(
    (s) => s.masteryStatus === 'mastered'
  ).length;

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 relative border-4 border-amber-300 print:border-none print:shadow-none print:p-0">
        {/* Close Button (Hidden in Print) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Printable Body */}
        <div
          ref={certificateRef}
          className="p-8 sm:p-10 border-8 border-double border-amber-400 bg-linear-to-b from-amber-50/50 via-white to-amber-50/50 rounded-2xl text-center space-y-6 relative"
        >
          {/* Top Ribbon & Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-linear-to-tr from-amber-500 to-yellow-300 text-amber-950 flex items-center justify-center shadow-lg border-4 border-white">
              <Award className="w-10 h-10 text-amber-900" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black tracking-widest uppercase text-amber-700">
              OFFICIAL SPELLSPARK ACADEMY AWARD
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 uppercase tracking-tight">
              Spelling Champion Award
            </h1>
            <p className="text-sm font-semibold text-slate-500">
              This certificate is proudly awarded to:
            </p>
          </div>

          <div className="py-2">
            <h2 className="text-3xl sm:text-5xl font-black text-amber-600 underline decoration-amber-300 decoration-wavy underline-offset-8">
              {progress.childName || 'Super Speller'}
            </h2>
          </div>

          <p className="text-sm sm:text-base text-slate-700 max-w-md mx-auto leading-relaxed">
            For outstanding effort, super focus, and masterfully conquering{' '}
            <strong className="text-amber-700">{masteredCount} spelling challenge words</strong> in the interactive spelling adventure!
          </p>

          {/* Mastered Words Pill Cloud */}
          <div className="p-3 bg-amber-100/50 rounded-xl border border-amber-200/80">
            <p className="text-xs font-bold text-amber-800 uppercase mb-2">
              Words Mastered:
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 text-xs font-black text-amber-900">
              {words.slice(0, 10).map((w) => (
                <span key={w.id} className="px-2.5 py-1 rounded-md bg-white border border-amber-300 shadow-2xs">
                  {w.word}
                </span>
              ))}
            </div>
          </div>

          {/* Signatures & Date */}
          <div className="pt-6 border-t-2 border-dashed border-amber-300 flex items-center justify-between px-4 text-xs font-bold text-slate-600">
            <div>
              <p className="border-b border-slate-400 pb-1 mb-1 font-mono text-slate-800 font-bold">
                SpellSpark Coach
              </p>
              <span>Teacher / Parent</span>
            </div>
            <div className="flex items-center gap-1 text-amber-600">
              <Sparkles className="w-4 h-4" />
              <span>{progress.stars} Stars Earned</span>
            </div>
            <div>
              <p className="border-b border-slate-400 pb-1 mb-1 font-mono text-slate-800 font-bold">
                {today}
              </p>
              <span>Date Awarded</span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden in Print) */}
        <div className="flex items-center justify-end gap-3 print:hidden pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm flex items-center gap-2 btn-tactile shadow-amber-300"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Save PDF Certificate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
