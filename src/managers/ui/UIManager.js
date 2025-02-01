/**
 * UIManager.js
 * Main UI management system for the game that handles:
 * - HUD elements (health, stamina, score, lives)
 * - Debug information and FPS counter
 * - Camera management for UI layer
 * - Transitions and animations
 * - Event handling for game state changes
 */

import { GameEvents } from '../core/EventManager';
import { Scene } from 'phaser';
import { TextStyleManager } from '../graphics/TextStyleManager';
import { PlayerHUD } from '../../prefabs/ui/PlayerHUD';

export class UIManager {
    /**
     * Initialize UI manager and set up core components
     * @param {Scene} scene - The Phaser scene this UI belongs to
     */
    constructor(scene) {
        console.log('UIManager: Starting initialization...');
        this.scene = scene;
        
        // === Core UI Setup ===
        this.textStyleManager = new TextStyleManager(scene);
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(100);
        this.lastFpsUpdate = 0;
        this.pendingUpdates = new Map();
        
        // === Dedicated UI Camera ===
        const { width, height } = scene.scale;
        this.uiCamera = scene.cameras.add(0, 0, width, height);
        this.uiCamera.setScroll(0, 0);
        this.container.setScrollFactor(0);

        // === HUD Initialization (e.g. lifebar) ===
        if (this.scene.textures.exists('lifebar')) {
            this.initializePlayerHUD();
        } else {
            this.scene.load.once('complete', () => this.initializePlayerHUD());
        }

        // === UI Components & Event Setup ===
        this.setupUI();
        this.createStartMessage();
        this.createDebugInfo();
        this.updateCameraIgnoreList();

        // Listen for registry changes
        this.scene.registry.events.on('changedata', this.handleRegistryChange, this);
        // Listen for scene changes
        this.scene.events.on('create', this.updateCameraIgnoreList, this);
        this.scene.events.on('wake', this.updateCameraIgnoreList, this);
        this.scene.events.on('resume', this.updateCameraIgnoreList, this);
        this.scene.events.on('addedtoscene', this.handleNewObject, this);
        
        // Game events (e.g. HP changes)
        this.scene.eventManager.on(GameEvents.PLAYER_HP_CHANGED, hp => {
        this.updateHP(hp);
        });
        
        this.debugMode = true;
    }

    /**
     * Initializes PlayerHUD (health/stamina) once assets are ready
     */
    initializePlayerHUD() {
        const PLAYER_HUD_X = 25;
        const PLAYER_HUD_Y = 20;
        this.playerHUD = new PlayerHUD(this.scene, PLAYER_HUD_X, PLAYER_HUD_Y, true);
    }

    /**
     * Ensures new game objects are ignored by UI camera
     * to prevent world objects from appearing in UI layer
     */
    handleNewObject = (gameObject) => {
        if (!this.uiCamera || !gameObject || gameObject === this.container) return;
        try {
            this.uiCamera.ignore(gameObject);
        } catch (error) {
            console.error('Error handling new object:', error);
        }
    };

    /**
     * Updates camera ignore lists to keep UI separate from the main world
     */
    updateCameraIgnoreList() {
        if (!this.uiCamera || !this.scene || !this.container) return;

        try {
            // Make main camera ignore the UI container
            if (this.scene.cameras?.main) {
                this.scene.cameras.main.ignore(this.container);
                if (this.playerHUD?.container) {
                    this.scene.cameras.main.ignore(this.playerHUD.container);
                }
            }

            // UI camera ignores the game world
            this.scene.children.list.forEach(child => {
                if (child && child !== this.container && child !== this.playerHUD?.container) {
                    this.uiCamera.ignore(child);
                }
            });

            // Also ignore certain object groups
            [
                this.scene.player,
                this.scene.enemies,
                this.scene.bullets,
                this.scene.platforms,
                this.scene.background,
                this.scene.techLights,
                this.scene.particles,
                this.scene.spikes
            ].forEach(obj => {
                if (obj) {
                    if (obj.getChildren) {
                        obj.getChildren().forEach(child => {
                            if (child) this.uiCamera.ignore(child);
                        });
                    } else {
                        this.uiCamera.ignore(obj);
                    }
                }
            });
        } catch (error) {
            console.error('Error in updateCameraIgnoreList:', error);
        }
    }

