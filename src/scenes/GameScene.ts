import Phaser from "phaser";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  CYCLE_DURATION_SEC,
  MAX_ENEMIES,
  MAX_PROJECTILES,
  XP_PER_LEVEL_BASE,
  XP_LEVEL_SCALE,
  COLORS,
} from "../config";
import {
  POKEMON_SPRITES,
  getDirectionFromVelocity,
} from "../sprites/PmdSpriteLoader";
import { sfx } from "../audio/SfxManager";

/* ================================================================
   GameScene — Core prototype
   Implements: movement, joystick, enemies, auto-attack, XP, level-up
   ================================================================ */

// -- Tiny data types ------------------------------------------

interface AceData {
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

type EnemyBehavior = "chase" | "circle" | "charge" | "swarm";

interface EnemyData {
  sprite: Phaser.Physics.Arcade.Sprite;
  pokemonKey: string;
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  hpBar: Phaser.GameObjects.Graphics;
  behavior: EnemyBehavior;
  /** For circle behavior: orbit angle */
  orbitAngle?: number;
  /** For charge behavior: charge cooldown timer */
  chargeTimer?: number;
  /** For charge behavior: is currently charging */
  isCharging?: boolean;
  /** Elite enemy flag */
  isElite?: boolean;
}

interface ProjectileData {
  sprite: Phaser.Physics.Arcade.Sprite;
  damage: number;
  pierce: number;
}

interface CompanionData {
  sprite: Phaser.Physics.Arcade.Sprite;
  atk: number;
  attackCooldown: number;
  lastAttackTime: number;
  attackRange: number;
  orbitAngle: number;
  type: "projectile" | "orbital" | "area";
  level: number;
}

interface XpGem {
  sprite: Phaser.Physics.Arcade.Sprite;
  value: number;
}

type ItemType = "heal" | "bomb" | "magnet";

interface ItemDrop {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: ItemType;
  /** Remaining lifetime in ms before despawn */
  ttl: number;
}

interface LegionData {
  ace: string;
  companions: string[];
  dps: number;
  color: number;
}

/** Runtime representation of a legion following the player */
interface LegionEntity {
  data: LegionData;
  gfx: Phaser.GameObjects.Graphics;
  orbitAngle: number;
  orbitDist: number;
  lastAttackTime: number;
  attackInterval: number;
  attackRange: number;
}

interface CyclePassData {
  cycleNumber?: number;
  legions?: LegionData[];
  starterKey?: string;
  totalTime?: number;
}

// -- Evolution data --
interface EvolutionStage {
  name: string;
  atkMult: number;
  hpMult: number;
  speedMult: number;
  scale: number;
}

const EVOLUTION_CHAINS: Record<string, EvolutionStage[]> = {
  pikachu: [
    { name: "Pikachu", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.5 },
    { name: "Raichu ★", atkMult: 1.5, hpMult: 1.3, speedMult: 1.15, scale: 1.7 },
    { name: "Raichu GX ★★", atkMult: 2.2, hpMult: 1.8, speedMult: 1.3, scale: 1.9 },
  ],
  squirtle: [
    { name: "Squirtle", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Wartortle ★", atkMult: 1.5, hpMult: 1.4, speedMult: 1.1, scale: 1.4 },
  ],
  charmander: [
    { name: "Charmander", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Charmeleon ★", atkMult: 1.6, hpMult: 1.3, speedMult: 1.15, scale: 1.4 },
  ],
  bulbasaur: [
    { name: "Bulbasaur", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Ivysaur ★", atkMult: 1.4, hpMult: 1.5, speedMult: 1.1, scale: 1.4 },
  ],
  gastly: [
    { name: "Gastly", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Haunter ★", atkMult: 1.7, hpMult: 1.2, speedMult: 1.2, scale: 1.4 },
  ],
  geodude: [
    { name: "Geodude", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Graveler ★", atkMult: 1.4, hpMult: 1.6, speedMult: 1.0, scale: 1.5 },
  ],
};

// =================================================================

// -- Achievement definitions --
interface Achievement {
  id: string;
  name: string;
  desc: string;
  check: (s: GameScene) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "first_kill", name: "First Blood", desc: "Defeat your first enemy", check: s => s.getKills() >= 1 },
  { id: "kill_50", name: "Hunter", desc: "Defeat 50 enemies", check: s => s.getKills() >= 50 },
  { id: "kill_200", name: "Slayer", desc: "Defeat 200 enemies", check: s => s.getKills() >= 200 },
  { id: "kill_500", name: "Exterminator", desc: "Defeat 500 enemies", check: s => s.getKills() >= 500 },
  { id: "wave_5", name: "Survivor", desc: "Reach Wave 5", check: s => s.getWave() >= 5 },
  { id: "wave_10", name: "Veteran", desc: "Reach Wave 10", check: s => s.getWave() >= 10 },
  { id: "wave_20", name: "Elite", desc: "Reach Wave 20", check: s => s.getWave() >= 20 },
  { id: "level_5", name: "Growing", desc: "Reach Level 5", check: s => s.getLevel() >= 5 },
  { id: "level_10", name: "Experienced", desc: "Reach Level 10", check: s => s.getLevel() >= 10 },
  { id: "evolve", name: "Evolution!", desc: "Evolve your ace Pokemon", check: s => s.getEvoStage() >= 1 },
  { id: "full_party", name: "Squad Goals", desc: "Have 5 companions", check: s => s.getPartySize() >= 6 },
  { id: "cycle_2", name: "New Game+", desc: "Reach Cycle 2", check: s => s.getCycle() >= 2 },
  { id: "streak_15", name: "Combo Master", desc: "Get a 15 kill streak", check: s => s.getStreak() >= 15 },
];

// -- High score storage --
const STORAGE_KEY = "poke-survivor-data";

interface SaveData {
  highScore: { kills: number; wave: number; level: number; cycle: number; totalTime?: number };
  unlockedAchievements: string[];
}

function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { highScore: { kills: 0, wave: 0, level: 0, cycle: 1, totalTime: 0 }, unlockedAchievements: [] };
}

function saveSaveData(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export class GameScene extends Phaser.Scene {
  // -- Core groups --
  private ace!: AceData;
  private enemies: EnemyData[] = [];
  private projectiles: ProjectileData[] = [];
  private companions: CompanionData[] = [];
  private xpGems: XpGem[] = [];
  private items: ItemDrop[] = [];

  // -- Phaser groups for collision --
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private projectileGroup!: Phaser.Physics.Arcade.Group;
  private xpGemGroup!: Phaser.Physics.Arcade.Group;
  private itemGroup!: Phaser.Physics.Arcade.Group;

  // -- Joystick state --
  private joyBase!: Phaser.GameObjects.Sprite;
  private joyThumb!: Phaser.GameObjects.Sprite;
  private joyPointer: Phaser.Input.Pointer | null = null;
  private joyVector = new Phaser.Math.Vector2(0, 0);

  // -- Boss --
  private boss: EnemyData | null = null;
  private bossHpBar!: Phaser.GameObjects.Graphics;
  private bossNameText!: Phaser.GameObjects.Text;
  private bossSpawned = false;
  private bossWarningShown = false;

  // -- Cycle / Legion --
  private cycleNumber = 1;
  private legions: LegionData[] = [];
  private legionEntities: LegionEntity[] = [];

  // -- Level-up selection --
  private levelUpContainer!: Phaser.GameObjects.Container;
  private pendingLevelUp = false;

  // -- Game state --
  private xp = 0;
  private level = 1;
  private xpToNext = XP_PER_LEVEL_BASE;
  private kills = 0;
  private cycleTimer = CYCLE_DURATION_SEC;
  private spawnTimer = 0;
  private isPaused = false;
  private killStreak = 0;
  private lastKillTime = 0;
  private totalSurvivalTime = 0; // Total time across all cycles

  // -- Evolution --
  private aceEvoStage = 0;

  // -- Combat perks --
  private critChance = 0;       // 0-1, chance of 2x damage
  private lifestealRate = 0;    // 0-1, fraction of damage healed
  private xpMagnetRange = 60;   // Base XP gem pickup range
  private companionEvoStages: Map<string, number> = new Map();

  // -- Wave system --
  private waveNumber = 0;
  private waveTimer = 0;
  private waveRestTimer = 0;       // Rest period between waves
  private waveEnemiesRemaining = 0; // Enemies left in current wave
  private inWaveRest = false;

  // -- UI --
  private hpBar!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;
  private timerText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private cycleText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;

  // -- Damage popup pool --
  private dmgPopups: Phaser.GameObjects.Text[] = [];

  // -- Pause menu --
  private pauseContainer!: Phaser.GameObjects.Container;
  private manualPause = false;

  // -- Danger vignette --
  private dangerVignette!: Phaser.GameObjects.Graphics;

  // -- Achievements --
  private saveData: SaveData = loadSaveData();
  private achievementQueue: Achievement[] = [];
  private showingAchievement = false;

  // -- Minimap + aim indicator --
  private minimapGfx!: Phaser.GameObjects.Graphics;
  private aimGfx!: Phaser.GameObjects.Graphics;

  // -- World camera offset (infinite map illusion) --
  private worldOffset = new Phaser.Math.Vector2(0, 0);

  // -- Stars background --
  private stars: { x: number; y: number; alpha: number; speed: number }[] = [];
  private starGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: "GameScene" });
  }

  private starterKey = "pikachu";

  init(data?: CyclePassData): void {
    if (data?.cycleNumber) this.cycleNumber = data.cycleNumber;
    if (data?.legions) this.legions = [...data.legions];
    if (data?.starterKey) this.starterKey = data.starterKey;
    if (data?.totalTime) this.totalSurvivalTime = data.totalTime;
  }

  create(): void {
    this.resetState();
    this.createStarfield();
    this.createAce();
    this.createLegions();
    this.createUI();
    this.createJoystick();
    this.createPhysicsGroups();
    this.setupCollisions();
    this.createDangerVignette();
    sfx.startBgm();

    // Fade in from black
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  // ================================================================
  // SETUP
  // ================================================================

  private resetState(): void {
    this.enemies = [];
    this.projectiles = [];
    this.companions = [];
    this.xpGems = [];
    this.items = [];
    this.xp = 0;
    this.level = 1;
    this.xpToNext = XP_PER_LEVEL_BASE;
    this.kills = 0;
    this.killStreak = 0;
    this.lastKillTime = 0;
    this.cycleTimer = CYCLE_DURATION_SEC;
    this.spawnTimer = 0;
    this.isPaused = false;
    this.pendingLevelUp = false;
    this.aceEvoStage = 0;
    this.companionEvoStages = new Map();
    this.waveNumber = 0;
    this.waveTimer = 0;
    this.waveRestTimer = 0;
    this.waveEnemiesRemaining = 0;
    this.inWaveRest = false;
    this.boss = null;
    this.bossSpawned = false;
    this.bossWarningShown = false;
    this.worldOffset.set(0, 0);
    this.legionEntities = [];
    // Note: cycleNumber and legions are preserved via init()
  }

  private createStarfield(): void {
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        alpha: Math.random() * 0.6 + 0.1,
        speed: Math.random() * 0.3 + 0.05,
      });
    }
    this.starGfx = this.add.graphics().setDepth(-10);
  }

