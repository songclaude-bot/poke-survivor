/**
 * EnemyManager — spawning, AI movement, formations, boss logic.
 * Pure functions that operate on GameContext.
 */
import Phaser from "phaser";
import {
  MAX_ENEMIES,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  COLORS,
} from "../config";
import { POKEMON_SPRITES, pacTexKey } from "../sprites/PmdSpriteLoader";
import { sfx, BGM_TRACKS } from "../audio/SfxManager";
import {
  ENEMY_POOL, BOSS_POOL, getBehavior,
} from "../data/GameData";
import type { EnemyData, EnemyBehavior } from "../data/GameTypes";
import type { GameContext } from "./GameContext";
import { showWarning } from "./UIManager";

// ================================================================
// ENEMY AI UPDATE
// ================================================================

export function updateEnemies(ctx: GameContext, dt: number): void {
  const ax = ctx.ace.sprite.x;
  const ay = ctx.ace.sprite.y;
  const dtMs = dt * 1000;

  for (let i = ctx.enemies.length - 1; i >= 0; i--) {
    const e = ctx.enemies[i];
    if (!e.sprite.active) {
      cleanupEnemy(ctx, i);
      continue;
    }

    const dx = ax - e.sprite.x;
    const dy = ay - e.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    updateEnemyMovement(e, dx, dy, dist, dtMs, ctx);

    // Touch damage to player
    if (dist < 20) {
      ctx.damageAce(e.atk * 0.016);
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
      cleanupEnemy(ctx, i);
    }
  }
}

function updateEnemyMovement(e: EnemyData, dx: number, dy: number, dist: number, dtMs: number, ctx: GameContext): void {
  switch (e.behavior) {
    case "chase":
    default:
      if (dist > 1) {
        e.sprite.setVelocity((dx / dist) * e.speed, (dy / dist) * e.speed);
      }
      break;

    case "circle": {
      const orbitRadius = Math.max(80, dist * 0.95);
      e.orbitAngle = (e.orbitAngle ?? 0) + 1.5 * (dtMs / 1000);
      const ax = ctx.ace.sprite.x;
      const ay = ctx.ace.sprite.y;
      const targetX = ax + Math.cos(e.orbitAngle) * orbitRadius;
      const targetY = ay + Math.sin(e.orbitAngle) * orbitRadius;
      const tdx = targetX - e.sprite.x;
      const tdy = targetY - e.sprite.y;
      const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
      if (tdist > 1) {
        e.sprite.setVelocity((tdx / tdist) * e.speed * 1.2, (tdy / tdist) * e.speed * 1.2);
      }
      break;
    }

    case "charge": {
      if (!e.isCharging) {
        e.chargeTimer = (e.chargeTimer ?? 2000) - dtMs;
        if (dist > 120) {
          e.sprite.setVelocity((dx / dist) * e.speed * 0.3, (dy / dist) * e.speed * 0.3);
        } else {
          e.sprite.setVelocity(0, 0);
        }
        if ((e.chargeTimer ?? 0) < 400 && (e.chargeTimer ?? 0) > 0) {
          e.sprite.setTint(0xffffff);
        }
        if ((e.chargeTimer ?? 0) <= 0) {
          e.isCharging = true;
          e.chargeTimer = 800;
          e.sprite.setTint(0xff4444);
          if (dist > 1) {
            e.sprite.setVelocity((dx / dist) * e.speed * 3.5, (dy / dist) * e.speed * 3.5);
          }
        }
      } else {
        e.chargeTimer = (e.chargeTimer ?? 0) - dtMs;
        if ((e.chargeTimer ?? 0) <= 0) {
          e.isCharging = false;
          e.chargeTimer = 2500 + Math.random() * 1500;
          e.sprite.setTint(0xff8888);
          e.sprite.setVelocity(0, 0);
        }
      }
      break;
    }

    case "ranged": {
      const preferredDist = 120;
      if (dist < preferredDist - 20) {
        e.sprite.setVelocity(-(dx / dist) * e.speed * 0.6, -(dy / dist) * e.speed * 0.6);
      } else if (dist > preferredDist + 40) {
        e.sprite.setVelocity((dx / dist) * e.speed * 0.5, (dy / dist) * e.speed * 0.5);
      } else {
        e.sprite.setVelocity(-(dy / dist) * e.speed * 0.3, (dx / dist) * e.speed * 0.3);
      }
      const now = ctx.scene.time.now;
      if (now - (e.lastRangedAttack ?? 0) > 2000) {
        e.lastRangedAttack = now;
        fireEnemyProjectile(ctx, e);
      }
      break;
    }

    case "swarm": {
      let nearestSwarmDx = 0;
      let nearestSwarmDy = 0;
      let nearestSwarmDist = Infinity;
      for (const other of ctx.enemies) {
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
      let vx = 0;
      let vy = 0;
      if (dist > 1) {
        vx = (dx / dist) * e.speed;
        vy = (dy / dist) * e.speed;
      }
      if (nearestSwarmDist < 150 && nearestSwarmDist > 25) {
        vx += (nearestSwarmDx / nearestSwarmDist) * e.speed * 0.4;
        vy += (nearestSwarmDy / nearestSwarmDist) * e.speed * 0.4;
      }
      e.sprite.setVelocity(vx, vy);
      break;
    }
  }
}

// ================================================================
// ENEMY PROJECTILES
// ================================================================

function fireEnemyProjectile(ctx: GameContext, enemy: EnemyData): void {
  const ax = ctx.ace.sprite.x;
  const ay = ctx.ace.sprite.y;
  const dx = ax - enemy.sprite.x;
  const dy = ay - enemy.sprite.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return;

  const sprite = ctx.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, "projectile").setDepth(7);
  sprite.setTint(0xff4444);
  sprite.setScale(1.2);

  const speed = 120;
  const vx = (dx / dist) * speed;
  const vy = (dy / dist) * speed;
  ctx.enemyProjectiles.push({ sprite, vx, vy, damage: enemy.atk * 0.5 });
}

