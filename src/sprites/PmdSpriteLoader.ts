import Phaser from "phaser";

/**
 * PMD Sprite Loader — Loads walk sprites from PMDCollab SpriteCollab repository.
 *
 * Sprite format: Walk-Anim.png contains frames arranged horizontally,
 * with 8 directional rows (Down, DownRight, Right, UpRight, Up, UpLeft, Left, DownLeft).
 *
 * AnimData.xml provides frame dimensions and timing.
 */

const SPRITE_BASE =
  "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite";
const PORTRAIT_BASE =
  "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait";

/** Direction row mapping in PMD sprites (top to bottom) */
export const PMD_DIRECTIONS = [
  "down",
  "down-right",
  "right",
  "up-right",
  "up",
  "up-left",
  "left",
  "down-left",
] as const;

export type PmdDirection = (typeof PMD_DIRECTIONS)[number];

/** Pokemon ID → sprite data mapping for pre-configured sprites */
export interface PmdSpriteConfig {
  /** PMD ID (4-digit padded: "0025" for Pikachu) */
  id: string;
  /** Display name */
  name: string;
  /** Walk frame count (from AnimData.xml) */
  walkFrames: number;
  /** Walk frame width (px) */
  frameWidth: number;
  /** Walk frame height (px) */
  frameHeight: number;
  /** Frame durations in ticks */
  durations: number[];
}

/**
 * Pre-configured sprites for the prototype.
 * Frame data extracted from AnimData.xml files.
 */
export const POKEMON_SPRITES: Record<string, PmdSpriteConfig> = {
  pikachu: {
    id: "0025",
    name: "Pikachu",
    walkFrames: 4,
    frameWidth: 32,
    frameHeight: 40,
    durations: [8, 10, 8, 10],
  },
  charmander: {
    id: "0004",
    name: "Charmander",
    walkFrames: 4,
    frameWidth: 32,
    frameHeight: 32,
    durations: [8, 10, 8, 10],
  },
  squirtle: {
    id: "0007",
    name: "Squirtle",
    walkFrames: 4,
    frameWidth: 32,
    frameHeight: 32,
    durations: [8, 10, 8, 10],
  },
  bulbasaur: {
    id: "0001",
    name: "Bulbasaur",
    walkFrames: 6,
    frameWidth: 40,
    frameHeight: 40,
    durations: [8, 6, 8, 6, 8, 6],
  },
  gastly: {
    id: "0092",
    name: "Gastly",
    walkFrames: 4, // Use first 4 of 12 for simplicity
    frameWidth: 48,
    frameHeight: 64,
    durations: [8, 10, 8, 10],
  },
  geodude: {
    id: "0074",
    name: "Geodude",
    walkFrames: 4,
    frameWidth: 32,
    frameHeight: 32,
    durations: [8, 10, 8, 10],
  },
  rattata: {
    id: "0019",
    name: "Rattata",
    walkFrames: 4, // Use first 4 of 7 for simplicity
    frameWidth: 48,
    frameHeight: 40,
    durations: [8, 10, 8, 10],
  },
  zubat: {
    id: "0041",
    name: "Zubat",
    walkFrames: 4, // Use first 4 of 8
    frameWidth: 32,
    frameHeight: 56,
    durations: [8, 10, 8, 10],
  },
  pinsir: {
    id: "0127",
    name: "Pinsir",
    walkFrames: 4,
    frameWidth: 32,
    frameHeight: 48,
    durations: [8, 10, 8, 10],
  },
};

/**
 * Load PMD Walk sprite sheets into Phaser's texture manager.
 * Call this in preload() of BootScene.
 */
export function loadPmdSprites(scene: Phaser.Scene): void {
  for (const [key, config] of Object.entries(POKEMON_SPRITES)) {
    const url = `${SPRITE_BASE}/${config.id}/Walk-Anim.png`;
    const texKey = `pmd-${key}`;

    // Load as spritesheet with correct frame dimensions
    // PMD Walk sheets: columns = frames, rows = 8 directions
    scene.load.spritesheet(texKey, url, {
      frameWidth: config.frameWidth,
      frameHeight: config.frameHeight,
    });
  }
}

/**
 * Load PMD portraits (40x40 emotion images) for UI use.
 */
export function loadPmdPortraits(scene: Phaser.Scene): void {
  for (const [key, config] of Object.entries(POKEMON_SPRITES)) {
    const url = `${PORTRAIT_BASE}/${config.id}/Normal.png`;
    scene.load.image(`portrait-${key}`, url);
  }
}

/**
 * Create walk animations for all loaded PMD sprites.
 * Call this in create() after sprites are loaded.
 */
export function createPmdAnimations(scene: Phaser.Scene): void {
  for (const [key, config] of Object.entries(POKEMON_SPRITES)) {
    const texKey = `pmd-${key}`;
    if (!scene.textures.exists(texKey)) continue;

    // Create animation for each direction
    for (let dir = 0; dir < 8; dir++) {
      const dirName = PMD_DIRECTIONS[dir];
      const animKey = `${key}-walk-${dirName}`;

      // Frame indices: row * framesPerRow + col
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let f = 0; f < config.walkFrames; f++) {
        frames.push({ key: texKey, frame: dir * config.walkFrames + f });
      }

      // Calculate frame rate from durations (ticks → ms)
      // PMD tick = ~1/60th second, we average the durations
      const avgDuration = config.durations.reduce((a, b) => a + b, 0) / config.durations.length;
      const frameRate = 60 / avgDuration; // Convert ticks to fps

      scene.anims.create({
        key: animKey,
        frames,
        frameRate,
        repeat: -1,
      });
    }

    // Also create a simple "idle" that's just the first frame of down-walk
    scene.anims.create({
      key: `${key}-idle`,
      frames: [{ key: texKey, frame: 0 }],
      frameRate: 1,
    });
  }
}

/**
 * Get the correct direction name from a velocity vector.
 */
export function getDirectionFromVelocity(
  vx: number,
  vy: number,
): PmdDirection {
  if (Math.abs(vx) < 1 && Math.abs(vy) < 1) return "down";

  const angle = Math.atan2(vy, vx) * (180 / Math.PI);
  // Map angle to 8 directions
  if (angle >= -22.5 && angle < 22.5) return "right";
  if (angle >= 22.5 && angle < 67.5) return "down-right";
  if (angle >= 67.5 && angle < 112.5) return "down";
  if (angle >= 112.5 && angle < 157.5) return "down-left";
  if (angle >= 157.5 || angle < -157.5) return "left";
  if (angle >= -157.5 && angle < -112.5) return "up-left";
  if (angle >= -112.5 && angle < -67.5) return "up";
  return "up-right";
}
