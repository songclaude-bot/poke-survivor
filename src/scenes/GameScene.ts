/**
 * GameScene — main gameplay orchestrator.
 * State lives here; logic is delegated to manager modules.
 */
import Phaser from "phaser";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  CYCLE_DURATION_SEC,
  MAX_ENEMIES,
  XP_PER_LEVEL_BASE,
  COLORS,
} from "../config";
import {
  POKEMON_SPRITES,
  getDirectionFromVelocity,
  pacTexKey,
} from "../sprites/PmdSpriteLoader";
import { sfx, BGM_TRACKS } from "../audio/SfxManager";
import {
  type SaveData,
  loadSaveData,
  saveSaveData,
  checkStarterUnlocks,
  ALL_STARTERS,
  STARTER_SKILLS,
} from "../data/SaveData";

import type {
  AceData, EnemyData, ProjectileData, CompanionData,
  XpGem, ItemDrop, LegionData, LegionEntity, CyclePassData,
  Achievement, GameStats, EnemyProjectile,
} from "../data/GameTypes";
import {
  EVOLUTION_CHAINS, ENEMY_POOL, BOSS_POOL, COMPANION_POOL, ACHIEVEMENTS,
  getBehavior, getDungeonName, getDifficultyLabel, formatTime,
  CYCLE_TILES,
} from "../data/GameData";

// Managers
import type { GameContext } from "../managers/GameContext";
import {
  drawHUD, updateDangerVignette, showWarning,
  showDamagePopup, spawnDeathParticles,
} from "../managers/UIManager";
import {
  updateEnemies, updateEnemyProjectiles, cleanupEnemy,
  spawnEnemy, spawnFormationEnemy, spawnMiniBoss, spawnBoss,
  spawnEncirclement, spawnDiagonalMarch, spawnRushSwarm,
} from "../managers/EnemyManager";
import {
  addCompanion, updateCompanions, evolveCompanion, updateLegions,
} from "../managers/CompanionManager";
import {
  updateAceAutoAttack, fireProjectile, updateProjectiles,
  onProjectileHitEnemy, damageAce, onEnemyDeath,
  updateXpGemMagnet, collectXpGem, updateItems,
  updateSkillEffects, findNearestEnemy, updateKillStreak,
  evolveAce,
} from "../managers/CombatManager";

// ================================================================
// SCENE
// ================================================================

export class GameScene extends Phaser.Scene {
  // -- Entity arrays --
  private ace!: AceData;
  private enemies: EnemyData[] = [];
  private projectiles: ProjectileData[] = [];
  private companions: CompanionData[] = [];
  private xpGems: XpGem[] = [];
  private items: ItemDrop[] = [];
  private enemyProjectiles: EnemyProjectile[] = [];

  // -- Phaser groups --
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private projectileGroup!: Phaser.Physics.Arcade.Group;
  private xpGemGroup!: Phaser.Physics.Arcade.Group;
  private itemGroup!: Phaser.Physics.Arcade.Group;

  // -- Joystick --
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
  private cycleTransitioning = false;

  // -- Level-up --
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
  private totalSurvivalTime = 0;

  // -- Dodge --
  private isDodging = false;
  private dodgeTimer = 0;
  private dodgeCooldown = 0;
  private static readonly DODGE_DURATION = 0.25;
  private static readonly DODGE_COOLDOWN = 1.5;
  private static readonly DODGE_SPEED = 400;

  // -- Evolution --
  private aceEvoStage = 0;

  // -- Combat perks --
  private critChance = 0;
  private lifestealRate = 0;
  private xpMagnetRange = 60;

  // -- Skill state --
  private skillId = "";
  private skillTimer = 0;
  private flashFireStacks = 0;
  private speedBoostStacks = 0;
  private unburdenTimer = 0;
  private sturdyAvailable = true;
  private phaseTimer = 0;
  private adaptabilityMult = 1;
  private companionEvoStages: Map<string, number> = new Map();

  // -- Wave system --
  private waveNumber = 0;
  private waveTimer = 0;
  private waveRestTimer = 0;
  private waveEnemiesRemaining = 0;
  private inWaveRest = false;

  // -- UI --
  private hpBar!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;
  private timerText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private cycleText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private dodgeBtn!: Phaser.GameObjects.Text;
  private dmgPopups: Phaser.GameObjects.Text[] = [];
  private pauseContainer!: Phaser.GameObjects.Container;
  private manualPause = false;
  private dangerVignette!: Phaser.GameObjects.Graphics;
  private minimapGfx!: Phaser.GameObjects.Graphics;
  private aimGfx!: Phaser.GameObjects.Graphics;
  private starGfx!: Phaser.GameObjects.Graphics;

  // -- Save / achievements --
  private saveData: SaveData = loadSaveData();
  private achievementQueue: Achievement[] = [];
  private showingAchievement = false;

  // -- Starter --
  private starterKey = "pikachu";

  constructor() {
    super({ key: "GameScene" });
  }

  // ================================================================
  // CONTEXT — snapshot for managers
  // ================================================================

