import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "./config";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { GameScene } from "./scenes/GameScene";

// Ensure the body fills the viewport with no margin/scroll
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "#0a0a0f";
document.body.style.width = "100vw";
document.body.style.height = "100vh";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: document.body,
  backgroundColor: COLORS.bg,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, GameScene],
  input: {
    activePointers: 2,
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
};

const game = new Phaser.Game(config);

// Expose for debugging (dev only)
(window as unknown as { game: Phaser.Game }).game = game;
