import { 
    GRID_SIZE, 
    GRID_COLS, 
    GRID_ROWS, 
    BLOCK_TYPES, 
    BLOCK_COLORS, 
    PLAYER_COLOR,
    PLAYER_SPEED,
    TOOL_MODES,
    PLAYABLE_HEIGHT,
    TOOLBAR_HEIGHT,
    GAME_WIDTH,
    HEADER_HEIGHT
} from '../data/constants.js';
import { Toolbar } from '../ui/Toolbar.js';
import { Modal } from '../ui/Modal.js';
import { saveWorld, loadWorld, getAllWorlds, generateDefaultWorldName, clearWorld, getChildName, saveChildName } from '../utils/storage.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.grid = null;
        this.gridGraphics = null;
        this.player = null;
        this.cursors = null;
        this.wasd = null;
        this.toolbar = null;
        this.tileGraphics = {};
        this.modal = null;
        this.titleText = null;
        this.settingsButton = null;
        this.isTextInputOpen = false;
    }

    preload() {
        // Load icon assets
        this.load.image('icon-erase', 'assets/icons/erase.png');
        this.load.image('icon-save', 'assets/icons/save.png');
        this.load.image('icon-load', 'assets/icons/load.png');
        this.load.image('icon-clear', 'assets/icons/clear.png');
        this.load.image('icon-girl', 'assets/icons/blonde_girl.png');
        this.load.image('icon-bunny', 'assets/icons/bunny.png');
        this.load.image('icon-settings', 'assets/icons/config.png');

        console.log('[GameScene] Loading icon assets...');
    }

    create() {
        console.log('[GameScene] Initializing game...');

        // Initialize grid
        this.initializeGrid();

        // Draw grid lines
        this.drawGridLines();

        // Create player
        this.createPlayer();

        // Setup input
        this.setupInput();

        // Create modal system
        this.modal = new Modal(this);

        // Create title
        this.createTitle();

        // Create settings button
        this.createSettingsButton();

        // Create toolbar
        this.toolbar = new Toolbar(this);

        // Render initial grid
        this.renderGrid();

        console.log('[GameScene] Game ready!');
    }

    initializeGrid() {
        // Create 2D array for grid
        this.grid = [];
        for (let row = 0; row < GRID_ROWS; row++) {
            this.grid[row] = [];
            for (let col = 0; col < GRID_COLS; col++) {
                this.grid[row][col] = BLOCK_TYPES.EMPTY;
            }
        }
    }

    buildTitleText(name) {
        // Handle possessive apostrophe correctly
        if (name.endsWith('s') || name.endsWith('S')) {
            return `${name}' Blocks`;
        } else {
            return `${name}'s Blocks`;
        }
    }

    createTitle() {
        const childName = getChildName();
        const title = this.buildTitleText(childName);
        
        // Create title text centered at top
        this.titleText = this.add.text(GAME_WIDTH / 2, 24, title, {
            fontSize: '28px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#333333'
        });
        this.titleText.setOrigin(0.5);
        this.titleText.setDepth(1000);
    }

    createSettingsButton() {
        // Create cog button using config icon image
        this.settingsButton = this.add.image(0, this.titleText.y, 'icon-settings');
        
        // Calculate and store aspect ratio once
        const iconAspectRatio = this.settingsButton.width / this.settingsButton.height;
        this.settingsButtonAspectRatio = iconAspectRatio;
        
        // Size it to 26px height preserving aspect ratio
        const targetHeight = 26;
        this.settingsButton.setDisplaySize(targetHeight * this.settingsButtonAspectRatio, targetHeight);
        this.settingsButton.setOrigin(0.5);
        this.settingsButton.setInteractive({ useHandCursor: true });
        this.settingsButton.setDepth(1000);
        
        // Position button to the right of title
        this.positionSettingsButton();
        
        // Add click handler
        this.settingsButton.on('pointerdown', () => {
            this.openChildNameDialog();
        });
        
        // Add subtle hover effects
        this.settingsButton.on('pointerover', () => {
            const hoverHeight = 29;
            this.settingsButton.setDisplaySize(hoverHeight * this.settingsButtonAspectRatio, hoverHeight);
        });
        
        this.settingsButton.on('pointerout', () => {
            const normalHeight = 26;
            this.settingsButton.setDisplaySize(normalHeight * this.settingsButtonAspectRatio, normalHeight);
        });
    }

    positionSettingsButton() {
        if (this.titleText && this.settingsButton) {
            // Position cog to the right of the title with a small gap
            this.settingsButton.x = 
                this.titleText.x + 
                (this.titleText.width / 2) + 
                (this.settingsButton.displayWidth / 2) + 
                12;
            this.settingsButton.y = this.titleText.y;
        }
    }

    openChildNameDialog() {
        const currentName = getChildName();
        
        this.modal.showInputDialog(
            'Child Name',
            'Enter child name',
            currentName,
            (name) => {
                const savedName = saveChildName(name);
                
                // Update title immediately
                this.titleText.setText(this.buildTitleText(savedName));
                
                // Reposition cog button after title text changes
                this.positionSettingsButton();
                
                // Show confirmation toast
                this.modal.showToast(`Name updated to ${savedName}!`);
            }
        );
    }

    drawGridLines() {
        // Create graphics object for grid
        const graphics = this.add.graphics();

        // Draw toolbar background
        graphics.fillStyle(0x333333, 0.2);
        graphics.fillRect(0, HEADER_HEIGHT + PLAYABLE_HEIGHT, GAME_WIDTH, TOOLBAR_HEIGHT);

        // Draw separator line between playable area and toolbar
        graphics.lineStyle(3, 0x000000, 0.8);
        graphics.lineBetween(0, HEADER_HEIGHT + PLAYABLE_HEIGHT, GAME_WIDTH, HEADER_HEIGHT + PLAYABLE_HEIGHT);

        // Draw grid lines with 0.5 pixel offset for crisp rendering
        graphics.lineStyle(1, 0x000000, 0.1);

        // Horizontal lines (offset by HEADER_HEIGHT)
        for (let row = 0; row <= GRID_ROWS; row++) {
            const y = HEADER_HEIGHT + row * GRID_SIZE + 0.5;
            graphics.lineBetween(0, y, GRID_COLS * GRID_SIZE, y);
        }

        // Vertical lines (offset by HEADER_HEIGHT)
        for (let col = 0; col <= GRID_COLS; col++) {
            const x = col * GRID_SIZE + 0.5;
            graphics.lineBetween(x, HEADER_HEIGHT, x, HEADER_HEIGHT + GRID_ROWS * GRID_SIZE);
        }

        // Set depth so grid lines appear above blocks and player but below UI
        graphics.setDepth(30);

        this.gridGraphics = graphics;
    }

    createPlayer() {
        // Set physics world bounds to playable area only (accounting for header area)
        this.physics.world.setBounds(0, HEADER_HEIGHT, GAME_WIDTH, PLAYABLE_HEIGHT);

        // Player starts in the middle of the grid (offset by HEADER_HEIGHT)
        const startX = Math.floor(GRID_COLS / 2) * GRID_SIZE + GRID_SIZE / 2;
        const startY = HEADER_HEIGHT + Math.floor(GRID_ROWS / 2) * GRID_SIZE + GRID_SIZE / 2;

        this.player = this.add.circle(startX, startY, 15, PLAYER_COLOR);
        this.player.setDepth(20);
        this.player.setVisible(false);

        // Add physics
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
    }

    setupInput() {
        // Arrow keys
        this.cursors = this.input.keyboard.createCursorKeys();

        // WASD keys
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };

        // Mouse click for placing/erasing
        this.input.on('pointerdown', (pointer) => {
            this.handleGridClick(pointer);
        });

        // Mouse move for hover effect
        this.input.on('pointermove', (pointer) => {
            this.handleGridHover(pointer);
        });

        // Create hover rectangle once
        this.hoverRect = this.add.rectangle(0, 0, GRID_SIZE, GRID_SIZE);
        this.hoverRect.setStrokeStyle(2, 0xffffff, 0.8);
        this.hoverRect.setFillStyle(0xffffff, 0.1);
        this.hoverRect.setDepth(50);
        this.hoverRect.setVisible(false);
    }

    handleGridClick(pointer) {
        // Ignore clicks when modal is open
        if (this.modal.container) {
            return;
        }

        // Ignore clicks outside the playable grid area
        if (pointer.y >= HEADER_HEIGHT + PLAYABLE_HEIGHT || pointer.y < HEADER_HEIGHT) {
            return;
        }

        const gridX = Math.floor(pointer.x / GRID_SIZE);
        const gridY = Math.floor((pointer.y - HEADER_HEIGHT) / GRID_SIZE);

        // Check if click is within grid bounds
        if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) {
            return;
        }

        // Don't place on player's current position (account for player being centered)
        const playerGridX = Math.floor((this.player.x - GRID_SIZE / 2) / GRID_SIZE);
        const playerGridY = Math.floor((this.player.y - HEADER_HEIGHT - GRID_SIZE / 2) / GRID_SIZE);

        if (this.toolbar.getMode() === TOOL_MODES.ERASE) {
            // Erase mode
            this.grid[gridY][gridX] = BLOCK_TYPES.EMPTY;
            this.renderTile(gridX, gridY);
        } else {
            // Place mode
            const selectedTool = this.toolbar.getSelectedTool();
            
            // Don't place solid block on player
            if (gridX === playerGridX && gridY === playerGridY) {
                console.log('[GameScene] Cannot place block on player position');
                return;
            }

            this.grid[gridY][gridX] = selectedTool;
            this.renderTile(gridX, gridY);
        }
    }

    handleGridHover(pointer) {
        // Ignore hover outside the playable grid area
        if (pointer.y >= HEADER_HEIGHT + PLAYABLE_HEIGHT || pointer.y < HEADER_HEIGHT) {
            this.hoverRect.setVisible(false);
            return;
        }

        const gridX = Math.floor(pointer.x / GRID_SIZE);
        const gridY = Math.floor((pointer.y - HEADER_HEIGHT) / GRID_SIZE);

        // Check if hover is within grid bounds
        if (gridX >= 0 && gridX < GRID_COLS && gridY >= 0 && gridY < GRID_ROWS) {
            const x = gridX * GRID_SIZE + GRID_SIZE / 2;
            const y = HEADER_HEIGHT + gridY * GRID_SIZE + GRID_SIZE / 2;
            
            // Move and show hover rectangle
            this.hoverRect.setPosition(x, y);
            this.hoverRect.setVisible(true);
        } else {
            // Hide when outside grid
            this.hoverRect.setVisible(false);
        }
    }

    renderGrid() {
        // Clear existing tile graphics
        Object.values(this.tileGraphics).forEach(graphic => {
            if (graphic) graphic.destroy();
        });
        this.tileGraphics = {};

        // Render all tiles
        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                this.renderTile(col, row);
            }
        }
    }

    renderTile(col, row) {
        const key = `${col}_${row}`;
        
        // Destroy existing graphic for this tile
        if (this.tileGraphics[key]) {
            this.tileGraphics[key].destroy();
            delete this.tileGraphics[key];
        }

        const blockType = this.grid[row][col];
        
        if (blockType === BLOCK_TYPES.EMPTY) {
            return; // Nothing to render
        }

        const x = col * GRID_SIZE + GRID_SIZE / 2;
        const y = HEADER_HEIGHT + row * GRID_SIZE + GRID_SIZE / 2;
        const color = BLOCK_COLORS[blockType];

        if (blockType === BLOCK_TYPES.BUNNY) {
            // Render bunny using image asset
            const bunnySprite = this.add.image(x, y, 'icon-bunny');
            
            // Scale bunny larger for better readability (90% of tile size)
            const targetSize = GRID_SIZE * 0.9;
            const scale = targetSize / Math.max(bunnySprite.width, bunnySprite.height);
            bunnySprite.setScale(scale);
            bunnySprite.setDepth(10);
            
            this.tileGraphics[key] = bunnySprite;
        } else if (blockType === BLOCK_TYPES.GIRL) {
            // Render girl using image asset
            const girlSprite = this.add.image(x, y, 'icon-girl');
            
            // Scale girl larger for better readability (90% of tile size)
            const targetSize = GRID_SIZE * 0.9;
            const scale = targetSize / Math.max(girlSprite.width, girlSprite.height);
            girlSprite.setScale(scale);
            girlSprite.setDepth(10);
            
            this.tileGraphics[key] = girlSprite;
        } else {
            // Render colored block - fill entire tile with no border for clean merging
            const block = this.add.rectangle(x, y, GRID_SIZE, GRID_SIZE, color);
            block.setDepth(5);
            
            this.tileGraphics[key] = block;
        }
    }

    update() {
        // Stop player movement if text input is open
        if (this.isTextInputOpen) {
            if (this.player && this.player.body) {
                this.player.body.setVelocity(0);
            }
            return;
        }

        // Handle player movement
        let velocityX = 0;
        let velocityY = 0;

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            velocityX = -PLAYER_SPEED;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            velocityX = PLAYER_SPEED;
        }

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            velocityY = -PLAYER_SPEED;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            velocityY = PLAYER_SPEED;
        }

        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            const length = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
            velocityX = (velocityX / length) * PLAYER_SPEED;
            velocityY = (velocityY / length) * PLAYER_SPEED;
        }

        // Check collision with blocks before moving
        const newX = this.player.x + velocityX * (1 / 60);
        const newY = this.player.y + velocityY * (1 / 60);

        if (!this.wouldCollideWithBlock(newX, newY)) {
            this.player.body.setVelocity(velocityX, velocityY);
        } else {
            // Try moving only on X axis
            if (velocityX !== 0 && !this.wouldCollideWithBlock(this.player.x + velocityX * (1 / 60), this.player.y)) {
                this.player.body.setVelocityX(velocityX);
                this.player.body.setVelocityY(0);
            }
            // Try moving only on Y axis
            else if (velocityY !== 0 && !this.wouldCollideWithBlock(this.player.x, this.player.y + velocityY * (1 / 60))) {
                this.player.body.setVelocityX(0);
                this.player.body.setVelocityY(velocityY);
            }
            // Can't move in either direction
            else {
                this.player.body.setVelocity(0);
            }
        }
    }

    wouldCollideWithBlock(x, y) {
        // Check if position would be inside a solid block
        const gridX = Math.floor((x - GRID_SIZE / 2) / GRID_SIZE);
        const gridY = Math.floor((y - HEADER_HEIGHT - GRID_SIZE / 2) / GRID_SIZE);

        // Check bounds
        if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) {
            return false;
        }

        const blockType = this.grid[gridY][gridX];

        // Solid blocks are: PINK, BLUE, YELLOW, PURPLE
        // Grass, Bunny, and Empty are not solid
        return blockType === BLOCK_TYPES.PINK || 
               blockType === BLOCK_TYPES.BLUE || 
               blockType === BLOCK_TYPES.YELLOW || 
               blockType === BLOCK_TYPES.PURPLE;
    }

    saveWorld() {
        const worldData = {
            grid: this.grid,
            playerPosition: {
                x: this.player.x,
                y: this.player.y
            }
        };

        const defaultName = generateDefaultWorldName();
        
        this.modal.showInputDialog(
            'Save World',
            'Enter world name',
            defaultName,
            (name) => {
                const success = saveWorld(name, worldData);
                if (success) {
                    this.modal.showToast(`Saved as "${name}"!`);
                } else {
                    this.modal.showToast('Save failed!');
                }
            }
        );
    }

    loadWorld() {
        const worlds = getAllWorlds();
        
        this.modal.showListDialog(
            'Load World',
            worlds,
            (world) => {
                const worldData = loadWorld(world.name);
                if (worldData) {
                    this.loadWorldData(worldData);
                    this.modal.showToast(`Loaded "${world.name}"!`);
                } else {
                    this.modal.showToast('Load failed!');
                }
            },
            'No saved worlds yet!\n\nStart building and save your creation!'
        );
    }

    loadWorldData(worldData) {
        this.grid = worldData.grid;
        
        if (worldData.playerPosition) {
            this.player.x = worldData.playerPosition.x;
            this.player.y = worldData.playerPosition.y;
        }

        this.renderGrid();
    }

    clearWorld() {
        this.modal.showConfirmDialog(
            'Clear World',
            'This will erase everything\nin the current world.\n\nAre you sure?',
            () => {
                this.initializeGrid();
                this.renderGrid();
                this.modal.showToast('World cleared!');
            },
            'Clear',
            'Cancel'
        );
    }
}
