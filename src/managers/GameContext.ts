/**
 * GameContext — shared read/write interface between GameScene and managers.
 * Each manager receives this context to avoid tight coupling to the scene class.
 */
import Phaser from "phaser";
import type {
  AceData, EnemyData, ProjectileData, CompanionData,
  XpGem, ItemDrop, LegionData, LegionEntity, EnemyProjectile,
} from "../data/GameTypes";
import type { SaveData } from "../data/SaveData";
import type { Achievement } from "../data/GameTypes";

export interface GameContext {
  // -- Phaser scene (for add/physics/tweens/time/cameras/textures/anims/input) --
  scene: Phaser.Scene;

  // -- Entity arrays (mutable) --
  ace: AceData;
  enemies: EnemyData[];
  projectiles: ProjectileData[];
  companions: CompanionData[];
  xpGems: XpGem[];
  items: ItemDrop[];
  enemyProjectiles: EnemyProjectile[];
  legionEntities: LegionEntity[];
  legions: LegionData[];

  // -- Phaser groups --
  enemyGroup: Phaser.Physics.Arcade.Group;
  projectileGroup: Phaser.Physics.Arcade.Group;
  xpGemGroup: Phaser.Physics.Arcade.Group;
  itemGroup: Phaser.Physics.Arcade.Group;

  // -- Game state --
  xp: number;
  level: number;
  xpToNext: number;
  kills: number;
  killStreak: number;
  lastKillTime: number;
  cycleTimer: number;
  spawnTimer: number;
  isPaused: boolean;
  pendingLevelUp: boolean;
  totalSurvivalTime: number;
  cycleNumber: number;
  starterKey: string;

  // -- Wave system --
  waveNumber: number;
  waveTimer: number;
  waveRestTimer: number;
  waveEnemiesRemaining: number;
  inWaveRest: boolean;

  // -- Boss --
  boss: EnemyData | null;
  bossSpawned: boolean;
  bossWarningShown: boolean;

  // -- Dodge --
  isDodging: boolean;
  dodgeTimer: number;
  dodgeCooldown: number;

  // -- Evolution --
  aceEvoStage: number;
  companionEvoStages: Map<string, number>;

  // -- Combat perks --
  critChance: number;
  lifestealRate: number;
  xpMagnetRange: number;

  // -- Skill --
  skillId: string;
  skillTimer: number;
  flashFireStacks: number;
  speedBoostStacks: number;
  unburdenTimer: number;
  sturdyAvailable: boolean;
  phaseTimer: number;
  adaptabilityMult: number;

  // -- Save --
  saveData: SaveData;
  achievementQueue: Achievement[];
  showingAchievement: boolean;

  // -- UI handles --
  hpBar: Phaser.GameObjects.Graphics;
  xpBar: Phaser.GameObjects.Graphics;
  timerText: Phaser.GameObjects.Text;
  killText: Phaser.GameObjects.Text;
  levelText: Phaser.GameObjects.Text;
  cycleText: Phaser.GameObjects.Text;
  waveText: Phaser.GameObjects.Text;
  bossHpBar: Phaser.GameObjects.Graphics;
  bossNameText: Phaser.GameObjects.Text;
  minimapGfx: Phaser.GameObjects.Graphics;
  aimGfx: Phaser.GameObjects.Graphics;
  dangerVignette: Phaser.GameObjects.Graphics;
  levelUpContainer: Phaser.GameObjects.Container;
  pauseContainer: Phaser.GameObjects.Container;

  // -- Joystick --
  joyBase: Phaser.GameObjects.Sprite;
  joyThumb: Phaser.GameObjects.Sprite;
  joyPointer: Phaser.Input.Pointer | null;
  joyVector: Phaser.Math.Vector2;

  // -- Damage popup pool --
  dmgPopups: Phaser.GameObjects.Text[];

  // -- Callbacks (methods on GameScene the managers may invoke) --
  onEnemyDeath: (enemy: EnemyData) => void;
  damageAce: (amount: number) => void;
  fireProjectile: (fromX: number, fromY: number, toX: number, toY: number, damage: number) => void;
  findNearestEnemy: (x: number, y: number, range: number) => EnemyData | null;
  showDamagePopup: (x: number, y: number, amount: number | string, color?: string) => void;
  collectXpGem: (gem: XpGem) => void;
}
