import { Scene } from 'phaser';
import { TextStyleManager } from '../../modules/managers/TextStyleManager';
import { eventBus } from '../../modules/events/EventBus';
import { GameConfig } from '../../config/GameConfig';

export class UIManager {
    constructor(scene) {
        this.scene = scene;
        
        // Initialize TextStyleManager
        this.textStyleManager = new TextStyleManager(scene);
        
        // Create main UI container
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(100);
        this.lastFpsUpdate = 0;
        
        // Create UI camera that stays fixed
        const { width, height } = scene.scale;
        this.uiCamera = scene.cameras.add(0, 0, width, height);
        this.uiCamera.setScroll(0, 0);
        
        // Make UI elements fixed on screen
        this.container.setScrollFactor(0);

        // Bar properties
        this.barWidth = 200;
        this.barHeight = 10;
        this.barPadding = 5;
        this.maxHealth = GameConfig.PLAYER.INITIAL_HP;
        
        // Set up UI elements
        this.setupUI();

        // Create start message (hidden by default)
        this.createStartMessage();

        // Create debug info screen
        this.createDebugInfo();

        // Initial camera setup
        this.updateCameraIgnoreList();

        // Create start message (hidden by default)
        this.createStartMessage();

        // Initial camera setup
        this.updateCameraIgnoreList();

        // Set up registry event listeners
        this.scene.registry.events.on('changedata', this.handleRegistryChange, this);
        
        // Listen for scene events
        this.scene.events.on('create', this.updateCameraIgnoreList, this);
        this.scene.events.on('wake', this.updateCameraIgnoreList, this);
        this.scene.events.on('resume', this.updateCameraIgnoreList, this);
        
        // Listen for new objects
        this.scene.events.on('addedtoscene', this.handleNewObject, this);
        
        // Listen for HP changes
        eventBus.on('playerHPChanged', (hp) => {
            this.updateHP(hp);
        });
        
        // Debug flag
        this.debugMode = true;
    }

    handleNewObject = (gameObject) => {
        if (!this.uiCamera || !gameObject || gameObject === this.container) return;
        
        try {
            // Ignore the new object in the UI camera
            this.uiCamera.ignore(gameObject);
        } catch (error) {
            console.error('Error handling new object:', error);
        }
    }

    updateCameraIgnoreList() {
        if (!this.uiCamera || !this.scene || !this.container) {
            console.log('Cannot update camera ignore list - missing components');
            return;
        }

        try {
            // Make main camera ignore UI container
            if (this.scene.cameras && this.scene.cameras.main) {
                this.scene.cameras.main.ignore(this.container);
            }

            // Make UI camera ignore everything except UI container
            this.scene.children.list.forEach(child => {
                if (child && child !== this.container) {
                    this.uiCamera.ignore(child);
                }
            });

            // Ignore specific game objects and groups
            const objectsToIgnore = [
                this.scene.player,
                this.scene.enemies,
                this.scene.bullets,
                this.scene.platforms,
                this.scene.background,
                this.scene.techLights,
                this.scene.particles,
                this.scene.spikes
            ];

            objectsToIgnore.forEach(obj => {
                if (obj) {
                    if (obj.getChildren) {
                        // If it's a group/container, ignore all children
                        obj.getChildren().forEach(child => {
                            if (child) this.uiCamera.ignore(child);
                        });
                    } else {
                        // If it's a single object
                        this.uiCamera.ignore(obj);
                    }
                }
            });

        } catch (error) {
            console.error('Error in updateCameraIgnoreList:', error);
        }
    }

