/**
 * AttackEffects — Type-based attack animations using Phaser spritesheets.
 *
 * Loads horizontal spritesheets packed from pokemonAutoChess attack sprites,
 * creates Phaser animations via generateFrameNumbers(), and provides
 * playback helpers for projectile, hit impact, and melee effects.
 *
 * Source: github.com/keldaanCommunity/pokemonAutoChess (GPL-3.0)
 * Sprites: app/public/src/assets/attacks{tps}/
 */
import Phaser from "phaser";

/* ================================================================
   METADATA — auto-generated from attack-meta.json
   Each type has hit/range/melee variants as spritesheets.
   ================================================================ */

export interface AttackVariantMeta {
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  sheetFile: string;
}

export interface AttackTypeMeta {
  range?: AttackVariantMeta;
  hit?: AttackVariantMeta;
  melee?: AttackVariantMeta;
}

/**
 * All 18 attack types with spritesheet metadata.
 * Loaded from packed horizontal spritesheets in public/assets/attacks/{TYPE}/
 */
export const ATTACK_META: Record<string, AttackTypeMeta> = {
  BUG:      { range: { frameWidth: 24, frameHeight: 24, frameCount: 4, sheetFile: "range-sheet.png" },
              hit:   { frameWidth: 32, frameHeight: 32, frameCount: 4, sheetFile: "hit-sheet.png" },
              melee: { frameWidth: 64, frameHeight: 64, frameCount: 4, sheetFile: "melee-sheet.png" } },
  DARK:     { range: { frameWidth: 32, frameHeight: 32, frameCount: 6, sheetFile: "range-sheet.png" },
              hit:   { frameWidth: 64, frameHeight: 62, frameCount: 13, sheetFile: "hit-sheet.png" },
              melee: { frameWidth: 64, frameHeight: 64, frameCount: 7, sheetFile: "melee-sheet.png" } },
  DRAGON:   { range: { frameWidth: 72, frameHeight: 64, frameCount: 36, sheetFile: "range-sheet.png" },
              melee: { frameWidth: 48, frameHeight: 40, frameCount: 11, sheetFile: "melee-sheet.png" } },
  ELECTRIC: { range: { frameWidth: 16, frameHeight: 16, frameCount: 6, sheetFile: "range-sheet.png" },
              hit:   { frameWidth: 88, frameHeight: 48, frameCount: 6, sheetFile: "hit-sheet.png" },
              melee: { frameWidth: 72, frameHeight: 64, frameCount: 4, sheetFile: "melee-sheet.png" } },
  FAIRY:    { range: { frameWidth: 16, frameHeight: 16, frameCount: 6, sheetFile: "range-sheet.png" },
              hit:   { frameWidth: 40, frameHeight: 32, frameCount: 11, sheetFile: "hit-sheet.png" },
              melee: { frameWidth: 48, frameHeight: 32, frameCount: 26, sheetFile: "melee-sheet.png" } },
  FIGHTING: { range: { frameWidth: 32, frameHeight: 32, frameCount: 29, sheetFile: "range-sheet.png" },
              hit:   { frameWidth: 72, frameHeight: 72, frameCount: 3, sheetFile: "hit-sheet.png" },
              melee: { frameWidth: 72, frameHeight: 72, frameCount: 2, sheetFile: "melee-sheet.png" } },
  FIRE:     { range: { frameWidth: 40, frameHeight: 64, frameCount: 31, sheetFile: "range-sheet.png" },
              hit:   { frameWidth: 32, frameHeight: 32, frameCount: 4, sheetFile: "hit-sheet.png" },
              melee: { frameWidth: 64, frameHeight: 32, frameCount: 8, sheetFile: "melee-sheet.png" } },
  FLYING:   { range: { frameWidth: 48, frameHeight: 24, frameCount: 8, sheetFile: "range-sheet.png" },
              hit:   { frameWidth: 56, frameHeight: 48, frameCount: 6, sheetFile: "hit-sheet.png" },
              melee: { frameWidth: 72, frameHeight: 72, frameCount: 18, sheetFile: "melee-sheet.png" } },
  GHOST:    { range: { frameWidth: 40, frameHeight: 48, frameCount: 24, sheetFile: "range-sheet.png" },
              hit:   { frameWidth: 32, frameHeight: 32, frameCount: 7, sheetFile: "hit-sheet.png" },
              melee: { frameWidth: 32, frameHeight: 32, frameCount: 9, sheetFile: "melee-sheet.png" } },
  GRASS:    { range: { frameWidth: 24, frameHeight: 16, frameCount: 20, sheetFile: "range-sheet.png" },
              hit:   { frameWidth: 32, frameHeight: 32, frameCount: 3, sheetFile: "hit-sheet.png" },
              melee: { frameWidth: 64, frameHeight: 64, frameCount: 5, sheetFile: "melee-sheet.png" } },
  GROUND:   { hit:   { frameWidth: 32, frameHeight: 32, frameCount: 5, sheetFile: "hit-sheet.png" },
              melee: { frameWidth: 80, frameHeight: 80, frameCount: 12, sheetFile: "melee-sheet.png" } },
  ICE:      { range: { frameWidth: 64, frameHeight: 56, frameCount: 14, sheetFile: "range-sheet.png" },
              hit:   { frameWidth: 32, frameHeight: 32, frameCount: 5, sheetFile: "hit-sheet.png" },
              melee: { frameWidth: 96, frameHeight: 96, frameCount: 6, sheetFile: "melee-sheet.png" } },
  NORMAL:   { hit:   { frameWidth: 64, frameHeight: 64, frameCount: 4, sheetFile: "hit-sheet.png" },
              melee: { frameWidth: 64, frameHeight: 64, frameCount: 3, sheetFile: "melee-sheet.png" } },
  POISON:   { range: { frameWidth: 16, frameHeight: 16, frameCount: 4, sheetFile: "range-sheet.png" },
              hit:   { frameWidth: 32, frameHeight: 32, frameCount: 5, sheetFile: "hit-sheet.png" },
              melee: { frameWidth: 56, frameHeight: 64, frameCount: 11, sheetFile: "melee-sheet.png" } },
  PSYCHIC:  { range: { frameWidth: 32, frameHeight: 32, frameCount: 39, sheetFile: "range-sheet.png" },
              hit:   { frameWidth: 72, frameHeight: 72, frameCount: 6, sheetFile: "hit-sheet.png" },
              melee: { frameWidth: 72, frameHeight: 80, frameCount: 14, sheetFile: "melee-sheet.png" } },
  ROCK:     { range: { frameWidth: 16, frameHeight: 16, frameCount: 8, sheetFile: "range-sheet.png" },
              hit:   { frameWidth: 80, frameHeight: 80, frameCount: 14, sheetFile: "hit-sheet.png" },
              melee: { frameWidth: 72, frameHeight: 56, frameCount: 11, sheetFile: "melee-sheet.png" } },
  STEEL:    { range: { frameWidth: 32, frameHeight: 32, frameCount: 8, sheetFile: "range-sheet.png" },
              hit:   { frameWidth: 48, frameHeight: 48, frameCount: 14, sheetFile: "hit-sheet.png" },
              melee: { frameWidth: 64, frameHeight: 56, frameCount: 8, sheetFile: "melee-sheet.png" } },
  WATER:    { range: { frameWidth: 8, frameHeight: 8, frameCount: 19, sheetFile: "range-sheet.png" },
              hit:   { frameWidth: 16, frameHeight: 16, frameCount: 4, sheetFile: "hit-sheet.png" },
              melee: { frameWidth: 56, frameHeight: 56, frameCount: 8, sheetFile: "melee-sheet.png" } },
};

