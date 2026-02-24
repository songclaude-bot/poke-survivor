import Phaser from "phaser";

/**
 * Pokemon Sprite Loader — Loads atlas sprites from Pokemon Auto Chess repository.
 *
 * Source: github.com/keldaanCommunity/pokemonAutoChess (GPL-3.0)
 * Atlas format: TexturePacker multiatlas (JSON + PNG)
 * Frame naming: "{Normal|Shiny}/{Action}/Anim/{Direction 0-7}/{FrameIndex}"
 * Directions: 0=Down, 1=DownRight, 2=Right, 3=UpRight, 4=Up, 5=UpLeft, 6=Left, 7=DownLeft
 */

const PAC_SPRITE_BASE =
  "https://raw.githubusercontent.com/keldaanCommunity/pokemonAutoChess/master/app/public/src/assets/pokemons";
const PAC_PORTRAIT_BASE =
  "https://raw.githubusercontent.com/keldaanCommunity/pokemonAutoChess/master/app/public/src/assets/portraits";

/** Direction row mapping — matches PAC atlas direction numbering */
export const PMD_DIRECTIONS = [
  "down",       // 0
  "down-right", // 1
  "right",      // 2
  "up-right",   // 3
  "up",         // 4
  "up-left",    // 5
  "left",       // 6
  "down-left",  // 7
] as const;

export type PmdDirection = (typeof PMD_DIRECTIONS)[number];

/** Pokemon ID → sprite config mapping */
export interface PmdSpriteConfig {
  /** National Dex ID (4-digit padded: "0025" for Pikachu) */
  id: string;
  /** Display name */
  name: string;
  /** Whether this pokemon has attack animation in the atlas */
  hasAttack?: boolean;
}

/**
 * All pokemon used in the game.
 * No more frameWidth/frameHeight needed — the atlas handles it!
 */
