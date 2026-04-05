import { GameScene } from './scenes/GameScene.js';
import { GAME_WIDTH, GAME_HEIGHT } from './data/constants.js';

// Phaser game configuration
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#D4F1F4',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [GameScene]
};

// Create game instance
const game = new Phaser.Game(config);

console.log('[Main] Bonnie\'s Blocks game initialized!');
