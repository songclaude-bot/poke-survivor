/**
 * UIComponents — Reusable Phaser UI elements: buttons, panels, tabs, grids.
 * Replaces raw `[text]` buttons with proper styled components.
 */
import Phaser from "phaser";
import { GAME_WIDTH, COLORS } from "../config";

// ────────────────────────────────────────────
// Button
// ────────────────────────────────────────────

export interface ButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label: string;
  fontSize?: string;
  color?: number;        // fill
  textColor?: string;
  borderColor?: number;
  onClick: () => void;
  depth?: number;
}

export function createButton(cfg: ButtonConfig): Phaser.GameObjects.Container {
  const {
    scene, x, y,
    width = 160, height = 38,
    label, fontSize = "14px",
    color = 0x1a1a2e,
    textColor = "#fbbf24",
    borderColor = 0xfbbf24,
    onClick, depth = 20,
  } = cfg;

  const container = scene.add.container(x, y).setDepth(depth);

  // Background
  const bg = scene.add.graphics();
  bg.fillStyle(color, 0.92);
  bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
  bg.lineStyle(2, borderColor, 0.9);
  bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
  container.add(bg);

  // Label
  const txt = scene.add.text(0, 0, label, {
    fontFamily: "monospace",
    fontSize,
    color: textColor,
    stroke: "#000",
    strokeThickness: 1,
  }).setOrigin(0.5);
  container.add(txt);

  // Hit area
  const hitZone = scene.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
  container.add(hitZone);

  // Hover effects
  hitZone.on("pointerover", () => {
    scene.tweens.add({
      targets: container,
      scaleX: 1.04, scaleY: 1.04,
      duration: 80,
    });
    txt.setColor("#fff");
  });
  hitZone.on("pointerout", () => {
    scene.tweens.add({
      targets: container,
      scaleX: 1, scaleY: 1,
      duration: 80,
    });
    txt.setColor(textColor);
  });

  // Press effect — call onClick directly, NOT via tween onComplete
  // (Phaser 3.90 tween onComplete is unreliable)
  hitZone.on("pointerdown", () => {
    container.setScale(0.95);
    setTimeout(() => {
      container.setScale(1);
    }, 80);
    onClick();
  });

  return container;
}

// ────────────────────────────────────────────
// Panel (background card)
// ────────────────────────────────────────────

export interface PanelConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor?: number;
  fillAlpha?: number;
  borderColor?: number;
  radius?: number;
  depth?: number;
}

export function createPanel(cfg: PanelConfig): Phaser.GameObjects.Graphics {
  const {
    scene, x, y, width, height,
    fillColor = 0x0e0e1a, fillAlpha = 0.92,
    borderColor = 0x333355, radius = 8, depth = 5,
  } = cfg;

  const g = scene.add.graphics().setDepth(depth);
  g.fillStyle(fillColor, fillAlpha);
  g.fillRoundedRect(x, y, width, height, radius);
  g.lineStyle(1, borderColor, 0.7);
  g.strokeRoundedRect(x, y, width, height, radius);
  return g;
}

// ────────────────────────────────────────────
// Tab Bar
// ────────────────────────────────────────────

export interface TabBarConfig {
  scene: Phaser.Scene;
  y: number;
  tabs: { label: string; icon?: string }[];
  activeIdx: number;
  onSelect: (idx: number) => void;
  depth?: number;
}

export function createTabBar(cfg: TabBarConfig): Phaser.GameObjects.Container {
  const { scene, y, tabs, activeIdx, onSelect, depth = 50 } = cfg;
  const container = scene.add.container(0, y).setDepth(depth);

  const tabW = GAME_WIDTH / tabs.length;
  const tabH = 44;

  // Background strip
  const bg = scene.add.graphics();
  bg.fillStyle(0x0a0a14, 0.95);
  bg.fillRect(0, 0, GAME_WIDTH, tabH);
  bg.lineStyle(1, 0x333355, 0.6);
  bg.lineBetween(0, 0, GAME_WIDTH, 0);
  container.add(bg);

  tabs.forEach((tab, i) => {
    const cx = tabW * i + tabW / 2;
    const isActive = i === activeIdx;

    // Active indicator
    if (isActive) {
      const indicator = scene.add.graphics();
      indicator.fillStyle(0x667eea, 0.8);
      indicator.fillRoundedRect(cx - tabW / 2 + 4, 2, tabW - 8, 3, 2);
      container.add(indicator);
    }

    // Icon (emoji or text)
    if (tab.icon) {
      const icon = scene.add.text(cx, 13, tab.icon, {
        fontSize: "14px",
      }).setOrigin(0.5);
      container.add(icon);
    }

    // Label
    const label = scene.add.text(cx, tab.icon ? 32 : 22, tab.label, {
      fontFamily: "monospace",
      fontSize: "9px",
      color: isActive ? "#fbbf24" : "#666",
    }).setOrigin(0.5);
    container.add(label);

    // Hit area
    const zone = scene.add.zone(cx, tabH / 2, tabW, tabH).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", () => {
      if (i !== activeIdx) onSelect(i);
    });
    container.add(zone);
  });

  return container;
}

// ────────────────────────────────────────────
// Scrollable Container helper
// ────────────────────────────────────────────

export function enableVerticalScroll(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  maskY: number,
  maskH: number,
  contentH: number,
): void {
  // Mask
  const shape = scene.make.graphics({ x: 0, y: 0 });
  shape.fillStyle(0xffffff);
  shape.fillRect(0, maskY, GAME_WIDTH, maskH);
  container.setMask(shape.createGeometryMask());

  let startY = 0;
  let startContY = 0;
  const minY = maskY - (contentH - maskH);
  const maxY = maskY;

  scene.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
    if (p.y >= maskY && p.y <= maskY + maskH) {
      startY = p.y;
      startContY = container.y;
    }
  });

  scene.input.on("pointermove", (p: Phaser.Input.Pointer) => {
    if (!p.isDown) return;
    if (contentH <= maskH) return;
    const dy = p.y - startY;
    container.y = Phaser.Math.Clamp(startContY + dy, minY, maxY);
  });
}

// ────────────────────────────────────────────
// Icon Badge (coin count, etc.)
// ────────────────────────────────────────────

export function createCoinBadge(
  scene: Phaser.Scene, x: number, y: number, amount: number, depth = 30,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y).setDepth(depth);

  // Coin icon
  const coinGfx = scene.add.graphics();
  coinGfx.fillStyle(0xfbbf24, 1);
  coinGfx.fillCircle(0, 0, 8);
  coinGfx.fillStyle(0xf59e0b, 1);
  coinGfx.fillCircle(0, 0, 5);
  container.add(coinGfx);

  // Text
  const txt = scene.add.text(14, 0, `${amount}`, {
    fontFamily: "monospace",
    fontSize: "14px",
    color: "#fbbf24",
    stroke: "#000",
    strokeThickness: 2,
  }).setOrigin(0, 0.5);
  container.add(txt);

  return container;
}
