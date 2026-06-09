import { 
    GRID_SIZE, 
    GRID_COLS, 
    GRID_ROWS,
    MOBILE_PORTRAIT_GRID_SIZE,
    MOBILE_PORTRAIT_GRID_COLS,
    MOBILE_PORTRAIT_GRID_ROWS,
    BLOCK_TYPES, 
    BLOCK_COLORS, 
    PLAYER_SPEED,
    GAME_WIDTH,
    GAME_HEIGHT,
    MOBILE_PORTRAIT_WIDTH,
    MOBILE_PORTRAIT_HEIGHT,
    HEADER_HEIGHT,
    WORLD_SPRITES,
    isSolidBlock,
    isWorldObject,
    hasPattern,
    getPattern,
    isMobilePortrait
} from '../data/constants.js';
import { getChildName, getKeepPeopleOnIsland } from '../utils/storage.js';

// Isometric tile dimensions (base values, may be scaled down to fit)
const BASE_ISO_TILE_WIDTH = 64;
const BASE_ISO_TILE_HEIGHT = 32;

// Layout constants for proper centering and safe margins
const TOP_RESERVED = 85;        // Space for title and mode text
const BOTTOM_RESERVED = 70;     // Space for Edit button
const VERTICAL_PADDING = 10;    // Safety margin top/bottom
const HORIZONTAL_MARGIN = 30;   // Safe left/right padding
const MAX_PLAYABLE_WIDTH = GAME_WIDTH - (HORIZONTAL_MARGIN * 2);

const SHOW_ANIMAL_ZONES = false;

/**
 * Calculate optimal tile size to fit the world on screen
 * Returns adjusted tile dimensions if map is too wide
 */
