import { BLOCK_TYPES, TOOL_MODES, BLOCK_COLORS, PLAYABLE_HEIGHT, TOOLBAR_HEIGHT, GAME_WIDTH } from '../data/constants.js';

export class Toolbar {
    constructor(scene) {
        this.scene = scene;
        this.selectedTool = BLOCK_TYPES.PINK;
        this.mode = TOOL_MODES.PLACE;
        this.buttons = [];
        
        this.createToolbar();
    }

    createToolbar() {
        // Position toolbar in the dedicated toolbar area at bottom
        const toolbarY = PLAYABLE_HEIGHT + 40; // Centered in toolbar area
        const startX = 50;
        const buttonSize = 60; // Larger square buttons for better readability
        const gap = 10;

        // Tool buttons
        const tools = [
            { type: BLOCK_TYPES.GRASS, label: 'Grass' },
            { type: BLOCK_TYPES.PINK, label: 'Pink' },
            { type: BLOCK_TYPES.BLUE, label: 'Blue' },
            { type: BLOCK_TYPES.YELLOW, label: 'Yellow' },
            { type: BLOCK_TYPES.PURPLE, label: 'Purple' },
            { type: BLOCK_TYPES.BUNNY, label: 'Bunny' }
        ];

        tools.forEach((tool, index) => {
            const x = startX + (buttonSize + gap) * index;
            this.createToolButton(x, toolbarY, buttonSize, tool.type, tool.label);
        });

        // Erase button
        const eraseX = startX + (buttonSize + gap) * tools.length + gap * 2;
        this.createEraseButton(eraseX, toolbarY, buttonSize);

        // Action buttons
        const actionX = eraseX + buttonSize + gap * 2;
        this.createActionButton(actionX, toolbarY, buttonSize, 'save', () => this.scene.saveWorld());
        this.createActionButton(actionX + buttonSize + gap, toolbarY, buttonSize, 'load', () => this.scene.loadWorld());
        this.createActionButton(actionX + (buttonSize + gap) * 2, toolbarY, buttonSize, 'clear', () => this.scene.clearWorld());
    }

    createToolButton(x, y, size, toolType, label) {
        const button = this.scene.add.container(x, y);
        
        // Background with border - use colored background for block types, white for bunny
        let bgColor = 0xffffff; // Default white
        if (toolType !== BLOCK_TYPES.BUNNY) {
            bgColor = BLOCK_COLORS[toolType]; // Use block color for background
        }
        
        const bg = this.scene.add.rectangle(0, 0, size, size, bgColor)
            .setStrokeStyle(3, 0x000000)
            .setInteractive({ useHandCursor: true });

        button.add([bg]);

        if (toolType === BLOCK_TYPES.BUNNY) {
            // Use bunny image icon
            const bunnyIcon = this.scene.add.image(0, 0, 'icon-bunny');
            
            // Scale to fit button with padding (larger for better readability)
            const iconSize = size * 0.75; // 75% of button size
            const scale = iconSize / Math.max(bunnyIcon.width, bunnyIcon.height);
            bunnyIcon.setScale(scale);
            
            button.add([bunnyIcon]);
        }

        button.setDepth(1000);

        bg.on('pointerdown', () => {
            this.selectedTool = toolType;
            this.mode = TOOL_MODES.PLACE;
            this.updateButtons();
        });

        this.buttons.push({ container: button, bg, toolType, isErase: false, isAction: false });
        
        if (toolType === BLOCK_TYPES.PINK) {
            bg.setStrokeStyle(5, 0xFFFF00); // Highlight default selection
        }
    }

    createEraseButton(x, y, size) {
        const button = this.scene.add.container(x, y);
        
        const bg = this.scene.add.rectangle(0, 0, size, size, 0xffffff)
            .setStrokeStyle(3, 0x000000)
            .setInteractive({ useHandCursor: true });

        // Use eraser image icon
        const eraserIcon = this.scene.add.image(0, 0, 'icon-erase');
        
        // Scale to fit button with padding (larger for better readability)
        const iconSize = size * 0.75; // 75% of button size
        const scale = iconSize / Math.max(eraserIcon.width, eraserIcon.height);
        eraserIcon.setScale(scale);

        button.add([bg, eraserIcon]);
        button.setDepth(1000);

        bg.on('pointerdown', () => {
            this.mode = TOOL_MODES.ERASE;
            this.updateButtons();
        });

        this.buttons.push({ container: button, bg, toolType: null, isErase: true, isAction: false });
    }

    createActionButton(x, y, size, iconType, callback) {
        const button = this.scene.add.container(x, y);
        
        const bg = this.scene.add.rectangle(0, 0, size, size, 0xf5f5f5)
            .setStrokeStyle(3, 0x000000)
            .setInteractive({ useHandCursor: true });

        button.add([bg]);

        // Use image icons for action buttons
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
            
            // Scale to fit button with padding (larger for better readability)
            const iconSize = size * 0.75; // 75% of button size
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

        this.buttons.push({ container: button, bg, toolType: null, isErase: false, isAction: true });
    }

    updateButtons() {
        this.buttons.forEach(btn => {
            if (btn.isAction) {
                // Action buttons don't change state
                return;
            }
            
            if (btn.isErase) {
                // Highlight erase button with yellow border when active
                if (this.mode === TOOL_MODES.ERASE) {
                    btn.bg.setStrokeStyle(5, 0xFFFF00);
                } else {
                    btn.bg.setStrokeStyle(3, 0x000000);
                }
            } else {
                // Highlight selected tool with yellow border
                const isSelected = this.mode === TOOL_MODES.PLACE && this.selectedTool === btn.toolType;
                if (isSelected) {
                    btn.bg.setStrokeStyle(5, 0xFFFF00);
                } else {
                    btn.bg.setStrokeStyle(3, 0x000000);
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