  private get ctx(): GameContext {
    return {
      scene: this,
      ace: this.ace,
      enemies: this.enemies,
      projectiles: this.projectiles,
      companions: this.companions,
      xpGems: this.xpGems,
      items: this.items,
      enemyProjectiles: this.enemyProjectiles,
      legionEntities: this.legionEntities,
      legions: this.legions,
      enemyGroup: this.enemyGroup,
      projectileGroup: this.projectileGroup,
      xpGemGroup: this.xpGemGroup,
      itemGroup: this.itemGroup,
      xp: this.xp,
      level: this.level,
      xpToNext: this.xpToNext,
      kills: this.kills,
      killStreak: this.killStreak,
      lastKillTime: this.lastKillTime,
      cycleTimer: this.cycleTimer,
      spawnTimer: this.spawnTimer,
      isPaused: this.isPaused,
      pendingLevelUp: this.pendingLevelUp,
      totalSurvivalTime: this.totalSurvivalTime,
      cycleNumber: this.cycleNumber,
      starterKey: this.starterKey,
      waveNumber: this.waveNumber,
      waveTimer: this.waveTimer,
      waveRestTimer: this.waveRestTimer,
      waveEnemiesRemaining: this.waveEnemiesRemaining,
      inWaveRest: this.inWaveRest,
      boss: this.boss,
      bossSpawned: this.bossSpawned,
      bossWarningShown: this.bossWarningShown,
      isDodging: this.isDodging,
      dodgeTimer: this.dodgeTimer,
      dodgeCooldown: this.dodgeCooldown,
      aceEvoStage: this.aceEvoStage,
      companionEvoStages: this.companionEvoStages,
      critChance: this.critChance,
      lifestealRate: this.lifestealRate,
      xpMagnetRange: this.xpMagnetRange,
      skillId: this.skillId,
      skillTimer: this.skillTimer,
      flashFireStacks: this.flashFireStacks,
      speedBoostStacks: this.speedBoostStacks,
      unburdenTimer: this.unburdenTimer,
      sturdyAvailable: this.sturdyAvailable,
      phaseTimer: this.phaseTimer,
      adaptabilityMult: this.adaptabilityMult,
      saveData: this.saveData,
      achievementQueue: this.achievementQueue,
      showingAchievement: this.showingAchievement,
      hpBar: this.hpBar,
      xpBar: this.xpBar,
      timerText: this.timerText,
      killText: this.killText,
      levelText: this.levelText,
      cycleText: this.cycleText,
      waveText: this.waveText,
      bossHpBar: this.bossHpBar,
      bossNameText: this.bossNameText,
      minimapGfx: this.minimapGfx,
      aimGfx: this.aimGfx,
      dangerVignette: this.dangerVignette,
      levelUpContainer: this.levelUpContainer,
      pauseContainer: this.pauseContainer,
      joyBase: this.joyBase,
      joyThumb: this.joyThumb,
      joyPointer: this.joyPointer,
      joyVector: this.joyVector,
      dmgPopups: this.dmgPopups,
      // Callbacks
      onEnemyDeath: (enemy) => this.handleEnemyDeath(enemy),
      damageAce: (amount) => this.handleDamageAce(amount),
      fireProjectile: (fx, fy, tx, ty, d) => fireProjectile(this.ctx, fx, fy, tx, ty, d),
      findNearestEnemy: (x, y, r) => findNearestEnemy(this.ctx, x, y, r),
      showDamagePopup: (x, y, a, c) => showDamagePopup(this.ctx, x, y, a, c),
      collectXpGem: (gem) => this.handleCollectXpGem(gem),
    };
  }

  /** Sync mutable context fields back into scene state */
  private syncBack(c: GameContext): void {
    this.xp = c.xp;
    this.level = c.level;
    this.xpToNext = c.xpToNext;
    this.kills = c.kills;
    this.killStreak = c.killStreak;
    this.lastKillTime = c.lastKillTime;
    this.spawnTimer = c.spawnTimer;
    this.isPaused = c.isPaused;
    this.pendingLevelUp = c.pendingLevelUp;
    this.waveNumber = c.waveNumber;
    this.waveTimer = c.waveTimer;
    this.waveRestTimer = c.waveRestTimer;
    this.waveEnemiesRemaining = c.waveEnemiesRemaining;
    this.inWaveRest = c.inWaveRest;
    this.boss = c.boss;
    this.bossSpawned = c.bossSpawned;
    this.bossWarningShown = c.bossWarningShown;
    this.aceEvoStage = c.aceEvoStage;
    this.critChance = c.critChance;
    this.lifestealRate = c.lifestealRate;
    this.xpMagnetRange = c.xpMagnetRange;
    this.skillTimer = c.skillTimer;
    this.flashFireStacks = c.flashFireStacks;
    this.speedBoostStacks = c.speedBoostStacks;
    this.unburdenTimer = c.unburdenTimer;
    this.sturdyAvailable = c.sturdyAvailable;
    this.phaseTimer = c.phaseTimer;
    this.showingAchievement = c.showingAchievement;
  }

  // ================================================================
  // LIFECYCLE
  // ================================================================

  init(data?: CyclePassData): void {
    this.cycleTransitioning = false;
    if (data?.cycleNumber) this.cycleNumber = data.cycleNumber;
    if (data?.legions) this.legions = [...data.legions];
    if (data?.starterKey) this.starterKey = data.starterKey;
    if (data?.totalTime) this.totalSurvivalTime = data.totalTime;
  }

  create(): void {
    this.resetState();
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.createStarfield();
    this.createAce();
    this.createLegions();
    this.createUI();
    this.createJoystick();
    this.createPhysicsGroups();
    this.setupCollisions();
    this.createDangerVignette();
    sfx.startBgm();

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.ace.sprite, true, 0.1, 0.1);
    this.cameras.main.fadeIn(500, 0, 0, 0);