export const POKEMON_SPRITES: Record<string, PmdSpriteConfig> = {
  // -- Starters (with attack animations) --
  pikachu:    { id: "0025", name: "Pikachu",    hasAttack: true },
  charmander: { id: "0004", name: "Charmander", hasAttack: true },
  squirtle:   { id: "0007", name: "Squirtle",   hasAttack: true },
  bulbasaur:  { id: "0001", name: "Bulbasaur",  hasAttack: true },
  gastly:     { id: "0092", name: "Gastly",      hasAttack: true },
  geodude:    { id: "0074", name: "Geodude",     hasAttack: true },

  // -- Evolution sprites --
  raichu:     { id: "0026", name: "Raichu",     hasAttack: true },
  charmeleon: { id: "0005", name: "Charmeleon", hasAttack: true },
  wartortle:  { id: "0008", name: "Wartortle",  hasAttack: true },
  ivysaur:    { id: "0002", name: "Ivysaur",    hasAttack: true },
  haunter:    { id: "0093", name: "Haunter",    hasAttack: true },
  graveler:   { id: "0075", name: "Graveler",   hasAttack: true },

  // -- Enemy pool (Tier 0 — common) --
  rattata:    { id: "0019", name: "Rattata" },
  zubat:      { id: "0041", name: "Zubat" },
  caterpie:   { id: "0010", name: "Caterpie" },
  weedle:     { id: "0013", name: "Weedle" },
  pidgey:     { id: "0016", name: "Pidgey" },
  paras:      { id: "0046", name: "Paras" },
  oddish:     { id: "0043", name: "Oddish" },
  poliwag:    { id: "0060", name: "Poliwag" },
  meowth:     { id: "0052", name: "Meowth" },

  // -- Enemy pool (Tier 1 — uncommon) --
  sandshrew:  { id: "0027", name: "Sandshrew" },
  ekans:      { id: "0023", name: "Ekans" },
  psyduck:    { id: "0054", name: "Psyduck" },
  growlithe:  { id: "0058", name: "Growlithe" },
  cubone:     { id: "0104", name: "Cubone" },
  drowzee:    { id: "0096", name: "Drowzee" },
  machop:     { id: "0066", name: "Machop" },
  slowpoke:   { id: "0079", name: "Slowpoke" },
  magnemite:  { id: "0081", name: "Magnemite" },
  koffing:    { id: "0109", name: "Koffing" },
  grimer:     { id: "0088", name: "Grimer" },

  // -- Enemy pool (Tier 2 — rare) --
  pinsir:     { id: "0127", name: "Pinsir" },
  scyther:    { id: "0123", name: "Scyther" },
  mankey:     { id: "0056", name: "Mankey" },
  eevee:      { id: "0133", name: "Eevee" },
  dratini:    { id: "0147", name: "Dratini" },
  vulpix:     { id: "0037", name: "Vulpix" },
  clefairy:   { id: "0035", name: "Clefairy" },

  // -- Enemy pool (Tier 3 — boss-tier) --
  snorlax:    { id: "0143", name: "Snorlax" },
  onix:       { id: "0095", name: "Onix" },
  lapras:     { id: "0131", name: "Lapras" },
  aerodactyl: { id: "0142", name: "Aerodactyl" },

  // -- Boss pool --
  spearow:    { id: "0021", name: "Spearow" },

  // -- Additional diversity (Gen 1+) --
  abra:       { id: "0063", name: "Abra" },
  bellsprout: { id: "0069", name: "Bellsprout" },
  tentacool:  { id: "0072", name: "Tentacool" },
  ponyta:     { id: "0077", name: "Ponyta" },
  doduo:      { id: "0084", name: "Doduo" },
  seel:       { id: "0086", name: "Seel" },
  shellder:   { id: "0090", name: "Shellder" },
  voltorb:    { id: "0100", name: "Voltorb" },
  exeggcute:  { id: "0102", name: "Exeggcute" },
  rhyhorn:    { id: "0111", name: "Rhyhorn" },
  horsea:     { id: "0116", name: "Horsea" },
  goldeen:    { id: "0118", name: "Goldeen" },
  staryu:     { id: "0120", name: "Staryu" },
  magikarp:   { id: "0129", name: "Magikarp" },
  chikorita:  { id: "0152", name: "Chikorita" },
  cyndaquil:  { id: "0155", name: "Cyndaquil" },
  totodile:   { id: "0158", name: "Totodile" },
  sentret:    { id: "0161", name: "Sentret" },
  hoothoot:   { id: "0163", name: "Hoothoot" },
  ledyba:     { id: "0165", name: "Ledyba" },
  spinarak:   { id: "0167", name: "Spinarak" },
  pichu:      { id: "0172", name: "Pichu" },
  togepi:     { id: "0175", name: "Togepi" },
  mareep:     { id: "0179", name: "Mareep" },
  marill:     { id: "0183", name: "Marill" },
  hoppip:     { id: "0187", name: "Hoppip" },
  sunkern:    { id: "0191", name: "Sunkern" },
  wooper:     { id: "0194", name: "Wooper" },
  murkrow:    { id: "0198", name: "Murkrow" },
  misdreavus: { id: "0200", name: "Misdreavus" },
  snubbull:   { id: "0209", name: "Snubbull" },
  teddiursa:  { id: "0216", name: "Teddiursa" },
  slugma:     { id: "0218", name: "Slugma" },
  swinub:     { id: "0220", name: "Swinub" },
  phanpy:     { id: "0231", name: "Phanpy" },
  larvitar:   { id: "0246", name: "Larvitar" },
  treecko:    { id: "0252", name: "Treecko" },
  torchic:    { id: "0255", name: "Torchic" },
  mudkip:     { id: "0258", name: "Mudkip" },
  ralts:      { id: "0280", name: "Ralts" },
  shroomish:  { id: "0285", name: "Shroomish" },
  aron:       { id: "0304", name: "Aron" },
  electrike:  { id: "0309", name: "Electrike" },
  trapinch:   { id: "0328", name: "Trapinch" },
  swablu:     { id: "0333", name: "Swablu" },
  feebas:     { id: "0349", name: "Feebas" },
  shuppet:    { id: "0353", name: "Shuppet" },
  snorunt:    { id: "0361", name: "Snorunt" },
  bagon:      { id: "0371", name: "Bagon" },
  beldum:     { id: "0374", name: "Beldum" },
};

/**
 * Get the atlas texture key for a pokemon.
 * Format: "pac-{key}" (e.g., "pac-pikachu")
 */
export function pacTexKey(key: string): string {
  return `pac-${key}`;
}

/**
 * Load Pokemon sprites as multiatlas from PAC repository.
 * Call this in preload() of BootScene.
 */
export function loadPmdSprites(scene: Phaser.Scene): void {
  for (const [key, config] of Object.entries(POKEMON_SPRITES)) {
    const atlasKey = pacTexKey(key);
    const jsonUrl = `${PAC_SPRITE_BASE}/${config.id}.json`;
    scene.load.multiatlas(atlasKey, jsonUrl, `${PAC_SPRITE_BASE}/`);
  }
}

