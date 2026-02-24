/**
 * CombatManager — projectile hit, damage, skill effects, items, XP.
 * Pure functions that operate on GameContext.
 */
import Phaser from "phaser";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  MAX_PROJECTILES,
  XP_PER_LEVEL_BASE,
  XP_LEVEL_SCALE,
  CYCLE_DURATION_SEC,
} from "../config";
import {
  STARTER_ATTACK_TYPE,
  playHitEffect,
  getRangeTextureKey,
  getRangeAnimKey,
  type AttackType,
} from "../effects/AttackEffects";
import { getDirectionFromVelocity, pacTexKey, POKEMON_SPRITES } from "../sprites/PmdSpriteLoader";
import { sfx } from "../audio/SfxManager";
import { EVOLUTION_CHAINS } from "../data/GameData";
import type { ProjectileData, EnemyData, ItemType, XpGem } from "../data/GameTypes";
import type { GameContext } from "./GameContext";
import { showDamagePopup, spawnDeathParticles, showStreakText } from "./UIManager";

// ================================================================
// AUTO-ATTACK
// ================================================================

export function updateAceAutoAttack(ctx: GameContext): void {
  const now = ctx.scene.time.now;

  // Draw aim indicator to nearest enemy
  ctx.aimGfx.clear();
  const aimTarget = findNearestEnemy(ctx, ctx.ace.sprite.x, ctx.ace.sprite.y, ctx.ace.attackRange);
  if (aimTarget) {
    ctx.aimGfx.lineStyle(1, 0xfbbf24, 0.2);
    ctx.aimGfx.lineBetween(ctx.ace.sprite.x, ctx.ace.sprite.y, aimTarget.sprite.x, aimTarget.sprite.y);
  }

  if (now - ctx.ace.lastAttackTime < ctx.ace.attackCooldown) return;

  const target = aimTarget;
  if (!target) return;

  ctx.ace.lastAttackTime = now;
  sfx.playHit();

  const shotCount = ctx.level >= 15 ? 5 : ctx.level >= 7 ? 3 : 1;
  const baseAngle = Math.atan2(
    target.sprite.y - ctx.ace.sprite.y,
    target.sprite.x - ctx.ace.sprite.x,
  );
  const spread = 0.2;

  for (let s = 0; s < shotCount; s++) {
    const offset = (s - (shotCount - 1) / 2) * spread;
    const angle = baseAngle + offset;
    const dist = 200;
    fireProjectile(
      ctx,
      ctx.ace.sprite.x,
      ctx.ace.sprite.y,
      ctx.ace.sprite.x + Math.cos(angle) * dist,
      ctx.ace.sprite.y + Math.sin(angle) * dist,
      Math.floor(ctx.ace.atk / (shotCount > 1 ? shotCount * 0.6 : 1)),
    );
  }
}

// ================================================================
// PROJECTILES
// ================================================================

export function fireProjectile(
  ctx: GameContext,
  fromX: number, fromY: number,
  toX: number, toY: number,
  damage: number,
): void {
  if (ctx.projectiles.length >= MAX_PROJECTILES) {
    const old = ctx.projectiles.shift()!;
    old.sprite.destroy();
  }

  const atkType: AttackType = STARTER_ATTACK_TYPE[ctx.starterKey] ?? "NORMAL";
  const rangeTex = getRangeTextureKey(atkType);
  const rangeAnim = getRangeAnimKey(atkType);
  const useEffect = rangeTex !== null && rangeAnim !== null
    && ctx.scene.textures.exists(rangeTex) && ctx.scene.anims.exists(rangeAnim);

  const sprite = (ctx.scene.physics as Phaser.Physics.Arcade.ArcadePhysics).add
    .sprite(fromX, fromY, useEffect ? rangeTex! : "projectile")
    .setDepth(8);
  if (useEffect) {
    sprite.play(rangeAnim!);
    sprite.setScale(1.5);
  }
  ctx.projectileGroup.add(sprite);

  const angle = Math.atan2(toY - fromY, toX - fromX);
  const speed = 300;
  sprite.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  sprite.setRotation(angle);

  const pierce = 1 + ctx.aceEvoStage + (ctx.skillId === "sheer_force" ? 1 : 0);
  ctx.projectiles.push({ sprite, damage, pierce });

  // Attack pose on ace pokemon
  playAttackPose(ctx, ctx.ace.sprite, ctx.starterKey, angle);
}

