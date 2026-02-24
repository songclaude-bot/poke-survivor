/**
 * SaveData — Shared save/load + starter definitions + skill system.
 */

const STORAGE_KEY = "poke-survivor-data";

export interface StarterDef {
  key: string;
  name: string;
  color: string;
  hp: number;
  atk: number;
  speed: number;
  range: number;
  cooldown: number;
  /** How to unlock — shown in lock screen. null = available from start */
  unlockCondition: string | null;
  /** Achievement id required to unlock. null = available from start */
  unlockAchievement: string | null;
}

export const ALL_STARTERS: StarterDef[] = [
  // Gen 1 — available from start
  { key: "pikachu",    name: "Pikachu",    color: "#fbbf24", hp: 100, atk: 10, speed: 160, range: 120, cooldown: 800, unlockCondition: null, unlockAchievement: null },
  { key: "charmander", name: "Charmander", color: "#f43f5e", hp: 80,  atk: 14, speed: 160, range: 130, cooldown: 700, unlockCondition: null, unlockAchievement: null },
  { key: "squirtle",   name: "Squirtle",   color: "#38bdf8", hp: 130, atk: 8,  speed: 150, range: 110, cooldown: 900, unlockCondition: null, unlockAchievement: null },
  // Gen 1 — unlock
  { key: "bulbasaur",  name: "Bulbasaur",  color: "#4ade80", hp: 110, atk: 9,  speed: 155, range: 115, cooldown: 850, unlockCondition: "Reach Wave 5", unlockAchievement: "wave_5" },
  { key: "gastly",     name: "Gastly",     color: "#a78bfa", hp: 70,  atk: 16, speed: 170, range: 140, cooldown: 600, unlockCondition: "Defeat 200 enemies", unlockAchievement: "kill_200" },
  { key: "geodude",    name: "Geodude",    color: "#a8a29e", hp: 160, atk: 7,  speed: 130, range: 100, cooldown: 1000, unlockCondition: "Reach Cycle 2", unlockAchievement: "cycle_2" },
  { key: "eevee",      name: "Eevee",      color: "#d4a574", hp: 90,  atk: 11, speed: 165, range: 125, cooldown: 750, unlockCondition: "Defeat 500 enemies", unlockAchievement: "kill_500" },
  // Gen 2
  { key: "chikorita",  name: "Chikorita",  color: "#86efac", hp: 120, atk: 8,  speed: 150, range: 110, cooldown: 900, unlockCondition: "Reach Wave 8", unlockAchievement: "wave_8" },
  { key: "cyndaquil",  name: "Cyndaquil",  color: "#fb923c", hp: 85,  atk: 13, speed: 165, range: 135, cooldown: 650, unlockCondition: "Reach Cycle 3", unlockAchievement: "cycle_3" },
  { key: "totodile",   name: "Totodile",   color: "#22d3ee", hp: 105, atk: 12, speed: 155, range: 120, cooldown: 780, unlockCondition: "Survive 10 minutes", unlockAchievement: "time_600" },
  // Gen 3
  { key: "treecko",    name: "Treecko",    color: "#22c55e", hp: 85,  atk: 11, speed: 175, range: 130, cooldown: 700, unlockCondition: "Defeat 1000 enemies", unlockAchievement: "kill_1000" },
  { key: "torchic",    name: "Torchic",    color: "#ef4444", hp: 75,  atk: 15, speed: 160, range: 125, cooldown: 650, unlockCondition: "Reach Cycle 4", unlockAchievement: "cycle_4" },
  { key: "mudkip",     name: "Mudkip",     color: "#60a5fa", hp: 115, atk: 10, speed: 150, range: 115, cooldown: 850, unlockCondition: "Reach Wave 10", unlockAchievement: "wave_10" },
  // Gen 4
  { key: "riolu",      name: "Riolu",      color: "#6366f1", hp: 95,  atk: 13, speed: 170, range: 110, cooldown: 700, unlockCondition: "Reach Cycle 5", unlockAchievement: "cycle_5" },
  // Easter egg — Machop line (unlocked via lobby easter egg)
  { key: "machop",     name: "Machop",     color: "#ff6b35", hp: 120, atk: 15, speed: 145, range: 80,  cooldown: 650, unlockCondition: "Hidden Easter Egg", unlockAchievement: "machop_egg" },
];

