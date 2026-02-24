import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { POKEMON_SPRITES } from "../sprites/PmdSpriteLoader";
import { sfx, BGM_TRACKS } from "../audio/SfxManager";
import { ALL_STARTERS, loadSaveData, isStarterUnlocked, type StarterDef } from "../data/SaveData";

/**
 * TitleScene — Start screen with swipe-style starter selection.
 */

export class TitleScene extends Phaser.Scene {
  private floatingPokemon: Phaser.GameObjects.Sprite[] = [];
  private selectedIdx = 0;
  private cardContainer!: Phaser.GameObjects.Container;
  private arrowLeft!: Phaser.GameObjects.Text;
  private arrowRight!: Phaser.GameObjects.Text;
  private counterText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "TitleScene" });
  }

  create(): void {
    // Dungeon floor tile background
    if (this.textures.exists("dungeon-tiny")) {
      const tex = this.textures.get("dungeon-tiny");
      const tw = tex.getSourceImage().width;
      const th = tex.getSourceImage().height;
      for (let ty = 0; ty < GAME_HEIGHT; ty += th) {
        for (let tx = 0; tx < GAME_WIDTH; tx += tw) {
          this.add.image(tx, ty, "dungeon-tiny").setOrigin(0, 0).setDepth(0).setAlpha(0.5);
        }
      }
    }

    // Floating Pokemon sprites in background
    const pokeKeys = Object.keys(POKEMON_SPRITES);
    for (let i = 0; i < 5; i++) {
      const key = pokeKeys[i % pokeKeys.length];
      const texKey = `pmd-${key}`;
      if (!this.textures.exists(texKey)) continue;

      const x = 30 + Math.random() * (GAME_WIDTH - 60);
      const y = 620 + Math.random() * 160;
      const sprite = this.add.sprite(x, y, texKey).setDepth(1);
      sprite.setAlpha(0.2 + Math.random() * 0.1);
      sprite.setScale(1.0 + Math.random() * 0.5);
      if (this.anims.exists(`${key}-walk-down`)) {
        sprite.play(`${key}-walk-down`);
      }
      this.floatingPokemon.push(sprite);

      this.tweens.add({
        targets: sprite,
        y: sprite.y + 15 + Math.random() * 15,
        duration: 2500 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // ── Title ──
    this.add
      .text(GAME_WIDTH / 2, 100, "POKÉ\nSURVIVOR", {
        fontFamily: "monospace",
        fontSize: "40px",
        color: "#fbbf24",
        stroke: "#000",
        strokeThickness: 4,
        align: "center",
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(GAME_WIDTH / 2, 195, "Mystery Dungeon × Vampire Survivors", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#667eea",
      })
      .setOrigin(0.5)
      .setDepth(10);

    // ── Starter card (center, single card) ──
    this.cardContainer = this.add.container(GAME_WIDTH / 2, 400).setDepth(10);
    this.buildCard();

    // ── Arrow buttons ──
    this.arrowLeft = this.add
      .text(30, 400, "◀", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#667eea",
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });
    this.arrowLeft.on("pointerdown", () => this.navigate(-1));

    this.arrowRight = this.add
      .text(GAME_WIDTH - 30, 400, "▶", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#667eea",
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });
    this.arrowRight.on("pointerdown", () => this.navigate(1));

    // Counter dots
    this.counterText = this.add
      .text(GAME_WIDTH / 2, 520, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#888",
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.updateCounter();

    // ── Start button ──
    const startText = this.add
      .text(GAME_WIDTH / 2, 570, "[ TAP TO START ]", {
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

    const startHit = this.add
      .rectangle(GAME_WIDTH / 2, 570, GAME_WIDTH - 40, 55, 0x000000, 0)
      .setDepth(9)
      .setInteractive({ useHandCursor: true });

    startHit.on("pointerdown", () => {
      const starter = ALL_STARTERS[this.selectedIdx];
      const data = loadSaveData();
      if (!isStarterUnlocked(starter.key, data)) return; // locked
      sfx.stopBgm();
      sfx.playStart();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("GameScene", { starterKey: starter.key });
      });
    });

    // ── High score / achievements ──
    try {
      const data = loadSaveData();
      const hs = data.highScore;
      if (hs && hs.kills > 0) {
        const cycleInfo = hs.cycle > 1 ? ` / Cycle ${hs.cycle}` : "";
        this.add
          .text(GAME_WIDTH / 2, GAME_HEIGHT - 120, `Best: Kill ${hs.kills} / Wave ${hs.wave} / Lv.${hs.level}${cycleInfo}`, {
            fontFamily: "monospace",
            fontSize: "10px",
            color: "#fbbf24",
          })
          .setOrigin(0.5)
          .setDepth(10);
      }
      const unlocked = data.unlockedAchievements?.length ?? 0;
      if (unlocked > 0) {
        this.add
          .text(GAME_WIDTH / 2, GAME_HEIGHT - 105, `★ ${unlocked}/13 Achievements`, {
            fontFamily: "monospace",
            fontSize: "9px",
            color: "#a78bfa",
          })
          .setOrigin(0.5)
          .setDepth(10);
      }
      // Show unlocked starters count
      const unlockedStarters = ALL_STARTERS.filter(s => isStarterUnlocked(s.key, data)).length;
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT - 90, `Pokédex: ${unlockedStarters}/${ALL_STARTERS.length}`, {
          fontFamily: "monospace",
          fontSize: "9px",
          color: "#4ade80",
        })
        .setOrigin(0.5)
        .setDepth(10);
    } catch { /* ignore */ }

    // ── Footer ──
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 55, "v3.0.0", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#444",
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 40, "Non-commercial fan project\nPokémon © Nintendo/Game Freak/Creatures", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#333",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(10);

    // BGM
    sfx.init();
    sfx.startBgm(BGM_TRACKS.title);

    // Fade in
    this.cameras.main.fadeIn(600, 0, 0, 0);

    // Swipe support
    let startX = 0;
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => { startX = p.x; });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      const dx = p.x - startX;
      if (Math.abs(dx) > 40) {
        this.navigate(dx < 0 ? 1 : -1);
      }
    });
  }

  private navigate(dir: number): void {
    const newIdx = this.selectedIdx + dir;
    if (newIdx < 0 || newIdx >= ALL_STARTERS.length) return;
    this.selectedIdx = newIdx;

    // Slide animation
    this.tweens.add({
      targets: this.cardContainer,
      x: GAME_WIDTH / 2 - dir * 30,
      alpha: 0,
      duration: 120,
      onComplete: () => {
        this.buildCard();
        this.cardContainer.x = GAME_WIDTH / 2 + dir * 30;
        this.cardContainer.setAlpha(0);
        this.tweens.add({
          targets: this.cardContainer,
          x: GAME_WIDTH / 2,
          alpha: 1,
          duration: 150,
          ease: "Back.easeOut",
        });
      },
    });

    this.updateCounter();
  }

  private buildCard(): void {
    this.cardContainer.removeAll(true);
    const starter = ALL_STARTERS[this.selectedIdx];
    const data = loadSaveData();
    const unlocked = isStarterUnlocked(starter.key, data);

    // Card bg
    const cardW = 240;
    const cardH = 260;
    const bg = this.add
      .rectangle(0, 0, cardW, cardH, 0x0e0e18, 0.92)
      .setStrokeStyle(2, unlocked ? Phaser.Display.Color.HexStringToColor(starter.color).color : 0x333344);
    this.cardContainer.add(bg);

    if (!unlocked) {
      // Locked overlay
      const lock = this.add
        .text(0, -30, "🔒", { fontSize: "48px" })
        .setOrigin(0.5);
      this.cardContainer.add(lock);

      const lockName = this.add
        .text(0, 20, "???", {
          fontFamily: "monospace",
          fontSize: "18px",
          color: "#555",
        })
        .setOrigin(0.5);
      this.cardContainer.add(lockName);

      const condText = this.add
        .text(0, 50, starter.unlockCondition ?? "", {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#667eea",
        })
        .setOrigin(0.5);
      this.cardContainer.add(condText);
      return;
    }

    // Portrait (large)
    const porKey = `portrait-${starter.key}`;
    if (this.textures.exists(porKey)) {
      const portrait = this.add.image(0, -65, porKey).setDisplaySize(72, 72);
      this.cardContainer.add(portrait);
    }

    // Sprite preview
    const texKey = `pmd-${starter.key}`;
    if (this.textures.exists(texKey)) {
      const preview = this.add.sprite(0, -65, texKey).setScale(1.5);
      if (this.anims.exists(`${starter.key}-walk-down`)) {
        preview.play(`${starter.key}-walk-down`);
      }
      // Use sprite if no portrait
      if (!this.textures.exists(porKey)) {
        this.cardContainer.add(preview);
      }
    }

    // Name
    const nameText = this.add
      .text(0, -18, starter.name, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: starter.color,
        stroke: "#000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);
    this.cardContainer.add(nameText);

    // Stat bars
    const stats = [
      { label: "HP",  value: starter.hp,    max: 200, color: 0x3bc95e },
      { label: "ATK", value: starter.atk,   max: 20,  color: 0xf43f5e },
      { label: "SPD", value: starter.speed,  max: 200, color: 0x38bdf8 },
      { label: "RNG", value: starter.range,  max: 160, color: 0xfbbf24 },
    ];

    const barW = 140;
    const barH = 10;
    const barStartX = -barW / 2;
    const barStartY = 10;

    stats.forEach((stat, i) => {
      const y = barStartY + i * 24;

      // Label
      const label = this.add
        .text(barStartX - 8, y, stat.label, {
          fontFamily: "monospace",
          fontSize: "9px",
          color: "#888",
        })
        .setOrigin(1, 0.5);
      this.cardContainer.add(label);

      // Bar bg
      const barBg = this.add.rectangle(0, y, barW, barH, 0x222233, 0.8);
      this.cardContainer.add(barBg);

      // Bar fill
      const ratio = Math.min(stat.value / stat.max, 1);
      const fillW = barW * ratio;
      const fill = this.add
        .rectangle(barStartX + fillW / 2, y, fillW, barH, stat.color, 0.9);
      this.cardContainer.add(fill);

      // Value text
      const valText = this.add
        .text(barStartX + barW + 6, y, `${stat.value}`, {
          fontFamily: "monospace",
          fontSize: "9px",
          color: "#aaa",
        })
        .setOrigin(0, 0.5);
      this.cardContainer.add(valText);
    });

    // Type description
    const typeDesc = this.getTypeDesc(starter);
    const typeText = this.add
      .text(0, 112, typeDesc, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#aaa",
        align: "center",
      })
      .setOrigin(0.5);
    this.cardContainer.add(typeText);
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

  update(): void {
    // Static background — no update needed
  }
}