function playAttackPose(
  ctx: GameContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  pokemonKey: string,
  angle: number,
): void {
  const dir = getDirectionFromVelocity(Math.cos(angle), Math.sin(angle));
  const atkAnimKey = `${pokemonKey}-attack-${dir}`;
  if (!ctx.scene.anims.exists(atkAnimKey)) return;

  const savedWalkAnim = sprite.anims.currentAnim?.key;
  sprite.play(atkAnimKey);
  sprite.once("animationcomplete", () => {
    if (!sprite.active) return;
    if (savedWalkAnim && ctx.scene.anims.exists(savedWalkAnim)) {
      sprite.play(savedWalkAnim);
    }
  });
}

export function updateProjectiles(ctx: GameContext): void {
  for (let i = ctx.projectiles.length - 1; i >= 0; i--) {
    const p = ctx.projectiles[i];
    if (!p.sprite.active) {
      p.sprite.destroy();
      ctx.projectiles.splice(i, 1);
      continue;
    }

    const dx = p.sprite.x - ctx.ace.sprite.x;
    const dy = p.sprite.y - ctx.ace.sprite.y;
    if (Math.abs(dx) > 400 || Math.abs(dy) > 500) {
      p.sprite.destroy();
      ctx.projectiles.splice(i, 1);
    }
  }
}

// ================================================================
// HIT HANDLING
// ================================================================

export function onProjectileHitEnemy(ctx: GameContext, proj: ProjectileData, enemy: EnemyData): void {
  const isCrit = Math.random() < ctx.critChance;
  const critMult = ctx.skillId === "inner_focus" ? 3 : 2;
  let baseDamage = proj.damage;

  if (ctx.skillId === "blaze" && ctx.ace.hp < ctx.ace.maxHp * 0.3) {
    baseDamage = Math.floor(baseDamage * 1.3);
  }

  if (ctx.skillId === "flash_fire" && ctx.flashFireStacks > 0) {
    baseDamage = Math.floor(baseDamage * (1 + ctx.flashFireStacks * 0.01));
  }

  const finalDamage = isCrit ? baseDamage * critMult : baseDamage;

  enemy.hp -= finalDamage;
  proj.pierce--;
  sfx.playHit();

  const atkType: AttackType = STARTER_ATTACK_TYPE[ctx.starterKey] ?? "NORMAL";
  playHitEffect(ctx.scene, enemy.sprite.x, enemy.sprite.y, atkType);

  // Lifesteal
  if (ctx.lifestealRate > 0 && ctx.ace.hp < ctx.ace.maxHp) {
    const heal = Math.ceil(finalDamage * ctx.lifestealRate);
    ctx.ace.hp = Math.min(ctx.ace.maxHp, ctx.ace.hp + heal);
  }

  // Static: 10% chance to slow
  if (ctx.skillId === "static" && Math.random() < 0.1) {
    const origSpeed = enemy.speed;
    enemy.speed = Math.floor(enemy.speed * 0.4);
    enemy.sprite.setTint(0xffff00);
    ctx.scene.time.delayedCall(2000, () => {
      if (enemy.sprite.active) {
        enemy.speed = origSpeed;
        enemy.sprite.clearTint();
      }
    });
  }

  showDamagePopup(ctx, enemy.sprite.x, enemy.sprite.y,
    isCrit ? `${Math.ceil(finalDamage)} CRIT!` : finalDamage,
    isCrit ? "#ff4444" : "#fbbf24");

  enemy.sprite.setTint(0xffffff);
  ctx.scene.time.delayedCall(80, () => {
    if (enemy.sprite.active) enemy.sprite.setTint(0xff8888);
  });

  if (proj.pierce <= 0) {
    proj.sprite.destroy();
    const idx = ctx.projectiles.indexOf(proj);
    if (idx >= 0) ctx.projectiles.splice(idx, 1);
  }

  if (enemy.hp <= 0) {
    ctx.onEnemyDeath(enemy);
  }
}