    if (this.cycleNumber === 1) this.showTutorial();
  }

  // ================================================================
  // UPDATE LOOP
  // ================================================================

  update(_time: number, delta: number): void {
    if (this.isPaused) return;
    const dt = delta / 1000;
    const c = this.ctx;

    this.updateTimer(dt);
    this.updateAceMovement(dt);
    this.updateEnemySpawning(dt);

    updateEnemies(c, dt);
    updateAceAutoAttack(c);
    updateCompanions(c, dt);
    updateLegions(c, dt);
    updateProjectiles(c);
    updateEnemyProjectiles(c, dt);
    updateXpGemMagnet(c);
    updateItems(c, dt);
    updateKillStreak(c);
    updateSkillEffects(c, dt);

    this.syncBack(c);

    // Handle pending level-up
    if (this.pendingLevelUp) {
      this.showLevelUpSelection();
    }

    // Handle ace death
    if (this.ace.hp <= 0 && !this.isPaused) {
      this.ace.hp = 0;
      this.onAceDeath();
      return;
    }

    this.checkAchievements();
    updateDangerVignette(c);
    drawHUD(c);
  }

  // ================================================================
  // CALLBACK HANDLERS (bridge between managers and scene)
  // ================================================================

  private handleEnemyDeath(enemy: EnemyData): void {
    const wasBoss = enemy === this.boss;
    onEnemyDeath(this.ctx, enemy);
    this.syncBack(this.ctx);
    if (wasBoss) this.onBossDefeated();
  }

  private handleDamageAce(amount: number): void {
    damageAce(this.ctx, amount);
    this.syncBack(this.ctx);
    if (this.ace.hp <= 0 && !this.isPaused) {
      this.ace.hp = 0;
      this.onAceDeath();
    }
  }

  private handleCollectXpGem(gem: XpGem): void {
    collectXpGem(this.ctx, gem);
    this.syncBack(this.ctx);
  }

  // ================================================================
  // SETUP
  // ================================================================

  private resetState(): void {
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
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
    this.isDodging = false;
    this.dodgeTimer = 0;
    this.dodgeCooldown = 0;
    this.critChance = 0;
    this.lifestealRate = 0;
    this.xpMagnetRange = 60;
    this.legionEntities = [];
  }

  private getDungeonTileKey(): string {
    const idx = Math.min(this.cycleNumber - 1, CYCLE_TILES.length - 1);
    const key = CYCLE_TILES[idx];
    return this.textures.exists(key) ? key : "dungeon-floor";
  }

  private createStarfield(): void {
    const tileKey = this.getDungeonTileKey();
    if (this.textures.exists(tileKey)) {
      const tex = this.textures.get(tileKey);
      const tw = tex.getSourceImage().width;
      const th = tex.getSourceImage().height;
      for (let ty = 0; ty < WORLD_HEIGHT; ty += th) {
        for (let tx = 0; tx < WORLD_WIDTH; tx += tw) {
          this.add.image(tx, ty, tileKey).setOrigin(0, 0).setDepth(-10);
        }
      }
    }
    this.starGfx = this.add.graphics().setDepth(-10);
    this.placeWorldDecorations();
  }

  private placeWorldDecorations(): void {
    const gfx = this.add.graphics().setDepth(-5);
    const rng = new Phaser.Math.RandomDataGenerator([`${this.cycleNumber}`]);
    for (let i = 0; i < 200; i++) {
      const x = rng.between(50, WORLD_WIDTH - 50);
      const y = rng.between(50, WORLD_HEIGHT - 50);
      const type = rng.between(0, 3);
      if (type === 0) {
        gfx.fillStyle(0x555566, 0.35);
        gfx.fillCircle(x, y, 4 + rng.between(0, 3));
        gfx.fillCircle(x + 5, y + 3, 3);
      } else if (type === 1) {
        gfx.fillStyle(0x3a6b35, 0.25);
        gfx.fillTriangle(x, y, x - 3, y + 6, x + 3, y + 6);
        gfx.fillTriangle(x + 4, y + 1, x + 1, y + 7, x + 7, y + 7);
      } else if (type === 2) {
        gfx.lineStyle(1, 0x000000, 0.15);
        const len = 8 + rng.between(0, 12);
        const angle = rng.realInRange(0, Math.PI);
        gfx.lineBetween(x, y, x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      } else {
        gfx.fillStyle(0x000000, 0.12);
        gfx.fillCircle(x, y, 2 + rng.between(0, 2));
      }
    }
  }

  private static get STARTER_STATS(): Record<string, { hp: number; atk: number; speed: number; range: number; cooldown: number }> {
    const map: Record<string, { hp: number; atk: number; speed: number; range: number; cooldown: number }> = {};
    for (const s of ALL_STARTERS) {
      map[s.key] = { hp: s.hp, atk: s.atk, speed: s.speed, range: s.range, cooldown: s.cooldown };
    }
    return map;
  }

  private createAce(): void {
    const aceKey = this.starterKey;
    const texKey = pacTexKey(aceKey);
    const usePmd = this.textures.exists(texKey);
    const sprite = this.physics.add.sprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, usePmd ? texKey : "ace");
    sprite.setDepth(10).setCollideWorldBounds(true);
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

    this.skillId = STARTER_SKILLS[aceKey]?.effectId ?? "";
    this.skillTimer = 0;
    this.flashFireStacks = 0;
    this.speedBoostStacks = 0;
    this.unburdenTimer = 0;
    this.sturdyAvailable = true;
    this.phaseTimer = 0;
    this.adaptabilityMult = this.skillId === "adaptability" ? 1.2 : 1;

    if (this.skillId === "guts") {
      this.ace.atk = Math.floor(this.ace.atk * 1.5);
      this.ace.speed = Math.floor(this.ace.speed * 0.8);
      this.ace.attackRange = Math.max(60, this.ace.attackRange - 30);
    }
  }

  private createLegions(): void {
    this.legionEntities = [];
    for (let i = 0; i < this.legions.length; i++) {
      const legion = this.legions[i];
      const gfx = this.add.graphics().setDepth(4);
      this.legionEntities.push({
        data: legion,
        gfx,
        orbitAngle: (i * Math.PI * 2) / Math.max(this.legions.length, 1),
        orbitDist: 70 + i * 20,
        lastAttackTime: 0,
        attackInterval: Math.max(500, 2000 - legion.dps * 20),
        attackRange: 100 + Math.min(legion.dps, 50),
      });
    }
  }

  private createUI(): void {
    this.hpBar = this.add.graphics().setDepth(100).setScrollFactor(0);
    this.xpBar = this.add.graphics().setDepth(100).setScrollFactor(0);

    this.timerText = this.add.text(GAME_WIDTH / 2, 8, "5:00", {
      fontFamily: "monospace", fontSize: "16px", color: "#e0e0e0",
    }).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);

    this.killText = this.add.text(GAME_WIDTH - 8, GAME_HEIGHT - 12, "Kill: 0", {
      fontFamily: "monospace", fontSize: "12px", color: "#888",
    }).setOrigin(1, 1).setDepth(100).setScrollFactor(0);

    this.levelText = this.add.text(8, 28, "Lv.1", {
      fontFamily: "monospace", fontSize: "13px", color: "#667eea",
    }).setOrigin(0, 0).setDepth(100).setScrollFactor(0);

    this.cycleText = this.add.text(GAME_WIDTH - 8, 8, `Cycle ${this.cycleNumber}`, {
      fontFamily: "monospace", fontSize: "12px", color: "#fbbf24",
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

    this.waveText = this.add.text(GAME_WIDTH - 8, 24, "", {
      fontFamily: "monospace", fontSize: "11px", color: "#a78bfa",
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

    this.dodgeBtn = this.add.text(0, 0, "", { fontFamily: "monospace", fontSize: "1px" })
      .setVisible(false).setScrollFactor(0);

    this.bossHpBar = this.add.graphics().setDepth(100).setScrollFactor(0).setVisible(false);
    this.bossNameText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, "", {
      fontFamily: "monospace", fontSize: "12px", color: "#ff00ff",
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0).setVisible(false);

    this.minimapGfx = this.add.graphics().setDepth(99).setScrollFactor(0);
    this.aimGfx = this.add.graphics().setDepth(8);

    const pauseBtn = this.add.text(GAME_WIDTH - 36, 44, "\u275A\u275A", {
      fontFamily: "monospace", fontSize: "18px", color: "#888",
    }).setOrigin(0.5).setDepth(101).setScrollFactor(0).setInteractive({ useHandCursor: true });
    pauseBtn.on("pointerdown", () => this.togglePause());

    this.pauseContainer = this.add.container(0, 0).setDepth(600).setScrollFactor(0).setVisible(false);
    this.levelUpContainer = this.add.container(0, 0).setDepth(500).setScrollFactor(0).setVisible(false);
  }

  private createJoystick(): void {
    const jx = GAME_WIDTH / 2;
    const jy = GAME_HEIGHT - 100;
    this.joyBase = this.add.sprite(jx, jy, "joy-base").setDepth(90).setScrollFactor(0).setAlpha(0.4);
    this.joyThumb = this.add.sprite(jx, jy, "joy-thumb").setDepth(91).setScrollFactor(0);

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.isPaused) return;
      this.joyPointer = p;
      this.joyBase.setAlpha(0.6);
      this.updateJoystick(p);
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
        this.joyBase.setAlpha(0.4);
      }
    });
  }

  private updateJoystick(p: Phaser.Input.Pointer): void {
    const maxDist = 50;
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
    this.physics.add.overlap(this.projectileGroup, this.enemyGroup, (projObj, enemyObj) => {
      const proj = this.projectiles.find((p) => p.sprite === projObj);
      const enemy = this.enemies.find((e) => e.sprite === enemyObj);
      if (proj && enemy) onProjectileHitEnemy(this.ctx, proj, enemy);
    });
    this.physics.add.overlap(this.ace.sprite, this.xpGemGroup, (_aceObj, gemObj) => {
      const gem = this.xpGems.find((g) => g.sprite === gemObj);
      if (gem) this.handleCollectXpGem(gem);
    });
  }

  private createDangerVignette(): void {
    this.dangerVignette = this.add.graphics().setDepth(95).setScrollFactor(0);
    this.dangerVignette.setAlpha(0);
  }

  private showTutorial(): void {
    this.isPaused = true;
    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8)
      .setScrollFactor(0).setDepth(500);
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2,
      ["HOW TO PLAY", "", "Drag anywhere to move", "Auto-attack nearest enemy",
       "Collect XP gems to level up", "Survive waves & defeat the boss!", "", "[ Tap to Start ]"].join("\n"),
      { fontFamily: "monospace", fontSize: "14px", color: "#fff", align: "center", lineSpacing: 6 },
    ).setOrigin(0.5).setScrollFactor(0).setDepth(501);
    overlay.setInteractive();
    overlay.once("pointerdown", () => { overlay.destroy(); text.destroy(); this.isPaused = false; });
  }

  // ================================================================
  // TIMER
  // ================================================================

  private updateTimer(dt: number): void {
    this.cycleTimer -= dt;
    if (this.cycleTimer <= 0) this.cycleTimer = 0;
    this.totalSurvivalTime += dt;

    const elapsed = CYCLE_DURATION_SEC - this.cycleTimer;

    if (elapsed >= 180 && !this.bossWarningShown) {
      this.bossWarningShown = true;
      sfx.playBossWarning();
      sfx.switchBgm(BGM_TRACKS.danger);
      showWarning(this.ctx, "WARNING!");
    }

    if (elapsed >= 240 && !this.bossSpawned) {
      this.bossSpawned = true;
      spawnBoss(this.ctx);
      this.syncBack(this.ctx);
    }

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

  private updateAceMovement(dt: number): void {
    if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;
    if (this.isDodging) {
      this.dodgeTimer -= dt;
      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
        this.ace.sprite.setAlpha(1);
      }
    }

    if (this.dodgeCooldown > 0) {
      this.dodgeBtn.setAlpha(0.2).setColor("#666");
    } else {
      this.dodgeBtn.setAlpha(0.6).setColor("#667eea");
    }

    if (this.isDodging) return;

    const vx = this.joyVector.x * this.ace.speed;
    const vy = this.joyVector.y * this.ace.speed;
    this.ace.sprite.setVelocity(vx, vy);

    const curTexKey = this.ace.sprite.texture.key;
    if (curTexKey.startsWith("pac-")) {
      const spriteKey = curTexKey.replace("pac-", "");
      if (Math.abs(vx) > 1 || Math.abs(vy) > 1) {
        const dir = getDirectionFromVelocity(vx, vy);
        const animKey = `${spriteKey}-walk-${dir}`;
        if (this.ace.sprite.anims.currentAnim?.key !== animKey) {
          this.ace.sprite.play(animKey);
        }
      }
    }
  }

  // ================================================================
  // ENEMY SPAWNING (wave orchestration)
  // ================================================================

  private updateEnemySpawning(dt: number): void {
    const elapsed = CYCLE_DURATION_SEC - this.cycleTimer;

    if (this.inWaveRest) {
      this.waveRestTimer -= dt;
      this.waveText.setText(`Next wave in ${Math.ceil(this.waveRestTimer)}s`);
      if (this.waveRestTimer <= 0) {
        this.inWaveRest = false;
        this.startNextWave(elapsed);
      }
      return;
    }

    if (this.waveNumber === 0) {
      this.startNextWave(elapsed);
      return;
    }

    if (this.waveEnemiesRemaining <= 0 && this.enemies.length === 0) {
      this.inWaveRest = true;
      this.waveRestTimer = Math.max(1, 3 - (this.cycleNumber - 1) * 0.3);
      this.showWaveClearText();
      return;
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;

    const cycleSpeedUp = Math.min(0.4, (this.cycleNumber - 1) * 0.08);
    const spawnInterval = Math.max(0.15, 1.2 - this.waveNumber * 0.08 - cycleSpeedUp);
    this.spawnTimer = spawnInterval;

    if (this.enemies.length >= MAX_ENEMIES || this.waveEnemiesRemaining <= 0) return;

    const batchSize = Math.min(this.waveEnemiesRemaining, 1 + Math.floor(this.waveNumber / 4) + Math.floor(this.cycleNumber / 3));
    for (let i = 0; i < batchSize; i++) {
      if (this.waveEnemiesRemaining <= 0) break;
      spawnEnemy(this.ctx, elapsed);
      this.waveEnemiesRemaining--;
    }
  }

  private startNextWave(elapsed: number): void {
    this.waveNumber++;
    if (this.skillId === "sturdy") this.sturdyAvailable = true;
    this.waveEnemiesRemaining = 5 + this.waveNumber * 3 + this.cycleNumber * 2;
    this.waveText.setText(`Wave ${this.waveNumber}`);

    if (this.waveNumber >= 3 && this.waveNumber % 3 === 0) {
      spawnMiniBoss(this.ctx, elapsed);
    } else {
      showWarning(this.ctx, `Wave ${this.waveNumber}`);
    }

    if (this.waveNumber >= 2 && this.waveNumber % 2 === 0) {
      const formationType = Math.floor(Math.random() * 3);
      if (formationType === 0) spawnEncirclement(this.ctx, elapsed);
      else if (formationType === 1) spawnDiagonalMarch(this.ctx, elapsed);
      else spawnRushSwarm(this.ctx, elapsed);
    }
  }

  private showWaveClearText(): void {
    if (this.waveNumber > 0 && this.waveNumber % 5 === 0) {
      for (const c of this.companions) {
        evolveCompanion(this.ctx, c);
      }
    }

    for (const gem of this.xpGems) {
      if (!gem.sprite.active) continue;
      const angle = Math.atan2(this.ace.sprite.y - gem.sprite.y, this.ace.sprite.x - gem.sprite.x);
      gem.sprite.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
    }

    this.ace.hp = Math.min(this.ace.hp + Math.floor(this.ace.maxHp * 0.1), this.ace.maxHp);

    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "WAVE CLEAR!", {
      fontFamily: "monospace", fontSize: "20px", color: "#a78bfa", stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200).setScrollFactor(0);
    this.tweens.add({ targets: txt, y: txt.y - 40, alpha: 0, duration: 1500, onComplete: () => txt.destroy() });
  }

  // ================================================================
  // PAUSE
  // ================================================================

  private togglePause(): void {
    if (this.pendingLevelUp) return;
    if (this.manualPause) this.resumeGame();
    else this.showPauseMenu();
  }

  private showPauseMenu(): void {
    this.manualPause = true;
    this.isPaused = true;
    this.pauseContainer.removeAll(true);
    this.pauseContainer.setVisible(true);

    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8).setScrollFactor(0);
    this.pauseContainer.add(overlay);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, "PAUSED", {
      fontFamily: "monospace", fontSize: "28px", color: "#667eea", stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0);
    this.pauseContainer.add(title);

    const resumeBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "[ Resume ]", {
      fontFamily: "monospace", fontSize: "18px", color: "#3bc95e",
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
    resumeBtn.on("pointerdown", () => this.resumeGame());
    resumeBtn.on("pointerover", () => resumeBtn.setColor("#4ade80"));
    resumeBtn.on("pointerout", () => resumeBtn.setColor("#3bc95e"));
    this.pauseContainer.add(resumeBtn);

    const volLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, "Volume", {
      fontFamily: "monospace", fontSize: "12px", color: "#888",
    }).setOrigin(0.5).setScrollFactor(0);
    this.pauseContainer.add(volLabel);

    const volDown = this.add.text(GAME_WIDTH / 2 - 60, GAME_HEIGHT / 2 + 80, "[ - ]", {
      fontFamily: "monospace", fontSize: "16px", color: "#fbbf24",
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
    volDown.on("pointerdown", () => sfx.adjustVolume(-0.1));
    this.pauseContainer.add(volDown);

    const volUp = this.add.text(GAME_WIDTH / 2 + 60, GAME_HEIGHT / 2 + 80, "[ + ]", {
      fontFamily: "monospace", fontSize: "16px", color: "#fbbf24",
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
    volUp.on("pointerdown", () => sfx.adjustVolume(0.1));
    this.pauseContainer.add(volUp);

    const menuBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130, "[ Main Menu ]", {
      fontFamily: "monospace", fontSize: "16px", color: "#f43f5e",
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
    menuBtn.on("pointerdown", () => {
      sfx.stopBgm();
      this.scene.start("LobbyScene", { coins: this.getEarnedCoins() });
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

  // ================================================================
  // DEATH
  // ================================================================

  private onAceDeath(): void {
    this.isPaused = true;
    sfx.stopBgm();
    sfx.playDeath();
    this.saveHighScore();

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setDepth(300).setScrollFactor(0);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, "DEFEATED", {
      fontFamily: "monospace", fontSize: "28px", color: "#f43f5e", stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

    const evoName = EVOLUTION_CHAINS[this.ace.pokemonKey]?.[this.aceEvoStage]?.name ?? this.ace.pokemonKey;
    const totalTimeStr = formatTime(this.totalSurvivalTime);
    const diffLabel = getDifficultyLabel(this.cycleNumber);
    const statsLines = [
      `${evoName}  Lv.${this.level}`, "",
      `Kills: ${this.kills}    Wave: ${this.waveNumber}`,
      `Cycle: ${this.cycleNumber}    Party: ${this.companions.length + 1}`,
      `Total Time: ${totalTimeStr}`,
      diffLabel ? `Difficulty: ${diffLabel}` : "",
    ].filter(Boolean);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 15, statsLines.join("\n"), {
      fontFamily: "monospace", fontSize: "13px", color: "#ccc", align: "center", lineSpacing: 4,
    }).setOrigin(0.5, 0).setDepth(301).setScrollFactor(0);

    const hs = this.saveData.highScore;
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 105,
      `Best: Kill ${hs.kills} / Wave ${hs.wave} / Lv.${hs.level}`, {
      fontFamily: "monospace", fontSize: "10px", color: "#fbbf24", align: "center",
    }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

    const retry = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140, "[ Tap to Retry ]", {
      fontFamily: "monospace", fontSize: "16px", color: "#667eea",
    }).setOrigin(0.5).setDepth(301).setScrollFactor(0);
    this.tweens.add({ targets: retry, alpha: 0.3, yoyo: true, repeat: -1, duration: 800 });
    this.input.once("pointerdown", () => {
      this.scene.start("LobbyScene", { coins: this.getEarnedCoins() });
    });
  }

  // ================================================================
  // BOSS DEFEATED / CYCLE TRANSITION
  // ================================================================

  private onBossDefeated(): void {
    this.boss = null;
    this.isPaused = true;
    sfx.stopBgm();
    sfx.playStageClear();
    this.time.delayedCall(500, () => sfx.startBgm(BGM_TRACKS.victory));

    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xfbbf24, 0.2)
      .setDepth(200).setScrollFactor(0);
    this.tweens.add({ targets: flash, alpha: 0, duration: 1000, onComplete: () => flash.destroy() });
    this.time.delayedCall(800, () => this.showCycleClear());
  }

  private showCycleClear(): void {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85)
      .setDepth(400).setScrollFactor(0);

    this.add.text(GAME_WIDTH / 2, 80, "STAGE CLEAR!", {
      fontFamily: "monospace", fontSize: "24px", color: "#fbbf24", stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(401).setScrollFactor(0);

    const evoName = EVOLUTION_CHAINS[this.ace.pokemonKey]?.[this.aceEvoStage]?.name ?? "Pikachu";
    const totalDps = this.ace.atk + this.companions.reduce((sum, c) => sum + c.atk, 0);
    const stats = [
      `Cycle ${this.cycleNumber} Complete`, "",
      `Ace: ${evoName}  Lv.${this.level}`,
      `Kills: ${this.kills}  Waves: ${this.waveNumber}`,
      `Party DPS: ${totalDps}`,
      `Time: ${formatTime(CYCLE_DURATION_SEC - this.cycleTimer)}`,
    ].join("\n");
    this.add.text(GAME_WIDTH / 2, 140, stats, {
      fontFamily: "monospace", fontSize: "14px", color: "#ccc", align: "center", lineSpacing: 6,
    }).setOrigin(0.5, 0).setDepth(401).setScrollFactor(0);

    const legionColor = [0xffd700, 0x00ddff, 0xff4444][this.cycleNumber % 3];
    this.add.text(GAME_WIDTH / 2, 260, "\u2014 LEGION FORMED \u2014", {
      fontFamily: "monospace", fontSize: "16px", color: "#667eea",
    }).setOrigin(0.5).setDepth(401).setScrollFactor(0);

    const companionNames = this.companions.map((c) => {
      const key = c.sprite.texture.key.replace("pac-", "");
      return POKEMON_SPRITES[key]?.name ?? key;
    });
    this.add.text(GAME_WIDTH / 2, 300, `${evoName} + ${companionNames.join(", ") || "Solo"}`, {
      fontFamily: "monospace", fontSize: "12px", color: "#aaa",
    }).setOrigin(0.5).setDepth(401).setScrollFactor(0);

    this.legions.push({ ace: evoName, companions: companionNames, dps: totalDps, color: legionColor });

    const btnBg = this.add.rectangle(GAME_WIDTH / 2, 400, 200, 50, 0x667eea, 0.9)
      .setDepth(401).setScrollFactor(0).setInteractive({ useHandCursor: true });
    const btnText = this.add.text(GAME_WIDTH / 2, 400, "NEXT CYCLE \u2192", {
      fontFamily: "monospace", fontSize: "16px", color: "#fff",
    }).setOrigin(0.5).setDepth(402).setScrollFactor(0);
    this.tweens.add({ targets: [btnBg, btnText], alpha: 0.5, yoyo: true, repeat: -1, duration: 800 });
    btnBg.on("pointerdown", () => this.startNextCycle());
    this.time.delayedCall(2000, () => {
      this.input.once("pointerdown", () => this.startNextCycle());
    });
  }

  private startNextCycle(): void {
    if (this.cycleTransitioning) return;
    this.cycleTransitioning = true;
    sfx.stopBgm();
    const nextCycle = this.cycleNumber + 1;
    const savedLegions = [...this.legions];
    this.scene.stop("GameScene");
    this.scene.start("GameScene", {
      cycleNumber: nextCycle,
      legions: savedLegions,
      starterKey: this.starterKey,
      totalTime: this.totalSurvivalTime,
    });
  }

  // ================================================================
  // LEVEL-UP SELECTION
  // ================================================================

  private showLevelUpSelection(): void {
    this.isPaused = true;
    this.pendingLevelUp = false; // Consumed

    this.ace.sprite.setVelocity(0, 0);
    this.joyVector.set(0, 0);
    this.joyPointer = null;
    this.joyThumb.setPosition(this.joyBase.x, this.joyBase.y);
    this.joyBase.setAlpha(0.3);

    this.levelUpContainer.removeAll(true);
    this.levelUpContainer.setVisible(true);

    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setScrollFactor(0);
    this.levelUpContainer.add(overlay);

    const title = this.add.text(GAME_WIDTH / 2, 60, `LEVEL ${this.level}!`, {
      fontFamily: "monospace", fontSize: "22px", color: "#fbbf24", stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0);
    this.levelUpContainer.add(title);

    type Choice = { label: string; desc: string; action: () => void; color: number; portrait?: string };
    const choices: Choice[] = [];

    // Evolution
    const evoChain = EVOLUTION_CHAINS[this.ace.pokemonKey];
    if (evoChain && this.aceEvoStage < evoChain.length - 1 && this.level >= (this.aceEvoStage + 1) * 5) {
      const nextStage = evoChain[this.aceEvoStage + 1];
      choices.push({
        label: `EVOLVE \u2192 ${nextStage.name}`,
        desc: `ATK\u00d7${nextStage.atkMult} HP\u00d7${nextStage.hpMult} SPD\u00d7${nextStage.speedMult}`,
        color: 0xff00ff,
        portrait: this.ace.pokemonKey,
        action: () => evolveAce(this.ctx),
      });
    }

    // Companion
    if (this.companions.length < 5) {
      const poolIdx = this.companions.length % COMPANION_POOL.length;
      const pool = COMPANION_POOL[poolIdx];
      const pokeName = POKEMON_SPRITES[pool.key]?.name ?? pool.key;
      const typeDescs: Record<string, string> = {
        projectile: "Fires projectiles at enemies",
        orbital: "Orbits around you, contact damage",
        area: "Periodic area-of-effect damage",
      };
      choices.push({
        label: `+ ${pokeName}`,
        desc: typeDescs[pool.type],
        color: 0x00ddff,
        portrait: pool.key,
        action: () => addCompanion(this.ctx),
      });
    }

    const am = this.adaptabilityMult;

    // ATK boost
    const atkBoost = 1 + 0.25 * am;
    choices.push({
      label: `ATK +${Math.round(25 * am)}%`,
      desc: `${this.ace.atk} \u2192 ${Math.floor(this.ace.atk * atkBoost)}`,
      color: 0xf43f5e,
      portrait: this.ace.pokemonKey,
      action: () => {
        this.ace.atk = Math.floor(this.ace.atk * atkBoost);
        this.companions.forEach((c) => (c.atk = Math.floor(c.atk * (1 + 0.15 * am))));
      },
    });

    // HP boost
    const hpBoost = Math.floor(30 * am);
    choices.push({
      label: `MAX HP +${hpBoost}`,
      desc: `Heal to full (${this.ace.maxHp + hpBoost} HP)`,
      color: 0x3bc95e,
      portrait: this.ace.pokemonKey,
      action: () => { this.ace.maxHp += hpBoost; this.ace.hp = this.ace.maxHp; },
    });

    // Speed boost
    const spdBoost = 1 + 0.2 * am;
    choices.push({
      label: `SPEED +${Math.round(20 * am)}%`,
      desc: "Move faster, attack faster",
      color: 0xfbbf24,
      portrait: this.ace.pokemonKey,
      action: () => {
        this.ace.speed = Math.floor(this.ace.speed * spdBoost);
        this.ace.attackCooldown = Math.max(200, this.ace.attackCooldown - Math.floor(80 * am));
      },
    });

    // Crit
    if (this.critChance < 0.5) {
      choices.push({
        label: "CRIT +10%",
        desc: `Crit chance: ${Math.round(this.critChance * 100)}% \u2192 ${Math.round((this.critChance + 0.1) * 100)}%`,
        color: 0xff6b6b,
        portrait: this.ace.pokemonKey,
        action: () => { this.critChance = Math.min(0.5, this.critChance + 0.1); },
      });
    }

    // Lifesteal
    if (this.lifestealRate < 0.3) {
      choices.push({
        label: "LIFESTEAL +5%",
        desc: `Heal ${Math.round(this.lifestealRate * 100)}% \u2192 ${Math.round((this.lifestealRate + 0.05) * 100)}% of damage`,
        color: 0x22c55e,
        portrait: this.ace.pokemonKey,
        action: () => { this.lifestealRate = Math.min(0.3, this.lifestealRate + 0.05); },
      });
    }

    // Magnet
    choices.push({
      label: "XP MAGNET +30",
      desc: `Pickup range: ${this.xpMagnetRange} \u2192 ${this.xpMagnetRange + 30}`,
      color: 0x818cf8,
      portrait: this.ace.pokemonKey,
      action: () => { this.xpMagnetRange += 30; },
    });

    // Shuffle and take 3
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    choices.length = Math.min(choices.length, 3);

    // Render cards
    const startY = 140;
    const cardH = 90;
    const gap = 15;

    choices.forEach((choice, i) => {
      const cy = startY + i * (cardH + gap);
      const hasPortrait = choice.portrait && this.textures.exists(`portrait-${choice.portrait}`);
      const textOffsetX = hasPortrait ? 30 : 0;

      const card = this.add.rectangle(GAME_WIDTH / 2, cy + cardH / 2, GAME_WIDTH - 40, cardH, 0x111118, 0.95)
        .setStrokeStyle(2, choice.color, 0.8).setScrollFactor(0).setInteractive({ useHandCursor: true });
      this.levelUpContainer.add(card);

      if (hasPortrait) {
        const portrait = this.add.image(50, cy + cardH / 2, `portrait-${choice.portrait!}`)
          .setDisplaySize(48, 48).setScrollFactor(0).setDepth(501);
        this.levelUpContainer.add(portrait);
      }

      const lbl = this.add.text(GAME_WIDTH / 2 + textOffsetX, cy + 25, choice.label, {
        fontFamily: "monospace", fontSize: "18px",
        color: `#${choice.color.toString(16).padStart(6, "0")}`,
      }).setOrigin(0.5).setScrollFactor(0);
      this.levelUpContainer.add(lbl);

      const desc = this.add.text(GAME_WIDTH / 2 + textOffsetX, cy + 55, choice.desc, {
        fontFamily: "monospace", fontSize: "11px", color: "#888",
      }).setOrigin(0.5).setScrollFactor(0);
      this.levelUpContainer.add(desc);

      card.on("pointerdown", () => { choice.action(); this.closeLevelUpSelection(); });
      card.on("pointerover", () => card.setFillStyle(0x1a1a25, 1));
      card.on("pointerout", () => card.setFillStyle(0x111118, 0.95));
    });
  }

  private closeLevelUpSelection(): void {
    this.levelUpContainer.setVisible(false);
    this.levelUpContainer.removeAll(true);
    this.time.delayedCall(100, () => { this.isPaused = false; });
  }

  // ================================================================
  // ACHIEVEMENTS
  // ================================================================

  private checkAchievements(): void {
    const stats: GameStats = {
      kills: this.kills,
      waveNumber: this.waveNumber,
      level: this.level,
      aceEvoStage: this.aceEvoStage,
      partySize: 1 + this.companions.length,
      cycleNumber: this.cycleNumber,
      killStreak: this.killStreak,
    };
    for (const ach of ACHIEVEMENTS) {
      if (this.saveData.unlockedAchievements.includes(ach.id)) continue;
      if (ach.check(stats)) {
        this.saveData.unlockedAchievements.push(ach.id);
        this.achievementQueue.push(ach);
        checkStarterUnlocks(this.saveData);
        saveSaveData(this.saveData);
      }
    }
    this.processAchievementQueue();
  }

  private processAchievementQueue(): void {
    if (this.showingAchievement || this.achievementQueue.length === 0) return;
    this.showingAchievement = true;
    const ach = this.achievementQueue.shift()!;

    const banner = this.add.rectangle(GAME_WIDTH / 2, -40, GAME_WIDTH - 20, 50, 0x1a1a2e, 0.95)
      .setStrokeStyle(1, 0xfbbf24, 0.8).setDepth(700).setScrollFactor(0);
    const achText = this.add.text(GAME_WIDTH / 2, -40, `\u2605 ${ach.name}\n${ach.desc}`, {
      fontFamily: "monospace", fontSize: "11px", color: "#fbbf24", align: "center", lineSpacing: 2,
    }).setOrigin(0.5).setDepth(701).setScrollFactor(0);

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

  // ================================================================
  // SAVE / COINS
  // ================================================================

  private getEarnedCoins(): number {
    const killCoins = Math.floor(this.kills / 10);
    const waveCoins = this.waveNumber * 5;
    const cycleCoins = (this.cycleNumber - 1) * 10;
    const levelCoins = this.level * 2;
    return killCoins + waveCoins + cycleCoins + levelCoins;
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
