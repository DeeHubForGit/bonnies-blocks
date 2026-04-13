import { BLOCK_TYPES, TOOL_MODES, BLOCK_COLORS, PLAYABLE_HEIGHT, TOOLBAR_HEIGHT, GAME_WIDTH, HEADER_HEIGHT, PALETTE_COLORS, PALETTE_PATTERN_COLORS, PALETTE_OBJECTS, isColorBlock, hasPattern, getPattern } from '../data/constants.js';

export class Toolbar {
    constructor(scene) {
        this.scene = scene;
        this.selectedTool = BLOCK_TYPES.PINK;
        this.mode = TOOL_MODES.PLACE;
        this.buttons = [];
        
        this.createToolbar();
    }

    createToolbar() {
        // Toolbar layout constants
        const toolbarTop = HEADER_HEIGHT + PLAYABLE_HEIGHT;
        const colorButtonSize = 38; // Smaller for color swatches
        const objectButtonSize = 58; // Larger for objects/tools
        const gap = 6;
        const startX = 25; // Reduced to fit more colors
        
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
        
        // Row 2: Objects and tools (centered vertically in bottom half of toolbar)
        const row2Y = toolbarTop + 80;
        let objectX = startX;
        
        // Add objects
        PALETTE_OBJECTS.forEach((objectItem) => {
            this.createObjectButton(objectX, row2Y, objectButtonSize, objectItem.type, objectItem.label, objectItem.icon);
            objectX += objectButtonSize + gap;
        });
        
        // Add eraser
        this.createEraseButton(objectX, row2Y, objectButtonSize);
        objectX += objectButtonSize + gap;
        
        // Add plus button for future expansion
        this.createPlusButton(objectX, row2Y, objectButtonSize);
        objectX += objectButtonSize + gap + 10; // Extra gap before action buttons
        
        // Action buttons (save, load, clear)
        this.createActionButton(objectX, row2Y, objectButtonSize, 'save', () => this.scene.saveWorld());
        objectX += objectButtonSize + gap;
        this.createActionButton(objectX, row2Y, objectButtonSize, 'load', () => this.scene.loadWorld());
        objectX += objectButtonSize + gap;
        this.createActionButton(objectX, row2Y, objectButtonSize, 'clear', () => this.scene.clearWorld());
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
            this.selectedTool = toolType;
            this.mode = TOOL_MODES.PLACE;
            this.updateButtons();
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
        
        // Add pattern emoji overlay
        const patternText = this.scene.add.text(0, 0, pattern, {
            fontSize: '20px',
            fontFamily: 'Arial'
        });
        patternText.setOrigin(0.5);
        
        button.add([patternText]);
        button.setDepth(1000);

        bg.on('pointerdown', () => {
            this.selectedTool = toolType;
            this.mode = TOOL_MODES.PLACE;
            this.updateButtons();
        });

        this.buttons.push({ container: button, bg, toolType, isErase: false, isAction: false, isPlus: false });
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
        const iconSize = size * 0.75;
        const scale = iconSize / Math.max(icon.width, icon.height);
        icon.setScale(scale);
        
        button.add([icon]);
        button.setDepth(1000);

        bg.on('pointerdown', () => {
            this.selectedTool = toolType;
            this.mode = TOOL_MODES.PLACE;
            this.updateButtons();
        });

        this.buttons.push({ container: button, bg, toolType, isErase: false, isAction: false, isPlus: false });
    }

    createEraseButton(x, y, size) {
        const button = this.scene.add.container(x, y);
        
        const bg = this.scene.add.rectangle(0, 0, size, size, 0xffffff)
            .setStrokeStyle(2, 0x000000)
            .setInteractive({ useHandCursor: true });

        const eraserIcon = this.scene.add.image(0, 0, 'icon-erase');
        const iconSize = size * 0.75;
        const scale = iconSize / Math.max(eraserIcon.width, eraserIcon.height);
        eraserIcon.setScale(scale);

        button.add([bg, eraserIcon]);
        button.setDepth(1000);

        bg.on('pointerdown', () => {
            this.mode = TOOL_MODES.ERASE;
            this.updateButtons();
        });

        this.buttons.push({ container: button, bg, toolType: null, isErase: true, isAction: false, isPlus: false });
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
            this.scene.modal.showToast('More items coming soon! 🌟');
        });

        this.buttons.push({ container: button, bg, toolType: null, isErase: false, isAction: false, isPlus: true });
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
            const iconSize = size * 0.75;
            const scale = iconSize / Math.max(icon.width, icon.height);
            icon.setScale(scale);
            
            button.add([icon]);
        }

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

    updateButtons() {
        this.buttons.forEach(btn => {
            if (btn.isAction || btn.isPlus) {
                // Action and plus buttons don't change state
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
