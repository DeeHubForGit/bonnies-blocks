import { GameScene } from './scenes/GameScene.js';
import { IsometricPlayScene } from './scenes/IsometricPlayScene.js';
import { GAME_WIDTH, GAME_HEIGHT } from './data/constants.js';

// Phaser game configuration
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#8FBF5F',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [GameScene, IsometricPlayScene]
};

// Create game instance
const game = new Phaser.Game(config);

console.log('[Main] Bonnie\'s Blocks game initialized!');