    setupUI() {
        const { width, height } = this.scene.scale;
        console.log('Setting up UI...');

        // Constants for UI positioning
        const LEFT_MARGIN = 25;
        const TOP_MARGIN = 20;
        const VERTICAL_SPACING = 30;
        const TEXT_WIDTH = 150;
        const TOP_BAR_MARGIN = 10;  // Margin from top of screen

        // Clear existing UI elements
        if (this.container.list.length > 0) {
            this.container.removeAll(true);
        }

        // Create score text
        this.scoreText = this.scene.add.text(LEFT_MARGIN, TOP_MARGIN, 'Score: ' + this.scene.registry.get('score'), this.textStyleManager.styles.score);
        this.container.add(this.scoreText);

        // Create lives text
        this.livesText = this.scene.add.text(LEFT_MARGIN, TOP_MARGIN + VERTICAL_SPACING, 'Lives: ' + this.scene.registry.get('lives'), this.textStyleManager.styles.lives);
        this.container.add(this.livesText);

        // Create HP text
        this.hpText = this.scene.add.text(LEFT_MARGIN, TOP_MARGIN + VERTICAL_SPACING * 2, 'HP: ' + this.scene.registry.get('playerHP'), this.textStyleManager.styles.hp);
        this.container.add(this.hpText);

        // Create timer text
        this.timerText = this.scene.add.text(LEFT_MARGIN, TOP_MARGIN + VERTICAL_SPACING * 3, 'Time: 00:00', this.textStyleManager.styles.timer);
        this.container.add(this.timerText);

        // Create bitcoins text
        this.bitcoinText = this.scene.add.text(LEFT_MARGIN, TOP_MARGIN + VERTICAL_SPACING * 4, 'Bitcoins: ' + this.scene.registry.get('bitcoins'), this.textStyleManager.styles.bitcoin);
        this.container.add(this.bitcoinText);

        // Get initial values
        const currentStamina = this.scene.registry.get('stamina') || 100;
        const currentHealth = this.scene.registry.get('playerHP') || 100;
        const staminaRatio = Math.max(0, Math.min(1, currentStamina / 100));
        const healthRatio = currentHealth / 100;  // Exact percentage for health
        
        // Create stamina bar background (centered at top)
        this.staminaBarBackground = this.scene.add.rectangle(
            width / 2,
            TOP_BAR_MARGIN,
            this.barWidth,
            this.barHeight,
            0x000000
        );
        this.staminaBarBackground.setAlpha(0.9);
        this.staminaBarBackground.setScrollFactor(0);
        this.container.add(this.staminaBarBackground);

        // Create stamina bar fill
        const staminaStartX = width / 2 - this.barWidth / 2;
        this.staminaBarFill = this.scene.add.rectangle(
            staminaStartX,
            TOP_BAR_MARGIN,
            this.barWidth * staminaRatio,
            this.barHeight,
            0xFF00FF  // Magenta for stamina
        );
        this.staminaBarFill.setOrigin(0, 0.5);
        this.staminaBarFill.setScrollFactor(0);
        this.container.add(this.staminaBarFill);

        // Create health bar background
        this.healthBarBackground = this.scene.add.rectangle(
            width / 2,
            TOP_BAR_MARGIN + this.barHeight + this.barPadding,
            this.barWidth,
            this.barHeight,
            0x000000
        );
        this.healthBarBackground.setAlpha(0.9);
        this.healthBarBackground.setScrollFactor(0);
        this.container.add(this.healthBarBackground);

        // Create health bar fill
        const healthStartX = width / 2 - this.barWidth / 2;
        this.healthBarFill = this.scene.add.rectangle(
            healthStartX,
            TOP_BAR_MARGIN + this.barHeight + this.barPadding,
            this.barWidth * healthRatio,
            this.barHeight,
            0xFF0000  // Red for health
        );
        this.healthBarFill.setOrigin(0, 0.5);
        this.healthBarFill.setScrollFactor(0);
        this.container.add(this.healthBarFill);
        
        if (this.debugMode) {
            console.log('Initial stamina setup:', {
                currentStamina,
                staminaRatio,
                barWidth: this.barWidth * staminaRatio,
                barStartX: staminaStartX,
                screenWidth: width
            });
        }

        // Create FPS counter (hidden initially)
        this.fpsText = this.scene.add.text(LEFT_MARGIN, height - 30, 'FPS: 60', this.textStyleManager.styles.fps);
        this.fpsText.setVisible(false);
        this.container.add(this.fpsText);

        // Set initial alpha to 0 for fade-in effect
        [this.scoreText, this.livesText, this.hpText, this.timerText, this.bitcoinText,
         this.staminaBarBackground, this.staminaBarFill,
         this.healthBarBackground, this.healthBarFill].forEach(element => {
            if (element) element.setAlpha(0);
        });
    }

