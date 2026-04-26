import { 
    GRID_SIZE, 
    GRID_COLS, 
    GRID_ROWS, 
    BLOCK_TYPES, 
    BLOCK_COLORS, 
    PLAYER_SPEED,
    GAME_WIDTH,
    GAME_HEIGHT,
    HEADER_HEIGHT,
    WORLD_SPRITES,
    isSolidBlock,
    isWorldObject,
    hasPattern,
    getPattern
} from '../data/constants.js';
import { getChildName } from '../utils/storage.js';

// Isometric tile dimensions (base values, may be scaled down to fit)
const BASE_ISO_TILE_WIDTH = 64;
const BASE_ISO_TILE_HEIGHT = 32;

// Layout constants for proper centering and safe margins
const TOP_RESERVED = 85;        // Space for title and mode text
const BOTTOM_RESERVED = 70;     // Space for Edit button
const VERTICAL_PADDING = 10;    // Safety margin top/bottom
const HORIZONTAL_MARGIN = 30;   // Safe left/right padding
const MAX_PLAYABLE_WIDTH = GAME_WIDTH - (HORIZONTAL_MARGIN * 2);

/**
 * Calculate optimal tile size to fit the world on screen
 * Returns adjusted tile dimensions if map is too wide
 */
function calculateOptimalTileSize() {
    // Calculate required map width with base tile size
    const minIsoX = -(GRID_ROWS - 1) * (BASE_ISO_TILE_WIDTH / 2);
    const maxIsoX = (GRID_COLS - 1) * (BASE_ISO_TILE_WIDTH / 2);
    const baseMapWidth = maxIsoX - minIsoX;
    
    // Check if we need to scale down
    if (baseMapWidth > MAX_PLAYABLE_WIDTH) {
        // Calculate scale factor to fit
        const scaleFactor = MAX_PLAYABLE_WIDTH / baseMapWidth;
        return {
            ISO_TILE_WIDTH: BASE_ISO_TILE_WIDTH * scaleFactor,
            ISO_TILE_HEIGHT: BASE_ISO_TILE_HEIGHT * scaleFactor,
            scaleFactor
        };
    }
    
    // No scaling needed
    return {
        ISO_TILE_WIDTH: BASE_ISO_TILE_WIDTH,
        ISO_TILE_HEIGHT: BASE_ISO_TILE_HEIGHT,
        scaleFactor: 1.0
    };
}

/**
 * Calculate the origin point for the isometric world
 * Centers the map properly within available screen space with safe margins
 */
function calculateIsoWorldOrigin(tileWidth, tileHeight) {
    // Calculate isometric map bounds
    const minIsoX = -(GRID_ROWS - 1) * (tileWidth / 2);
    const maxIsoX = (GRID_COLS - 1) * (tileWidth / 2);
    const minIsoY = 0;
    const maxIsoY = (GRID_COLS + GRID_ROWS - 2) * (tileHeight / 2);
    
    const mapWidth = maxIsoX - minIsoX;
    const mapHeight = maxIsoY - minIsoY;
    
    // Calculate available space with safe margins
    const availableWidth = MAX_PLAYABLE_WIDTH;
    const availableHeight = GAME_HEIGHT - TOP_RESERVED - BOTTOM_RESERVED - (VERTICAL_PADDING * 2);
    
    // Center horizontally within safe area
    const originX = HORIZONTAL_MARGIN + (availableWidth - mapWidth) / 2 - minIsoX;
    
    // Center vertically in available space
    const originY = TOP_RESERVED + VERTICAL_PADDING + (availableHeight - mapHeight) / 2 - minIsoY;
    
    return { 
        originX, 
        originY,
        mapWidth,
        mapHeight,
        minIsoX,
        maxIsoX,
        minIsoY,
        maxIsoY
    };
}

/**
 * IsometricPlayScene - Separate scene for isometric world view
 * Reads flat grid data from Build Mode and renders as isometric world
 */
export class IsometricPlayScene extends Phaser.Scene {
    constructor() {
        super({ key: 'IsometricPlayScene' });
        this.worldGrid = null;
        this.player = null;
        this.cursors = null;
        this.wasd = null;
        this.worldSprites = [];
        this.playerGridX = 0;
        this.playerGridY = 0;
        this.isoOrigin = null;      // Calculated world origin
        this.isoTileWidth = 0;      // Actual tile width (may be scaled)
        this.isoTileHeight = 0;     // Actual tile height (may be scaled)
        this.scaleFactor = 1.0;     // Scale factor for fitting
    }

