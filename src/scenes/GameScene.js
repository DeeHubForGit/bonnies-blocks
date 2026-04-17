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
    HEADER_HEIGHT,
    isColorBlock,
    isSolidBlock,
    hasPattern,
    getPattern
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
        this.isDragging = false; // For drag-to-paint functionality
        this.lastPaintedCell = null; // Track last painted cell to avoid duplicate painting
        this.prefersReducedMotion = this.checkReducedMotion(); // Check for reduced motion preference
    }

    checkReducedMotion() {
        // Check for prefers-reduced-motion media query
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
        return false;
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
        
        // New icons - load with error handling
        this.load.on('loaderror', (file) => {
            console.log(`[GameScene] Icon not found: ${file.key}, will use placeholder`);
        });
        
        this.load.image('icon-flower', 'assets/icons/flower.png');
        this.load.image('icon-bush', 'assets/icons/bush.png');
        this.load.image('icon-tree', 'assets/icons/tree.png');
        this.load.image('icon-unicorn', 'assets/icons/unicorn.png');
        this.load.image('icon-fairy', 'assets/icons/fairy.png');

        console.log('[GameScene] Loading icon assets...');
    }

    create() {
        console.log('[GameScene] Initializing game...');

        // Create placeholder icons for missing assets
        this.createPlaceholderIcons();

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

        // Start rainbow cycling animation
        this.rainbowColors = [0xFF69B4, 0xFF8C00, 0xFFEB3B, 0x4CAF50, 0x3498DB, 0x9B59B6];
        this.rainbowIndex = 0;
        this.time.addEvent({
            delay: 1000, // Change color every second
            callback: this.cycleRainbowColors,
            callbackScope: this,
            loop: true
        });

        console.log('[GameScene] Game ready!');
    }

    createPlaceholderIcons() {
        // Create emoji/text-based placeholders for missing icons
        const placeholders = [
            { key: 'icon-flower', emoji: '🌸', color: '#FF69B4' },
            { key: 'icon-bush', emoji: '🌿', color: '#4CAF50' },
            { key: 'icon-tree', emoji: '🌳', color: '#228B22' },
            { key: 'icon-unicorn', emoji: '🦄', color: '#E0B0FF' },
            { key: 'icon-fairy', emoji: '🧚', color: '#FFB6C1' }
        ];

        placeholders.forEach(({ key, emoji, color }) => {
            // Check if texture already exists (was loaded successfully)
            if (this.textures.exists(key)) {
                return;
            }

            // Create a placeholder texture using canvas with emoji
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');

            // Background circle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(64, 64, 60, 0, Math.PI * 2);
            ctx.fill();

            // Emoji text
            ctx.font = 'bold 80px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, 64, 64);

            // Add the canvas as a texture
            this.textures.addCanvas(key, canvas);
        });
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
            // Start drag if it's a color tool
            if (this.toolbar.getMode() === TOOL_MODES.PLACE && isColorBlock(this.toolbar.getSelectedTool())) {
                this.isDragging = true;
                const gridX = Math.floor(pointer.x / GRID_SIZE);
                const gridY = Math.floor((pointer.y - HEADER_HEIGHT) / GRID_SIZE);
                this.lastPaintedCell = `${gridX}_${gridY}`;
            }
        });

        // Mouse up to stop drag painting
        this.input.on('pointerup', (pointer) => {
            this.isDragging = false;
            this.lastPaintedCell = null;
        });

        // Mouse move for hover effect and drag painting
        this.input.on('pointermove', (pointer) => {
            this.handleGridHover(pointer);
            
            // Handle drag painting for colors only
            if (this.isDragging && this.toolbar.getMode() === TOOL_MODES.PLACE) {
                const selectedTool = this.toolbar.getSelectedTool();
                if (isColorBlock(selectedTool)) {
                    this.handleDragPaint(pointer);
                }
            }
        });

        // Create hover rectangle once
        this.hoverRect = this.add.rectangle(0, 0, GRID_SIZE, GRID_SIZE);
        this.hoverRect.setStrokeStyle(2, 0xffffff, 0.8);
        this.hoverRect.setFillStyle(0xffffff, 0.1);
        this.hoverRect.setDepth(50);
        this.hoverRect.setVisible(false);
    }

    handleDragPaint(pointer) {
        // Ignore if outside playable grid area
        if (pointer.y >= HEADER_HEIGHT + PLAYABLE_HEIGHT || pointer.y < HEADER_HEIGHT) {
            return;
        }

        const gridX = Math.floor(pointer.x / GRID_SIZE);
        const gridY = Math.floor((pointer.y - HEADER_HEIGHT) / GRID_SIZE);

        // Check if within grid bounds
        if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) {
            return;
        }

        // Check if we've already painted this cell in this drag
        const cellKey = `${gridX}_${gridY}`;
        if (cellKey === this.lastPaintedCell) {
            return;
        }

        // Don't paint on player's position
        const playerGridX = Math.floor((this.player.x - GRID_SIZE / 2) / GRID_SIZE);
        const playerGridY = Math.floor((this.player.y - HEADER_HEIGHT - GRID_SIZE / 2) / GRID_SIZE);
        
        if (gridX === playerGridX && gridY === playerGridY) {
            this.lastPaintedCell = cellKey;
            return;
        }

        // Paint the color block
        const selectedTool = this.toolbar.getSelectedTool();
        this.grid[gridY][gridX] = selectedTool;
        this.renderTile(gridX, gridY);
        this.lastPaintedCell = cellKey;
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

    /**
     * Add animated sparkle particles to a container for special block effects
     * Creates a twinkling star-field effect with layered sparkles
     * @param {Phaser.GameObjects.Container} container - The container to add sparkles to
     * @param {number} blockSize - The size of the block (usually GRID_SIZE)
     * @param {number} scale - Scale factor for toolbar vs world grid (default 1.0)
     */
    addSparkleEffect(container, blockSize = GRID_SIZE, scale = 1.0) {
        // Skip animation if user prefers reduced motion
        const animate = !this.prefersReducedMotion;

        // Sparkle color scheme - vibrant pinks with white highlights for star-field effect
        // Easy to customize for different magical blocks in the future
        const sparkleColors = {
            tiny: 0xD88AB2,      // Medium dusty pink - base star layer
            medium: 0xC2185B,    // Deep rich pink - main twinkling stars
            bright: 0xFFB3D9,    // Pale pink - eye-catching highlights
            glow: 0xFFFFFF       // Pure white - magical glow sparkles
        };

        // Define sparkle particle configurations - star-field density
        // Positions spread across the tile for even distribution
        const sparkleConfig = [
            // Tiny sparkle dots - base star field (12 particles)
            { x: -14, y: -12, size: 0.7, type: 'tiny' },
            { x: -12, y: 3, size: 0.6, type: 'tiny' },
            { x: -8, y: -15, size: 0.6, type: 'tiny' },
            { x: -4, y: 7, size: 0.7, type: 'tiny' },
            { x: -2, y: -7, size: 0.6, type: 'tiny' },
            { x: 2, y: 14, size: 0.7, type: 'tiny' },
            { x: 5, y: -2, size: 0.6, type: 'tiny' },
            { x: 7, y: 9, size: 0.7, type: 'tiny' },
            { x: 10, y: -13, size: 0.6, type: 'tiny' },
            { x: 13, y: 4, size: 0.7, type: 'tiny' },
            { x: 15, y: 12, size: 0.6, type: 'tiny' },
            { x: -16, y: 8, size: 0.7, type: 'tiny' },
            
            // Medium sparkles - main twinkling layer (6 particles)
            { x: -10, y: -5, size: 1.2, type: 'medium' },
            { x: -6, y: 11, size: 1.3, type: 'medium' },
            { x: 0, y: -11, size: 1.1, type: 'medium' },
            { x: 8, y: 2, size: 1.4, type: 'medium' },
            { x: 12, y: -8, size: 1.2, type: 'medium' },
            { x: 14, y: 14, size: 1.3, type: 'medium' },
            
            // Bright highlights - prominent sparkles (3 particles)
            { x: -13, y: 13, size: 1.6, type: 'bright' },
            { x: 4, y: -14, size: 1.8, type: 'bright' },
            { x: 11, y: 7, size: 1.7, type: 'bright' },
            
            // Glow sparkles - magical white glints (2 particles with glow effect)
            { x: -3, y: -3, size: 2.0, type: 'glow', hasGlow: true },
            { x: 9, y: 11, size: 2.2, type: 'glow', hasGlow: true }
        ];

        // Create each sparkle particle
        sparkleConfig.forEach((config, index) => {
            // Use color based on sparkle type
            const sparkleColor = sparkleColors[config.type];
            
            // Add glow effect behind brightest sparkles
            if (config.hasGlow) {
                const glow = this.add.circle(
                    config.x * scale,
                    config.y * scale,
                    config.size * scale * 2.5, // Larger glow halo
                    sparkleColor
                );
                glow.setDepth(5);
                glow.setAlpha(0.15); // Very subtle glow
                container.add(glow);
                
                // Animate glow for living effect
                if (animate) {
                    this.tweens.add({
                        targets: glow,
                        alpha: { from: 0.15, to: 0.02 },
                        scale: { from: 1.0, to: 1.15 },
                        duration: 900 + index * 60,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        delay: index * 280
                    });
                }
            }
            
            const sparkle = this.add.circle(
                config.x * scale, 
                config.y * scale, 
                config.size * scale, 
                sparkleColor
            );
            sparkle.setDepth(6);
            container.add(sparkle);

            if (animate) {
                // Different animation styles for star-field twinkling effect
                if (config.type === 'tiny') {
                    // Quick, subtle twinkle - small stars blinking
                    sparkle.setAlpha(0.5);
                    this.tweens.add({
                        targets: sparkle,
                        alpha: { from: 0.5, to: 0.05 },
                        duration: 800 + index * 70,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Quad.easeInOut', // Quicker ease for pop
                        delay: index * 120
                    });
                } else if (config.type === 'medium') {
                    // Noticeable twinkle with scale - main star layer
                    sparkle.setAlpha(0.75);
                    this.tweens.add({
                        targets: sparkle,
                        alpha: { from: 0.75, to: 0.1 },
                        scale: { from: 1.0, to: 0.7 },
                        duration: 700 + index * 60,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Cubic.easeInOut', // More dramatic easing
                        delay: index * 140
                    });
                } else if (config.type === 'bright') {
                    // Strong pop effect - brighten quickly then dim
                    sparkle.setAlpha(0.85);
                    this.tweens.add({
                        targets: sparkle,
                        alpha: { from: 0.85, to: 0.2 },
                        scale: { from: 1.0, to: 1.2 },
                        duration: 650 + index * 50,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Back.easeOut', // Pop effect
                        delay: index * 200
                    });
                } else if (config.type === 'glow') {
                    // Magical glow - slow prominent pulse
                    sparkle.setAlpha(0.95);
                    this.tweens.add({
                        targets: sparkle,
                        alpha: { from: 0.95, to: 0.3 },
                        scale: { from: 1.0, to: 1.35 },
                        duration: 900 + index * 80,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        delay: index * 250
                    });
                }
            } else {
                // Reduced motion: static sparkles with layered opacity for depth
                const staticAlpha = {
                    'tiny': 0.35,
                    'medium': 0.55,
                    'bright': 0.7,
                    'glow': 0.8
                };
                sparkle.setAlpha(staticAlpha[config.type]);
            }
        });
    }

    renderTile(col, row) {
        const key = `${col}_${row}`;
        
        // Destroy existing graphic for this tile
        if (this.tileGraphics[key]) {
            if (this.tileGraphics[key].destroy) {
                this.tileGraphics[key].destroy();
            }
            delete this.tileGraphics[key];
        }

        const blockType = this.grid[row][col];
        
        if (blockType === BLOCK_TYPES.EMPTY) {
            return; // Nothing to render
        }

        const x = col * GRID_SIZE + GRID_SIZE / 2;
        const y = HEADER_HEIGHT + row * GRID_SIZE + GRID_SIZE / 2;
        const color = BLOCK_COLORS[blockType];

        // Check if this is an image-based object
        const imageObjects = [
            BLOCK_TYPES.BUNNY, 
            BLOCK_TYPES.GIRL, 
            BLOCK_TYPES.FLOWER, 
            BLOCK_TYPES.BUSH, 
            BLOCK_TYPES.TREE, 
            BLOCK_TYPES.UNICORN, 
            BLOCK_TYPES.FAIRY
        ];

        if (imageObjects.includes(blockType)) {
            // Get the appropriate icon key
            let iconKey = '';
            if (blockType === BLOCK_TYPES.BUNNY) iconKey = 'icon-bunny';
            else if (blockType === BLOCK_TYPES.GIRL) iconKey = 'icon-girl';
            else if (blockType === BLOCK_TYPES.FLOWER) iconKey = 'icon-flower';
            else if (blockType === BLOCK_TYPES.BUSH) iconKey = 'icon-bush';
            else if (blockType === BLOCK_TYPES.TREE) iconKey = 'icon-tree';
            else if (blockType === BLOCK_TYPES.UNICORN) iconKey = 'icon-unicorn';
            else if (blockType === BLOCK_TYPES.FAIRY) iconKey = 'icon-fairy';

            // Render object using image asset
            const sprite = this.add.image(x, y, iconKey);
            
            // Scale object larger for better visibility (90% of tile size)
            const targetSize = GRID_SIZE * 0.9;
            const scale = targetSize / Math.max(sprite.width, sprite.height);
            sprite.setScale(scale);
            sprite.setDepth(10);
            
            this.tileGraphics[key] = sprite;
        } else if (hasPattern(blockType)) {
            // Render pattern block (color background + emoji pattern)
            const container = this.add.container(x, y);
            
            // Base colored block
            const block = this.add.rectangle(0, 0, GRID_SIZE, GRID_SIZE, color);
            block.setDepth(5);
            container.add(block);
            
            // Special handling for GLITTER_PINK - add shimmer effect instead of emoji
            if (blockType === BLOCK_TYPES.GLITTER_PINK) {
                this.addSparkleEffect(container, GRID_SIZE, 1.0);
                // Skip pattern overlay for glitter - particles create the effect
            } else {
                // Add pattern overlay for non-glitter pattern blocks
                const pattern = getPattern(blockType);
                const patternText = this.add.text(0, 0, pattern, {
                    fontSize: '24px',
                    fontFamily: 'Arial'
                });
                patternText.setOrigin(0.5);
                patternText.setDepth(6);
                container.add(patternText);
            }
            
            container.setDepth(5);
            
            // Special handling for rainbow - mark it for color cycling
            if (blockType === BLOCK_TYPES.RAINBOW) {
                block.setData('isRainbow', true);
                block.setData('rainbowBlock', true);
            }
            
            this.tileGraphics[key] = container;
        } else {
            // Render regular colored block - fill entire tile
            const block = this.add.rectangle(x, y, GRID_SIZE, GRID_SIZE, color);
            block.setDepth(5);
            
            this.tileGraphics[key] = block;
        }
    }
    
    cycleRainbowColors() {
        // Cycle through rainbow colors for all rainbow blocks
        this.rainbowIndex = (this.rainbowIndex + 1) % this.rainbowColors.length;
        const newColor = this.rainbowColors[this.rainbowIndex];
        
        // Update all rainbow block tiles
        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                if (this.grid[row][col] === BLOCK_TYPES.RAINBOW) {
                    const key = `${col}_${row}`;
                    const container = this.tileGraphics[key];
                    
                    if (container && container.list && container.list.length > 0) {
                        // Get the rectangle (first child in container)
                        const block = container.list[0];
                        if (block && block.setFillStyle) {
                            block.setFillStyle(newColor);
                        }
                    }
                }
            }
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

        // Use the helper function to check if block is solid
        return isSolidBlock(blockType);
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