export function updateEnemyProjectiles(ctx: GameContext, dt: number): void {
  for (let i = ctx.enemyProjectiles.length - 1; i >= 0; i--) {
    const ep = ctx.enemyProjectiles[i];
    ep.sprite.x += ep.vx * dt;
    ep.sprite.y += ep.vy * dt;

    const dx = ep.sprite.x - ctx.ace.sprite.x;
    const dy = ep.sprite.y - ctx.ace.sprite.y;
    if (dx * dx + dy * dy < 400) {
      ctx.damageAce(ep.damage);
      ep.sprite.destroy();
      ctx.enemyProjectiles.splice(i, 1);
      continue;
    }

    if (Math.abs(dx) > 500 || Math.abs(dy) > 600) {
      ep.sprite.destroy();
      ctx.enemyProjectiles.splice(i, 1);
    }
  }
}

// ================================================================
// CLEANUP
// ================================================================

export function cleanupEnemy(ctx: GameContext, index: number): void {
  const e = ctx.enemies[index];
  e.sprite.destroy();
  e.hpBar.destroy();
  ctx.enemies.splice(index, 1);
}

// ================================================================
// SPAWNING
// ================================================================

export function spawnEnemy(ctx: GameContext, elapsed: number): void {
  if (ctx.enemies.length >= MAX_ENEMIES) return;

  const angle = Math.random() * Math.PI * 2;
  const dist = 280 + Math.random() * 100;
  const ex = ctx.ace.sprite.x + Math.cos(angle) * dist;
  const ey = ctx.ace.sprite.y + Math.sin(angle) * dist;

  const tier = elapsed < 45 ? 0 : elapsed < 90 ? 1 : elapsed < 150 ? 2 : elapsed < 220 ? 3 : 4;
  const cycleMult = 1 + (ctx.cycleNumber - 1) * 0.25;
  const hpMult = (1 + tier * 0.8 + elapsed * 0.01) * cycleMult;
  const spdMult = (1 + tier * 0.2) * Math.min(cycleMult, 1.5);

  const pool = ENEMY_POOL[tier] ?? ENEMY_POOL[0];
  const pokemonKey = pool[Math.floor(Math.random() * pool.length)];
  const pmdTexKey = pacTexKey(pokemonKey);
  const usePmd = ctx.scene.textures.exists(pmdTexKey);
  const fallbackTex = tier >= 2 ? "enemy-elite" : "enemy";

  const sprite = (ctx.scene.physics as Phaser.Physics.Arcade.ArcadePhysics).add
    .sprite(ex, ey, usePmd ? pmdTexKey : fallbackTex).setDepth(5);
  ctx.enemyGroup.add(sprite);

  if (usePmd) {
    sprite.play(`${pokemonKey}-walk-down`);
    sprite.setTint(0xff8888);
  }

  // Pop-in via setTimeout — NO tweens (onComplete unreliable in Phaser 3.90)
  sprite.setScale(0.3);
  setTimeout(() => { if (sprite.active) sprite.setScale(1); }, 150);

  const hpBarGfx = ctx.scene.add.graphics().setDepth(6);
  const behavior = getBehavior(pokemonKey);

  const eliteChance = Math.min(0.5, 0.15 + ctx.waveNumber * 0.01 + (ctx.cycleNumber - 1) * 0.05);
  const isElite = ctx.waveNumber >= 3 && Math.random() < eliteChance;
  const eliteMult = isElite ? 2.5 : 1;
  const baseHp = Math.round(15 * hpMult * eliteMult);

  if (isElite) {
    sprite.setTint(0xffaa00);
    sprite.setScale(0.5);
    setTimeout(() => { if (sprite.active) sprite.setScale(1.4); }, 200);
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
    lastRangedAttack: behavior === "ranged" ? 0 : undefined,
  };
  ctx.enemies.push(enemy);
}

