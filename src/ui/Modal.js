import { GAME_WIDTH, GAME_HEIGHT, MOBILE_PORTRAIT_WIDTH, isMobilePortrait } from '../data/constants.js';

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
        // Temporarily hide world name input to prevent DOM element from covering Phaser toast
        const shouldHideWorldNameInput = this.scene.worldNameInput && this.scene.worldNameInput.style.display !== 'none';
        if (shouldHideWorldNameInput) {
            this.scene.worldNameInput.style.display = 'none';
        }
        
        const isMobile = isMobilePortrait();
        const gameWidth = isMobile ? MOBILE_PORTRAIT_WIDTH : GAME_WIDTH;
        const toast = this.scene.add.container(gameWidth / 2, 95);
        
        const toastWidth = isMobile ? 320 : 430;
        const toastHeight = isMobile ? 50 : 56;
        const bg = this.scene.add.rectangle(0, 0, toastWidth, toastHeight, 0xFFB6C1, 0.95);
        bg.setStrokeStyle(3, 0xFFFFFF);
        bg.setDisplaySize(toastWidth, toastHeight);
        
        const textFontSize = isMobile ? '16px' : '18px';
        const text = this.scene.add.text(0, 0, message, {
            fontSize: textFontSize,
            fontFamily: 'Arial',
            color: '#000000',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: toastWidth - 40 }
        }).setOrigin(0.5);

        toast.add([bg, text]);
        toast.setDepth(40000);

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
                onComplete: () => {
                    toast.destroy();
                    
                    // Restore world name input after toast is gone
                    if (shouldHideWorldNameInput && this.scene.worldNameInput && this.scene.gameMode === 'build') {
                        this.scene.worldNameInput.style.display = 'block';
                        
                        // Reposition input if positioning function exists
                        if (this.scene.positionWorldNameField) {
                            this.scene.positionWorldNameField();
                        }
                    }
                }
            });
        });
    }

    /**
     * Show a confirmation dialog with Cancel and Confirm buttons
     */
    showConfirmDialog(title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', onCancel = null, imageKey = null) {
        this.createModalBase();

        const isMobile = isMobilePortrait();
        const gameWidth = isMobile ? MOBILE_PORTRAIT_WIDTH : GAME_WIDTH;
        const centerX = gameWidth / 2;
        const centerY = GAME_HEIGHT / 2;

        // Adjust layout based on whether image is present and mobile state
        const titleFontSize = isMobile ? '24px' : '28px';
        const messageFontSize = isMobile ? '16px' : '18px';
        const titleY = imageKey ? centerY - 150 : centerY - 90;
        const imageY = centerY - 50;
        const messageY = imageKey ? centerY + 50 : centerY - 20;
        const buttonY = imageKey ? centerY + 120 : centerY + 70;

        // Title
        const titleText = this.scene.add.text(centerX, titleY, title, {
            fontSize: titleFontSize,
            fontFamily: 'Arial',
            color: '#333333',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: isMobile ? 320 : 400 }
        }).setOrigin(0.5);

        const elements = [titleText];

        // Optional image between title and message
        if (imageKey) {
            const dialogImage = this.scene.add.image(centerX, imageY, imageKey);
            const maxImageWidth = isMobile ? 160 : 200;
            const maxImageHeight = isMobile ? 110 : 140;
            const imageScale = Math.min(maxImageWidth / dialogImage.width, maxImageHeight / dialogImage.height);
            dialogImage.setScale(imageScale);
            elements.push(dialogImage);
        }

        // Message
        const messageText = this.scene.add.text(centerX, messageY, message, {
            fontSize: messageFontSize,
            fontFamily: 'Arial',
            color: '#333333',
            align: 'center',
            wordWrap: { width: isMobile ? 320 : 350 },
            lineSpacing: 8
        }).setOrigin(0.5);

        // Buttons - adjust spacing for mobile
        const buttonSpacing = isMobile ? 80 : 100;
        const cancelBtn = this.createIconButton(centerX - buttonSpacing, buttonY, cancelText, 0xe0e0e0, 'icon-cancel', () => {
            this.close();
            if (onCancel) onCancel();
        }, isMobile);

        const confirmBtn = this.createIconButton(centerX + buttonSpacing, buttonY, confirmText, 0xFFB6C1, 'icon-tick', () => {
            this.close();
            if (onConfirm) onConfirm();
        }, isMobile);

        elements.push(messageText, cancelBtn, confirmBtn);
        this.container.add(elements);
    }

    /**
     * Show an input dialog with a text field
     */
    showInputDialog(title, placeholder, defaultValue, onConfirm) {
        this.createModalBase();

        const isMobile = isMobilePortrait();
        const gameWidth = isMobile ? MOBILE_PORTRAIT_WIDTH : GAME_WIDTH;
        const centerX = gameWidth / 2;
        const centerY = GAME_HEIGHT / 2;

        // Title - responsive with separate positioning
        const titleFontSize = isMobile ? '24px' : '28px';
        const titleY = isMobile ? centerY - 180 : centerY - 175;
        const titleText = this.scene.add.text(centerX, titleY, title, {
            fontSize: titleFontSize,
            fontFamily: 'Arial',
            color: '#333333',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: isMobile ? 320 : 400 }
        }).setOrigin(0.5);

        // Add girl-boy-name image under title - responsive with separate positioning
        const imageY = isMobile ? centerY - 80 : centerY - 65;
        const childImage = this.scene.add.image(centerX, imageY, 'girl-boy-name');
        childImage.setOrigin(0.5);
        const imageWidth = isMobile ? 230 : 260;
        const imageHeight = isMobile ? 145 : 165;
        childImage.setDisplaySize(imageWidth, imageHeight);

        // Add helper text about character limit - responsive with separate positioning
        const helperFontSize = isMobile ? '11px' : '12px';
        const helperY = isMobile ? centerY + 95 : centerY + 85;
        const helperText = this.scene.add.text(centerX, helperY, 'Maximum 20 characters', {
            fontSize: helperFontSize,
            fontFamily: 'Arial',
            color: '#666666'
        }).setOrigin(0.5);

        // Track input value
        let inputValue = defaultValue || '';

        // Create HTML input element for actual text entry
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.value = inputValue;
        inputElement.placeholder = placeholder;
        inputElement.maxLength = 20; // Limit to 20 characters
        inputElement.style.position = 'absolute';
        
        // Position relative to canvas with proper scale handling
        const canvas = this.scene.game.canvas.getBoundingClientRect();
        
        // Calculate scale factors (canvas displayed size vs game logical size)
        const scaleX = canvas.width / gameWidth;
        const scaleY = canvas.height / GAME_HEIGHT;
        
        // Input dimensions in logical coordinates - responsive
        const inputWidth = isMobile ? 280 : 300;
        const inputHeight = isMobile ? 42 : 45;
        const fontSize = isMobile ? 18 : 20;
        
        // Logical position: centered horizontally with separate positioning for mobile and desktop
        const inputX = gameWidth / 2 - inputWidth / 2;
        const inputYPosition = isMobile ? (GAME_HEIGHT / 2 - 45) : (GAME_HEIGHT / 2 + 45);
        const inputY = inputYPosition - inputHeight / 2;
        
        // Add scroll offsets for absolute positioning
        const pageX = window.scrollX || window.pageXOffset || 0;
        const pageY = window.scrollY || window.pageYOffset || 0;
        
        // Apply scale to position and size
        inputElement.style.left = (canvas.left + pageX + inputX * scaleX) + 'px';
        inputElement.style.top = (canvas.top + pageY + inputY * scaleY) + 'px';
        inputElement.style.width = (inputWidth * scaleX) + 'px';
        inputElement.style.height = (inputHeight * scaleY) + 'px';
        inputElement.style.fontSize = (fontSize * scaleY) + 'px';
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

        // Buttons with icons - responsive with separate positioning
        const buttonY = isMobile ? centerY + 145 : centerY + 145;
        const buttonSpacing = isMobile ? 80 : 100;
        const cancelBtn = this.createIconButton(centerX - buttonSpacing, buttonY, 'Cancel', 0xe0e0e0, 'icon-cancel', () => {
            this.scene.isTextInputOpen = false;
            document.body.removeChild(inputElement);
            this.close();
        }, isMobile);

        const saveBtn = this.createIconButton(centerX + buttonSpacing, buttonY, 'Save', 0xFFB6C1, 'icon-tick', () => {
            this.scene.isTextInputOpen = false;
            document.body.removeChild(inputElement);
            this.close();
            if (onConfirm && inputValue.trim()) {
                onConfirm(inputValue.trim());
            }
        }, isMobile);

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

        this.container.add([titleText, childImage, helperText, cancelBtn, saveBtn]);
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

        const isMobile = isMobilePortrait();
        const gameWidth = isMobile ? MOBILE_PORTRAIT_WIDTH : GAME_WIDTH;
        const centerX = gameWidth / 2;
        const centerY = GAME_HEIGHT / 2;

        // Semi-transparent overlay
        const overlay = this.scene.add.rectangle(
            centerX,
            centerY,
            gameWidth,
            GAME_HEIGHT,
            0x000000,
            0.7
        );
        overlay.setInteractive();

        // Responsive modal panel
        const panelWidth = isMobile ? Math.floor(gameWidth * 0.90) : 620;
        const panelHeight = isMobile ? 480 : 560;
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

        // Title - responsive
        const titleFontSize = isMobile ? '28px' : '36px';
        const titleText = this.scene.add.text(centerX, centerY - (isMobile ? 190 : 220), title, {
            fontSize: titleFontSize,
            fontFamily: 'Arial',
            color: '#333333',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: panelWidth - 40 }
        }).setOrigin(0.5);

        // Load world illustration - responsive
        const loadImage = this.scene.add.image(centerX, centerY - (isMobile ? 110 : 130), 'load-world-image');
        const maxImageWidth = isMobile ? 300 : 420;
        const maxImageHeight = isMobile ? 110 : 150;
        const imageScale = Math.min(maxImageWidth / loadImage.width, maxImageHeight / loadImage.height);
        loadImage.setScale(imageScale);

        // Instruction text - responsive
        const instructionFontSize = isMobile ? '15px' : '18px';
        const instructionText = this.scene.add.text(centerX, centerY - (isMobile ? 30 : 35), 'Choose a saved world to load\ninto your current world.', {
            fontSize: instructionFontSize,
            fontFamily: 'Arial',
            color: '#333333',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);

        this.container.add([overlay, graphics, titleText, loadImage, instructionText]);

        if (items.length === 0) {
            // Empty state
            const emptyFontSize = isMobile ? '16px' : '18px';
            const emptyText = this.scene.add.text(centerX, centerY + 35, emptyMessage, {
                fontSize: emptyFontSize,
                fontFamily: 'Arial',
                color: '#333333',
                align: 'center',
                wordWrap: { width: isMobile ? panelWidth - 60 : 500 }
            }).setOrigin(0.5);

            const closeBtn = this.createIconButton(centerX, centerY + (isMobile ? 180 : 220), 'Cancel', 0xe0e0e0, 'icon-cancel', () => {
                this.close();
            }, isMobile);

            this.container.add([emptyText, closeBtn]);
        } else {
            // Scrollable list items - define layout constants
            const listCenterX = centerX;
            const listTopY = centerY + (isMobile ? 5 : 10);
            const itemHeight = isMobile ? 50 : 55;
            const visibleItems = 3;
            const contentTopPadding = 10;
            const contentBottomPadding = 10;
            // Visible height: show exactly 3 items with padding, prevent 4th item from peeking
            const listHeight = contentTopPadding + (visibleItems * itemHeight) - 5;
            const listWidth = isMobile ? panelWidth - 60 : 440;
            const scrollbarGap = 12;
            const scrollbarWidth = 10;
            const scrollbarX = listCenterX + (listWidth / 2) + scrollbarGap + (scrollbarWidth / 2);
            const itemRectHeight = isMobile ? 40 : 45;
            const itemButtonWidth = isMobile ? panelWidth - 80 : 420;

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
                }, itemButtonWidth, isMobile);
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

            // Cancel button with icon - responsive positioning with more space on mobile
            const cancelBtn = this.createIconButton(centerX, centerY + (isMobile ? 200 : 225), 'Cancel', 0xe0e0e0, 'icon-cancel', () => {
                this.close();
            }, isMobile);

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

        // Responsive modal panel width and height
        const isMobile = isMobilePortrait();
        const gameWidth = isMobile ? MOBILE_PORTRAIT_WIDTH : GAME_WIDTH;
        const panelWidth = isMobile ? Math.floor(gameWidth * 0.90) : 450; // 90% width on mobile, 450px on desktop
        const panelHeight = isMobile ? 400 : 430; // Shorter on mobile for compact layout
        const panelX = gameWidth / 2 - panelWidth / 2;
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
    createListItem(x, y, item, onClick, buttonWidth = 330, isMobile = false) {
        const button = this.scene.add.container(x, y);
        
        const buttonHeight = isMobile ? 40 : 45;
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

        // Responsive font sizes
        const nameFontSize = isMobile ? '17px' : '20px';
        const dateFontSize = isMobile ? '12px' : '14px';
        const padding = isMobile ? 12 : 15;

        const nameText = this.scene.add.text(-buttonWidth / 2 + padding, -2, item.name, {
            fontSize: nameFontSize,
            fontFamily: 'Arial',
            color: '#2f2f2f',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        const dateText = this.scene.add.text(buttonWidth / 2 - padding, -2, this.formatDate(item.savedAt), {
            fontSize: dateFontSize,
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

        const isMobile = isMobilePortrait();
        const gameWidth = isMobile ? MOBILE_PORTRAIT_WIDTH : GAME_WIDTH;
        const centerX = gameWidth / 2;
        const centerY = GAME_HEIGHT / 2;

        // Semi-transparent overlay
        const overlay = this.scene.add.rectangle(
            centerX,
            centerY,
            gameWidth,
            GAME_HEIGHT,
            0x000000,
            0.7
        );
        overlay.setInteractive();

        // Responsive modal panel
        const panelWidth = isMobile ? Math.floor(gameWidth * 0.90) : 620;
        const panelHeight = isMobile ? 480 : 560;
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

        // Title - responsive font size
        const titleFontSize = isMobile ? '28px' : '36px';
        const titleText = this.scene.add.text(centerX, centerY - (isMobile ? 190 : 220), 'Clear World', {
            fontSize: titleFontSize,
            fontFamily: 'Arial',
            color: '#333333',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: panelWidth - 40 }
        }).setOrigin(0.5);

        // Clear game illustration - responsive size
        const clearImage = this.scene.add.image(centerX, centerY - (isMobile ? 90 : 105), 'clear-game-image');
        const maxImageWidth = isMobile ? 300 : 420;
        const maxImageHeight = isMobile ? 130 : 180;
        const imageScale = Math.min(maxImageWidth / clearImage.width, maxImageHeight / clearImage.height);
        clearImage.setScale(imageScale);

        // Message text - responsive size and positioning
        const messageFontSize = isMobile ? '18px' : '20px';
        const messageText = this.scene.add.text(centerX, centerY + (isMobile ? 70 : 95), 'This will erase everything\nin the current world.\n\nAre you sure?', {
            fontSize: messageFontSize,
            fontFamily: 'Arial',
            color: '#333333',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);

        // Button Y position - responsive
        const buttonY = centerY + (isMobile ? 170 : 205);
        const buttonSpacing = isMobile ? 80 : 100;
        
        // Cancel button with icon
        const cancelBtn = this.createIconButton(centerX - buttonSpacing, buttonY, 'Cancel', 0xe0e0e0, 'icon-cancel', () => {
            this.close();
        }, isMobile);

        // Clear button with icon
        const clearBtn = this.createIconButton(centerX + buttonSpacing, buttonY, 'Clear', 0xFFB6C1, 'icon-bin', () => {
            this.close();
            if (onConfirm) onConfirm();
        }, isMobile);

        this.container.add([overlay, graphics, titleText, clearImage, messageText, cancelBtn, clearBtn]);
    }

    /**
     * Create a button with an icon
     */
    createIconButton(x, y, label, color, iconKey, onClick, isMobile = false) {
        const button = this.scene.add.container(x, y);
        
        const buttonWidth = isMobile ? 140 : 170;
        const buttonHeight = isMobile ? 48 : 54;
        const bg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, color);
        bg.setStrokeStyle(3, 0x000000);
        bg.setInteractive({ useHandCursor: true });

        // Icon on the left - responsive size
        const icon = this.scene.add.image(isMobile ? -38 : -45, 0, iconKey);
        const maxIconWidth = isMobile ? 38 : 46;
        const maxIconHeight = isMobile ? 38 : 46;
        const iconScale = Math.min(maxIconWidth / icon.width, maxIconHeight / icon.height);
        icon.setScale(iconScale);

        // Text on the right - responsive size
        const textFontSize = isMobile ? '16px' : '18px';
        const text = this.scene.add.text(isMobile ? 18 : 22, 0, label, {
            fontSize: textFontSize,
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