// ================================================================
// DAMAGE
// ================================================================

export function damageAce(ctx: GameContext, amount: number): void {
  if (ctx.isDodging) return;

  if (ctx.skillId === "levitate" && ctx.phaseTimer > 0) return;

  let finalAmount = amount;
  if (ctx.skillId === "torrent" && ctx.ace.hp > ctx.ace.maxHp * 0.7) {
    finalAmount = amount * 0.75;
  }

  if (ctx.skillId === "leaf_guard" && ctx.companions.length > 0) {
    finalAmount *= 0.85;
  }

  ctx.ace.hp -= finalAmount;

  if (finalAmount >= 0.5) {
    showDamagePopup(ctx, ctx.ace.sprite.x, ctx.ace.sprite.y, finalAmount, "#f43f5e");
  }

  if (ctx.skillId === "levitate" && ctx.phaseTimer <= 0) {
    ctx.phaseTimer = 1;
    ctx.ace.sprite.setAlpha(0.5);
  }

  // Sturdy: survive one fatal hit per wave
  if (ctx.ace.hp <= 0 && ctx.skillId === "sturdy" && ctx.sturdyAvailable) {
    ctx.ace.hp = 1;
    ctx.sturdyAvailable = false;
    showDamagePopup(ctx, ctx.ace.sprite.x, ctx.ace.sprite.y - 20, "STURDY!", "#fbbf24");
    ctx.scene.cameras.main.flash(200, 255, 200, 0);
    return;
  }

  if (ctx.ace.hp <= 0) {
    ctx.ace.hp = 0;
    // Signal death — handled by GameScene
  }
}

// ================================================================
// ENEMY DEATH
// ================================================================

export function onEnemyDeath(ctx: GameContext, enemy: EnemyData): void {
  ctx.kills++;
  ctx.killStreak++;
  ctx.lastKillTime = ctx.scene.time.now;

  // Flash Fire: +1% ATK per kill (max 30%)
  if (ctx.skillId === "flash_fire" && ctx.flashFireStacks < 30) {
    ctx.flashFireStacks++;
  }

  // Unburden: speed +50% for 3s
  if (ctx.skillId === "unburden") {
    if (ctx.unburdenTimer <= 0) {
      ctx.ace.speed = Math.floor(ctx.ace.speed * 1.5);
    }
    ctx.unburdenTimer = 3;
  }

  const wasBoss = enemy === ctx.boss;
  spawnDeathParticles(ctx, enemy.sprite.x, enemy.sprite.y, wasBoss);

  if (wasBoss) {
    ctx.scene.cameras.main.shake(300, 0.015);
  } else if (enemy.isElite) {
    ctx.scene.cameras.main.shake(100, 0.006);
  } else if (ctx.killStreak >= 5) {
    ctx.scene.cameras.main.shake(50, 0.003);
  }

  if (ctx.killStreak >= 10 && ctx.killStreak % 5 === 0) {
    showStreakText(ctx, ctx.killStreak);
  }

  // XP gem
  const xpValue = wasBoss
    ? 50 + ctx.cycleNumber * 20
    : enemy.isElite
      ? 10 + Math.floor(enemy.maxHp / 5)
      : 3 + Math.floor(enemy.maxHp / 10);
  spawnXpGem(ctx, enemy.sprite.x, enemy.sprite.y, xpValue);

  // Item drop
  const dropChance = wasBoss ? 1 : enemy.isElite ? 0.4 : 0.08;
  if (Math.random() < dropChance) {
    spawnItem(ctx, enemy.sprite.x, enemy.sprite.y);
  }

  // Cleanup
  const idx = ctx.enemies.indexOf(enemy);
  if (idx >= 0) {
    const e = ctx.enemies[idx];
    e.sprite.destroy();
    e.hpBar.destroy();
    ctx.enemies.splice(idx, 1);
  }

  if (wasBoss) {
    ctx.boss = null;
    // Boss defeated signal — handled by GameScene
  }
}

