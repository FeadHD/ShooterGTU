import { Scene } from 'phaser';
import { TextStyleManager } from '../../modules/managers/TextStyleManager';
import { eventBus } from '../../modules/events/EventBus';
import { GameConfig } from '../../config/GameConfig';
import { PlayerHUD } from '../../prefabs/ui/PlayerHUD';

export class UIManager {
    constructor(scene) {
        console.log('UIManager: Starting initialization...');
        this.scene = scene;
        
        // Initialize TextStyleManager
        this.textStyleManager = new TextStyleManager(scene);
        
        // Create main UI container
        console.log('UIManager: Creating UI container');
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(100);
        this.lastFpsUpdate = 0;
        
        // Create UI camera that stays fixed
        console.log('UIManager: Setting up UI camera');
        const { width, height } = scene.scale;
        this.uiCamera = scene.cameras.add(0, 0, width, height);
        this.uiCamera.setScroll(0, 0);
        
        // Make UI elements fixed on screen
        this.container.setScrollFactor(0);

        // Store registry updates that happen before PlayerHUD is ready
        this.pendingUpdates = new Map();

        // Wait for assets to be loaded before initializing PlayerHUD
        this.scene.load.once('complete', () => {
            console.log('UIManager: Assets loaded, initializing PlayerHUD');
            const PLAYER_HUD_X = 25;
            const PLAYER_HUD_Y = 20;
            this.playerHUD = new PlayerHUD(scene, PLAYER_HUD_X, PLAYER_HUD_Y, true);
            
            console.log('UIManager: Setting up initial UI elements');
            this.setupUI();
            this.createStartMessage();
            this.createDebugInfo();
            this.updateCameraIgnoreList();

            // Apply any pending updates
            this.pendingUpdates.forEach((value, key) => {
                this.handleRegistryChange(null, key, value);
            });
            this.pendingUpdates.clear();
        });
        
        console.log('UIManager: Setting up event listeners');
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
            console.log('UIManager: Updating HP display:', hp);
            this.updateHP(hp);
        });
        
        // Debug flag
        this.debugMode = true;
        console.log('UIManager: Initialization complete');
    }

    // ============================
    // SECTION: OBJECT MANAGEMENT
    // ============================
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
                if (child && child !== this.container && !child.isUIElement) {
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

    // ============================
    // SECTION: UI CREATION
    // ============================
    setupUI() {
        const { width, height } = this.scene.scale;
        console.log('UIManager: Setting up UI elements...');

        try {
            // Constants for UI positioning
            const LEFT_MARGIN = 25;
            const TOP_MARGIN = 100;  // Increased to be below PlayerHUD
            const VERTICAL_SPACING = 30;
            const TEXT_WIDTH = 150;

            // Clear existing UI elements
            console.log('UIManager: Clearing existing UI elements');
            if (this.container.list.length > 0) {
                this.container.removeAll(true);
            }

            // Create timer text (first)
            console.log('UIManager: Creating timer text');
            this.timerText = this.scene.add.text(LEFT_MARGIN, TOP_MARGIN, 'Time: 00:00', this.textStyleManager.styles.score);
            this.container.add(this.timerText);

            // Create bitcoins text (second)
            console.log('UIManager: Creating bitcoins text');
            this.bitcoinText = this.scene.add.text(LEFT_MARGIN, TOP_MARGIN + VERTICAL_SPACING, 'Bitcoins: 0', this.textStyleManager.styles.score);
            this.container.add(this.bitcoinText);

            // Create score text (third)
            console.log('UIManager: Creating score text');
            this.scoreText = this.scene.add.text(LEFT_MARGIN, TOP_MARGIN + VERTICAL_SPACING * 2, 'Score: 0', this.textStyleManager.styles.score);
            this.container.add(this.scoreText);

            // Create lives text (fourth)
            console.log('UIManager: Creating lives text');
            this.livesText = this.scene.add.text(LEFT_MARGIN, TOP_MARGIN + VERTICAL_SPACING * 3, 'Lives: 3', this.textStyleManager.styles.score);
            this.container.add(this.livesText);

            // Make sure all UI elements are visible
            console.log('UIManager: Setting visibility and scroll factors');
            this.container.setVisible(true);
            this.container.setScrollFactor(0);
            this.container.setDepth(100);

            console.log('UIManager: UI setup complete');
        } catch (error) {
            console.error('Error in setupUI:', error);
        }
    }

    // ============================
    // SECTION: UPDATE LOOP
    // ============================
    update(time, delta) {
        if (!this.scene || !this.scene.registry) return;

        // Update FPS counter every 100ms
        if (this.fpsText && time - this.lastFpsUpdate > 100) {
            this.fpsText.setText('FPS: ' + (1000 / delta).toFixed(1));
            this.lastFpsUpdate = time;
        }

        // Only update PlayerHUD if it's initialized
        if (this.playerHUD) {
            // Update stamina and health through PlayerHUD
            const currentStamina = this.scene.registry.get('stamina');
            const currentHealth = this.scene.registry.get('playerHP');
            
            if (currentStamina !== undefined) {
                this.playerHUD.updateStamina(currentStamina);
            }
            
            if (currentHealth !== undefined) {
                this.playerHUD.updateHealth(currentHealth);
            }
        }
    }

    fadeInUI() {
        const duration = 500;
        const ease = 'Power1';
        
        [this.timerText, this.bitcoinText, this.scoreText, this.livesText].forEach(element => {
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

    // ============================
    // SECTION: UI UPDATERS
    // ============================
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
        if (this.playerHUD) {
            this.playerHUD.updateHealth(hp);
        }
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

    // ============================
    // SECTION: START MESSAGE
    // ============================
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

    // ============================
    // SECTION: REGISTRY / DATA
    // ============================
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
        // If PlayerHUD isn't ready yet, store the update for later
        if (!this.playerHUD) {
            this.pendingUpdates.set(key, value);
            return;
        }

        switch (key) {
            case 'score':
                if (this.scoreText) {
                    this.scoreText.setText('Score: ' + value);
                }
                break;
            case 'lives':
                if (this.livesText) {
                    this.livesText.setText('Lives: ' + value);
                }
                break;
            case 'playerHP':
                this.updateHP(value);
                break;
            case 'stamina':
                if (this.playerHUD) {
                    this.playerHUD.updateStamina(value);
                }
                break;
            case 'bitcoins':
                if (this.bitcoinText) {
                    this.bitcoinText.setText('Bitcoins: ' + value);
                }
                break;
        }
    }

    // ============================
    // SECTION: UI ANIMATIONS
    // ============================
    animateUIElements() {
        const elements = [
            { text: this.timerText, finalPos: { x: 25, y: 100 } },
            { text: this.bitcoinText, finalPos: { x: 25, y: 130 } },
            { text: this.scoreText, finalPos: { x: 25, y: 160 } },
            { text: this.livesText, finalPos: { x: 25, y: 190 } }
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

    // ============================
    // SECTION: TIMER CONTROLS
    // ============================
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

    // ============================
    // SECTION: CLEANUP & VISIBILITY
    // ============================
    destroy() {
        if (this.playerHUD) {
            this.playerHUD.reset();
        }
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

    // ============================
    // SECTION: DEBUG INFO
    // ============================
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
        
        // Style the text
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