function calculateOptimalTileSize(gridCols, gridRows, gameWidth) {
    const HORIZONTAL_MARGIN = 30;
    const MAX_PLAYABLE_WIDTH = gameWidth - (HORIZONTAL_MARGIN * 2);
    
    // Calculate required map width with base tile size
    const minIsoX = -(gridRows - 1) * (BASE_ISO_TILE_WIDTH / 2);
    const maxIsoX = (gridCols - 1) * (BASE_ISO_TILE_WIDTH / 2);
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
function calculateIsoWorldOrigin(tileWidth, tileHeight, gridCols, gridRows, gameWidth, gameHeight, isMobile) {
    const TOP_RESERVED = 85;
    const BOTTOM_RESERVED = 70;
    const VERTICAL_PADDING = 10;
    const HORIZONTAL_MARGIN = 30;
    const MAX_PLAYABLE_WIDTH = gameWidth - (HORIZONTAL_MARGIN * 2);
    
    // Calculate isometric map bounds
    const minIsoX = -(gridRows - 1) * (tileWidth / 2);
    const maxIsoX = (gridCols - 1) * (tileWidth / 2);
    const minIsoY = 0;
    const maxIsoY = (gridCols + gridRows - 2) * (tileHeight / 2);
    
    const mapWidth = maxIsoX - minIsoX;
    const mapHeight = maxIsoY - minIsoY;
    
    // Calculate available space with safe margins
    const availableWidth = MAX_PLAYABLE_WIDTH;
    const availableHeight = gameHeight - TOP_RESERVED - BOTTOM_RESERVED - (VERTICAL_PADDING * 2);
    
    // Center horizontally within safe area
    const originX = HORIZONTAL_MARGIN + (availableWidth - mapWidth) / 2 - minIsoX;
    
    // Center vertically in available space with responsive adjustment
    // Desktop: Move island down to create more sky space above (add 30px)
    // Mobile: Keep centered as-is for better use of limited screen space
    const verticalAdjustment = isMobile ? 0 : 75;
    const originY = TOP_RESERVED + VERTICAL_PADDING + (availableHeight - mapHeight) / 2 - minIsoY + verticalAdjustment;
    
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
        
        // Person movement state
        this.selectedPerson = null;      // Currently selected person sprite
        this.selectedPersonRow = -1;     // Grid row of selected person
        this.selectedPersonCol = -1;     // Grid col of selected person
        this.movementArrows = [];        // Array of arrow sprites/graphics
        this.isMoving = false;           // Prevent movement during animation
        this.keepPeopleOnIsland = true;  // Whether people can move into water
        this.selectedPersonIsInWater = false; // Track if selected person is in water
    }

    /**
     * Initialize with world data from Build Mode
     */
    init(data) {
        console.log('[IsometricPlayScene] Initializing with world data');
        this.worldGrid = data.grid || this.createEmptyGrid();
        this.childName = data.childName || 'Bunnies';
    }

    // Helper methods to get correct dimensions based on device orientation
    getGameWidth() {
        return isMobilePortrait() ? MOBILE_PORTRAIT_WIDTH : GAME_WIDTH;
    }

    getGameHeight() {
        return isMobilePortrait() ? MOBILE_PORTRAIT_HEIGHT : GAME_HEIGHT;
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

    createEmptyGrid() {
        const gridRows = this.getGridRows();
        const gridCols = this.getGridCols();
        const grid = [];
        for (let row = 0; row < gridRows; row++) {
            grid[row] = [];
            for (let col = 0; col < gridCols; col++) {
                grid[row][col] = BLOCK_TYPES.EMPTY;
            }
        }
        return grid;
    }

    preload() {
        // World assets already loaded by GameScene
        // Load edit icon for return-to-edit button
        this.load.image('icon-edit', 'assets/icons/arrow_left.png');
        
        // Load cloud assets
        this.load.image('cloud', 'assets/icons/cloud.png');
        this.load.image('cloud-small', 'assets/icons/cloud_small.png');
        this.load.image('cloud-smile', 'assets/icons/cloud_smile.png');
        this.load.image('bunny-cloud', 'assets/icons/bunny_cloud.png');
        this.load.image('bunny-face-cloud', 'assets/icons/bunny_face_cloud.png');
        
        // Load pink dolphin sprite
        this.load.image('pink-dolphin', 'assets/icons/pink_dolphin.png');
        
        // Load rainbow turtle sprite
        this.load.image('rainbow-turtle', 'assets/icons/turtle_rainbow.png');
        
        // Load splash sound
        this.load.audio('splash', 'assets/sounds/splash.mp3');
        
        // Load animal sounds
        this.load.audio('rabbit-bounce', 'assets/sounds/rabbit_bounce.mp3');
        this.load.audio('unicorn-rainbow', 'assets/sounds/unicorn_rainbow.mp3');
        this.load.audio('dolphin-sound', 'assets/sounds/dolphin.mp3?v=2');
        this.load.audio('dragon-fire-sound', 'assets/sounds/dragon_fire.mp3?v=2');
        
        // Load bloop sound for water entry
        this.load.audio('bloop-sound', 'assets/sounds/bloop.mp3');
        
        // Load fire sprites for dragon animation
        this.load.image('fire1', 'assets/icons/fire1.png');
        this.load.image('fire2', 'assets/icons/fire2.png');
        
        // Load isometric arrows for movement
        this.load.image('isometric-left-arrow', 'assets/icons/isometric_left_arrow.png');
        this.load.image('isometric-arrow-back', 'assets/icons/isometric_arrow_back.png');
        this.load.image('isometric-arrow-right', 'assets/icons/isometric_arrow_right.png');
        this.load.image('isometric-arrow-forward', 'assets/icons/isometric_arrow_forward.png');
    }

    create() {
        console.log('[IsometricPlayScene] Creating isometric world view');

        // Get responsive dimensions
        const gridCols = this.getGridCols();
        const gridRows = this.getGridRows();
        const gameWidth = this.getGameWidth();
        const gameHeight = this.getGameHeight();
        
        // Load keep people on island setting
        this.keepPeopleOnIsland = getKeepPeopleOnIsland();

        // Calculate optimal tile size to fit screen with margins
        const tileConfig = calculateOptimalTileSize(gridCols, gridRows, gameWidth);
        this.isoTileWidth = tileConfig.ISO_TILE_WIDTH;
        this.isoTileHeight = tileConfig.ISO_TILE_HEIGHT;
        this.scaleFactor = tileConfig.scaleFactor;
        
        console.log('[IsometricPlayScene] Tile size:', {
            width: this.isoTileWidth.toFixed(2),
            height: this.isoTileHeight.toFixed(2),
            scaleFactor: this.scaleFactor.toFixed(3)
        });

        // Calculate world origin for proper centering with safe margins
        const isMobile = isMobilePortrait();
        this.isoOrigin = calculateIsoWorldOrigin(
            this.isoTileWidth, 
            this.isoTileHeight, 
            gridCols, 
            gridRows, 
            gameWidth, 
            gameHeight,
            isMobile
        );
        console.log('[IsometricPlayScene] World origin:', {
            x: this.isoOrigin.originX.toFixed(2),
            y: this.isoOrigin.originY.toFixed(2),
            mapWidth: this.isoOrigin.mapWidth.toFixed(2)
        });

        // Create sky and water background with clouds and effects
        this.createBackground();

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
        
        // Warm up dragon sound to reduce playback delay
        if (this.sound && this.cache.audio.exists('dragon-fire-sound')) {
            const dragonSound = this.sound.add('dragon-fire-sound', { volume: 0 });
            dragonSound.play();
            dragonSound.stop();
            dragonSound.destroy();
        }
        
        // Fade in transition for polish
        this.cameras.main.fadeIn(200, 212, 241, 244);

        console.log('[IsometricPlayScene] Isometric world ready!');
    }

    createTitle() {
        const title = this.buildTitleText(this.childName);
        // Use responsive width so title centers correctly on mobile portrait
        const gameWidth = this.getGameWidth();
        const titleX = gameWidth / 2;
        this.titleText = this.add.text(titleX, 24, title, {
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
            }
        });
        this.titleText.setOrigin(0.5);
        this.titleText.setDepth(10000);
    }

    buildTitleText(name) {
        // Special case for "Bunnies" - no apostrophe needed
        if (name === 'Bunnies') {
            return 'Bunnies World';
        }
        
        if (name.endsWith('s') || name.endsWith('S')) {
            return `${name}' World`;
        } else {
            return `${name}'s World`;
        }
    }

    createBuildButton() {
        // Position button in top-left corner to match edit mode style
        const buttonX = 40; // Left side with margin
        const buttonY = 32; // Match header vertical position
        
        const button = this.add.container(buttonX, buttonY);
        
        // Use Edit icon image - no background, just floating arrow
        const icon = this.add.image(0, 0, 'icon-edit');
        icon.setOrigin(0.5);
        icon.setInteractive({ useHandCursor: true });
        const iconSize = 56; // Match edit mode arrow size
        const scale = iconSize / Math.max(icon.width, icon.height);
        icon.setScale(scale);

        // Create tooltip (hidden by default) - light pink background with black text
        const tooltip = this.add.text(0, 35, 'Edit', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#000000',
            backgroundColor: '#FFB6C1',
            padding: { x: 6, y: 4 }
        });
        tooltip.setOrigin(0.5, 0);
        tooltip.setVisible(false);
        tooltip.setDepth(20000);

        button.add([icon, tooltip]);
        button.setDepth(10000);

        // Show tooltip on hover
        icon.on('pointerover', () => {
            tooltip.setVisible(true);
            // Subtle hover effect - slight brightness increase
            icon.setTint(0xFFFFFF);
        });

        icon.on('pointerout', () => {
            tooltip.setVisible(false);
            icon.clearTint();
        });

        icon.on('pointerdown', () => {
            // Hide tooltip when clicking
            tooltip.setVisible(false);
            
            // Visual feedback - brief scale
            icon.setScale(scale * 0.95);
            this.time.delayedCall(100, () => {
                icon.setScale(scale);
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
        
        // Stop this View scene
        this.scene.stop();
    }

    /**
     * Create sky and water background with clouds and water effects
     */
    createBackground() {
        const gameWidth = this.getGameWidth();
        const gameHeight = this.getGameHeight();
        const isMobile = isMobilePortrait();
        
        // Calculate horizon based on island position (top of the grid)
        // The island top is at this.isoOrigin.originY
        // Set horizon slightly above the island with responsive offset
        // Mobile: smaller offset so water starts just above island tip
        // Desktop: larger offset for more visible sky above island
        const horizonOffset = isMobile ? 85 : 85;
        const horizonY = this.isoOrigin.originY - horizonOffset;
        
        // Sky section (light blue) - from top of screen to horizon
        const skyHeight = horizonY;
        const sky = this.add.rectangle(
            gameWidth / 2,
            skyHeight / 2,
            gameWidth,
            skyHeight,
            0x87CEEB // Light sky blue
        );
        sky.setDepth(-100);
        
        // Water section (darker blue) - from horizon to bottom of screen
        const waterStartY = horizonY;
        const waterHeight = gameHeight - horizonY;
        const water = this.add.rectangle(
            gameWidth / 2,
            waterStartY + waterHeight / 2,
            gameWidth,
            waterHeight,
            0x1E90FF // Darker water blue
        );
        water.setDepth(-100);
        
        // Store water bounds on scene for dolphin testing
        this.waterStartY = waterStartY;
        this.waterHeight = waterHeight;
        
        // Add water variations (subtle waves and patches)
        this.createWaterDetails(waterStartY, waterHeight);
        
        // Add fluffy clouds to sky
        this.createClouds(skyHeight);
        
        // Add occasional dolphin animation
        this.createDolphin(waterStartY, waterHeight);
        
        // Add rainbow turtle animation in bottom water
        this.createTurtle(waterStartY, waterHeight);
        
        // Debug: Draw zone outlines when adjusting dolphin/turtle areas
        if (SHOW_ANIMAL_ZONES) {
            this.drawDebugAnimalZones();
        }
    }

    /**
     * Create water surface details (waves and patches)
     */
    createWaterDetails(waterStartY, waterHeight) {
        const gameWidth = this.getGameWidth();
        const graphics = this.add.graphics();
        graphics.setDepth(-95); // Just above water base
        
        // Add subtle horizontal wave shapes
        const waveCount = 5;
        for (let i = 0; i < waveCount; i++) {
            const y = waterStartY + (waterHeight * (i + 1) / (waveCount + 1));
            const waveWidth = gameWidth;
            const waveHeight = 20;
            
            // Alternate between slightly lighter and darker blues
            const color = i % 2 === 0 ? 0x4169E1 : 0x1C86EE;
            graphics.fillStyle(color, 0.3);
            
            // Draw curved wave shape
            graphics.beginPath();
            graphics.moveTo(0, y);
            for (let x = 0; x <= waveWidth; x += 20) {
                const offset = Math.sin((x / waveWidth) * Math.PI * 3) * 8;
                graphics.lineTo(x, y + offset);
            }
            graphics.lineTo(waveWidth, y + waveHeight);
            graphics.lineTo(0, y + waveHeight);
            graphics.closePath();
            graphics.fill();
        }
        
        // Add some random soft patches for texture
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * gameWidth;
            const y = waterStartY + Math.random() * waterHeight;
            const radius = 20 + Math.random() * 30;
            const color = Math.random() > 0.5 ? 0x1C86EE : 0x4169E1;
            graphics.fillStyle(color, 0.2);
            graphics.fillEllipse(x, y, radius, radius * 0.6);
        }
    }

    /**
     * Create moving clouds in the sky using image assets
     */
    createClouds(skyHeight) {
        const gameWidth = this.getGameWidth();
        
        // Cloud asset types
        const normalCloudTypes = ['cloud', 'cloud-small', 'cloud-smile'];
        const bunnyCloudTypes = ['bunny-cloud', 'bunny-face-cloud'];
        
        // Create 3-5 clouds total
        const cloudCount = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5 clouds
        const bunnyCount = 1; // At least one bunny cloud
        const normalCount = cloudCount - bunnyCount;
        
        this.cloudSprites = [];
        
        // Create normal clouds
        for (let i = 0; i < normalCount; i++) {
            const cloudType = normalCloudTypes[Math.floor(Math.random() * normalCloudTypes.length)];
            this.createMovingCloud(cloudType, skyHeight, gameWidth, false);
        }
        
        // Create bunny clouds (faster)
        for (let i = 0; i < bunnyCount; i++) {
            const cloudType = bunnyCloudTypes[Math.floor(Math.random() * bunnyCloudTypes.length)];
            this.createMovingCloud(cloudType, skyHeight, gameWidth, true);
        }
    }

    /**
     * Create a single moving cloud sprite
     */
    createMovingCloud(cloudType, skyHeight, gameWidth, isBunnyCloud) {
        // Random starting position across visible screen for immediate visibility
        const startX = Math.random() * gameWidth;
        
        // Calculate safe Y range in sky area with padding
        const cloudTopPadding = 55;
        const cloudBottomPadding = 80;
        const minCloudY = cloudTopPadding;
        const maxCloudY = Math.max(minCloudY + 20, skyHeight - cloudBottomPadding);
        const y = Phaser.Math.Between(minCloudY, maxCloudY);
        
        // Create cloud sprite
        const cloud = this.add.image(startX, y, cloudType);
        cloud.setDepth(-98); // Below title, above background
        
        // Random scale - smaller for bunny clouds, even smaller for normal clouds
        const scale = isBunnyCloud
            ? 0.35 + Math.random() * 0.20  // 0.35-0.55
            : 0.30 + Math.random() * 0.18; // 0.30-0.48
        cloud.setScale(scale);
        cloud.setAlpha(0.85); // Slight transparency
        
        // Speed: gentle and slow movement
        // Normal clouds: 45-70 seconds, Bunny clouds: 30-45 seconds
        const duration = isBunnyCloud 
            ? 30000 + Math.random() * 15000  // 30-45 seconds
            : 45000 + Math.random() * 25000; // 45-70 seconds
        
        this.cloudSprites.push(cloud);
        
        // Start animation
        this.animateCloud(cloud, gameWidth, skyHeight, cloudType, isBunnyCloud, duration, y);
    }

    /**
     * Animate cloud movement right-to-left with looping
     */
    animateCloud(cloud, gameWidth, skyHeight, cloudType, isBunnyCloud, duration, currentY) {
        // Move from right to left
        this.tweens.add({
            targets: cloud,
            x: -100, // Move off-screen left
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
                // Reset cloud off-screen right and randomize properties
                cloud.x = gameWidth + 100;
                
                // Keep cloud in sky area with padding
                const cloudTopPadding = 55;
                const cloudBottomPadding = 80;
                const minCloudY = cloudTopPadding;
                const maxCloudY = Math.max(minCloudY + 20, skyHeight - cloudBottomPadding);
                cloud.y = Phaser.Math.Between(minCloudY, maxCloudY);
                
                // Random scale - smaller for bunny clouds, even smaller for normal clouds
                const scale = isBunnyCloud
                    ? 0.35 + Math.random() * 0.20  // 0.35-0.55
                    : 0.30 + Math.random() * 0.18; // 0.30-0.48
                cloud.setScale(scale);
                
                // Optionally change cloud type on loop
                const shouldChangeType = Math.random() > 0.7;
                if (shouldChangeType) {
                    const normalCloudTypes = ['cloud', 'cloud-small', 'cloud-smile'];
                    const bunnyCloudTypes = ['bunny-cloud', 'bunny-face-cloud'];
                    const newType = isBunnyCloud 
                        ? bunnyCloudTypes[Math.floor(Math.random() * bunnyCloudTypes.length)]
                        : normalCloudTypes[Math.floor(Math.random() * normalCloudTypes.length)];
                    cloud.setTexture(newType);
                }
                
                // Randomize duration slightly for next loop
                const newDuration = isBunnyCloud 
                    ? 30000 + Math.random() * 15000  // 30-45 seconds
                    : 45000 + Math.random() * 25000; // 45-70 seconds
                
                // Continue animation loop
                this.animateCloud(cloud, gameWidth, skyHeight, cloudType, isBunnyCloud, newDuration, cloud.y);
            }
        });
    }

    /**
     * Create dolphin animation that occasionally appears in water
     */
    createDolphin(waterStartY, waterHeight) {
        const gameWidth = this.getGameWidth();
        const gameHeight = this.getGameHeight();
        const gridCols = this.getGridCols();
        const gridRows = this.getGridRows();
        
        // Calculate island corner positions for bounds and click detection
        const topCorner = this.gridToIso(0, 0);
        const rightCorner = this.gridToIso(gridCols - 1, 0);
        const bottomCorner = this.gridToIso(gridCols - 1, gridRows - 1);
        const leftCorner = this.gridToIso(0, gridRows - 1);
        const islandBottomY = bottomCorner.y;
        
        // Store island corners for click detection
        this.islandCorners = { topCorner, rightCorner, bottomCorner, leftCorner };
        
        // Define dolphin Y range (top water only - above island)
        const dolphinYMin = waterStartY + 5;
        const dolphinYMax = this.isoOrigin.originY - 50;
        
        // Check if there's enough space for dolphin
        if (dolphinYMax <= dolphinYMin) {
            console.log('[IsometricPlayScene] Not enough top water space for dolphin');
            // Continue anyway - right-side zone might still work
        }
        
        // Define right-side dolphin zone (desktop only)
        const dolphinRightYMin = isMobilePortrait() ? null : dolphinYMax + 8;
        const dolphinRightYMax = isMobilePortrait() ? null : this.isoOrigin.originY + this.isoTileHeight * 5.1;
        const dolphinRightXMin = isMobilePortrait() ? null : gameWidth * 0.40;
        const dolphinRightXMax = isMobilePortrait() ? null : gameWidth - 25;
        
        // Store bounds on scene for click/tap testing
        this.islandBottomY = islandBottomY;
        this.dolphinYMin = dolphinYMin;
        this.dolphinYMax = dolphinYMax;
        this.dolphinRightYMin = dolphinRightYMin;
        this.dolphinRightYMax = dolphinRightYMax;
        this.dolphinRightXMin = dolphinRightXMin;
        this.dolphinRightXMax = dolphinRightXMax;
        
        // Create pink dolphin sprite
        const dolphin = this.add.sprite(0, 0, 'pink-dolphin');
        dolphin.setDepth(-90); // Above water details, below island
        dolphin.setVisible(false); // Start hidden
        dolphin.setAlpha(0); // Start transparent
        
        // Scale dolphin based on target width (responsive) - smaller and cuter
        const dolphinTargetWidth = isMobilePortrait() ? 52 : 48;
        const dolphinScale = dolphinTargetWidth / dolphin.width;
        dolphin.setScale(dolphinScale);
        
        this.dolphinSprite = dolphin; // Store reference for testing
        
        // Dolphin animation function: natural peek/dive with subtle arc
        const animateDolphin = (targetY = null, targetX = null) => {
            // Stop any existing dolphin animation
            this.tweens.killTweensOf(dolphin);
            
            // Check if this is a right-side tap, otherwise use top water band
            let waterY;
            let isRightSideDolphinTarget = false;
            let dolphinTriangleBottomYAtTargetX = dolphinRightYMin;
            
            if (
                targetX !== null &&
                targetY !== null &&
                dolphinRightXMin !== null &&
                dolphinRightXMax !== null &&
                dolphinRightYMin !== null &&
                dolphinRightYMax !== null
            ) {
                dolphinTriangleBottomYAtTargetX =
                    dolphinRightYMin +
                    ((targetX - dolphinRightXMin) / (dolphinRightXMax - dolphinRightXMin)) *
                    (dolphinRightYMax - dolphinRightYMin);
                
                isRightSideDolphinTarget =
                    targetX >= dolphinRightXMin &&
                    targetX <= dolphinRightXMax &&
                    targetY >= dolphinRightYMin &&
                    targetY <= dolphinTriangleBottomYAtTargetX;
            }
            
            if (isRightSideDolphinTarget) {
                waterY = Phaser.Math.Clamp(targetY, dolphinRightYMin, dolphinTriangleBottomYAtTargetX);
            } else {
                waterY = targetY !== null
                    ? Phaser.Math.Clamp(targetY, dolphinYMin, dolphinYMax)
                    : Phaser.Math.Between(dolphinYMin, dolphinYMax);
            }
            
            // Use provided X or random X position in safe area
            const centerX = targetX !== null 
                ? Math.max(60, Math.min(targetX, gameWidth - 60))  // Keep away from edges
                : 60 + Math.random() * (gameWidth - 120); // Random position with margins
            
            // Arc animation parameters for natural peek
            const startX = centerX + 12; // Start slightly right
            const peakX = centerX; // Peak at center
            const endX = centerX - 12; // End slightly left
            const baseY = waterY + 8; // Just below water surface
            const peakY = waterY - 18; // Low peek above water
            
            // Set initial position and show dolphin
            dolphin.setPosition(startX, baseY);
            dolphin.setRotation(0);
            dolphin.setVisible(true);
            dolphin.setAlpha(0);
            
            if (this.sound && this.cache.audio.exists('dolphin-sound')) {
                this.sound.play('dolphin-sound', { volume: 0.1 });
            }
            
            // Optional: Create subtle splash circle at entry point
            const splash = this.add.circle(centerX, waterY, 8, 0xFFFFFF, 0.4);
            splash.setDepth(-91); // Just below dolphin
            this.tweens.add({
                targets: splash,
                radius: 20,
                alpha: 0,
                duration: 400,
                ease: 'Sine.easeOut',
                onComplete: () => splash.destroy()
            });
            
            // Single smooth continuous arc animation (no pause)
            const duration = 900 + Math.random() * 300; // 900-1200ms
            const peakHeight = 18; // Low arc only
            
            this.tweens.add({
                targets: dolphin,
                x: endX,
                duration: duration,
                ease: 'Linear',
                onUpdate: (tween) => {
                    const progress = tween.progress;
                    
                    // Y: smooth arc using sine curve
                    const arcProgress = Math.sin(progress * Math.PI);
                    const currentY = baseY - (peakHeight * arcProgress);
                    dolphin.setY(currentY);
                    
                    // Alpha: fade in quickly, stay visible, fade out at end
                    let alpha;
                    if (progress < 0.15) {
                        alpha = progress / 0.15; // Fade in first 15%
                    } else if (progress > 0.80) {
                        alpha = (1 - progress) / 0.20; // Fade out last 20%
                    } else {
                        alpha = 1; // Solid in middle
                    }
                    dolphin.setAlpha(alpha);
                },
                onComplete: () => {
                    // Optional: Create exit splash
                    const exitSplash = this.add.circle(endX, waterY, 6, 0xFFFFFF, 0.3);
                    exitSplash.setDepth(-91);
                    this.tweens.add({
                        targets: exitSplash,
                        radius: 16,
                        alpha: 0,
                        duration: 350,
                        ease: 'Sine.easeOut',
                        onComplete: () => exitSplash.destroy()
                    });
                    
                    // Clean up: hide sprite and reset
                    dolphin.setVisible(false);
                    dolphin.setAlpha(0);
                    dolphin.setRotation(0);
                    
                    // Schedule next appearance (~30 seconds with variation)
                    // Only schedule if this was an automatic animation
                    if (targetY === null && targetX === null) {
                        this.time.delayedCall(25000 + Math.random() * 10000, () => animateDolphin());
                    }
                }
            });
        };
        
        // Store animation function for manual testing
        this.triggerDolphin = animateDolphin;
        
        // Start automatic dolphin quickly for testing (3 seconds)
        // Then continues every ~30 seconds
        this.time.delayedCall(3000, () => animateDolphin());
        
        // TESTING FEATURE: Click/tap water to show dolphin immediately
        // This is for testing purposes and can be removed later
        this.input.on('pointerdown', (pointer) => {
            const clickX = pointer.x;
            const clickY = pointer.y;
            
            // Check both top water zone and right-side zone
            const isInTopDolphinZone = clickY >= dolphinYMin && clickY <= dolphinYMax;
            
            let isInRightDolphinZone = false;
            
            if (
                dolphinRightXMin !== null &&
                dolphinRightXMax !== null &&
                dolphinRightYMin !== null &&
                dolphinRightYMax !== null
            ) {
                const dolphinTriangleBottomYAtClickX =
                    dolphinRightYMin +
                    ((clickX - dolphinRightXMin) / (dolphinRightXMax - dolphinRightXMin)) *
                    (dolphinRightYMax - dolphinRightYMin);
                
                isInRightDolphinZone =
                    clickX >= dolphinRightXMin &&
                    clickX <= dolphinRightXMax &&
                    clickY >= dolphinRightYMin &&
                    clickY <= dolphinTriangleBottomYAtClickX;
            }
            
            if (isInTopDolphinZone || isInRightDolphinZone) {
                console.log('[IsometricPlayScene] Test click: Triggering dolphin at X=' + clickX.toFixed(0) + ', Y=' + clickY.toFixed(0));
                animateDolphin(clickY, clickX);
            }
        });
    }

    /**
     * Create rainbow turtle animation in bottom water area
     */
    createTurtle(waterStartY, waterHeight) {
        const gameWidth = this.getGameWidth();
        const gameHeight = this.getGameHeight();
        const isMobile = isMobilePortrait();
        
        // Calculate island corners for bottom water zone
        const gridCols = this.getGridCols();
        const gridRows = this.getGridRows();
        const bottomCorner = this.gridToIso(gridCols - 1, gridRows - 1);
        const bottomLeftCorner = this.gridToIso(0, gridRows - 1);
        const bottomRightCorner = this.gridToIso(gridCols - 1, 0);
        
        // Define turtle Y range (bottom water only - below island)
        const turtleYMin = Math.min(bottomCorner.y + 35, gameHeight - 120);
        const turtleYMax = gameHeight - 55;
        const turtleYRange = turtleYMax - turtleYMin;
        
        // Debug: Log turtle bounds
        console.log('[IsometricPlayScene] Turtle bounds:', {
            turtleYMin,
            turtleYMax,
            turtleYRange,
            gameHeight,
            bottomCornerY: bottomCorner.y
        });
        
        // Check if there's enough space for turtle
        if (turtleYRange < 40) {
            console.log('[IsometricPlayScene] Not enough bottom water space for turtle');
            return;
        }
        
        // Store turtle bounds for tap testing
        this.turtleYMin = turtleYMin;
        this.turtleYMax = turtleYMax;
        
        // Create rainbow turtle sprite
        const turtle = this.add.sprite(0, 0, 'rainbow-turtle');
        turtle.setDepth(-89); // Above water details, near dolphin layer
        turtle.setVisible(false);
        turtle.setAlpha(0);
        
        // Scale turtle based on target width (responsive)
        const turtleTargetWidth = isMobile ? 90 : 62;
        const turtleScale = turtleTargetWidth / turtle.width;
        turtle.setScale(turtleScale);
        
        this.turtleSprite = turtle; // Store reference
        
        // Turtle animation: slow pop-up, hold, sink down
        const animateTurtle = (targetX = null, targetY = null) => {
            // Stop any existing turtle animation
            this.tweens.killTweensOf(turtle);
            
            if (this.turtleHoldTimer) {
                this.turtleHoldTimer.remove(false);
                this.turtleHoldTimer = null;
            }

            // Fixed bottom-left turtle zone - triangle shape.
            // This deliberately keeps the turtle away from the island.
            // Do not calculate near island edges because that has caused repeated under-island placement.
            const turtleZoneLeftX = isMobile ? 35 : 35;
            const turtleZoneTopY = isMobile ? gameHeight - 260 : gameHeight - 170;
            const turtleZoneRightX = isMobile ? 360 : 360;
            const turtleZoneBottomY = isMobile ? gameHeight - 45 : gameHeight - 45;
            
            let centerX = targetX !== null
                ? Phaser.Math.Clamp(targetX, turtleZoneLeftX, turtleZoneRightX)
                : Phaser.Math.Between(turtleZoneLeftX, turtleZoneRightX);
            
            const triangleMinY = turtleZoneTopY + ((centerX - turtleZoneLeftX) * 0.45);
            
            let turtleY = targetY !== null
                ? Phaser.Math.Clamp(targetY, triangleMinY, turtleZoneBottomY)
                : Phaser.Math.Between(triangleMinY, turtleZoneBottomY);
            
            // Animation parameters - small gentle peek
            const hiddenY = turtleY + 8; // Start slightly below visible position
            const visibleY = turtleY; // Surface position
            const popUpDuration = 220; // Quick rise
            const holdDuration = 650; // Brief hold
            const sinkDuration = 260; // Quick sink
            
            // Set initial position (hidden below)
            turtle.setPosition(centerX, hiddenY);
            turtle.setVisible(true);
            turtle.setAlpha(1);
            
            // Optional: Create subtle splash/bubble effect
            const createBubbles = (x, y) => {
                const bubble1 = this.add.circle(x - 8, y, 4, 0xE0F7FF, 0.6);
                const bubble2 = this.add.circle(x + 8, y, 3, 0xE0F7FF, 0.5);
                const bubble3 = this.add.circle(x, y - 6, 3, 0xFFFFFF, 0.7);
                [bubble1, bubble2, bubble3].forEach(bubble => {
                    bubble.setDepth(-90);
                    this.tweens.add({
                        targets: bubble,
                        y: bubble.y - 15,
                        radius: bubble.radius * 1.5,
                        alpha: 0,
                        duration: 500,
                        ease: 'Sine.easeOut',
                        onComplete: () => bubble.destroy()
                    });
                });
            };
            
            // Play splash sound
            if (this.sound && this.cache.audio.exists('splash')) {
                this.sound.play('splash', { volume: 0.35 });
            }
            
            // Phase 1: Pop up quickly
            this.tweens.add({
                targets: turtle,
                y: visibleY,
                duration: popUpDuration,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    // Create bubbles when turtle surfaces
                    createBubbles(centerX, visibleY);
                    
                    // Phase 2: Hold visible
                    this.turtleHoldTimer = this.time.delayedCall(holdDuration, () => {
                        this.turtleHoldTimer = null;

                        // Phase 3: Sink down quickly
                        this.tweens.add({
                            targets: turtle,
                            y: hiddenY,
                            duration: sinkDuration,
                            ease: 'Quad.easeIn',
                            onComplete: () => {
                                turtle.setVisible(false);
                                turtle.setAlpha(0);
                                
                                // Schedule next appearance (20-40 seconds) if automatic
                                if (targetX === null) {
                                    this.time.delayedCall(20000 + Math.random() * 20000, () => animateTurtle());
                                }
                            }
                        });
                    });
                }
            });
        };
        
        // Store animation function for manual testing
        this.triggerTurtle = animateTurtle;
        
        // TESTING: Start turtle after 1 second
        this.time.delayedCall(1000, () => animateTurtle());
        
        // TESTING: Add tap handler for bottom water
        this.input.on('pointerdown', (pointer) => {
            const clickX = pointer.x;
            const clickY = pointer.y;
            
            // Only trigger turtle in the fixed bottom-left water zone (triangle)
            const turtleZoneLeftX = isMobile ? 35 : 35;
            const turtleZoneTopY = isMobile ? gameHeight - 260 : gameHeight - 170;
            const turtleZoneRightX = isMobile ? 360 : 360;
            const turtleZoneBottomY = isMobile ? gameHeight - 45 : gameHeight - 45;
            
            const isInTurtleZone =
                clickX >= turtleZoneLeftX &&
                clickX <= turtleZoneRightX &&
                clickY >= turtleZoneTopY &&
                clickY <= turtleZoneBottomY &&
                clickY >= turtleZoneTopY + ((clickX - turtleZoneLeftX) * 0.45);
            
            if (isInTurtleZone) {
                console.log('[IsometricPlayScene] Test click: Triggering turtle at X=' + clickX.toFixed(0) + ', Y=' + clickY.toFixed(0));
                animateTurtle(clickX, clickY);
            }
        });
    }

    /**
     * Check if a point is inside the island diamond area
     */
    isPointOnIsland(x, y) {
        if (!this.islandCorners) return false;
        
        const { topCorner, rightCorner, bottomCorner, leftCorner } = this.islandCorners;
        
        // Add padding to make the island hit area slightly larger
        const padding = this.isoTileWidth * 0.6;
        
        // Check if point is inside the diamond using cross product method
        // Island is a diamond/rhombus shape with 4 corners
        const isInside = this.pointInDiamond(
            x, y,
            topCorner.x, topCorner.y - padding,
            rightCorner.x + padding, rightCorner.y,
            bottomCorner.x, bottomCorner.y + padding,
            leftCorner.x - padding, leftCorner.y
        );
        
        return isInside;
    }

    /**
     * Check if point is inside a diamond/rhombus
     */
    pointInDiamond(px, py, tx, ty, rx, ry, bx, by, lx, ly) {
        // Use cross product to check if point is on the correct side of each edge
        const d1 = (px - tx) * (ry - ty) - (py - ty) * (rx - tx);
        const d2 = (px - rx) * (by - ry) - (py - ry) * (bx - rx);
        const d3 = (px - bx) * (ly - by) - (py - by) * (lx - bx);
        const d4 = (px - lx) * (ty - ly) - (py - ly) * (tx - lx);
        
        // Point is inside if all cross products have the same sign
        const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0) || (d4 < 0);
        const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0) || (d4 > 0);
        
        return !(hasNeg && hasPos);
    }

    /**
     * Draw debug zone outlines for animal zones
     */
    drawDebugAnimalZones() {
        const gameHeight = this.getGameHeight();

        const graphics = this.add.graphics();
        graphics.setDepth(9999);

        // Turtle zone - purple triangle
        const isMobile = isMobilePortrait();
        const turtleZoneLeftX = isMobile ? 35 : 35;
        const turtleZoneTopY = isMobile ? gameHeight - 260 : gameHeight - 170;
        const turtleZoneRightX = isMobile ? 360 : 360;
        const turtleZoneBottomY = isMobile ? gameHeight - 45 : gameHeight - 45;

        graphics.lineStyle(3, 0xcc66ff, 1);
        graphics.beginPath();
        graphics.moveTo(turtleZoneLeftX, turtleZoneTopY);
        graphics.lineTo(turtleZoneLeftX, turtleZoneBottomY);
        graphics.lineTo(turtleZoneRightX, turtleZoneBottomY);
        graphics.closePath();
        graphics.strokePath();

        // Dolphin top zone - red rectangle
        if (this.dolphinYMin !== undefined && this.dolphinYMax !== undefined) {
            graphics.lineStyle(3, 0xff0000, 1);
            graphics.strokeRect(0, this.dolphinYMin, this.getGameWidth(), this.dolphinYMax - this.dolphinYMin);
        }

        // Dolphin right zone - pink triangle (desktop only)
        if (
            this.dolphinRightXMin !== null &&
            this.dolphinRightXMax !== null &&
            this.dolphinRightYMin !== null &&
            this.dolphinRightYMax !== null
        ) {
            const dolphinTopLeftX = this.dolphinRightXMin;
            const dolphinTopLeftY = this.dolphinRightYMin;

            const dolphinTopRightX = this.dolphinRightXMax;
            const dolphinTopRightY = this.dolphinRightYMin;

            const dolphinBottomRightX = this.dolphinRightXMax;
            const dolphinBottomRightY = this.dolphinRightYMax;

            graphics.lineStyle(3, 0xff99cc, 1);
            graphics.beginPath();
            graphics.moveTo(dolphinTopLeftX, dolphinTopLeftY);
            graphics.lineTo(dolphinTopRightX, dolphinTopRightY);
            graphics.lineTo(dolphinBottomRightX, dolphinBottomRightY);
            graphics.closePath();
            graphics.strokePath();
        }

        this.debugAnimalZoneGraphics = graphics;
    }

    /**
     * Create sand island border behind grass grid
     */
    createSandIsland() {
        const gridCols = this.getGridCols();
        const gridRows = this.getGridRows();
        
        // Calculate the four corners of the grass grid
        const topCorner = this.gridToIso(0, 0);
        const rightCorner = this.gridToIso(gridCols - 1, 0);
        const bottomCorner = this.gridToIso(gridCols - 1, gridRows - 1);
        const leftCorner = this.gridToIso(0, gridRows - 1);

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
        const gridRows = this.getGridRows();
        const gridCols = this.getGridCols();
        
        // Clear existing sprites
        this.worldSprites.forEach(sprite => sprite.destroy());
        this.worldSprites = [];

        // Collect all tiles with their positions for depth sorting
        const tiles = [];
        
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
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
     * Add sparkle effect for glitter pink tiles
     * Matches Edit Mode sparkle appearance with multi-color twinkle
     */
    addSparkleEffect(container, scale = 1.0) {
        // Always animate in Isometric Play Mode
        const animate = true;

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
        if (hasPattern(blockType) && blockType !== BLOCK_TYPES.GLITTER_PINK && blockType !== BLOCK_TYPES.WATER) {
            const pattern = getPattern(blockType);
            const fontSize = Math.round(18 * this.scaleFactor);
            const patternText = this.add.text(pos.x, pos.y, pattern, {
                fontSize: `${fontSize}px`,
                fontFamily: 'Arial'
            });
            patternText.setOrigin(0.5);
            patternText.setDepth(depth + 2);
            this.worldSprites.push(patternText);
        } else if (blockType === BLOCK_TYPES.GLITTER_PINK) {
            // Glitter pink tile - add sparkle effects matching Edit Mode
            const sparkleContainer = this.add.container(pos.x, pos.y);
            sparkleContainer.setDepth(depth + 2);

            // Use smaller scale to fit sparkles inside the isometric diamond tile
            const sparkleScale = this.scaleFactor * 0.6;
            this.addSparkleEffect(sparkleContainer, sparkleScale);

            // Create diamond mask to clip sparkles inside tile bounds
            const maskGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            maskGraphics.fillStyle(0xffffff);
            maskGraphics.beginPath();
            maskGraphics.moveTo(pos.x, pos.y - halfHeight); // Top
            maskGraphics.lineTo(pos.x + halfWidth, pos.y); // Right
            maskGraphics.lineTo(pos.x, pos.y + halfHeight); // Bottom
            maskGraphics.lineTo(pos.x - halfWidth, pos.y); // Left
            maskGraphics.closePath();
            maskGraphics.fillPath();
            
            const mask = maskGraphics.createGeometryMask();
            sparkleContainer.setMask(mask);

            this.worldSprites.push(sparkleContainer);
        } else if (blockType === BLOCK_TYPES.WATER) {
            // Water tile - add animated wave lines for isometric view
            // Use container for proper positioning and animation
            const waterContainer = this.add.container(pos.x, pos.y);
            waterContainer.setDepth(depth + 2);
            
            const waveCount = 3;
            const waveWidth = halfWidth * 0.75; // Use 75% of tile width for visible waves
            const waveAmplitude = 3.5; // Increased amplitude for visibility
            
            for (let i = 0; i < waveCount; i++) {
                const wave = this.add.graphics();
                wave.lineStyle(1.5, 0xFFFFFF, 0.6); // Increased width and opacity for visibility
                
                // Position waves across the tile
                const yOffset = (i - 1) * (halfHeight * 0.45);
                
                // Draw smooth curved wave line using local coordinates
                wave.beginPath();
                wave.moveTo(-waveWidth, yOffset);
                for (let x = -waveWidth; x <= waveWidth; x += 2) {
                    const phase = (x / waveWidth) * Math.PI;
                    const y = yOffset + Math.sin(phase) * waveAmplitude;
                    wave.lineTo(x, y);
                }
                wave.strokePath();
                
                waterContainer.add(wave);
                
                // Animate wave with horizontal movement and fade
                this.tweens.add({
                    targets: wave,
                    alpha: { from: 0.6, to: 0.35 },
                    x: { from: 0, to: 5 },
                    duration: 1300 + i * 200,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
            
            // Add visible shimmer circles
            const shimmer = this.add.graphics();
            shimmer.lineStyle(1, 0xFFFFFF, 0.45);
            shimmer.strokeCircle(-halfWidth * 0.3, -halfHeight * 0.3, 3);
            shimmer.strokeCircle(halfWidth * 0.25, halfHeight * 0.2, 2.5);
            waterContainer.add(shimmer);
            
            // Animate shimmer
            this.tweens.add({
                targets: shimmer,
                alpha: { from: 0.5, to: 0.2 },
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // Create geometry mask to clip waves inside diamond tile
            const maskGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            maskGraphics.fillStyle(0xffffff);
            maskGraphics.beginPath();
            maskGraphics.moveTo(pos.x, pos.y - halfHeight); // Top
            maskGraphics.lineTo(pos.x + halfWidth, pos.y); // Right
            maskGraphics.lineTo(pos.x, pos.y + halfHeight); // Bottom
            maskGraphics.lineTo(pos.x - halfWidth, pos.y); // Left
            maskGraphics.closePath();
            maskGraphics.fillPath();
            
            const mask = maskGraphics.createGeometryMask();
            waterContainer.setMask(mask);
            
            this.worldSprites.push(waterContainer);
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
        } else if (blockType === BLOCK_TYPES.BOY) {
            targetHeight = this.isoTileHeight * 2.2;
            sprite.setOrigin(0.5, 0.85);
        } else if (blockType === BLOCK_TYPES.PURPLE_GIRL) {
            targetHeight = this.isoTileHeight * 2.2;
            sprite.setOrigin(0.5, 0.85);
        } else if (blockType === BLOCK_TYPES.YELLOW_BOY) {
            targetHeight = this.isoTileHeight * 2.2;
            sprite.setOrigin(0.5, 0.85);
        } else if (blockType === BLOCK_TYPES.TREE) {
            targetHeight = this.isoTileHeight * 3.1;
            sprite.setOrigin(0.5, 0.9);
            sprite.y += this.isoTileHeight * 0.2;
        } else if (blockType === BLOCK_TYPES.PALM_TREE) {
            // Palm trees (large tropical plants)
            targetHeight = this.isoTileHeight * 2.8;
            sprite.setOrigin(0.7, 0.85);
        } else if (blockType === BLOCK_TYPES.FLOWER) {
            targetHeight = this.isoTileHeight * 1.3;
            sprite.setOrigin(0.5, 0.7);
        } else if (blockType === BLOCK_TYPES.BUSH_PINK_FLOWER) {
            targetHeight = this.isoTileHeight * 1.4;
            sprite.setOrigin(0.5, 0.75);
        } else if (blockType === BLOCK_TYPES.BUSH_CAT) {
            targetHeight = this.isoTileHeight * 2.0;
            sprite.setOrigin(0.5, 0.9);
            // Move cat slightly forward on the tile so the feet sit better
            sprite.y += this.isoTileHeight * 0.22;
        } else if (blockType === BLOCK_TYPES.BUNNY) {
            targetHeight = this.isoTileHeight * 1.6;
            sprite.setOrigin(0.5, 0.9);
        } else if (blockType === BLOCK_TYPES.UNICORN) {
            targetHeight = this.isoTileHeight * 2.8;
            sprite.setOrigin(0.5, 0.9);
        } else if (blockType === BLOCK_TYPES.DRAGON) {
            targetHeight = this.isoTileHeight * 2.4;
            sprite.setOrigin(0.5, 0.9);
        }
        
        const scale = targetHeight / sprite.height;
        sprite.setScale(scale);
        
        // Use position-based depth for proper isometric sorting
        // Objects further down the screen (higher x+y) render above those further up
        sprite.setDepth(pos.x + pos.y);
        
        // Make interactive animals
        if (blockType === BLOCK_TYPES.DRAGON) {
            sprite.setInteractive({ useHandCursor: true });
            sprite.on('pointerdown', () => {
                this.playDragonFire(sprite);
            });
        } else if (blockType === BLOCK_TYPES.BUNNY) {
            sprite.setInteractive({ useHandCursor: true });
            sprite.on('pointerdown', () => {
                this.playBunnyBounce(sprite);
            });
        } else if (blockType === BLOCK_TYPES.UNICORN) {
            sprite.setInteractive({ useHandCursor: true });
            sprite.on('pointerdown', () => {
                this.playUnicornRainbow(sprite);
            });
        }
        
        // Make persons selectable for movement
        const personTypes = [BLOCK_TYPES.GIRL, BLOCK_TYPES.BOY, BLOCK_TYPES.PURPLE_GIRL, BLOCK_TYPES.YELLOW_BOY];
        if (personTypes.includes(blockType)) {
            sprite.setInteractive({ useHandCursor: true });
            // Store grid position with sprite
            sprite.gridRow = row;
            sprite.gridCol = col;
            sprite.blockType = blockType;
            sprite.waterOverlay = null;
            sprite.on('pointerdown', () => {
                this.selectPerson(sprite, sprite.gridRow, sprite.gridCol);
            });
        }
        
        this.worldSprites.push(sprite);
    }

    /**
     * Play bunny bounce animation
     * Bounces the bunny sprite up and down
     */
    playBunnyBounce(bunny) {
        // Prevent multiple simultaneous bounces
        if (bunny.isBouncing) return;
        
        bunny.isBouncing = true;
        
        if (this.sound && this.cache.audio.exists('rabbit-bounce')) {
            this.sound.play('rabbit-bounce', { volume: 0.45 });
        }
        const originalY = bunny.y;
        const bounceHeight = 15; // pixels to move up
        
        // Bounce up
        this.tweens.add({
            targets: bunny,
            y: originalY - bounceHeight,
            duration: 180,
            ease: 'Sine.easeOut',
            onComplete: () => {
                // Bounce down
                this.tweens.add({
                    targets: bunny,
                    y: originalY,
                    duration: 220,
                    ease: 'Bounce.easeOut',
                    onComplete: () => {
                        bunny.isBouncing = false;
                    }
                });
            }
        });
    }

    /**
     * Play unicorn rainbow effect
     * Shows a rainbow arc near/behind the unicorn
     */
    playUnicornRainbow(unicorn) {
        // Prevent multiple simultaneous effects
        if (unicorn.isShowingRainbow) return;
        
        unicorn.isShowingRainbow = true;
        
        if (this.sound && this.cache.audio.exists('unicorn-rainbow')) {
            this.sound.play('unicorn-rainbow', { volume: 0.45 });
        }
        
        // Create rainbow graphic
        const rainbow = this.add.graphics();
        rainbow.setAlpha(0);
        
        // Position rainbow behind and above unicorn
        const rainbowX = unicorn.x;
        const rainbowY = unicorn.y - unicorn.displayHeight * 0.6;
        const rainbowWidth = unicorn.displayWidth * 1.2;
        const stripeThickness = Math.max(2, rainbowWidth * 0.06);
        
        // Rainbow colors (pastel: pink, peach, yellow, mint, aqua, lavender)
        const colors = [0xFFB6D9, 0xFFD1A6, 0xFFF4A3, 0xB9F6C8, 0xBDEFFF, 0xD7C6FF];
        
        // Draw rainbow arcs
        colors.forEach((color, index) => {
            const radius = rainbowWidth * 0.5 - (index * stripeThickness);
            rainbow.lineStyle(stripeThickness, color, 1);
            rainbow.beginPath();
            rainbow.arc(rainbowX, rainbowY, radius, Math.PI, 0, false);
            rainbow.strokePath();
        });
        
        // Render behind unicorn
        rainbow.setDepth(unicorn.depth - 1);
        
        // Fade in, hold, fade out
        this.tweens.add({
            targets: rainbow,
            alpha: 1,
            duration: 150,
            ease: 'Power2',
            onComplete: () => {
                // Hold for a moment
                this.time.delayedCall(300, () => {
                    // Fade out
                    this.tweens.add({
                        targets: rainbow,
                        alpha: 0,
                        duration: 200,
                        ease: 'Power2',
                        onComplete: () => {
                            rainbow.destroy();
                            unicorn.isShowingRainbow = false;
                        }
                    });
                });
            }
        });
    }

    /**
     * Play dragon fire breathing animation
     * Shows fire sprites near the dragon's mouth without changing the dragon texture
     */
    playDragonFire(dragon) {
        // Prevent multiple simultaneous animations
        if (dragon.isBreathingFire) return;
        
        dragon.isBreathingFire = true;
        
        if (this.sound && this.cache.audio.exists('dragon-fire-sound')) {
            this.sound.play('dragon-fire-sound', { volume: 0.45 });
        }
        
        // Position fire near dragon's mouth (dragon faces left)
        const fireX = dragon.x - dragon.displayWidth * 0.6;
        const fireY = dragon.y - dragon.displayHeight * 0.22;
        
        // Create fire sprite starting with fire1
        const fire = this.add.image(fireX, fireY, 'fire1');
        fire.setOrigin(0.5, 0.5);
        
        // Size fire1 (smaller)
        fire.displayWidth = dragon.displayWidth * 0.35;
        fire.scaleY = fire.scaleX; // Preserve aspect ratio
        
        // Render fire in front of dragon
        fire.setDepth(dragon.depth + 1);
        
        // Show fire1 for 150ms
        this.time.delayedCall(150, () => {
            // Switch to fire2 (larger)
            fire.setTexture('fire2');
            fire.displayWidth = dragon.displayWidth * 0.55;
            fire.scaleY = fire.scaleX; // Preserve aspect ratio
        });
        
        // After 450ms total (150 + 300), fade out fire2
        this.time.delayedCall(450, () => {
            this.tweens.add({
                targets: fire,
                alpha: 0,
                duration: 150,
                ease: 'Power2',
                onComplete: () => {
                    fire.destroy();
                    dragon.isBreathingFire = false;
                }
            });
        });
    }

    /**
     * Select a person for movement
     */
    selectPerson(sprite, row, col) {
        // Prevent selection during movement
        if (this.isMoving) return;
        
        // Clear previous selection
        this.clearMovementArrows();
        
        // Set new selection
        this.selectedPerson = sprite;
        this.selectedPersonRow = row;
        this.selectedPersonCol = col;
        
        console.log('[IsometricPlayScene] Selected person at', row, col);
        
        // Show movement arrows
        this.showMovementArrows();
    }

    /**
     * Clear all movement arrows
     */
    clearMovementArrows() {
        this.movementArrows.forEach(arrow => {
            if (arrow && arrow.destroy) {
                arrow.destroy();
            }
        });
        this.movementArrows = [];
    }

    /**
     * Show movement arrows around selected person
     */
    showMovementArrows() {
        if (!this.selectedPerson) return;
        
        const gridRows = this.getGridRows();
        const gridCols = this.getGridCols();
        const row = this.selectedPersonRow;
        const col = this.selectedPersonCol;
        
        let canMoveForward = row > 0;
        let canMoveBack = row < gridRows - 1;
        let canMoveLeft = col > 0;
        let canMoveRight = col < gridCols - 1;
        
        if (!this.keepPeopleOnIsland) {
            canMoveForward = row >= 0;
            canMoveBack = row <= gridRows - 1;
            canMoveLeft = col >= 0;
            canMoveRight = col <= gridCols - 1;
        }
        
        // Do not allow people to enter water from corner blocks.
        // Corner water positions can push sprites off-screen or into odd visual positions.
        if (!this.keepPeopleOnIsland && this.isUnsafeWaterEntryPosition(row, col)) {
            canMoveForward = row > 0;
            canMoveBack = row < gridRows - 1;
            canMoveLeft = col > 0;
            canMoveRight = col < gridCols - 1;
        }
        
        // If already in water, only show arrows that move back onto the island.
        // Hide the arrow that would move further into water.
        if (!this.keepPeopleOnIsland && this.isWaterPosition(row, col)) {
            canMoveForward = !this.isWaterPosition(row - 1, col);
            canMoveBack = !this.isWaterPosition(row + 1, col);
            canMoveLeft = !this.isWaterPosition(row, col - 1);
            canMoveRight = !this.isWaterPosition(row, col + 1);
        }
        
        const basePos = this.isWaterPosition(row, col)
            ? this.getWaterIsoPosition(col, row)
            : this.gridToIso(col, row);
        
        // Left arrow - upper-left visual position
        if (canMoveLeft) {
            const arrow = this.add.image(
                basePos.x - this.isoTileWidth * 0.45,
                basePos.y - this.isoTileHeight * 0.50,
                'isometric-left-arrow'
            );

            arrow.setOrigin(0.5);
            arrow.setDisplaySize(
                this.isoTileWidth * 0.55,
                this.isoTileHeight * 0.76
            );
            arrow.setDepth(this.selectedPerson.depth + 100);
            arrow.setInteractive({ useHandCursor: true });

            arrow.on('pointerdown', () => {
                this.movePersonTo(row, col - 1);
            });

            this.movementArrows.push(arrow);
        }
        
        // Back arrow - upper-right visual position
        if (canMoveForward) {
            const arrow = this.add.image(
                basePos.x + this.isoTileWidth * 0.40,
                basePos.y - this.isoTileHeight * 0.45,
                'isometric-arrow-back'
            );

            arrow.setOrigin(0.5);
            arrow.setDisplaySize(
                this.isoTileWidth * 0.55,
                this.isoTileHeight * 0.76
            );
            arrow.setDepth(this.selectedPerson.depth + 100);
            arrow.setInteractive({ useHandCursor: true });

            arrow.on('pointerdown', () => {
                this.movePersonTo(row - 1, col);
            });

            this.movementArrows.push(arrow);
        }
        
        // Right arrow - lower-right visual position
        if (canMoveRight) {
            const arrow = this.add.image(
                basePos.x + this.isoTileWidth * 0.40,
                basePos.y + this.isoTileHeight * 0.55,
                'isometric-arrow-right'
            );

            arrow.setOrigin(0.5);
            arrow.setDisplaySize(
                this.isoTileWidth * 0.55,
                this.isoTileHeight * 0.76
            );
            arrow.setDepth(this.selectedPerson.depth + 100);
            arrow.setInteractive({ useHandCursor: true });

            arrow.on('pointerdown', () => {
                this.movePersonTo(row, col + 1);
            });

            this.movementArrows.push(arrow);
        }
        
        // Forward arrow - lower-left visual position
        if (canMoveBack) {
            const arrow = this.add.image(
                basePos.x - this.isoTileWidth * 0.45,
                basePos.y + this.isoTileHeight * 0.55,
                'isometric-arrow-forward'
            );

            arrow.setOrigin(0.5);
            arrow.setDisplaySize(
                this.isoTileWidth * 0.55,
                this.isoTileHeight * 0.76
            );
            arrow.setDepth(this.selectedPerson.depth + 100);
            arrow.setInteractive({ useHandCursor: true });

            arrow.on('pointerdown', () => {
                this.movePersonTo(row + 1, col);
            });

            this.movementArrows.push(arrow);
        }
    }
    
    /**
     * Check if a position is in water (outside island grid)
     */
    isWaterPosition(row, col) {
        return (
            row < 0 ||
            col < 0 ||
            row >= this.getGridRows() ||
            col >= this.getGridCols()
        );
    }
    
    isCornerIslandPosition(row, col) {
        const gridRows = this.getGridRows();
        const gridCols = this.getGridCols();

        return (
            (row === 0 && col === 0) ||
            (row === 0 && col === gridCols - 1) ||
            (row === gridRows - 1 && col === 0) ||
            (row === gridRows - 1 && col === gridCols - 1)
        );
    }
    
    isUnsafeWaterEntryPosition(row, col) {
        return (
            this.isCornerIslandPosition(row, col) ||
            row === 0 ||
            col === 0
        );
    }

    /**
     * Get isometric position for water (off-island) coordinates
     */
    getWaterIsoPosition(col, row) {
        return this.gridToIso(col, row);
    }
    
    addWaterOverlayToPerson(person) {
        if (person.waterOverlay) {
            person.waterOverlay.destroy();
            person.waterOverlay = null;
        }

        const overlay = this.add.ellipse(
            person.x - person.displayWidth * 0.12,
            person.y - person.displayHeight * 0.08,
            person.displayWidth * 0.9,
            person.displayHeight * 0.45,
            0x1E90FF,
            0.85
        );

        overlay.setDepth(person.depth + 1);
        person.waterOverlay = overlay;
    }

    removeWaterOverlayFromPerson(person) {
        if (person.waterOverlay) {
            person.waterOverlay.destroy();
            person.waterOverlay = null;
        }
    }

    /**
     * Move selected person to target grid position
     */
    movePersonTo(targetRow, targetCol) {
        if (!this.selectedPerson || this.isMoving) return;
        
        const isWaterTarget = this.isWaterPosition(targetRow, targetCol);

        const isMovingFromCornerToWater =
            isWaterTarget &&
            this.isUnsafeWaterEntryPosition(this.selectedPersonRow, this.selectedPersonCol);

        if (isMovingFromCornerToWater) {
            return;
        }

        if (isWaterTarget && this.keepPeopleOnIsland) {
            return;
        }
        
        this.isMoving = true;
        
        // Clear arrows during movement
        this.clearMovementArrows();
        
        // Calculate new isometric position
        const newPos = isWaterTarget
            ? this.getWaterIsoPosition(targetCol, targetRow)
            : this.gridToIso(targetCol, targetRow);
        
        // Check if destination has an object (person will stand on top)
        const destBlock = isWaterTarget ? BLOCK_TYPES.EMPTY : this.worldGrid[targetRow][targetCol];
        const hasObject = !isWaterTarget && (isWorldObject(destBlock) || isSolidBlock(destBlock));
        
        // Set depth based on whether standing on object
        const baseDepth = newPos.x + newPos.y;
        const newDepth = hasObject ? baseDepth + 200 : baseDepth + 20;
        
        // Adjust Y position for water (keep head above water)
        const targetY = isWaterTarget
            ? newPos.y + this.selectedPerson.displayHeight * 0.55
            : newPos.y;
        
        // Play bloop sound when entering water
        const wasInWater = this.isWaterPosition(this.selectedPersonRow, this.selectedPersonCol);

        if (wasInWater && !isWaterTarget) {
            this.removeWaterOverlayFromPerson(this.selectedPerson);
        }
        
        if (isWaterTarget && !wasInWater && this.sound && this.cache.audio.exists('bloop-sound')) {
            this.sound.play('bloop-sound', { volume: 0.45 });
        }
        
        // Animate movement
        this.tweens.add({
            targets: this.selectedPerson,
            x: newPos.x,
            y: targetY,
            duration: 220,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                if (this.selectedPerson.waterOverlay) {
                    this.selectedPerson.waterOverlay.x = this.selectedPerson.x - this.selectedPerson.displayWidth * 0.12;
                    this.selectedPerson.waterOverlay.y = this.selectedPerson.y - this.selectedPerson.displayHeight * 0.08;
                    this.selectedPerson.waterOverlay.setDepth(this.selectedPerson.depth + 1);
                }
            },
            onComplete: () => {
                // Update sprite depth for proper layering
                this.selectedPerson.setDepth(newDepth);
                
                if (isWaterTarget) {
                    this.addWaterOverlayToPerson(this.selectedPerson);
                }

                // Update stored grid position
                this.selectedPerson.gridRow = targetRow;
                this.selectedPerson.gridCol = targetCol;
                this.selectedPersonRow = targetRow;
                this.selectedPersonCol = targetCol;
                
                console.log('[IsometricPlayScene] Person moved to', targetRow, targetCol);
                
                // Show arrows at new position
                this.isMoving = false;
                this.showMovementArrows();
            }
        });
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
        const gridCols = this.getGridCols();
        const gridRows = this.getGridRows();
        
        // Try to spawn at current position if safe
        if (this.playerGridX >= 0 && this.playerGridX < gridCols && 
            this.playerGridY >= 0 && this.playerGridY < gridRows) {
            const currentBlock = this.worldGrid[this.playerGridY][this.playerGridX];
            if (!isSolidBlock(currentBlock)) {
                return { row: this.playerGridY, col: this.playerGridX };
            }
        }
        
        // Find first empty/walkable tile
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                const blockType = this.worldGrid[row][col];
                if (!isSolidBlock(blockType)) {
                    return { row, col };
                }
            }
        }
        
        // Emergency fallback
        return { row: Math.floor(gridRows / 2), col: Math.floor(gridCols / 2) };
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
        const gridCols = this.getGridCols();
        const gridRows = this.getGridRows();
        
        // Throttle movement
        const now = Date.now();
        if (this.lastMove && now - this.lastMove < 150) {
            return;
        }
        this.lastMove = now;

        const newCol = this.playerGridX + deltaCol;
        const newRow = this.playerGridY + deltaRow;

        // Check bounds
        if (newCol < 0 || newCol >= gridCols || newRow < 0 || newRow >= gridRows) {
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
