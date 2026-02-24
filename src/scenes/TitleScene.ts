import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { POKEMON_SPRITES, pacTexKey } from "../sprites/PmdSpriteLoader";
import { sfx, BGM_TRACKS } from "../audio/SfxManager";

/**
 * TitleScene — Splash screen with logo, then tap to enter Lobby.
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
  }

  create(): void {
    // -- Background --
    if (this.textures.exists("dungeon-tiny")) {
      const tex = this.textures.get("dungeon-tiny");
      const tw = tex.getSourceImage().width;
      const th = tex.getSourceImage().height;
      for (let ty = 0; ty < GAME_HEIGHT; ty += th) {
        for (let tx = 0; tx < GAME_WIDTH; tx += tw) {
          this.add.image(tx, ty, "dungeon-tiny").setOrigin(0, 0).setDepth(0).setAlpha(0.4);
        }
      }
    }

    // Floating Pokemon in background
    const pokeKeys = Object.keys(POKEMON_SPRITES);
    for (let i = 0; i < 6; i++) {
      const key = pokeKeys[(i * 17) % pokeKeys.length]; // spread across pokemon
      const atlasKey = pacTexKey(key);
      if (!this.textures.exists(atlasKey)) continue;

      const x = 30 + Math.random() * (GAME_WIDTH - 60);
      const y = 400 + Math.random() * 300;
      const sprite = this.add.sprite(x, y, atlasKey).setDepth(1).setAlpha(0.15).setScale(1.2);
      if (this.anims.exists(`${key}-walk-down`)) sprite.play(`${key}-walk-down`);

      this.tweens.add({
        targets: sprite,
        y: sprite.y + 20,
        duration: 3000 + Math.random() * 2000,
        yoyo: true, repeat: -1, ease: "Sine.easeInOut",
      });
    }

    // -- Title --
    const title = this.add
      .text(GAME_WIDTH / 2, 220, "POKÉ\nSURVIVOR", {
        fontFamily: "monospace",
        fontSize: "48px",
        color: "#fbbf24",
        stroke: "#000",
        strokeThickness: 5,
        align: "center",
        lineSpacing: 8,
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Title entrance animation
    title.setScale(0.5).setAlpha(0);
    this.tweens.add({
      targets: title,
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: 800, ease: "Back.easeOut",
    });

    this.add
      .text(GAME_WIDTH / 2, 340, "Mystery Dungeon × Vampire Survivors", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#667eea",
      })
      .setOrigin(0.5)
      .setDepth(10);

    // -- Tap to start --
    const tapText = this.add
      .text(GAME_WIDTH / 2, 500, "TAP TO START", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fff",
        stroke: "#000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0);

    // Delay before showing tap prompt
    this.time.delayedCall(1000, () => {
      this.tweens.add({
        targets: tapText,
        alpha: 1, duration: 400,
      });
      this.tweens.add({
        targets: tapText,
        alpha: 0.3,
        duration: 800, yoyo: true, repeat: -1, delay: 400,
      });
    });

    // -- Footer --
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 30, "Non-commercial fan project\nPokémon © Nintendo/Game Freak/Creatures", {
        fontFamily: "monospace", fontSize: "7px", color: "#333", align: "center",
      })
      .setOrigin(0.5).setDepth(10);

    // -- Input: tap anywhere → Lobby --
    this.time.delayedCall(800, () => {
      this.input.once("pointerdown", () => {
        sfx.init();
        sfx.playStart();
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("LobbyScene");
        });
      });
    });

    this.cameras.main.fadeIn(600, 0, 0, 0);
  }
}
