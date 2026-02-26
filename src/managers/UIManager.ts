/**
 * UIManager — HUD rendering, minimap, danger vignette, warnings, damage popups.
 * Pure functions that operate on GameContext.
 */
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  COLORS,
} from "../config";
import { getDungeonName, getDifficultyLabel } from "../data/GameData";
import type { GameContext } from "./GameContext";

// ================================================================
// HUD DRAW
// ================================================================

export function drawHUD(ctx: GameContext): void {
  // HP bar
  ctx.hpBar.clear();
  const hpW = 160;
  const hpH = 8;
  const hpX = 8;
  const hpY = 8;
  ctx.hpBar.fillStyle(0x333333, 0.8);
  ctx.hpBar.fillRect(hpX, hpY, hpW, hpH);
  const hpRatio = ctx.ace.hp / ctx.ace.maxHp;
  const hpColor = hpRatio > 0.5 ? COLORS.hpGreen : hpRatio > 0.25 ? COLORS.gold : COLORS.hpRed;
  ctx.hpBar.fillStyle(hpColor, 1);
  ctx.hpBar.fillRect(hpX, hpY, hpW * hpRatio, hpH);
  ctx.hpBar.lineStyle(1, 0x555555, 0.8);
  ctx.hpBar.strokeRect(hpX, hpY, hpW, hpH);

  // XP bar
  ctx.xpBar.clear();
  const xpW = 160;
  const xpH = 4;
  const xpX = 8;
  const xpY = 19;
  ctx.xpBar.fillStyle(0x222233, 0.8);
  ctx.xpBar.fillRect(xpX, xpY, xpW, xpH);
  ctx.xpBar.fillStyle(COLORS.xpBlue, 1);
  ctx.xpBar.fillRect(xpX, xpY, xpW * (ctx.xp / ctx.xpToNext), xpH);

  // Boss HP bar
  if (ctx.boss) {
    ctx.bossHpBar.setVisible(true);
    ctx.bossNameText.setVisible(true);
    ctx.bossHpBar.clear();
    const bw = GAME_WIDTH - 40;
    const bx = 20;
    const by = GAME_HEIGHT - 55;
    ctx.bossHpBar.fillStyle(0x333333, 0.8);
    ctx.bossHpBar.fillRect(bx, by, bw, 10);
    ctx.bossHpBar.fillStyle(0xff00ff, 1);
    ctx.bossHpBar.fillRect(bx, by, bw * (ctx.boss.hp / ctx.boss.maxHp), 10);
    ctx.bossHpBar.lineStyle(1, 0x888888, 0.8);
    ctx.bossHpBar.strokeRect(bx, by, bw, 10);
  } else {
    ctx.bossHpBar.setVisible(false);
    ctx.bossNameText.setVisible(false);
  }

  // Update texts
  const streakSuffix = ctx.killStreak >= 5 ? ` \u{1f525}${ctx.killStreak}` : "";
  ctx.killText.setText(`Kill: ${ctx.kills}${streakSuffix}`);
  ctx.killText.setColor(ctx.killStreak >= 10 ? "#fbbf24" : "#888");
  ctx.levelText.setText(`Lv.${ctx.level}`);
  const legionInfo = ctx.legions.length > 0 ? ` [${ctx.legions.length}]` : "";
  const diffLabel = getDifficultyLabel(ctx.cycleNumber);
  const dungeonName = getDungeonName(ctx.cycleNumber);
  ctx.cycleText.setText(`${dungeonName} \u2014 Cycle ${ctx.cycleNumber}${legionInfo} ${diffLabel}`);
  ctx.cycleText.setColor(ctx.cycleNumber >= 5 ? "#f43f5e" : ctx.cycleNumber >= 3 ? "#fbbf24" : "#888");

  drawMinimap(ctx);
}

// ================================================================
// MINIMAP
// ================================================================

function drawMinimap(ctx: GameContext): void {
  ctx.minimapGfx.clear();
  const mapSize = 60;
  const mapX = GAME_WIDTH - mapSize - 8;
  const mapY = GAME_HEIGHT - mapSize - 28;
  const range = 400;

  ctx.minimapGfx.fillStyle(0x000000, 0.4);
  ctx.minimapGfx.fillRect(mapX, mapY, mapSize, mapSize);
  ctx.minimapGfx.lineStyle(1, 0x333355, 0.6);
  ctx.minimapGfx.strokeRect(mapX, mapY, mapSize, mapSize);

  const cx = mapX + mapSize / 2;
  const cy = mapY + mapSize / 2;
  const ax = ctx.ace.sprite.x;
  const ay = ctx.ace.sprite.y;
  const halfMap = mapSize / 2;

  // Enemies (red dots)
  ctx.minimapGfx.fillStyle(0xff4444, 0.7);
  for (const e of ctx.enemies) {
    const dx = (e.sprite.x - ax) / range * halfMap;
    const dy = (e.sprite.y - ay) / range * halfMap;
    if (Math.abs(dx) < halfMap && Math.abs(dy) < halfMap) {
      ctx.minimapGfx.fillRect(cx + dx - 1, cy + dy - 1, 2, 2);
    }
  }

  // Companions (cyan dots)
  ctx.minimapGfx.fillStyle(0x00ddff, 0.8);
  for (const c of ctx.companions) {
    const dx = (c.sprite.x - ax) / range * halfMap;
    const dy = (c.sprite.y - ay) / range * halfMap;
    ctx.minimapGfx.fillCircle(cx + dx, cy + dy, 1.5);
  }

  // XP gems (blue dots)
  ctx.minimapGfx.fillStyle(0x667eea, 0.5);
  for (const g of ctx.xpGems) {
    const dx = (g.sprite.x - ax) / range * halfMap;
    const dy = (g.sprite.y - ay) / range * halfMap;
    if (Math.abs(dx) < halfMap && Math.abs(dy) < halfMap) {
      ctx.minimapGfx.fillRect(cx + dx, cy + dy, 1, 1);
    }
  }

  // Player (gold center dot)
  ctx.minimapGfx.fillStyle(0xffd700, 1);
  ctx.minimapGfx.fillCircle(cx, cy, 2);

  // Boss (magenta blip)
  if (ctx.boss) {
    const dx = (ctx.boss.sprite.x - ax) / range * halfMap;
    const dy = (ctx.boss.sprite.y - ay) / range * halfMap;
    ctx.minimapGfx.fillStyle(0xff00ff, 1);
    ctx.minimapGfx.fillCircle(
      Phaser.Math.Clamp(cx + dx, mapX + 2, mapX + mapSize - 2),
      Phaser.Math.Clamp(cy + dy, mapY + 2, mapY + mapSize - 2),
      3,
    );
  }
}