    /**
     * Build & position main UI elements (timer, score, lives, etc.)
     */
    setupUI() {
        const { width, height } = this.scene.scale;
        const LEFT_MARGIN = 25;
        const TOP_MARGIN = 100;
        const VERTICAL_SPACING = 30;
        
        // Clear existing items if we re-setup
        if (this.container.list.length > 0) {
            this.container.removeAll(true);
        }

        // Timer text at the top
        this.timerText = this.scene.add.text(
            LEFT_MARGIN,
            TOP_MARGIN,
            'TIME',
            this.textStyleManager.styles.timer
        );
        this.timerText.setColor('#D2B48C');  // example color

        // Other UI texts: bitcoins, score, lives
        this.bitcoinText = this.scene.add.text(
            LEFT_MARGIN,
            TOP_MARGIN + VERTICAL_SPACING,
            'BITCOINS: 0',
            this.textStyleManager.styles.bitcoin
        );
        this.scoreText = this.scene.add.text(
            LEFT_MARGIN,
            TOP_MARGIN + VERTICAL_SPACING * 2,
            'Score: 0',
            this.textStyleManager.styles.score
        );
        this.livesText = this.scene.add.text(
            LEFT_MARGIN,
            TOP_MARGIN + VERTICAL_SPACING * 3,
            'Lives: 3',
            this.textStyleManager.styles.lives
        );

        // Add all to our container
        [
            this.timerText,
            this.bitcoinText,
            this.scoreText,
            this.livesText
        ].forEach(element => {
            this.container.add(element);
        });

        this.container.setVisible(true);
        this.container.setScrollFactor(0);
        this.container.setDepth(100);
    }

