/**
 * SfxManager — Real PMD audio from pokemonAutoChess resources.
 * BGM: PMD dungeon music (.ogg) via HTMLAudioElement
 * SFX: pokemonAutoChess sound effects (.ogg) via HTMLAudioElement pool
 *
 * Resources:
 *   - Music: github.com/keldaanCommunity/pokemonAutoChessMusic (CC BY-NC 4.0)
 *   - SFX:   github.com/keldaanCommunity/pokemonAutoChess (GPL-3.0)
 */

/** BGM tracks mapped to game contexts */
export const BGM_TRACKS = {
  title: "Top Menu Theme",
  gameplay: ["Amp Plains", "Crystal Cave", "Mt. Blaze", "Treasure Town"],
  boss: "Boss Battle!",
  bossLegendary: "Versus Legendary",
  danger: "Monster House",
  victory: "Job Clear!",
} as const;

/** SFX file keys → asset filenames */
const SFX_FILES: Record<string, string> = {
  hit: "refresh",
  pickup: "carouselunlock",
  levelUp: "evolutiont2",
  evolution: "evolutiont3",
  death: "finish8",
  bossWarning: "notification",
  stageClear: "finish1",
  start: "startgame",
  click: "buttonclick",
};

export class SfxManager {
  private sounds: Map<string, HTMLAudioElement[]> = new Map();
  private masterVolume = 0.3;
  private bgmElement: HTMLAudioElement | null = null;
  private bgmPlaying = false;
  private currentBgmTrack = "";
  private initialized = false;

  /** Must be called from a user gesture (tap/click) */
  init(): void {
    if (this.initialized) return;
    this.preloadSfx();
    this.initialized = true;
  }

  private preloadSfx(): void {
    for (const [key, file] of Object.entries(SFX_FILES)) {
      const pool: HTMLAudioElement[] = [];
      for (let i = 0; i < 3; i++) {
        const audio = new Audio(`assets/sounds/${file}.ogg`);
        audio.volume = this.masterVolume;
        audio.preload = "auto";
        pool.push(audio);
      }
      this.sounds.set(key, pool);
    }
  }

  private playSfx(key: string, volumeMult = 1.0): void {
    const pool = this.sounds.get(key);
    if (!pool) return;
    const audio = pool.find((a) => a.paused || a.ended) ?? pool[0];
    audio.volume = Math.min(1, this.masterVolume * volumeMult);
    audio.currentTime = 0;
    audio.play().catch(() => { /* autoplay policy */ });
  }

  adjustVolume(delta: number): void {
    this.masterVolume = Math.max(0, Math.min(1, this.masterVolume + delta));
    if (this.bgmElement) {
      this.bgmElement.volume = this.masterVolume * 0.4;
    }
  }

  // ---- SFX methods (same public API as before) --------------------

  playHit(): void {
    this.playSfx("hit", 0.5);
  }

  playPickup(): void {
    this.playSfx("pickup", 0.6);
  }

  playLevelUp(): void {
    this.playSfx("levelUp");
  }

  playDeath(): void {
    this.playSfx("death");
  }

  playBossWarning(): void {
    this.playSfx("bossWarning", 0.8);
  }

  playStageClear(): void {
    this.playSfx("stageClear");
  }

  playStart(): void {
    this.playSfx("start");
  }

  playClick(): void {
    this.playSfx("click", 0.5);
  }

  // ---- BGM — real PMD dungeon music --------------------------------

  /** Start BGM. Picks a random gameplay track unless overridden. */
  startBgm(trackOverride?: string): void {
    if (this.bgmPlaying) this.stopBgm();

    const track =
      trackOverride ??
      BGM_TRACKS.gameplay[
        Math.floor(Math.random() * BGM_TRACKS.gameplay.length)
      ];

    this.currentBgmTrack = track;
    this.bgmElement = new Audio(`assets/musics/${track}.ogg`);
    this.bgmElement.loop = true;
    this.bgmElement.volume = this.masterVolume * 0.4;
    this.bgmElement.play().catch(() => { /* autoplay policy */ });
    this.bgmPlaying = true;
  }

  /** Crossfade to a different BGM track */
  switchBgm(track: string): void {
    if (this.currentBgmTrack === track) return;
    if (this.bgmElement) {
      const old = this.bgmElement;
      const fade = setInterval(() => {
        if (old.volume > 0.05) {
          old.volume = Math.max(0, old.volume - 0.05);
        } else {
          clearInterval(fade);
          old.pause();
          old.src = "";
          this.startBgm(track);
        }
      }, 50);
    } else {
      this.startBgm(track);
    }
  }

  stopBgm(): void {
    if (this.bgmElement) {
      this.bgmElement.pause();
      this.bgmElement.src = "";
      this.bgmElement = null;
    }
    this.bgmPlaying = false;
    this.currentBgmTrack = "";
  }
}

/** Global singleton */
export const sfx = new SfxManager();