    /**
     * Initialize with world data from Build Mode
     */
    init(data) {
        console.log('[IsometricPlayScene] Initializing with world data');
        this.worldGrid = data.grid || this.createEmptyGrid();
        this.childName = data.childName || 'Bonnie';
    }

    createEmptyGrid() {
        const grid = [];
        for (let row = 0; row < GRID_ROWS; row++) {
            grid[row] = [];
            for (let col = 0; col < GRID_COLS; col++) {
                grid[row][col] = BLOCK_TYPES.EMPTY;
            }
        }
        return grid;
    }

    preload() {
        // World assets already loaded by GameScene
        // Load edit icon for return-to-edit button
        this.load.image('icon-edit', 'assets/icons/edit.png');
    }

    create() {
        console.log('[IsometricPlayScene] Creating isometric world view');

        // Calculate optimal tile size to fit screen with margins
        const tileConfig = calculateOptimalTileSize();
        this.isoTileWidth = tileConfig.ISO_TILE_WIDTH;
        this.isoTileHeight = tileConfig.ISO_TILE_HEIGHT;
        this.scaleFactor = tileConfig.scaleFactor;
        
        console.log('[IsometricPlayScene] Tile size:', {
            width: this.isoTileWidth.toFixed(2),
            height: this.isoTileHeight.toFixed(2),
            scaleFactor: this.scaleFactor.toFixed(3)
        });

        // Calculate world origin for proper centering with safe margins
        this.isoOrigin = calculateIsoWorldOrigin(this.isoTileWidth, this.isoTileHeight);
        console.log('[IsometricPlayScene] World origin:', {
            x: this.isoOrigin.originX.toFixed(2),
            y: this.isoOrigin.originY.toFixed(2),
            mapWidth: this.isoOrigin.mapWidth.toFixed(2)
        });

        // Add water background
        const bg = this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x6EC6E8
        );
        bg.setDepth(-100);

        // Add sand island border behind grass grid
        this.createSandIsland();

        // Create title
        this.createTitle();

        // Create Edit button to return to editor
        this.createBuildButton();

        // Render isometric world
        this.renderIsometricWorld();

        // Create player
        this.createPlayer();

        // Setup input
        this.setupInput();
        
        // Fade in transition for polish
        this.cameras.main.fadeIn(200, 212, 241, 244);

