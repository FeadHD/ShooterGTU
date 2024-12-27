import { Scene } from 'phaser';

export class GameUI {
    constructor(scene) {
        this.scene = scene;
        this.textConfig = {
            fontSize: '24px',
            fontFamily: 'Retronoid'
        };
        
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
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
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

        // Create scene name text
        this.sceneNameText = this.scene.add.text(width/2, width * 0.02, 'Scene 1', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);
        this.container.add(this.sceneNameText);

        // Create instruction text
        this.instructionText = this.scene.add.text(width/2, width * 0.05, 'Defeat all enemies to proceed!', {
            fontFamily: 'Retronoid',
            fontSize: '24px',
            fill: '#ff0'
        }).setOrigin(0.5);
        this.container.add(this.instructionText);

        // Create UI elements
        this.createScoreDisplay();
        this.createLivesDisplay();
        this.createHPDisplay();
        this.createBitcoinCounter();
        this.createTimer();
        this.createMusicButton(width);
        this.createWalletDisplay(width);
        this.setupWalletListeners();
        this.createFPSCounter(width, height);

        // Update camera ignore list
        this.updateCameraIgnoreList();
    }

    createScoreDisplay() {
        // Get current score from registry
        const currentScore = this.scene.registry.get('score') || 0;
        
        // Create score text with consistent styling
        this.scoreText = this.scene.add.text(16, 16, `Score: ${currentScore}`, {
            fontFamily: 'Retronoid',
            fontSize: '24px',
            fill: '#00ffff', // Cyan color
            stroke: '#000000',
            strokeThickness: 4
        });
        
        this.container.add(this.scoreText);

        // Listen for score changes
        this.scene.registry.events.on('changedata-score', (parent, value) => {
            this.scoreText.setText(`Score: ${value}`);
        });
    }

    createLivesDisplay() {
        // Get current lives from registry
        const lives = this.scene.registry.get('lives') || 3;
        
        // Create lives text with consistent styling
        this.livesText = this.scene.add.text(16, 48, `Lives: ${lives}`, {
            fontFamily: 'Retronoid',
            fontSize: '24px',
            fill: '#ff0000', // Red color
            stroke: '#000000',
            strokeThickness: 4
        });
        
        this.container.add(this.livesText);

        // Listen for lives changes
        this.scene.registry.events.on('changedata-lives', (parent, value) => {
            this.livesText.setText(`Lives: ${value}`);
        });
    }

    createHPDisplay() {
        // Get current HP from registry
        const hp = this.scene.registry.get('playerHP') || this.scene.playerHP || 100;
        
        // Create HP text with consistent styling
        this.hpText = this.scene.add.text(16, 80, `HP: ${hp}`, {
            fontFamily: 'Retronoid',
            fontSize: '24px',
            fill: '#00ff00', // Green color
            stroke: '#000000',
            strokeThickness: 4
        });
        
        this.container.add(this.hpText);

        // Listen for HP changes
        this.scene.registry.events.on('changedata-playerHP', (parent, value) => {
            this.hpText.setText(`HP: ${value}`);
        });
    }

    createBitcoinCounter() {
        // Get current bitcoin count from registry
        const currentBitcoins = this.scene.registry.get('bitcoins') || 0;
        
        // Create bitcoin text
        this.bitcoinText = this.scene.add.text(16, 112, `Bitcoin: ${currentBitcoins}`, {
            fontFamily: 'Retronoid',
            fontSize: '24px',
            fill: '#FFD700', // Gold color
            stroke: '#000000',
            strokeThickness: 4
        });
        
        this.container.add(this.bitcoinText);

        // Listen for bitcoin count changes
        this.scene.registry.events.on('changedata-bitcoins', (parent, value) => {
            this.bitcoinText.setText(`Bitcoin: ${value}`);
        });
    }

