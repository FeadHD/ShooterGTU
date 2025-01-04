import { Scene } from 'phaser';
import { TextStyleManager } from '../../modules/managers/TextStyleManager';

export class GameUI {
    constructor(scene) {
        this.scene = scene;
        
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

        // Set up UI elements
        this.setupUI();

        // Create start message (hidden by default)
        this.createStartMessage();

        // Initial camera setup
        this.updateCameraIgnoreList();

        // Set up registry event listeners
        this.setupRegistryListeners();
        
        // Listen for scene events
        this.scene.events.on('create', this.updateCameraIgnoreList, this);
        this.scene.events.on('wake', this.updateCameraIgnoreList, this);
        this.scene.events.on('resume', this.updateCameraIgnoreList, this);
        
        // Listen for new objects
        this.scene.events.on('addedtoscene', this.handleNewObject, this);
        
        // Debug log
        console.log('GameUI initialized:', {
            container: this.container ? 'created' : 'null',
            uiCamera: this.uiCamera ? 'created' : 'null',
            scene: this.scene.scene.key
        });
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

        // Create container if it doesn't exist
        if (!this.container) {
            this.container = this.scene.add.container(0, 0);
            this.container.setDepth(100);
        }

        // Clear existing UI elements
        if (this.container.list.length > 0) {
            this.container.removeAll(true);
        }

        // Create UI camera if it doesn't exist
        if (!this.uiCamera) {
            this.uiCamera = this.scene.cameras.add(0, 0, width, height);
            this.uiCamera.setScroll(0, 0);
        }

        // Create score text
        this.scoreText = TextStyleManager.createText(
            this.scene,
            LEFT_MARGIN,
            TOP_MARGIN,
            'SCORE: 0',
            'scoreUI'
        );
        this.container.add(this.scoreText);

        // Create lives text
        this.livesText = TextStyleManager.createText(
            this.scene,
            LEFT_MARGIN,
            TOP_MARGIN + VERTICAL_SPACING,
            'LIVES: 3',
            'livesUI'
        );
        this.container.add(this.livesText);

        // Create HP text
        this.hpText = TextStyleManager.createText(
            this.scene,
            LEFT_MARGIN,
            TOP_MARGIN + VERTICAL_SPACING * 2,
            'HP: 100',
            'hpUI'
        );
        this.container.add(this.hpText);

        // Create timer text
        this.timerText = TextStyleManager.createText(
            this.scene,
            LEFT_MARGIN,
            TOP_MARGIN + VERTICAL_SPACING * 3,
            'TIME: 00:00',
            'timerUI'
        );
        this.container.add(this.timerText);

        // Create bitcoins text
        this.bitcoinsText = TextStyleManager.createText(
            this.scene,
            LEFT_MARGIN,
            TOP_MARGIN + VERTICAL_SPACING * 4,
            'BITCOINS: 0',
            'bitcoinUI'
        );
        this.container.add(this.bitcoinsText);

        // Create FPS counter (hidden initially)
        this.fpsText = TextStyleManager.createText(
            this.scene,
            LEFT_MARGIN,
            height - 30,
            'FPS: 60',
            'gameUI'
        );
        this.fpsText.setVisible(false);
        this.container.add(this.fpsText);

        // Set initial alpha to 0 for fade-in effect
        [this.scoreText, this.livesText, this.hpText, this.timerText, this.bitcoinsText].forEach(element => {
            if (element) element.setAlpha(0);
        });
    }

    update(time, delta) {
        // Update FPS counter
        if (time > this.lastFpsUpdate + 100) {
            this.fpsText.setText('FPS: ' + (1000 / delta).toFixed(1));
            this.lastFpsUpdate = time;
        }
    }

    fadeIn() {
        if (!this.container) return;
        
        this.container.list.forEach(element => {
            if (element && element.alpha !== undefined) {
                this.scene.tweens.add({
                    targets: element,
                    alpha: 1,
                    duration: 500,
                    ease: 'Power2'
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
            this.scoreText.setText('SCORE: ' + score);
        }
    }

    updateLives(lives) {
        if (this.livesText) {
            this.livesText.setText('LIVES: ' + lives);
        }
    }

    updateHP(hp) {
        if (this.hpText) {
            this.hpText.setText(`HP: ${hp}`);
        }
    }

    updateTimer() {
        if (!this.isTimerRunning || !this.timerText) return;
        
        const minutes = Math.floor(this.elapsedSeconds / 60);
        const seconds = this.elapsedSeconds % 60;
        this.timerText.setText(`TIME: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }

    updateBitcoins(bitcoins) {
        if (this.bitcoinsText) {
            this.bitcoinsText.setText('BITCOINS: ' + bitcoins);
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
        this.startMessage = TextStyleManager.createText(
            this.scene,
            width - 120, // Same x as background
            height - 30, // Same y as background
            'Skip Intro (Space)',
            'walletUI'
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
        this.scene.registry.events.on('changedata', (parent, key, value) => {
            switch(key) {
                case 'score':
                    this.updateScore(value);
                    break;
                case 'lives':
                    this.updateLives(value);
                    break;
                case 'playerHP':
                    this.updateHP(value);
                    break;
                case 'bitcoins':
                    this.updateBitcoins(value);
                    break;
            }
        });
        
        // Initial update from registry
        this.updateScore(this.scene.registry.get('score') || 0);
        this.updateLives(this.scene.registry.get('lives') || 3);
        this.updateHP(this.scene.registry.get('playerHP') || 100);
        this.updateBitcoins(this.scene.registry.get('bitcoins') || 0);
    }

    animateUIElements() {
        const elements = [
            { text: this.scoreText, finalPos: { x: 25, y: 20 } },
            { text: this.livesText, finalPos: { x: 25, y: 50 } },
            { text: this.hpText, finalPos: { x: 25, y: 80 } },
            { text: this.timerText, finalPos: { x: 25, y: 110 } },
            { text: this.bitcoinsText, finalPos: { x: 25, y: 140 } }
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
}