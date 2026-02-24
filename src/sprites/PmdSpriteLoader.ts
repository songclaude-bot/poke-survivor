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

/** Attack animation metadata from AnimData.xml */
export interface PmdAttackConfig {
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  /** Frame durations in ticks */
  durations: number[];
  /** Frame index when character lunges forward */
  rushFrame: number;
  /** Frame index when damage is dealt */
  hitFrame: number;
  /** Frame index when character returns to idle */
  returnFrame: number;
}

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
  /** Attack animation config (from AnimData.xml Attack entry) */
  attack?: PmdAttackConfig;
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
    attack: {
      frameWidth: 80, frameHeight: 80, frameCount: 10,
      durations: [2, 2, 2, 2, 2, 2, 2, 4, 2, 3],
      rushFrame: 1, hitFrame: 3, returnFrame: 6,
    },
  },
  charmander: {
    id: "0004",
    name: "Charmander",
    walkFrames: 4,
    frameWidth: 32,
    frameHeight: 32,
    durations: [8, 10, 8, 10],
    attack: {
      frameWidth: 64, frameHeight: 64, frameCount: 11,
      durations: [2, 2, 2, 2, 2, 2, 2, 2, 4, 2, 2],
      rushFrame: 2, hitFrame: 6, returnFrame: 8,
    },
  },
  squirtle: {
    id: "0007",
    name: "Squirtle",
    walkFrames: 4,
    frameWidth: 32,
    frameHeight: 32,
    durations: [8, 10, 8, 10],
    attack: {
      frameWidth: 64, frameHeight: 72, frameCount: 10,
      durations: [2, 2, 2, 2, 2, 2, 2, 4, 1, 2],
      rushFrame: 1, hitFrame: 3, returnFrame: 6,
    },
  },
  bulbasaur: {
    id: "0001",
    name: "Bulbasaur",
    walkFrames: 6,
    frameWidth: 40,
    frameHeight: 40,
    durations: [8, 6, 8, 6, 8, 6],
    attack: {
      frameWidth: 64, frameHeight: 72, frameCount: 11,
      durations: [2, 2, 4, 2, 2, 2, 2, 2, 4, 2, 4],
      rushFrame: 2, hitFrame: 5, returnFrame: 7,
    },
  },
  gastly: {
    id: "0092",
    name: "Gastly",
    walkFrames: 4,
    frameWidth: 48,
    frameHeight: 64,
    durations: [8, 10, 8, 10],
    attack: {
      frameWidth: 64, frameHeight: 80, frameCount: 13,
      durations: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 2, 1],
      rushFrame: 2, hitFrame: 6, returnFrame: 9,
    },
  },
  geodude: {
    id: "0074",
    name: "Geodude",
    walkFrames: 4,
    frameWidth: 32,
    frameHeight: 32,
    durations: [8, 10, 8, 10],
    attack: {
      frameWidth: 72, frameHeight: 80, frameCount: 14,
      durations: [2, 2, 2, 2, 2, 1, 1, 2, 2, 1, 2, 2, 2, 2],
      rushFrame: 2, hitFrame: 5, returnFrame: 8,
    },
  },
  rattata: {
    id: "0019",
    name: "Rattata",
    walkFrames: 4,
    frameWidth: 48,
    frameHeight: 40,
    durations: [8, 10, 8, 10],
    attack: {
      frameWidth: 64, frameHeight: 72, frameCount: 10,
      durations: [2, 2, 2, 2, 2, 2, 2, 4, 1, 2],
      rushFrame: 1, hitFrame: 3, returnFrame: 6,
    },
  },
  zubat: {
    id: "0041",
    name: "Zubat",
    walkFrames: 4,
    frameWidth: 32,
    frameHeight: 56,
    durations: [8, 10, 8, 10],
    attack: {
      frameWidth: 72, frameHeight: 80, frameCount: 11,
      durations: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      rushFrame: 2, hitFrame: 4, returnFrame: 7,
    },
  },
  pinsir: {
    id: "0127",
    name: "Pinsir",
    walkFrames: 4,
    frameWidth: 32,
    frameHeight: 48,
    durations: [8, 10, 8, 10],
    attack: {
      frameWidth: 64, frameHeight: 80, frameCount: 10,
      durations: [2, 2, 2, 2, 2, 2, 2, 4, 1, 2],
      rushFrame: 1, hitFrame: 3, returnFrame: 6,
    },
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
 * Load PMD Attack sprite sheets from local assets.
 * Attack-Anim.png: same format as Walk-Anim (8 direction rows x N frames columns).
 * Call this in preload() of BootScene.
 */
export function loadPmdAttackSprites(scene: Phaser.Scene): void {
  for (const [key, config] of Object.entries(POKEMON_SPRITES)) {
    if (!config.attack) continue;
    const texKey = `pmd-${key}-attack`;
    // Load from local assets (downloaded from PMDCollab)
    scene.load.spritesheet(texKey, `assets/sprites/${config.id}/Attack-Anim.png`, {
      frameWidth: config.attack.frameWidth,
      frameHeight: config.attack.frameHeight,
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
 * Create attack pose animations from loaded Attack-Anim.png spritesheets.
 * 8 directions x N frames, played once when the pokemon fires a projectile.
 */
export function createPmdAttackAnimations(scene: Phaser.Scene): void {
  for (const [key, config] of Object.entries(POKEMON_SPRITES)) {
    if (!config.attack) continue;
    const texKey = `pmd-${key}-attack`;
    if (!scene.textures.exists(texKey)) continue;

    const atk = config.attack;
    const avgDur = atk.durations.reduce((a, b) => a + b, 0) / atk.durations.length;
    const frameRate = 60 / avgDur;

    for (let dir = 0; dir < 8; dir++) {
      const dirName = PMD_DIRECTIONS[dir];
      scene.anims.create({
        key: `${key}-attack-${dirName}`,
        frames: scene.anims.generateFrameNumbers(texKey, {
          start: dir * atk.frameCount,
          end: dir * atk.frameCount + atk.frameCount - 1,
        }),
        frameRate,
        repeat: 0,
      });
    }
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