        console.log('[IsometricPlayScene] Isometric world ready!');
    }

    createTitle() {
        const title = this.buildTitleText(this.childName);
        this.titleText = this.add.text(GAME_WIDTH / 2, 24, title, {
            fontSize: '28px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#333333'
        });
        this.titleText.setOrigin(0.5);
        this.titleText.setDepth(10000);

        // Add mode indicator
        this.modeText = this.add.text(GAME_WIDTH / 2, 52, 'Play Mode', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#666666'
        });
        this.modeText.setOrigin(0.5);
        this.modeText.setDepth(10000);
    }

    buildTitleText(name) {
        if (name.endsWith('s') || name.endsWith('S')) {
            return `${name}' Blocks`;
        } else {
            return `${name}'s Blocks`;
        }
    }

    createBuildButton() {
        // Position button with safe margin from bottom
        const buttonY = GAME_HEIGHT - 45;
        const buttonX = GAME_WIDTH / 2;
        const buttonSize = 52; // Match toolbar button size

        const button = this.add.container(buttonX, buttonY);
        
        // Yellow background
        const bg = this.add.rectangle(0, 0, buttonSize, buttonSize, 0xFDF7D5)
            .setStrokeStyle(2, 0x000000)
            .setInteractive({ useHandCursor: true });

        // Use Edit icon image
        const icon = this.add.image(0, 0, 'icon-edit');
        icon.setOrigin(0.5);
        const iconSize = buttonSize * 0.72;
        const scale = iconSize / Math.max(icon.width, icon.height);
        icon.setScale(scale);

        // Create tooltip (hidden by default)
        const tooltip = this.add.text(0, -35, 'Edit', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            backgroundColor: '#333333',
            padding: { x: 6, y: 4 }
        });
        tooltip.setOrigin(0.5);
        tooltip.setVisible(false);
        tooltip.setDepth(20000);

        button.add([bg, icon, tooltip]);
        button.setDepth(10000);

        // Show tooltip on hover
        bg.on('pointerover', () => {
            tooltip.setVisible(true);
        });

        bg.on('pointerout', () => {
            tooltip.setVisible(false);
        });

        bg.on('pointerdown', () => {
            // Hide tooltip when clicking
            tooltip.setVisible(false);
            
            // Visual feedback (darker yellow)
            bg.setFillStyle(0xFBC02D);
            this.time.delayedCall(100, () => {
                bg.setFillStyle(0xFDD835);
            });
            
            // Fade out before returning to Edit Mode
            this.cameras.main.fadeOut(150, 245, 245, 245);
            this.time.delayedCall(150, () => {
                this.returnToBuildMode();
            });
        });

        this.buildButton = button;
    }

    returnToBuildMode() {
        console.log('[IsometricPlayScene] Returning to Edit Mode');
        
        // Resume Edit scene (it was paused, so state is preserved)
        this.scene.resume('GameScene');
        
        // Restore Edit scene visuals
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.setBuildViewVisible) {
            gameScene.setBuildViewVisible(true);
        }
        
        // Stop this Play scene
        this.scene.stop();
    }

    /**
     * Create sand island border behind grass grid
     */
    createSandIsland() {
        // Calculate the four corners of the grass grid
        const topCorner = this.gridToIso(0, 0);
        const rightCorner = this.gridToIso(GRID_COLS - 1, 0);
        const bottomCorner = this.gridToIso(GRID_COLS - 1, GRID_ROWS - 1);
        const leftCorner = this.gridToIso(0, GRID_ROWS - 1);

        // Expand corners slightly to create sand border (add padding)
        const padding = this.isoTileWidth * 0.6; // Sand extends beyond grass
        
        const sandGraphics = this.add.graphics();
        sandGraphics.setDepth(-50); // Above water, below grass

        // Draw expanded isometric diamond
        sandGraphics.fillStyle(0xE8D28A, 1); // Sand color
        sandGraphics.beginPath();
        sandGraphics.moveTo(topCorner.x, topCorner.y - padding);
        sandGraphics.lineTo(rightCorner.x + padding, rightCorner.y);
        sandGraphics.lineTo(bottomCorner.x, bottomCorner.y + padding);
        sandGraphics.lineTo(leftCorner.x - padding, leftCorner.y);
        sandGraphics.closePath();
        sandGraphics.fill();

        // Add subtle outline for definition
        sandGraphics.lineStyle(2, 0xD4B96A, 0.4);
        sandGraphics.strokePath();
    }

    /**
     * Convert flat grid coordinates to isometric screen position
     * Uses calculated world origin and tile dimensions for proper centering
     */
    gridToIso(col, row) {
        const isoX = (col - row) * (this.isoTileWidth / 2);
        const isoY = (col + row) * (this.isoTileHeight / 2);
        
        return {
            x: this.isoOrigin.originX + isoX,
            y: this.isoOrigin.originY + isoY
        };
    }

    /**
     * Calculate depth for proper rendering order
     * Objects farther back (smaller row+col) should render first
     */
    calculateDepth(row, col) {
        return (row + col) * 10;
    }

    /**
     * Render the entire world as isometric
     */
    renderIsometricWorld() {
        // Clear existing sprites
        this.worldSprites.forEach(sprite => sprite.destroy());
        this.worldSprites = [];

        // Collect all tiles with their positions for depth sorting
        const tiles = [];
        
        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                tiles.push({ row, col, blockType: this.worldGrid[row][col] });
            }
        }

        // Layer 1: Render base grass tiles
        tiles.forEach(({ row, col }) => {
            this.renderGroundTile(col, row);
        });

        // Layer 2: Render colored/pattern ground tiles (flat terrain)
        tiles.forEach(({ row, col, blockType }) => {
            if (blockType !== BLOCK_TYPES.EMPTY && !isWorldObject(blockType)) {
                this.renderFlatTerrainTile(col, row, blockType);
            }
        });

        // Layer 3: Render world objects (elevated sprites)
        tiles.forEach(({ row, col, blockType }) => {
            if (isWorldObject(blockType)) {
                this.renderWorldObject(col, row, blockType);
            }
        });
    }

    /**
     * Render isometric ground tile
     */
    renderGroundTile(col, row) {
        const pos = this.gridToIso(col, row);
        const depth = this.calculateDepth(row, col);

        // Create isometric grass tile
        const grassGraphics = this.add.graphics();
        grassGraphics.setDepth(depth);

        // Draw isometric diamond shape
        const halfWidth = this.isoTileWidth / 2;
        const halfHeight = this.isoTileHeight / 2;

        // Single grass color for natural world feel (not checkerboard)
        const grassColor = 0x8FBF5F; // Natural soft green grass

        grassGraphics.fillStyle(grassColor, 1);
        grassGraphics.beginPath();
        grassGraphics.moveTo(pos.x, pos.y - halfHeight); // Top
        grassGraphics.lineTo(pos.x + halfWidth, pos.y); // Right
        grassGraphics.lineTo(pos.x, pos.y + halfHeight); // Bottom
        grassGraphics.lineTo(pos.x - halfWidth, pos.y); // Left
        grassGraphics.closePath();
        grassGraphics.fill();

        // Add subtle outline for tile definition
        grassGraphics.lineStyle(1, 0x6FA54D, 0.3);
        grassGraphics.strokePath();

        this.worldSprites.push(grassGraphics);
    }

    /**
     * Render flat colored/pattern terrain tile (painted ground)
     */
    renderFlatTerrainTile(col, row, blockType) {
        const pos = this.gridToIso(col, row);
        const depth = this.calculateDepth(row, col);

        // Create flat isometric tile with block color
        const tileGraphics = this.add.graphics();
        tileGraphics.setDepth(depth + 1); // Above grass, below objects

        // Draw isometric diamond shape (same as grass, different color)
        const halfWidth = this.isoTileWidth / 2;
        const halfHeight = this.isoTileHeight / 2;

        const color = BLOCK_COLORS[blockType];

        tileGraphics.fillStyle(color, 1);
        tileGraphics.beginPath();
        tileGraphics.moveTo(pos.x, pos.y - halfHeight); // Top
        tileGraphics.lineTo(pos.x + halfWidth, pos.y); // Right
        tileGraphics.lineTo(pos.x, pos.y + halfHeight); // Bottom
        tileGraphics.lineTo(pos.x - halfWidth, pos.y); // Left
        tileGraphics.closePath();
        tileGraphics.fill();

        // Add subtle outline for definition
        const outlineColor = Phaser.Display.Color.IntegerToColor(color).darken(30).color;
        tileGraphics.lineStyle(1, outlineColor, 0.4);
        tileGraphics.strokePath();

        this.worldSprites.push(tileGraphics);

        // Add pattern decoration if applicable
        if (hasPattern(blockType) && blockType !== BLOCK_TYPES.GLITTER_PINK) {
            const pattern = getPattern(blockType);
            const fontSize = Math.round(18 * this.scaleFactor);
            const patternText = this.add.text(pos.x, pos.y, pattern, {
                fontSize: `${fontSize}px`,
                fontFamily: 'Arial'
            });
            patternText.setOrigin(0.5);
            patternText.setDepth(depth + 2);
            this.worldSprites.push(patternText);
        }
    }

    /**
     * Render world object (elevated sprite)
     */
    renderWorldObject(col, row, blockType) {
        const pos = this.gridToIso(col, row);
        const depth = this.calculateDepth(row, col);

        // Render as world object sprite
        const spriteKey = WORLD_SPRITES[blockType];
        const sprite = this.add.image(pos.x, pos.y, spriteKey);
        
        // Set origin to bottom-center for proper grounding
        // This makes objects appear planted on the tile instead of floating
        sprite.setOrigin(0.5, 0.85);
        
        // Size objects for isometric view (scaled with tile size)
        let targetHeight = this.isoTileHeight * 2;
        if (blockType === BLOCK_TYPES.GIRL) {
            targetHeight = this.isoTileHeight * 2.2;
            sprite.setOrigin(0.5, 0.85);
        } else if (blockType === BLOCK_TYPES.TREE) {
            targetHeight = this.isoTileHeight * 3.1;
            sprite.setOrigin(0.5, 0.9); // Trees slightly lower anchor
        } else if (blockType === BLOCK_TYPES.PALM_TREE) {
            // Palm trees (large tropical plants)
            targetHeight = this.isoTileHeight * 4.2;
            sprite.setOrigin(0.5, 0.85);
        } else if (blockType === BLOCK_TYPES.FLOWER) {
            targetHeight = this.isoTileHeight * 1.3;
            sprite.setOrigin(0.5, 0.7);
        } else if (blockType === BLOCK_TYPES.BUSH_PINK_FLOWER) {
            targetHeight = this.isoTileHeight * 1.2;
            sprite.setOrigin(0.5, 0.75);
        } else if (blockType === BLOCK_TYPES.BUSH_REINDEER) {
            targetHeight = this.isoTileHeight * 2.4;
            sprite.setOrigin(0.5, 0.9);
            // Move reindeer slightly forward on the tile so the feet sit better
            sprite.y += this.isoTileHeight * 0.22;
        } else if (blockType === BLOCK_TYPES.BUNNY) {
            targetHeight = this.isoTileHeight * 1.4;
            sprite.setOrigin(0.5, 0.9);
        } else if (blockType === BLOCK_TYPES.UNICORN) {
            targetHeight = this.isoTileHeight * 3.4;
            sprite.setOrigin(0.5, 0.9);
        }
        
        const scale = targetHeight / sprite.height;
        sprite.setScale(scale);
        
        // Use position-based depth for proper isometric sorting
        // Objects further down the screen (higher x+y) render above those further up
        sprite.setDepth(pos.x + pos.y);
        
        this.worldSprites.push(sprite);
    }

    /**
     * Create player character (tracking only - no visible sprite)
     */
    createPlayer() {
        // Find safe spawn position
        const spawnPos = this.findSafeSpawnPosition();
        this.playerGridX = spawnPos.col;
        this.playerGridY = spawnPos.row;

        // No player sprite needed - movement tracking uses grid coordinates only
        // All placed objects (including GIRL) are rendered via renderWorldObject()
        this.player = null;
    }

    updatePlayerDepth() {
        // No player sprite to update
    }

    findSafeSpawnPosition() {
        // Try to spawn at current position if safe
        if (this.playerGridX >= 0 && this.playerGridX < GRID_COLS && 
            this.playerGridY >= 0 && this.playerGridY < GRID_ROWS) {
            const currentBlock = this.worldGrid[this.playerGridY][this.playerGridX];
            if (!isSolidBlock(currentBlock)) {
                return { row: this.playerGridY, col: this.playerGridX };
            }
        }
        
        // Find first empty/walkable tile
        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                const blockType = this.worldGrid[row][col];
                if (!isSolidBlock(blockType)) {
                    return { row, col };
                }
            }
        }
        
        // Emergency fallback
        return { row: Math.floor(GRID_ROWS / 2), col: Math.floor(GRID_COLS / 2) };
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    update() {
        // Handle player movement in grid coordinates (no sprite needed)
        let moveRow = 0;
        let moveCol = 0;

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            moveRow = -1;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            moveRow = 1;
        }

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            moveCol = -1;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            moveCol = 1;
        }

        // Move player if valid
        if (moveRow !== 0 || moveCol !== 0) {
            this.movePlayer(moveCol, moveRow);
        }
    }

    movePlayer(deltaCol, deltaRow) {
        // Throttle movement
        const now = Date.now();
        if (this.lastMove && now - this.lastMove < 150) {
            return;
        }
        this.lastMove = now;

        const newCol = this.playerGridX + deltaCol;
        const newRow = this.playerGridY + deltaRow;

        // Check bounds
        if (newCol < 0 || newCol >= GRID_COLS || newRow < 0 || newRow >= GRID_ROWS) {
            return;
        }

        // Check collision
        const targetBlock = this.worldGrid[newRow][newCol];
        if (isSolidBlock(targetBlock)) {
            return;
        }

        // Update grid position
        this.playerGridX = newCol;
        this.playerGridY = newRow;
        
        // No player sprite to animate - movement tracked via grid coordinates only
    }
}
