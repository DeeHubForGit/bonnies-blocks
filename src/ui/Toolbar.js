import { BLOCK_TYPES, TOOL_MODES, GAME_MODES, BLOCK_COLORS, PLAYABLE_HEIGHT, TOOLBAR_HEIGHT, GAME_WIDTH, HEADER_HEIGHT, PALETTE_COLORS, PALETTE_PATTERN_COLORS, PALETTE_OBJECTS, isColorBlock, hasPattern, getPattern } from '../data/constants.js';

// Mode toggle icon size constant (used for both Play and Edit arrows)
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
        
        this.createToolbar();
    }

    createToolbar() {
        // Toolbar layout constants
        const toolbarTop = HEADER_HEIGHT + PLAYABLE_HEIGHT;
        const colorButtonSize = 38; // Smaller for color swatches
        const objectButtonSize = 52; // Reduced from 58 to fit more items
        const gap = 5; // Reduced from 5 to save space
        const startX = 35; // Nudged right to prevent left edge cutoff
        
        // Row 1: Basic colors + Pattern colors (all draggable paint colors)
        const row1Y = toolbarTop + 28;
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
        const row2Y = toolbarTop + 86;
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
        objectX += objectButtonSize + gap + 15; // Gap before Play button for visual separation
        
        // Mode toggle button (Play/Edit) - visually separated as main action, larger size for header
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
        
        // Match Play Mode grass background
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
        button.setScale(1.18);
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
        const icon = this.scene.add.image(0, 0, 'icon-play');
        icon.setOrigin(0.5);
        icon.setInteractive({ useHandCursor: true });
        const scale = MODE_TOGGLE_ICON_SIZE / Math.max(icon.width, icon.height);
        icon.setScale(scale);
        button.add([icon]);
        
        // Create tooltip text (hidden by default) - light pink background with black text
        const tooltip = this.scene.add.text(0, 45, 'Play Mode', {
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
                icon.setTexture('icon-play'); // Show Play icon in Edit mode
                const scale = MODE_TOGGLE_ICON_SIZE / Math.max(icon.width, icon.height);
                icon.setScale(scale);
                tooltip.setText('Play Mode');
            } else {
                icon.setTexture('icon-edit'); // Show Edit icon in Play mode
                const scale = MODE_TOGGLE_ICON_SIZE / Math.max(icon.width, icon.height);
                icon.setScale(scale);
                tooltip.setText('Edit Mode');
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
        
        // In Build mode, show Play icon
        // In Play mode, show Edit icon
        if (this.scene.getGameMode() === GAME_MODES.BUILD) {
            this.modeToggleLabel.setTexture('icon-play');
            const scale = MODE_TOGGLE_ICON_SIZE / Math.max(this.modeToggleLabel.width, this.modeToggleLabel.height);
            this.modeToggleLabel.setScale(scale);
            if (this.modeToggleTooltip) {
                this.modeToggleTooltip.setText('Play Mode');
            }
        } else {
            this.modeToggleLabel.setTexture('icon-edit');
            const scale = MODE_TOGGLE_ICON_SIZE / Math.max(this.modeToggleLabel.width, this.modeToggleLabel.height);
            this.modeToggleLabel.setScale(scale);
            if (this.modeToggleTooltip) {
                this.modeToggleTooltip.setText('Edit Mode');
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
}