export function spawnFormationEnemy(ctx: GameContext, x: number, y: number, elapsed: number, behavior: EnemyBehavior): void {
  const tier = elapsed < 45 ? 0 : elapsed < 90 ? 1 : elapsed < 150 ? 2 : elapsed < 220 ? 3 : 4;
  const cycleMult = 1 + (ctx.cycleNumber - 1) * 0.25;
  const hpMult = (1 + tier * 0.5 + elapsed * 0.005) * cycleMult;
  const pool = ENEMY_POOL[Math.min(tier, ENEMY_POOL.length - 1)];
  const pokemonKey = pool[Math.floor(Math.random() * pool.length)];
  const pmdTexKey = pacTexKey(pokemonKey);
  const usePmd = ctx.scene.textures.exists(pmdTexKey);

  const sprite = (ctx.scene.physics as Phaser.Physics.Arcade.ArcadePhysics).add
    .sprite(x, y, usePmd ? pmdTexKey : "enemy").setDepth(5);
  ctx.enemyGroup.add(sprite);
  if (usePmd) {
    sprite.play(`${pokemonKey}-walk-down`);
    sprite.setTint(0xff8888);
  }
  sprite.setScale(0.3);
  setTimeout(() => { if (sprite.active) sprite.setScale(1); }, 120);

  const hpBarGfx = ctx.scene.add.graphics().setDepth(6);
  const baseHp = Math.floor(15 * hpMult);
  const baseSpd = (40 + tier * 15) * Math.min(cycleMult, 1.5);

  ctx.enemies.push({
    sprite, pokemonKey, hp: baseHp, maxHp: baseHp,
    atk: Math.floor((3 + tier * 2) * cycleMult),
    speed: baseSpd, behavior, hpBar: hpBarGfx,
    isElite: false,
    orbitAngle: behavior === "circle" ? Math.random() * Math.PI * 2 : undefined,
    chargeTimer: behavior === "charge" ? 2000 + Math.random() * 1500 : undefined,
    isCharging: false,
    lastRangedAttack: behavior === "ranged" ? 0 : undefined,
  });
}

export function spawnMiniBoss(ctx: GameContext, elapsed: number): void {
  const angle = Math.random() * Math.PI * 2;
  const dist = 260;
  const ex = ctx.ace.sprite.x + Math.cos(angle) * dist;
  const ey = ctx.ace.sprite.y + Math.sin(angle) * dist;

  const cycleMult = 1 + (ctx.cycleNumber - 1) * 0.25;
  const pool = [...ENEMY_POOL[2], ...ENEMY_POOL[3]];
  const pokemonKey = pool[Math.floor(Math.random() * pool.length)];
  const pmdTexKey = pacTexKey(pokemonKey);
  const usePmd = ctx.scene.textures.exists(pmdTexKey);

  const sprite = (ctx.scene.physics as Phaser.Physics.Arcade.ArcadePhysics).add
    .sprite(ex, ey, usePmd ? pmdTexKey : "enemy-elite").setDepth(7);
  ctx.enemyGroup.add(sprite);

  if (usePmd) sprite.play(`${pokemonKey}-walk-down`);
  sprite.setTint(0xff00ff);
  sprite.setScale(0.5);
  setTimeout(() => { if (sprite.active) sprite.setScale(1.7); }, 250);

  const hpBarGfx = ctx.scene.add.graphics().setDepth(8);
  const miniHp = Math.round(60 * (1 + elapsed * 0.015) * cycleMult);

  const enemy: EnemyData = {
    sprite, pokemonKey,
    hp: miniHp, maxHp: miniHp,
    atk: Math.round((8 + elapsed * 0.03) * cycleMult),
    speed: 50 + ctx.cycleNumber * 5,
    hpBar: hpBarGfx,
    behavior: "charge",
    chargeTimer: 1500 + Math.random() * 1000,
    isCharging: false,
    isElite: true,
    isMini: true,
  };
  ctx.enemies.push(enemy);
  showWarning(ctx, "MINI-BOSS!");
}

