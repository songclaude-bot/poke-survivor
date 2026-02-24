/**
 * CompanionManager — companion add/update/evolve, legion update.
 * Pure functions that operate on GameContext.
 */
import Phaser from "phaser";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  COLORS,
} from "../config";
import { POKEMON_SPRITES, pacTexKey } from "../sprites/PmdSpriteLoader";
import { COMPANION_POOL, EVOLUTION_CHAINS } from "../data/GameData";
import type { CompanionData } from "../data/GameTypes";
import type { GameContext } from "./GameContext";

// ================================================================
// ADD COMPANION
// ================================================================

export function addCompanion(ctx: GameContext): void {
  if (ctx.companions.length >= 5) return;

  const pool = COMPANION_POOL[ctx.companions.length % COMPANION_POOL.length];
  const type = pool.type;
  const pokemonKey = pool.key;
  const pmdTexKey = pacTexKey(pokemonKey);
  const usePmd = ctx.scene.textures.exists(pmdTexKey);

  const sprite = (ctx.scene.physics as Phaser.Physics.Arcade.ArcadePhysics).add
    .sprite(ctx.ace.sprite.x, ctx.ace.sprite.y - 30, usePmd ? pmdTexKey : "companion")
    .setDepth(9);

  if (usePmd) {
    sprite.play(`${pokemonKey}-walk-down`);
    sprite.setScale(1.2);
  }

  const companion: CompanionData = {
    sprite,
    atk: 5 + ctx.level * 2,
    attackCooldown: type === "orbital" ? 200 : type === "area" ? 2000 : 1200,
    lastAttackTime: 0,
    attackRange: type === "orbital" ? 30 : type === "area" ? 80 : 150,
    orbitAngle: (ctx.companions.length * Math.PI * 2) / 3,
    type,
    level: 1,
  };

  ctx.companions.push(companion);

  // Announce
  const names = POKEMON_SPRITES[pokemonKey]?.name
    ? [POKEMON_SPRITES.squirtle.name, POKEMON_SPRITES.gastly.name, POKEMON_SPRITES.geodude.name]
    : ["Squirtle", "Gastly", "Geodude"];
  const txt = ctx.scene.add
    .text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 20,
      `+ ${names[ctx.companions.length - 1] ?? "Companion"} joined!`,
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

  ctx.scene.tweens.add({
    targets: txt,
    y: txt.y - 30,
    alpha: 0,
    duration: 1500,
    onComplete: () => txt.destroy(),
  });
}

// ================================================================
// UPDATE COMPANIONS
// ================================================================