    createTimer() {
        // Initialize timer variables
        this.elapsedSeconds = 0;
        this.isTimerRunning = true;

        // Create timer text
        this.timerText = this.scene.add.text(16, 144, 'Time: 00:00', {
            fontFamily: 'Retronoid',
            fontSize: '24px',
            fill: '#00ffff', // Cyan color
            stroke: '#000000',
            strokeThickness: 4
        });

        // Add to container
        this.container.add(this.timerText);

        // Create timer event
        this.timerEvent = this.scene.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    updateTimer() {
        if (!this.isTimerRunning) return;
        
        this.elapsedSeconds++;
        const minutes = Math.floor(this.elapsedSeconds / 60);
        const seconds = this.elapsedSeconds % 60;
        
        // Update timer text with leading zeros
        this.timerText.setText(`Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }

    stopTimer() {
        this.isTimerRunning = false;
        if (this.timerEvent) {
            this.timerEvent.destroy();
            this.timerEvent = null;
        }
    }

    resetTimer() {
        // Destroy existing timer event if it exists
        if (this.timerEvent) {
            this.timerEvent.destroy();
            this.timerEvent = null;
        }
        
        this.elapsedSeconds = 0;
        this.isTimerRunning = true;
        
        // Create new timer event
        this.timerEvent = this.scene.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
        
        this.updateTimer();
    }

    createMusicButton(width) {
        // Create container for music controls
        this.musicContainer = this.scene.add.container(width - 150, 16);
        
        // Create music label with consistent styling
        const musicLabel = this.scene.add.text(0, 0, 'Music:', {
            fontFamily: 'Retronoid',
            fontSize: '24px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        
        // Create ON text
        this.musicOnText = this.scene.add.text(musicLabel.width + 10, 0, 'ON', {
            fontFamily: 'Retronoid',
            fontSize: '24px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4
        });
        
        // Create OFF text (initially hidden)
        this.musicOffText = this.scene.add.text(musicLabel.width + 10, 0, 'OFF', {
            fontFamily: 'Retronoid',
            fontSize: '24px',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.musicOffText.setVisible(false);
        
        // Add all texts to the container
        this.musicContainer.add([musicLabel, this.musicOnText, this.musicOffText]);
        
        // Make both texts interactive and stop event propagation
        this.musicOnText.setInteractive({ useHandCursor: true });
        this.musicOffText.setInteractive({ useHandCursor: true });
        
        this.musicOnText.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            this.toggleMusic();
        });
        
        this.musicOffText.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            this.toggleMusic();
        });
        
        // Add to main UI container
        this.container.add(this.musicContainer);
        
        // Listen for music state changes
        this.scene.registry.events.on('changedata-musicEnabled', (parent, value) => {
            this.updateMusicButtonState(value);
        });
        
        // Set initial state from registry or bgMusic state
        const bgMusic = this.scene.sound.get('bgMusic');
        const isMusicEnabled = this.scene.registry.get('musicEnabled');
        const initialState = isMusicEnabled !== undefined ? isMusicEnabled : (bgMusic ? bgMusic.isPlaying : true);
        this.updateMusicButtonState(initialState);
    }

    updateMusicButtonState(isEnabled) {
        if (this.musicOnText && this.musicOffText) {
            this.musicOnText.setVisible(isEnabled);
            this.musicOffText.setVisible(!isEnabled);
        }
    }

    toggleMusic() {
        const bgMusic = this.scene.sound.get('bgMusic');
        if (bgMusic) {
            const newState = !bgMusic.isPlaying;
            if (newState) {
                bgMusic.resume();
            } else {
                bgMusic.pause();
            }
            this.scene.registry.set('musicEnabled', newState);
            this.updateMusicButtonState(newState);
        }
    }

    createWalletDisplay(width) {
        const walletAddress = this.scene.registry.get('walletAddress');
        const displayAddress = walletAddress ? 
            walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4) : 
            'Not Connected';
        
        // Create wallet text with matching bitcoin style
        this.walletText = this.scene.add.text(width - 500, 16, `Wallet: ${displayAddress}`, {
            fontFamily: 'Retronoid',
            fontSize: '24px',
            fill: '#ffffff', // Changed to white
            stroke: '#000000',
            strokeThickness: 4
        });
        
        this.walletText.setInteractive({ useHandCursor: true });
        this.walletText.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            if (!this.walletText.text.includes('0x')) {
                this.scene.events.emit('connectWallet');
            }
        });

        this.container.add(this.walletText);
    }

    setupWalletListeners() {
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    const displayAddress = accounts[0].slice(0, 6) + '...' + accounts[0].slice(-4);
                    this.walletText.setText(`Wallet: ${displayAddress}`);
                } else {
                    this.walletText.setText('Wallet: Not Connected');
                }
            });
        }
    }

    createFPSCounter(width, height) {
        // Create FPS counter in bottom left
        this.fpsCounter = this.scene.add.text(16, height - 64, 'FPS: 0', {
            fontFamily: 'Retronoid',
            fontSize: '20px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4
        });
        
        // Create memory counter below FPS
        this.memCounter = this.scene.add.text(16, height - 32, 'Memory: 0 MB', {
            fontFamily: 'Retronoid',
            fontSize: '20px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4
        });
        
        this.fpsCounter.setScrollFactor(0);
        this.memCounter.setScrollFactor(0);
        this.fpsCounter.setVisible(false);
        this.memCounter.setVisible(false);
        this.container.add([this.fpsCounter, this.memCounter]);
    }

    update(time) {
        // Update performance counters if debug is enabled
        if (this.scene.debugSystem?.enabled) {
            this.fpsCounter?.setVisible(true);
            this.memCounter?.setVisible(true);
            
            if (time - this.lastFpsUpdate > 500) {
                // Update FPS
                const fps = Math.round(this.scene.game.loop.actualFps);
                if (this.fpsCounter) {
                    this.fpsCounter.setText(`FPS: ${fps}`);
                }
                
                // Update Memory Usage
                if (this.memCounter && window.performance && window.performance.memory) {
                    const memoryUsed = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
                    const memoryTotal = Math.round(window.performance.memory.totalJSHeapSize / (1024 * 1024));
                    this.memCounter.setText(`Memory: ${memoryUsed}/${memoryTotal} MB`);
                    
                    // Change color based on memory usage
                    const memoryPercentage = memoryUsed / memoryTotal;
                    let color = '#00ff00'; // Green
                    if (memoryPercentage > 0.8) {
                        color = '#ff0000'; // Red
                    } else if (memoryPercentage > 0.6) {
                        color = '#ffff00'; // Yellow
                    }
                    this.memCounter.setFill(color);
                }
                
                this.lastFpsUpdate = time;
            }
        } else {
            this.fpsCounter?.setVisible(false);
            this.memCounter?.setVisible(false);
        }
    }

    updateScore(points) {
        const currentScore = this.scene.registry.get('score');
        const newScore = currentScore + points;
        this.scene.registry.set('score', newScore);
        this.scoreText.setText('Score: ' + newScore);
    }

    updateLives(lives) {
        this.livesText.setText('Lives: ' + lives);
    }

    updateHP(hp) {
        this.scene.registry.set('playerHP', hp);
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
            const gameOverText = this.scene.add.text(i * shadowOffset, i * shadowOffset, 'GAME OVER', {
                fontFamily: 'Retronoid',
                fontSize: '72px',
                color: layerColor,
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
            gameOverContainer.add(gameOverText);
        }

        // Add final score
        const finalScore = this.scene.registry.get('score');
        const scoreText = this.scene.add.text(0, 0, `FINAL SCORE: ${finalScore}`, {
            fontFamily: 'Retronoid',
            fontSize: '48px',
            color: '#00ffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#ff00ff',
                blur: 5,
                fill: true
            }
        }).setOrigin(0.5);

        // Add instruction text
        const instructionText = this.scene.add.text(0, 100, 'PRESS SPACE TO CONTINUE', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            color: '#ffd700',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

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