    /**
     * Called by the scene's update loop, if integrated
     * We can keep the HUD in sync (health, stamina) each frame
     */
    update(time, delta) {
        if (!this.scene || !this.scene.registry) return;

        // If there's a PlayerHUD, update from registry
        if (this.playerHUD) {
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

    // Animate UI elements on screen
    fadeInUI() {
        [this.timerText, this.bitcoinText, this.scoreText, this.livesText].forEach(element => {
            if (element) {
                this.scene.tweens.add({
                    targets: element,
                    alpha: 1,
                    duration: 500,
                    ease: 'Power1'
                });
            }
        });
    }

    // Animate UI elements off screen
    fadeOut() {
        if (!this.container) return;
        this.container.list.forEach(element => {
            if (element && typeof element.alpha !== 'undefined') {
                this.scene.tweens.add({
                    targets: element,
                    alpha: 0,
                    duration: 500,
                    ease: 'Power2'
                });
            }
        });
    }

    // Update single scoreboard fields
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

    // Timer logic (UI-managed)
    updateTimer() {
        if (!this.isTimerRunning || !this.timerText) return;
        
        const minutes = Math.floor(this.elapsedSeconds / 60);
        const seconds = this.elapsedSeconds % 60;
        const timeString = `TIME: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        this.timerText.setText(timeString);
    }

    updateBitcoins(bitcoins) {
        if (this.bitcoinText) {
            this.bitcoinText.setText('BITCOINS: ' + bitcoins);
        }
    }

    toggleFPS() {
        if (this.fpsText) {
            this.fpsText.setVisible(!this.fpsText.visible);
        }
    }

    /**
     * Creates a 'Skip Intro' or 'Start' message
     */
    createStartMessage() {
        const { width, height } = this.scene.scale;
        this.startMessageBg = this.scene.add.rectangle(
            width - 120,
            height - 30,
            200,
            40,
            0x000000,
            0.7
        );
        this.startMessageBg.setOrigin(0.5);
        this.startMessageBg.setDepth(999);
        this.startMessageBg.setScrollFactor(0);
        this.startMessageBg.setVisible(false);
        
        this.startMessage = this.scene.add.text(
            width - 120,
            height - 30,
            'Skip Intro (Space)',
            this.textStyleManager.styles.wallet
        );
        this.startMessage.setOrigin(0.5);
        this.startMessage.setDepth(1000);
        this.startMessage.setScrollFactor(0);
        this.startMessage.setVisible(false);
        this.startMessage.setColor('#ffffff');
        
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

    /**
     * Oversee registry changes -> update UI
     */
    setupRegistryListeners() {
        this.scene.registry.events.on('changedata', this.handleRegistryChange, this);

        // Init from current registry
        this.updateScore(this.scene.registry.get('score') || 0);
        this.updateLives(this.scene.registry.get('playerLives') || 3);
        this.updateHP(this.scene.registry.get('playerHP') || 100);
        this.updateBitcoins(this.scene.registry.get('bitcoins') || 0);
    }

    /**
     * Handle registry changes for e.g. 'score', 'lives', 'playerHP', 'time'
     */
    handleRegistryChange(parent, key, value) {
        // If PlayerHUD not ready, store updates for later
        if (!this.playerHUD) {
            if (!this.pendingUpdates) {
                this.pendingUpdates = new Map();
            }
            this.pendingUpdates.set(key, value);
            return;
        }

        switch (key) {
            case 'score':
                if (this.scoreText) {
                    this.scoreText.setText('Score: ' + value);
                }
                break;

            case 'playerHP':
                this.updateHP(value);
                break;

            case 'playerLives':
                if (this.livesText) {
                    this.livesText.setText('Lives: ' + value);
                }
                break;

            case 'stamina':
                if (this.playerHUD) {
                    this.playerHUD.updateStamina(value);
                }
                break;

            case 'bitcoins':
                if (this.bitcoinText) {
                    this.bitcoinText.setText('BITCOINS: ' + value);
                }
                break;

            case 'time':
                // format total seconds into MM:SS
                if (this.timerText) {
                    const totalSeconds = value;
                    const minutes = Math.floor(totalSeconds / 60);
                    const seconds = totalSeconds % 60;
                    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    this.timerText.setText('TIME: ' + formattedTime);
                }
                break;
        }
    }

    /**
     * Animates UI elements into position
     */
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
                this.scene.tweens.add({
                    targets: text,
                    alpha: 1,
                    duration: 500,
                    delay: delay,
                    onComplete: () => {
                        this.scene.tweens.add({
                            targets: text,
                            x: finalPos.x,
                            y: finalPos.y,
                            duration: 1000,
                            ease: 'Power2',
                            onStart: () => text.setOrigin(0, 0)
                        });
                    }
                });
                delay += delayIncrement;
            }
        });

        // Show FPS last
        this.scene.time.delayedCall(delay + 1500, () => {
            if (this.fpsText) this.fpsText.setVisible(true);
        });
    }

    /**
     * Timer controls: start/stop/reset
     */
    startTimer() {
        console.log('[UIManager] startTimer() called');
        this.isTimerRunning = true;
        this.elapsedSeconds = 0;
        
        if (!this.timerEvent) {
            this.timerEvent = this.scene.time.addEvent({
                delay: 1000,  // 1 second
                callback: () => {
                    if (this.isTimerRunning) {
                        this.elapsedSeconds++;
                        this.updateTimer();
                        
                        // If you want the registry to reflect the time:
                        this.scene.registry.set('time', this.elapsedSeconds);
                    }
                },
                callbackScope: this,
                loop: true
            });
        }
        
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

    /**
     * Destroys UI resources (called when scene changes or shuts down)
     */
    destroy() {
        if (this.playerHUD) {
            this.playerHUD.reset();
        }
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        if (this.uiCamera) {
            this.scene.cameras.remove(this.uiCamera);
            this.uiCamera = null;
        }
    }

    /**
     * Shows UI and updates all elements with current values
     */
    show() {
        if (this.container) this.container.setVisible(true);
        if (this.uiCamera) this.uiCamera.setVisible(true);
        this.setupUI();
    }

    /**
     * Creates a debug overlay with semi-transparent background & text
     */
    createDebugInfo() {
        const { width } = this.scene.scale;
        
        this.debugBackground = this.scene.add.rectangle(
            width - 200,
            10,
            190,
            120,
            0x000000,
            0.8
        );
        this.debugBackground.setOrigin(0, 0);
        this.debugBackground.setScrollFactor(0);
        this.container.add(this.debugBackground);

        this.debugInfo = this.scene.add.text(
            width - 190,
            15,
            'Debug Info',
            {
                fontSize: '16px',
                fontFamily: 'Arial',
                fill: '#ffffff',
                padding: { x: 5, y: 5 }
            }
        );
        this.debugInfo.setScrollFactor(0);
        this.container.add(this.debugInfo);

        this.scene.events.on('update', this.updateDebugInfo, this);
    }

    /**
     * Updates the debug overlay with current game state (player pos, etc.)
     */
    updateDebugInfo() {
        if (!this.debugInfo || !this.scene.player) return;

        const player = this.scene.player;
        const currentSection = Math.floor(player.x / this.scene.sectionWidth);
        const loadedSections = this.scene.loadedSections
            ? this.scene.loadedSections.size
            : 0;
        const activeTiles = this.scene.groundLayer
            ? this.scene.groundLayer.getTilesWithin().filter(t => t.index !== -1).length +
              this.scene.platformLayer.getTilesWithin().filter(t => t.index !== -1).length
            : 0;

        const entityStats = this.scene.entityStats || {
            totalLoaded: 0,
            totalUnloaded: 0,
            activeBySection: new Map()
        };
        let totalCurrentEntities = 0;
        entityStats.activeBySection.forEach(count => {
            totalCurrentEntities += count;
        });

        const debugText = [
            `Section: ${currentSection}`,
            `Loaded Sections: ${loadedSections}`,
            `Active Tiles: ${activeTiles}`,
            `Entities Loaded: ${entityStats.totalLoaded}`,
            `Entities Unloaded: ${entityStats.totalUnloaded}`,
            `Active Entities: ${totalCurrentEntities}`,
            `Entities/Section: ${Array.from(entityStats.activeBySection.entries())
                .map(([section, count]) => `[${section}:${count}]`)
                .join(' ')}`
        ].join('\n');

        this.debugInfo.setText(debugText);

        const lineCount = debugText.split('\n').length;
        const lineHeight = 20;
        const padding = 20;
        this.debugBackground.height = lineCount * lineHeight + padding;

        this.debugBackground.x = this.scene.scale.width - 200;
        this.debugInfo.x = this.scene.scale.width - 190;
    }
}
