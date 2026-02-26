import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { POKEMON_SPRITES, pacTexKey } from "../sprites/PmdSpriteLoader";
import { sfx, BGM_TRACKS } from "../audio/SfxManager";
import {
  ALL_STARTERS,
  loadSaveData,
  saveSaveData,
  isStarterUnlocked,
  STARTER_SKILLS,
  STARTER_COIN_COST,
  UPGRADES,
  getUpgradeCost,
  type SaveData,
  type StarterDef,
} from "../data/SaveData";
import { ACHIEVEMENTS, EVOLUTION_CHAINS, ENEMY_POOL, BOSS_POOL } from "../data/GameData";
import {
  createButton,
  createPanel,
  createTabBar,
  createCoinBadge,
} from "../ui/UIComponents";

// ════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════

const TABS = [
  { label: "Play",    icon: "▶" },
  { label: "Shop",    icon: "🛒" },
  { label: "Pokédex", icon: "📖" },
  { label: "Records", icon: "🏆" },
];

const TAB_BAR_H = 44;
const HEADER_H = 52;
const CONTENT_Y = HEADER_H;
const CONTENT_H = GAME_HEIGHT - HEADER_H - TAB_BAR_H;

// ════════════════════════════════════════════
// SCENE
// ════════════════════════════════════════════

export class LobbyScene extends Phaser.Scene {
  private saveData!: SaveData;
  private activeTab = 0;
  private tabBar!: Phaser.GameObjects.Container;
  private contentContainer!: Phaser.GameObjects.Container;
  private coinBadge!: Phaser.GameObjects.Container;

  // Play tab state
  private selectedStarter: string | null = null;

  // Machop easter egg
  private machopTapCount = 0;

  constructor() {
    super({ key: "LobbyScene" });
  }

  init(data?: { coins?: number }): void {
    this.saveData = loadSaveData();
    if (data?.coins && data.coins > 0) {
      this.saveData.coins = (this.saveData.coins ?? 0) + data.coins;
      saveSaveData(this.saveData);
    }
    // Select first unlocked starter
    const firstUnlocked = ALL_STARTERS.find(s => isStarterUnlocked(s.key, this.saveData));
    this.selectedStarter = firstUnlocked?.key ?? "pikachu";
    this.activeTab = 0;
    this.machopTapCount = 0;
  }

  create(): void {
    // Background
    this.drawBackground();

    // Header (coin badge + title)
    this.drawHeader();

    // Content area
    this.contentContainer = this.add.container(0, 0).setDepth(10);

    // Tab bar (bottom)
    this.tabBar = createTabBar({
      scene: this,
      y: GAME_HEIGHT - TAB_BAR_H,
      tabs: TABS,
      activeIdx: this.activeTab,
      onSelect: (idx) => this.switchTab(idx),
    });

    // Build initial tab
    this.buildTab(this.activeTab);

    // BGM
    sfx.init();
    sfx.startBgm(BGM_TRACKS.title);
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  // ════════════════════════════════════════
  // HEADER
  // ════════════════════════════════════════

  private drawBackground(): void {
    if (this.textures.exists("dungeon-tiny")) {
      const tex = this.textures.get("dungeon-tiny");
      const tw = tex.getSourceImage().width;
      const th = tex.getSourceImage().height;
      for (let ty = 0; ty < GAME_HEIGHT; ty += th) {
        for (let tx = 0; tx < GAME_WIDTH; tx += tw) {
          this.add.image(tx, ty, "dungeon-tiny").setOrigin(0, 0).setDepth(0).setAlpha(0.3);
        }
      }
    }
    // Darken header area
    this.add.rectangle(GAME_WIDTH / 2, HEADER_H / 2, GAME_WIDTH, HEADER_H, 0x0a0a14, 0.9).setDepth(1);
  }

  private drawHeader(): void {
    // Title
    this.add.text(14, HEADER_H / 2, "POKÉ SURVIVOR", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#fbbf24",
      stroke: "#000",
      strokeThickness: 2,
    }).setOrigin(0, 0.5).setDepth(30);

    // Coin badge
    this.coinBadge = createCoinBadge(this, GAME_WIDTH - 70, HEADER_H / 2, this.saveData.coins ?? 0);
  }

