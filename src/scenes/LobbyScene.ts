import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { POKEMON_SPRITES, pacTexKey } from "../sprites/PmdSpriteLoader";
import { sfx, BGM_TRACKS } from "../audio/SfxManager";
import {
  ALL_STARTERS,
  loadSaveData,
  saveSaveData,
  isStarterUnlocked,
  type StarterDef,
  type SaveData,
  STARTER_SKILLS,
} from "../data/SaveData";

/**
 * LobbyScene — Hub between runs.
 *
 * Layout (top to bottom):
 *   - Coin counter
 *   - Starter card (swipe selection)
 *   - Passive skill description for selected starter
 *   - Stat bars
 *   - [ START ] button
 *   - High score / achievement info
 *
 * Easter egg: tap the "hidden" Machop sprite in bottom-right 5 times to unlock
 * the Machop line (Machop → Machoke → Machamp).
 */
export class LobbyScene extends Phaser.Scene {
  private selectedIdx = 0;
  private cardContainer!: Phaser.GameObjects.Container;
  private arrowLeft!: Phaser.GameObjects.Text;
  private arrowRight!: Phaser.GameObjects.Text;
  private counterText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private saveData!: SaveData;

  // Easter egg
  private machopSprite?: Phaser.GameObjects.Sprite;
  private machopTapCount = 0;
  private machopUnlocked = false;

  constructor() {
    super({ key: "LobbyScene" });
  }

  init(data?: { coins?: number }): void {
    // Receive coins from a completed run
    this.saveData = loadSaveData();
    if (data?.coins && data.coins > 0) {
      this.saveData.coins = (this.saveData.coins ?? 0) + data.coins;
      saveSaveData(this.saveData);
    }
  }

  create(): void {
    // -- Background --
    if (this.textures.exists("dungeon-tiny")) {
      const tex = this.textures.get("dungeon-tiny");
      const tw = tex.getSourceImage().width;
      const th = tex.getSourceImage().height;
      for (let ty = 0; ty < GAME_HEIGHT; ty += th) {
        for (let tx = 0; tx < GAME_WIDTH; tx += tw) {
          this.add.image(tx, ty, "dungeon-tiny").setOrigin(0, 0).setDepth(0).setAlpha(0.35);
        }
      }
    }

    // -- Coin display --
    const coins = this.saveData.coins ?? 0;
    this.coinText = this.add
      .text(GAME_WIDTH - 20, 30, `${coins}`, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fbbf24",
        stroke: "#000",
        strokeThickness: 2,
      })
      .setOrigin(1, 0.5)
      .setDepth(10);

    // Coin icon (circle)
    this.add
      .circle(GAME_WIDTH - this.coinText.width - 30, 30, 8, 0xfbbf24)
      .setDepth(10);