// ================================================================
// XP
// ================================================================

export function spawnXpGem(ctx: GameContext, x: number, y: number, value: number): void {
  const sprite = (ctx.scene.physics as Phaser.Physics.Arcade.ArcadePhysics).add
    .sprite(x, y, "xp-gem").setDepth(3);
  ctx.xpGemGroup.add(sprite);
  sprite.body!.setCircle(16);
  ctx.xpGems.push({ sprite, value });
}

export function updateXpGemMagnet(ctx: GameContext): void {
  const magnetRange = ctx.xpMagnetRange + ctx.level * 5;
  const magnetSpeed = 200 + ctx.level * 10;
  const ax = ctx.ace.sprite.x;
  const ay = ctx.ace.sprite.y;

  for (let i = ctx.xpGems.length - 1; i >= 0; i--) {
    const gem = ctx.xpGems[i];
    if (!gem.sprite.active) {
      gem.sprite.destroy();
      ctx.xpGems.splice(i, 1);
      continue;
    }

    const dist = Phaser.Math.Distance.Between(ax, ay, gem.sprite.x, gem.sprite.y);

    if (dist < magnetRange || gem.magnetized) {
      gem.magnetized = true;
      const angle = Math.atan2(ay - gem.sprite.y, ax - gem.sprite.x);
      gem.sprite.setVelocity(Math.cos(angle) * magnetSpeed, Math.sin(angle) * magnetSpeed);
    }
  }
}

export function collectXpGem(ctx: GameContext, gem: XpGem): void {
  sfx.playPickup();
  ctx.xp += gem.value;
  gem.sprite.destroy();
  const idx = ctx.xpGems.indexOf(gem);
  if (idx >= 0) ctx.xpGems.splice(idx, 1);

  while (ctx.xp >= ctx.xpToNext) {
    ctx.xp -= ctx.xpToNext;
    ctx.level++;
    ctx.xpToNext = Math.floor(XP_PER_LEVEL_BASE * Math.pow(XP_LEVEL_SCALE, ctx.level - 1));
    onLevelUp(ctx);
  }
}

function onLevelUp(ctx: GameContext): void {
  ctx.ace.attackRange += 3;
  if (ctx.ace.attackCooldown > 350) ctx.ace.attackCooldown -= 15;
  ctx.scene.cameras.main.flash(200, 255, 255, 255);
  sfx.playLevelUp();
  // pendingLevelUp triggers showLevelUpSelection in GameScene
  ctx.pendingLevelUp = true;
}

// ================================================================
// ITEMS
// ================================================================

export function spawnItem(ctx: GameContext, x: number, y: number): void {
  const types: ItemType[] = ["heal", "bomb", "magnet"];
  const weights = [0.5, 0.25, 0.25];
  let r = Math.random();
  let type: ItemType = "heal";
  for (let i = 0; i < types.length; i++) {
    r -= weights[i];
    if (r <= 0) { type = types[i]; break; }
  }

  const texKey = `item-${type}`;
  const sprite = (ctx.scene.physics as Phaser.Physics.Arcade.ArcadePhysics).add
    .sprite(x, y, texKey).setDepth(4);
  ctx.itemGroup.add(sprite);
  sprite.body!.setCircle(12);

  sprite.setScale(0);
  ctx.scene.tweens.add({
    targets: sprite,
    scaleX: 1.5, scaleY: 1.5,
    duration: 200,
    ease: "Back.easeOut",
    onComplete: () => {
      if (sprite.active) {
        ctx.scene.tweens.add({
          targets: sprite,
          scaleX: 1, scaleY: 1,
          duration: 150,
        });
      }
    },
  });

  ctx.items.push({ sprite, type, ttl: 10000 });
}

