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

/* ================================================================
   GameScene — Core prototype
   Implements: movement, joystick, enemies, auto-attack, XP, level-up
   ================================================================ */

// -- Tiny data types ------------------------------------------

interface AceData {
  sprite: Phaser.Physics.Arcade.Sprite;
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
}

interface EnemyData {
  sprite: Phaser.Physics.Arcade.Sprite;
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  hpBar: Phaser.GameObjects.Graphics;
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

interface LegionData {
  ace: string;
  companions: string[];
  dps: number;
  color: number;
}

interface CyclePassData {
  cycleNumber?: number;
  legions?: LegionData[];
}

// =================================================================

export class GameScene extends Phaser.Scene {
  // -- Core groups --
  private ace!: AceData;
  private enemies: EnemyData[] = [];
  private projectiles: ProjectileData[] = [];
  private companions: CompanionData[] = [];
  private xpGems: XpGem[] = [];

  // -- Phaser groups for collision --
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private projectileGroup!: Phaser.Physics.Arcade.Group;
  private xpGemGroup!: Phaser.Physics.Arcade.Group;

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

  // -- UI --
  private hpBar!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;
  private timerText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private cycleText!: Phaser.GameObjects.Text;

  // -- World camera offset (infinite map illusion) --
  private worldOffset = new Phaser.Math.Vector2(0, 0);