/**
 * Load PMD portraits for UI use.
 */
export function loadPmdPortraits(scene: Phaser.Scene): void {
  for (const [key, config] of Object.entries(POKEMON_SPRITES)) {
    const url = `${PAC_PORTRAIT_BASE}/${config.id}/Normal.png`;
    scene.load.image(`portrait-${key}`, url);
  }
}

/**
 * No-op for backward compatibility — attack sprites are now in the same atlas.
 */
export function loadPmdAttackSprites(_scene: Phaser.Scene): void {
  // Attack animations are included in the multiatlas, no separate loading needed
}

/**
 * Create walk + idle + attack animations from loaded PAC atlases.
 * Scans atlas frame names to auto-discover animations and frame counts.
 * Call this in create() after sprites are loaded.
 */
export function createPmdAnimations(scene: Phaser.Scene): void {
  for (const [key] of Object.entries(POKEMON_SPRITES)) {
    const atlasKey = pacTexKey(key);
    if (!scene.textures.exists(atlasKey)) continue;

    const frameNames = scene.textures.get(atlasKey).getFrameNames();

    // Discover available animations by scanning frame names
    // Format: "Normal/{Action}/Anim/{Dir}/{FrameIdx}"
    const animFrameCounts = new Map<string, number>(); // "Walk/0" -> max frame index + 1

    for (const name of frameNames) {
      const match = name.match(/^Normal\/(\w+)\/Anim\/(\d)\/(\d{4})$/);
      if (match) {
        const [, action, dir, frameIdxStr] = match;
        const mapKey = `${action}/${dir}`;
        const idx = parseInt(frameIdxStr, 10);
        const cur = animFrameCounts.get(mapKey) ?? 0;
        if (idx + 1 > cur) animFrameCounts.set(mapKey, idx + 1);
      }
    }

    // Create walk animations for each direction
    for (let dir = 0; dir < 8; dir++) {
      const walkKey = `Walk/${dir}`;
      const frameCount = animFrameCounts.get(walkKey);
      if (!frameCount) continue;

      scene.anims.create({
        key: `${key}-walk-${PMD_DIRECTIONS[dir]}`,
        frames: scene.anims.generateFrameNames(atlasKey, {
          start: 0,
          end: frameCount - 1,
          zeroPad: 4,
          prefix: `Normal/Walk/Anim/${dir}/`,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // Create idle animation (direction 0 = down)
    const idleCount = animFrameCounts.get("Idle/0");
    if (idleCount) {
      scene.anims.create({
        key: `${key}-idle`,
        frames: scene.anims.generateFrameNames(atlasKey, {
          start: 0,
          end: idleCount - 1,
          zeroPad: 4,
          prefix: `Normal/Idle/Anim/0/`,
        }),
        frameRate: 4,
        repeat: -1,
      });
    } else {
      // Fallback: use first walk frame as idle
      const walkDown = animFrameCounts.get("Walk/0");
      if (walkDown) {
        scene.anims.create({
          key: `${key}-idle`,
          frames: [{ key: atlasKey, frame: "Normal/Walk/Anim/0/0000" }],
          frameRate: 1,
        });
      }
    }

    // Create attack animations for each direction
    for (let dir = 0; dir < 8; dir++) {
      const attackKey = `Attack/${dir}`;
      const frameCount = animFrameCounts.get(attackKey);
      if (!frameCount) continue;

      scene.anims.create({
        key: `${key}-attack-${PMD_DIRECTIONS[dir]}`,
        frames: scene.anims.generateFrameNames(atlasKey, {
          start: 0,
          end: frameCount - 1,
          zeroPad: 4,
          prefix: `Normal/Attack/Anim/${dir}/`,
        }),
        frameRate: 14,
        repeat: 0,
      });
    }

    // Create hurt animation (direction 0 only, play once)
    const hurtCount = animFrameCounts.get("Hurt/0");
    if (hurtCount) {
      scene.anims.create({
        key: `${key}-hurt`,
        frames: scene.anims.generateFrameNames(atlasKey, {
          start: 0,
          end: hurtCount - 1,
          zeroPad: 4,
          prefix: `Normal/Hurt/Anim/0/`,
        }),
        frameRate: 10,
        repeat: 0,
      });
    }
  }
}

/**
 * No-op for backward compatibility — attack anims created in createPmdAnimations.
 */
export function createPmdAttackAnimations(_scene: Phaser.Scene): void {
  // Attack animations are now created in createPmdAnimations()
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