export function updateItems(ctx: GameContext, dt: number): void {
  const ax = ctx.ace.sprite.x;
  const ay = ctx.ace.sprite.y;

  for (let i = ctx.items.length - 1; i >= 0; i--) {
    const item = ctx.items[i];
    if (!item.sprite.active) {
      item.sprite.destroy();
      ctx.items.splice(i, 1);
      continue;
    }

    item.ttl -= dt * 1000;

    if (item.ttl < 3000) {
      item.sprite.setAlpha(Math.sin(ctx.scene.time.now * 0.01) * 0.3 + 0.7);
    }

    if (item.ttl <= 0) {
      item.sprite.destroy();
      ctx.items.splice(i, 1);
      continue;
    }

    const dist = Phaser.Math.Distance.Between(ax, ay, item.sprite.x, item.sprite.y);
    if (dist < 24) {
      collectItem(ctx, item);
      ctx.items.splice(i, 1);
    }
  }
}

function collectItem(ctx: GameContext, item: { sprite: Phaser.Physics.Arcade.Sprite; type: ItemType; ttl: number }): void {
  sfx.playPickup();

  switch (item.type) {
    case "heal": {
      const healAmt = Math.floor(ctx.ace.maxHp * 0.25);
      ctx.ace.hp = Math.min(ctx.ace.hp + healAmt, ctx.ace.maxHp);
      showDamagePopup(ctx, ctx.ace.sprite.x, ctx.ace.sprite.y - 20, `+${healAmt}`, "#44ff44");
      break;
    }
    case "bomb": {
      ctx.scene.cameras.main.flash(150, 255, 160, 0);
      ctx.scene.cameras.main.shake(200, 0.01);
      for (const e of ctx.enemies) {
        if (!e.sprite.active) continue;
        const dist = Phaser.Math.Distance.Between(
          ctx.ace.sprite.x, ctx.ace.sprite.y,
          e.sprite.x, e.sprite.y,
        );
        if (dist < 300) {
          e.hp -= Math.floor(e.maxHp * 0.5);
          e.sprite.setTint(0xffffff);
          ctx.scene.time.delayedCall(100, () => {
            if (e.sprite.active) e.sprite.setTint(0xff8888);
          });
          if (e.hp <= 0) {
            ctx.onEnemyDeath(e);
          }
        }
      }
      showDamagePopup(ctx, ctx.ace.sprite.x, ctx.ace.sprite.y - 30, "BOOM!", "#ff6600");
      break;
    }
    case "magnet": {
      for (const gem of ctx.xpGems) {
        if (!gem.sprite.active) continue;
        const angle = Math.atan2(
          ctx.ace.sprite.y - gem.sprite.y,
          ctx.ace.sprite.x - gem.sprite.x,
        );
        gem.sprite.setVelocity(Math.cos(angle) * 600, Math.sin(angle) * 600);
      }
      showDamagePopup(ctx, ctx.ace.sprite.x, ctx.ace.sprite.y - 30, "MAGNET!", "#66ccff");
      break;
    }
  }

  item.sprite.destroy();
}

// ================================================================
// SKILL EFFECTS
// ================================================================

export function updateSkillEffects(ctx: GameContext, dt: number): void {
  if (!ctx.skillId) return;
  ctx.skillTimer += dt;

  switch (ctx.skillId) {
    case "overgrow":
      if (ctx.skillTimer >= 3) {
        ctx.skillTimer -= 3;
        if (ctx.ace.hp < ctx.ace.maxHp) {
          const heal = Math.max(1, Math.floor(ctx.ace.maxHp * 0.01));
          ctx.ace.hp = Math.min(ctx.ace.maxHp, ctx.ace.hp + heal);
        }
      }
      break;

    case "speed_boost":
      if (ctx.skillTimer >= 30) {
        ctx.skillTimer -= 30;
        ctx.speedBoostStacks++;
        ctx.ace.attackCooldown = Math.max(200, Math.floor(ctx.ace.attackCooldown * 0.95));
        showDamagePopup(ctx, ctx.ace.sprite.x, ctx.ace.sprite.y - 30, "SPD BOOST!", "#fbbf24");
      }
      break;

    case "unburden":
      if (ctx.unburdenTimer > 0) {
        ctx.unburdenTimer -= dt;
        if (ctx.unburdenTimer <= 0) {
          ctx.ace.speed = Math.floor(ctx.ace.speed / 1.5);
          ctx.unburdenTimer = 0;
        }
      }
      break;

    case "levitate":
      if (ctx.phaseTimer > 0) {
        ctx.phaseTimer -= dt;
        ctx.ace.sprite.setAlpha(0.5);
        if (ctx.phaseTimer <= 0) {
          ctx.ace.sprite.setAlpha(1);
          ctx.phaseTimer = 0;
        }
      }
      break;

    case "damp":
      for (const e of ctx.enemies) {
        if (!e.sprite.active) continue;
        const dist = Phaser.Math.Distance.Between(
          ctx.ace.sprite.x, ctx.ace.sprite.y,
          e.sprite.x, e.sprite.y,
        );
        if (dist < 120) {
          const body = e.sprite.body as Phaser.Physics.Arcade.Body;
          if (body) {
            body.velocity.x *= 0.8;
            body.velocity.y *= 0.8;
          }
        }
      }
      break;
  }
}