export type AttackType = keyof typeof ATTACK_META;
export type AttackVariant = "range" | "hit" | "melee";

/** Map starter pokemon → primary attack type */
export const STARTER_ATTACK_TYPE: Record<string, AttackType> = {
  pikachu: "ELECTRIC",
  charmander: "FIRE",
  squirtle: "WATER",
  bulbasaur: "GRASS",
  gastly: "GHOST",
  geodude: "ROCK",
  eevee: "NORMAL",
  chikorita: "GRASS",
  cyndaquil: "FIRE",
  totodile: "WATER",
  treecko: "GRASS",
  torchic: "FIRE",
  mudkip: "WATER",
  riolu: "FIGHTING",
};

/** Map enemy pokemon → attack type for enemy projectiles */
export const ENEMY_ATTACK_TYPE: Record<string, AttackType> = {
  gastly: "GHOST",
  geodude: "ROCK",
  rattata: "NORMAL",
  zubat: "POISON",
  pinsir: "BUG",
};

/* ================================================================
   LOADING — Phaser spritesheet loading
   ================================================================ */

/**
 * Get the texture key for a given attack type + variant.
 */
function texKey(type: string, variant: AttackVariant): string {
  return `atk-${type}-${variant}`;
}

/**
 * Get the animation key for a given attack type + variant.
 */
