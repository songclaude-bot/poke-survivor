/**
 * AttackEffects — Loads and plays type-based attack animations
 * from pokemonAutoChess sprite resources.
 *
 * Source: github.com/keldaanCommunity/pokemonAutoChess (GPL-3.0)
 * Sprites: app/public/src/assets/attacks{tps}/
 */
import Phaser from "phaser";

/** Available attack types with their frame counts */
export const ATTACK_TYPES = {
  ELECTRIC: { range: 6, hit: 6 },
  FIRE: { range: 31, hit: 4 },
  WATER: { range: 19, hit: 4 },
  NORMAL: { range: 0, hit: 4 },
} as const;

export type AttackType = keyof typeof ATTACK_TYPES;

/** Map starter pokemon → attack type for projectile visuals */
export const STARTER_ATTACK_TYPE: Record<string, AttackType> = {
  pikachu: "ELECTRIC",
  charmander: "FIRE",
  squirtle: "WATER",
};

/**
 * Preload all attack effect frames in BootScene.preload()
 */
export function loadAttackEffects(scene: Phaser.Scene): void {
  for (const [type, counts] of Object.entries(ATTACK_TYPES)) {
    // Range (projectile) frames
    if (counts.range > 0) {
      for (let i = 0; i < counts.range; i++) {
        const idx = String(i).padStart(3, "0");
        scene.load.image(
          `atk-${type}-range-${i}`,
          `assets/attacks/${type}/range/${idx}.png`,
        );
      }
    }
    // Hit (impact) frames
    if (counts.hit > 0) {
      for (let i = 0; i < counts.hit; i++) {
        const idx = String(i).padStart(3, "0");
        scene.load.image(
          `atk-${type}-hit-${i}`,
          `assets/attacks/${type}/hit/${idx}.png`,
        );
      }
    }
  }
}

/**
 * Create animations from loaded attack frames. Call in BootScene.create()
 */
export function createAttackAnimations(scene: Phaser.Scene): void {
  for (const [type, counts] of Object.entries(ATTACK_TYPES)) {
    // Range animation (looping for projectile flight)
    if (counts.range > 0) {
      const rangeFrames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = 0; i < counts.range; i++) {
        const key = `atk-${type}-range-${i}`;
        if (scene.textures.exists(key)) {
          rangeFrames.push({ key });
        }
      }
      if (rangeFrames.length > 0) {
        scene.anims.create({
          key: `atk-${type}-range`,
          frames: rangeFrames,
          frameRate: 12,
          repeat: -1,
        });
      }
    }

    // Hit animation (one-shot on impact)
    if (counts.hit > 0) {
      const hitFrames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = 0; i < counts.hit; i++) {
        const key = `atk-${type}-hit-${i}`;
        if (scene.textures.exists(key)) {
          hitFrames.push({ key });
        }
      }
      if (hitFrames.length > 0) {
        scene.anims.create({
          key: `atk-${type}-hit`,
          frames: hitFrames,
          frameRate: 16,
          repeat: 0,
        });
      }
    }
  }
}

/**
 * Play a hit effect at the given position. Auto-destroys on complete.
 */
export function playHitEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  type: AttackType = "NORMAL",
): void {
  const animKey = `atk-${type}-hit`;
  if (!scene.anims.exists(animKey)) return;

  const firstFrame = `atk-${type}-hit-0`;
  if (!scene.textures.exists(firstFrame)) return;

  const sprite = scene.add.sprite(x, y, firstFrame).setDepth(15).setScale(2);
  sprite.play(animKey);
  sprite.once("animationcomplete", () => sprite.destroy());
}
