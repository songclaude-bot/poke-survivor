import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config";
import {
  loadPmdSprites,
  loadPmdPortraits,
  loadPmdAttackSprites,
  ESSENTIAL_KEYS,
  createPmdAnimations,
  createPmdAttackAnimations,
} from "../sprites/PmdSpriteLoader";
import {
  loadAttackEffects,
  createAttackAnimations,
} from "../effects/AttackEffects";

const LOADING_TIPS = [
  "Collect XP gems to level up!",
  "Evolve at Lv.5 and Lv.10!",
  "Each starter has a unique passive skill",
  "Elites drop better items — watch for gold tints",
  "Wave clear = 10% HP heal + XP vacuum",
  "Defeat the boss before time runs out!",
  "Companions attack automatically",
  "Kill streaks of 10+ give bonus effects",
  "Higher cycles = stronger enemies & rewards",
  "Try all 15 starters for different playstyles",
  "Lifesteal + crit builds are powerful late game",
  "Bombs damage all enemies within range",
  "Magnet items pull all XP gems to you",
  "Machop hides in the lobby... can you find him?",
  "Speed Boost stacks every 30 seconds!",
];

/**
 * BootScene — Two-phase boot:
 * Phase 1 (preload): Local assets only (placeholders, dungeon tiles, attack effects)
 * Phase 2 (create):  Show confirmation screen → user taps → download remote sprites
 */