// ================================================================
// FIND NEAREST ENEMY (shared util)
// ================================================================

export function findNearestEnemy(ctx: GameContext, x: number, y: number, range: number): EnemyData | null {
  let best: EnemyData | null = null;
  let bestDist = range;
  for (const e of ctx.enemies) {
    const d = Phaser.Math.Distance.Between(x, y, e.sprite.x, e.sprite.y);
    if (d < bestDist) {
      bestDist = d;
      best = e;
    }
  }
  return best;
}

// ================================================================
// KILL STREAK
// ================================================================

export function updateKillStreak(ctx: GameContext): void {
  if (ctx.killStreak > 0 && ctx.scene.time.now - ctx.lastKillTime > 2000) {
    ctx.killStreak = 0;
  }
}

// ================================================================
// EVOLUTION
// ================================================================

export function evolveAce(ctx: GameContext): void {
  const chain = EVOLUTION_CHAINS[ctx.ace.pokemonKey];
  if (!chain || ctx.aceEvoStage >= chain.length - 1) return;

  ctx.aceEvoStage++;
  const stage = chain[ctx.aceEvoStage];
  const prevStage = chain[ctx.aceEvoStage - 1];
  const atkBoost = stage.atkMult / prevStage.atkMult;
  const hpBoost = stage.hpMult / prevStage.hpMult;
  const spdBoost = stage.speedMult / prevStage.speedMult;

  ctx.ace.atk = Math.floor(ctx.ace.atk * atkBoost);
  ctx.ace.maxHp = Math.floor(ctx.ace.maxHp * hpBoost);
  ctx.ace.hp = ctx.ace.maxHp;
  ctx.ace.speed = Math.floor(ctx.ace.speed * spdBoost);
  ctx.ace.attackCooldown = Math.max(200, Math.floor(ctx.ace.attackCooldown * (1 / spdBoost)));

  const newTexKey = pacTexKey(stage.spriteKey);
  if (ctx.scene.textures.exists(newTexKey)) {
    ctx.ace.sprite.stop();
    ctx.ace.sprite.removeAllListeners("animationcomplete");
    ctx.ace.sprite.setTexture(newTexKey, "Normal/Walk/Anim/0/0000");
    const walkAnim = `${stage.spriteKey}-walk-down`;
    if (ctx.scene.anims.exists(walkAnim)) {
      ctx.ace.sprite.play(walkAnim);
    }
    ctx.ace.pokemonKey = stage.spriteKey;
  }
  ctx.ace.sprite.setScale(stage.scale);

  ctx.scene.cameras.main.flash(500, 255, 0, 255);
  ctx.scene.cameras.main.shake(300, 0.01);
  spawnDeathParticles(ctx, ctx.ace.sprite.x, ctx.ace.sprite.y, true);

  const txt = ctx.scene.add
    .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, `\u2605 ${stage.name} \u2605`, {
      fontFamily: "monospace",
      fontSize: "22px",
      color: "#ff00ff",
      stroke: "#000",
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(300)
    .setScrollFactor(0);

  ctx.scene.tweens.add({
    targets: txt,
    y: txt.y - 50,
    alpha: 0,
    duration: 2500,
    ease: "Cubic.easeOut",
    onComplete: () => txt.destroy(),
  });
}
