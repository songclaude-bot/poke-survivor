/**
 * SaveData — Shared save/load + starter definitions.
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
];

export interface SaveData {
  highScore: { kills: number; wave: number; level: number; cycle: number; totalTime?: number };
  unlockedAchievements: string[];
  unlockedStarters: string[];
}

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Migrate: ensure unlockedStarters exists
      if (!data.unlockedStarters) {
        data.unlockedStarters = ["pikachu", "charmander", "squirtle"];
      }
      return data;
    }
  } catch { /* ignore */ }
  return {
    highScore: { kills: 0, wave: 0, level: 0, cycle: 1, totalTime: 0 },
    unlockedAchievements: [],
    unlockedStarters: ["pikachu", "charmander", "squirtle"],
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