export function updateCompanions(ctx: GameContext, dt: number): void {
  const now = ctx.scene.time.now;

  for (const c of ctx.companions) {
    // Orbit around ace
    c.orbitAngle += dt * (c.type === "orbital" ? 3.0 : 1.5);
    const orbitDist = c.type === "orbital" ? 35 : 50;
    c.sprite.setPosition(
      ctx.ace.sprite.x + Math.cos(c.orbitAngle) * orbitDist,
      ctx.ace.sprite.y + Math.sin(c.orbitAngle) * orbitDist,
    );

    if (now - c.lastAttackTime < c.attackCooldown) continue;

    if (c.type === "orbital") {
      for (const e of ctx.enemies) {
        const d = Phaser.Math.Distance.Between(c.sprite.x, c.sprite.y, e.sprite.x, e.sprite.y);
        if (d < c.attackRange) {
          e.hp -= c.atk;
          ctx.showDamagePopup(e.sprite.x, e.sprite.y, c.atk, "#c084fc");
          e.sprite.setTint(0xff88ff);
          ctx.scene.time.delayedCall(60, () => {
            if (e.sprite.active) e.sprite.setTint(0xff8888);
          });
          if (e.hp <= 0) ctx.onEnemyDeath(e);
          c.lastAttackTime = now;
          break;
        }
      }
    } else if (c.type === "projectile") {
      const target = ctx.findNearestEnemy(c.sprite.x, c.sprite.y, c.attackRange);
      if (target) {
        c.lastAttackTime = now;
        ctx.fireProjectile(c.sprite.x, c.sprite.y, target.sprite.x, target.sprite.y, c.atk);
      }
    } else if (c.type === "area") {
      c.lastAttackTime = now;
      let hit = false;
      for (const e of ctx.enemies) {
        const d = Phaser.Math.Distance.Between(c.sprite.x, c.sprite.y, e.sprite.x, e.sprite.y);
        if (d < c.attackRange) {
          e.hp -= c.atk;
          ctx.showDamagePopup(e.sprite.x, e.sprite.y, c.atk, "#4ade80");
          if (e.hp <= 0) ctx.onEnemyDeath(e);
          hit = true;
        }
      }
      if (hit) {
        const ring = ctx.scene.add.circle(c.sprite.x, c.sprite.y, 5, COLORS.accent3, 0.4).setDepth(7);
        ctx.scene.tweens.add({
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
// EVOLVE COMPANION
// ================================================================

export function evolveCompanion(ctx: GameContext, companion: CompanionData): void {
  const chain = EVOLUTION_CHAINS[companion.sprite.texture.key.replace("pac-", "")];
  const currentStage = ctx.companionEvoStages.get(companion.sprite.texture.key) ?? 0;
  if (!chain || currentStage >= chain.length - 1) return;

  const nextStage = currentStage + 1;
  ctx.companionEvoStages.set(companion.sprite.texture.key, nextStage);

  const stage = chain[nextStage];
  const prevStage = chain[currentStage];
  companion.atk = Math.floor(companion.atk * (stage.atkMult / prevStage.atkMult));
  companion.sprite.setScale(stage.scale);
}

// ================================================================
// LEGIONS
// ================================================================

export function updateLegions(ctx: GameContext, dt: number): void {
  const now = ctx.scene.time.now;
  const ax = ctx.ace.sprite.x;
  const ay = ctx.ace.sprite.y;

  for (const legion of ctx.legionEntities) {
    legion.orbitAngle += dt * 0.8;
    const lx = ax + Math.cos(legion.orbitAngle) * legion.orbitDist;
    const ly = ay + Math.sin(legion.orbitAngle) * legion.orbitDist;

    const clampX = Phaser.Math.Clamp(lx, 0, WORLD_WIDTH);
    const clampY = Phaser.Math.Clamp(ly, 0, WORLD_HEIGHT);

    legion.gfx.clear();
    const color = legion.data.color;
    const memberCount = 1 + legion.data.companions.length;

    if (ctx.legionEntities.indexOf(legion) < 3) {
      const aceR = 8;
      legion.gfx.fillStyle(color, 0.6);
      legion.gfx.fillCircle(clampX, clampY, aceR);

      for (let j = 0; j < legion.data.companions.length; j++) {
        const ca = legion.orbitAngle * 2 + (j * Math.PI * 2) / memberCount;
        const cx = clampX + Math.cos(ca) * 15;
        const cy = clampY + Math.sin(ca) * 15;
        legion.gfx.fillStyle(color, 0.4);
        legion.gfx.fillCircle(cx, cy, 5);
      }

      legion.gfx.lineStyle(1, color, 0.2);
      legion.gfx.strokeCircle(clampX, clampY, legion.attackRange * 0.3);
    } else {
      const blobR = 6 + Math.min(memberCount * 2, 10);
      legion.gfx.fillStyle(color, 0.35);
      legion.gfx.fillCircle(clampX, clampY, blobR);
    }

    // Auto-attack enemies in range
    if (now - legion.lastAttackTime >= legion.attackInterval) {
      legion.lastAttackTime = now;
      const dmg = legion.data.dps * (legion.attackInterval / 1000);

      for (const e of ctx.enemies) {
        const d = Phaser.Math.Distance.Between(clampX, clampY, e.sprite.x, e.sprite.y);
        if (d < legion.attackRange) {
          e.hp -= dmg;
          ctx.showDamagePopup(e.sprite.x, e.sprite.y, dmg, "#67e8f9");
          e.sprite.setTint(color);
          ctx.scene.time.delayedCall(60, () => {
            if (e.sprite.active) e.sprite.setTint(0xff8888);
          });
          if (e.hp <= 0) ctx.onEnemyDeath(e);
          break;
        }
      }
    }
  }
}