  private refreshCoinBadge(): void {
    this.coinBadge.destroy();
    this.coinBadge = createCoinBadge(this, GAME_WIDTH - 70, HEADER_H / 2, this.saveData.coins ?? 0);
  }

  // ════════════════════════════════════════
  // TAB SWITCHING
  // ════════════════════════════════════════

  private switchTab(idx: number): void {
    this.activeTab = idx;
    // Destroy old tab bar and all its children
    this.tabBar.removeAll(true);
    this.tabBar.destroy();
    this.tabBar = createTabBar({
      scene: this,
      y: GAME_HEIGHT - TAB_BAR_H,
      tabs: TABS,
      activeIdx: idx,
      onSelect: (i) => this.switchTab(i),
    });
    // Rebuild content
    this.buildTab(idx);
  }

  private buildTab(idx: number): void {
    // Destroy all children properly — this removes panels, buttons, sprites etc.
    this.contentContainer.removeAll(true);
    switch (idx) {
      case 0: this.buildPlayTab(); break;
      case 1: this.buildShopTab(); break;
      case 2: this.buildPokedexTab(); break;
      case 3: this.buildRecordsTab(); break;
    }
  }

  /** Create a panel AND add it to contentContainer so it gets cleaned up on tab switch */
  private addPanel(x: number, y: number, w: number, h: number, borderColor?: number, fillColor?: number): void {
    const panel = createPanel({
      scene: this, x, y, width: w, height: h,
      borderColor: borderColor ?? 0x333355,
      fillColor: fillColor ?? 0x0e0e1a,
    });
    this.contentContainer.add(panel);
  }

  // ════════════════════════════════════════
  // TAB 0: PLAY (Grid Select + Start)
  // ════════════════════════════════════════

  private buildPlayTab(): void {
    const startY = CONTENT_Y + 8;

    // Section label
    this.contentContainer.add(
      this.add.text(GAME_WIDTH / 2, startY, "Choose Your Starter", {
        fontFamily: "monospace", fontSize: "11px", color: "#888",
      }).setOrigin(0.5)
    );

    // Grid of starters
    const cols = 5;
    const cellSize = 62;
    const gridW = cols * cellSize;
    const gridX = (GAME_WIDTH - gridW) / 2;
    const gridY = startY + 20;

    ALL_STARTERS.forEach((starter, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = gridX + col * cellSize + cellSize / 2;
      const cy = gridY + row * cellSize + cellSize / 2;
      const unlocked = isStarterUnlocked(starter.key, this.saveData);
      const isSelected = starter.key === this.selectedStarter;

      // Cell background
      const cellBg = this.add.graphics();
      if (isSelected) {
        cellBg.fillStyle(0x667eea, 0.3);
        cellBg.fillRoundedRect(cx - cellSize / 2 + 2, cy - cellSize / 2 + 2, cellSize - 4, cellSize - 4, 6);
        cellBg.lineStyle(2, 0xfbbf24, 0.9);
        cellBg.strokeRoundedRect(cx - cellSize / 2 + 2, cy - cellSize / 2 + 2, cellSize - 4, cellSize - 4, 6);
      } else {
        cellBg.fillStyle(0x111122, 0.6);
        cellBg.fillRoundedRect(cx - cellSize / 2 + 2, cy - cellSize / 2 + 2, cellSize - 4, cellSize - 4, 6);
        if (unlocked) {
          cellBg.lineStyle(1, 0x333355, 0.5);
          cellBg.strokeRoundedRect(cx - cellSize / 2 + 2, cy - cellSize / 2 + 2, cellSize - 4, cellSize - 4, 6);
        }
      }
      this.contentContainer.add(cellBg);

      if (unlocked) {
        // Show sprite or portrait
        const porKey = `portrait-${starter.key}`;
        const texKey = pacTexKey(starter.key);
        if (this.textures.exists(porKey)) {
          const img = this.add.image(cx, cy - 6, porKey).setDisplaySize(36, 36);
          this.contentContainer.add(img);
        } else if (this.textures.exists(texKey)) {
          const spr = this.add.sprite(cx, cy - 6, texKey).setScale(1.0);
          if (this.anims.exists(`${starter.key}-walk-down`)) spr.play(`${starter.key}-walk-down`);
          this.contentContainer.add(spr);
        }

        // Name below
        this.contentContainer.add(
          this.add.text(cx, cy + 22, starter.name.slice(0, 6), {
            fontFamily: "monospace", fontSize: "7px",
            color: isSelected ? "#fbbf24" : "#aaa",
          }).setOrigin(0.5)
        );
      } else {
        // Lock icon
        this.contentContainer.add(
          this.add.text(cx, cy - 4, "🔒", { fontSize: "20px" }).setOrigin(0.5).setAlpha(0.5)
        );
        // Coin price
        const cost = STARTER_COIN_COST[starter.key];
        if (cost) {
          this.contentContainer.add(
            this.add.text(cx, cy + 20, `${cost}🪙`, {
              fontFamily: "monospace", fontSize: "7px", color: "#fbbf24",
            }).setOrigin(0.5).setAlpha(0.7)
          );
        }
      }

      // Interactive zone
      const zone = this.add.zone(cx, cy, cellSize - 4, cellSize - 4).setInteractive({ useHandCursor: true });
      zone.on("pointerdown", () => this.onStarterTap(starter));
      this.contentContainer.add(zone);
    });

    // Selected starter detail card
    const cardY = gridY + Math.ceil(ALL_STARTERS.length / cols) * cellSize + 10;
    this.buildStarterDetail(cardY);

    // Machop easter egg — small sprite in bottom area
    this.buildMachopEasterEgg(cardY);
  }

