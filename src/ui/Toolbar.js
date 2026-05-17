import { BLOCK_TYPES, TOOL_MODES, GAME_MODES, BLOCK_COLORS, PLAYABLE_HEIGHT, TOOLBAR_HEIGHT, GAME_WIDTH, HEADER_HEIGHT, PALETTE_COLORS, PALETTE_PATTERN_COLORS, PALETTE_OBJECTS, MOBILE_FAVORITES, isMobileView, isColorBlock, hasPattern, getPattern } from '../data/constants.js';

// Mode toggle icon size constant (used for both View and Edit arrows)
const MODE_TOGGLE_ICON_SIZE = 56;

export class Toolbar {
    constructor(scene) {
        this.scene = scene;
        this.selectedTool = BLOCK_TYPES.PINK;
        this.mode = TOOL_MODES.PLACE;
        this.buttons = [];
        this.modeToggleButton = null; // Reference to mode toggle button
        this.modeToggleLabel = null; // Reference to mode toggle label text
        this.modeToggleTooltip = null; // Reference to mode toggle tooltip
        this.buildToolsEnabled = true; // Track whether build tools are enabled
        this.isExpanded = false; // Track mobile toolbar expansion state
        this.expandedToolbar = null; // Reference to expanded toolbar container
        this.isMobileLayout = isMobileView(); // Track current layout mode
        this.resizeTimeoutId = null; // Debounce resize events
        
        this.createToolbar();
        this.setupResizeListener();
    }

    createToolbar() {
        if (this.isMobileLayout) {
            this.createMobileToolbar();
        } else {
            this.createDesktopToolbar();
        }
    }

    createMobileToolbar() {
        // Mobile: Show all colors and all objects (no More button needed)
        const toolbarTop = HEADER_HEIGHT + PLAYABLE_HEIGHT;
        const buttonSize = 36; // Slightly smaller to fit more buttons
        const gap = 4; // Tighter gap
        const startX = 32; // Shifted right by 12px from 20 to avoid left cutoff
        
        const row1Y = toolbarTop + 24;
        let x = startX;
        
        // Add all basic colors
        MOBILE_FAVORITES.colors.forEach((blockType) => {
            const colorItem = PALETTE_COLORS.find(c => c.type === blockType);
            if (colorItem) {
                this.createColorButton(x, row1Y, buttonSize, colorItem.type, colorItem.label, colorItem.color);
                x += buttonSize + gap;
            }
        });
        
        // Add small gap before patterns
        x += 2;
        
        // Add favorite pattern colors
        MOBILE_FAVORITES.patterns.forEach((blockType) => {
            const patternItem = PALETTE_PATTERN_COLORS.find(p => p.type === blockType);
            if (patternItem) {
                this.createPatternColorButton(x, row1Y, buttonSize, patternItem.type, patternItem.label, patternItem.color, patternItem.pattern);
                x += buttonSize + gap;
            }
        });
        
        // Row 2: Objects and tools
        const row2Y = toolbarTop + 78;
        let objectX = 32; // Shifted right to match colors row
        const objectButtonSize = 46; // Slightly reduced to fit all objects
        const objectGap = 3; // Very tight gap for objects
        
        // Add all objects
        MOBILE_FAVORITES.objects.forEach((blockType) => {
            const objectItem = PALETTE_OBJECTS.find(o => o.type === blockType);
            if (objectItem) {
                this.createObjectButton(objectX, row2Y, objectButtonSize, objectItem.type, objectItem.label, objectItem.icon);
                objectX += objectButtonSize + objectGap;
            }
        });
        
        // Add small gap before tools
        objectX += 6;
        
        // Add eraser
        this.createFloatingToolIcon(objectX, row2Y, objectButtonSize, 'icon-erase', true, () => {
            if (this.buildToolsEnabled) {
                this.mode = TOOL_MODES.ERASE;
                this.updateButtons();
            }
        });
        objectX += objectButtonSize + objectGap;
        
        // Add clear all
        this.createFloatingToolIcon(objectX, row2Y, objectButtonSize, 'icon-clear', false, () => this.scene.clearWorld());
        
        // No More button on mobile - everything fits!
        
        // Create mode toggle button (View/Edit arrow)
        // Position at header y-coordinate (will be repositioned by GameScene.positionPlayButton())
        // Using a temporary x position - GameScene will calculate the correct position
        const headerY = 32; // Standard header y position
        const tempX = GAME_WIDTH - 60; // Temporary position, will be updated
        this.createModeToggleButton(tempX, headerY, 56); // Smaller size for mobile header
    }