  /** Starter base stats per pokemon */
  private static readonly STARTER_STATS: Record<string, { hp: number; atk: number; speed: number; range: number; cooldown: number }> = {
    pikachu:    { hp: 100, atk: 10, speed: 160, range: 120, cooldown: 800 },
    charmander: { hp: 80,  atk: 14, speed: 160, range: 130, cooldown: 700 },
    squirtle:   { hp: 130, atk: 8,  speed: 150, range: 110, cooldown: 900 },
  };

  private createAce(): void {
    const aceKey = this.starterKey;
    const texKey = `pmd-${aceKey}`;
    const usePmd = this.textures.exists(texKey);
    const sprite = this.physics.add.sprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      usePmd ? texKey : "ace",
    );
    sprite.setDepth(10);
    sprite.setCollideWorldBounds(false);

    if (usePmd) {
      sprite.play(`${aceKey}-walk-down`);
      sprite.setScale(1.5);
    }

    const base = GameScene.STARTER_STATS[aceKey] ?? GameScene.STARTER_STATS.pikachu;
    const cycleMult = 1 + (this.cycleNumber - 1) * 0.15;
    this.ace = {
      sprite,
      pokemonKey: aceKey,
      hp: Math.floor(base.hp * cycleMult),
      maxHp: Math.floor(base.hp * cycleMult),
      atk: Math.floor(base.atk * cycleMult),
      speed: base.speed + (this.cycleNumber - 1) * 5,
      attackRange: base.range + (this.cycleNumber - 1) * 5,
      attackCooldown: Math.max(400, base.cooldown - (this.cycleNumber - 1) * 30),
      lastAttackTime: 0,
    };
  }

  private createLegions(): void {
    // Spawn visual representations of past legions
    this.legionEntities = [];
    for (let i = 0; i < this.legions.length; i++) {
      const legion = this.legions[i];
      const gfx = this.add.graphics().setDepth(4);

      // LOD: first 3 legions get detailed rendering, rest are simpler
      const entity: LegionEntity = {
        data: legion,
        gfx,
        orbitAngle: (i * Math.PI * 2) / Math.max(this.legions.length, 1),
        orbitDist: 70 + i * 20,
        lastAttackTime: 0,
        // Attack faster for higher DPS legions
        attackInterval: Math.max(500, 2000 - legion.dps * 20),
        attackRange: 100 + Math.min(legion.dps, 50),
      };
      this.legionEntities.push(entity);
    }
  }

  private createUI(): void {
    // HP bar background + fill
    this.hpBar = this.add.graphics().setDepth(100).setScrollFactor(0);

    // XP bar
    this.xpBar = this.add.graphics().setDepth(100).setScrollFactor(0);

    // Timer
    this.timerText = this.add
      .text(GAME_WIDTH / 2, 8, "5:00", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#e0e0e0",
      })
      .setOrigin(0.5, 0)
      .setDepth(100)
      .setScrollFactor(0);

    // Kill count
    this.killText = this.add
      .text(GAME_WIDTH - 8, GAME_HEIGHT - 12, "Kill: 0", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#888",
      })
      .setOrigin(1, 1)
      .setDepth(100)
      .setScrollFactor(0);

    // Level
    this.levelText = this.add
      .text(8, 28, "Lv.1", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#667eea",
      })
      .setOrigin(0, 0)
      .setDepth(100)
      .setScrollFactor(0);

    // Cycle info (top right)
    this.cycleText = this.add
      .text(GAME_WIDTH - 8, 8, `Cycle ${this.cycleNumber}`, {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#fbbf24",
      })
      .setOrigin(1, 0)
      .setDepth(100)
      .setScrollFactor(0);

    // Wave info (below cycle)
    this.waveText = this.add
      .text(GAME_WIDTH - 8, 24, "", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#a78bfa",
      })
      .setOrigin(1, 0)
      .setDepth(100)
      .setScrollFactor(0);

    // Boss HP bar (hidden until boss spawns)
    this.bossHpBar = this.add.graphics().setDepth(100).setScrollFactor(0).setVisible(false);
    this.bossNameText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 40, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#ff00ff",
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setScrollFactor(0)
      .setVisible(false);

    // Minimap
    this.minimapGfx = this.add.graphics().setDepth(99).setScrollFactor(0);

    // Aim indicator (world-space, follows camera)
    this.aimGfx = this.add.graphics().setDepth(8);

    // Pause button (top-left area, below HP bar)
    const pauseBtn = this.add
      .text(GAME_WIDTH - 36, 44, "❚❚", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#888",
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    pauseBtn.on("pointerdown", () => this.togglePause());

    // Pause menu container (hidden)
    this.pauseContainer = this.add.container(0, 0).setDepth(600).setScrollFactor(0).setVisible(false);

    // Level-up selection container (hidden)
    this.levelUpContainer = this.add.container(0, 0).setDepth(500).setScrollFactor(0).setVisible(false);
  }

  private togglePause(): void {
    if (this.pendingLevelUp) return; // Don't pause during level-up

    if (this.manualPause) {
      this.resumeGame();
    } else {
      this.showPauseMenu();
    }
  }

  private showPauseMenu(): void {
    this.manualPause = true;
    this.isPaused = true;
    this.pauseContainer.removeAll(true);
    this.pauseContainer.setVisible(true);

    // Overlay
    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8)
      .setScrollFactor(0);
    this.pauseContainer.add(overlay);

    // PAUSED title
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, "PAUSED", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#667eea",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.pauseContainer.add(title);

    // Resume button
    const resumeBtn = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "[ Resume ]", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#3bc95e",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    resumeBtn.on("pointerdown", () => this.resumeGame());
    resumeBtn.on("pointerover", () => resumeBtn.setColor("#4ade80"));
    resumeBtn.on("pointerout", () => resumeBtn.setColor("#3bc95e"));
    this.pauseContainer.add(resumeBtn);

    // Volume controls
    const volLabel = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, "Volume", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#888",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.pauseContainer.add(volLabel);

    const volDown = this.add
      .text(GAME_WIDTH / 2 - 60, GAME_HEIGHT / 2 + 80, "[ - ]", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fbbf24",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    volDown.on("pointerdown", () => sfx.adjustVolume(-0.1));
    this.pauseContainer.add(volDown);

    const volUp = this.add
      .text(GAME_WIDTH / 2 + 60, GAME_HEIGHT / 2 + 80, "[ + ]", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fbbf24",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    volUp.on("pointerdown", () => sfx.adjustVolume(0.1));
    this.pauseContainer.add(volUp);

    // Main menu button
    const menuBtn = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130, "[ Main Menu ]", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#f43f5e",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    menuBtn.on("pointerdown", () => {
      sfx.stopBgm();
      this.scene.start("TitleScene");
    });
    menuBtn.on("pointerover", () => menuBtn.setColor("#ff6b6b"));
    menuBtn.on("pointerout", () => menuBtn.setColor("#f43f5e"));
    this.pauseContainer.add(menuBtn);
  }

  private resumeGame(): void {
    this.manualPause = false;
    this.isPaused = false;
    this.pauseContainer.setVisible(false);
    this.pauseContainer.removeAll(true);
  }

  private createDangerVignette(): void {
    // Red vignette overlay that appears when HP is low
    this.dangerVignette = this.add.graphics().setDepth(95).setScrollFactor(0);
    this.dangerVignette.setAlpha(0);
  }

  private updateDangerVignette(): void {
    const hpRatio = this.ace.hp / this.ace.maxHp;
    if (hpRatio < 0.3) {
      // Pulsing red vignette
      const pulse = Math.sin(this.time.now * 0.005) * 0.15 + 0.2;
      const intensity = (1 - hpRatio / 0.3) * pulse;
      this.dangerVignette.clear();
      this.dangerVignette.fillStyle(0xff0000, intensity);
      // Draw border rectangles (top, bottom, left, right)
      this.dangerVignette.fillRect(0, 0, GAME_WIDTH, 40);
      this.dangerVignette.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);
      this.dangerVignette.fillRect(0, 0, 30, GAME_HEIGHT);
      this.dangerVignette.fillRect(GAME_WIDTH - 30, 0, 30, GAME_HEIGHT);
      this.dangerVignette.setAlpha(1);
    } else {
      this.dangerVignette.clear();
    }
  }

  private createJoystick(): void {
    const jx = 80;
    const jy = GAME_HEIGHT - 100;

    this.joyBase = this.add
      .sprite(jx, jy, "joy-base")
      .setDepth(90)
      .setScrollFactor(0)
      .setAlpha(0.5);

    this.joyThumb = this.add
      .sprite(jx, jy, "joy-thumb")
      .setDepth(91)
      .setScrollFactor(0);

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.isPaused) return;
      // Only use left half for joystick
      if (p.x < GAME_WIDTH * 0.6) {
        this.joyPointer = p;
        this.joyBase.setPosition(p.x, p.y).setAlpha(0.5);
        this.joyThumb.setPosition(p.x, p.y);
      }
    });

    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p !== this.joyPointer) return;
      this.updateJoystick(p);
    });

    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (p === this.joyPointer) {
        this.joyPointer = null;
        this.joyVector.set(0, 0);
        this.joyThumb.setPosition(this.joyBase.x, this.joyBase.y);
        this.joyBase.setAlpha(0.3);
      }
    });
  }

  private updateJoystick(p: Phaser.Input.Pointer): void {
    const maxDist = 40;
    const dx = p.x - this.joyBase.x;
    const dy = p.y - this.joyBase.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);

    this.joyThumb.setPosition(
      this.joyBase.x + Math.cos(angle) * clampedDist,
      this.joyBase.y + Math.sin(angle) * clampedDist,
    );

    const strength = clampedDist / maxDist;
    this.joyVector.set(Math.cos(angle) * strength, Math.sin(angle) * strength);
  }

  private createPhysicsGroups(): void {
    this.enemyGroup = this.physics.add.group({ runChildUpdate: false });
    this.projectileGroup = this.physics.add.group({ runChildUpdate: false });
    this.xpGemGroup = this.physics.add.group({ runChildUpdate: false });
    this.itemGroup = this.physics.add.group({ runChildUpdate: false });
  }

  private setupCollisions(): void {
    // Projectile hits enemy
    this.physics.add.overlap(
      this.projectileGroup,
      this.enemyGroup,
      (projObj, enemyObj) => {
        const proj = this.projectiles.find(
          (p) => p.sprite === projObj,
        );
        const enemy = this.enemies.find((e) => e.sprite === enemyObj);
        if (proj && enemy) this.onProjectileHitEnemy(proj, enemy);
      },
    );

    // Player picks up XP gems (large pickup radius)
    this.physics.add.overlap(
      this.ace.sprite,
      this.xpGemGroup,
      (_aceObj, gemObj) => {
        const gem = this.xpGems.find((g) => g.sprite === gemObj);
        if (gem) this.collectXpGem(gem);
      },
    );
  }

  // ================================================================
  // UPDATE LOOP
  // ================================================================

  update(_time: number, delta: number): void {
    if (this.isPaused) return;

    const dt = delta / 1000;

    this.updateTimer(dt);
    this.updateAceMovement(dt);
    this.updateStarfield(dt);
    this.updateEnemySpawning(dt);
    this.updateEnemies(dt);
    this.updateAceAutoAttack();
    this.updateCompanions(dt);
    this.updateLegions(dt);
    this.updateProjectiles(dt);
    this.updateXpGemMagnet();
    this.updateItems(dt);
    this.updateKillStreak();
    this.checkAchievements();
    this.updateDangerVignette();
    this.drawUI();
  }

  // ================================================================
  // TIMER
  // ================================================================

  private updateTimer(dt: number): void {
    this.cycleTimer -= dt;
    if (this.cycleTimer <= 0) this.cycleTimer = 0;
    this.totalSurvivalTime += dt;

    const elapsed = CYCLE_DURATION_SEC - this.cycleTimer;

    // Boss warning at 3:00 (180s elapsed)
    if (elapsed >= 180 && !this.bossWarningShown) {
      this.bossWarningShown = true;
      sfx.playBossWarning();
      this.showWarning("WARNING!");
    }

    // Boss spawn at 4:00 (240s elapsed)
    if (elapsed >= 240 && !this.bossSpawned) {
      this.bossSpawned = true;
      this.spawnBoss();
    }

    // Time's up without killing boss
    if (this.cycleTimer <= 0 && this.boss) {
      this.onAceDeath();
    }

    const min = Math.floor(this.cycleTimer / 60);
    const sec = Math.floor(this.cycleTimer % 60);
    const color = this.cycleTimer <= 60 ? "#f43f5e" : "#e0e0e0";
    this.timerText.setText(`${min}:${sec.toString().padStart(2, "0")}`).setColor(color);
  }

  // ================================================================
  // MOVEMENT
  // ================================================================

  private updateAceMovement(_dt: number): void {
    const vx = this.joyVector.x * this.ace.speed;
    const vy = this.joyVector.y * this.ace.speed;

    this.ace.sprite.setVelocity(vx, vy);

    // Update walk animation direction for PMD sprites
    if (this.textures.exists(`pmd-${this.ace.pokemonKey}`)) {
      if (Math.abs(vx) > 1 || Math.abs(vy) > 1) {
        const dir = getDirectionFromVelocity(vx, vy);
        const animKey = `${this.ace.pokemonKey}-walk-${dir}`;
        if (this.ace.sprite.anims.currentAnim?.key !== animKey) {
          this.ace.sprite.play(animKey);
        }
      }
    }

    // Soft boundary — wrap enemies around player
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const ax = this.ace.sprite.x;
    const ay = this.ace.sprite.y;
    if (ax < -200 || ax > GAME_WIDTH + 200 || ay < -200 || ay > GAME_HEIGHT + 200) {
      this.ace.sprite.setPosition(cx, cy);
    }
  }

  // ================================================================
  // STARFIELD
  // ================================================================

  private updateStarfield(_dt: number): void {
    this.starGfx.clear();
    for (const s of this.stars) {
      s.alpha += Math.sin(Date.now() * s.speed * 0.01) * 0.01;
      s.alpha = Phaser.Math.Clamp(s.alpha, 0.05, 0.7);
      this.starGfx.fillStyle(0xffffff, s.alpha);
      this.starGfx.fillRect(s.x, s.y, 1.5, 1.5);
    }
  }

  // ================================================================
  // ENEMY SPAWNING
  // ================================================================

  private updateEnemySpawning(dt: number): void {
    const elapsed = CYCLE_DURATION_SEC - this.cycleTimer;

    // Wave rest period
    if (this.inWaveRest) {
      this.waveRestTimer -= dt;
      this.waveText.setText(`Next wave in ${Math.ceil(this.waveRestTimer)}s`);
      if (this.waveRestTimer <= 0) {
        this.inWaveRest = false;
        this.startNextWave(elapsed);
      }
      return;
    }

    // Start first wave
    if (this.waveNumber === 0) {
      this.startNextWave(elapsed);
      return;
    }

    // Check if current wave is cleared
    if (this.waveEnemiesRemaining <= 0 && this.enemies.length === 0) {
      this.inWaveRest = true;
      this.waveRestTimer = Math.max(1, 3 - (this.cycleNumber - 1) * 0.3); // Shorter rests at higher cycles
      this.showWaveClearText();
      return;
    }

    // Spawn enemies for current wave
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;

    const cycleSpeedUp = Math.min(0.4, (this.cycleNumber - 1) * 0.08);
    const spawnInterval = Math.max(0.15, 1.2 - this.waveNumber * 0.08 - cycleSpeedUp);
    this.spawnTimer = spawnInterval;

    if (this.enemies.length >= MAX_ENEMIES || this.waveEnemiesRemaining <= 0) return;

    const batchSize = Math.min(this.waveEnemiesRemaining, 1 + Math.floor(this.waveNumber / 4) + Math.floor(this.cycleNumber / 3));
    for (let i = 0; i < batchSize; i++) {
      if (this.waveEnemiesRemaining <= 0) break;
      this.spawnEnemy(elapsed);
      this.waveEnemiesRemaining--;
    }
  }

  private startNextWave(elapsed: number): void {
    this.waveNumber++;
    // Each wave gets progressively bigger
    this.waveEnemiesRemaining = 5 + this.waveNumber * 3 + this.cycleNumber * 2;
    this.waveText.setText(`Wave ${this.waveNumber}`);

    // Announce wave
    this.showWarning(`Wave ${this.waveNumber}`);
  }

  private showWaveClearText(): void {
    // Auto-evolve companions every 5 waves
    // Auto-evolve companions every 5 waves
    if (this.waveNumber > 0 && this.waveNumber % 5 === 0) {
      for (const c of this.companions) {
        this.evolveCompanion(c);
      }
    }

    // Vacuum all XP gems on wave clear
    for (const gem of this.xpGems) {
      if (!gem.sprite.active) continue;
      const angle = Math.atan2(
        this.ace.sprite.y - gem.sprite.y,
        this.ace.sprite.x - gem.sprite.x,
      );
      gem.sprite.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
    }

    // Small heal on wave clear (10% of max HP)
    this.ace.hp = Math.min(this.ace.hp + Math.floor(this.ace.maxHp * 0.1), this.ace.maxHp);

    const txt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "WAVE CLEAR!", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#a78bfa",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(200)
      .setScrollFactor(0);

    this.tweens.add({
      targets: txt,
      y: txt.y - 40,
      alpha: 0,
      duration: 1500,
      onComplete: () => txt.destroy(),
    });
  }

  /** Enemy pokemon pool per tier */
  private static readonly ENEMY_POOL: string[][] = [
    ["rattata", "zubat"],               // Tier 0: early
    ["geodude", "gastly", "bulbasaur"], // Tier 1: mid
    ["pinsir", "charmander"],           // Tier 2: elite
  ];

  private spawnEnemy(elapsed: number): void {
    if (this.enemies.length >= MAX_ENEMIES) return;

    // Spawn around player at screen edge
    const angle = Math.random() * Math.PI * 2;
    const dist = 280 + Math.random() * 100;
    const ex = this.ace.sprite.x + Math.cos(angle) * dist;
    const ey = this.ace.sprite.y + Math.sin(angle) * dist;

    // Scale with time + cycle number
    const tier = elapsed < 60 ? 0 : elapsed < 150 ? 1 : 2;
    const cycleMult = 1 + (this.cycleNumber - 1) * 0.25;
    const hpMult = (1 + tier * 0.8 + elapsed * 0.01) * cycleMult;
    const spdMult = (1 + tier * 0.2) * Math.min(cycleMult, 1.5);

    // Pick enemy pokemon based on tier
    const pool = GameScene.ENEMY_POOL[tier] ?? GameScene.ENEMY_POOL[0];
    const pokemonKey = pool[Math.floor(Math.random() * pool.length)];
    const pmdTexKey = `pmd-${pokemonKey}`;
    const usePmd = this.textures.exists(pmdTexKey);
    const fallbackTex = tier >= 2 ? "enemy-elite" : "enemy";

    const sprite = this.physics.add.sprite(ex, ey, usePmd ? pmdTexKey : fallbackTex).setDepth(5);
    this.enemyGroup.add(sprite);

    if (usePmd) {
      sprite.play(`${pokemonKey}-walk-down`);
      // Tint enemies slightly red so they're distinguishable from allies
      sprite.setTint(0xff8888);
    }

    // Spawn-in animation: scale from 0 → 1
    sprite.setScale(0);
    this.tweens.add({
      targets: sprite,
      scaleX: usePmd ? 1 : 1,
      scaleY: usePmd ? 1 : 1,
      duration: 250,
      ease: "Back.easeOut",
    });

    const hpBarGfx = this.add.graphics().setDepth(6);

    // Assign behavior based on pokemon
    const behaviorMap: Record<string, EnemyBehavior> = {
      rattata: "swarm",
      zubat: "circle",
      gastly: "circle",
      geodude: "charge",
      bulbasaur: "chase",
      charmander: "charge",
      pinsir: "charge",
    };
    const behavior = behaviorMap[pokemonKey] ?? "chase";

    // Elite chance: scales with wave number and cycle
    const eliteChance = Math.min(0.5, 0.15 + this.waveNumber * 0.01 + (this.cycleNumber - 1) * 0.05);
    const isElite = this.waveNumber >= 3 && Math.random() < eliteChance;

    const eliteMult = isElite ? 2.5 : 1;
    const baseHp = Math.round(15 * hpMult * eliteMult);

    if (isElite) {
      sprite.setTint(0xffaa00); // Gold tint for elites
      // Scale up elite sprite
      this.tweens.killTweensOf(sprite);
      sprite.setScale(0);
      this.tweens.add({
        targets: sprite,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 300,
        ease: "Back.easeOut",
      });
    }

    const enemy: EnemyData = {
      sprite,
      pokemonKey,
      hp: baseHp,
      maxHp: baseHp,
      atk: Math.round((5 + tier * 3 + elapsed * 0.02) * cycleMult * (isElite ? 1.8 : 1)),
      speed: (40 + Math.random() * 30) * spdMult * (isElite ? 1.2 : 1),
      hpBar: hpBarGfx,
      behavior,
      orbitAngle: behavior === "circle" ? Math.random() * Math.PI * 2 : undefined,
      chargeTimer: behavior === "charge" ? 3000 + Math.random() * 2000 : undefined,
      isCharging: false,
      isElite,
    };
    this.enemies.push(enemy);
  }

  // ================================================================
  // ENEMY AI
  // ================================================================

  private updateEnemies(dt: number): void {
    const ax = this.ace.sprite.x;
    const ay = this.ace.sprite.y;
    const dtMs = dt * 1000;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.sprite.active) {
        this.cleanupEnemy(i);
        continue;
      }

      const dx = ax - e.sprite.x;
      const dy = ay - e.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // -- Behavior-based movement --
      switch (e.behavior) {
        case "chase":
        default:
          // Direct pursuit
          if (dist > 1) {
            e.sprite.setVelocity(
              (dx / dist) * e.speed,
              (dy / dist) * e.speed,
            );
          }
          break;

        case "circle": {
          // Orbit around player, gradually closing in
          const orbitRadius = Math.max(80, dist * 0.95);
          e.orbitAngle = (e.orbitAngle ?? 0) + 1.5 * dt;
          const targetX = ax + Math.cos(e.orbitAngle) * orbitRadius;
          const targetY = ay + Math.sin(e.orbitAngle) * orbitRadius;
          const tdx = targetX - e.sprite.x;
          const tdy = targetY - e.sprite.y;
          const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
          if (tdist > 1) {
            e.sprite.setVelocity(
              (tdx / tdist) * e.speed * 1.2,
              (tdy / tdist) * e.speed * 1.2,
            );
          }
          break;
        }

        case "charge": {
          // Wait at distance, then dash at player
          if (!e.isCharging) {
            e.chargeTimer = (e.chargeTimer ?? 2000) - dtMs;
            // Idle/slow approach
            if (dist > 120) {
              e.sprite.setVelocity(
                (dx / dist) * e.speed * 0.3,
                (dy / dist) * e.speed * 0.3,
              );
            } else {
              e.sprite.setVelocity(0, 0);
            }
            // Flash white before charging
            if ((e.chargeTimer ?? 0) < 400 && (e.chargeTimer ?? 0) > 0) {
              e.sprite.setTint(0xffffff);
            }
            if ((e.chargeTimer ?? 0) <= 0) {
              e.isCharging = true;
              e.chargeTimer = 800; // Charge duration
              e.sprite.setTint(0xff4444);
              // Dash toward player's current position
              if (dist > 1) {
                e.sprite.setVelocity(
                  (dx / dist) * e.speed * 3.5,
                  (dy / dist) * e.speed * 3.5,
                );
              }
            }
          } else {
            // Currently charging — maintain velocity, count down
            e.chargeTimer = (e.chargeTimer ?? 0) - dtMs;
            if ((e.chargeTimer ?? 0) <= 0) {
              e.isCharging = false;
              e.chargeTimer = 2500 + Math.random() * 1500;
              e.sprite.setTint(0xff8888); // Restore enemy tint
              e.sprite.setVelocity(0, 0);
            }
          }
          break;
        }

        case "swarm": {
          // Group toward nearest swarm ally, then chase as pack
          let nearestSwarmDx = 0;
          let nearestSwarmDy = 0;
          let nearestSwarmDist = Infinity;
          for (const other of this.enemies) {
            if (other === e || other.behavior !== "swarm" || !other.sprite.active) continue;
            const sdx = other.sprite.x - e.sprite.x;
            const sdy = other.sprite.y - e.sprite.y;
            const sd = Math.sqrt(sdx * sdx + sdy * sdy);
            if (sd < nearestSwarmDist && sd > 5) {
              nearestSwarmDist = sd;
              nearestSwarmDx = sdx;
              nearestSwarmDy = sdy;
            }
          }
          // Blend: chase player + cluster toward nearest ally
          let vx = 0;
          let vy = 0;
          if (dist > 1) {
            vx = (dx / dist) * e.speed;
            vy = (dy / dist) * e.speed;
          }
          // If ally is nearby but not too close, group up
          if (nearestSwarmDist < 150 && nearestSwarmDist > 25) {
            vx += (nearestSwarmDx / nearestSwarmDist) * e.speed * 0.4;
            vy += (nearestSwarmDy / nearestSwarmDist) * e.speed * 0.4;
          }
          e.sprite.setVelocity(vx, vy);
          break;
        }
      }

      // Touch damage to player
      if (dist < 20) {
        this.damageAce(e.atk * 0.016); // Per frame damage (~60fps)
      }

      // Draw HP bar above enemy
      e.hpBar.clear();
      if (e.hp < e.maxHp) {
        const bw = e.isElite ? 26 : 20;
        const bx = e.sprite.x - bw / 2;
        const by = e.sprite.y - (e.isElite ? 20 : 16);
        e.hpBar.fillStyle(0x333333, 0.8);
        e.hpBar.fillRect(bx, by, bw, e.isElite ? 4 : 3);
        e.hpBar.fillStyle(e.isElite ? 0xffaa00 : COLORS.hpRed, 1);
        e.hpBar.fillRect(bx, by, bw * (e.hp / e.maxHp), e.isElite ? 4 : 3);
      }

      // Remove if too far from player
      if (dist > 600) {
        this.cleanupEnemy(i);
      }
    }
  }

  private cleanupEnemy(index: number): void {
    const e = this.enemies[index];
    e.sprite.destroy();
    e.hpBar.destroy();
    this.enemies.splice(index, 1);
  }

  // ================================================================
  // AUTO-ATTACK
  // ================================================================

  private updateAceAutoAttack(): void {
    const now = this.time.now;

    // Draw aim indicator to nearest enemy
    this.aimGfx.clear();
    const aimTarget = this.findNearestEnemy(this.ace.sprite.x, this.ace.sprite.y, this.ace.attackRange);
    if (aimTarget) {
      this.aimGfx.lineStyle(1, 0xfbbf24, 0.2);
      this.aimGfx.lineBetween(this.ace.sprite.x, this.ace.sprite.y, aimTarget.sprite.x, aimTarget.sprite.y);
    }

    if (now - this.ace.lastAttackTime < this.ace.attackCooldown) return;

    // Find nearest enemy
    const target = aimTarget;
    if (!target) return;

    this.ace.lastAttackTime = now;
    sfx.playHit();

    // Multi-shot based on level: 1 at base, 3 at Lv7, 5 at Lv15
    const shotCount = this.level >= 15 ? 5 : this.level >= 7 ? 3 : 1;
    const baseAngle = Math.atan2(
      target.sprite.y - this.ace.sprite.y,
      target.sprite.x - this.ace.sprite.x,
    );
    const spread = 0.2; // ~11 degrees spread per shot

    for (let s = 0; s < shotCount; s++) {
      const offset = (s - (shotCount - 1) / 2) * spread;
      const angle = baseAngle + offset;
      const dist = 200;
      this.fireProjectile(
        this.ace.sprite.x,
        this.ace.sprite.y,
        this.ace.sprite.x + Math.cos(angle) * dist,
        this.ace.sprite.y + Math.sin(angle) * dist,
        Math.floor(this.ace.atk / (shotCount > 1 ? shotCount * 0.6 : 1)),
      );
    }
  }

  private findNearestEnemy(
    x: number,
    y: number,
    range: number,
  ): EnemyData | null {
    let best: EnemyData | null = null;
    let bestDist = range;
    for (const e of this.enemies) {
      const d = Phaser.Math.Distance.Between(x, y, e.sprite.x, e.sprite.y);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  // ================================================================
  // PROJECTILES
  // ================================================================

  private fireProjectile(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    damage: number,
  ): void {
    if (this.projectiles.length >= MAX_PROJECTILES) {
      // Recycle oldest
      const old = this.projectiles.shift()!;
      old.sprite.destroy();
    }

    const sprite = this.physics.add
      .sprite(fromX, fromY, "projectile")
      .setDepth(8);
    this.projectileGroup.add(sprite);

    const angle = Math.atan2(toY - fromY, toX - fromX);
    const speed = 300;
    sprite.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    const pierce = 1 + this.aceEvoStage; // More pierce with evolution
    this.projectiles.push({ sprite, damage, pierce });
  }

  private updateProjectiles(_dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.sprite.active) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }

      // Remove if off-screen
      const dx = p.sprite.x - this.ace.sprite.x;
      const dy = p.sprite.y - this.ace.sprite.y;
      if (Math.abs(dx) > 400 || Math.abs(dy) > 500) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  private onProjectileHitEnemy(proj: ProjectileData, enemy: EnemyData): void {
    // Critical hit check
    const isCrit = Math.random() < this.critChance;
    const finalDamage = isCrit ? proj.damage * 2 : proj.damage;

    enemy.hp -= finalDamage;
    proj.pierce--;
    sfx.playHit();

    // Lifesteal
    if (this.lifestealRate > 0 && this.ace.hp < this.ace.maxHp) {
      const heal = Math.ceil(finalDamage * this.lifestealRate);
      this.ace.hp = Math.min(this.ace.maxHp, this.ace.hp + heal);
    }

    // Damage popup (gold for normal, red for crit)
    this.showDamagePopup(enemy.sprite.x, enemy.sprite.y, isCrit ? `${Math.ceil(finalDamage)} CRIT!` : finalDamage, isCrit ? "#ff4444" : "#fbbf24");

    // Flash enemy white
    enemy.sprite.setTint(0xffffff);
    this.time.delayedCall(80, () => {
      if (enemy.sprite.active) enemy.sprite.setTint(0xff8888);
    });

    if (proj.pierce <= 0) {
      proj.sprite.destroy();
      const idx = this.projectiles.indexOf(proj);
      if (idx >= 0) this.projectiles.splice(idx, 1);
    }

    if (enemy.hp <= 0) {
      this.onEnemyDeath(enemy);
    }
  }

  private onEnemyDeath(enemy: EnemyData): void {
    this.kills++;
    this.killStreak++;
    this.lastKillTime = this.time.now;

    // Check if this was the boss
    const wasBoss = enemy === this.boss;

    // Death particles
    this.spawnDeathParticles(enemy.sprite.x, enemy.sprite.y, wasBoss);

    // Camera shake (stronger for boss/elite)
    if (wasBoss) {
      this.cameras.main.shake(300, 0.015);
    } else if (enemy.isElite) {
      this.cameras.main.shake(100, 0.006);
    } else if (this.killStreak >= 5) {
      this.cameras.main.shake(50, 0.003);
    }

    // Kill streak text
    if (this.killStreak >= 10 && this.killStreak % 5 === 0) {
      this.showStreakText(this.killStreak);
    }

    // Spawn XP gem (boss/elite drop more)
    const xpValue = wasBoss
      ? 50 + this.cycleNumber * 20
      : enemy.isElite
        ? 10 + Math.floor(enemy.maxHp / 5)
        : 3 + Math.floor(enemy.maxHp / 10);
    this.spawnXpGem(enemy.sprite.x, enemy.sprite.y, xpValue);

    // Random item drop (8% normal, 40% elite, 100% boss)
    const dropChance = wasBoss ? 1 : enemy.isElite ? 0.4 : 0.08;
    if (Math.random() < dropChance) {
      this.spawnItem(enemy.sprite.x, enemy.sprite.y);
    }

    // Cleanup
    const idx = this.enemies.indexOf(enemy);
    if (idx >= 0) this.cleanupEnemy(idx);

    // Trigger boss defeated sequence
    if (wasBoss) {
      this.onBossDefeated();
    }
  }

  // ================================================================
  // XP & LEVELING
  // ================================================================

  private spawnXpGem(x: number, y: number, value: number): void {
    const sprite = this.physics.add.sprite(x, y, "xp-gem").setDepth(3);
    this.xpGemGroup.add(sprite);
    sprite.body!.setCircle(16); // Larger pickup radius
    this.xpGems.push({ sprite, value });
  }

  private updateXpGemMagnet(): void {
    const magnetRange = this.xpMagnetRange + this.level * 5;
    const magnetSpeed = 200 + this.level * 10;
    const ax = this.ace.sprite.x;
    const ay = this.ace.sprite.y;

    for (let i = this.xpGems.length - 1; i >= 0; i--) {
      const gem = this.xpGems[i];
      if (!gem.sprite.active) {
        gem.sprite.destroy();
        this.xpGems.splice(i, 1);
        continue;
      }

      const dist = Phaser.Math.Distance.Between(
        ax,
        ay,
        gem.sprite.x,
        gem.sprite.y,
      );

      if (dist < magnetRange) {
        // Magnet pull toward player
        const angle = Math.atan2(ay - gem.sprite.y, ax - gem.sprite.x);
        gem.sprite.setVelocity(
          Math.cos(angle) * magnetSpeed,
          Math.sin(angle) * magnetSpeed,
        );
      } else {
        gem.sprite.setVelocity(0, 0);
      }
    }
  }

  private collectXpGem(gem: XpGem): void {
    sfx.playPickup();
    this.xp += gem.value;
    gem.sprite.destroy();
    const idx = this.xpGems.indexOf(gem);
    if (idx >= 0) this.xpGems.splice(idx, 1);

    // Check level up
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(XP_PER_LEVEL_BASE * Math.pow(XP_LEVEL_SCALE, this.level - 1));
      this.onLevelUp();
    }
  }

  // ================================================================
  // ITEM DROPS
  // ================================================================

  private spawnItem(x: number, y: number): void {
    const types: ItemType[] = ["heal", "bomb", "magnet"];
    const weights = [0.5, 0.25, 0.25]; // heal more common
    let r = Math.random();
    let type: ItemType = "heal";
    for (let i = 0; i < types.length; i++) {
      r -= weights[i];
      if (r <= 0) { type = types[i]; break; }
    }

    const texKey = `item-${type}`;
    const sprite = this.physics.add.sprite(x, y, texKey).setDepth(4);
    this.itemGroup.add(sprite);
    sprite.body!.setCircle(12);

    // Bounce-in animation
    sprite.setScale(0);
    this.tweens.add({
      targets: sprite,
      scaleX: 1.5, scaleY: 1.5,
      duration: 200,
      ease: "Back.easeOut",
      onComplete: () => {
        if (sprite.active) {
          this.tweens.add({
            targets: sprite,
            scaleX: 1, scaleY: 1,
            duration: 150,
          });
        }
      },
    });

    this.items.push({ sprite, type, ttl: 10000 }); // 10 second lifetime
  }

  private updateItems(dt: number): void {
    const ax = this.ace.sprite.x;
    const ay = this.ace.sprite.y;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (!item.sprite.active) {
        item.sprite.destroy();
        this.items.splice(i, 1);
        continue;
      }

      item.ttl -= dt * 1000;

      // Blink when about to expire
      if (item.ttl < 3000) {
        item.sprite.setAlpha(Math.sin(this.time.now * 0.01) * 0.3 + 0.7);
      }

      // Despawn
      if (item.ttl <= 0) {
        item.sprite.destroy();
        this.items.splice(i, 1);
        continue;
      }

      // Pickup check
      const dist = Phaser.Math.Distance.Between(ax, ay, item.sprite.x, item.sprite.y);
      if (dist < 24) {
        this.collectItem(item);
        this.items.splice(i, 1);
      }
    }
  }

  private collectItem(item: ItemDrop): void {
    sfx.playPickup();

    switch (item.type) {
      case "heal": {
        const healAmt = Math.floor(this.ace.maxHp * 0.25);
        this.ace.hp = Math.min(this.ace.hp + healAmt, this.ace.maxHp);
        this.showDamagePopup(this.ace.sprite.x, this.ace.sprite.y - 20, `+${healAmt}`, "#44ff44");
        break;
      }
      case "bomb": {
        // Damage all enemies on screen
        this.cameras.main.flash(150, 255, 160, 0);
        this.cameras.main.shake(200, 0.01);
        for (const e of this.enemies) {
          if (!e.sprite.active) continue;
          const dist = Phaser.Math.Distance.Between(
            this.ace.sprite.x, this.ace.sprite.y,
            e.sprite.x, e.sprite.y,
          );
          if (dist < 300) {
            e.hp -= Math.floor(e.maxHp * 0.5);
            e.sprite.setTint(0xffffff);
            this.time.delayedCall(100, () => {
              if (e.sprite.active) e.sprite.setTint(0xff8888);
            });
            if (e.hp <= 0) {
              this.onEnemyDeath(e);
            }
          }
        }
        this.showDamagePopup(this.ace.sprite.x, this.ace.sprite.y - 30, "BOOM!", "#ff6600");
        break;
      }
      case "magnet": {
        // Pull all XP gems to player instantly
        for (const gem of this.xpGems) {
          if (!gem.sprite.active) continue;
          const angle = Math.atan2(
            this.ace.sprite.y - gem.sprite.y,
            this.ace.sprite.x - gem.sprite.x,
          );
          gem.sprite.setVelocity(
            Math.cos(angle) * 600,
            Math.sin(angle) * 600,
          );
        }
        this.showDamagePopup(this.ace.sprite.x, this.ace.sprite.y - 30, "MAGNET!", "#66ccff");
        break;
      }
    }

    item.sprite.destroy();
  }

  private onLevelUp(): void {
    // Always grant small passive stat boost
    this.ace.attackRange += 3;
    if (this.ace.attackCooldown > 350) this.ace.attackCooldown -= 15;

    // Camera flash on level up
    this.cameras.main.flash(200, 255, 255, 255);

    // Show selection UI for meaningful choices
    sfx.playLevelUp();
    this.showLevelUpSelection();
  }

  private evolveAce(): void {
    const chain = EVOLUTION_CHAINS[this.ace.pokemonKey];
    if (!chain || this.aceEvoStage >= chain.length - 1) return;

    this.aceEvoStage++;
    const stage = chain[this.aceEvoStage];

    // Apply stat multipliers (relative to base stage)
    const prevStage = chain[this.aceEvoStage - 1];
    const atkBoost = stage.atkMult / prevStage.atkMult;
    const hpBoost = stage.hpMult / prevStage.hpMult;
    const spdBoost = stage.speedMult / prevStage.speedMult;

    this.ace.atk = Math.floor(this.ace.atk * atkBoost);
    this.ace.maxHp = Math.floor(this.ace.maxHp * hpBoost);
    this.ace.hp = this.ace.maxHp; // Full heal on evolution
    this.ace.speed = Math.floor(this.ace.speed * spdBoost);
    this.ace.attackCooldown = Math.max(200, Math.floor(this.ace.attackCooldown * (1 / spdBoost)));

    // Scale up sprite
    this.ace.sprite.setScale(stage.scale);

    // Evolution flash effect
    this.cameras.main.flash(500, 255, 0, 255);
    this.cameras.main.shake(300, 0.01);

    // Particle burst
    this.spawnDeathParticles(this.ace.sprite.x, this.ace.sprite.y, true);

    // Show evolution text
    const txt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, `★ ${stage.name} ★`, {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#ff00ff",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(300)
      .setScrollFactor(0);

    this.tweens.add({
      targets: txt,
      y: txt.y - 50,
      alpha: 0,
      duration: 2500,
      ease: "Cubic.easeOut",
      onComplete: () => txt.destroy(),
    });
  }

  private evolveCompanion(companion: CompanionData): void {
    const chain = EVOLUTION_CHAINS[companion.sprite.texture.key.replace("pmd-", "")];
    const currentStage = this.companionEvoStages.get(companion.sprite.texture.key) ?? 0;
    if (!chain || currentStage >= chain.length - 1) return;

    const nextStage = currentStage + 1;
    this.companionEvoStages.set(companion.sprite.texture.key, nextStage);

    const stage = chain[nextStage];
    const prevStage = chain[currentStage];
    companion.atk = Math.floor(companion.atk * (stage.atkMult / prevStage.atkMult));
    companion.sprite.setScale(stage.scale);

    this.spawnDeathParticles(companion.sprite.x, companion.sprite.y, false);
  }

  // ================================================================
  // COMPANIONS
  // ================================================================

  /** Companion pokemon pool: key → attack type */
  private static readonly COMPANION_POOL: { key: string; type: "projectile" | "orbital" | "area" }[] = [
    { key: "squirtle", type: "projectile" },
    { key: "gastly", type: "orbital" },
    { key: "geodude", type: "area" },
    { key: "charmander", type: "projectile" },
    { key: "bulbasaur", type: "area" },
  ];

  private addCompanion(): void {
    if (this.companions.length >= 5) return;

    const pool = GameScene.COMPANION_POOL[this.companions.length % GameScene.COMPANION_POOL.length];
    const type = pool.type;
    const pokemonKey = pool.key;
    const pmdTexKey = `pmd-${pokemonKey}`;
    const usePmd = this.textures.exists(pmdTexKey);

    const sprite = this.physics.add
      .sprite(this.ace.sprite.x, this.ace.sprite.y - 30, usePmd ? pmdTexKey : "companion")
      .setDepth(9);

    if (usePmd) {
      sprite.play(`${pokemonKey}-walk-down`);
      sprite.setScale(1.2);
    }

    const companion: CompanionData = {
      sprite,
      atk: 5 + this.level * 2,
      attackCooldown: type === "orbital" ? 200 : type === "area" ? 2000 : 1200,
      lastAttackTime: 0,
      attackRange: type === "orbital" ? 30 : type === "area" ? 80 : 150,
      orbitAngle: (this.companions.length * Math.PI * 2) / 3,
      type,
      level: 1,
    };

    this.companions.push(companion);

    // Announce
    const names = POKEMON_SPRITES[pokemonKey]?.name
      ? [POKEMON_SPRITES.squirtle.name, POKEMON_SPRITES.gastly.name, POKEMON_SPRITES.geodude.name]
      : ["Squirtle", "Gastly", "Geodude"];
    const txt = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 20,
        `+ ${names[this.companions.length - 1] ?? "Companion"} joined!`,
        {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#00ddff",
          stroke: "#000",
          strokeThickness: 2,
        },
      )
      .setOrigin(0.5)
      .setDepth(201)
      .setScrollFactor(0);

    this.tweens.add({
      targets: txt,
      y: txt.y - 30,
      alpha: 0,
      duration: 1500,
      onComplete: () => txt.destroy(),
    });
  }

  private updateCompanions(dt: number): void {
    const now = this.time.now;

    for (const c of this.companions) {
      // Orbit around ace
      c.orbitAngle += dt * (c.type === "orbital" ? 3.0 : 1.5);
      const orbitDist = c.type === "orbital" ? 35 : 50;
      c.sprite.setPosition(
        this.ace.sprite.x + Math.cos(c.orbitAngle) * orbitDist,
        this.ace.sprite.y + Math.sin(c.orbitAngle) * orbitDist,
      );

      // Attack
      if (now - c.lastAttackTime < c.attackCooldown) continue;

      if (c.type === "orbital") {
        // Orbital: damage nearby enemies on contact
        for (const e of this.enemies) {
          const d = Phaser.Math.Distance.Between(
            c.sprite.x,
            c.sprite.y,
            e.sprite.x,
            e.sprite.y,
          );
          if (d < c.attackRange) {
            e.hp -= c.atk;
            this.showDamagePopup(e.sprite.x, e.sprite.y, c.atk, "#c084fc");
            e.sprite.setTint(0xff88ff);
            this.time.delayedCall(60, () => {
              if (e.sprite.active) e.sprite.setTint(0xff8888);
            });
            if (e.hp <= 0) this.onEnemyDeath(e);
            c.lastAttackTime = now;
            break;
          }
        }
      } else if (c.type === "projectile") {
        // Projectile: fire at nearest enemy
        const target = this.findNearestEnemy(
          c.sprite.x,
          c.sprite.y,
          c.attackRange,
        );
        if (target) {
          c.lastAttackTime = now;
          this.fireProjectile(
            c.sprite.x,
            c.sprite.y,
            target.sprite.x,
            target.sprite.y,
            c.atk,
          );
        }
      } else if (c.type === "area") {
        // Area: damage all enemies in range
        c.lastAttackTime = now;
        let hit = false;
        for (const e of this.enemies) {
          const d = Phaser.Math.Distance.Between(
            c.sprite.x,
            c.sprite.y,
            e.sprite.x,
            e.sprite.y,
          );
          if (d < c.attackRange) {
            e.hp -= c.atk;
            this.showDamagePopup(e.sprite.x, e.sprite.y, c.atk, "#4ade80");
            if (e.hp <= 0) this.onEnemyDeath(e);
            hit = true;
          }
        }
        if (hit) {
          // Visual: expanding ring
          const ring = this.add.circle(
            c.sprite.x,
            c.sprite.y,
            5,
            COLORS.accent3,
            0.4,
          ).setDepth(7);
          this.tweens.add({
            targets: ring,
            radius: c.attackRange,
            alpha: 0,
            duration: 300,
            onComplete: () => ring.destroy(),
          });
        }
      }
    }
  }

  // ================================================================
  // LEGIONS (past parties auto-fighting)
  // ================================================================

  private updateLegions(dt: number): void {
    const now = this.time.now;
    const ax = this.ace.sprite.x;
    const ay = this.ace.sprite.y;

    for (const legion of this.legionEntities) {
      // Orbit around the ace
      legion.orbitAngle += dt * 0.8;
      const lx = ax + Math.cos(legion.orbitAngle) * legion.orbitDist;
      const ly = ay + Math.sin(legion.orbitAngle) * legion.orbitDist;

      // Clamp to screen bounds
      const clampX = Phaser.Math.Clamp(lx, -100, GAME_WIDTH + 100);
      const clampY = Phaser.Math.Clamp(ly, -100, GAME_HEIGHT + 100);

      // Draw legion — LOD based on index
      legion.gfx.clear();
      const color = legion.data.color;
      const memberCount = 1 + legion.data.companions.length;

      if (this.legionEntities.indexOf(legion) < 3) {
        // Tier 1 LOD: Individual circles for ace + companions
        const aceR = 8;
        legion.gfx.fillStyle(color, 0.6);
        legion.gfx.fillCircle(clampX, clampY, aceR);

        // Companions as smaller orbiting dots
        for (let j = 0; j < legion.data.companions.length; j++) {
          const ca = legion.orbitAngle * 2 + (j * Math.PI * 2) / memberCount;
          const cx = clampX + Math.cos(ca) * 15;
          const cy = clampY + Math.sin(ca) * 15;
          legion.gfx.fillStyle(color, 0.4);
          legion.gfx.fillCircle(cx, cy, 5);
        }

        // DPS aura ring
        legion.gfx.lineStyle(1, color, 0.2);
        legion.gfx.strokeCircle(clampX, clampY, legion.attackRange * 0.3);
      } else {
        // Tier 2+ LOD: Single glow blob
        const blobR = 6 + Math.min(memberCount * 2, 10);
        legion.gfx.fillStyle(color, 0.35);
        legion.gfx.fillCircle(clampX, clampY, blobR);
      }

      // Auto-attack enemies in range
      if (now - legion.lastAttackTime >= legion.attackInterval) {
        legion.lastAttackTime = now;
        const dmg = legion.data.dps * (legion.attackInterval / 1000);

        for (const e of this.enemies) {
          const d = Phaser.Math.Distance.Between(clampX, clampY, e.sprite.x, e.sprite.y);
          if (d < legion.attackRange) {
            e.hp -= dmg;
            this.showDamagePopup(e.sprite.x, e.sprite.y, dmg, "#67e8f9");
            // Flash enemy with legion color
            e.sprite.setTint(color);
            this.time.delayedCall(60, () => {
              if (e.sprite.active) e.sprite.setTint(0xff8888);
            });
            if (e.hp <= 0) this.onEnemyDeath(e);
            break; // One target per attack
          }
        }
      }
    }
  }

  // ================================================================
  // DAMAGE
  // ================================================================

  private damageAce(amount: number): void {
    this.ace.hp -= amount;
    // Show damage on ace (throttled via popup pool)
    if (amount >= 0.5) {
      this.showDamagePopup(this.ace.sprite.x, this.ace.sprite.y, amount, "#f43f5e");
    }
    if (this.ace.hp <= 0) {
      this.ace.hp = 0;
      this.onAceDeath();
    }
  }

  private onAceDeath(): void {
    this.isPaused = true;
    sfx.stopBgm();
    sfx.playDeath();
    this.saveHighScore();

    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.7,
    ).setDepth(300).setScrollFactor(0);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, "DEFEATED", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#f43f5e",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(301)
      .setScrollFactor(0);

    const evoName = EVOLUTION_CHAINS[this.ace.pokemonKey]?.[this.aceEvoStage]?.name ?? this.ace.pokemonKey;
    const totalTimeStr = this.formatTime(this.totalSurvivalTime);
    const diffLabel = this.getDifficultyLabel();
    const statsLines = [
      `${evoName}  Lv.${this.level}`,
      ``,
      `Kills: ${this.kills}    Wave: ${this.waveNumber}`,
      `Cycle: ${this.cycleNumber}    Party: ${this.companions.length + 1}`,
      `Total Time: ${totalTimeStr}`,
      diffLabel ? `Difficulty: ${diffLabel}` : "",
    ].filter(Boolean);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 15, statsLines.join("\n"), {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#ccc",
        align: "center",
        lineSpacing: 4,
      })
      .setOrigin(0.5, 0)
      .setDepth(301)
      .setScrollFactor(0);

    // High score line
    const hs = this.saveData.highScore;
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 105, `Best: Kill ${hs.kills} / Wave ${hs.wave} / Lv.${hs.level}`, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#fbbf24",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(301)
      .setScrollFactor(0);

    // Tap to retry
    const retry = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140, "[ Tap to Retry ]", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#667eea",
      })
      .setOrigin(0.5)
      .setDepth(301)
      .setScrollFactor(0);

    this.tweens.add({
      targets: retry,
      alpha: 0.3,
      yoyo: true,
      repeat: -1,
      duration: 800,
    });

    this.input.once("pointerdown", () => {
      // Return to title screen on death
      this.scene.start("TitleScene");
    });
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  private getDifficultyLabel(): string {
    if (this.cycleNumber >= 7) return "INFERNO";
    if (this.cycleNumber >= 5) return "NIGHTMARE";
    if (this.cycleNumber >= 3) return "HARD";
    if (this.cycleNumber >= 2) return "NORMAL+";
    return "";
  }

  // ================================================================
  // UI DRAW
  // ================================================================

  private drawUI(): void {
    // HP bar
    this.hpBar.clear();
    const hpW = 160;
    const hpH = 8;
    const hpX = 8;
    const hpY = 8;
    this.hpBar.fillStyle(0x333333, 0.8);
    this.hpBar.fillRect(hpX, hpY, hpW, hpH);
    const hpRatio = this.ace.hp / this.ace.maxHp;
    const hpColor = hpRatio > 0.5 ? COLORS.hpGreen : hpRatio > 0.25 ? COLORS.gold : COLORS.hpRed;
    this.hpBar.fillStyle(hpColor, 1);
    this.hpBar.fillRect(hpX, hpY, hpW * hpRatio, hpH);
    // HP border
    this.hpBar.lineStyle(1, 0x555555, 0.8);
    this.hpBar.strokeRect(hpX, hpY, hpW, hpH);

    // XP bar
    this.xpBar.clear();
    const xpW = 160;
    const xpH = 4;
    const xpX = 8;
    const xpY = 19;
    this.xpBar.fillStyle(0x222233, 0.8);
    this.xpBar.fillRect(xpX, xpY, xpW, xpH);
    this.xpBar.fillStyle(COLORS.xpBlue, 1);
    this.xpBar.fillRect(xpX, xpY, xpW * (this.xp / this.xpToNext), xpH);

    // Boss HP bar
    if (this.boss) {
      this.bossHpBar.setVisible(true);
      this.bossNameText.setVisible(true);
      this.bossHpBar.clear();
      const bw = GAME_WIDTH - 40;
      const bx = 20;
      const by = GAME_HEIGHT - 55;
      this.bossHpBar.fillStyle(0x333333, 0.8);
      this.bossHpBar.fillRect(bx, by, bw, 10);
      this.bossHpBar.fillStyle(0xff00ff, 1);
      this.bossHpBar.fillRect(bx, by, bw * (this.boss.hp / this.boss.maxHp), 10);
      this.bossHpBar.lineStyle(1, 0x888888, 0.8);
      this.bossHpBar.strokeRect(bx, by, bw, 10);
    } else {
      this.bossHpBar.setVisible(false);
      this.bossNameText.setVisible(false);
    }

    // Update texts
    const streakSuffix = this.killStreak >= 5 ? ` 🔥${this.killStreak}` : "";
    this.killText.setText(`Kill: ${this.kills}${streakSuffix}`);
    this.killText.setColor(this.killStreak >= 10 ? "#fbbf24" : "#888");
    this.levelText.setText(`Lv.${this.level}`);
    const legionInfo = this.legions.length > 0 ? ` [${this.legions.length}]` : "";
    const diffLabel = this.getDifficultyLabel();
    this.cycleText.setText(`Cycle ${this.cycleNumber}${legionInfo} ${diffLabel}`);
    this.cycleText.setColor(this.cycleNumber >= 5 ? "#f43f5e" : this.cycleNumber >= 3 ? "#fbbf24" : "#888");

    // Minimap (bottom-right corner)
    this.drawMinimap();
  }

  private drawMinimap(): void {
    this.minimapGfx.clear();
    const mapSize = 60;
    const mapX = GAME_WIDTH - mapSize - 8;
    const mapY = GAME_HEIGHT - mapSize - 28;
    const range = 400; // World units shown in minimap

    // Background
    this.minimapGfx.fillStyle(0x000000, 0.4);
    this.minimapGfx.fillRect(mapX, mapY, mapSize, mapSize);
    this.minimapGfx.lineStyle(1, 0x333355, 0.6);
    this.minimapGfx.strokeRect(mapX, mapY, mapSize, mapSize);

    const cx = mapX + mapSize / 2;
    const cy = mapY + mapSize / 2;
    const ax = this.ace.sprite.x;
    const ay = this.ace.sprite.y;

    // Enemies (red dots)
    this.minimapGfx.fillStyle(0xff4444, 0.7);
    for (const e of this.enemies) {
      const dx = (e.sprite.x - ax) / range * (mapSize / 2);
      const dy = (e.sprite.y - ay) / range * (mapSize / 2);
      if (Math.abs(dx) < mapSize / 2 && Math.abs(dy) < mapSize / 2) {
        this.minimapGfx.fillRect(cx + dx - 1, cy + dy - 1, 2, 2);
      }
    }

    // Companions (cyan dots)
    this.minimapGfx.fillStyle(0x00ddff, 0.8);
    for (const c of this.companions) {
      const dx = (c.sprite.x - ax) / range * (mapSize / 2);
      const dy = (c.sprite.y - ay) / range * (mapSize / 2);
      this.minimapGfx.fillCircle(cx + dx, cy + dy, 1.5);
    }

    // XP gems (green tiny dots)
    this.minimapGfx.fillStyle(0x667eea, 0.5);
    for (const g of this.xpGems) {
      const dx = (g.sprite.x - ax) / range * (mapSize / 2);
      const dy = (g.sprite.y - ay) / range * (mapSize / 2);
      if (Math.abs(dx) < mapSize / 2 && Math.abs(dy) < mapSize / 2) {
        this.minimapGfx.fillRect(cx + dx, cy + dy, 1, 1);
      }
    }

    // Player (white center dot)
    this.minimapGfx.fillStyle(0xffd700, 1);
    this.minimapGfx.fillCircle(cx, cy, 2);

    // Boss (magenta blip)
    if (this.boss) {
      const dx = (this.boss.sprite.x - ax) / range * (mapSize / 2);
      const dy = (this.boss.sprite.y - ay) / range * (mapSize / 2);
      this.minimapGfx.fillStyle(0xff00ff, 1);
      this.minimapGfx.fillCircle(
        Phaser.Math.Clamp(cx + dx, mapX + 2, mapX + mapSize - 2),
        Phaser.Math.Clamp(cy + dy, mapY + 2, mapY + mapSize - 2),
        3,
      );
    }
  }

  // ================================================================
  // BOSS
  // ================================================================

  private showWarning(text: string): void {
    const warn = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, text, {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#f43f5e",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(300)
      .setScrollFactor(0)
      .setAlpha(0);

    this.tweens.add({
      targets: warn,
      alpha: 1,
      duration: 300,
      yoyo: true,
      repeat: 2,
      onComplete: () => warn.destroy(),
    });

    // Screen flash red
    const flash = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0.1)
      .setDepth(200)
      .setScrollFactor(0);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      repeat: 2,
      onComplete: () => flash.destroy(),
    });
  }

  private spawnBoss(): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = 250;
    const bx = this.ace.sprite.x + Math.cos(angle) * dist;
    const by = this.ace.sprite.y + Math.sin(angle) * dist;

    const bossHp = 200 + this.cycleNumber * 80;
    const bossKey = "pinsir";
    const pmdTexKey = `pmd-${bossKey}`;
    const usePmd = this.textures.exists(pmdTexKey);

    const sprite = this.physics.add.sprite(bx, by, usePmd ? pmdTexKey : "boss").setDepth(12);
    this.enemyGroup.add(sprite);

    if (usePmd) {
      sprite.play(`${bossKey}-walk-down`);
      sprite.setScale(2.0);
    }

    const hpBarGfx = this.add.graphics().setDepth(13);

    const bossName = POKEMON_SPRITES[bossKey]?.name ?? "Boss";
    this.boss = {
      sprite,
      pokemonKey: bossKey,
      hp: bossHp,
      maxHp: bossHp,
      atk: 12 + this.cycleNumber * 3,
      speed: 30,
      hpBar: hpBarGfx,
      behavior: "chase",
    };
    this.enemies.push(this.boss!);

    this.bossNameText.setText(`${bossName} — Cycle ${this.cycleNumber}`).setVisible(true);

    this.showWarning("BOSS!");
  }

  private onBossDefeated(): void {
    this.boss = null;
    this.isPaused = true;
    sfx.playStageClear();

    // Victory flash
    const flash = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xfbbf24, 0.2)
      .setDepth(200)
      .setScrollFactor(0);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 1000,
      onComplete: () => flash.destroy(),
    });

    // Show cycle clear screen
    this.time.delayedCall(800, () => this.showCycleClear());
  }

  // ================================================================
  // CYCLE TRANSITION
  // ================================================================

  private showCycleClear(): void {
    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85)
      .setDepth(400)
      .setScrollFactor(0);

    const title = this.add
      .text(GAME_WIDTH / 2, 80, "STAGE CLEAR!", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#fbbf24",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(401)
      .setScrollFactor(0);

    const evoName = EVOLUTION_CHAINS[this.ace.pokemonKey]?.[this.aceEvoStage]?.name ?? "Pikachu";
    const totalDps = this.ace.atk + this.companions.reduce((sum, c) => sum + c.atk, 0);
    const stats = [
      `Cycle ${this.cycleNumber} Complete`,
      ``,
      `Ace: ${evoName}  Lv.${this.level}`,
      `Kills: ${this.kills}  Waves: ${this.waveNumber}`,
      `Party DPS: ${totalDps}`,
      `Time: ${this.formatTime(CYCLE_DURATION_SEC - this.cycleTimer)}`,
    ].join("\n");

    this.add
      .text(GAME_WIDTH / 2, 140, stats, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ccc",
        align: "center",
        lineSpacing: 6,
      })
      .setOrigin(0.5, 0)
      .setDepth(401)
      .setScrollFactor(0);

    // "Legion Formed!" section
    const legionColor = [0xffd700, 0x00ddff, 0xff4444][this.cycleNumber % 3];
    this.add
      .text(GAME_WIDTH / 2, 260, "— LEGION FORMED —", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#667eea",
      })
      .setOrigin(0.5)
      .setDepth(401)
      .setScrollFactor(0);

    const companionNames = this.companions.map((c) => {
      const key = c.sprite.texture.key.replace("pmd-", "");
      return POKEMON_SPRITES[key]?.name ?? key;
    });
    this.add
      .text(GAME_WIDTH / 2, 300, `${evoName} + ${companionNames.join(", ") || "Solo"}`, {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#aaa",
      })
      .setOrigin(0.5)
      .setDepth(401)
      .setScrollFactor(0);

    // Store legion
    this.legions.push({
      ace: evoName,
      companions: companionNames,
      dps: totalDps,
      color: legionColor,
    });

    // "Next Cycle" button
    const btnBg = this.add
      .rectangle(GAME_WIDTH / 2, 400, 200, 50, 0x667eea, 0.9)
      .setDepth(401)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add
      .text(GAME_WIDTH / 2, 400, "NEXT CYCLE →", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fff",
      })
      .setOrigin(0.5)
      .setDepth(402)
      .setScrollFactor(0);

    this.tweens.add({
      targets: [btnBg, btnText],
      alpha: 0.5,
      yoyo: true,
      repeat: -1,
      duration: 800,
    });

    btnBg.on("pointerdown", () => {
      this.startNextCycle();
    });

    // Also allow tap anywhere after 2 seconds
    this.time.delayedCall(2000, () => {
      this.input.once("pointerdown", () => {
        this.startNextCycle();
      });
    });
  }

  private startNextCycle(): void {
    const nextCycle = this.cycleNumber + 1;
    const savedLegions = [...this.legions];

    // Clean up all game objects
    for (const e of this.enemies) {
      e.sprite.destroy();
      e.hpBar.destroy();
    }
    for (const p of this.projectiles) p.sprite.destroy();
    for (const g of this.xpGems) g.sprite.destroy();
    for (const c of this.companions) c.sprite.destroy();
    for (const le of this.legionEntities) le.gfx.destroy();
    this.ace.sprite.destroy();

    // Restart scene with persistent data
    this.scene.restart({ cycleNumber: nextCycle, legions: savedLegions, starterKey: this.starterKey, totalTime: this.totalSurvivalTime });
  }

  // ================================================================
  // LEVEL-UP SELECTION UI
  // ================================================================

  private showLevelUpSelection(): void {
    this.isPaused = true;
    this.pendingLevelUp = true;
    this.levelUpContainer.removeAll(true);
    this.levelUpContainer.setVisible(true);

    // Dim overlay
    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setScrollFactor(0);
    this.levelUpContainer.add(overlay);

    // Title
    const title = this.add
      .text(GAME_WIDTH / 2, 60, `LEVEL ${this.level}!`, {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#fbbf24",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.levelUpContainer.add(title);

    // Generate 3 choices
    type Choice = { label: string; desc: string; action: () => void; color: number; portrait?: string };
    const choices: Choice[] = [];

    // Choice 0: Evolution (at level 5, 10, etc.)
    const evoChain = EVOLUTION_CHAINS[this.ace.pokemonKey];
    if (evoChain && this.aceEvoStage < evoChain.length - 1 && this.level >= (this.aceEvoStage + 1) * 5) {
      const nextStage = evoChain[this.aceEvoStage + 1];
      choices.push({
        label: `EVOLVE → ${nextStage.name}`,
        desc: `ATK×${nextStage.atkMult} HP×${nextStage.hpMult} SPD×${nextStage.speedMult}`,
        color: 0xff00ff,
        portrait: this.ace.pokemonKey,
        action: () => this.evolveAce(),
      });
    }

    // Choice A: New companion (if slots available)
    if (this.companions.length < 5) {
      const poolIdx = this.companions.length % GameScene.COMPANION_POOL.length;
      const pool = GameScene.COMPANION_POOL[poolIdx];
      const nextType = pool.type;
      const pokeName = POKEMON_SPRITES[pool.key]?.name ?? pool.key;
      const typeDescs: Record<string, string> = {
        projectile: "Fires projectiles at enemies",
        orbital: "Orbits around you, contact damage",
        area: "Periodic area-of-effect damage",
      };
      choices.push({
        label: `+ ${pokeName}`,
        desc: typeDescs[nextType],
        color: 0x00ddff,
        portrait: pool.key,
        action: () => this.addCompanion(),
      });
    }

    // Choice B: Boost ATK
    choices.push({
      label: "ATK +25%",
      desc: `${this.ace.atk} → ${Math.floor(this.ace.atk * 1.25)}`,
      color: 0xf43f5e,
      portrait: this.ace.pokemonKey,
      action: () => {
        this.ace.atk = Math.floor(this.ace.atk * 1.25);
        this.companions.forEach((c) => (c.atk = Math.floor(c.atk * 1.15)));
      },
    });

    // Choice C: Boost HP + heal
    choices.push({
      label: "MAX HP +30",
      desc: `Heal to full (${this.ace.maxHp + 30} HP)`,
      color: 0x3bc95e,
      portrait: this.ace.pokemonKey,
      action: () => {
        this.ace.maxHp += 30;
        this.ace.hp = this.ace.maxHp;
      },
    });

    // Choice D: Speed + Range
    choices.push({
      label: "SPEED +20%",
      desc: `Move faster, attack faster`,
      color: 0xfbbf24,
      portrait: this.ace.pokemonKey,
      action: () => {
        this.ace.speed = Math.floor(this.ace.speed * 1.2);
        this.ace.attackCooldown = Math.max(200, this.ace.attackCooldown - 80);
      },
    });

    // Choice E: Critical Hit
    if (this.critChance < 0.5) {
      choices.push({
        label: "CRIT +10%",
        desc: `Crit chance: ${Math.round(this.critChance * 100)}% → ${Math.round((this.critChance + 0.1) * 100)}%`,
        color: 0xff6b6b,
        portrait: this.ace.pokemonKey,
        action: () => {
          this.critChance = Math.min(0.5, this.critChance + 0.1);
        },
      });
    }

    // Choice F: Lifesteal
    if (this.lifestealRate < 0.3) {
      choices.push({
        label: "LIFESTEAL +5%",
        desc: `Heal ${Math.round(this.lifestealRate * 100)}% → ${Math.round((this.lifestealRate + 0.05) * 100)}% of damage`,
        color: 0x22c55e,
        portrait: this.ace.pokemonKey,
        action: () => {
          this.lifestealRate = Math.min(0.3, this.lifestealRate + 0.05);
        },
      });
    }

    // Choice G: XP Magnet Range
    choices.push({
      label: "XP MAGNET +30",
      desc: `Pickup range: ${this.xpMagnetRange} → ${this.xpMagnetRange + 30}`,
      color: 0x818cf8,
      portrait: this.ace.pokemonKey,
      action: () => {
        this.xpMagnetRange += 30;
      },
    });

    // Shuffle and take max 3 choices
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    choices.length = Math.min(choices.length, 3);

    // Render choice cards
    const startY = 140;
    const cardH = 90;
    const gap = 15;

    choices.forEach((choice, i) => {
      const cy = startY + i * (cardH + gap);
      const hasPortrait = choice.portrait && this.textures.exists(`portrait-${choice.portrait}`);
      const textOffsetX = hasPortrait ? 30 : 0;

      // Card background
      const card = this.add
        .rectangle(GAME_WIDTH / 2, cy + cardH / 2, GAME_WIDTH - 40, cardH, 0x111118, 0.95)
        .setStrokeStyle(2, choice.color, 0.8)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true });
      this.levelUpContainer.add(card);

      // Portrait image (left side of card)
      if (hasPortrait) {
        const portrait = this.add
          .image(50, cy + cardH / 2, `portrait-${choice.portrait!}`)
          .setDisplaySize(48, 48)
          .setScrollFactor(0)
          .setDepth(501);
        this.levelUpContainer.add(portrait);
      }

      // Label
      const lbl = this.add
        .text(GAME_WIDTH / 2 + textOffsetX, cy + 25, choice.label, {
          fontFamily: "monospace",
          fontSize: "18px",
          color: `#${choice.color.toString(16).padStart(6, "0")}`,
        })
        .setOrigin(0.5)
        .setScrollFactor(0);
      this.levelUpContainer.add(lbl);

      // Description
      const desc = this.add
        .text(GAME_WIDTH / 2 + textOffsetX, cy + 55, choice.desc, {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#888",
        })
        .setOrigin(0.5)
        .setScrollFactor(0);
      this.levelUpContainer.add(desc);

      // Click handler
      card.on("pointerdown", () => {
        choice.action();
        this.closeLevelUpSelection();
      });

      // Hover effect
      card.on("pointerover", () => card.setFillStyle(0x1a1a25, 1));
      card.on("pointerout", () => card.setFillStyle(0x111118, 0.95));
    });
  }

  // ================================================================
  // KILL STREAK + PARTICLES
  // ================================================================

  private updateKillStreak(): void {
    // Reset streak if 2 seconds pass without a kill
    if (this.killStreak > 0 && this.time.now - this.lastKillTime > 2000) {
      this.killStreak = 0;
    }
  }

  private showStreakText(streak: number): void {
    const labels = ["", "", "", "", "", "", "", "", "", "",
      "COMBO x10!", "", "", "", "", "COMBO x15!", "", "", "", "",
      "RAMPAGE x20!", "", "", "", "", "MASSACRE x25!"];
    const label = labels[streak] ?? `COMBO x${streak}!`;
    const color = streak >= 20 ? "#f43f5e" : streak >= 15 ? "#fbbf24" : "#667eea";

    const txt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, label, {
        fontFamily: "monospace",
        fontSize: "20px",
        color,
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(250)
      .setScrollFactor(0);

    this.tweens.add({
      targets: txt,
      y: txt.y - 40,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 1200,
      ease: "Power2",
      onComplete: () => txt.destroy(),
    });
  }

  private spawnDeathParticles(x: number, y: number, isBoss: boolean): void {
    const count = isBoss ? 12 : 5;
    const color = isBoss ? 0xfbbf24 : 0xff6666;
    for (let i = 0; i < count; i++) {
      const p = this.add.circle(x, y, isBoss ? 4 : 2, color, 0.8).setDepth(50);
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * (isBoss ? 100 : 60);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 300 + Math.random() * 200,
        onComplete: () => p.destroy(),
      });
    }
  }

  // ================================================================
  // DAMAGE POPUPS
  // ================================================================

  private showDamagePopup(x: number, y: number, amount: number | string, color = "#fff"): void {
    const label = typeof amount === "string" ? amount : Math.ceil(amount).toString();
    // Reuse pooled text if available
    let txt = this.dmgPopups.pop();
    if (txt) {
      txt.setPosition(x, y - 10);
      txt.setText(label);
      txt.setStyle({ color });
      txt.setAlpha(1).setVisible(true);
    } else {
      txt = this.add
        .text(x, y - 10, label, {
          fontFamily: "monospace",
          fontSize: "12px",
          color,
          stroke: "#000",
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(300);
    }

    this.tweens.add({
      targets: txt,
      y: txt.y - 24,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        txt.setVisible(false);
        if (this.dmgPopups.length < 30) this.dmgPopups.push(txt);
        else txt.destroy();
      },
    });
  }

  private closeLevelUpSelection(): void {
    this.levelUpContainer.setVisible(false);
    this.levelUpContainer.removeAll(true);
    this.isPaused = false;
    this.pendingLevelUp = false;
  }

  // ================================================================
  // ACHIEVEMENTS
  // ================================================================

  /** Public getters for achievement checks */
  getKills(): number { return this.kills; }
  getWave(): number { return this.waveNumber; }
  getLevel(): number { return this.level; }
  getEvoStage(): number { return this.aceEvoStage; }
  getPartySize(): number { return 1 + this.companions.length; }
  getCycle(): number { return this.cycleNumber; }
  getStreak(): number { return this.killStreak; }

  private checkAchievements(): void {
    for (const ach of ACHIEVEMENTS) {
      if (this.saveData.unlockedAchievements.includes(ach.id)) continue;
      if (ach.check(this)) {
        this.saveData.unlockedAchievements.push(ach.id);
        this.achievementQueue.push(ach);
        saveSaveData(this.saveData);
      }
    }
    this.processAchievementQueue();
  }

  private processAchievementQueue(): void {
    if (this.showingAchievement || this.achievementQueue.length === 0) return;

    this.showingAchievement = true;
    const ach = this.achievementQueue.shift()!;

    // Achievement banner at top
    const banner = this.add
      .rectangle(GAME_WIDTH / 2, -40, GAME_WIDTH - 20, 50, 0x1a1a2e, 0.95)
      .setStrokeStyle(1, 0xfbbf24, 0.8)
      .setDepth(700)
      .setScrollFactor(0);

    const achText = this.add
      .text(GAME_WIDTH / 2, -40, `★ ${ach.name}\n${ach.desc}`, {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#fbbf24",
        align: "center",
        lineSpacing: 2,
      })
      .setOrigin(0.5)
      .setDepth(701)
      .setScrollFactor(0);

    // Slide in from top
    this.tweens.add({
      targets: [banner, achText],
      y: 70,
      duration: 400,
      ease: "Back.easeOut",
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: [banner, achText],
            y: -40,
            duration: 300,
            ease: "Cubic.easeIn",
            onComplete: () => {
              banner.destroy();
              achText.destroy();
              this.showingAchievement = false;
              this.processAchievementQueue();
            },
          });
        });
      },
    });
  }

  private saveHighScore(): void {
    const hs = this.saveData.highScore;
    let changed = false;
    if (this.kills > hs.kills) { hs.kills = this.kills; changed = true; }
    if (this.waveNumber > hs.wave) { hs.wave = this.waveNumber; changed = true; }
    if (this.level > hs.level) { hs.level = this.level; changed = true; }
    if (this.cycleNumber > hs.cycle) { hs.cycle = this.cycleNumber; changed = true; }
    if (this.totalSurvivalTime > (hs.totalTime ?? 0)) { hs.totalTime = Math.floor(this.totalSurvivalTime); changed = true; }
    if (changed) saveSaveData(this.saveData);
  }
}