  // -- Stars background --
  private stars: { x: number; y: number; alpha: number; speed: number }[] = [];
  private starGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: "GameScene" });
  }

  init(data?: CyclePassData): void {
    if (data?.cycleNumber) this.cycleNumber = data.cycleNumber;
    if (data?.legions) this.legions = [...data.legions];
  }

  create(): void {
    this.resetState();
    this.createStarfield();
    this.createAce();
    this.createUI();
    this.createJoystick();
    this.createPhysicsGroups();
    this.setupCollisions();
  }

  // ================================================================
  // SETUP
  // ================================================================

  private resetState(): void {
    this.enemies = [];
    this.projectiles = [];
    this.companions = [];
    this.xpGems = [];
    this.xp = 0;
    this.level = 1;
    this.xpToNext = XP_PER_LEVEL_BASE;
    this.kills = 0;
    this.cycleTimer = CYCLE_DURATION_SEC;
    this.spawnTimer = 0;
    this.isPaused = false;
    this.pendingLevelUp = false;
    this.boss = null;
    this.bossSpawned = false;
    this.bossWarningShown = false;
    this.worldOffset.set(0, 0);
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

  private createAce(): void {
    const sprite = this.physics.add.sprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      "ace",
    );
    sprite.setDepth(10);
    sprite.setCollideWorldBounds(false);

    // Scale ace stats with cycle number
    const cycleMult = 1 + (this.cycleNumber - 1) * 0.15;
    this.ace = {
      sprite,
      hp: Math.floor(100 * cycleMult),
      maxHp: Math.floor(100 * cycleMult),
      atk: Math.floor(10 * cycleMult),
      speed: 160 + (this.cycleNumber - 1) * 5,
      attackRange: 120 + (this.cycleNumber - 1) * 5,
      attackCooldown: Math.max(400, 800 - (this.cycleNumber - 1) * 30),
      lastAttackTime: 0,
    };
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

    // Level-up selection container (hidden)
    this.levelUpContainer = this.add.container(0, 0).setDepth(500).setScrollFactor(0).setVisible(false);
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
    this.updateProjectiles(dt);
    this.updateXpGemMagnet();
    this.drawUI();
  }

  // ================================================================
  // TIMER
  // ================================================================

  private updateTimer(dt: number): void {
    this.cycleTimer -= dt;
    if (this.cycleTimer <= 0) this.cycleTimer = 0;

    const elapsed = CYCLE_DURATION_SEC - this.cycleTimer;

    // Boss warning at 3:00 (180s elapsed)
    if (elapsed >= 180 && !this.bossWarningShown) {
      this.bossWarningShown = true;
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

    // Keep ace roughly centered, move world offset instead
    // For prototype: just move the sprite and let camera follow
    // Ace stays within a box around center
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const ax = this.ace.sprite.x;
    const ay = this.ace.sprite.y;

    // Soft boundary — wrap enemies around player
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
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;

    // Spawn rate increases over time
    const elapsed = CYCLE_DURATION_SEC - this.cycleTimer;
    const spawnInterval = Math.max(0.3, 1.5 - elapsed * 0.004);
    this.spawnTimer = spawnInterval;

    if (this.enemies.length >= MAX_ENEMIES) return;

    // How many to spawn
    const batchSize = elapsed < 30 ? 1 : elapsed < 120 ? 2 : 3;
    for (let i = 0; i < batchSize; i++) {
      this.spawnEnemy(elapsed);
    }
  }

  private spawnEnemy(elapsed: number): void {
    if (this.enemies.length >= MAX_ENEMIES) return;

    // Spawn around player at screen edge
    const angle = Math.random() * Math.PI * 2;
    const dist = 280 + Math.random() * 100;
    const ex = this.ace.sprite.x + Math.cos(angle) * dist;
    const ey = this.ace.sprite.y + Math.sin(angle) * dist;

    // Scale with time + cycle number
    const tier = elapsed < 60 ? 0 : elapsed < 150 ? 1 : 2;
    const texKey = tier >= 2 ? "enemy-elite" : "enemy";
    const cycleMult = 1 + (this.cycleNumber - 1) * 0.25;
    const hpMult = (1 + tier * 0.8 + elapsed * 0.01) * cycleMult;
    const spdMult = (1 + tier * 0.2) * Math.min(cycleMult, 1.5);

    const sprite = this.physics.add.sprite(ex, ey, texKey).setDepth(5);
    this.enemyGroup.add(sprite);

    const hpBarGfx = this.add.graphics().setDepth(6);

    const enemy: EnemyData = {
      sprite,
      hp: Math.round(15 * hpMult),
      maxHp: Math.round(15 * hpMult),
      atk: Math.round((5 + tier * 3 + elapsed * 0.02) * cycleMult),
      speed: (40 + Math.random() * 30) * spdMult,
      hpBar: hpBarGfx,
    };
    this.enemies.push(enemy);
  }

  // ================================================================
  // ENEMY AI
  // ================================================================

  private updateEnemies(_dt: number): void {
    const ax = this.ace.sprite.x;
    const ay = this.ace.sprite.y;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.sprite.active) {
        this.cleanupEnemy(i);
        continue;
      }

      // Chase player
      const dx = ax - e.sprite.x;
      const dy = ay - e.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 1) {
        e.sprite.setVelocity(
          (dx / dist) * e.speed,
          (dy / dist) * e.speed,
        );
      }

      // Touch damage to player
      if (dist < 20) {
        this.damageAce(e.atk * 0.016); // Per frame damage (~60fps)
      }

      // Draw HP bar above enemy
      e.hpBar.clear();
      if (e.hp < e.maxHp) {
        const bw = 20;
        const bx = e.sprite.x - bw / 2;
        const by = e.sprite.y - 16;
        e.hpBar.fillStyle(0x333333, 0.8);
        e.hpBar.fillRect(bx, by, bw, 3);
        e.hpBar.fillStyle(COLORS.hpRed, 1);
        e.hpBar.fillRect(bx, by, bw * (e.hp / e.maxHp), 3);
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
    if (now - this.ace.lastAttackTime < this.ace.attackCooldown) return;

    // Find nearest enemy
    const target = this.findNearestEnemy(
      this.ace.sprite.x,
      this.ace.sprite.y,
      this.ace.attackRange,
    );
    if (!target) return;

    this.ace.lastAttackTime = now;
    this.fireProjectile(
      this.ace.sprite.x,
      this.ace.sprite.y,
      target.sprite.x,
      target.sprite.y,
      this.ace.atk,
    );
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

    this.projectiles.push({ sprite, damage, pierce: 1 });
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
    enemy.hp -= proj.damage;
    proj.pierce--;

    // Flash enemy white
    enemy.sprite.setTint(0xffffff);
    this.time.delayedCall(80, () => {
      if (enemy.sprite.active) enemy.sprite.clearTint();
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

    // Check if this was the boss
    const wasBoss = enemy === this.boss;

    // Spawn XP gem (boss drops more)
    const xpValue = wasBoss
      ? 50 + this.cycleNumber * 20
      : 3 + Math.floor(enemy.maxHp / 10);
    this.spawnXpGem(enemy.sprite.x, enemy.sprite.y, xpValue);

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
    const magnetRange = 60;
    const magnetSpeed = 200;
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

  private onLevelUp(): void {
    // Always grant small passive stat boost
    this.ace.attackRange += 3;
    if (this.ace.attackCooldown > 350) this.ace.attackCooldown -= 15;

    // Show selection UI for meaningful choices
    this.showLevelUpSelection();
  }

  // ================================================================
  // COMPANIONS
  // ================================================================

  private addCompanion(): void {
    if (this.companions.length >= 3) return;

    const types: Array<"projectile" | "orbital" | "area"> = [
      "projectile",
      "orbital",
      "area",
    ];
    const type = types[this.companions.length % 3];
    const sprite = this.physics.add
      .sprite(this.ace.sprite.x, this.ace.sprite.y - 30, "companion")
      .setDepth(9);

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
    const names = ["Squirtle", "Gastly", "Geodude"];
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
            e.sprite.setTint(0xff88ff);
            this.time.delayedCall(60, () => {
              if (e.sprite.active) e.sprite.clearTint();
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
  // DAMAGE
  // ================================================================

  private damageAce(amount: number): void {
    this.ace.hp -= amount;
    if (this.ace.hp <= 0) {
      this.ace.hp = 0;
      this.onAceDeath();
    }
  }

  private onAceDeath(): void {
    this.isPaused = true;

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

    const stats = `Lv.${this.level}  Kill: ${this.kills}\nTime: ${this.formatTime(CYCLE_DURATION_SEC - this.cycleTimer)}`;
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, stats, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ccc",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(301)
      .setScrollFactor(0);

    // Tap to retry
    const retry = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, "[ Tap to Retry ]", {
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
      // Reset to cycle 1 on death, but keep legions for show
      this.scene.restart({ cycleNumber: 1, legions: [] });
    });
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
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
    this.killText.setText(`Kill: ${this.kills}`);
    this.levelText.setText(`Lv.${this.level}`);
    const legionInfo = this.legions.length > 0 ? ` [${this.legions.length}]` : "";
    this.cycleText.setText(`Cycle ${this.cycleNumber}${legionInfo}`);
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

    const sprite = this.physics.add.sprite(bx, by, "boss").setDepth(12);
    this.enemyGroup.add(sprite);

    const hpBarGfx = this.add.graphics().setDepth(13);

    this.boss = {
      sprite,
      hp: bossHp,
      maxHp: bossHp,
      atk: 12 + this.cycleNumber * 3,
      speed: 30,
      hpBar: hpBarGfx,
    };
    this.enemies.push(this.boss);

    this.bossNameText.setText(`BOSS — Cycle ${this.cycleNumber}`).setVisible(true);

    this.showWarning("BOSS!");
  }

  private onBossDefeated(): void {
    this.boss = null;
    this.isPaused = true;

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

    const stats = [
      `Cycle ${this.cycleNumber}`,
      `Lv.${this.level}  Kill: ${this.kills}`,
      `Time: ${this.formatTime(CYCLE_DURATION_SEC - this.cycleTimer)}`,
      `Legions: ${this.legions.length}`,
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

    const companionNames = this.companions.map((_, i) => ["Squirtle", "Gastly", "Geodude"][i] ?? "???");
    this.add
      .text(GAME_WIDTH / 2, 290, `Ace + ${companionNames.join(", ")}`, {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#aaa",
      })
      .setOrigin(0.5)
      .setDepth(401)
      .setScrollFactor(0);

    // Store legion
    this.legions.push({
      ace: `Ace_${this.cycleNumber}`,
      companions: companionNames,
      dps: this.ace.atk + this.companions.reduce((sum, c) => sum + c.atk, 0),
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
    this.ace.sprite.destroy();

    // Restart scene with persistent data
    this.scene.restart({ cycleNumber: nextCycle, legions: savedLegions });
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
    type Choice = { label: string; desc: string; action: () => void; color: number };
    const choices: Choice[] = [];

    // Choice A: New companion (if slots available)
    if (this.companions.length < 3) {
      const types: Array<"projectile" | "orbital" | "area"> = ["projectile", "orbital", "area"];
      const nextType = types[this.companions.length % 3];
      const names: Record<string, string> = { projectile: "Squirtle", orbital: "Gastly", area: "Geodude" };
      const descs: Record<string, string> = {
        projectile: "Fires projectiles at enemies",
        orbital: "Orbits around you, contact damage",
        area: "Periodic area-of-effect damage",
      };
      choices.push({
        label: `+ ${names[nextType]}`,
        desc: descs[nextType],
        color: 0x00ddff,
        action: () => this.addCompanion(),
      });
    }

    // Choice B: Boost ATK
    choices.push({
      label: "ATK +25%",
      desc: `${this.ace.atk} → ${Math.floor(this.ace.atk * 1.25)}`,
      color: 0xf43f5e,
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
      action: () => {
        this.ace.maxHp += 30;
        this.ace.hp = this.ace.maxHp;
      },
    });

    // Choice D: Speed + Range (only if we have 3 options already)
    if (choices.length < 3) {
      choices.push({
        label: "SPEED +20%",
        desc: `Move faster, attack faster`,
        color: 0xfbbf24,
        action: () => {
          this.ace.speed = Math.floor(this.ace.speed * 1.2);
          this.ace.attackCooldown = Math.max(200, this.ace.attackCooldown - 80);
        },
      });
    }

    // Render choice cards
    const startY = 140;
    const cardH = 90;
    const gap = 15;

    choices.forEach((choice, i) => {
      const cy = startY + i * (cardH + gap);

      // Card background
      const card = this.add
        .rectangle(GAME_WIDTH / 2, cy + cardH / 2, GAME_WIDTH - 40, cardH, 0x111118, 0.95)
        .setStrokeStyle(2, choice.color, 0.8)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true });
      this.levelUpContainer.add(card);

      // Label
      const lbl = this.add
        .text(GAME_WIDTH / 2, cy + 25, choice.label, {
          fontFamily: "monospace",
          fontSize: "18px",
          color: `#${choice.color.toString(16).padStart(6, "0")}`,
        })
        .setOrigin(0.5)
        .setScrollFactor(0);
      this.levelUpContainer.add(lbl);

      // Description
      const desc = this.add
        .text(GAME_WIDTH / 2, cy + 55, choice.desc, {
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

  private closeLevelUpSelection(): void {
    this.levelUpContainer.setVisible(false);
    this.levelUpContainer.removeAll(true);
    this.isPaused = false;
    this.pendingLevelUp = false;
  }
}
