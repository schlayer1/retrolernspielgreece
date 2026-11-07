import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';
import { OlympScene } from './scenes/OlympScene';
import { InteriorScene } from './scenes/InteriorScene';
import { UIScene } from './scenes/UIScene';
import { state } from './systems/GameState';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0e1726',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, WorldScene, OlympScene, InteriorScene, UIScene],
};

const game = new Phaser.Game(config);
(window as unknown as Record<string, unknown>).__GAME__ = game;
(window as unknown as Record<string, unknown>).__STATE__ = state;
