import { 
    GRID_SIZE, 
    GRID_COLS, 
    GRID_ROWS, 
    GRID_LEFT_OFFSET,
    MOBILE_PORTRAIT_GRID_SIZE,
    MOBILE_PORTRAIT_GRID_COLS,
    MOBILE_PORTRAIT_GRID_ROWS,
    MOBILE_PORTRAIT_GRID_LEFT_OFFSET,
    MOBILE_PORTRAIT_WIDTH,
    MOBILE_PORTRAIT_HEIGHT,
    MOBILE_PORTRAIT_HEADER_HEIGHT,
    MOBILE_PORTRAIT_TOOLBAR_HEIGHT,
    MOBILE_PORTRAIT_PLAYABLE_HEIGHT,
    BLOCK_TYPES, 
    BLOCK_COLORS, 
    PLAYER_COLOR,
    PLAYER_SPEED,
    TOOL_MODES,
    GAME_MODES,
    PLAYABLE_HEIGHT,
    TOOLBAR_HEIGHT,
    GAME_WIDTH,
    GAME_HEIGHT,
    HEADER_HEIGHT,
    GRID_TOP_MARGIN,
    WORLD_SPRITES,
    isColorBlock,
    isSolidBlock,
    hasPattern,
    getPattern,
    isMobilePortrait
} from '../data/constants.js';
import { Toolbar } from '../ui/Toolbar.js';
import { Modal } from '../ui/Modal.js';
import { saveWorld, loadWorld, getAllWorlds, generateDefaultWorldName, getChildName, saveChildName, deleteWorld, findWorldByName } from '../utils/storage.js';

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
        this.modeIndicator = null;
        this.isTextInputOpen = false;
        this.isDragging = false; // For drag-to-paint functionality
        this.lastPaintedCell = null; // Track last painted cell to avoid duplicate painting
        this.prefersReducedMotion = this.checkReducedMotion(); // Check for reduced motion preference
        this.gameMode = GAME_MODES.BUILD; // Start in Build mode
        this.currentWorldName = null; // Track which saved world is currently open
        
        // Phaser fake input for game name (to avoid iPhone Safari zoom)
        this.nameInputContainer = null;
        this.nameInputBackground = null;
        this.nameInputText = null;
        this.nameInputCursor = null;
        this.nameInputValue = '';
        this.nameInputPreviousValue = ''; // Store previous valid value for revert on blank
        this.nameInputActive = false;
        this.nameInputMaxLength = 14;
        
        this.viewportResizeTimeout = null; // Timeout for handling viewport resize on mobile
    }

    /**
     * Initialize with optional world data (from returning from View mode)
     */
    init(data) {
        console.log('[GameScene] Init with data:', data ? 'world data present' : 'no data');
        // Store grid data if passed from View mode
        this.restoredGrid = data.grid || null;
    }

    checkReducedMotion() {
        // Check for prefers-reduced-motion media query
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
        return false;
    }

    // Helper methods to get correct dimensions based on device orientation
    getGameWidth() {
        return isMobilePortrait() ? MOBILE_PORTRAIT_WIDTH : GAME_WIDTH;
    }

    getGameHeight() {
        return isMobilePortrait() ? MOBILE_PORTRAIT_HEIGHT : GAME_HEIGHT;
    }

    getHeaderHeight() {
        return isMobilePortrait() ? MOBILE_PORTRAIT_HEADER_HEIGHT : HEADER_HEIGHT;
    }

    getToolbarHeight() {
        return isMobilePortrait() ? MOBILE_PORTRAIT_TOOLBAR_HEIGHT : TOOLBAR_HEIGHT;
    }

    getPlayableHeight() {
        return isMobilePortrait() ? MOBILE_PORTRAIT_PLAYABLE_HEIGHT : PLAYABLE_HEIGHT;
    }

    getGridSize() {
        return isMobilePortrait() ? MOBILE_PORTRAIT_GRID_SIZE : GRID_SIZE;
    }

    getGridCols() {
        return isMobilePortrait() ? MOBILE_PORTRAIT_GRID_COLS : GRID_COLS;
    }

    getGridRows() {
        return isMobilePortrait() ? MOBILE_PORTRAIT_GRID_ROWS : GRID_ROWS;
    }

    getGridLeftOffset() {
        return isMobilePortrait() ? MOBILE_PORTRAIT_GRID_LEFT_OFFSET : GRID_LEFT_OFFSET;
    }

    preload() {
        // Load icon assets (for toolbar)
        this.load.image('icon-erase', 'assets/icons/erase.png');
        this.load.image('icon-save', 'assets/icons/save.png');
        this.load.image('icon-load', 'assets/icons/load.png');
        this.load.image('icon-clear', 'assets/icons/bin.png');
        this.load.image('icon-new', 'assets/icons/new.png');
        this.load.image('icon-girl', 'assets/icons/blonde_girl.png');
        this.load.image('icon-boy', 'assets/icons/boy.png');
        this.load.image('icon-purple-girl', 'assets/icons/girl_purple.png');
        this.load.image('icon-yellow-boy', 'assets/icons/boy_yellow.png');
        this.load.image('icon-bunny', 'assets/icons/bunny.png');
        this.load.image('icon-unicorn', 'assets/icons/unicorn.png');
        this.load.image('icon-dragon', 'assets/icons/dragon.png');
        this.load.image('icon-settings', 'assets/icons/config.png');
        this.load.image('icon-view', 'assets/icons/arrow_right.png');
        this.load.image('icon-edit', 'assets/icons/arrow_left.png');
        
        // Dialog assets
        this.load.image('clear-game-image', 'assets/icons/clear_game.png');
        this.load.image('load-world-image', 'assets/icons/load_world.png');
        this.load.image('save-dialog-image', 'assets/icons/save_dialog.png');
        this.load.image('girl-boy-name', 'assets/icons/girl_boy_name.png');
        this.load.image('icon-cancel', 'assets/icons/cancel.png');
        this.load.image('icon-bin', 'assets/icons/bin_basic.png');
        this.load.image('icon-tick', 'assets/icons/tick.png');
        
        // New icons - load with error handling
        this.load.on('loaderror', (file) => {
            console.log(`[GameScene] Asset not found: ${file.key}, will use placeholder`);
        });
        
        this.load.image('icon-flower', 'assets/icons/flower.png');
        this.load.image('icon-bush-pink-flower', 'assets/icons/bush_pink_flower.png');
        this.load.image('icon-palm-tree', 'assets/icons/palm_trees.png');
        this.load.image('icon-tree', 'assets/icons/pink_tree.png');
        this.load.image('icon-bush-cat', 'assets/icons/bush_cat.png');
        
        // World assets (for View Mode) - top-down/isometric style
        // These will use placeholders for now but can be replaced with real world sprites
        //this.load.image('world-grass-tile', 'assets/world/grass_tile.png');
        this.load.image('world-girl', 'assets/icons/blonde_girl.png');
        this.load.image('world-boy', 'assets/icons/boy.png');
        this.load.image('world-purple-girl', 'assets/icons/girl_purple.png');
        this.load.image('world-yellow-boy', 'assets/icons/boy_yellow.png');
        this.load.image('world-bunny', 'assets/icons/bunny.png');
        this.load.image('world-unicorn', 'assets/icons/unicorn.png');
        this.load.image('world-dragon', 'assets/icons/dragon.png');
        this.load.image('world-flower', 'assets/icons/flower.png');
        this.load.image('world-bush-pink-flower', 'assets/icons/bush_pink_flower.png');
        this.load.image('world-palm-tree', 'assets/icons/palm_trees.png');
        this.load.image('world-tree', 'assets/icons/pink_tree.png');
        this.load.image('world-bush-cat', 'assets/icons/bush_cat.png');

        console.log('[GameScene] Loading assets...');
    }

    create() {
        console.log('[GameScene] Initializing game...');

        // Create placeholder icons for missing assets
        this.createPlaceholderIcons();

        // Initialize or restore grid
        if (this.restoredGrid) {
            // Restore grid from View mode (preserve placed elements)
            console.log('[GameScene] Restoring grid from View mode');
            this.grid = this.restoredGrid;
            this.restoredGrid = null; // Clear after restoring
            // Create snapshot if it doesn't exist yet
            if (!this.savedGridSnapshot) {
                this.savedGridSnapshot = JSON.parse(JSON.stringify(this.grid));
            }
        } else {
            // Create new empty grid
            console.log('[GameScene] Creating new grid');
            this.initializeGrid();
        }

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

        // Mode indicator removed - not needed as View/Edit button shows mode
        
        // Create header action buttons (New, Save, Load)
        this.createHeaderActionButtons();
        
        // Create world name field
        this.createWorldNameField();

        // Create toolbar
        this.toolbar = new Toolbar(this);
        
        // Create footer text
        this.createFooterText();
        
        // Listen for Phaser scale resize events to rebuild toolbar on mobile/desktop switch
        this.scale.on('resize', (gameSize) => {
            // Delay slightly to ensure DOM updates are complete
            this.time.delayedCall(200, () => {
                if (this.toolbar && this.toolbar.refreshResponsiveLayout) {
                    this.toolbar.refreshResponsiveLayout();
                }
                // Reposition View button after toolbar rebuild
                this.positionPlayButton();
            });
        });
        
        // Position view button at top right
        this.positionPlayButton();

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

        // Warn about unsaved changes before closing/refreshing tab
        this.beforeUnloadHandler = (event) => {
            if (this.hasUnsavedChanges()) {
                event.preventDefault();
                event.returnValue = ''; // Required for Chrome
            }
        };
        window.addEventListener('beforeunload', this.beforeUnloadHandler);

        console.log('[GameScene] Game ready!');
    }

    createPlaceholderIcons() {
        // Create emoji/text-based placeholders for missing toolbar icons
        const placeholders = [
            { key: 'icon-boy', emoji: '👦', color: '#87CEEB' },
            { key: 'icon-flower', emoji: '🌸', color: '#FF69B4' },
            { key: 'icon-bush-pink-flower', emoji: '🌿', color: '#FFB6C1' },
            { key: 'icon-palm-tree', emoji: '🌴', color: '#4CAF50' },
            { key: 'icon-tree', emoji: '🌳', color: '#228B22' },
            { key: 'icon-unicorn', emoji: '🦄', color: '#E0B0FF' },
            { key: 'icon-bush-cat', emoji: '🦌', color: '#8B4513' }
        ];
        
        // Create world sprite placeholders for View Mode (top-down style)
        const worldPlaceholders = [
            { key: 'world-grass-tile', pattern: 'grass', color: '#7CB342' },
            { key: 'world-boy', emoji: '👦', color: '#87CEEB', topDown: true },
            { key: 'world-bunny', emoji: '🐰', color: '#E0E0E0', topDown: true },
            { key: 'world-unicorn', emoji: '🦄', color: '#E1BEE7', topDown: true },
            { key: 'world-flower', emoji: '🌺', color: '#FF69B4', topDown: true },
            { key: 'world-bush-pink-flower', emoji: '🌿', color: '#FFB6C1', topDown: true },
            { key: 'world-palm-tree', emoji: '🌴', color: '#4CAF50', topDown: true },
            { key: 'world-tree', emoji: '🌲', color: '#2E7D32', topDown: true },
            { key: 'world-bush-cat', emoji: '🦌', color: '#8B4513', topDown: true }
        ];

        // Create toolbar icon placeholders
        placeholders.forEach(({ key, emoji, color }) => {
            if (this.textures.exists(key)) {
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');

            // Background circle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(64, 64, 60, 0, Math.PI * 2);
            ctx.fill();

            // Emoji
            ctx.font = '64px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, 64, 64);

            this.textures.addCanvas(key, canvas);
        });
        
        // Create world sprite placeholders for View Mode
        worldPlaceholders.forEach(({ key, emoji, pattern, color, topDown }) => {
            if (this.textures.exists(key)) {
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');

            if (pattern === 'grass') {
                // Create grass tile pattern
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, 128, 128);
                
                // Add some texture variation
                ctx.fillStyle = '#558B2F';
                for (let i = 0; i < 30; i++) {
                    const x = Math.random() * 128;
                    const y = Math.random() * 128;
                    const size = Math.random() * 8 + 2;
                    ctx.fillRect(x, y, size, size * 0.5);
                }
            } else {
                // Create world object sprite with top-down feel
                // Ellipse for top-down perspective (slightly flattened)
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.ellipse(64, 64, 50, 40, 0, 0, Math.PI * 2);
                ctx.fill();

                // Emoji text
                ctx.font = 'bold 72px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(emoji, 64, 64);
            }

            this.textures.addCanvas(key, canvas);
        });
    }

    initializeGrid() {
        // Create 2D array for grid
        this.grid = [];
        const rows = this.getGridRows();
        const cols = this.getGridCols();
        for (let row = 0; row < rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < cols; col++) {
                this.grid[row][col] = BLOCK_TYPES.EMPTY;
            }
        }
        // Store snapshot for change detection
        this.savedGridSnapshot = JSON.parse(JSON.stringify(this.grid));
    }

    buildTitleText(name) {
        // Special case for "Bunnies" - no apostrophe needed
        if (name === 'Bunnies') {
            return 'Bunnies World';
        }
        
        // Handle possessive apostrophe correctly
        if (name.endsWith('s') || name.endsWith('S')) {
            return `${name}' World`;
        } else {
            return `${name}'s World`;
        }
    }

    createTitle() {
        const childName = getChildName();
        const title = this.buildTitleText(childName);
        
        const isMobile = window.innerWidth <= 600;
        const isPortrait = isMobilePortrait();
        
        // Portrait mode: center title on first line (Y=24)
        // Other modes: left-align on single line
        let titleX, titleY, maxWidth, originX;
        
        if (isPortrait) {
            titleX = this.getGameWidth() / 2;
            titleY = 22; // Higher position with more breathing room below
            maxWidth = this.getGameWidth() - 40; // Leave margins
            originX = 0.5; // Centered
        } else {
            titleX = isMobile ? 20 : 25;
            titleY = 24;
            maxWidth = 230;
            originX = 0; // Left-aligned
        }
        
        this.titleText = this.add.text(titleX, titleY, title, {
            fontSize: '28px',
            fontFamily: '"Fredoka", "Comic Sans MS", cursive, sans-serif',
            fontStyle: 'bold',
            color: '#FF69B4',
            stroke: '#FFFFFF',
            strokeThickness: 4,
            shadow: {
                offsetX: 1,
                offsetY: 2,
                color: '#C46BA0',
                blur: 0,
                fill: true
            },
            wordWrap: { width: maxWidth, useAdvancedWrap: true }
        });
        this.titleText.setOrigin(originX, 0.5);
        this.titleText.setDepth(1000);
        
        // Fit title text to prevent overlap with header buttons
        this.fitTitleText();
    }

    createSettingsButton() {
        // Create cog button using config icon image
        this.settingsButton = this.add.image(0, 32, 'icon-settings');
        
        // Calculate and store aspect ratio once
        const iconAspectRatio = this.settingsButton.width / this.settingsButton.height;
        this.settingsButtonAspectRatio = iconAspectRatio;
        
        // Size it to 48px height preserving aspect ratio (consistent with other header icons)
        const targetHeight = 48;
        this.settingsButton.setDisplaySize(targetHeight * this.settingsButtonAspectRatio, targetHeight);
        this.settingsButton.setOrigin(0.5);
        this.settingsButton.setInteractive({ useHandCursor: true });
        this.settingsButton.setDepth(1000);
        
        // Position button after Load button (will be positioned in createHeaderActionButtons)
        // No need to call positionSettingsButton here anymore
        
        // Create tooltip for config button
        const tooltipStyle = {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#000000',
            backgroundColor: '#FFB6C1',
            padding: { x: 6, y: 4 }
        };
        this.settingsTooltip = this.add.text(0, 0, 'Change Name', tooltipStyle);
        this.settingsTooltip.setOrigin(0.5, 0);
        this.settingsTooltip.setVisible(false);
        this.settingsTooltip.setDepth(2000);
        
        // Add click handler
        this.settingsButton.on('pointerdown', () => {
            this.settingsTooltip.setVisible(false);
            this.openChildNameDialog();
        });
        
        // Add hover effects with tooltip
        this.settingsButton.on('pointerover', () => {
            const hoverHeight = 50;
            this.settingsButton.setDisplaySize(hoverHeight * this.settingsButtonAspectRatio, hoverHeight);
            // Position tooltip below button
            this.settingsTooltip.setPosition(this.settingsButton.x, this.settingsButton.y + 35);
            this.settingsTooltip.setVisible(true);
        });
        
        this.settingsButton.on('pointerout', () => {
            const normalHeight = 48;
            this.settingsButton.setDisplaySize(normalHeight * this.settingsButtonAspectRatio, normalHeight);
            this.settingsTooltip.setVisible(false);
        });
    }

    positionSettingsButton() {
        // Settings button is now positioned in createHeaderActionButtons
        // This method is kept for compatibility but does nothing
    }

    positionPlayButton() {
        if (this.toolbar && this.toolbar.modeToggleButton) {
            const button = this.toolbar.modeToggleButton;
            const isPortrait = isMobilePortrait();
            const iconSize = isPortrait ? 50 : 52;

            // Position View button after game name input
            const isMobile = window.innerWidth <= 600;
            
            if (isPortrait) {
                // Portrait: wider input, positioned after Save button on line 2
                const inputWidth = 115;
                const gapAfterSave = 8;
                const gapBeforePlay = 24; // Increased gap for clearer separation
                const inputX = this.saveButtonX + 21 + gapAfterSave; // 21 = half of 42px button
                const playX = inputX + inputWidth + gapBeforePlay + (iconSize / 2);
                button.x = playX;
                button.y = 72; // Match updated button row position
            } else {
                // Non-portrait original logic
                const inputWidth = isMobile ? 150 : 160;
                const gapAfterSave = isMobile ? 8 : 12;
                const gapBeforePlay = isMobile ? 32 : 2;
                const inputX = this.saveButtonX + 48 + gapAfterSave;
                const playX = inputX + inputWidth + gapBeforePlay + (iconSize / 2);
                const maxX = GAME_WIDTH - (iconSize / 2) - 10;
                button.x = Math.min(playX, maxX);
                button.y = 32;
            }

            this.positionWorldNameField();
        }
    }
    
    positionWorldNameField() {
        // Phaser-based input repositions itself via container
        if (this.nameInputContainer) {
            const isPortrait = isMobilePortrait();
            
            let inputX, inputY;
            
            if (isPortrait) {
                const gapAfterSave = 8;
                inputX = this.saveButtonX + 21 + gapAfterSave;
                inputY = 58;
            } else {
                const isMobile = window.innerWidth <= 600;
                const gapAfterSave = isMobile ? 8 : 12;
                inputX = this.saveButtonX + 24 + gapAfterSave;
                inputY = 18;
            }
            
            this.nameInputContainer.setPosition(inputX, inputY);
        }
    }

    createHeaderActionButtons() {
        const isMobile = window.innerWidth <= 600;
        const isPortrait = isMobilePortrait();
        
        // Portrait mode: left-align buttons on second line (Y=72) to make room for input & View arrow
        // Other modes: single line at Y=32
        let buttonY, iconSize, spacing, buttonX;
        
        if (isPortrait) {
            buttonY = 72; // Second line in 105px header (more space from title)
            iconSize = 42; // Slightly smaller for portrait
            spacing = 5;
            // Left-align buttons starting at X=10 to make room for input and View arrow
            buttonX = 10 + (iconSize / 2);
        } else {
            buttonY = 32;
            iconSize = isMobile ? 45 : 52;
            spacing = isMobile ? 6 : 8;
            buttonX = isMobile ? 295 : 275;
        }
        
        // Tooltip style for consistent light pink tooltips
        const tooltipStyle = {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#000000',
            backgroundColor: '#FFB6C1',
            padding: { x: 6, y: 4 }
        };
        
        // Config/Settings button (first)
        if (this.settingsButton) {
            this.settingsButton.x = buttonX;
            this.settingsButton.y = buttonY;
            // Scale settings button consistently with mobile scaling
            const targetHeight = iconSize * (isMobile ? 1.18 : 1);
            this.settingsButton.setDisplaySize(targetHeight * this.settingsButtonAspectRatio, targetHeight);
        }
        
        buttonX += iconSize + spacing;
        
        // New button (second)
        const newButton = this.add.container(buttonX, buttonY);
        const newIcon = this.add.image(0, 0, 'icon-new');
        newIcon.setOrigin(0.5);
        const newScale = ((iconSize + 4) * (isMobile ? 1.18 : 1)) / Math.max(newIcon.width, newIcon.height);
        newIcon.setScale(newScale);
        newIcon.setInteractive({ useHandCursor: true });
        newIcon.on('pointerdown', () => this.createNewWorld());
        newButton.add([newIcon]);
        newButton.setDepth(1000);
        
        // New button tooltip
        const newTooltip = this.add.text(0, 35, 'New', tooltipStyle);
        newTooltip.setOrigin(0.5, 0);
        newTooltip.setVisible(false);
        newTooltip.setDepth(2000);
        newButton.add([newTooltip]);
        newIcon.on('pointerover', () => newTooltip.setVisible(true));
        newIcon.on('pointerout', () => newTooltip.setVisible(false));
        
        buttonX += iconSize + spacing;
        
        // Load button (third)
        const loadButton = this.add.container(buttonX, buttonY);
        const loadIcon = this.add.image(0, 0, 'icon-load');
        loadIcon.setOrigin(0.5);
        const loadScale = (iconSize * (isMobile ? 1.18 : 1)) / Math.max(loadIcon.width, loadIcon.height);
        loadIcon.setScale(loadScale);
        loadIcon.setInteractive({ useHandCursor: true });
        loadIcon.on('pointerdown', () => this.loadWorld());
        loadButton.add([loadIcon]);
        loadButton.setDepth(1000);
        
        // Load button tooltip
        const loadTooltip = this.add.text(0, 35, 'Load', tooltipStyle);
        loadTooltip.setOrigin(0.5, 0);
        loadTooltip.setVisible(false);
        loadTooltip.setDepth(2000);
        loadButton.add([loadTooltip]);
        loadIcon.on('pointerover', () => loadTooltip.setVisible(true));
        loadIcon.on('pointerout', () => loadTooltip.setVisible(false));
        
        buttonX += iconSize + spacing;
        
        // Save button (fourth)
        const saveButton = this.add.container(buttonX, buttonY);
        const saveIcon = this.add.image(0, 0, 'icon-save');
        saveIcon.setOrigin(0.5);
        const saveScale = (iconSize * (isMobile ? 1.18 : 1)) / Math.max(saveIcon.width, saveIcon.height);
        saveIcon.setScale(saveScale);
        saveIcon.setInteractive({ useHandCursor: true });
        saveIcon.on('pointerdown', () => this.saveWorld());
        saveButton.add([saveIcon]);
        saveButton.setDepth(1000);
        
        // Save button tooltip
        const saveTooltip = this.add.text(0, 35, 'Save', tooltipStyle);
        saveTooltip.setOrigin(0.5, 0);
        saveTooltip.setVisible(false);
        saveTooltip.setDepth(2000);
        saveButton.add([saveTooltip]);
        saveIcon.on('pointerover', () => saveTooltip.setVisible(true));
        saveIcon.on('pointerout', () => saveTooltip.setVisible(false));
        
        // Store Save button X position for positioning game name input
        this.saveButtonX = buttonX;
    }

    createWorldNameField() {
        // Create Phaser-based fake input (avoid iPhone Safari zoom)
        const isPortrait = isMobilePortrait();
        
        let inputWidth, inputX, inputY, inputHeight, fontSize;
        
        if (isPortrait) {
            inputWidth = 115;
            const gapAfterSave = 8;
            inputX = this.saveButtonX + 21 + gapAfterSave;
            inputY = 58;
            inputHeight = 28;
            fontSize = 12;
        } else {
            const isMobile = window.innerWidth <= 600;
            inputWidth = isMobile ? 150 : 160;
            const gapAfterSave = isMobile ? 8 : 12;
            inputX = this.saveButtonX + 24 + gapAfterSave;
            inputY = 18;
            inputHeight = 28;
            fontSize = 14;
        }
        
        // Create container
        this.nameInputContainer = this.add.container(inputX, inputY);
        this.nameInputContainer.setDepth(1000);
        
        // Background rectangle
        this.nameInputBackground = this.add.rectangle(0, 0, inputWidth, inputHeight, 0xFFFFFF);
        this.nameInputBackground.setOrigin(0, 0);
        this.nameInputBackground.setStrokeStyle(2, 0x333333);
        this.nameInputBackground.setInteractive({ useHandCursor: true });
        
        // Text display
        this.nameInputText = this.add.text(8, inputHeight / 2, '', {
            fontSize: fontSize + 'px',
            fontFamily: 'Arial',
            color: '#000000'
        });
        this.nameInputText.setOrigin(0, 0.5);
        
        // Cursor (blinking line)
        this.nameInputCursor = this.add.rectangle(8, inputHeight / 2 - fontSize / 2, 1, fontSize, 0x000000);
        this.nameInputCursor.setOrigin(0, 0);
        this.nameInputCursor.setVisible(false);
        
        // Add to container
        this.nameInputContainer.add([this.nameInputBackground, this.nameInputText, this.nameInputCursor]);
        
        // Click to activate
        this.nameInputBackground.on('pointerdown', () => {
            this.activateNameInput();
        });
        
        // Cursor blink animation
        this.time.addEvent({
            delay: 500,
            callback: () => {
                if (this.nameInputActive && this.nameInputCursor) {
                    this.nameInputCursor.setVisible(!this.nameInputCursor.visible);
                }
            },
            loop: true
        });
        
        // Keyboard input
        this.input.keyboard.on('keydown', (event) => {
            if (!this.nameInputActive) return;
            
            const key = event.key;
            
            // Prevent default for keys we handle
            if (key === 'Backspace' || key === 'Enter' || key === 'Escape' || key === ' ' || (key.length === 1 && /[a-zA-Z0-9]/.test(key))) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            if (key === 'Backspace') {
                if (this.nameInputValue.length > 0) {
                    this.nameInputValue = this.nameInputValue.slice(0, -1);
                    this.updateNameInputDisplay();
                }
            } else if (key === 'Enter' || key === 'Escape') {
                this.deactivateNameInput();
            } else if (key.length === 1 && /[a-zA-Z0-9]/.test(key)) {
                if (this.nameInputValue.length < this.nameInputMaxLength) {
                    this.nameInputValue += key;
                    this.updateNameInputDisplay();
                }
            } else if (key === ' ') {
                const canAddSpace =
                    this.nameInputValue.trim() !== '' &&
                    !this.nameInputValue.endsWith(' ') &&
                    this.nameInputValue.length < this.nameInputMaxLength;

                if (canAddSpace) {
                    this.nameInputValue += ' ';
                    this.updateNameInputDisplay();
                }
            }
        });
        
        // Click away to deactivate
        this.input.on('pointerdown', (pointer) => {
            if (this.nameInputActive) {
                const bounds = this.nameInputBackground.getBounds();
                if (!bounds.contains(pointer.x, pointer.y)) {
                    this.deactivateNameInput();
                }
            }
        });
    }
    
    createFooterText() {
        // Add small footer text below toolbar (not in grid area)
        const footerText = '© 2026 Dee Bath. Thanks to John Sherwood for your encouragement.';
        const gameHeight = this.getGameHeight();
        const gameWidth = this.getGameWidth();
        // Position near bottom, below toolbar
        const isMobile = isMobilePortrait();
        const footerY = isMobile ? gameHeight - 8 : gameHeight - 2;
        
        this.footerLabel = this.add.text(gameWidth / 2, footerY, footerText, {
            fontSize: '9px',
            fontFamily: 'Arial',
            color: '#000000',
            alpha: 0.6
        });
        this.footerLabel.setOrigin(0.5, 1); // Center horizontally, align to bottom
        this.footerLabel.setDepth(100); // Low depth so it stays behind most UI
    }
    
    activateNameInput() {
        this.nameInputActive = true;
        this.isTextInputOpen = true; // Prevent game controls from interfering
        this.nameInputPreviousValue = this.nameInputValue; // Store previous value for revert
        this.nameInputCursor.setVisible(true);
        this.nameInputBackground.setStrokeStyle(2, 0x4CAF50); // Green border when active
        this.updateNameInputDisplay();
    }
    
    deactivateNameInput() {
        this.nameInputActive = false;
        this.isTextInputOpen = false; // Re-enable game controls
        this.nameInputCursor.setVisible(false);
        this.nameInputBackground.setStrokeStyle(2, 0x333333); // Gray border when inactive
        
        // Trim spaces and revert to previous value if blank
        const trimmed = this.nameInputValue.trim();
        if (trimmed === '') {
            this.nameInputValue = this.nameInputPreviousValue;
        } else {
            this.nameInputValue = trimmed;
        }
        this.updateNameInputDisplay();
    }
    
    updateNameInputDisplay() {
        if (!this.nameInputText) return;
        
        const displayText = this.nameInputValue || '';
        this.nameInputText.setText(displayText);
        
        // Position cursor after text
        const textWidth = this.nameInputText.width;
        this.nameInputCursor.setX(8 + textWidth);
    }

    getWorldNameInputValue() {
        return (this.nameInputValue || '').trim();
    }

    setWorldNameInputValue(name) {
        this.nameInputValue = name || '';
        this.updateNameInputDisplay();
    }

    getSaveName() {
        // Priority: 1) field value if non-blank, 2) currentWorldName, 3) generate default
        const fieldValue = this.getWorldNameInputValue();
        if (fieldValue) {
            return fieldValue;
        }
        if (this.currentWorldName) {
            return this.currentWorldName;
        }
        return generateDefaultWorldName();
    }

    openChildNameDialog() {
        const currentName = getChildName();
        
        this.modal.showInputDialog(
            'Name',
            'Enter name',
            currentName,
            (name) => {
                const savedName = saveChildName(name);
                
                // Update title immediately
                this.titleText.setText(this.buildTitleText(savedName));
                
                // Fit title text to prevent overlap with header buttons
                this.fitTitleText();
                
                // Reposition View button and world name field after title text changes
                this.positionPlayButton();
                
                // Show confirmation toast
                this.modal.showToast(`Name updated to ${savedName}!`);
            }
        );
    }
    
    positionModeIndicator() {
        // Mode indicator removed - no longer needed
        // This function kept for compatibility but does nothing
    }

    fitTitleText() {
        if (!this.titleText) {
            return;
        }

        const maxWidth = 230;
        const maxHeight = 50; // Allow up to 2 lines
        let fontSize = 28;

        // Set word wrap width
        this.titleText.setStyle({
            wordWrap: { width: maxWidth, useAdvancedWrap: true }
        });
        
        this.titleText.setFontSize(fontSize);

        // If wrapped text is too tall, reduce font size
        while (this.titleText.height > maxHeight && fontSize > 18) {
            fontSize -= 1;
            this.titleText.setFontSize(fontSize);
        }
    }

    /**
     * Hide or show all Build Mode visuals
     * Used when transitioning to/from View Mode to prevent both scenes rendering at once
     */
    setBuildViewVisible(visible) {
        console.log(`[GameScene] Setting Build view visibility: ${visible}`);
        
        // Reset drag state when changing modes
        this.isDragging = false;
        this.lastPaintedCell = null;
        
        // Hide/show header elements
        if (this.titleText) this.titleText.setVisible(visible);
        if (this.settingsButton) this.settingsButton.setVisible(visible);
        
        // Hide/show world name input field (Phaser-based)
        if (this.nameInputContainer) {
            this.nameInputContainer.setVisible(visible);
            if (!visible && this.nameInputActive) {
                this.deactivateNameInput(); // Deactivate if switching away
            }
        }
        
        // Hide/show grid and hover indicator
        if (this.gridGraphics) this.gridGraphics.setVisible(visible);
        if (this.hoverRect) this.hoverRect.setVisible(visible);
        
        // Never show player sprite in Edit Mode - movement tracking only
        // Player icon is not rendered; only placed objects from toolbar are shown
        if (this.player) this.player.setVisible(false);
        
        // Hide/show toolbar
        if (this.toolbar) this.toolbar.setVisible(visible);
        
        // Hide/show all placed tiles/objects in the grid
        Object.values(this.tileGraphics).forEach(graphic => {
            if (graphic) graphic.setVisible(visible);
        });
    }

    toggleMode() {
        // Hide Build scene visuals before launching View Mode
        console.log('[GameScene] Launching Isometric View Mode');
        this.setBuildViewVisible(false);
        
        // Pass current grid to View mode
        this.scene.launch('IsometricPlayScene', {
            grid: this.grid,
            childName: getChildName()
        });
        
        // Pause this scene (keeps it alive in background with state preserved)
        this.scene.pause();
    }

    findSafeSpawnPosition() {
        const gridSize = this.getGridSize();
        const gridCols = this.getGridCols();
        const gridRows = this.getGridRows();
        const headerHeight = this.getHeaderHeight();
        const gridLeftOffset = this.getGridLeftOffset();

        // First check if current player position is valid
        const currentGridX = Math.floor((this.player.x - gridLeftOffset - gridSize / 2) / gridSize);
        const currentGridY = Math.floor((this.player.y - headerHeight - GRID_TOP_MARGIN - gridSize / 2) / gridSize);
        
        if (currentGridX >= 0 && currentGridX < gridCols && 
            currentGridY >= 0 && currentGridY < gridRows) {
            const currentBlock = this.grid[currentGridY][currentGridX];
            if (!isSolidBlock(currentBlock)) {
                // Current position is safe, keep player there
                return;
            }
        }
        
        // Find first empty/walkable tile
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                const blockType = this.grid[row][col];
                if (!isSolidBlock(blockType)) {
                    // Found a safe spot - place player here
                    this.player.x = gridLeftOffset + col * gridSize + gridSize / 2;
                    this.player.y = headerHeight + GRID_TOP_MARGIN + row * gridSize + gridSize / 2;
                    return;
                }
            }
        }
        
        // If no empty tiles found, place at center (emergency fallback)
        this.player.x = gridLeftOffset + Math.floor(gridCols / 2) * gridSize + gridSize / 2;
        this.player.y = headerHeight + GRID_TOP_MARGIN + Math.floor(gridRows / 2) * gridSize + gridSize / 2;
    }

    getGameMode() {
        return this.gameMode;
    }

    drawGridLines() {
        // Create graphics object for grid
        const graphics = this.add.graphics();

        const gameWidth = this.getGameWidth();
        const gameHeight = this.getGameHeight();
        const headerHeight = this.getHeaderHeight();
        const toolbarHeight = this.getToolbarHeight();
        const playableHeight = this.getPlayableHeight();
        const gridSize = this.getGridSize();
        const gridCols = this.getGridCols();
        const gridRows = this.getGridRows();
        const gridLeftOffset = this.getGridLeftOffset();

        // Calculate toolbar top position based on actual grid bottom for mobile portrait
        let toolbarTop;
        const isPortrait = isMobilePortrait();
        if (isPortrait) {
            const gridTop = headerHeight + GRID_TOP_MARGIN;
            const gridHeight = gridRows * gridSize;
            const gridBottom = gridTop + gridHeight;
            const gapAfterGrid = 8;
            toolbarTop = gridBottom + gapAfterGrid;
        } else {
            toolbarTop = headerHeight + playableHeight;
        }

        // Draw toolbar background
        graphics.fillStyle(0x333333, 0.2);
        graphics.fillRect(0, toolbarTop, gameWidth, toolbarHeight);

        // Draw separator line between playable area and toolbar
        graphics.lineStyle(3, 0x000000, 0.8);
        graphics.lineBetween(0, toolbarTop, gameWidth, toolbarTop);

        // Draw grid lines with 0.5 pixel offset for crisp rendering
        graphics.lineStyle(1, 0x5F8F56, 0.35);

        // Horizontal lines
        for (let row = 0; row <= gridRows; row++) {
            const y = headerHeight + GRID_TOP_MARGIN + row * gridSize + 0.5;
            graphics.lineBetween(gridLeftOffset, y, gridLeftOffset + gridCols * gridSize, y);
        }

        // Vertical lines
        for (let col = 0; col <= gridCols; col++) {
            const x = gridLeftOffset + col * gridSize + 0.5;
            graphics.lineBetween(x, headerHeight + GRID_TOP_MARGIN, x, headerHeight + GRID_TOP_MARGIN + gridRows * gridSize);
        }

        // Set depth so grid lines appear above blocks and player but below UI
        graphics.setDepth(30);

        this.gridGraphics = graphics;
    }

    createPlayer() {
        const gameWidth = this.getGameWidth();
        const headerHeight = this.getHeaderHeight();
        const playableHeight = this.getPlayableHeight();
        const gridSize = this.getGridSize();
        const gridCols = this.getGridCols();
        const gridRows = this.getGridRows();

        // Set physics world bounds to playable area only
        this.physics.world.setBounds(0, headerHeight + GRID_TOP_MARGIN, gameWidth, playableHeight - GRID_TOP_MARGIN);

        // Player starts in the middle of the grid
        const startX = Math.floor(gridCols / 2) * gridSize + gridSize / 2;
        const startY = headerHeight + GRID_TOP_MARGIN + Math.floor(gridRows / 2) * gridSize + gridSize / 2;

        // Create player as girl sprite instead of circle
        this.player = this.add.image(startX, startY, 'icon-girl');
        
        // Scale player to fit nicely in the tile (about 80% of tile size)
        const playerSize = gridSize * 0.8;
        const scale = playerSize / Math.max(this.player.width, this.player.height);
        this.player.setScale(scale);
        
        this.player.setDepth(20);
        this.player.setVisible(false);

        // Add physics
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        
        // Set smaller collision body for better movement feel (responsive to grid size)
        const bodySize = gridSize * 0.6;
        this.player.body.setSize(bodySize, bodySize);
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
            // Only handle clicks in Build mode
            if (this.gameMode === GAME_MODES.BUILD) {
                this.handleGridClick(pointer);
                // Start drag only if click is inside grid and it's a color tool
                if (this.toolbar.getMode() === TOOL_MODES.PLACE && isColorBlock(this.toolbar.getSelectedTool())) {
                    // Check if pointer is inside playable grid bounds
                    if (this.isPointerInGrid(pointer)) {
                        this.isDragging = true;
                        const gridSize = this.getGridSize();
                        const headerHeight = this.getHeaderHeight();
                        const gridLeftOffset = this.getGridLeftOffset();
                        const gridX = Math.floor((pointer.x - gridLeftOffset) / gridSize);
                        const gridY = Math.floor((pointer.y - headerHeight - GRID_TOP_MARGIN) / gridSize);
                        this.lastPaintedCell = `${gridX}_${gridY}`;
                    }
                }
            }
        });

        // Mouse up to stop drag painting
        this.input.on('pointerup', (pointer) => {
            this.isDragging = false;
            this.lastPaintedCell = null;
        });

        // Pointer out/leave to stop drag painting when pointer leaves canvas
        this.input.on('pointerout', (pointer) => {
            this.isDragging = false;
            this.lastPaintedCell = null;
        });

        this.input.on('pointerleave', (pointer) => {
            this.isDragging = false;
            this.lastPaintedCell = null;
        });

        // Mouse move for hover effect and drag painting
        this.input.on('pointermove', (pointer) => {
            // Only show hover and handle drag painting in Build mode
            if (this.gameMode === GAME_MODES.BUILD) {
                this.handleGridHover(pointer);
                
                // Handle drag painting for colors only
                if (this.isDragging && this.toolbar.getMode() === TOOL_MODES.PLACE) {
                    const selectedTool = this.toolbar.getSelectedTool();
                    if (isColorBlock(selectedTool)) {
                        this.handleDragPaint(pointer);
                    }
                }
            } else {
                // Hide hover rectangle in Explore mode
                this.hoverRect.setVisible(false);
            }
        });

        // Create hover rectangle once (size set dynamically based on grid)
        const gridSize = this.getGridSize();
        this.hoverRect = this.add.rectangle(0, 0, gridSize, gridSize);
        this.hoverRect.setStrokeStyle(2, 0xffffff, 0.8);
        this.hoverRect.setFillStyle(0xffffff, 0.1);
        this.hoverRect.setDepth(50);
        this.hoverRect.setVisible(false);
    }

    isPointerInGrid(pointer) {
        const gridSize = this.getGridSize();
        const gridCols = this.getGridCols();
        const gridRows = this.getGridRows();
        const headerHeight = this.getHeaderHeight();
        const gridLeftOffset = this.getGridLeftOffset();

        // Check if pointer is within actual grid bounds
        const gridTop = headerHeight + GRID_TOP_MARGIN;
        const gridBottom = gridTop + (gridRows * gridSize);
        
        if (pointer.y < gridTop || pointer.y >= gridBottom) {
            return false;
        }

        const gridX = Math.floor((pointer.x - gridLeftOffset) / gridSize);
        const gridY = Math.floor((pointer.y - headerHeight - GRID_TOP_MARGIN) / gridSize);

        return gridX >= 0 && gridX < gridCols && gridY >= 0 && gridY < gridRows;
    }

    handleDragPaint(pointer) {
        const gridSize = this.getGridSize();
        const gridCols = this.getGridCols();
        const gridRows = this.getGridRows();
        const headerHeight = this.getHeaderHeight();
        const gridLeftOffset = this.getGridLeftOffset();

        // Ignore if outside actual grid area
        const gridTop = headerHeight + GRID_TOP_MARGIN;
        const gridBottom = gridTop + (gridRows * gridSize);
        
        if (pointer.y < gridTop || pointer.y >= gridBottom) {
            return;
        }

        const gridX = Math.floor((pointer.x - gridLeftOffset) / gridSize);
        const gridY = Math.floor((pointer.y - headerHeight - GRID_TOP_MARGIN) / gridSize);

        // Check if within grid bounds
        if (gridX < 0 || gridX >= gridCols || gridY < 0 || gridY >= gridRows) {
            return;
        }

        // Check if we've already painted this cell in this drag
        const cellKey = `${gridX}_${gridY}`;
        if (cellKey === this.lastPaintedCell) {
            return;
        }

        // In Edit Mode, allow drag painting on any tile
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

        const gridSize = this.getGridSize();
        const gridCols = this.getGridCols();
        const gridRows = this.getGridRows();
        const headerHeight = this.getHeaderHeight();
        const gridLeftOffset = this.getGridLeftOffset();

        // Ignore clicks outside the actual grid area
        const gridTop = headerHeight + GRID_TOP_MARGIN;
        const gridBottom = gridTop + (gridRows * gridSize);
        
        if (pointer.y < gridTop || pointer.y >= gridBottom) {
            return;
        }

        const gridX = Math.floor((pointer.x - gridLeftOffset) / gridSize);
        const gridY = Math.floor((pointer.y - headerHeight - GRID_TOP_MARGIN) / gridSize);

        // Check if click is within grid bounds
        if (gridX < 0 || gridX >= gridCols || gridY < 0 || gridY >= gridRows) {
            return;
        }

        // In Edit Mode, player is invisible and position doesn't matter
        // Allow placement on any empty tile
        if (this.toolbar.getMode() === TOOL_MODES.ERASE) {
            // Erase mode
            this.grid[gridY][gridX] = BLOCK_TYPES.EMPTY;
            this.renderTile(gridX, gridY);
        } else {
            // Place mode
            const selectedTool = this.toolbar.getSelectedTool();
            this.grid[gridY][gridX] = selectedTool;
            this.renderTile(gridX, gridY);
        }
    }

    handleGridHover(pointer) {
        const gridSize = this.getGridSize();
        const gridCols = this.getGridCols();
        const gridRows = this.getGridRows();
        const headerHeight = this.getHeaderHeight();
        const gridLeftOffset = this.getGridLeftOffset();

        // Ignore hover outside the actual grid area
        const gridTop = headerHeight + GRID_TOP_MARGIN;
        const gridBottom = gridTop + (gridRows * gridSize);
        
        if (pointer.y < gridTop || pointer.y >= gridBottom) {
            this.hoverRect.setVisible(false);
            return;
        }

        const gridX = Math.floor((pointer.x - gridLeftOffset) / gridSize);
        const gridY = Math.floor((pointer.y - headerHeight - GRID_TOP_MARGIN) / gridSize);

        // Check if hover is within grid bounds
        if (gridX >= 0 && gridX < gridCols && gridY >= 0 && gridY < gridRows) {
            const x = gridLeftOffset + gridX * gridSize + gridSize / 2;
            const y = headerHeight + GRID_TOP_MARGIN + gridY * gridSize + gridSize / 2;
            
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

        const gridRows = this.getGridRows();
        const gridCols = this.getGridCols();

        // Render all tiles in Build Mode (flat editor style)
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                this.renderTile(col, row);
            }
        }
    }

    /**
     * Add animated sparkle particles to a container for special block effects
     * Creates a twinkling star-field effect with layered sparkles
     * @param {Phaser.GameObjects.Container} container - The container to add sparkles to
     * @param {number} scale - Scale factor for toolbar vs world grid (default 1.0)
     */
    addSparkleEffect(container, scale = 1.0) {
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
                        ease: 'Cubic.easeInOut', // Smooth pop effect
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
            return; // Nothing to render in Build Mode
        }

        const gridSize = this.getGridSize();
        const gridLeftOffset = this.getGridLeftOffset();
        const headerHeight = this.getHeaderHeight();

        const x = gridLeftOffset + col * gridSize + gridSize / 2;
        const y = headerHeight + GRID_TOP_MARGIN + row * gridSize + gridSize / 2;
        const color = BLOCK_COLORS[blockType];

        // Check if this is an image-based object
        const imageObjects = [
            BLOCK_TYPES.BUNNY, 
            BLOCK_TYPES.GIRL,
            BLOCK_TYPES.BOY,
            BLOCK_TYPES.PURPLE_GIRL,
            BLOCK_TYPES.YELLOW_BOY,
            BLOCK_TYPES.UNICORN,
            BLOCK_TYPES.DRAGON,
            BLOCK_TYPES.FLOWER,
            BLOCK_TYPES.BUSH_PINK_FLOWER,
            BLOCK_TYPES.PALM_TREE, 
            BLOCK_TYPES.TREE, 
            BLOCK_TYPES.BUSH_CAT
        ];

        if (imageObjects.includes(blockType)) {
            // Use toolbar icons for Build Mode
            let iconKey = '';
            if (blockType === BLOCK_TYPES.BUNNY) iconKey = 'icon-bunny';
            else if (blockType === BLOCK_TYPES.GIRL) iconKey = 'icon-girl';
            else if (blockType === BLOCK_TYPES.BOY) iconKey = 'icon-boy';
            else if (blockType === BLOCK_TYPES.PURPLE_GIRL) iconKey = 'icon-purple-girl';
            else if (blockType === BLOCK_TYPES.YELLOW_BOY) iconKey = 'icon-yellow-boy';
            else if (blockType === BLOCK_TYPES.UNICORN) iconKey = 'icon-unicorn';
            else if (blockType === BLOCK_TYPES.DRAGON) iconKey = 'icon-dragon';
            else if (blockType === BLOCK_TYPES.FLOWER) iconKey = 'icon-flower';
            else if (blockType === BLOCK_TYPES.BUSH_PINK_FLOWER) iconKey = 'icon-bush-pink-flower';
            else if (blockType === BLOCK_TYPES.PALM_TREE) iconKey = 'icon-palm-tree';
            else if (blockType === BLOCK_TYPES.TREE) iconKey = 'icon-tree';
            else if (blockType === BLOCK_TYPES.BUSH_CAT) iconKey = 'icon-bush-cat';

            // Render object using toolbar icon
            const sprite = this.add.image(x, y, iconKey);
            
            // Standard sizing for Build Mode
            let targetSize = gridSize * 0.9;
            if (blockType === BLOCK_TYPES.PALM_TREE) {
                // Palm trees slightly larger
                targetSize = gridSize * 1.05;
            } else if (blockType === BLOCK_TYPES.UNICORN) {
                // Unicorn larger for better visibility in Edit Mode
                targetSize = gridSize * 1.0;
            } else if (blockType === BLOCK_TYPES.DRAGON) {
                // Dragon same size as unicorn for consistency
                targetSize = gridSize * 1.0;
            }
            const scale = targetSize / Math.max(sprite.width, sprite.height);
            sprite.setScale(scale);
            sprite.setDepth(10);
            
            this.tileGraphics[key] = sprite;
        } else if (hasPattern(blockType)) {
            // Render pattern block (color background + pattern/effect)
            const container = this.add.container(x, y);
            
            // Base colored block
            const block = this.add.rectangle(0, 0, gridSize, gridSize, color);
            block.setDepth(5);
            container.add(block);
            
            // Special handling for GLITTER_PINK - add shimmer effect instead of emoji
            if (blockType === BLOCK_TYPES.GLITTER_PINK) {
                this.addSparkleEffect(container, 1.0);
            } else if (blockType === BLOCK_TYPES.WATER) {
                // Water tile - add animated wave lines
                const waveCount = 3;
                for (let i = 0; i < waveCount; i++) {
                    const wave = this.add.graphics();
                    wave.lineStyle(1.5, 0xFFFFFF, 0.35);
                    
                    // Draw smooth curved wave line using line segments
                    const yOffset = (i - 1) * 12;
                    wave.beginPath();
                    wave.moveTo(-gridSize/2, yOffset);
                    for (let wx = -gridSize/2; wx <= gridSize/2; wx += 2) {
                        const phase = (wx / gridSize) * Math.PI * 2;
                        const wy = yOffset + Math.sin(phase) * 4;
                        wave.lineTo(wx, wy);
                    }
                    wave.strokePath();
                    
                    wave.setDepth(6);
                    container.add(wave);
                    
                    // Animate wave with gentle fade and slight vertical movement
                    this.tweens.add({
                        targets: wave,
                        alpha: { from: 0.35, to: 0.15 },
                        y: { from: 0, to: -3 },
                        duration: 1200 + i * 200,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
                
                // Add subtle shimmer circles
                const shimmer = this.add.graphics();
                shimmer.lineStyle(1, 0xFFFFFF, 0.2);
                shimmer.strokeCircle(-8, -10, 3);
                shimmer.strokeCircle(10, 8, 2.5);
                shimmer.setDepth(6);
                container.add(shimmer);
                
                // Animate shimmer
                this.tweens.add({
                    targets: shimmer,
                    alpha: { from: 0.3, to: 0.1 },
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
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
            // Render regular colored block - flat rendering for Build Mode
            const gridSize = this.getGridSize();
            const block = this.add.rectangle(x, y, gridSize, gridSize, color);
            block.setDepth(5);
            this.tileGraphics[key] = block;
        }
    }
    
    cycleRainbowColors() {
        const gridRows = this.getGridRows();
        const gridCols = this.getGridCols();
        
        // Cycle through rainbow colors for all rainbow blocks
        this.rainbowIndex = (this.rainbowIndex + 1) % this.rainbowColors.length;
        const newColor = this.rainbowColors[this.rainbowIndex];
        
        // Update all rainbow block tiles
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
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
        // Stop player movement if text input is open or in Build mode
        if (this.isTextInputOpen || this.gameMode === GAME_MODES.BUILD) {
            if (this.player && this.player.body) {
                this.player.body.setVelocity(0);
            }
            return;
        }

        // Handle player movement (only in Explore mode)
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
        const gridSize = this.getGridSize();
        const gridCols = this.getGridCols();
        const gridRows = this.getGridRows();
        const headerHeight = this.getHeaderHeight();
        const gridLeftOffset = this.getGridLeftOffset();

        // Check if position would be inside a solid block
        const gridX = Math.floor((x - gridLeftOffset - gridSize / 2) / gridSize);
        const gridY = Math.floor((y - headerHeight - GRID_TOP_MARGIN - gridSize / 2) / gridSize);

        // Check bounds
        if (gridX < 0 || gridX >= gridCols || gridY < 0 || gridY >= gridRows) {
            return false;
        }

        const blockType = this.grid[gridY][gridX];

        // Use the helper function to check if block is solid
        return isSolidBlock(blockType);
    }

    saveCurrentWorld(onSuccess = null, showToast = true) {
        const worldData = {
            grid: this.grid,
            playerPosition: {
                x: this.player.x,
                y: this.player.y
            }
        };

        // Store the previous name before saving
        const previousWorldName = this.currentWorldName;
        const name = this.getSaveName();

        // Check for name collision with another saved world
        const existingWorld = findWorldByName(name);
        if (existingWorld) {
            // Allow save if this is the currently loaded world (case-insensitive match)
            const isSameWorld = previousWorldName && 
                (previousWorldName.trim().toLowerCase() === name.trim().toLowerCase());
            
            if (!isSameWorld) {
                // Block: trying to use a name that belongs to a different saved world
                this.modal.showToast(`A game named "${existingWorld.name}" already exists.`);
                return;
            }
        }

        const success = saveWorld(name, worldData);

        if (success) {
            // If the name changed (case-insensitive), delete the old one
            if (previousWorldName && previousWorldName.trim().toLowerCase() !== name.trim().toLowerCase()) {
                deleteWorld(previousWorldName);
            }

            this.currentWorldName = name;
            this.setWorldNameInputValue(name);
            this.savedGridSnapshot = JSON.parse(JSON.stringify(this.grid));

            if (showToast) {
                this.modal.showToast(`Saved as "${name}"!`);
            }

            if (onSuccess) {
                onSuccess(name);
            }
        } else {
            this.modal.showToast('Save failed!');
        }
    }

    saveWorld() {
        // Use saveCurrentWorld which will use the field value, currentWorldName, or generate default
        this.saveCurrentWorld();
    }

    loadWorld() {
        // Check if there are unsaved changes
        if (this.hasUnsavedChanges()) {
            this.modal.showConfirmDialog(
                'Unsaved Changes',
                'Do you want to save\nyour changes before loading\nanother world?',
                () => {
                    // Save button clicked - save first, then show load dialog
                    this.saveCurrentWorld(() => {
                        this.showLoadWorldDialog();
                    }, false);
                },
                'Save',
                'Cancel',
                () => {
                    // Cancel button clicked - skip saving, show load dialog
                    this.showLoadWorldDialog();
                },
                'save-dialog-image'
            );
            return;
        }

        // No unsaved changes - show load dialog immediately
        this.showLoadWorldDialog();
    }

    showLoadWorldDialog() {
        const worlds = getAllWorlds();
        
        this.modal.showListDialog(
            'Load World',
            worlds,
            (world) => {
                const worldData = loadWorld(world.name);
                if (worldData) {
                    this.loadWorldData(worldData);
                    this.currentWorldName = world.name; // Track which world is loaded
                    this.setWorldNameInputValue(world.name);
                    this.modal.showToast(`Loaded "${world.name}"!`);
                } else {
                    this.modal.showToast('Load failed!');
                }
            },
            'No saved worlds yet!\n\nStart building and save your creation!'
        );
    }

    loadWorldData(worldData) {
        const gridRows = this.getGridRows();
        const gridCols = this.getGridCols();
        const gridSize = this.getGridSize();
        
        // Trim or pad the loaded grid to match current dimensions
        const loadedGrid = worldData.grid;
        this.grid = [];
        
        for (let row = 0; row < gridRows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < gridCols; col++) {
                // Use loaded data if it exists within bounds, otherwise use EMPTY
                if (loadedGrid[row] && loadedGrid[row][col] !== undefined) {
                    this.grid[row][col] = loadedGrid[row][col];
                } else {
                    this.grid[row][col] = BLOCK_TYPES.EMPTY;
                }
            }
        }
        
        if (worldData.playerPosition) {
            // Ensure player position is within new grid bounds
            const clampedX = Math.min(worldData.playerPosition.x, gridCols * gridSize - gridSize / 2);
            const clampedY = Math.min(worldData.playerPosition.y, gridRows * gridSize - gridSize / 2);
            this.player.x = clampedX;
            this.player.y = clampedY;
        }

        this.renderGrid();
        // Update snapshot after loading
        this.savedGridSnapshot = JSON.parse(JSON.stringify(this.grid));
    }

    createNewWorld() {
        // Check if there are unsaved changes
        if (this.hasUnsavedChanges()) {
            this.modal.showConfirmDialog(
                'Unsaved Changes',
                'Do you want to save\nyour changes?',
                () => {
                    // User clicked Yes - save first, then create new world
                    this.saveWorldThenCreateNew();
                },
                'Yes',
                'No',
                () => {
                    // User clicked No - create new world without saving
                    this.performCreateNewWorld();
                },
                'save-dialog-image'
            );
        } else {
            // No changes, just create new world
            this.performCreateNewWorld();
        }
    }

    hasUnsavedChanges() {
        const gridRows = this.getGridRows();
        const gridCols = this.getGridCols();
        
        // Compare current grid with saved snapshot
        if (!this.savedGridSnapshot) {
            return false; // No snapshot, assume no changes
        }
        
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                if (this.grid[row][col] !== this.savedGridSnapshot[row][col]) {
                    return true;
                }
            }
        }
        return false;
    }

    saveWorldThenCreateNew() {
        // Save current world then create new blank world
        this.saveCurrentWorld((savedName) => {
            this.performCreateNewWorld(`World saved to ${savedName}\nNew world created`);
        }, false);
    }

    performCreateNewWorld(toastMessage = 'New world created!') {
        // Clear the grid and reset
        this.initializeGrid();
        this.renderGrid();
        this.currentWorldName = null; // Reset to no saved world identity
        this.setWorldNameInputValue(''); // Clear the world name field
        this.modal.showToast(toastMessage);
    }

    clearWorld() {
        const gridRows = this.getGridRows();
        const gridCols = this.getGridCols();
        
        this.modal.showClearWorldDialog(() => {
            this.grid = [];
            for (let row = 0; row < gridRows; row++) {
                this.grid[row] = [];
                for (let col = 0; col < gridCols; col++) {
                    this.grid[row][col] = BLOCK_TYPES.EMPTY;
                }
            }

            this.renderGrid();
            this.modal.showToast('World cleared!');
        });
    }
    
    shutdown() {
        // Clean up scale resize listener
        if (this.scale) {
            this.scale.off('resize');
        }
        
        // Clean up toolbar resize listener
        if (this.toolbar && this.toolbar.destroy) {
            this.toolbar.destroy();
        }
        
        // Clean up beforeunload listener
        if (this.beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this.beforeUnloadHandler);
            this.beforeUnloadHandler = null;
        }
        
        // Phaser-based input is automatically destroyed with scene
    }
}