// ================================================================
// BOSS
// ================================================================

export function spawnBoss(ctx: GameContext): void {
  const angle = Math.random() * Math.PI * 2;
  const dist = 250;
  const bx = ctx.ace.sprite.x + Math.cos(angle) * dist;
  const by = ctx.ace.sprite.y + Math.sin(angle) * dist;

  const bossHp = 200 + ctx.cycleNumber * 80;
  const bossKey = BOSS_POOL[(ctx.cycleNumber - 1 + ctx.waveNumber) % BOSS_POOL.length];
  const pmdTexKey = pacTexKey(bossKey);
  const usePmd = ctx.scene.textures.exists(pmdTexKey);

  const sprite = (ctx.scene.physics as Phaser.Physics.Arcade.ArcadePhysics).add
    .sprite(bx, by, usePmd ? pmdTexKey : "boss").setDepth(12);
  ctx.enemyGroup.add(sprite);

  if (usePmd) {
    sprite.play(`${bossKey}-walk-down`);
    sprite.setScale(2.0);
  }

  const hpBarGfx = ctx.scene.add.graphics().setDepth(13);
  const bossName = POKEMON_SPRITES[bossKey]?.name ?? "Boss";

  ctx.boss = {
    sprite, pokemonKey: bossKey,
    hp: bossHp, maxHp: bossHp,
    atk: 12 + ctx.cycleNumber * 3,
    speed: 30,
    hpBar: hpBarGfx,
    behavior: "chase",
  };
  ctx.enemies.push(ctx.boss!);
  ctx.bossNameText.setText(`${bossName} \u2014 Cycle ${ctx.cycleNumber}`).setVisible(true);
  showWarning(ctx, "BOSS!");
  sfx.switchBgm(ctx.cycleNumber >= 3 ? BGM_TRACKS.bossLegendary : BGM_TRACKS.boss);
}

// ================================================================
// FORMATIONS
// ================================================================

export function spawnEncirclement(ctx: GameContext, elapsed: number): void {
  const count = 10 + Math.floor(ctx.waveNumber * 1.5);
  const radius = 350;
  showWarning(ctx, "ENCIRCLEMENT!");

  for (let i = 0; i < count; i++) {
    ctx.scene.time.delayedCall(i * 80, () => {
      if (ctx.enemies.length >= MAX_ENEMIES) return;
      const angle = (i / count) * Math.PI * 2;
      const ex = ctx.ace.sprite.x + Math.cos(angle) * radius;
      const ey = ctx.ace.sprite.y + Math.sin(angle) * radius;
      spawnFormationEnemy(ctx, ex, ey, elapsed, "chase");
    });
  }
}

export function spawnDiagonalMarch(ctx: GameContext, elapsed: number): void {
  const count = 12 + Math.floor(ctx.waveNumber);
  const marchAngle = Math.random() * Math.PI * 2;
  const perpAngle = marchAngle + Math.PI / 2;
  const startDist = 400;
  showWarning(ctx, "STAMPEDE!");

  for (let i = 0; i < count; i++) {
    ctx.scene.time.delayedCall(i * 120, () => {
      if (ctx.enemies.length >= MAX_ENEMIES) return;
      const perpOffset = (i - count / 2) * 30;
      const ex = ctx.ace.sprite.x + Math.cos(marchAngle) * startDist + Math.cos(perpAngle) * perpOffset;
      const ey = ctx.ace.sprite.y + Math.sin(marchAngle) * startDist + Math.sin(perpAngle) * perpOffset;
      spawnFormationEnemy(ctx, ex, ey, elapsed, "charge");
    });
  }
}

export function spawnRushSwarm(ctx: GameContext, elapsed: number): void {
  const count = 15 + Math.floor(ctx.waveNumber);
  const swarmAngle = Math.random() * Math.PI * 2;
  const startDist = 380;
  showWarning(ctx, "SWARM!");

  for (let i = 0; i < count; i++) {
    ctx.scene.time.delayedCall(i * 50, () => {
      if (ctx.enemies.length >= MAX_ENEMIES) return;
      const spread = (Math.random() - 0.5) * 1.2;
      const ex = ctx.ace.sprite.x + Math.cos(swarmAngle + spread) * (startDist + Math.random() * 80);
      const ey = ctx.ace.sprite.y + Math.sin(swarmAngle + spread) * (startDist + Math.random() * 80);
      spawnFormationEnemy(ctx, ex, ey, elapsed, "swarm");
    });
  }
}
