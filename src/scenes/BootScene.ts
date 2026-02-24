import Phaser from "phaser";
import { COLORS } from "../config";
import {
  loadPmdSprites,
  loadPmdPortraits,
  loadPmdAttackSprites,
  createPmdAnimations,
  createPmdAttackAnimations,
} from "../sprites/PmdSpriteLoader";
import {
  loadAttackEffects,
  createAttackAnimations,
} from "../effects/AttackEffects";

/**
 * BootScene — Generate placeholder graphics & load PMD sprites.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    this.createPlaceholderSprites();

    // Configure loader: don't block game on failed sprite loads
    this.load.maxParallelDownloads = 4;
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.warn(`[BootScene] Failed to load: ${file.key} — using placeholder`);
    });

    // Load PMD sprites from SpriteCollab (async, may fail on network issues)
    loadPmdSprites(this);
    loadPmdPortraits(this);
    loadPmdAttackSprites(this);

    // Load attack effect spritesheets from pokemonAutoChess resources
    loadAttackEffects(this);

    // Show loading progress
    const loadTxt = this.add.text(195, 422, "Loading sprites...", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#667eea",
    }).setOrigin(0.5);

    this.load.on("progress", (value: number) => {
      loadTxt.setText(`Loading... ${Math.floor(value * 100)}%`);
    });

    this.load.on("complete", () => {
      loadTxt.destroy();
    });
  }

  create(): void {
    // Create PMD walk + attack pose animations
    createPmdAnimations(this);
    createPmdAttackAnimations(this);
    // Create attack effect animations (type-based projectiles, hits, melee)
    createAttackAnimations(this);
    this.scene.start("TitleScene");
  }

  /** Generate colored circle/square textures so we can prototype without external assets */
  private createPlaceholderSprites(): void {
    // Player (ace) — yellow circle
    this.makeCircle("ace", 16, 0xffd700);

    // Companion — cyan circle (smaller)
    this.makeCircle("companion", 12, 0x00ddff);

    // Enemy — red circle
    this.makeCircle("enemy", 10, 0xff4444);

    // Enemy elite — larger red
    this.makeCircle("enemy-elite", 14, 0xff2222);

    // Boss — big magenta
    this.makeCircle("boss", 24, 0xff00ff);

    // Projectile — small white
    this.makeCircle("projectile", 4, 0xffffff);

    // XP gem — small green diamond
    this.makeDiamond("xp-gem", 6, COLORS.xpBlue);

    // Item drops
    this.makeCircle("item-heal", 8, 0x44ff44);   // green = heal
    this.makeCircle("item-bomb", 8, 0xff6600);   // orange = bomb
    this.makeCircle("item-magnet", 8, 0x66ccff); // light blue = magnet

    // Virtual joystick parts
    this.makeCircle("joy-base", 48, 0x333344, 0.4);
    this.makeCircle("joy-thumb", 20, 0x667eea, 0.7);
  }

  private makeCircle(
    key: string,
    radius: number,
    color: number,
    alpha = 1,
  ): void {
    const g = this.add.graphics();
    g.fillStyle(color, alpha);
    g.fillCircle(radius, radius, radius);
    g.generateTexture(key, radius * 2, radius * 2);
    g.destroy();
  }

  private makeDiamond(key: string, size: number, color: number): void {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillPoints(
      [
        new Phaser.Geom.Point(size, 0),
        new Phaser.Geom.Point(size * 2, size),
        new Phaser.Geom.Point(size, size * 2),
        new Phaser.Geom.Point(0, size),
      ],
      true,
    );
    g.generateTexture(key, size * 2, size * 2);
    g.destroy();
  }

  private makeRect(
    key: string,
    w: number,
    h: number,
    color: number,
  ): void {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