    createDesktopToolbar() {
        // Toolbar layout constants
        const toolbarTop = HEADER_HEIGHT + PLAYABLE_HEIGHT;
        const colorButtonSize = 38; // Smaller for color swatches
        const objectButtonSize = 52; // Reduced from 58 to fit more items
        const gap = 5; // Reduced from 5 to save space
        const startX = 35; // Nudged right to prevent left edge cutoff
        
        // Row 1: Basic colors + Pattern colors (all draggable paint colors)
        const row1Y = toolbarTop + 24;
        // Align color row left edge with scaled image button row below
        // Image buttons (52px) scaled 1.18x = 61.36px visual width
        // Visual left edge of image button at x=35: 35 - 61.36/2 = 4.32px
        // Color button (38px) to align: 4.32 + 38/2 = 23.32px
        const colorRowStartX = 23;
        let colorX = colorRowStartX;
        
        // Add basic colors
        PALETTE_COLORS.forEach((colorItem) => {
            this.createColorButton(colorX, row1Y, colorButtonSize, colorItem.type, colorItem.label, colorItem.color);
            colorX += colorButtonSize + gap;
        });
        
        // Add small visual separator before pattern colors
        colorX += 4;
        
        // Add pattern colors
        PALETTE_PATTERN_COLORS.forEach((colorItem) => {
            this.createPatternColorButton(colorX, row1Y, colorButtonSize, colorItem.type, colorItem.label, colorItem.color, colorItem.pattern);
            colorX += colorButtonSize + gap;
        });
        
        // Row 2: Objects and tools (add more vertical spacing from row 1)
        const row2Y = toolbarTop + 78;
        let objectX = startX;

        // Add objects
        PALETTE_OBJECTS.forEach((objectItem) => {
            this.createObjectButton(objectX, row2Y, objectButtonSize, objectItem.type, objectItem.label, objectItem.icon);
            objectX += objectButtonSize + gap + 1;
        });
        
        // Add visual gap before function buttons
        objectX += 20;
        
        // Add eraser and clear as floating icons (no background boxes)
        this.createFloatingToolIcon(objectX, row2Y, objectButtonSize, 'icon-erase', true, () => {
            if (this.buildToolsEnabled) {
                this.mode = TOOL_MODES.ERASE;
                this.updateButtons();
            }
        });
        objectX += objectButtonSize + gap;
        this.createFloatingToolIcon(objectX, row2Y, objectButtonSize, 'icon-clear', false, () => this.scene.clearWorld());
        objectX += objectButtonSize + gap + 15; // Gap before View button for visual separation
        
        // Mode toggle button (View/Edit) - visually separated as main action, larger size for header
        this.createModeToggleButton(objectX, row2Y, 64);
    }

    createColorButton(x, y, size, toolType, label, color) {
        const button = this.scene.add.container(x, y);
        
        // Colored background
        const bg = this.scene.add.rectangle(0, 0, size, size, color)
            .setStrokeStyle(2, 0x000000)
            .setInteractive({ useHandCursor: true });

        button.add([bg]);
        button.setDepth(1000);

        bg.on('pointerdown', () => {
            // Only allow tool selection if build tools are enabled
            if (this.buildToolsEnabled) {
                this.selectedTool = toolType;
                this.mode = TOOL_MODES.PLACE;
                this.updateButtons();
            }
        });

        this.buttons.push({ container: button, bg, toolType, isErase: false, isAction: false, isPlus: false });
        
        // Highlight default selection
        if (toolType === BLOCK_TYPES.PINK) {
            bg.setStrokeStyle(4, 0xFFFF00);
        }
    }