    // -- Title --
    this.add
      .text(GAME_WIDTH / 2, 65, "POKÉ SURVIVOR", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#fbbf24",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(GAME_WIDTH / 2, 90, "Mystery Dungeon × Vampire Survivors", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#667eea",
      })
      .setOrigin(0.5)
      .setDepth(10);

    // -- Starter card (swipe) --
    this.cardContainer = this.add.container(GAME_WIDTH / 2, 310).setDepth(10);
    this.buildCard();

    // -- Arrows --
    this.arrowLeft = this.add
      .text(20, 310, "◀", {
        fontFamily: "monospace", fontSize: "28px", color: "#667eea",
      })
      .setOrigin(0.5).setDepth(20).setInteractive({ useHandCursor: true });
    this.arrowLeft.on("pointerdown", () => this.navigate(-1));

    this.arrowRight = this.add
      .text(GAME_WIDTH - 20, 310, "▶", {
        fontFamily: "monospace", fontSize: "28px", color: "#667eea",
      })
      .setOrigin(0.5).setDepth(20).setInteractive({ useHandCursor: true });
    this.arrowRight.on("pointerdown", () => this.navigate(1));

    // -- Counter dots --
    this.counterText = this.add
      .text(GAME_WIDTH / 2, 455, "", {
        fontFamily: "monospace", fontSize: "12px", color: "#888",
      })
      .setOrigin(0.5).setDepth(10);
    this.updateCounter();

    // -- START button --
    const startBg = this.add
      .rectangle(GAME_WIDTH / 2, 500, 200, 44, 0x1a1a2e, 0.95)
      .setStrokeStyle(2, 0xfbbf24)
      .setDepth(9)
      .setInteractive({ useHandCursor: true });

    const startText = this.add
      .text(GAME_WIDTH / 2, 500, "START", {
        fontFamily: "monospace", fontSize: "18px", color: "#fbbf24",
        stroke: "#000", strokeThickness: 2,
      })
      .setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: [startBg, startText],
      scaleX: 1.02, scaleY: 1.02,
      duration: 600, yoyo: true, repeat: -1,
    });

    startBg.on("pointerdown", () => this.startGame());

    // -- High score / achievement info --
    const hs = this.saveData.highScore;
    if (hs && hs.kills > 0) {
      const cycleInfo = hs.cycle > 1 ? ` C${hs.cycle}` : "";
      this.add
        .text(GAME_WIDTH / 2, 545, `Best: ${hs.kills} kills / Wave ${hs.wave} / Lv.${hs.level}${cycleInfo}`, {
          fontFamily: "monospace", fontSize: "9px", color: "#fbbf24",
        })
        .setOrigin(0.5).setDepth(10);
    }

    const unlocked = this.saveData.unlockedAchievements?.length ?? 0;
    if (unlocked > 0) {
      this.add
        .text(GAME_WIDTH / 2, 558, `★ ${unlocked} Achievements`, {
          fontFamily: "monospace", fontSize: "8px", color: "#a78bfa",
        })
        .setOrigin(0.5).setDepth(10);
    }

    const unlockedStarters = ALL_STARTERS.filter(s => isStarterUnlocked(s.key, this.saveData)).length;
    this.add
      .text(GAME_WIDTH / 2, 571, `Pokédex: ${unlockedStarters}/${ALL_STARTERS.length}`, {
        fontFamily: "monospace", fontSize: "8px", color: "#4ade80",
      })
      .setOrigin(0.5).setDepth(10);

    // -- Footer --
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 40, "Non-commercial fan project\nPokémon © Nintendo/Game Freak/Creatures", {
        fontFamily: "monospace", fontSize: "7px", color: "#333", align: "center",
      })
      .setOrigin(0.5).setDepth(10);

    // -- Machop easter egg --
    this.machopUnlocked = this.saveData.unlockedStarters?.includes("machop") ?? false;
    this.setupMachopEasterEgg();

    // -- Swipe support --
    let startX = 0;
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => { startX = p.x; });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      const dx = p.x - startX;
      if (Math.abs(dx) > 40) {
        this.navigate(dx < 0 ? 1 : -1);
      }
    });

    // BGM
    sfx.init();
    sfx.startBgm(BGM_TRACKS.title);

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private navigate(dir: number): void {
    const newIdx = this.selectedIdx + dir;
    if (newIdx < 0 || newIdx >= ALL_STARTERS.length) return;
    this.selectedIdx = newIdx;

    this.tweens.add({
      targets: this.cardContainer,
      x: GAME_WIDTH / 2 - dir * 30,
      alpha: 0,
      duration: 100,
      onComplete: () => {
        this.buildCard();
        this.cardContainer.x = GAME_WIDTH / 2 + dir * 30;
        this.cardContainer.setAlpha(0);
        this.tweens.add({
          targets: this.cardContainer,
          x: GAME_WIDTH / 2,
          alpha: 1,
          duration: 130,
          ease: "Back.easeOut",
        });
      },
    });
    this.updateCounter();
  }

  private buildCard(): void {
    this.cardContainer.removeAll(true);
    const starter = ALL_STARTERS[this.selectedIdx];
    const unlocked = isStarterUnlocked(starter.key, this.saveData);

    const cardW = 260;
    const cardH = 310;
    const bg = this.add
      .rectangle(0, 0, cardW, cardH, 0x0e0e18, 0.92)
      .setStrokeStyle(2, unlocked ? Phaser.Display.Color.HexStringToColor(starter.color).color : 0x333344);
    this.cardContainer.add(bg);

    if (!unlocked) {
      this.cardContainer.add(
        this.add.text(0, -40, "🔒", { fontSize: "48px" }).setOrigin(0.5)
      );
      this.cardContainer.add(
        this.add.text(0, 10, "???", {
          fontFamily: "monospace", fontSize: "18px", color: "#555",
        }).setOrigin(0.5)
      );
      this.cardContainer.add(
        this.add.text(0, 40, starter.unlockCondition ?? "", {
          fontFamily: "monospace", fontSize: "10px", color: "#667eea",
        }).setOrigin(0.5)
      );
      return;
    }

    // Portrait or sprite preview
    const porKey = `portrait-${starter.key}`;
    const texKey = pacTexKey(starter.key);
    if (this.textures.exists(porKey)) {
      this.cardContainer.add(
        this.add.image(0, -85, porKey).setDisplaySize(64, 64)
      );
    } else if (this.textures.exists(texKey)) {
      const preview = this.add.sprite(0, -85, texKey).setScale(1.5);
      if (this.anims.exists(`${starter.key}-walk-down`)) preview.play(`${starter.key}-walk-down`);
      this.cardContainer.add(preview);
    }

    // Name
    this.cardContainer.add(
      this.add.text(0, -45, starter.name, {
        fontFamily: "monospace", fontSize: "16px",
        color: starter.color, stroke: "#000", strokeThickness: 2,
      }).setOrigin(0.5)
    );

    // Passive skill
    const skill = STARTER_SKILLS[starter.key];
    if (skill) {
      this.cardContainer.add(
        this.add.text(0, -25, skill.name, {
          fontFamily: "monospace", fontSize: "10px", color: "#fbbf24",
        }).setOrigin(0.5)
      );
      this.cardContainer.add(
        this.add.text(0, -12, skill.desc, {
          fontFamily: "monospace", fontSize: "8px", color: "#aaa",
          wordWrap: { width: cardW - 30 },
          align: "center",
        }).setOrigin(0.5, 0)
      );
    }

    // Stat bars
    const stats = [
      { label: "HP",  value: starter.hp,    max: 200, color: 0x3bc95e },
      { label: "ATK", value: starter.atk,   max: 20,  color: 0xf43f5e },
      { label: "SPD", value: starter.speed,  max: 200, color: 0x38bdf8 },
      { label: "RNG", value: starter.range,  max: 160, color: 0xfbbf24 },
    ];

    const barW = 140;
    const barH = 9;
    const barStartX = -barW / 2;
    const barStartY = 20;

    stats.forEach((stat, i) => {
      const y = barStartY + i * 22;

      this.cardContainer.add(
        this.add.text(barStartX - 8, y, stat.label, {
          fontFamily: "monospace", fontSize: "8px", color: "#888",
        }).setOrigin(1, 0.5)
      );
      this.cardContainer.add(
        this.add.rectangle(0, y, barW, barH, 0x222233, 0.8)
      );
      const ratio = Math.min(stat.value / stat.max, 1);
      const fillW = barW * ratio;
      this.cardContainer.add(
        this.add.rectangle(barStartX + fillW / 2, y, fillW, barH, stat.color, 0.9)
      );
      this.cardContainer.add(
        this.add.text(barStartX + barW + 6, y, `${stat.value}`, {
          fontFamily: "monospace", fontSize: "8px", color: "#aaa",
        }).setOrigin(0, 0.5)
      );
    });

    // Type label
    const typeDesc = this.getTypeDesc(starter);
    this.cardContainer.add(
      this.add.text(0, 112, typeDesc, {
        fontFamily: "monospace", fontSize: "9px", color: "#999", align: "center",
      }).setOrigin(0.5)
    );
  }

  private getTypeDesc(s: StarterDef): string {
    if (s.atk >= 14) return "⚔ Glass Cannon";
    if (s.hp >= 130) return "🛡 Tank";
    if (s.speed >= 170) return "💨 Speedster";
    return "⚖ Balanced";
  }

  private updateCounter(): void {
    const dots = ALL_STARTERS.map((_, i) =>
      i === this.selectedIdx ? "●" : "○"
    ).join(" ");
    this.counterText.setText(dots);
  }

  private startGame(): void {
    const starter = ALL_STARTERS[this.selectedIdx];
    if (!isStarterUnlocked(starter.key, this.saveData)) return;
    sfx.stopBgm();
    sfx.playStart();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("GameScene", { starterKey: starter.key });
    });
  }

  // ── Machop Easter Egg ──

  private setupMachopEasterEgg(): void {
    const atlasKey = pacTexKey("machop");
    if (!this.textures.exists(atlasKey)) return;

    // Small machop in bottom-right, semi-transparent
    this.machopSprite = this.add
      .sprite(GAME_WIDTH - 35, GAME_HEIGHT - 75, atlasKey)
      .setScale(this.machopUnlocked ? 1.5 : 1.0)
      .setAlpha(this.machopUnlocked ? 0.9 : 0.15)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });

    if (this.anims.exists("machop-walk-down")) {
      this.machopSprite.play("machop-walk-down");
    }

    // Subtle float
    this.tweens.add({
      targets: this.machopSprite,
      y: this.machopSprite.y - 5,
      duration: 1500, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });

    if (this.machopUnlocked) {
      // Already unlocked — show label
      this.add.text(GAME_WIDTH - 35, GAME_HEIGHT - 95, "💪", {
        fontSize: "16px",
      }).setOrigin(0.5).setDepth(6);
      return;
    }

    this.machopSprite.on("pointerdown", () => {
      this.machopTapCount++;
      // Visual feedback
      this.tweens.add({
        targets: this.machopSprite,
        scaleX: 1.3, scaleY: 1.3,
        duration: 100, yoyo: true,
      });
      this.machopSprite!.setAlpha(0.15 + this.machopTapCount * 0.15);

      if (this.machopTapCount >= 5) {
        this.unlockMachop();
      }
    });
  }

  private unlockMachop(): void {
    if (this.machopUnlocked) return;
    this.machopUnlocked = true;

    // Add to save data
    if (!this.saveData.unlockedStarters.includes("machop")) {
      this.saveData.unlockedStarters.push("machop");
      saveSaveData(this.saveData);
    }

    // Flash effect
    this.cameras.main.flash(400, 255, 200, 0);

    // Machop grows
    this.tweens.add({
      targets: this.machopSprite,
      scaleX: 2.0, scaleY: 2.0,
      alpha: 1,
      duration: 500,
      ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: this.machopSprite,
          scaleX: 1.5, scaleY: 1.5,
          duration: 300,
        });
      },
    });

    // Unlock text
    const txt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "💪 MACHOP UNLOCKED! 💪\nFighting Spirit Starter", {
        fontFamily: "monospace", fontSize: "16px", color: "#ff6b35",
        stroke: "#000", strokeThickness: 3, align: "center",
      })
      .setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: txt,
      y: txt.y - 40, alpha: 0,
      delay: 2000, duration: 800,
      onComplete: () => txt.destroy(),
    });

    // Muscle emoji
    this.add.text(GAME_WIDTH - 35, GAME_HEIGHT - 95, "💪", {
      fontSize: "16px",
    }).setOrigin(0.5).setDepth(6);

    // Rebuild card if viewing locked starters
    this.buildCard();
    this.updateCounter();
  }
}
