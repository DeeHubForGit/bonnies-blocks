import { BLOCK_TYPES, TOOL_MODES, GAME_MODES, BLOCK_COLORS, PLAYABLE_HEIGHT, TOOLBAR_HEIGHT, GAME_WIDTH, HEADER_HEIGHT, PALETTE_COLORS, PALETTE_PATTERN_COLORS, PALETTE_OBJECTS, isColorBlock, hasPattern, getPattern } from '../data/constants.js';

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
        const gap = 5; // Reduced from 6 to save space
        const startX = 35; // Nudged right to prevent left edge cutoff
        
        // Row 1: Basic colors + Pattern colors (all draggable paint colors)
        const row1Y = toolbarTop + 28;
        let colorX = startX;
        
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
            objectX += objectButtonSize + gap;
        });
        
        // Add visual gap before function buttons
        objectX += 20;
        
        // Add eraser
        this.createEraseButton(objectX, row2Y, objectButtonSize);
        objectX += objectButtonSize + gap + 5; // Reduced gap before action buttons
        
        // Action buttons (save, load, clear)
        this.createActionButton(objectX, row2Y, objectButtonSize, 'save', () => this.scene.saveWorld());
        objectX += objectButtonSize + gap;
        this.createActionButton(objectX, row2Y, objectButtonSize, 'load', () => this.scene.loadWorld());
        objectX += objectButtonSize + gap;
        this.createActionButton(objectX, row2Y, objectButtonSize, 'clear', () => this.scene.clearWorld());
        objectX += objectButtonSize + gap + 5; // Reduced gap before mode toggle
        
        // Mode toggle button (Explore/Build)
        this.createModeToggleButton(objectX, row2Y, objectButtonSize);
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
        
        // White background for objects
        const bg = this.scene.add.rectangle(0, 0, size, size, 0xFFFFFF)
            .setStrokeStyle(2, 0x000000)
            .setInteractive({ useHandCursor: true });

        button.add([bg]);

        // Add icon
        const icon = this.scene.add.image(0, 0, iconKey);
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
        
        const bg = this.scene.add.rectangle(0, 0, size, size, 0xffffff)
            .setStrokeStyle(2, 0x000000)
            .setInteractive({ useHandCursor: true });

        const eraserIcon = this.scene.add.image(0, 0, 'icon-erase');
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

    createActionButton(x, y, size, iconType, callback) {
        const button = this.scene.add.container(x, y);
        
        const bg = this.scene.add.rectangle(0, 0, size, size, 0xf5f5f5)
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
        }

        if (iconKey) {
            const icon = this.scene.add.image(0, 0, iconKey);
            const iconSize = size * 0.72;
            const scale = iconSize / Math.max(icon.width, icon.height);
            icon.setScale(scale);
            
            button.add([icon]);
        }

        button.setScale(1.18);
        button.setDepth(1000);

        bg.on('pointerdown', () => {
            bg.setFillStyle(0xe0e0e0);
            callback();
            this.scene.time.delayedCall(100, () => {
                bg.setFillStyle(0xf5f5f5);
            });
        });

        this.buttons.push({ container: button, bg, toolType: null, isErase: false, isAction: true, isPlus: false });
    }

    createModeToggleButton(x, y, size) {
        const button = this.scene.add.container(x, y);
        
        // Match styling of other toolbar buttons
        const bg = this.scene.add.rectangle(0, 0, size, size, 0xf5f5f5)
            .setStrokeStyle(2, 0x000000)
            .setInteractive({ useHandCursor: true });

        button.add([bg]);
        
        // Add icon label that changes based on mode
        // Use large, clear icons for young children who cannot read
        const label = this.scene.add.text(0, 0, '▶', {
            fontSize: '28px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#000000'
        });
        label.setOrigin(0.5);
        button.add([label]);
        
        // Create tooltip text (hidden by default)
        const tooltip = this.scene.add.text(0, -30, 'Play Mode', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            backgroundColor: '#333333',
            padding: { x: 6, y: 4 }
        });
        tooltip.setOrigin(0.5);
        tooltip.setVisible(false);
        tooltip.setDepth(2000);
        button.add([tooltip]);
        
        button.setScale(1.18);
        button.setDepth(1000);

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
            
            // Toggle mode in scene
            this.scene.toggleMode();
            
            // Update icon and tooltip based on mode
            if (this.scene.getGameMode() === GAME_MODES.BUILD) {
                label.setText('▶'); // Show Play icon in Edit mode
                tooltip.setText('Play Mode');
            } else {
                label.setText('✏'); // Show Edit icon in Play mode
                tooltip.setText('Edit Mode');
            }
            
            // Visual feedback
            bg.setFillStyle(0xe0e0e0);
            this.scene.time.delayedCall(100, () => {
                bg.setFillStyle(0xf5f5f5);
            });
        });

        this.modeToggleButton = button;
        this.modeToggleLabel = label;
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
        
        // In Build mode, show Play icon (▶)
        // In Play mode, show Edit icon (✏)
        if (this.scene.getGameMode() === GAME_MODES.BUILD) {
            this.modeToggleLabel.setText('▶');
            if (this.modeToggleTooltip) {
                this.modeToggleTooltip.setText('Play Mode');
            }
        } else {
            this.modeToggleLabel.setText('✏');
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
                    btn.bg.setStrokeStyle(4, 0xFFFF00);
                } else {
                    btn.bg.setStrokeStyle(2, 0x000000);
                }
            } else {
                // Highlight selected tool
                const isSelected = this.mode === TOOL_MODES.PLACE && this.selectedTool === btn.toolType;
                if (isSelected) {
                    btn.bg.setStrokeStyle(4, 0xFFFF00);
                } else {
                    btn.bg.setStrokeStyle(2, 0x000000);
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
