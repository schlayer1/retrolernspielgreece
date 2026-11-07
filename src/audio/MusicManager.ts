export interface TrackInfo {
  trackId: string;
  title: string;
  mood: string;
  prompt: string;
  src: string;
}

class MusicManager {
  private audio: HTMLAudioElement | null = null;
  private currentTrackId: string = '';
  private currentTrackInfo: TrackInfo | null = null;
  private _muted: boolean = false;
  private _volume: number = 0.42;
  private ctx: AudioContext | null = null;
  private loopTimer: number | null = null;
  private noteStep: number = 0;

  constructor() {
    try {
      const savedMute = localStorage.getItem('hellas_music_muted_v1');
      if (savedMute === 'true') this._muted = true;
      const savedVol = localStorage.getItem('hellas_music_vol_v1');
      if (savedVol) this._volume = Math.max(0, Math.min(1, parseFloat(savedVol)));
    } catch {
      // ignore
    }
  }

  public get muted(): boolean {
    return this._muted;
  }

  public get volume(): number {
    return this._volume;
  }

  public get currentTrack(): TrackInfo | null {
    return this.currentTrackInfo;
  }

  public setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.audio) {
      this.audio.volume = this._muted ? 0 : this._volume;
    }
    try {
      localStorage.setItem('hellas_music_vol_v1', String(this._volume));
    } catch {
      // ignore
    }
  }

  public toggleMute(): boolean {
    this._muted = !this._muted;
    if (this.audio) {
      this.audio.volume = this._muted ? 0 : this._volume;
    }
    if (this._muted) {
      this.stopFallbackSynth();
    } else if (this.currentTrackInfo && (!this.audio || this.audio.error)) {
      this.startFallbackSynth(this.currentTrackId);
    }
    try {
      localStorage.setItem('hellas_music_muted_v1', String(this._muted));
    } catch {
      // ignore
    }
    return this._muted;
  }

  public playChapterMusic(chapter: {
    id: number;
    music?: { trackId: string; title: string; mood: string; prompt: string };
  }): void {
    const m = chapter.music || {
      trackId: `ch${chapter.id}_hellas`,
      title: `Kapitel ${chapter.id} – Klänge von Hellas`,
      mood: 'Mediterran, antik, 16-Bit Lyra & Aulos',
      prompt: '16-bit SNES RPG ancient Greece soundtrack, kithara lyre, pan flute, warm Mediterranean atmosphere',
    };

    if (this.currentTrackId === m.trackId && (this.audio || this.loopTimer !== null)) {
      return;
    }

    this.currentTrackId = m.trackId;
    this.currentTrackInfo = {
      ...m,
      src: `assets/audio/music/${m.trackId}.mp3`,
    };

    this.stopAll();
    if (this._muted) return;

    try {
      const audio = new Audio(this.currentTrackInfo.src);
      audio.loop = true;
      audio.volume = this._volume;
      this.audio = audio;

      audio.addEventListener('error', () => {
        this.audio = null;
        if (!this._muted) this.startFallbackSynth(m.trackId);
      });

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          this.audio = null;
          if (!this._muted) this.startFallbackSynth(m.trackId);
        });
      }
    } catch {
      if (!this._muted) this.startFallbackSynth(m.trackId);
    }
  }

  private startFallbackSynth(trackId: string): void {
    this.stopFallbackSynth();
    // Dorian & Phrygian ancient Greek lyre scales (Hz)
    const scales: Record<string, number[]> = {
      ch1_polis: [293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 440.0],
      ch2_kolonisation: [329.63, 392.0, 440.0, 493.88, 587.33, 493.88, 440.0, 392.0],
      ch3_sparta: [220.0, 246.94, 261.63, 293.66, 329.63, 293.66, 261.63, 220.0],
      ch4_demokratie: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0],
      ch5_olymp: [392.0, 440.0, 493.88, 587.33, 659.25, 587.33, 493.88, 440.0],
      ch6_thermopylen: [196.0, 220.0, 233.08, 293.66, 329.63, 293.66, 233.08, 196.0],
      ch7_salamis: [246.94, 293.66, 329.63, 369.99, 440.0, 369.99, 329.63, 293.66],
      ch8_philosophie: [293.66, 349.23, 392.0, 440.0, 523.25, 440.0, 392.0, 349.23],
      ch9_alexander: [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25, 440.0],
      ch10_hellenismus: [329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 523.25, 440.0],
    };
    const notes = scales[trackId] || scales.ch1_polis;
    this.noteStep = 0;

    this.loopTimer = window.setInterval(() => {
      if (this._muted) return;
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        if (!this.ctx) this.ctx = new Ctx();
        if (this.ctx.state === 'suspended') return;

        const freq = notes[this.noteStep % notes.length];
        this.noteStep++;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        const vol = Math.max(0.005, this._volume * 0.08);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0008, this.ctx.currentTime + 0.55);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.58);
      } catch {
        // ignore audio context restrictions prior to gesture
      }
    }, 680);
  }

  private stopFallbackSynth(): void {
    if (this.loopTimer !== null) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
  }

  public stopAll(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    this.stopFallbackSynth();
  }
}

export const music = new MusicManager();
