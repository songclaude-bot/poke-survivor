import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { POKEMON_SPRITES } from "../sprites/PmdSpriteLoader";
import { sfx } from "../audio/SfxManager";

/**
 * TitleScene — Start screen with animated background and tap-to-start.
 */
export class TitleScene extends Phaser.Scene {
  private stars: { x: number; y: number; alpha: number; speed: number }[] = [];
  private starGfx!: Phaser.GameObjects.Graphics;
  private floatingPokemon: Phaser.GameObjects.Sprite[] = [];

  constructor() {
    super({ key: "TitleScene" });
  }

  create(): void {
    // Starfield background
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        alpha: Math.random() * 0.6 + 0.1,
        speed: Math.random() * 0.4 + 0.1,
      });
    }
    this.starGfx = this.add.graphics().setDepth(0);

    // Floating Pokemon sprites in background
    const pokeKeys = Object.keys(POKEMON_SPRITES);
    for (let i = 0; i < 6; i++) {
      const key = pokeKeys[i % pokeKeys.length];
      const texKey = `pmd-${key}`;
      if (!this.textures.exists(texKey)) continue;

      const x = 40 + Math.random() * (GAME_WIDTH - 80);
      const y = 200 + Math.random() * 400;
      const sprite = this.add.sprite(x, y, texKey).setDepth(1);
      sprite.setAlpha(0.15 + Math.random() * 0.15);
      sprite.setScale(1.5 + Math.random() * 1.0);
      if (this.anims.exists(`${key}-walk-down`)) {
        sprite.play(`${key}-walk-down`);
      }
      this.floatingPokemon.push(sprite);

      // Gentle floating animation
      this.tweens.add({
        targets: sprite,
        y: sprite.y + 20 + Math.random() * 20,
        duration: 2000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Title text
    this.add
      .text(GAME_WIDTH / 2, 180, "POKÉ\nSURVIVOR", {
        fontFamily: "monospace",
        fontSize: "42px",
        color: "#fbbf24",
        stroke: "#000",
        strokeThickness: 4,
        align: "center",
        lineSpacing: 8,
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Subtitle
    this.add
      .text(GAME_WIDTH / 2, 290, "Mystery Dungeon × Vampire Survivors", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#667eea",
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Tap to start (blinking)
    const startText = this.add
      .text(GAME_WIDTH / 2, 500, "[ Tap to Start ]", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fff",
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Version
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 60, "v0.5.0 — Phase 5: UI Polish", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#444",
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Copyright notice
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 40, "Non-commercial fan project\nPokemon © Nintendo/Game Freak/Creatures", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#333",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Pikachu portrait as "mascot" if available
    if (this.textures.exists("portrait-pikachu")) {
      const mascot = this.add
        .image(GAME_WIDTH / 2, 390, "portrait-pikachu")
        .setDisplaySize(80, 80)
        .setDepth(10);

      this.tweens.add({
        targets: mascot,
        y: mascot.y + 8,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Input: tap anywhere to start
    this.input.once("pointerdown", () => {
      // Initialize audio on first user gesture
      sfx.init();
      sfx.playStart();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("GameScene");
      });
    });
  }

  update(): void {
    // Animate stars
    this.starGfx.clear();
    for (const star of this.stars) {
      star.y += star.speed;
      if (star.y > GAME_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * GAME_WIDTH;
      }
      star.alpha += (Math.random() - 0.5) * 0.02;
      star.alpha = Phaser.Math.Clamp(star.alpha, 0.05, 0.7);
      this.starGfx.fillStyle(0xffffff, star.alpha);
      this.starGfx.fillRect(star.x, star.y, 1.5, 1.5);
    }
  }
}