// ================================================================
// DANGER VIGNETTE
// ================================================================

export function updateDangerVignette(ctx: GameContext): void {
  const hpRatio = ctx.ace.hp / ctx.ace.maxHp;
  if (hpRatio < 0.3) {
    const pulse = Math.sin(ctx.scene.time.now * 0.005) * 0.15 + 0.2;
    const intensity = (1 - hpRatio / 0.3) * pulse;
    ctx.dangerVignette.clear();
    ctx.dangerVignette.fillStyle(0xff0000, intensity);
    ctx.dangerVignette.fillRect(0, 0, GAME_WIDTH, 40);
    ctx.dangerVignette.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);
    ctx.dangerVignette.fillRect(0, 0, 30, GAME_HEIGHT);
    ctx.dangerVignette.fillRect(GAME_WIDTH - 30, 0, 30, GAME_HEIGHT);
    ctx.dangerVignette.setAlpha(1);
  } else {
    ctx.dangerVignette.clear();
  }
}

// ================================================================
// WARNING BANNER
// ================================================================

export function showWarning(ctx: GameContext, text: string): void {
  const warn = ctx.scene.add
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

  // Fade in → hold → fade out → destroy. No yoyo/repeat.
  ctx.scene.tweens.chain({
    targets: warn,
    tweens: [
      { alpha: 1, duration: 250 },
      { alpha: 1, duration: 600, hold: 600 },
      { alpha: 0, duration: 300 },
    ],
    onComplete: () => warn.destroy(),
  });

  // Red flash: fade in then fade out, simple and clean
  const flash = ctx.scene.add
    .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0)
    .setDepth(200)
    .setScrollFactor(0);
  ctx.scene.tweens.chain({
    targets: flash,
    tweens: [
      { alpha: 0.18, duration: 150 },
      { alpha: 0, duration: 350 },
    ],
    onComplete: () => flash.destroy(),
  });
}

// ================================================================
// DAMAGE POPUPS
// ================================================================

export function showDamagePopup(ctx: GameContext, x: number, y: number, amount: number | string, color = "#fff"): void {
  const label = typeof amount === "string" ? amount : Math.ceil(amount).toString();
  let txt = ctx.dmgPopups.pop();
  if (txt) {
    txt.setPosition(x, y - 10);
    txt.setText(label);
    txt.setStyle({ color });
    txt.setAlpha(1).setVisible(true);
  } else {
    txt = ctx.scene.add
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

  ctx.scene.tweens.add({
    targets: txt,
    y: txt.y - 24,
    alpha: 0,
    duration: 600,
    onComplete: () => {
      txt.setVisible(false);
      if (ctx.dmgPopups.length < 30) ctx.dmgPopups.push(txt);
      else txt.destroy();
    },
  });
}

// ================================================================
// STREAK TEXT
// ================================================================

export function showStreakText(ctx: GameContext, streak: number): void {
  const labels = ["", "", "", "", "", "", "", "", "", "",
    "COMBO x10!", "", "", "", "", "COMBO x15!", "", "", "", "",
    "RAMPAGE x20!", "", "", "", "", "MASSACRE x25!"];
  const label = labels[streak] ?? `COMBO x${streak}!`;
  const color = streak >= 20 ? "#f43f5e" : streak >= 15 ? "#fbbf24" : "#667eea";

  const txt = ctx.scene.add
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

  ctx.scene.tweens.add({
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

// ================================================================
// DEATH PARTICLES
// ================================================================

export function spawnDeathParticles(ctx: GameContext, x: number, y: number, isBoss: boolean): void {
  const count = isBoss ? 12 : 5;
  const color = isBoss ? 0xfbbf24 : 0xff6666;
  for (let i = 0; i < count; i++) {
    const p = ctx.scene.add.circle(x, y, isBoss ? 4 : 2, color, 0.8).setDepth(50);
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * (isBoss ? 100 : 60);
    ctx.scene.tweens.add({
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

import Phaser from "phaser";