    update(time, delta) {
        if (!this.scene || !this.scene.registry) return;

        // Update FPS counter every 100ms
        if (time - this.lastFpsUpdate > 100) {
            this.fpsText.setText('FPS: ' + (1000 / delta).toFixed(1));
            this.lastFpsUpdate = time;
        }

        // Update stamina bar first
        const currentStamina = this.scene.registry.get('stamina');
        if (currentStamina !== undefined && this.staminaBarFill) {
            this.updateStaminaBar(currentStamina);
        }

        // Update health bar
        const currentHealth = this.scene.registry.get('playerHP');
        if (currentHealth !== undefined && this.healthBarFill) {
            // Calculate exact percentage of health remaining (1-100)
            const healthPercentage = Math.max(0, Math.min(100, currentHealth));
            const healthRatio = healthPercentage / 100;
            
            // Update width only, position is handled by updateStaminaBar
            this.healthBarFill.width = this.barWidth * healthRatio;
            
            // Change color based on health percentage
            if (healthPercentage <= 25) {
                this.healthBarFill.setFillStyle(0xFF0000); // Red when <= 25%
            } else if (healthPercentage <= 50) {
                this.healthBarFill.setFillStyle(0xFF8000); // Orange when <= 50%
            } else {
                this.healthBarFill.setFillStyle(0x00FF00); // Green when > 50%
            }

            // Update HP text to show exact number
            if (this.hpText) {
                this.hpText.setText(`HP: ${Math.floor(healthPercentage)}`);
            }
        }
    }

    updateStaminaBar(currentStamina) {
        if (!this.staminaBarFill) return;

        const maxStamina = 100;
        const staminaRatio = Math.max(0, Math.min(1, currentStamina / maxStamina));
        
        // Update width smoothly
        const targetWidth = this.barWidth * staminaRatio;
        const currentWidth = this.staminaBarFill.width;
        const lerpFactor = 0.2;
        
        this.staminaBarFill.width = currentWidth + (targetWidth - currentWidth) * lerpFactor;
        
        // Update position
        const startX = this.scene.scale.width / 2 - this.barWidth / 2;
        this.staminaBarFill.x = startX;
        this.staminaBarBackground.x = this.scene.scale.width / 2;
        
        // Change color based on stamina level
        if (staminaRatio <= 0.3) {
            this.staminaBarFill.setFillStyle(0xFF0000); // Red when low
        } else if (staminaRatio <= 0.6) {
            this.staminaBarFill.setFillStyle(0xFFFF00); // Yellow when medium
        } else {
            this.staminaBarFill.setFillStyle(0xFF00FF); // Magenta when high
        }

        // Update health bar position to match stamina bar
        if (this.healthBarFill && this.healthBarBackground) {
            this.healthBarFill.x = startX;
            this.healthBarBackground.x = this.scene.scale.width / 2;
        }
    }

    fadeInUI() {
        const duration = 500;
        const ease = 'Power1';
        
        [this.scoreText, this.livesText, this.hpText, this.timerText, this.bitcoinText,
         this.staminaBarBackground, this.staminaBarFill,
         this.healthBarBackground, this.healthBarFill].forEach(element => {
            if (element) {
                this.scene.tweens.add({
                    targets: element,
                    alpha: 1,
                    duration: duration,
                    ease: ease
                });
            }
        });
    }

    fadeOut() {
        if (!this.container) return;
        
        this.container.list.forEach(element => {
            if (element && element.alpha !== undefined) {
                this.scene.tweens.add({
                    targets: element,
                    alpha: 0,
                    duration: 500,
                    ease: 'Power2'
                });
            }
        });
    }

    updateScore(score) {
        if (this.scoreText) {
            this.scoreText.setText('Score: ' + score);
        }
    }

    updateLives(lives) {
        if (this.livesText) {
            this.livesText.setText('Lives: ' + lives);
        }
    }

    updateHP(hp) {
        this.updateHealthBar(hp);
    }

