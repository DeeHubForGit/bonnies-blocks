import { GAME_WIDTH, GAME_HEIGHT } from '../data/constants.js';

/**
 * Reusable modal system for dialogs and messages
 */
export class Modal {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.onClose = null;
        this.wheelListener = null;
    }

    /**
     * Show a toast notification (small temporary message)
     */
    showToast(message, duration = 2000) {
        const toast = this.scene.add.container(GAME_WIDTH / 2, 95);
        
        const toastWidth = 430;
        const toastHeight = 56;
        const bg = this.scene.add.rectangle(0, 0, toastWidth, toastHeight, 0xFFB6C1, 0.95);
        bg.setStrokeStyle(3, 0xFFFFFF);
        bg.setDisplaySize(toastWidth, toastHeight);
        
        const text = this.scene.add.text(0, 0, message, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#000000',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 390 }
        }).setOrigin(0.5);

        toast.add([bg, text]);
        toast.setDepth(3000);

        // Fade in
        toast.setAlpha(0);
        this.scene.tweens.add({
            targets: toast,
            alpha: 1,
            duration: 200,
            ease: 'Power2'
        });

        // Fade out and destroy
        this.scene.time.delayedCall(duration, () => {
            this.scene.tweens.add({
                targets: toast,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => toast.destroy()
            });
        });
    }

    /**
     * Show a confirmation dialog with Cancel and Confirm buttons
     */
    showConfirmDialog(title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', onCancel = null) {
        this.createModalBase();

        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;

        // Title
        const titleText = this.scene.add.text(centerX, centerY - 90, title, {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Message
        const messageText = this.scene.add.text(centerX, centerY - 20, message, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#333333',
            align: 'center',
            wordWrap: { width: 350 },
            lineSpacing: 8
        }).setOrigin(0.5);

        // Buttons
        const buttonY = centerY + 70;
        const cancelBtn = this.createButton(centerX - 80, buttonY, cancelText, 0xe0e0e0, () => {
            this.close();
            if (onCancel) onCancel();
        });

        const confirmBtn = this.createButton(centerX + 80, buttonY, confirmText, 0xFFB6C1, () => {
            this.close();
            if (onConfirm) onConfirm();
        });

        this.container.add([titleText, messageText, cancelBtn, confirmBtn]);
    }

    /**
     * Show an input dialog with a text field
     */
    showInputDialog(title, placeholder, defaultValue, onConfirm) {
        this.createModalBase();

        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;

        // Title
        const titleText = this.scene.add.text(centerX, centerY - 180, title, {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add girl-boy-name image under title
        const childImage = this.scene.add.image(centerX, centerY - 75, 'girl-boy-name');
        childImage.setOrigin(0.5);
        childImage.setDisplaySize(240, 150);

        // Track input value
        let inputValue = defaultValue || '';

        // Create HTML input element for actual text entry
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.value = inputValue;
        inputElement.placeholder = placeholder;
        inputElement.style.position = 'absolute';
        
        // Position relative to canvas - moved down to accommodate image
        const rect = this.scene.game.canvas.getBoundingClientRect();
        inputElement.style.left = rect.left + (GAME_WIDTH / 2 - 150) + 'px';
        inputElement.style.top = rect.top + (GAME_HEIGHT / 2 + 30 - 22.5) + 'px';
        
        inputElement.style.width = '300px';
        inputElement.style.height = '45px';
        inputElement.style.fontSize = '20px';
        inputElement.style.textAlign = 'center';
        inputElement.style.border = '2px solid #FFB6C1';
        inputElement.style.borderRadius = '6px';
        inputElement.style.background = '#ffffff';
        inputElement.style.outline = 'none';
        inputElement.style.zIndex = '4000';
        document.body.appendChild(inputElement);
        inputElement.focus();
        inputElement.select();

        // Set flag to prevent game keyboard handling
        this.scene.isTextInputOpen = true;

        // Stop keyboard event propagation to prevent game interference
        inputElement.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });
        
        inputElement.addEventListener('keyup', (e) => {
            e.stopPropagation();
        });

        // Update input value as user types
        inputElement.addEventListener('input', (e) => {
            inputValue = e.target.value;
        });

        // Buttons with icons
        const buttonY = centerY + 120;
        const cancelBtn = this.createIconButton(centerX - 100, buttonY, 'Cancel', 0xe0e0e0, 'icon-cancel', () => {
            this.scene.isTextInputOpen = false;
            document.body.removeChild(inputElement);
            this.close();
        });

        const saveBtn = this.createIconButton(centerX + 100, buttonY, 'Save', 0xFFB6C1, 'icon-save', () => {
            this.scene.isTextInputOpen = false;
            document.body.removeChild(inputElement);
            this.close();
            if (onConfirm && inputValue.trim()) {
                onConfirm(inputValue.trim());
            }
        });

        // Allow Enter key to save
        inputElement.addEventListener('keypress', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter' && inputValue.trim()) {
                this.scene.isTextInputOpen = false;
                document.body.removeChild(inputElement);
                this.close();
                if (onConfirm) onConfirm(inputValue.trim());
            }
        });

        this.container.add([titleText, childImage, cancelBtn, saveBtn]);
    }

    /**
     * Show a list selection dialog
     */
    showListDialog(title, items, onSelect, emptyMessage = 'No items available') {
        this.hideWorldNameInput();
        
        if (this.container) {
            this.container.destroy();
        }

        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(3000);

        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;

        // Semi-transparent overlay
        const overlay = this.scene.add.rectangle(
            centerX,
            centerY,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x000000,
            0.7
        );
        overlay.setInteractive();

        // Larger custom modal panel
        const panelWidth = 620;
        const panelHeight = 560;
        const panelX = centerX - panelWidth / 2;
        const panelY = centerY - panelHeight / 2;
        
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xFFD6E8, 0.98);
        graphics.fillRoundedRect(
            panelX,
            panelY,
            panelWidth,
            panelHeight,
            20
        );
        graphics.lineStyle(4, 0xFFFFFF, 1);
        graphics.strokeRoundedRect(
            panelX,
            panelY,
            panelWidth,
            panelHeight,
            20
        );

        // Title
        const titleText = this.scene.add.text(centerX, centerY - 220, title, {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Load world illustration
        const loadImage = this.scene.add.image(centerX, centerY - 130, 'load-world-image');
        const maxImageWidth = 420;
        const maxImageHeight = 150;
        const imageScale = Math.min(maxImageWidth / loadImage.width, maxImageHeight / loadImage.height);
        loadImage.setScale(imageScale);

        // Instruction text
        const instructionText = this.scene.add.text(centerX, centerY - 35, 'Choose a saved world to load\ninto your current world.', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#333333',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);

        this.container.add([overlay, graphics, titleText, loadImage, instructionText]);

        if (items.length === 0) {
            // Empty state
            const emptyText = this.scene.add.text(centerX, centerY + 35, emptyMessage, {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#333333',
                align: 'center',
                wordWrap: { width: 500 }
            }).setOrigin(0.5);

            const closeBtn = this.createIconButton(centerX, centerY + 220, 'Cancel', 0xe0e0e0, 'icon-cancel', () => {
                this.close();
            });

            this.container.add([emptyText, closeBtn]);
        } else {
            // Scrollable list items - define layout constants
            const listCenterX = centerX;
            const listTopY = centerY + 10;
            const itemHeight = 55;
            const visibleItems = 3;
            const contentTopPadding = 10;
            const contentBottomPadding = 10;
            // Visible height: show exactly 3 items with padding, prevent 4th item from peeking
            const listHeight = contentTopPadding + (visibleItems * itemHeight) - 5;
            const listWidth = 440;
            const scrollbarGap = 12;
            const scrollbarWidth = 10;
            const scrollbarX = listCenterX + (listWidth / 2) + scrollbarGap + (scrollbarWidth / 2);
            const itemRectHeight = 45;
            const itemButtonWidth = 420;

            console.log(`[Modal] Rendering ${items.length} saved worlds`);

            // Create scroll container
            const scrollContainer = this.scene.add.container(0, listTopY);

            // Add all items to scroll container
            items.forEach((item, index) => {
                // Position items so they're centered within their slot (with top padding)
                const itemY = contentTopPadding + index * itemHeight + (itemRectHeight / 2);
                const itemBtn = this.createListItem(listCenterX, itemY, item, () => {
                    this.close();
                    if (onSelect) onSelect(item);
                }, itemButtonWidth);
                scrollContainer.add(itemBtn);
            });

            // Create white background for list area
            const listBackground = this.scene.add.rectangle(
                listCenterX,
                listTopY + listHeight / 2,
                listWidth,
                listHeight,
                0xffffff
            );
            listBackground.setStrokeStyle(2, 0xFFB6C1);

            // Create mask for visible scroll area
            const maskShape = this.scene.make.graphics();
            maskShape.fillStyle(0xffffff);
            maskShape.fillRect(
                listCenterX - listWidth / 2,
                listTopY,
                listWidth,
                listHeight
            );
            const mask = maskShape.createGeometryMask();
            scrollContainer.setMask(mask);
            maskShape.setVisible(false);

            // Create scrollbar track in dedicated lane
            const scrollbarTrack = this.scene.add.rectangle(
                scrollbarX,
                listTopY + listHeight / 2,
                scrollbarWidth,
                listHeight,
                0xe0e0e0
            );

            // Create scrollbar thumb
            const totalHeight = contentTopPadding + (items.length * itemHeight) + contentBottomPadding;
            const maxScroll = Math.max(0, totalHeight - listHeight);
            const thumbHeight = items.length > visibleItems 
                ? (listHeight / items.length) * visibleItems 
                : listHeight;
            
            const scrollbarThumb = this.scene.add.rectangle(
                scrollbarX,
                listTopY + thumbHeight / 2,
                scrollbarWidth,
                thumbHeight,
                0xFFB6C1
            );
            scrollbarThumb.setInteractive({ useHandCursor: true });
            this.scene.input.setDraggable(scrollbarThumb);

            // Update scrollbar thumb position function
            const updateScrollbar = () => {
                const scrollOffset = listTopY - scrollContainer.y;
                const scrollPercent = maxScroll > 0 ? scrollOffset / maxScroll : 0;
                const thumbTravelDistance = listHeight - thumbHeight;
                const thumbY = listTopY + thumbHeight / 2 + (scrollPercent * thumbTravelDistance);
                scrollbarThumb.y = thumbY;
            };

            // Make scrollbar thumb draggable
            scrollbarThumb.on('drag', (pointer, dragX, dragY) => {
                const thumbTravelDistance = listHeight - thumbHeight;
                const minThumbY = listTopY + thumbHeight / 2;
                const maxThumbY = listTopY + thumbHeight / 2 + thumbTravelDistance;
                
                const clampedThumbY = Phaser.Math.Clamp(dragY, minThumbY, maxThumbY);
                scrollbarThumb.y = clampedThumbY;

                // Update scroll container based on thumb position
                const thumbOffset = clampedThumbY - minThumbY;
                const scrollPercent = thumbTravelDistance > 0 ? thumbOffset / thumbTravelDistance : 0;
                scrollContainer.y = listTopY - (scrollPercent * maxScroll);
            });

            // Make scrollbar track clickable
            scrollbarTrack.setInteractive({ useHandCursor: true });
            scrollbarTrack.on('pointerdown', (pointer) => {
                const clickY = pointer.y;
                const thumbTravelDistance = listHeight - thumbHeight;
                const minThumbY = listTopY + thumbHeight / 2;
                const maxThumbY = listTopY + thumbHeight / 2 + thumbTravelDistance;
                
                const targetThumbY = Phaser.Math.Clamp(clickY, minThumbY, maxThumbY);
                scrollbarThumb.y = targetThumbY;

                // Update scroll container
                const thumbOffset = targetThumbY - minThumbY;
                const scrollPercent = thumbTravelDistance > 0 ? thumbOffset / thumbTravelDistance : 0;
                scrollContainer.y = listTopY - (scrollPercent * maxScroll);
            });

            // Add mouse wheel scrolling
            this.wheelListener = (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
                if (this.container) {
                    scrollContainer.y -= deltaY * 0.3;
                    
                    // Clamp scroll range
                    const minY = listTopY - maxScroll;
                    const maxY = listTopY;
                    scrollContainer.y = Phaser.Math.Clamp(scrollContainer.y, minY, maxY);
                    
                    updateScrollbar();
                }
            };
            
            this.scene.input.on('wheel', this.wheelListener);

            // Hide scrollbar if no scrolling needed
            if (items.length <= visibleItems) {
                scrollbarTrack.setVisible(false);
                scrollbarThumb.setVisible(false);
            }

            // Cancel button with icon
            const cancelBtn = this.createIconButton(centerX, centerY + 225, 'Cancel', 0xe0e0e0, 'icon-cancel', () => {
                this.close();
            });

            this.container.add([listBackground, scrollContainer, scrollbarTrack, scrollbarThumb, cancelBtn]);
        }
    }

    /**
     * Create the modal base (overlay + panel)
     */
    createModalBase() {
        this.hideWorldNameInput();
        
        if (this.container) {
            this.container.destroy();
        }

        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(3000);

        // Semi-transparent overlay
        const overlay = this.scene.add.rectangle(
            GAME_WIDTH / 2, 
            GAME_HEIGHT / 2, 
            GAME_WIDTH, 
            GAME_HEIGHT, 
            0x000000, 
            0.7
        );
        overlay.setInteractive();

        // Modal panel with rounded corners (taller for Load World dialog)
        const panelWidth = 450;
        const panelHeight = 430;
        const panelX = GAME_WIDTH / 2 - panelWidth / 2;
        const panelY = GAME_HEIGHT / 2 - panelHeight / 2;
        
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xFFD6E8, 0.98);
        graphics.fillRoundedRect(
            panelX,
            panelY,
            panelWidth,
            panelHeight,
            20
        );
        graphics.lineStyle(4, 0xFFFFFF, 1);
        graphics.strokeRoundedRect(
            panelX,
            panelY,
            panelWidth,
            panelHeight,
            20
        );

        this.container.add([overlay, graphics]);
    }

    /**
     * Create a button
     */
    createButton(x, y, label, color, onClick) {
        const button = this.scene.add.container(x, y);
        
        const bg = this.scene.add.rectangle(0, 0, 140, 40, color);
        bg.setStrokeStyle(3, 0x000000);
        bg.setInteractive({ useHandCursor: true });

        const text = this.scene.add.text(0, 0, label, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        button.add([bg, text]);

        bg.on('pointerdown', () => {
            bg.setFillStyle(color === 0xFFB6C1 ? 0xFF99AA : 0xcccccc);
            if (onClick) onClick();
            this.scene.time.delayedCall(100, () => {
                bg.setFillStyle(color);
            });
        });

        bg.on('pointerover', () => {
            bg.setFillStyle(color === 0xFFB6C1 ? 0xFFCCDD : 0xf0f0f0);
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(color);
        });

        return button;
    }

    /**
     * Create a list item button
     */
    createListItem(x, y, item, onClick, buttonWidth = 330) {
        const button = this.scene.add.container(x, y);
        
        const buttonHeight = 45;
        const cornerRadius = 12;
        
        // Create rounded button graphics
        const graphics = this.scene.add.graphics();
        
        // Default state colors
        const defaultFill = 0xE7A9C4;
        const hoverFill = 0xF0BDD1;
        const pressedFill = 0xD896B5;
        const borderColor = 0x9A6FAE;
        
        // Draw rounded button
        const drawButton = (fillColor) => {
            graphics.clear();
            graphics.fillStyle(fillColor, 1);
            graphics.fillRoundedRect(
                -buttonWidth / 2,
                -buttonHeight / 2,
                buttonWidth,
                buttonHeight,
                cornerRadius
            );
            graphics.lineStyle(3, borderColor, 1);
            graphics.strokeRoundedRect(
                -buttonWidth / 2,
                -buttonHeight / 2,
                buttonWidth,
                buttonHeight,
                cornerRadius
            );
        };
        
        drawButton(defaultFill);
        
        // Create transparent hit area for interaction
        const hitArea = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, 0xffffff, 0);
        hitArea.setInteractive({ useHandCursor: true });

        const nameText = this.scene.add.text(-buttonWidth / 2 + 15, -2, item.name, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#2f2f2f',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        const dateText = this.scene.add.text(buttonWidth / 2 - 15, -2, this.formatDate(item.savedAt), {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#4f4f4f'
        }).setOrigin(1, 0.5);

        button.add([graphics, hitArea, nameText, dateText]);

        hitArea.on('pointerdown', () => {
            drawButton(pressedFill);
            if (onClick) onClick();
        });

        hitArea.on('pointerover', () => {
            drawButton(hoverFill);
        });

        hitArea.on('pointerout', () => {
            drawButton(defaultFill);
        });

        return button;
    }

    /**
     * Format date for display
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    }

    /**
     * Show Clear World confirmation dialog with visual design
     */
    showClearWorldDialog(onConfirm) {
        this.hideWorldNameInput();
        
        if (this.container) {
            this.container.destroy();
        }

        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(3000);

        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;

        // Semi-transparent overlay
        const overlay = this.scene.add.rectangle(
            centerX,
            centerY,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x000000,
            0.7
        );
        overlay.setInteractive();

        // Larger custom modal panel
        const panelWidth = 620;
        const panelHeight = 560;
        const panelX = centerX - panelWidth / 2;
        const panelY = centerY - panelHeight / 2;
        
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xFFD6E8, 0.98);
        graphics.fillRoundedRect(
            panelX,
            panelY,
            panelWidth,
            panelHeight,
            20
        );
        graphics.lineStyle(4, 0xFFFFFF, 1);
        graphics.strokeRoundedRect(
            panelX,
            panelY,
            panelWidth,
            panelHeight,
            20
        );

        // Title
        const titleText = this.scene.add.text(centerX, centerY - 220, 'Clear World', {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Clear game illustration
        const clearImage = this.scene.add.image(centerX, centerY - 105, 'clear-game-image');
        const maxImageWidth = 420;
        const maxImageHeight = 180;
        const imageScale = Math.min(maxImageWidth / clearImage.width, maxImageHeight / clearImage.height);
        clearImage.setScale(imageScale);

        // Message text
        const messageText = this.scene.add.text(centerX, centerY + 95, 'This will erase everything\nin the current world.\n\nAre you sure?', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#333333',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);

        // Button Y position
        const buttonY = centerY + 205;
        
        // Cancel button with icon
        const cancelBtn = this.createIconButton(centerX - 100, buttonY, 'Cancel', 0xe0e0e0, 'icon-cancel', () => {
            this.close();
        });

        // Clear button with icon
        const clearBtn = this.createIconButton(centerX + 100, buttonY, 'Clear', 0xFFB6C1, 'icon-bin', () => {
            this.close();
            if (onConfirm) onConfirm();
        });

        this.container.add([overlay, graphics, titleText, clearImage, messageText, cancelBtn, clearBtn]);
    }

    /**
     * Create a button with an icon
     */
    createIconButton(x, y, label, color, iconKey, onClick) {
        const button = this.scene.add.container(x, y);
        
        const buttonWidth = 170;
        const buttonHeight = 54;
        const bg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, color);
        bg.setStrokeStyle(3, 0x000000);
        bg.setInteractive({ useHandCursor: true });

        // Icon on the left
        const icon = this.scene.add.image(-45, 0, iconKey);
        const maxIconWidth = 36;
        const maxIconHeight = 36;
        const iconScale = Math.min(maxIconWidth / icon.width, maxIconHeight / icon.height);
        icon.setScale(iconScale);

        // Text on the right
        const text = this.scene.add.text(22, 0, label, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        button.add([bg, icon, text]);

        bg.on('pointerdown', () => {
            bg.setFillStyle(color === 0xFFB6C1 ? 0xFF99AA : 0xcccccc);
            if (onClick) onClick();
            this.scene.time.delayedCall(100, () => {
                bg.setFillStyle(color);
            });
        });

        bg.on('pointerover', () => {
            bg.setFillStyle(color === 0xFFB6C1 ? 0xFFCCDD : 0xf0f0f0);
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(color);
        });

        return button;
    }

    /**
     * Hide the world name input while modal is open
     */
    hideWorldNameInput() {
        if (this.scene.worldNameInput) {
            this.scene.worldNameInput.style.display = 'none';
        }
    }

    /**
     * Restore the world name input when modal closes
     */
    restoreWorldNameInput() {
        if (this.scene.worldNameInput && this.scene.gameMode === 'build') {
            this.scene.worldNameInput.style.display = 'block';
            if (this.scene.positionWorldNameField) {
                this.scene.positionWorldNameField();
            }
        }
    }

    /**
     * Close the modal
     */
    close() {
        // Remove wheel listener if it exists
        if (this.wheelListener) {
            this.scene.input.off('wheel', this.wheelListener);
            this.wheelListener = null;
        }
        
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        
        // Restore world name input after modal closes
        this.restoreWorldNameInput();
        
        if (this.onClose) {
            this.onClose();
            this.onClose = null;
        }
    }
}
