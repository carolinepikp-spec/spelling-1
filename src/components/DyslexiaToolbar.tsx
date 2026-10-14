import React, { useState } from 'react';
import { DyslexiaSettings, DyslexiaTint, DyslexiaFont, LetterSpacingMode } from '../types/spelling';
import { Eye, Volume2, VolumeX, Sliders, Check, Snail, Sparkles } from 'lucide-react';
import { audio } from '../utils/audio';

interface DyslexiaToolbarProps {
  settings: DyslexiaSettings;
  onUpdateSettings: (newSettings: DyslexiaSettings) => void;
}

export const DyslexiaToolbar: React.FC<DyslexiaToolbarProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const tints: { id: DyslexiaTint; name: string; bg: string; border: string }[] = [
    { id: 'cream', name: 'Warm Cream', bg: '#FAF6E8', border: '#e8dcba' },
    { id: 'mint', name: 'Soft Mint', bg: '#EBF7EE', border: '#c3e8ca' },
    { id: 'peach', name: 'Peach Glow', bg: '#FFF2E8', border: '#fed2bc' },
    { id: 'sky', name: 'Sky Blue', bg: '#EBF4FC', border: '#bedcfc' },
    { id: 'lavender', name: 'Lavender', bg: '#F4EBFB', border: '#dfcbf7' },
    { id: 'white', name: 'Crisp White', bg: '#FFFFFF', border: '#e2e8f0' },
  ];

  const fonts: { id: DyslexiaFont; name: string; style: string }[] = [
    { id: 'lexend', name: 'Lexend (Dyslexia Friendly)', style: 'font-lexend' },
    { id: 'comic', name: 'Comic Neue (Distinct Letters)', style: 'font-comic' },
    { id: 'fredoka', name: 'Fredoka (Soft Rounded)', style: 'font-fredoka' },
  ];

  const spacings: { id: LetterSpacingMode; label: string }[] = [
    { id: 'normal', label: 'Standard' },
    { id: 'wide', label: 'Wide' },
    { id: 'extrawide', label: 'Extra Wide' },
  ];

  const toggleSound = () => {
    const next = !settings.soundEnabled;
    audio.setSoundEnabled(next);
    onUpdateSettings({ ...settings, soundEnabled: next });
    if (next) {
      audio.playPop();
      audio.speak("Sound is on!");
    }
  };

  const setVoiceSpeed = (speed: number) => {
    audio.setVoiceSpeed(speed);
    onUpdateSettings({ ...settings, voiceSpeed: speed });
    audio.speak("Voice speed updated!");
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Quick Sound Toggle */}
        <button
          onClick={toggleSound}
          className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all shadow-xs ${
            settings.soundEnabled
              ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
              : 'bg-stone-200 text-stone-500 border-stone-300'
          }`}
          title={settings.soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          aria-label="Toggle Sound"
        >
          {settings.soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Audio On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-stone-400" />
              <span className="hidden sm:inline">Muted</span>
            </>
          )}
        </button>

        {/* Turtle Slow Voice Toggle */}
        <button
          onClick={() => setVoiceSpeed(settings.voiceSpeed === 0.6 ? 0.85 : 0.6)}
          className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all shadow-xs ${
            settings.voiceSpeed === 0.6
              ? 'bg-teal-100 text-teal-900 border-teal-300 ring-2 ring-teal-400'
              : 'bg-white/80 text-teal-800 border-teal-200 hover:bg-teal-50'
          }`}
          title="Toggle Slow Reading Voice"
        >
          <Snail className="w-4 h-4 text-teal-600" />
          <span className="hidden md:inline">{settings.voiceSpeed === 0.6 ? '🐢 Slow Voice' : '🐢 Normal Voice'}</span>
        </button>

        {/* Dyslexia Helper Drawer Button */}
        <button
          onClick={() => {
            audio.playPop();
            setIsOpen(!isOpen);
          }}
          className="px-3 py-2 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-900 border border-violet-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
        >
          <Eye className="w-4 h-4 text-violet-600" />
          <span>Dyslexia Tools</span>
          <Sliders className="w-3.5 h-3.5 opacity-60 ml-0.5" />
        </button>
      </div>

      {/* Floating / Popover Settings Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-violet-200 animate-in fade-in zoom-in-95 text-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-violet-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                Dyslexia Reading Helpers
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              Close ✕
            </button>
          </div>

          <div className="space-y-4 pt-3 text-xs sm:text-sm">
            {/* Background Tint Overlays */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                🌈 Background Reading Tint (Reduces Glare)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {tints.map((tint) => (
                  <button
                    key={tint.id}
                    onClick={() => {
                      audio.playPop();
                      onUpdateSettings({ ...settings, tint: tint.id });
                    }}
                    style={{ backgroundColor: tint.bg, borderColor: tint.border }}
                    className={`py-2 px-2 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      settings.tint === tint.id
                        ? 'ring-2 ring-violet-500 shadow-sm scale-102'
                        : 'opacity-90 hover:opacity-100'
                    }`}
                  >
                    {settings.tint === tint.id && <Check className="w-3.5 h-3.5 text-violet-700" />}
                    <span>{tint.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dyslexia Fonts */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                🔤 Font Style
              </label>
              <div className="space-y-1.5">
                {fonts.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      audio.playPop();
                      onUpdateSettings({ ...settings, font: f.id });
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl border flex items-center justify-between transition-all ${
                      settings.font === f.id
                        ? 'bg-violet-50 border-violet-400 font-bold text-violet-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    } ${f.style}`}
                  >
                    <span>{f.name}</span>
                    {settings.font === f.id && <Check className="w-4 h-4 text-violet-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Letter Spacing */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                ↔️ Letter Spacing (Prevents Letter Crowding)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {spacings.map((sp) => (
                  <button
                    key={sp.id}
                    onClick={() => {
                      audio.playPop();
                      onUpdateSettings({ ...settings, letterSpacing: sp.id });
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      settings.letterSpacing === sp.id
                        ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* b vs d Mirror Guard Helper */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-200">
              <div>
                <p className="font-bold text-blue-900 text-xs sm:text-sm">
                  'b' & 'd' Color Marker
                </p>
                <p className="text-[11px] text-blue-700">
                  Colors <span className="font-bold text-blue-600">b (blue)</span> and <span className="font-bold text-pink-600">d (pink)</span> to stop mirror flips
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.bdHelper}
                onChange={(e) => {
                  audio.playPop();
                  onUpdateSettings({ ...settings, bdHelper: e.target.checked });
                }}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Syllable Colors */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div>
                <p className="font-bold text-emerald-900 text-xs sm:text-sm">
                  Chunk & Syllable Highlights
                </p>
                <p className="text-[11px] text-emerald-700">
                  Color-codes prefixes, roots, and suffixes
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.syllableColoring}
                onChange={(e) => {
                  audio.playPop();
                  onUpdateSettings({ ...settings, syllableColoring: e.target.checked });
                }}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