// ================================================================
// STARTER SKILLS — Unique passive abilities per starter
// ================================================================

export interface StarterSkill {
  name: string;
  desc: string;
  /** Skill effect ID — applied in GameScene */
  effectId: string;
}

/** Each starter's unique passive skill */
export const STARTER_SKILLS: Record<string, StarterSkill> = {
  pikachu: {
    name: "Static",
    desc: "10% chance to paralyze (slow) enemies on hit",
    effectId: "static",
  },
  charmander: {
    name: "Blaze",
    desc: "ATK +30% when HP below 30%",
    effectId: "blaze",
  },
  squirtle: {
    name: "Torrent",
    desc: "Damage taken -25% when HP above 70%",
    effectId: "torrent",
  },
  bulbasaur: {
    name: "Overgrow",
    desc: "Regenerate 1% max HP every 3 seconds",
    effectId: "overgrow",
  },
  gastly: {
    name: "Levitate",
    desc: "Phase through enemies for 1s after taking damage",
    effectId: "levitate",
  },
  geodude: {
    name: "Sturdy",
    desc: "Survive one fatal hit per wave (HP → 1)",
    effectId: "sturdy",
  },
  eevee: {
    name: "Adaptability",
    desc: "Stat boosts from level-ups are 20% stronger",
    effectId: "adaptability",
  },
  chikorita: {
    name: "Leaf Guard",
    desc: "Allies in range take 15% less damage",
    effectId: "leaf_guard",
  },
  cyndaquil: {
    name: "Flash Fire",
    desc: "Each kill grants +1% ATK (stacks up to 30%)",
    effectId: "flash_fire",
  },
  totodile: {
    name: "Sheer Force",
    desc: "Projectiles pierce through 1 extra enemy",
    effectId: "sheer_force",
  },
  treecko: {
    name: "Unburden",
    desc: "Speed +50% for 3s after defeating an enemy",
    effectId: "unburden",
  },
  torchic: {
    name: "Speed Boost",
    desc: "Attack speed increases by 5% every 30 seconds",
    effectId: "speed_boost",
  },
  mudkip: {
    name: "Damp",
    desc: "Enemies near you are slowed by 20%",
    effectId: "damp",
  },
  riolu: {
    name: "Inner Focus",
    desc: "Critical hits deal 3x damage instead of 2x",
    effectId: "inner_focus",
  },
  machop: {
    name: "Guts",
    desc: "ATK +50% but -20% speed. Melee range hits all nearby enemies",
    effectId: "guts",
  },
};

// ================================================================
// SAVE DATA
// ================================================================

export interface SaveData {
  highScore: { kills: number; wave: number; level: number; cycle: number; totalTime?: number };
  unlockedAchievements: string[];
  unlockedStarters: string[];
  /** Coins earned from runs */
  coins: number;
}

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Migrate: ensure fields exist
      if (!data.unlockedStarters) {
        data.unlockedStarters = ["pikachu", "charmander", "squirtle"];
      }
      if (data.coins === undefined) data.coins = 0;
      return data;
    }
  } catch { /* ignore */ }
  return {
    highScore: { kills: 0, wave: 0, level: 0, cycle: 1, totalTime: 0 },
    unlockedAchievements: [],
    unlockedStarters: ["pikachu", "charmander", "squirtle"],
    coins: 0,
  };
}

export function saveSaveData(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function isStarterUnlocked(key: string, data: SaveData): boolean {
  const def = ALL_STARTERS.find(s => s.key === key);
  if (!def) return false;
  if (!def.unlockAchievement) return true; // default starters
  return data.unlockedStarters.includes(key) || data.unlockedAchievements.includes(def.unlockAchievement);
}

/** Check and unlock starters based on achievements */
export function checkStarterUnlocks(data: SaveData): boolean {
  let changed = false;
  for (const starter of ALL_STARTERS) {
    if (!starter.unlockAchievement) continue;
    if (data.unlockedStarters.includes(starter.key)) continue;
    if (data.unlockedAchievements.includes(starter.unlockAchievement)) {
      data.unlockedStarters.push(starter.key);
      changed = true;
    }
  }
  return changed;
}