    updateTimer() {
        if (!this.isTimerRunning || !this.timerText) return;
        
        const minutes = Math.floor(this.elapsedSeconds / 60);
        const seconds = this.elapsedSeconds % 60;
        this.timerText.setText(`Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }

    updateBitcoins(bitcoins) {
        if (this.bitcoinText) {
            this.bitcoinText.setText('Bitcoins: ' + bitcoins);
        }
    }

    toggleFPS() {
        if (this.fpsText) {
            this.fpsText.setVisible(!this.fpsText.visible);
        }
    }

    createStartMessage() {
        const { width, height } = this.scene.scale;
        
        // Create black background
        this.startMessageBg = this.scene.add.rectangle(
            width - 120, // Position from right
            height - 30, // Position from bottom
            200, // Width
            40,  // Height
            0x000000, // Black color
            0.7      // Semi-transparent
        );
        this.startMessageBg.setOrigin(0.5);
        this.startMessageBg.setDepth(999);
        this.startMessageBg.setScrollFactor(0);
        this.startMessageBg.setVisible(false);
        
        // Create text
        this.startMessage = this.scene.add.text(
            width - 120, // Same x as background
            height - 30, // Same y as background
            'Skip Intro (Space)',
            this.textStyleManager.styles.wallet
        );
        
        // Style the text
        this.startMessage.setOrigin(0.5);
        this.startMessage.setDepth(1000);
        this.startMessage.setScrollFactor(0);
        this.startMessage.setVisible(false);
        this.startMessage.setColor('#ffffff'); // White text
        
        // Add a slight pulsing effect to both
        this.scene.tweens.add({
            targets: [this.startMessage, this.startMessageBg],
            alpha: 0.7,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    showStartMessage() {
        if (this.startMessage) {
            this.startMessage.setVisible(true);
            this.startMessageBg.setVisible(true);
        }
    }

    hideStartMessage() {
        if (this.startMessage) {
            this.startMessage.setVisible(false);
            this.startMessageBg.setVisible(false);
        }
    }

    setupRegistryListeners() {
        // Listen for registry changes
        this.scene.registry.events.on('changedata', this.handleRegistryChange, this);
        
        // Initial update from registry
        this.updateScore(this.scene.registry.get('score') || 0);
        this.updateLives(this.scene.registry.get('lives') || 3);
        this.updateHP(this.scene.registry.get('playerHP') || 100);
        this.updateBitcoins(this.scene.registry.get('bitcoins') || 0);
    }

    handleRegistryChange(parent, key, value) {
        switch (key) {
            case 'score':
                this.scoreText.setText('Score: ' + value);
                break;
            case 'lives':
                this.livesText.setText('Lives: ' + value);
                break;
            case 'playerHP':
                this.updateHealthBar(value);
                break;
            case 'stamina':
                this.updateStaminaBar(value);
                break;
            case 'bitcoins':
                this.bitcoinText.setText('Bitcoins: ' + value);
                break;
        }
    }

    updateHealthBar(currentHealth) {
        if (!this.healthBarFill) return;

        // Calculate exact percentage of health remaining (1-100)
        const healthPercentage = Math.max(0, Math.min(100, currentHealth));
        const healthRatio = healthPercentage / 100;
        
        // Update width to exactly match health percentage
        this.healthBarFill.width = this.barWidth * healthRatio;
        
        // Update position to stay centered
        this.healthBarFill.x = this.scene.scale.width / 2 - this.barWidth / 2;
        this.healthBarBackground.x = this.scene.scale.width / 2;
        
        // Change color based on health percentage
        if (healthPercentage <= 25) {
            this.healthBarFill.setFillStyle(0xFF0000); // Red when <= 25%
        } else if (healthPercentage <= 50) {
            this.healthBarFill.setFillStyle(0xFF8000); // Orange when <= 50%
        } else {
            this.healthBarFill.setFillStyle(0x00FF00); // Green when > 50%
        }

        // Update HP text to show exact number
        if (this.hpText) {
            this.hpText.setText(`HP: ${Math.floor(healthPercentage)}`);
        }
    }

    animateUIElements() {
        const elements = [
            { text: this.scoreText, finalPos: { x: 25, y: 20 } },
            { text: this.livesText, finalPos: { x: 25, y: 50 } },
            { text: this.hpText, finalPos: { x: 25, y: 80 } },
            { text: this.timerText, finalPos: { x: 25, y: 110 } },
            { text: this.bitcoinText, finalPos: { x: 25, y: 140 } }
        ];

        let delay = 0;
        const delayIncrement = 800;

        elements.forEach(({ text, finalPos }) => {
            if (text) {
                text.setVisible(true);
                // Fade in at center
                this.scene.tweens.add({
                    targets: text,
                    alpha: 1,
                    duration: 500,
                    delay: delay,
                    onComplete: () => {
                        // Move to final position
                        this.scene.tweens.add({
                            targets: text,
                            x: finalPos.x,
                            y: finalPos.y,
                            duration: 1000,
                            ease: 'Power2',
                            onStart: () => {
                                text.setOrigin(0, 0);
                            }
                        });
                    }
                });
                delay += delayIncrement;
            }
        });

        // Fade in stamina bar
        if (this.staminaBarBackground && this.staminaBarFill) {
            this.scene.tweens.add({
                targets: [this.staminaBarBackground, this.staminaBarFill],
                alpha: 0.8,
                duration: 500,
                ease: 'Power2'
            });
        }

        // Fade in health bar
        if (this.healthBarBackground && this.healthBarFill) {
            this.scene.tweens.add({
                targets: [this.healthBarBackground, this.healthBarFill],
                alpha: 0.8,
                duration: 500,
                ease: 'Power2'
            });
        }

        // Show FPS counter after transition
        this.scene.time.delayedCall(delay + 1500, () => {
            if (this.fpsText) {
                this.fpsText.setVisible(true);
            }
        });
    }

    startTimer() {
        this.isTimerRunning = true;
        this.elapsedSeconds = 0;
        
        // Create timer event if it doesn't exist
        if (!this.timerEvent) {
            this.timerEvent = this.scene.time.addEvent({
                delay: 1000,  // 1 second
                callback: () => {
                    if (this.isTimerRunning) {
                        this.elapsedSeconds++;
                        this.updateTimer();
                        
                        // Update registry with current time
                        this.scene.registry.set('time', this.elapsedSeconds);
                    }
                },
                callbackScope: this,
                loop: true
            });
        }
        
        // Force initial update
        this.updateTimer();
    }

    stopTimer() {
        this.isTimerRunning = false;
        if (this.timerEvent) {
            this.timerEvent.destroy();
            this.timerEvent = null;
        }
    }

    resetTimer() {
        this.stopTimer();
        this.elapsedSeconds = 0;
        this.isTimerRunning = true;
        
        // Create new timer event
        this.timerEvent = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.isTimerRunning) {
                    this.elapsedSeconds++;
                    this.updateTimer();
                }
            },
            callbackScope: this,
            loop: true
        });
        
        this.updateTimer();
    }

    destroy() {
        // Clean up other resources
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        
        if (this.uiCamera) {
            this.scene.cameras.remove(this.uiCamera);
            this.uiCamera = null;
        }
    }

    show() {
        // Show the container
        if (this.container) {
            this.container.setVisible(true);
        }
        
        // Show UI camera
        if (this.uiCamera) {
            this.uiCamera.setVisible(true);
        }

        // Re-setup UI elements with current values
        this.setupUI();
    }

    createDebugInfo() {
        const { width } = this.scene.scale;
        
        // Create black background
        this.debugBackground = this.scene.add.rectangle(
            width - 200, 10, 190, 120,
            0x000000, 0.8
        );
        this.debugBackground.setOrigin(0, 0);
        this.debugBackground.setScrollFactor(0);
        this.container.add(this.debugBackground);

        // Create debug text
        this.debugInfo = this.scene.add.text(
            width - 190, 15,
            'Debug Info', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            padding: { x: 5, y: 5 }
        });
        this.debugInfo.setScrollFactor(0);
        this.container.add(this.debugInfo);

        // Update debug info every frame
        this.scene.events.on('update', this.updateDebugInfo, this);
    }

    updateDebugInfo() {
        if (!this.debugInfo || !this.scene.player) return;

        const player = this.scene.player;
        const currentSection = Math.floor(player.x / this.scene.sectionWidth);
        const loadedSections = this.scene.loadedSections ? this.scene.loadedSections.size : 0;
        const activeTiles = this.scene.groundLayer ? 
            this.scene.groundLayer.getTilesWithin().filter(t => t.index !== -1).length +
            this.scene.platformLayer.getTilesWithin().filter(t => t.index !== -1).length : 0;

        this.debugInfo.setText(
            `Sections: ${loadedSections}\n` +
            `Current: ${currentSection}\n` +
            `Active Tiles: ${activeTiles}\n` +
            `Pos: ${Math.floor(player.x)},${Math.floor(player.y)}`
        );
    }
}