export class BootScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private tipText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private tipIdx = 0;
  private splashContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "BootScene" });
  }

  // ────────────────────────────────────────────
  // Phase 1: Local assets only (fast, no network)
  // ────────────────────────────────────────────

  preload(): void {
    this.createPlaceholderSprites();

    // Only load bundled local assets — no remote network requests
    this.load.image("dungeon-floor", "assets/dungeon-floor.png");
    this.load.image("dungeon-tiny", "assets/dungeon-tiny.png");
    this.load.image("dungeon-steel", "assets/dungeon-steel.png");
    this.load.image("dungeon-crystal", "assets/dungeon-crystal.png");
    this.load.image("dungeon-forest", "assets/dungeon-forest.png");
    this.load.image("dungeon-frost", "assets/dungeon-frost.png");

    // Attack effect spritesheets (local)
    loadAttackEffects(this);
  }

  // ────────────────────────────────────────────
  // Phase 2: Show confirmation, then load remote
  // ────────────────────────────────────────────

  create(): void {
    createAttackAnimations(this);
    this.showSplashScreen();
  }

  private showSplashScreen(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.splashContainer = this.add.container(0, 0).setDepth(100);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a0f, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.splashContainer.add(bg);

    // Title
    const title = this.add.text(cx, cy - 120, "POKÉ SURVIVOR", {
      fontFamily: "monospace",
      fontSize: "24px",
      color: "#fbbf24",
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.splashContainer.add(title);

    // Subtitle
    const sub = this.add.text(cx, cy - 90, "PMD × Vampire Survivors", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#667eea",
    }).setOrigin(0.5);
    this.splashContainer.add(sub);

    // Data usage info
    const spriteCount = ESSENTIAL_KEYS.size;
    const infoLines = [
      `${spriteCount} sprites to download (~8MB)`,
      "Cached for 7 days after first load",
      "",
      "Uses mobile data / Wi-Fi",
    ];
    const info = this.add.text(cx, cy - 20, infoLines.join("\n"), {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#888",
      align: "center",
      lineSpacing: 4,
    }).setOrigin(0.5);
    this.splashContainer.add(info);

    // Start button
    const btnW = 200;
    const btnH = 48;
    const btnY = cy + 60;
    const btnGfx = this.add.graphics();
    btnGfx.fillStyle(0x667eea, 1);
    btnGfx.fillRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
    btnGfx.lineStyle(2, 0xa78bfa, 0.6);
    btnGfx.strokeRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
    this.splashContainer.add(btnGfx);

    const btnText = this.add.text(cx, btnY, "START LOADING", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 1,
    }).setOrigin(0.5);
    this.splashContainer.add(btnText);

    // Pulse animation on button
    this.tweens.add({
      targets: [btnGfx, btnText],
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Footer
    const footer = this.add.text(cx, GAME_HEIGHT - 40, "Sprites: pokemonAutoChess (GPL-3.0)\nCDN: jsDelivr (7-day cache)", {
      fontFamily: "monospace",
      fontSize: "7px",
      color: "#444",
      align: "center",
    }).setOrigin(0.5);
    this.splashContainer.add(footer);

    // Click anywhere to start (Phaser 3.90 scrollFactor workaround)
    this.input.once("pointerdown", () => {
      this.startRemoteLoading();
    });
  }

  // ────────────────────────────────────────────
  // Remote loading phase
  // ────────────────────────────────────────────

  private startRemoteLoading(): void {
    // Remove splash
    this.splashContainer.destroy();

    // Show loading UI
    this.createLoadingUI();

    // Configure loader
    this.load.maxParallelDownloads = 12;
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.warn(`[BootScene] Failed to load: ${file.key} — using placeholder`);
    });

    // Queue remote sprite assets
    loadPmdSprites(this);
    loadPmdPortraits(this);
    loadPmdAttackSprites(this);

    // Progress events
    this.load.on("progress", (value: number) => {
      this.updateProgress(value);
    });

    this.load.on("fileprogress", (file: Phaser.Loader.File) => {
      const name = file.key.replace("pac-", "").replace("portrait-", "").replace("atk-", "");
      this.statusText.setText(name);
    });

    this.load.once("complete", () => {
      this.statusText.setText("Creating animations...");
      // Use setTimeout to let the status text render before blocking on anim creation
      setTimeout(() => {
        createPmdAnimations(this);
        createPmdAttackAnimations(this);
        this.scene.start("TitleScene");
      }, 50);
    });

    // Start the manual load
    this.load.start();
  }

  private createLoadingUI(): void {
    const centerX = GAME_WIDTH / 2;

    // Title
    this.add.text(centerX, GAME_HEIGHT / 2 - 100, "POKÉ SURVIVOR", {
      fontFamily: "monospace",
      fontSize: "22px",
      color: "#fbbf24",
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(centerX, GAME_HEIGHT / 2 - 75, "Downloading sprites...", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#667eea",
    }).setOrigin(0.5);

    // Progress bar background
    const barW = 260;
    const barH = 12;
    const barX = centerX - barW / 2;
    const barY = GAME_HEIGHT / 2 - 40;

    this.add.graphics()
      .fillStyle(0x111118, 0.9)
      .fillRoundedRect(barX - 2, barY - 2, barW + 4, barH + 4, 4)
      .lineStyle(1, 0x333355, 0.8)
      .strokeRoundedRect(barX - 2, barY - 2, barW + 4, barH + 4, 4);

    this.progressBar = this.add.graphics();

    // Percentage text
    this.add.text(centerX, barY + barH + 14, "", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#888",
    }).setOrigin(0.5).setName("percentText");

    // Current asset name
    this.statusText = this.add.text(centerX, barY + barH + 32, "", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#555",
    }).setOrigin(0.5);

    // Tip text (rotating)
    this.tipIdx = Math.floor(Math.random() * LOADING_TIPS.length);
    this.tipText = this.add.text(centerX, GAME_HEIGHT / 2 + 60, `TIP: ${LOADING_TIPS[this.tipIdx]}`, {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#a78bfa",
      wordWrap: { width: 320 },
      align: "center",
    }).setOrigin(0.5);

    // Rotate tips every 4 seconds
    this.time.addEvent({
      delay: 4000,
      loop: true,
      callback: () => {
        this.tipIdx = (this.tipIdx + 1) % LOADING_TIPS.length;
        this.tweens.add({
          targets: this.tipText,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            this.tipText.setText(`TIP: ${LOADING_TIPS[this.tipIdx]}`);
            this.tweens.add({
              targets: this.tipText,
              alpha: 1,
              duration: 200,
            });
          },
        });
      },
    });

    // Footer
    this.add.text(centerX, GAME_HEIGHT - 50, "Cached via jsDelivr CDN (7 days)", {
      fontFamily: "monospace",
      fontSize: "8px",
      color: "#444",
    }).setOrigin(0.5);
  }

  private updateProgress(value: number): void {
    const barW = 260;
    const barH = 12;
    const barX = GAME_WIDTH / 2 - barW / 2;
    const barY = GAME_HEIGHT / 2 - 40;

    this.progressBar.clear();

    // Gradient fill from blue to purple
    const fillW = Math.max(1, barW * value);
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x667eea),
      Phaser.Display.Color.ValueToColor(0xa78bfa),
      100,
      Math.floor(value * 100),
    );
    const fillColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
    this.progressBar.fillStyle(fillColor, 1);
    this.progressBar.fillRoundedRect(barX, barY, fillW, barH, 3);

    // Update percentage text
    const percentText = this.children.getByName("percentText") as Phaser.GameObjects.Text;
    if (percentText) {
      percentText.setText(`${Math.floor(value * 100)}%`);
    }
  }

  /** Generate colored circle/square textures so we can prototype without external assets */
  private createPlaceholderSprites(): void {
    this.makeCircle("ace", 16, 0xffd700);
    this.makeCircle("companion", 12, 0x00ddff);
    this.makeCircle("enemy", 10, 0xff4444);
    this.makeCircle("enemy-elite", 14, 0xff2222);
    this.makeCircle("boss", 24, 0xff00ff);
    this.makeCircle("projectile", 4, 0xffffff);
    this.makeDiamond("xp-gem", 6, COLORS.xpBlue);
    this.makeCircle("item-heal", 8, 0x44ff44);
    this.makeCircle("item-bomb", 8, 0xff6600);
    this.makeCircle("item-magnet", 8, 0x66ccff);
    this.makeCircle("joy-base", 48, 0x333344, 0.4);
    this.makeCircle("joy-thumb", 20, 0x667eea, 0.7);
  }

  private makeCircle(key: string, radius: number, color: number, alpha = 1): void {
    const g = this.add.graphics();
    g.fillStyle(color, alpha);
    g.fillCircle(radius, radius, radius);
    g.generateTexture(key, radius * 2, radius * 2);
    g.destroy();
  }

  private makeDiamond(key: string, size: number, color: number): void {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillPoints([
      new Phaser.Geom.Point(size, 0),
      new Phaser.Geom.Point(size * 2, size),
      new Phaser.Geom.Point(size, size * 2),
      new Phaser.Geom.Point(0, size),
    ], true);
    g.generateTexture(key, size * 2, size * 2);
    g.destroy();
  }
}
