/**
 * SfxManager — Procedural 8-bit sound effects using Web Audio API.
 * No external audio files needed.
 */
export class SfxManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized = false;

  /** Must be called from a user gesture (tap/click) */
  init(): void {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch {
      // Web Audio not available
    }
  }

  private ensureContext(): boolean {
    if (!this.ctx || !this.masterGain) return false;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return true;
  }

  /** Quick blip for projectile hit */
  playHit(): void {
    if (!this.ensureContext()) return;
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  /** XP gem pickup */
  playPickup(): void {
    if (!this.ensureContext()) return;
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  /** Level up fanfare */
  playLevelUp(): void {
    if (!this.ensureContext()) return;
    const ctx = this.ctx!;
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      const t = ctx.currentTime + i * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  /** Player death */
  playDeath(): void {
    if (!this.ensureContext()) return;
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.7);
  }

  /** Boss warning horn */
  playBossWarning(): void {
    if (!this.ensureContext()) return;
    const ctx = this.ctx!;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      const t = ctx.currentTime + i * 0.25;
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.setValueAtTime(330, t + 0.1);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.25);
    }
  }

  /** Stage clear jingle */
  playStageClear(): void {
    if (!this.ensureContext()) return;
    const ctx = this.ctx!;
    const notes = [523, 659, 784, 1047, 784, 1047, 1319]; // ascending fanfare
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      const t = ctx.currentTime + i * 0.1;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  // ----------------------------------------------------------------
  // BGM — procedural 8-bit loop using arpeggiated chords
  // ----------------------------------------------------------------

  private bgmNodes: OscillatorNode[] = [];
  private bgmGain: GainNode | null = null;
  private bgmPlaying = false;

  startBgm(): void {
    if (!this.ensureContext() || this.bgmPlaying) return;
    const ctx = this.ctx!;
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.value = 0.06;
    this.bgmGain.connect(this.masterGain!);

    // Bass line — looping pattern
    const bassNotes = [131, 165, 147, 175]; // C3, E3, D3, F3
    const bass = ctx.createOscillator();
    bass.type = "triangle";
    bass.frequency.setValueAtTime(bassNotes[0], ctx.currentTime);

    // Schedule repeating bass pattern
    const beatLen = 0.4;
    const patternLen = bassNotes.length * beatLen;
    for (let rep = 0; rep < 200; rep++) {
      for (let i = 0; i < bassNotes.length; i++) {
        const t = ctx.currentTime + rep * patternLen + i * beatLen;
        bass.frequency.setValueAtTime(bassNotes[i], t);
      }
    }
    bass.connect(this.bgmGain);
    bass.start(ctx.currentTime);

    // Arpeggio layer
    const arpNotes = [523, 659, 784, 659, 587, 698, 784, 698]; // C5 E5 G5 E5 D5 F5 G5 F5
    const arp = ctx.createOscillator();
    arp.type = "square";
    const arpGain = ctx.createGain();
    arpGain.gain.value = 0.03;
    arp.frequency.setValueAtTime(arpNotes[0], ctx.currentTime);

    const arpBeat = 0.2;
    const arpPatternLen = arpNotes.length * arpBeat;
    for (let rep = 0; rep < 400; rep++) {
      for (let i = 0; i < arpNotes.length; i++) {
        const t = ctx.currentTime + rep * arpPatternLen + i * arpBeat;
        arp.frequency.setValueAtTime(arpNotes[i], t);
      }
    }
    arp.connect(arpGain);
    arpGain.connect(this.bgmGain);
    arp.start(ctx.currentTime);

    this.bgmNodes = [bass, arp];
    this.bgmPlaying = true;
  }

  stopBgm(): void {
    for (const node of this.bgmNodes) {
      try { node.stop(); } catch { /* already stopped */ }
    }
    this.bgmNodes = [];
    this.bgmPlaying = false;
  }

  /** Start game blip */
  playStart(): void {
    if (!this.ensureContext()) return;
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  }
}

/** Global singleton */
export const sfx = new SfxManager();
