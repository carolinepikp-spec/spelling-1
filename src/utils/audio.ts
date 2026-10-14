// Audio Engine with Web Audio API synthesizer & Web Speech API

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private voiceSpeed: number = 0.85;

  constructor() {
    // Lazily init AudioContext upon user gesture
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public setVoiceSpeed(speed: number) {
    this.voiceSpeed = Math.max(0.5, Math.min(1.2, speed));
  }

  // --- Sound Effects using Synthesizer ---

  // Satisfying magnetic / wooden block snap
  public playSnap() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  // Juicy bubble pop sound
  public playPop() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  }

  // Upbeat major chime for correct letter or action
  public playSuccessChime() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.07);

      const startTime = ctx.currentTime + index * 0.07;
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  // Grand victory fanfare when a word is completed
  public playCelebrationFanfare() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const chords = [
      { freqs: [523.25, 659.25], start: 0, dur: 0.14 },     // C + E
      { freqs: [587.33, 739.99], start: 0.14, dur: 0.14 },  // D + F#
      { freqs: [659.25, 830.61], start: 0.28, dur: 0.14 },  // E + G#
      { freqs: [783.99, 987.77, 1046.5], start: 0.44, dur: 0.55 }, // G + B + C6
    ];

    chords.forEach(({ freqs, start, dur }) => {
      freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

        const startTime = ctx.currentTime + start;
        gain.gain.setValueAtTime(0.16, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + dur);
      });
    });
  }

  // Gentle, positive cue (never harsh or punishing)
  public playGentleNudge() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(370, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  // Twinkling star sound
  public playStarSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const freqs = [880, 1174.66, 1318.51, 1760];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const st = ctx.currentTime + idx * 0.05;
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0.1, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(st);
      osc.stop(st + 0.25);
    });
  }

  // --- Speech Synthesis (Positive audio voice) ---

  private getBestVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    // Prefer friendly natural English voices
    const preferred = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Zira'))
    );
    return preferred || voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
  }

  public speak(text: string, rateMultiplier: number = 1.0, pitch: number = 1.1) {
    if (!this.soundEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.voiceSpeed * rateMultiplier;
      utterance.pitch = pitch;
      const voice = this.getBestVoice();
      if (voice) {
        utterance.voice = voice;
      }
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis failures gracefully
    }
  }

  // Speak word with clear standard pronunciation
  public speakWord(word: string) {
    this.speak(word, 0.9, 1.05);
  }

  // Turtle slow mode for dyslexic breakdown
  public speakSlow(word: string) {
    this.speak(word, 0.6, 1.0);
  }

  // Spell letters individually
  public speakLetters(word: string) {
    const lettersSpaced = word.toUpperCase().split('').join('. ');
    this.speak(`Spelling: ${lettersSpaced}. ${word}!`, 0.75, 1.05);
  }

  // Read sentence
  public speakSentence(sentence: string) {
    this.speak(sentence, 0.88, 1.05);
  }

  // Randomized cheerful affirmations
  public speakEncouragement() {
    const praises = [
      "Super job! You're a spelling star!",
      "Fantastic! You got it right!",
      "Awesome work! Look at that bright brain!",
      "You nailed it! Keep shining!",
      "Woohoo! That was brilliant!",
      "Wonderful spelling! High five!",
      "You did it! I'm so proud of you!"
    ];
    const picked = praises[Math.floor(Math.random() * praises.length)];
    this.speak(picked, 0.95, 1.15);
  }

  // Gentle supportive phrase when trying again
  public speakGentleTryAgain(hint?: string) {
    const nudges = [
      "Almost there! Let's look closely together.",
      "Good try! You can do this!",
      "Take your time, you're doing great!",
      "Let's try that one again together!"
    ];
    const base = nudges[Math.floor(Math.random() * nudges.length)];
    const text = hint ? `${base} Hint: ${hint}` : base;
    this.speak(text, 0.9, 1.05);
  }
}

export const audio = new SoundEngine();