  private buildStarterDetail(y: number): void {
    const starter = ALL_STARTERS.find(s => s.key === this.selectedStarter);
    if (!starter) return;
    const unlocked = isStarterUnlocked(starter.key, this.saveData);

    // Card panel
    const cardW = GAME_WIDTH - 30;
    const cardH = 230;
    const cardX = 15;

    this.addPanel(cardX, y, cardW, cardH,
      unlocked ? Phaser.Display.Color.HexStringToColor(starter.color).color : 0x333344,
    );

    if (!unlocked) {
      // Locked view
      this.contentContainer.add(
        this.add.text(GAME_WIDTH / 2, y + 40, "🔒", { fontSize: "36px" }).setOrigin(0.5)
      );
      this.contentContainer.add(
        this.add.text(GAME_WIDTH / 2, y + 75, starter.unlockCondition ?? "???", {
          fontFamily: "monospace", fontSize: "10px", color: "#667eea",
        }).setOrigin(0.5)
      );

      // Coin unlock button
      const cost = STARTER_COIN_COST[starter.key];
      if (cost) {
        const canAfford = (this.saveData.coins ?? 0) >= cost;
        this.contentContainer.add(createButton({
          scene: this,
          x: GAME_WIDTH / 2,
          y: y + 120,
          width: 180,
          height: 36,
          label: `Unlock — ${cost} coins`,
          fontSize: "12px",
          color: canAfford ? 0x1a2e1a : 0x1a1a1a,
          textColor: canAfford ? "#4ade80" : "#555",
          borderColor: canAfford ? 0x4ade80 : 0x333333,
          onClick: () => {
            if (!canAfford) return;
            this.saveData.coins -= cost;
            if (!this.saveData.unlockedStarters.includes(starter.key)) {
              this.saveData.unlockedStarters.push(starter.key);
            }
            saveSaveData(this.saveData);
            this.selectedStarter = starter.key;
            this.refreshCoinBadge();
            this.buildTab(0);
            // Flash effect
            this.cameras.main.flash(300, 100, 255, 100);
          },
        }));
      }

      // Footer
      this.contentContainer.add(createButton({
        scene: this,
        x: GAME_WIDTH / 2,
        y: y + cardH + 20,
        width: 200, height: 44,
        label: "START",
        color: 0x1a1a2e,
        textColor: "#555",
        borderColor: 0x333333,
        onClick: () => {},
      }));
      return;
    }

    // Unlocked view — portrait + name + skill + stats
    const leftX = cardX + 55;
    const rightX = cardX + 120;

    // Portrait
    const porKey = `portrait-${starter.key}`;
    const texKey = pacTexKey(starter.key);
    if (this.textures.exists(porKey)) {
      this.contentContainer.add(
        this.add.image(leftX, y + 55, porKey).setDisplaySize(56, 56)
      );
    } else if (this.textures.exists(texKey)) {
      const spr = this.add.sprite(leftX, y + 55, texKey).setScale(1.5);
      if (this.anims.exists(`${starter.key}-walk-down`)) spr.play(`${starter.key}-walk-down`);
      this.contentContainer.add(spr);
    }

    // Name
    this.contentContainer.add(
      this.add.text(rightX, y + 30, starter.name, {
        fontFamily: "monospace", fontSize: "16px",
        color: starter.color, stroke: "#000", strokeThickness: 2,
      }).setOrigin(0, 0.5)
    );

    // Type label
    this.contentContainer.add(
      this.add.text(rightX, y + 48, this.getTypeDesc(starter), {
        fontFamily: "monospace", fontSize: "9px", color: "#888",
      }).setOrigin(0, 0.5)
    );

    // Passive skill
    const skill = STARTER_SKILLS[starter.key];
    if (skill) {
      this.contentContainer.add(
        this.add.text(rightX, y + 66, skill.name, {
          fontFamily: "monospace", fontSize: "10px", color: "#fbbf24",
        }).setOrigin(0, 0.5)
      );
      this.contentContainer.add(
        this.add.text(rightX, y + 80, skill.desc, {
          fontFamily: "monospace", fontSize: "8px", color: "#aaa",
          wordWrap: { width: cardW - 125 },
        }).setOrigin(0, 0)
      );
    }

    // Evolution chain preview
    const evoChain = EVOLUTION_CHAINS[starter.key];
    if (evoChain) {
      const evoY = y + 110;
      this.contentContainer.add(
        this.add.text(cardX + 15, evoY, "Evolution:", {
          fontFamily: "monospace", fontSize: "8px", color: "#667eea",
        })
      );

      evoChain.forEach((stage, i) => {
        const ex = cardX + 20 + i * 85;
        const ey = evoY + 18;
        const eTex = pacTexKey(stage.spriteKey);
        if (this.textures.exists(eTex)) {
          const spr = this.add.sprite(ex + 12, ey + 10, eTex).setScale(0.9);
          if (this.anims.exists(`${stage.spriteKey}-walk-down`)) spr.play(`${stage.spriteKey}-walk-down`);
          this.contentContainer.add(spr);
        }
        this.contentContainer.add(
          this.add.text(ex + 12, ey + 28, stage.name.replace(/ ★+/, ""), {
            fontFamily: "monospace", fontSize: "7px", color: "#999",
          }).setOrigin(0.5)
        );
        if (i < evoChain.length - 1) {
          this.contentContainer.add(
            this.add.text(ex + 55, ey + 10, "→", {
              fontFamily: "monospace", fontSize: "12px", color: "#555",
            }).setOrigin(0.5)
          );
        }
      });
    }

    // Stat bars — 2x2 grid layout below evolution chain
    const stats = [
      { label: "HP",  value: starter.hp,   max: 200, color: 0x3bc95e },
      { label: "ATK", value: starter.atk,  max: 20,  color: 0xf43f5e },
      { label: "SPD", value: starter.speed, max: 200, color: 0x38bdf8 },
      { label: "RNG", value: starter.range, max: 160, color: 0xfbbf24 },
    ];

    const barW = 110;
    const barH = 6;
    const statColW = (cardW - 30) / 2;
    const statStartY = y + 168;

    stats.forEach((stat, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const sx = cardX + 15 + col * statColW;
      const sy = statStartY + row * 22;
      this.contentContainer.add(
        this.add.text(sx, sy - 8, `${stat.label}  ${stat.value}`, {
          fontFamily: "monospace", fontSize: "8px", color: "#999",
        })
      );
      const barBg = this.add.graphics();
      barBg.fillStyle(0x222233, 0.8);
      barBg.fillRoundedRect(sx, sy + 2, barW, barH, 2);
      this.contentContainer.add(barBg);

      const ratio = Math.min(stat.value / stat.max, 1);
      const fillW = Math.max(2, barW * ratio);
      const barFill = this.add.graphics();
      barFill.fillStyle(stat.color, 0.85);
      barFill.fillRoundedRect(sx, sy + 2, fillW, barH, 2);
      this.contentContainer.add(barFill);
    });

    // START button
    this.contentContainer.add(createButton({
      scene: this,
      x: GAME_WIDTH / 2,
      y: y + cardH + 20,
      width: 200, height: 44,
      label: "START",
      color: 0x1a2e1a,
      textColor: "#fbbf24",
      borderColor: 0xfbbf24,
      onClick: () => this.startGame(),
    }));

    // High score
    const hs = this.saveData.highScore;
    if (hs && hs.kills > 0) {
      const cycleInfo = hs.cycle > 1 ? ` C${hs.cycle}` : "";
      this.contentContainer.add(
        this.add.text(GAME_WIDTH / 2, y + cardH + 52, `Best: ${hs.kills} kills / Wave ${hs.wave} / Lv.${hs.level}${cycleInfo}`, {
          fontFamily: "monospace", fontSize: "8px", color: "#fbbf24",
        }).setOrigin(0.5)
      );
    }

    // Footer
    this.contentContainer.add(
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - TAB_BAR_H - 18, "Non-commercial fan project — Pokémon © Nintendo/Game Freak/Creatures", {
        fontFamily: "monospace", fontSize: "6px", color: "#333",
      }).setOrigin(0.5)
    );
  }

  private onStarterTap(starter: StarterDef): void {
    const unlocked = isStarterUnlocked(starter.key, this.saveData);
    if (unlocked) {
      this.selectedStarter = starter.key;
    } else {
      // Select to show unlock option
      this.selectedStarter = starter.key;
    }
    this.buildTab(0);
  }

  private getTypeDesc(s: StarterDef): string {
    if (s.atk >= 14) return "⚔ Glass Cannon";
    if (s.hp >= 130) return "🛡 Tank";
    if (s.speed >= 170) return "💨 Speedster";
    return "⚖ Balanced";
  }

  private startGame(): void {
    if (!this.selectedStarter) return;
    const starter = ALL_STARTERS.find(s => s.key === this.selectedStarter);
    if (!starter || !isStarterUnlocked(starter.key, this.saveData)) return;
    this.saveData.totalRuns = (this.saveData.totalRuns ?? 0) + 1;
    saveSaveData(this.saveData);
    sfx.stopBgm();
    sfx.playStart();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("GameScene", { starterKey: starter.key });
    });
  }

  // ════════════════════════════════════════
  // MACHOP EASTER EGG
  // ════════════════════════════════════════

  private buildMachopEasterEgg(cardTopY: number): void {
    const atlasKey = pacTexKey("machop");
    if (!this.textures.exists(atlasKey)) return;
    const isUnlocked = this.saveData.unlockedStarters?.includes("machop") ?? false;
    if (isUnlocked) return; // Already shown in grid

    // Small machop in corner
    const mx = GAME_WIDTH - 30;
    const my = GAME_HEIGHT - TAB_BAR_H - 35;
    const sprite = this.add.sprite(mx, my, atlasKey)
      .setScale(0.8).setAlpha(0.12).setDepth(15).setInteractive({ useHandCursor: true });
    if (this.anims.exists("machop-walk-down")) sprite.play("machop-walk-down");
    this.contentContainer.add(sprite);

    this.tweens.add({
      targets: sprite,
      y: my - 4,
      duration: 1500, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });

    sprite.on("pointerdown", () => {
      this.machopTapCount++;
      this.tweens.add({
        targets: sprite,
        scaleX: 1.2, scaleY: 1.2,
        duration: 100, yoyo: true,
      });
      sprite.setAlpha(0.12 + this.machopTapCount * 0.15);

      if (this.machopTapCount >= 5) {
        this.unlockMachop(sprite);
      }
    });
  }

  private unlockMachop(sprite: Phaser.GameObjects.Sprite): void {
    if (this.saveData.unlockedStarters.includes("machop")) return;
    this.saveData.unlockedStarters.push("machop");
    saveSaveData(this.saveData);

    this.cameras.main.flash(400, 255, 200, 0);

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
      onComplete: () => {
        txt.destroy();
        this.selectedStarter = "machop";
        this.buildTab(0);
        this.refreshCoinBadge();
      },
    });
  }

  // ════════════════════════════════════════
  // TAB 1: SHOP (Permanent Upgrades)
  // ════════════════════════════════════════

  private buildShopTab(): void {
    const startY = CONTENT_Y + 10;

    this.contentContainer.add(
      this.add.text(GAME_WIDTH / 2, startY, "Permanent Upgrades", {
        fontFamily: "monospace", fontSize: "12px", color: "#fbbf24",
      }).setOrigin(0.5)
    );

    this.contentContainer.add(
      this.add.text(GAME_WIDTH / 2, startY + 16, "Applied to all runs", {
        fontFamily: "monospace", fontSize: "8px", color: "#666",
      }).setOrigin(0.5)
    );

    UPGRADES.forEach((upg, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const itemW = (GAME_WIDTH - 30) / 2;
      const itemH = 90;
      const ix = 10 + col * (itemW + 10);
      const iy = startY + 35 + row * (itemH + 12);

      const currentLv = this.saveData.upgradeLevels[upg.id] ?? 0;
      const isMaxed = currentLv >= upg.maxLevel;
      const cost = isMaxed ? 0 : getUpgradeCost(upg, currentLv);
      const canAfford = !isMaxed && (this.saveData.coins ?? 0) >= cost;

      // Panel
      this.addPanel(ix, iy, itemW, itemH,
        isMaxed ? 0x4ade80 : canAfford ? 0x667eea : 0x222233,
      );

      // Icon + Name
      this.contentContainer.add(
        this.add.text(ix + 10, iy + 12, upg.icon, { fontSize: "18px" }).setOrigin(0, 0.5)
      );
      this.contentContainer.add(
        this.add.text(ix + 32, iy + 8, upg.name, {
          fontFamily: "monospace", fontSize: "10px", color: "#fff",
        })
      );

      // Level progress
      const lvText = isMaxed ? "MAX" : `Lv.${currentLv}/${upg.maxLevel}`;
      this.contentContainer.add(
        this.add.text(ix + 32, iy + 22, lvText, {
          fontFamily: "monospace", fontSize: "8px",
          color: isMaxed ? "#4ade80" : "#888",
        })
      );

      // Level bar
      const barX = ix + 8;
      const barY = iy + 38;
      const barW = itemW - 16;
      const barH = 5;
      const barBg = this.add.graphics();
      barBg.fillStyle(0x222233, 0.8);
      barBg.fillRoundedRect(barX, barY, barW, barH, 2);
      this.contentContainer.add(barBg);

      const lvRatio = currentLv / upg.maxLevel;
      if (lvRatio > 0) {
        const barFill = this.add.graphics();
        barFill.fillStyle(isMaxed ? 0x4ade80 : 0x667eea, 0.9);
        barFill.fillRoundedRect(barX, barY, barW * lvRatio, barH, 2);
        this.contentContainer.add(barFill);
      }

      // Description
      this.contentContainer.add(
        this.add.text(ix + 8, iy + 48, upg.desc, {
          fontFamily: "monospace", fontSize: "7px", color: "#777",
          wordWrap: { width: itemW - 16 },
        })
      );

      // Buy button
      if (!isMaxed) {
        this.contentContainer.add(createButton({
          scene: this,
          x: ix + itemW / 2,
          y: iy + itemH - 14,
          width: itemW - 16,
          height: 22,
          label: `${cost} coins`,
          fontSize: "9px",
          color: canAfford ? 0x1a2e1a : 0x1a1a1a,
          textColor: canAfford ? "#4ade80" : "#555",
          borderColor: canAfford ? 0x4ade80 : 0x333333,
          depth: 15,
          onClick: () => {
            if (!canAfford) return;
            this.saveData.coins -= cost;
            this.saveData.upgradeLevels[upg.id] = currentLv + 1;
            saveSaveData(this.saveData);
            this.refreshCoinBadge();
            this.buildTab(1);
            this.cameras.main.flash(200, 100, 180, 255);
          },
        }));
      }
    });
  }

  // ════════════════════════════════════════
  // TAB 2: POKÉDEX
  // ════════════════════════════════════════

  private buildPokedexTab(): void {
    const startY = CONTENT_Y + 10;

    const allPokemon = this.collectPokedexEntries();
    const encountered = new Set(this.saveData.pokedex ?? []);
    for (const key of this.saveData.unlockedStarters) encountered.add(key);
    // Add evolution forms for unlocked starters
    for (const key of this.saveData.unlockedStarters) {
      const chain = EVOLUTION_CHAINS[key];
      if (chain) chain.forEach(stage => encountered.add(stage.spriteKey));
    }

    // Header (fixed, not scrolled)
    this.contentContainer.add(
      this.add.text(GAME_WIDTH / 2, startY, `Pokédex — ${encountered.size}/${allPokemon.length}`, {
        fontFamily: "monospace", fontSize: "12px", color: "#4ade80",
      }).setOrigin(0.5)
    );

    // Scrollable grid container
    const scrollContainer = this.add.container(0, 0).setDepth(11);
    this.contentContainer.add(scrollContainer);

    const cols = 8;
    const cellSize = 44;
    const gridW = cols * cellSize;
    const gridX = (GAME_WIDTH - gridW) / 2;
    const gridTopY = startY + 26;

    // Use simple graphics — NO animated sprites (performance)
    allPokemon.forEach((pkey, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = gridX + col * cellSize + cellSize / 2;
      const cy = gridTopY + row * cellSize + cellSize / 2;
      const seen = encountered.has(pkey);

      const cellBg = this.add.graphics();
      cellBg.fillStyle(seen ? 0x151530 : 0x0a0a12, 0.7);
      cellBg.fillRoundedRect(cx - cellSize / 2 + 1, cy - cellSize / 2 + 1, cellSize - 2, cellSize - 2, 3);
      if (seen) {
        cellBg.lineStyle(1, 0x333355, 0.4);
        cellBg.strokeRoundedRect(cx - cellSize / 2 + 1, cy - cellSize / 2 + 1, cellSize - 2, cellSize - 2, 3);
      }
      scrollContainer.add(cellBg);

      if (seen) {
        // Static image only (first frame), no animation — performance
        const texKey = pacTexKey(pkey);
        if (this.textures.exists(texKey)) {
          const frames = this.textures.get(texKey).getFrameNames();
          const firstFrame = frames.length > 0 ? frames[0] : undefined;
          const img = this.add.image(cx, cy - 3, texKey, firstFrame).setScale(0.65);
          scrollContainer.add(img);
        }
        scrollContainer.add(
          this.add.text(cx, cy + 16, pkey.slice(0, 5), {
            fontFamily: "monospace", fontSize: "5px", color: "#888",
          }).setOrigin(0.5)
        );
      } else {
        scrollContainer.add(
          this.add.text(cx, cy, "?", {
            fontFamily: "monospace", fontSize: "14px", color: "#1a1a2e",
          }).setOrigin(0.5)
        );
      }
    });

    // Total rows height
    const totalRows = Math.ceil(allPokemon.length / cols);
    const contentH = totalRows * cellSize + 30;
    const visibleH = CONTENT_H - 30;

    // Scroll mask
    if (contentH > visibleH) {
      const maskShape = this.make.graphics({});
      maskShape.fillStyle(0xffffff);
      maskShape.fillRect(0, gridTopY - 4, GAME_WIDTH, visibleH);
      scrollContainer.setMask(maskShape.createGeometryMask());

      // Drag to scroll
      let dragStartY = 0;
      let dragStartContY = 0;
      const minY = -(contentH - visibleH);
      const maxY = 0;

      const scrollZone = this.add.zone(GAME_WIDTH / 2, gridTopY + visibleH / 2, GAME_WIDTH, visibleH)
        .setInteractive().setDepth(12);
      this.contentContainer.add(scrollZone);

      scrollZone.on("pointerdown", (p: Phaser.Input.Pointer) => {
        dragStartY = p.y;
        dragStartContY = scrollContainer.y;
      });

      scrollZone.on("pointermove", (p: Phaser.Input.Pointer) => {
        if (!p.isDown) return;
        const dy = p.y - dragStartY;
        scrollContainer.y = Phaser.Math.Clamp(dragStartContY + dy, minY, maxY);
      });
    }
  }

  private collectPokedexEntries(): string[] {
    const set = new Set<string>();

    // Starters + evolutions
    for (const starter of ALL_STARTERS) {
      set.add(starter.key);
      const chain = EVOLUTION_CHAINS[starter.key];
      if (chain) chain.forEach(stage => set.add(stage.spriteKey));
    }

    // Enemies
    for (const tier of ENEMY_POOL) {
      for (const key of tier) set.add(key);
    }

    // Bosses
    for (const key of BOSS_POOL) set.add(key);

    // Sort alphabetically
    return Array.from(set).sort();
  }

  // ════════════════════════════════════════
  // TAB 3: RECORDS (Achievements + Stats)
  // ════════════════════════════════════════

  private buildRecordsTab(): void {
    const startY = CONTENT_Y + 10;
    const unlocked = new Set(this.saveData.unlockedAchievements ?? []);

    // Stats section
    this.contentContainer.add(
      this.add.text(GAME_WIDTH / 2, startY, "Stats", {
        fontFamily: "monospace", fontSize: "12px", color: "#fbbf24",
      }).setOrigin(0.5)
    );

    const hs = this.saveData.highScore;
    const statsLines = [
      `Total Runs: ${this.saveData.totalRuns ?? 0}`,
      `Best Kills: ${hs?.kills ?? 0}`,
      `Best Wave: ${hs?.wave ?? 0}`,
      `Best Level: ${hs?.level ?? 0}`,
      `Best Cycle: ${hs?.cycle ?? 1}`,
      `Starters Unlocked: ${this.saveData.unlockedStarters.length}/${ALL_STARTERS.length}`,
      `Pokédex: ${(this.saveData.pokedex?.length ?? 0)} species`,
    ];

    const statsPanel = startY + 18;
    this.addPanel(15, statsPanel, GAME_WIDTH - 30, 110);

    statsLines.forEach((line, i) => {
      this.contentContainer.add(
        this.add.text(25, statsPanel + 10 + i * 14, line, {
          fontFamily: "monospace", fontSize: "9px", color: "#aaa",
        })
      );
    });

    // Achievements section
    const achY = statsPanel + 125;
    this.contentContainer.add(
      this.add.text(GAME_WIDTH / 2, achY, `Achievements — ${unlocked.size}/${ACHIEVEMENTS.length}`, {
        fontFamily: "monospace", fontSize: "12px", color: "#a78bfa",
      }).setOrigin(0.5)
    );

    ACHIEVEMENTS.forEach((ach, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const itemW = (GAME_WIDTH - 30) / 2;
      const itemH = 50;
      const ix = 10 + col * (itemW + 10);
      const iy = achY + 18 + row * (itemH + 6);

      const done = unlocked.has(ach.id);

      this.addPanel(ix, iy, itemW, itemH,
        done ? 0xa78bfa : 0x1a1a2e,
        done ? 0x151528 : 0x0c0c16,
      );

      // Icon
      this.contentContainer.add(
        this.add.text(ix + 10, iy + 14, done ? "★" : "☆", {
          fontFamily: "monospace", fontSize: "16px",
          color: done ? "#fbbf24" : "#333",
        }).setOrigin(0, 0.5)
      );

      // Name
      this.contentContainer.add(
        this.add.text(ix + 30, iy + 8, ach.name, {
          fontFamily: "monospace", fontSize: "9px",
          color: done ? "#fff" : "#555",
        })
      );

      // Description
      this.contentContainer.add(
        this.add.text(ix + 30, iy + 22, ach.desc, {
          fontFamily: "monospace", fontSize: "7px",
          color: done ? "#aaa" : "#333",
          wordWrap: { width: itemW - 40 },
        })
      );

      if (done) {
        this.contentContainer.add(
          this.add.text(ix + itemW - 8, iy + 14, "✓", {
            fontFamily: "monospace", fontSize: "14px", color: "#4ade80",
          }).setOrigin(1, 0.5)
        );
      }
    });
  }
}
