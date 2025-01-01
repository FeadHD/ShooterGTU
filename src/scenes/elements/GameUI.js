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
            const { width, height } = this.scene.scale;
            this.uiCamera = this.scene.cameras.add(0, 0, width, height);
            this.uiCamera.setScroll(0, 0);
        }

        // Create score text
        this.scoreText = TextStyleManager.createText(
            this.scene,
            20,
            20,
            'SCORE: 0',
            'scoreUI',
            0
        );
        this.container.add(this.scoreText);

        // Create lives text
        this.livesText = TextStyleManager.createText(
            this.scene,
            20,
            50,
            'LIVES: 3',
            'livesUI',
            0
        );
        this.container.add(this.livesText);

        // Create HP text
        this.hpText = TextStyleManager.createText(
            this.scene,
            20,
            80,
            'HP: 100',
            'hpUI',
            0
        );
        this.container.add(this.hpText);

        // Create bitcoins text
        this.bitcoinsText = TextStyleManager.createText(
            this.scene,
            20,
            110,
            'BITCOINS: 0',
            'bitcoinUI',
            0
        );
        this.container.add(this.bitcoinsText);

        // Create timer text
        this.timerText = TextStyleManager.createText(
            this.scene,
            20,
            144,
            'TIME: 00:00',
            'timerUI',
            0
        );
        this.container.add(this.timerText);

        // Create FPS counter
        this.fpsText = TextStyleManager.createText(
            this.scene,
            width - 20,
            20,
            'FPS: 60',
            'gameUI',
            1
        );
        this.container.add(this.fpsText);

        // Create scene text
        this.sceneText = TextStyleManager.createText(
            this.scene,
            width / 2,
            20,
            'SCENE 1',
            'sceneUI',
            0.5
        );
        this.container.add(this.sceneText);

        // Setup music controls
        this.setupMusicControls();

        // Create wallet display
        const walletAddress = this.scene.registry.get('walletAddress');
        const displayAddress = walletAddress ? 
            walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4) : 
            'Not Connected';
        this.walletText = TextStyleManager.createText(
            this.scene,
            width - 500,
            16,
            `Wallet: ${displayAddress}`,
            'walletUI',
            0
        );
        this.walletText.setInteractive({ useHandCursor: true });
        this.walletText.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            if (!this.walletText.text.includes('0x')) {
                this.scene.events.emit('connectWallet');
            }
        });
        this.container.add(this.walletText);

        // Update camera ignore list
        this.updateCameraIgnoreList();
    }

    setupMusicControls() {
        const { width } = this.scene.scale;
        
        // Create music button
        this.musicContainer = this.scene.add.container(width - 150, 16);
        const musicLabel = TextStyleManager.createText(
            this.scene,
            0,
            0,
            'MUSIC:',
            'walletUI',
            0
        );
        
        this.musicOnText = TextStyleManager.createText(
            this.scene,
            70,
            0,
            'ON',
            'walletUI',
            0
        );
        
        this.musicOffText = TextStyleManager.createText(
            this.scene,
            70,
            0,
            'OFF',
            'walletUI',
            0
        );
        
        // Set initial state
        this.musicOnText.setVisible(this.scene.sound.mute ? false : true);
        this.musicOffText.setVisible(this.scene.sound.mute ? true : false);
        
        // Make texts interactive
        [this.musicOnText, this.musicOffText].forEach(text => {
            text.setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    this.scene.sound.mute = !this.scene.sound.mute;
                    this.musicOnText.setVisible(!this.scene.sound.mute);
                    this.musicOffText.setVisible(this.scene.sound.mute);
                });
        });
        
        this.musicContainer.add([musicLabel, this.musicOnText, this.musicOffText]);
        this.container.add(this.musicContainer);
    }

    createStartMessage() {
        const { width, height } = this.scene.scale;
        
        this.startMessage = TextStyleManager.createText(
            this.scene,
            width / 2,
            height / 2,
            'Press SPACE to start',
            'startMessage'
        );
        
        this.container.add(this.startMessage);
        this.startMessage.setVisible(false);
    }

    showStartMessage() {
        if (this.startMessage) {
            this.startMessage.setVisible(true);
        }
    }

    hideStartMessage() {
        if (this.startMessage) {
            this.startMessage.setVisible(false);
        }
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
                    }
                },
                callbackScope: this,
                loop: true
            });
        }
    }

    updateTimer() {
        if (!this.isTimerRunning || !this.timerText) return;
        
        const minutes = Math.floor(this.elapsedSeconds / 60);
        const seconds = this.elapsedSeconds % 60;
        this.timerText.setText(`TIME: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
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

    update(time) {
        // Update performance counters if debug is enabled
        if (this.scene.debugSystem?.enabled) {
            this.fpsText.setVisible(true);
            if (time - this.lastFpsUpdate > 500) {
                // Update FPS
                const fps = Math.round(this.scene.game.loop.actualFps);
                if (this.fpsText) {
                    this.fpsText.setText(`FPS: ${fps}`);
                }
                
                this.lastFpsUpdate = time;
            }
        } else {
            this.fpsText.setVisible(false);
        }
    }

    updateScore(points) {
        if (this.scoreText) {
            this.scoreText.setText(`SCORE: ${points}`);
        }
    }

    updateLives(lives) {
        if (this.livesText) {
            this.livesText.setText(`LIVES: ${lives}`);
        }
    }

    updateHP(hp) {
        if (this.hpText) {
            this.hpText.setText(`HP: ${hp}`);
        }
    }

    updateBitcoins(bitcoins) {
        if (this.bitcoinsText) {
            this.bitcoinsText.setText(`BITCOINS: ${bitcoins}`);
        }
    }

    showGameOver() {
        // Get the camera's viewport dimensions
        const camera = this.scene.cameras.main;
        const width = camera.width;
        const height = camera.height;

        // Add dark overlay that follows the camera
        const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setDepth(98)
            .setScrollFactor(0);

        // Create main container for all game over elements
        const mainContainer = this.scene.add.container(width/2, height/2)
            .setDepth(99)
            .setScrollFactor(0);

        // Create "GAME OVER" text with shadow layers
        const gameOverContainer = this.scene.add.container(0, -100);
        const shadowOffset = 4;
        const numLayers = 3;
        
        for (let i = numLayers; i >= 0; i--) {
            const layerColor = i === 0 ? '#ff0000' : '#ff00ff';
            const gameOverText = TextStyleManager.createText(
                this.scene,
                i * shadowOffset,
                i * shadowOffset,
                'GAME OVER',
                'gameOver',
                0
            ).setOrigin(0.5);
            gameOverContainer.add(gameOverText);
        }

        // Add final score
        const finalScore = this.scene.registry.get('score');
        const scoreText = TextStyleManager.createText(
            this.scene,
            0,
            0,
            `FINAL SCORE: ${finalScore}`,
            'gameOver',
            0
        ).setOrigin(0.5);

        // Add instruction text
        const instructionText = TextStyleManager.createText(
            this.scene,
            0,
            100,
            'PRESS SPACE TO CONTINUE',
            'gameOver',
            0
        ).setOrigin(0.5);

        // Add all elements to the main container
        mainContainer.add([gameOverContainer, scoreText, instructionText]);

        // Add blinking effect to instruction text
        this.scene.tweens.add({
            targets: instructionText,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Add glitch effect to Game Over text
        this.scene.time.addEvent({
            delay: 2000,
            callback: () => {
                this.scene.tweens.add({
                    targets: gameOverContainer,
                    x: Phaser.Math.Between(-5, 5),
                    y: -100 + Phaser.Math.Between(-5, 5),
                    duration: 50,
                    yoyo: true,
                    repeat: 3
                });
            },
            loop: true
        });

        // Return references to the created elements
        return {
            overlay,
            gameOverContainer: mainContainer,
            scoreText,
            instructionText
        };
    }

    updateInstruction(text) {
        // Removed
    }

    showShootingInstruction() {
        // Removed
    }

    showDefeatInstruction() {
        // Removed
    }

    hideInstruction() {
        // Removed
    }

    showInstruction() {
        // Removed
    }

    destroy() {
        // Stop and clean up timer
        if (this.timerEvent) {
            this.timerEvent.destroy();
            this.timerEvent = null;
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
}