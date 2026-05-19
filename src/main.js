import { GameScene } from './scenes/GameScene.js';
import { IsometricPlayScene } from './scenes/IsometricPlayScene.js';
import { 
    GAME_WIDTH, 
    GAME_HEIGHT, 
    MOBILE_PORTRAIT_WIDTH, 
    MOBILE_PORTRAIT_HEIGHT,
    isMobilePortrait 
} from './data/constants.js';

// Determine game dimensions based on device orientation
const isPortrait = isMobilePortrait();
const gameWidth = isPortrait ? MOBILE_PORTRAIT_WIDTH : GAME_WIDTH;
const gameHeight = isPortrait ? MOBILE_PORTRAIT_HEIGHT : GAME_HEIGHT;

// Phaser game configuration
const config = {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight,
    parent: 'game-container',
    backgroundColor: '#8FBF5F',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: gameWidth,
        height: gameHeight
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
