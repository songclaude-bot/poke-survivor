import Phaser from "phaser";

// === Core Data Types ===

export interface AceData {
  sprite: Phaser.Physics.Arcade.Sprite;
  pokemonKey: string;
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
}

export type EnemyBehavior = "chase" | "circle" | "charge" | "swarm" | "ranged";

export interface EnemyData {
  sprite: Phaser.Physics.Arcade.Sprite;
  pokemonKey: string;
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  hpBar: Phaser.GameObjects.Graphics;
  behavior: EnemyBehavior;
  orbitAngle?: number;
  chargeTimer?: number;
  isCharging?: boolean;
  isElite?: boolean;
  isMini?: boolean;
  lastRangedAttack?: number;
}

export interface ProjectileData {
  sprite: Phaser.Physics.Arcade.Sprite;
  damage: number;
  pierce: number;
}

export interface CompanionData {
  sprite: Phaser.Physics.Arcade.Sprite;
  atk: number;
  attackCooldown: number;
  lastAttackTime: number;
  attackRange: number;
  orbitAngle: number;
  type: "projectile" | "orbital" | "area";
  level: number;
}

export interface XpGem {
  sprite: Phaser.Physics.Arcade.Sprite;
  value: number;
  magnetized?: boolean;
}

export type ItemType = "heal" | "bomb" | "magnet";

export interface ItemDrop {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: ItemType;
  ttl: number;
}

export interface LegionData {
  ace: string;
  companions: string[];
  dps: number;
  color: number;
}

export interface LegionEntity {
  data: LegionData;
  gfx: Phaser.GameObjects.Graphics;
  orbitAngle: number;
  orbitDist: number;
  lastAttackTime: number;
  attackInterval: number;
  attackRange: number;
}

export interface CyclePassData {
  cycleNumber?: number;
  legions?: LegionData[];
  starterKey?: string;
  totalTime?: number;
}

export interface EvolutionStage {
  name: string;
  spriteKey: string;
  atkMult: number;
  hpMult: number;
  speedMult: number;
  scale: number;
}

export interface EnemyProjectile {
  sprite: Phaser.GameObjects.Sprite;
  vx: number;
  vy: number;
  damage: number;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  check: (stats: GameStats) => boolean;
}

// Game state snapshot for read-only access by managers
export interface GameStats {
  kills: number;
  waveNumber: number;
  level: number;
  aceEvoStage: number;
  partySize: number;
  cycleNumber: number;
  killStreak: number;
}

// Skill effect state
export interface SkillState {
  skillId: string;
  skillTimer: number;
  flashFireStacks: number;
  speedBoostStacks: number;
  unburdenTimer: number;
  sturdyAvailable: boolean;
  phaseTimer: number;
  adaptabilityMult: number;
}

export type CompanionPoolEntry = { key: string; type: "projectile" | "orbital" | "area" };
