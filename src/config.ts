/** Game-wide constants */
export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;

/** 5-minute cycle */
export const CYCLE_DURATION_SEC = 300;

/** Party */
export const MAX_COMPANIONS = 5;
export const MAX_LEGIONS = 99;

/** Combat */
export const MAX_ENEMIES = 80;
export const MAX_PROJECTILES = 50;
export const XP_PER_LEVEL_BASE = 20;
export const XP_LEVEL_SCALE = 1.35;

/** Colors */
export const COLORS = {
  bg: 0x0a0a0f,
  text: 0xe0e0e0,
  textDim: 0x666680,
  accent1: 0xf43f5e,
  accent2: 0x667eea,
  accent3: 0xf093fb,
  gold: 0xfbbf24,
  hpGreen: 0x3bc95e,
  hpRed: 0xe53b3b,
  xpBlue: 0x667eea,
} as const;
