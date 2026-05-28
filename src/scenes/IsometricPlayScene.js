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
    }

    create() {
        console.log('[IsometricPlayScene] Creating isometric world view');

        // Get responsive dimensions
        const gridCols = this.getGridCols();
        const gridRows = this.getGridRows();
        const gameWidth = this.getGameWidth();
        const gameHeight = this.getGameHeight();

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
        
        // Define safe dolphin Y range (only in visible open water below island)
        const safeDolphinYMin = islandBottomY + 50; // Padding below island
        const safeDolphinYMax = gameHeight - 60; // Padding from bottom edge
        const safeYRange = safeDolphinYMax - safeDolphinYMin;
        
        // Store bounds on scene for click/tap testing
        this.islandBottomY = islandBottomY;
        this.safeDolphinYMin = safeDolphinYMin;
        this.safeDolphinYMax = safeDolphinYMax;
        this.safeYRange = safeYRange;
        
        // TESTING: Upper water band for visible dolphin testing
        // This makes the dolphin appear in the upper visible water area for easy testing
        const testDolphinYMin = waterStartY + 30;
        const testDolphinYMax = waterStartY + 120;
        
        // Create pink dolphin sprite
        const dolphin = this.add.sprite(0, 0, 'pink-dolphin');
        dolphin.setDepth(-90); // Above water details, below island
        dolphin.setVisible(false); // Start hidden
        dolphin.setAlpha(0); // Start transparent
        
        // Scale dolphin based on target width (responsive) - smaller and cuter
        const dolphinTargetWidth = isMobilePortrait() ? 32 : 48;
        const dolphinScale = dolphinTargetWidth / dolphin.width;
        dolphin.setScale(dolphinScale);
        
        this.dolphinSprite = dolphin; // Store reference for testing
        
        // Dolphin animation function: natural peek/dive with subtle arc
        const animateDolphin = (targetY = null, targetX = null) => {
            // Stop any existing dolphin animation
            this.tweens.killTweensOf(dolphin);
            
            // Use upper visible water band for better visibility
            // Use provided Y (clamped to test band) or random Y in test band
            const waterY = targetY !== null 
                ? Phaser.Math.Clamp(targetY, testDolphinYMin, testDolphinYMax)
                : testDolphinYMin + Math.random() * (testDolphinYMax - testDolphinYMin);
            
            // Use provided X or random X position in safe area
            const centerX = targetX !== null 
                ? Math.max(60, Math.min(targetX, gameWidth - 60))  // Keep away from edges
                : 60 + Math.random() * (gameWidth - 120); // Random position with margins
            
            // Arc animation parameters for natural peek
            const startX = centerX + 25; // Start slightly right
            const peakX = centerX; // Peak at center
            const endX = centerX - 25; // End slightly left
            const baseY = waterY + 8; // Just below water surface
            const peakY = waterY - 18; // Low peek above water
            
            // Set initial position and show dolphin
            dolphin.setPosition(startX, baseY);
            dolphin.setRotation(0);
            dolphin.setVisible(true);
            dolphin.setAlpha(0);
            
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
        if (safeYRange >= 80) {
            // Start first dolphin after a short delay for testing
            this.time.delayedCall(3000, () => animateDolphin());
        } else {
            console.log('[IsometricPlayScene] Limited safe water - automatic dolphin disabled, but manual testing available');
        }
        
        // TESTING FEATURE: Click/tap water to show dolphin immediately
        // This is for testing purposes and can be removed later
        this.input.on('pointerdown', (pointer) => {
            const clickX = pointer.x;
            const clickY = pointer.y;
            
            // Check if click is in water area (below horizon and not on island)
            if (clickY >= waterStartY && !this.isPointOnIsland(clickX, clickY)) {
                // TESTING: Use upper water test band for easy visibility
                // Clamp clicked Y to upper visible water area
                const dolphinY = Phaser.Math.Clamp(clickY, testDolphinYMin, testDolphinYMax);
                console.log('[IsometricPlayScene] Test click: Triggering dolphin at X=' + clickX.toFixed(0) + ', Y=' + dolphinY.toFixed(0));
                animateDolphin(dolphinY, clickX);
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