export function animKey(type: string, variant: AttackVariant): string {
  return `atk-${type}-${variant}`;
}

/**
 * Load all attack spritesheets. Call in BootScene.preload().
 * Uses Phaser's spritesheet loader with generateFrameNumbers — one HTTP request per spritesheet.
 */
export function loadAttackEffects(scene: Phaser.Scene): void {
  for (const [type, meta] of Object.entries(ATTACK_META)) {
    for (const variant of ["range", "hit", "melee"] as AttackVariant[]) {
      const varMeta = meta[variant];
      if (!varMeta) continue;

      const key = texKey(type, variant);
      scene.load.spritesheet(key, `assets/attacks/${type}/${varMeta.sheetFile}`, {
        frameWidth: varMeta.frameWidth,
        frameHeight: varMeta.frameHeight,
      });
    }
  }
}

/**
 * Create Phaser animations from loaded spritesheets. Call in BootScene.create().
 * Uses generateFrameNumbers() — the proper Phaser way.
 */
export function createAttackAnimations(scene: Phaser.Scene): void {
  for (const [type, meta] of Object.entries(ATTACK_META)) {
    for (const variant of ["range", "hit", "melee"] as AttackVariant[]) {
      const varMeta = meta[variant];
      if (!varMeta) continue;

      const key = texKey(type, variant);
      if (!scene.textures.exists(key)) continue;

      const aKey = animKey(type, variant);

      scene.anims.create({
        key: aKey,
        frames: scene.anims.generateFrameNumbers(key, {
          start: 0,
          end: varMeta.frameCount - 1,
        }),
        frameRate: variant === "hit" ? 16 : 12,
        repeat: variant === "range" ? -1 : 0, // range loops, hit/melee play once
      });
    }
  }
}

/* ================================================================
   PLAYBACK HELPERS
   ================================================================ */

/**
 * Play a hit impact effect at the given position. Auto-destroys on complete.
 */
export function playHitEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  type: AttackType = "NORMAL",
): void {
  const aKey = animKey(type, "hit");
  const tKey = texKey(type, "hit");
  if (!scene.anims.exists(aKey) || !scene.textures.exists(tKey)) return;

  const sprite = scene.add.sprite(x, y, tKey, 0).setDepth(15).setScale(2);
  sprite.play(aKey);
  sprite.once("animationcomplete", () => sprite.destroy());
}

/**
 * Play a melee effect at the given position. Auto-destroys on complete.
 * Melee effects are larger and play once — used for close-range attacks.
 */
export function playMeleeEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  type: AttackType = "NORMAL",
): void {
  // Fallback to hit if no melee variant
  const variant: AttackVariant = ATTACK_META[type]?.melee ? "melee" : "hit";
  const aKey = animKey(type, variant);
  const tKey = texKey(type, variant);
  if (!scene.anims.exists(aKey) || !scene.textures.exists(tKey)) return;

  const sprite = scene.add.sprite(x, y, tKey, 0).setDepth(15).setScale(1.5);
  sprite.play(aKey);
  sprite.once("animationcomplete", () => sprite.destroy());
}

/**
 * Get the spritesheet texture key for a range (projectile) animation.
 * Returns null if the type has no range variant.
 */
export function getRangeTextureKey(type: AttackType): string | null {
  if (!ATTACK_META[type]?.range) return null;
  return texKey(type, "range");
}

/**
 * Get the animation key for a range (projectile) animation.
 * Returns null if the type has no range variant.
 */
export function getRangeAnimKey(type: AttackType): string | null {
  if (!ATTACK_META[type]?.range) return null;
  return animKey(type, "range");
}

/**
 * Check if a given attack type has a specific variant loaded and ready.
 */
export function hasAttackVariant(
  scene: Phaser.Scene,
  type: AttackType,
  variant: AttackVariant,
): boolean {
  const tKey = texKey(type, variant);
  const aKey = animKey(type, variant);
  return scene.textures.exists(tKey) && scene.anims.exists(aKey);
}