    createPatternColorButton(x, y, size, toolType, label, color, pattern) {
        const button = this.scene.add.container(x, y);
        
        // Colored background
        const bg = this.scene.add.rectangle(0, 0, size, size, color)
            .setStrokeStyle(2, 0x000000)
            .setInteractive({ useHandCursor: true });

        button.add([bg]);
        
        // Special handling for GLITTER_PINK - add sparkle effect instead of emoji
        if (toolType === BLOCK_TYPES.GLITTER_PINK) {
            // Use scaled-down version of main sparkle effect (scale 0.95 for 38px button vs 40px tile)
            this.scene.addSparkleEffect(button, 0.95);
            // Skip emoji overlay - sparkles identify the block
        } else if (toolType === BLOCK_TYPES.WATER) {
            // Water button - add animated wave lines matching tile appearance
            const btnScale = size / 50; // 38px button vs 50px tile
            
            // Create 2 wave lines
            for (let i = 0; i < 2; i++) {
                const wave = this.scene.add.graphics();
                wave.lineStyle(1.5, 0xFFFFFF, 0.4);
                
                const yOffset = (i - 0.5) * 10 * btnScale;
                // Draw smooth wave using line segments
                wave.beginPath();
                wave.moveTo(-size/2, yOffset);
                for (let x = -size/2; x <= size/2; x += 2) {
                    const phase = (x / size) * Math.PI * 2;
                    const y = yOffset + Math.sin(phase) * 3;
                    wave.lineTo(x, y);
                }
                wave.strokePath();
                
                button.add([wave]);
                
                // Animate wave
                this.scene.tweens.add({
                    targets: wave,
                    alpha: { from: 0.4, to: 0.2 },
                    y: { from: 0, to: -2 },
                    duration: 1200 + i * 200,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
            
            // Add shimmer circle
            const shimmer = this.scene.add.graphics();
            shimmer.lineStyle(1, 0xFFFFFF, 0.3);
            shimmer.strokeCircle(0, 0, 3 * btnScale);
            button.add([shimmer]);
            
            this.scene.tweens.add({
                targets: shimmer,
                alpha: { from: 0.3, to: 0.1 },
                duration: 1400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else {
            // Add pattern emoji overlay for other pattern blocks
            const patternText = this.scene.add.text(0, 0, pattern, {
                fontSize: '20px',
                fontFamily: 'Arial'
            });
            patternText.setOrigin(0.5);
            button.add([patternText]);
        }
        
        button.setDepth(1000);

        bg.on('pointerdown', () => {
            // Only allow tool selection if build tools are enabled
            if (this.buildToolsEnabled) {
                this.selectedTool = toolType;
                this.mode = TOOL_MODES.PLACE;
                this.updateButtons();
            }
        });

        this.buttons.push({ container: button, bg, toolType, isErase: false, isAction: false, isPlus: false, isBuildTool: true });
    }

    createObjectButton(x, y, size, toolType, label, iconKey) {
        const button = this.scene.add.container(x, y);
        
        // Match View Mode grass background
        const bg = this.scene.add.rectangle(0, 0, size, size, 0x97B082)
            .setStrokeStyle(2, 0x000000)
            .setInteractive({ useHandCursor: true });

        button.add([bg]);

        // Add icon
        const icon = this.scene.add.image(0, 0, iconKey);
        icon.setOrigin(0.5, 0.5); // Ensure perfect centering
        const iconSize = size * 0.92;
        const scale = iconSize / Math.max(icon.width, icon.height);
        icon.setScale(scale);
        
        button.add([icon]);
        button.setScale(1.18);
        button.setDepth(1000);

        bg.on('pointerdown', () => {
            // Only allow tool selection if build tools are enabled
            if (this.buildToolsEnabled) {
                this.selectedTool = toolType;
                this.mode = TOOL_MODES.PLACE;
                this.updateButtons();
            }
        });

        this.buttons.push({ container: button, bg, toolType, isErase: false, isAction: false, isPlus: false, isBuildTool: true });
    }

    createEraseButton(x, y, size) {
        const button = this.scene.add.container(x, y);
        
        const bg = this.scene.add.rectangle(0, 0, size, size, 0xFDF7D5)
            .setStrokeStyle(2, 0x000000)
            .setInteractive({ useHandCursor: true });

        const eraserIcon = this.scene.add.image(0, 0, 'icon-erase');
        eraserIcon.setOrigin(0.5, 0.5); // Ensure perfect centering
        const iconSize = size * 0.72;
        const scale = iconSize / Math.max(eraserIcon.width, eraserIcon.height);
        eraserIcon.setScale(scale);

        button.add([bg, eraserIcon]);
        button.setScale(1.18);
        button.setDepth(1000);

        bg.on('pointerdown', () => {
            // Only allow tool selection if build tools are enabled
            if (this.buildToolsEnabled) {
                this.mode = TOOL_MODES.ERASE;
                this.updateButtons();
            }
        });

        this.buttons.push({ container: button, bg, toolType: null, isErase: true, isAction: false, isPlus: false, isBuildTool: true });
    }

    createPlusButton(x, y, size) {
        const button = this.scene.add.container(x, y);
        
        const bg = this.scene.add.rectangle(0, 0, size, size, 0xE8F5E9)
            .setStrokeStyle(2, 0x4CAF50)
            .setInteractive({ useHandCursor: true });

        // Create plus symbol using graphics
        const plusGraphic = this.scene.add.graphics();
        plusGraphic.lineStyle(5, 0x4CAF50, 1);
        
        const plusSize = size * 0.4;
        plusGraphic.beginPath();
        plusGraphic.moveTo(-plusSize/2, 0);
        plusGraphic.lineTo(plusSize/2, 0);
        plusGraphic.moveTo(0, -plusSize/2);
        plusGraphic.lineTo(0, plusSize/2);
        plusGraphic.strokePath();
        
        button.add([bg, plusGraphic]);
        button.setDepth(1000);

        bg.on('pointerdown', () => {
            // Only allow interaction if build tools are enabled
            if (this.buildToolsEnabled) {
                this.scene.modal.showToast('More items coming soon! 🌟');
            }
        });

        this.buttons.push({ container: button, bg, toolType: null, isErase: false, isAction: false, isPlus: true, isBuildTool: true });
    }

    createFloatingToolIcon(x, y, size, iconKey, isEraseTool, callback) {
        const button = this.scene.add.container(x, y);
        
        // Transparent hit area for interaction
        const hitArea = this.scene.add.rectangle(0, 0, size, size)
            .setAlpha(0.01)
            .setInteractive({ useHandCursor: true });
        
        button.add([hitArea]);
        
        // Add icon directly on toolbar background
        const icon = this.scene.add.image(0, 0, iconKey);
        icon.setOrigin(0.5, 0.5);
        const iconSize = size * 0.72;
        const scale = iconSize / Math.max(icon.width, icon.height);
        icon.setScale(scale);
        
        button.add([icon]);
        button.setScale(1.55); // Reduced scale for better tablet fit
        button.setDepth(1000);
        
        // Create tooltip with light pink background and black text
        const tooltipStyle = {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#000000',
            backgroundColor: '#FFB6C1',
            padding: { x: 6, y: 4 }
        };
        
        let tooltipText = '';
        if (iconKey === 'icon-erase') {
            tooltipText = 'Erase';
        } else if (iconKey === 'icon-clear') {
            tooltipText = 'Clear All';
        }
        
        let tooltip = null;
        if (tooltipText) {
            tooltip = this.scene.add.text(0, -35, tooltipText, tooltipStyle);
            tooltip.setOrigin(0.5, 1); // Position above the icon
            tooltip.setVisible(false);
            tooltip.setDepth(2000);
            button.add([tooltip]);
        }
        
        // Subtle hover effect
        hitArea.on('pointerover', () => {
            icon.setScale(scale * 1.1);
            if (tooltip) tooltip.setVisible(true);
        });
        
        hitArea.on('pointerout', () => {
            icon.setScale(scale);
            if (tooltip) tooltip.setVisible(false);
        });
        
        hitArea.on('pointerdown', () => {
            // Quick scale feedback
            icon.setScale(scale * 0.95);
            if (tooltip) tooltip.setVisible(false);
            callback();
            this.scene.time.delayedCall(100, () => {
                icon.setScale(scale);
            });
        });
        
        // Track as erase tool or action tool
        if (isEraseTool) {
            this.buttons.push({ container: button, bg: hitArea, toolType: null, isErase: true, isAction: false, isPlus: false, isBuildTool: true });
        } else {
            this.buttons.push({ container: button, bg: hitArea, toolType: null, isErase: false, isAction: true, isPlus: false });
        }
    }

    createActionButton(x, y, size, iconType, callback) {
        const button = this.scene.add.container(x, y);
        
        const bg = this.scene.add.rectangle(0, 0, size, size, 0xFDF7D5)
            .setStrokeStyle(2, 0x000000)
            .setInteractive({ useHandCursor: true });

        button.add([bg]);

        let iconKey = '';
        if (iconType === 'save') {
            iconKey = 'icon-save';
        } else if (iconType === 'load') {
            iconKey = 'icon-load';
        } else if (iconType === 'clear') {
            iconKey = 'icon-clear';
        } else if (iconType === 'new') {
            iconKey = 'icon-new';
        }

        if (iconKey) {
            const icon = this.scene.add.image(0, 0, iconKey);
            icon.setOrigin(0.5, 0.5); // Ensure perfect centering
            const iconSize = size * 0.72;
            const scale = iconSize / Math.max(icon.width, icon.height);
            icon.setScale(scale);
            
            button.add([icon]);
        }

        button.setScale(1.18);
        button.setDepth(1000);

        bg.on('pointerdown', () => {
            bg.setFillStyle(0xFBC02D);
            callback();
            this.scene.time.delayedCall(100, () => {
                bg.setFillStyle(0xFDF7D5);
            });
        });

        this.buttons.push({ container: button, bg, toolType: null, isErase: false, isAction: true, isPlus: false });
    }

    createModeToggleButton(x, y, size) {
        const button = this.scene.add.container(x, y);
        
        // Invisible background for interactivity - no visible box
        const bg = this.scene.add.rectangle(0, 0, size, size)
            .setAlpha(0.01)
            .setInteractive({ useHandCursor: true });

        button.add([bg]);
        
        // Add icon image that changes based on mode - larger size for prominence
        const icon = this.scene.add.image(0, 0, 'icon-view');
        icon.setOrigin(0.5);
        icon.setInteractive({ useHandCursor: true });
        const scale = MODE_TOGGLE_ICON_SIZE / Math.max(icon.width, icon.height);
        icon.setScale(scale);
        button.add([icon]);
        
        // Create tooltip text (hidden by default) - light pink background with black text
        const tooltip = this.scene.add.text(0, 45, 'View', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#000000',
            backgroundColor: '#FFB6C1',
            padding: { x: 6, y: 4 }
        });
        tooltip.setOrigin(0.5, 0);
        tooltip.setVisible(false);
        tooltip.setDepth(2000);
        button.add([tooltip]);
        
        button.setDepth(1000);

        // Event handler function for toggling mode
        const handleClick = () => {
            // Hide tooltip when clicking
            tooltip.setVisible(false);
            
            // Toggle mode in scene
            this.scene.toggleMode();
            
            // Update icon and tooltip based on mode
            if (this.scene.getGameMode() === GAME_MODES.BUILD) {
                icon.setTexture('icon-view'); // Show View icon in Edit mode
                const scale = MODE_TOGGLE_ICON_SIZE / Math.max(icon.width, icon.height);
                icon.setScale(scale);
                tooltip.setText('View');
            } else {
                icon.setTexture('icon-edit'); // Show Edit icon in View mode
                const scale = MODE_TOGGLE_ICON_SIZE / Math.max(icon.width, icon.height);
                icon.setScale(scale);
                tooltip.setText('Edit');
            }
        };

        // Show tooltip on hover
        const showTooltip = () => tooltip.setVisible(true);
        const hideTooltip = () => tooltip.setVisible(false);

        bg.on('pointerover', showTooltip);
        bg.on('pointerout', hideTooltip);
        bg.on('pointerdown', handleClick);

        icon.on('pointerover', showTooltip);
        icon.on('pointerout', hideTooltip);
        icon.on('pointerdown', handleClick);

        this.modeToggleButton = button;
        this.modeToggleLabel = icon;
        this.modeToggleTooltip = tooltip;
        this.buttons.push({ container: button, bg, toolType: null, isErase: false, isAction: true, isPlus: false });
    }

    createMoreButton(x, y, size) {
        const button = this.scene.add.container(x, y);
        
        // Light purple/lavender background
        const bg = this.scene.add.rectangle(0, 0, size, size, 0xE1BEE7)
            .setStrokeStyle(2, 0x9C27B0)
            .setInteractive({ useHandCursor: true });

        // "More" text or icon
        const moreText = this.scene.add.text(0, 0, 'More', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#000000',
            fontStyle: 'bold'
        });
        moreText.setOrigin(0.5);
        
        button.add([bg, moreText]);
        button.setScale(1.18);
        button.setDepth(1000);

        bg.on('pointerdown', () => {
            if (this.buildToolsEnabled) {
                this.toggleExpandedToolbar();
            }
        });

        this.buttons.push({ container: button, bg, toolType: null, isErase: false, isAction: true, isPlus: false, isMoreButton: true });
    }

    toggleExpandedToolbar() {
        if (this.isExpanded) {
            this.hideExpandedToolbar();
        } else {
            this.showExpandedToolbar();
        }
    }

    showExpandedToolbar() {
        if (this.expandedToolbar) return; // Already showing
        
        this.isExpanded = true;
        
        // Create semi-transparent overlay
        const overlay = this.scene.add.rectangle(GAME_WIDTH / 2, (HEADER_HEIGHT + PLAYABLE_HEIGHT) / 2, GAME_WIDTH, PLAYABLE_HEIGHT, 0x000000, 0.3);
        overlay.setDepth(1999);
        overlay.setInteractive();
        overlay.on('pointerdown', () => this.hideExpandedToolbar());
        
        // Create expanded toolbar container at bottom
        const toolbarY = HEADER_HEIGHT + PLAYABLE_HEIGHT + TOOLBAR_HEIGHT / 2;
        const mainContainer = this.scene.add.container(GAME_WIDTH / 2, toolbarY);
        mainContainer.setDepth(2000);
        
        // Background panel
        const panelWidth = GAME_WIDTH - 20;
        const panelHeight = TOOLBAR_HEIGHT - 10;
        const panel = this.scene.add.rectangle(0, 0, panelWidth, panelHeight, 0xE8F5E9)
            .setStrokeStyle(3, 0x4CAF50);
        mainContainer.add(panel);
        
        // Title
        const title = this.scene.add.text(0, -panelHeight / 2 + 15, 'All Colors & Objects', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        mainContainer.add(title);
        
        // Create scrollable content container
        const contentContainer = this.scene.add.container(0, 0);
        contentContainer.setDepth(2001);
        
        const buttonSize = 32;
        const gap = 4;
        let contentX = 10; // Start with padding
        const row1Y = -10;
        const row2Y = 35;
        
        // Add all colors
        PALETTE_COLORS.forEach((colorItem) => {
            const btn = this.scene.add.rectangle(contentX, row1Y, buttonSize, buttonSize, colorItem.color)
                .setStrokeStyle(2, 0x000000)
                .setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => {
                if (this.buildToolsEnabled) {
                    this.selectedTool = colorItem.type;
                    this.mode = TOOL_MODES.PLACE;
                    this.updateButtons();
                    this.hideExpandedToolbar();
                }
            });
            contentContainer.add(btn);
            contentX += buttonSize + gap;
        });
        
        // Add all pattern colors
        PALETTE_PATTERN_COLORS.forEach((colorItem) => {
            const btn = this.scene.add.rectangle(contentX, row1Y, buttonSize, buttonSize, colorItem.color)
                .setStrokeStyle(2, 0x000000)
                .setInteractive({ useHandCursor: true });
            
            // Add pattern indicator
            if (colorItem.pattern && colorItem.type !== BLOCK_TYPES.WATER && colorItem.type !== BLOCK_TYPES.GLITTER_PINK) {
                const patternText = this.scene.add.text(contentX, row1Y, colorItem.pattern, {
                    fontSize: '14px',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
                contentContainer.add(patternText);
            }
            
            btn.on('pointerdown', () => {
                if (this.buildToolsEnabled) {
                    this.selectedTool = colorItem.type;
                    this.mode = TOOL_MODES.PLACE;
                    this.updateButtons();
                    this.hideExpandedToolbar();
                }
            });
            contentContainer.add(btn);
            contentX += buttonSize + gap;
        });
        
        // Add all objects on second row
        contentX = 10;
        PALETTE_OBJECTS.forEach((objectItem) => {
            const btn = this.scene.add.rectangle(contentX, row2Y, buttonSize, buttonSize, 0x97B082)
                .setStrokeStyle(2, 0x000000)
                .setInteractive({ useHandCursor: true });
            
            // Add icon
            const icon = this.scene.add.image(contentX, row2Y, objectItem.icon);
            const scale = (buttonSize * 0.8) / Math.max(icon.width, icon.height);
            icon.setScale(scale);
            
            btn.on('pointerdown', () => {
                if (this.buildToolsEnabled) {
                    this.selectedTool = objectItem.type;
                    this.mode = TOOL_MODES.PLACE;
                    this.updateButtons();
                    this.hideExpandedToolbar();
                }
            });
            contentContainer.add([btn, icon]);
            contentX += buttonSize + gap;
        });
        
        // Add Eraser and Clear All at end of row 2
        contentX += 10; // Add gap
        
        // Eraser
        const eraserBtn = this.scene.add.rectangle(contentX, row2Y, buttonSize, buttonSize, 0xFDF7D5)
            .setStrokeStyle(2, 0x000000)
            .setInteractive({ useHandCursor: true });
        const eraserIcon = this.scene.add.image(contentX, row2Y, 'icon-erase');
        eraserIcon.setScale((buttonSize * 0.7) / Math.max(eraserIcon.width, eraserIcon.height));
        eraserBtn.on('pointerdown', () => {
            if (this.buildToolsEnabled) {
                this.mode = TOOL_MODES.ERASE;
                this.updateButtons();
                this.hideExpandedToolbar();
            }
        });
        contentContainer.add([eraserBtn, eraserIcon]);
        contentX += buttonSize + gap;
        
        // Clear All
        const clearBtn = this.scene.add.rectangle(contentX, row2Y, buttonSize, buttonSize, 0xFDF7D5)
            .setStrokeStyle(2, 0x000000)
            .setInteractive({ useHandCursor: true });
        const clearIcon = this.scene.add.image(contentX, row2Y, 'icon-clear');
        clearIcon.setScale((buttonSize * 0.7) / Math.max(clearIcon.width, clearIcon.height));
        clearBtn.on('pointerdown', () => {
            this.scene.clearWorld();
            this.hideExpandedToolbar();
        });
        contentContainer.add([clearBtn, clearIcon]);
        contentX += buttonSize + gap;
        
        const contentWidth = contentX;
        
        // Create scrollable area if content is wider than panel
        const scrollableWidth = panelWidth - 40; // Leave padding
        
        if (contentWidth > scrollableWidth) {
            // Content needs scrolling
            // Create mask for visible area
            const maskShape = this.scene.make.graphics();
            maskShape.fillStyle(0xffffff);
            maskShape.fillRect(-scrollableWidth / 2, -panelHeight / 2 + 30, scrollableWidth, panelHeight - 40);
            const mask = maskShape.createGeometryMask();
            contentContainer.setMask(mask);
            
            // Position content container initially centered if smaller, or left-aligned if needs scrolling
            contentContainer.x = -contentWidth / 2 + scrollableWidth / 2;
            
            // Make content draggable for horizontal scrolling
            contentContainer.setInteractive(
                new Phaser.Geom.Rectangle(-contentWidth / 2, -panelHeight / 2, contentWidth, panelHeight),
                Phaser.Geom.Rectangle.Contains
            );
            
            this.scene.input.setDraggable(contentContainer);
            
            let dragStartX = 0;
            let containerStartX = contentContainer.x;
            
            contentContainer.on('dragstart', (pointer) => {
                dragStartX = pointer.x;
                containerStartX = contentContainer.x;
            });
            
            contentContainer.on('drag', (pointer) => {
                const dragDeltaX = pointer.x - dragStartX;
                let newX = containerStartX + dragDeltaX;
                
                // Constrain to bounds
                const minX = -contentWidth / 2 + scrollableWidth / 2;
                const maxX = contentWidth / 2 - scrollableWidth / 2;
                newX = Phaser.Math.Clamp(newX, minX, maxX);
                
                contentContainer.x = newX;
            });
            
            mainContainer.add([maskShape, contentContainer]);
            
            // Add scroll indicators
            const leftArrow = this.scene.add.text(-scrollableWidth / 2 - 15, 0, '◀', {
                fontSize: '20px',
                color: '#4CAF50'
            }).setOrigin(0.5).setAlpha(0.6);
            const rightArrow = this.scene.add.text(scrollableWidth / 2 + 15, 0, '▶', {
                fontSize: '20px',
                color: '#4CAF50'
            }).setOrigin(0.5).setAlpha(0.6);
            mainContainer.add([leftArrow, rightArrow]);
        } else {
            // Content fits, no scrolling needed - center it
            contentContainer.x = -contentWidth / 2;
            mainContainer.add(contentContainer);
        }
        
        // Store reference
        this.expandedToolbar = { overlay, container: mainContainer };
    }

    hideExpandedToolbar() {
        if (!this.expandedToolbar) return;
        
        this.isExpanded = false;
        
        if (this.expandedToolbar.overlay) {
            this.expandedToolbar.overlay.destroy();
        }
        if (this.expandedToolbar.container) {
            this.expandedToolbar.container.destroy();
        }
        
        this.expandedToolbar = null;
    }

    setVisible(visible) {
        // Show or hide all toolbar buttons
        this.buttons.forEach(btn => {
            btn.container.setVisible(visible);
        });
        
        // When making toolbar visible again, ensure mode button shows correct state
        if (visible && this.modeToggleLabel) {
            this.updateModeButtonState();
        }
    }
    
    /**
     * Update mode toggle button to show correct icon for current game mode
     */
    updateModeButtonState() {
        if (!this.modeToggleLabel) return;
        
        // In Build mode, show View icon
        // In View mode, show Edit icon
        if (this.scene.getGameMode() === GAME_MODES.BUILD) {
            this.modeToggleLabel.setTexture('icon-view');
            const scale = MODE_TOGGLE_ICON_SIZE / Math.max(this.modeToggleLabel.width, this.modeToggleLabel.height);
            this.modeToggleLabel.setScale(scale);
            if (this.modeToggleTooltip) {
                this.modeToggleTooltip.setText('View');
            }
        } else {
            this.modeToggleLabel.setTexture('icon-edit');
            const scale = MODE_TOGGLE_ICON_SIZE / Math.max(this.modeToggleLabel.width, this.modeToggleLabel.height);
            this.modeToggleLabel.setScale(scale);
            if (this.modeToggleTooltip) {
                this.modeToggleTooltip.setText('Edit');
            }
        }
    }

    setToolsEnabled(enabled) {
        this.buildToolsEnabled = enabled;
        
        // Update visual state of all build tools
        this.buttons.forEach(btn => {
            if (btn.isBuildTool) {
                if (enabled) {
                    // Restore normal appearance
                    btn.container.setAlpha(1.0);
                    btn.bg.setInteractive({ useHandCursor: true });
                } else {
                    // Dim and disable appearance
                    btn.container.setAlpha(0.4);
                    btn.bg.disableInteractive();
                }
            }
        });
    }

    updateButtons() {
        this.buttons.forEach(btn => {
            if (btn.isAction || btn.isPlus) {
                // Action and plus buttons don't change selection state
                return;
            }
            
            if (btn.isErase) {
                // Highlight erase button when active
                if (this.mode === TOOL_MODES.ERASE) {
                    btn.bg.setStrokeStyle(3, 0xFFFF00);
                    btn.container.setDepth(1001); // Bring to front
                } else {
                    btn.bg.setStrokeStyle(2, 0x000000);
                    btn.container.setDepth(1000); // Normal depth
                }
            } else {
                // Highlight selected tool
                const isSelected = this.mode === TOOL_MODES.PLACE && this.selectedTool === btn.toolType;
                if (isSelected) {
                    // Reduced stroke width to minimize overlap with adjacent buttons
                    btn.bg.setStrokeStyle(3, 0xFFFF00);
                    btn.container.setDepth(1001); // Bring to front so border shows on top
                } else {
                    btn.bg.setStrokeStyle(2, 0x000000);
                    btn.container.setDepth(1000); // Normal depth
                }
            }
        });
    }

    getSelectedTool() {
        return this.selectedTool;
    }

    getMode() {
        return this.mode;
    }

    setupResizeListener() {
        this.resizeHandler = () => {
            // Debounce resize events (150ms)
            if (this.resizeTimeoutId) {
                clearTimeout(this.resizeTimeoutId);
            }
            this.resizeTimeoutId = setTimeout(() => {
                this.refreshResponsiveLayout();
            }, 150);
        };
        
        window.addEventListener('resize', this.resizeHandler);
    }

    refreshResponsiveLayout() {
        const currentMobileView = isMobileView();
        
        // If layout mode hasn't changed, do nothing
        if (currentMobileView === this.isMobileLayout) {
            // But still reposition the input in case scale changed
            if (this.scene && this.scene.positionWorldNameField) {
                this.scene.positionWorldNameField();
            }
            return;
        }
        
        // Hide/destroy expanded toolbar if open
        if (this.isExpanded) {
            this.hideExpandedToolbar();
        }
        
        // Destroy existing toolbar buttons and containers
        this.buttons.forEach(btn => {
            if (btn.container) {
                btn.container.destroy();
            }
        });
        
        // Clear buttons array
        this.buttons = [];
        
        // Reset mode toggle references
        this.modeToggleButton = null;
        this.modeToggleLabel = null;
        this.modeToggleTooltip = null;
        
        // Update layout mode
        this.isMobileLayout = currentMobileView;
        
        // Rebuild toolbar with new layout
        this.createToolbar();
        
        // Reposition world name input to account for any scale changes
        if (this.scene && this.scene.positionWorldNameField) {
            this.scene.positionWorldNameField();
        }
    }

    destroy() {
        // Clean up resize listener
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
        
        // Clear debounce timeout
        if (this.resizeTimeoutId) {
            clearTimeout(this.resizeTimeoutId);
            this.resizeTimeoutId = null;
        }
        
        // Hide expanded toolbar if open
        if (this.isExpanded) {
            this.hideExpandedToolbar();
        }
        
        // Destroy all buttons
        this.buttons.forEach(btn => {
            if (btn.container) {
                btn.container.destroy();
            }
        });
        
        this.buttons = [];
    }
}
