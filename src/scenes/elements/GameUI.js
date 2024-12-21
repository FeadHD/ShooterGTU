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
        console.log('Setting up UI...');
        this.createScoreDisplay();
        this.createLivesDisplay();
        this.createHPDisplay();
        this.createSettingsButton(width);
        this.createWalletDisplay(width);
        this.setupWalletListeners();
    }

    createScoreDisplay() {
        const currentScore = this.scene.registry.get('score') || 0;
        console.log('Creating score display with value:', currentScore);
        
        this.scoreText = this.scene.add.text(16, 16, 'Score: ' + currentScore, {
            ...this.textConfig,
            fill: '#fff'
        });
        
        console.log('Score Text created:', {
            x: this.scoreText.x,
            y: this.scoreText.y,
            text: this.scoreText.text,
            visible: this.scoreText.visible,
            alpha: this.scoreText.alpha
        });
        
        this.container.add(this.scoreText);
        
        console.log('Container after adding score:', {
            x: this.container.x,
            y: this.container.y,
            visible: this.container.visible,
            alpha: this.container.alpha,
            children: this.container.length
        });
    }

    createLivesDisplay() {
        console.log('Creating lives display...');
        this.livesText = this.scene.add.text(16, 56, 'Lives: ' + this.scene.registry.get('lives'), {
            ...this.textConfig,
            fill: '#ff0000'
        });
        
        console.log('Lives Text created:', {
            x: this.livesText.x,
            y: this.livesText.y,
            text: this.livesText.text,
            visible: this.livesText.visible,
            alpha: this.livesText.alpha
        });
        
        this.container.add(this.livesText);
        
        console.log('Container after adding lives:', {
            x: this.container.x,
            y: this.container.y,
            visible: this.container.visible,
            alpha: this.container.alpha,
            children: this.container.length
        });
    }

    createHPDisplay() {
        const hp = this.scene.playerHP;
        console.log('Creating HP display with value:', hp);
        
        this.hpText = this.scene.add.text(16, 96, 'HP: ' + hp, {
            ...this.textConfig,
            fill: '#00ff00'
        });
        
        console.log('HP Text created:', {
            x: this.hpText.x,
            y: this.hpText.y,
            text: this.hpText.text,
            visible: this.hpText.visible,
            alpha: this.hpText.alpha
        });
        
        this.container.add(this.hpText);
        
        console.log('Container after adding HP:', {
            x: this.container.x,
            y: this.container.y,
            visible: this.container.visible,
            alpha: this.container.alpha,
            children: this.container.length
        });
    }

    createSettingsButton(width) {
        console.log('Creating settings button...');
        this.settingsButton = this.scene.add.text(width - 20, 20, '⚙️ Music', {
            fontSize: '20px',
            fontFamily: 'Retronoid',
            fill: '#fff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
            stroke: '#ffffff',
            strokeThickness: 1
        })
        .setOrigin(1, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.settingsButton.setStyle({ fill: '#ff0' }))
        .on('pointerout', () => this.settingsButton.setStyle({ fill: '#fff' }))
        .on('pointerdown', () => this.toggleMusic());
        
        console.log('Settings Button created:', {
            x: this.settingsButton.x,
            y: this.settingsButton.y,
            text: this.settingsButton.text,
            visible: this.settingsButton.visible,
            alpha: this.settingsButton.alpha
        });
        
        this.container.add(this.settingsButton);
        
        console.log('Container after adding settings button:', {
            x: this.container.x,
            y: this.container.y,
            visible: this.container.visible,
            alpha: this.container.alpha,
            children: this.container.length
        });
        
        this.updateMusicButton();
    }

    createWalletDisplay(width) {
        const walletAddress = this.scene.registry.get('walletAddress');
        const displayAddress = walletAddress ? 
            walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4) : 
            'Wallet not connected';
        
        console.log('Creating wallet display with address:', displayAddress);
        
        this.walletText = this.scene.add.text(width - 140, 20, displayAddress, {
            fontSize: '20px',
            fontFamily: 'Retronoid',
            fill: '#00ffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
            stroke: '#ffffff',
            strokeThickness: 1
        })
        .setOrigin(1, 0);
        
        console.log('Wallet Text created:', {
            x: this.walletText.x,
            y: this.walletText.y,
            text: this.walletText.text,
            visible: this.walletText.visible,
            alpha: this.walletText.alpha
        });
        
        this.container.add(this.walletText);
        
        console.log('Container after adding wallet:', {
            x: this.container.x,
            y: this.container.y,
            visible: this.container.visible,
            alpha: this.container.alpha,
            children: this.container.length
        });
    }

    setupWalletListeners() {
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', (accounts) => {
                const newAddress = accounts[0] || null;
                this.scene.registry.set('walletAddress', newAddress);
                const displayAddress = newAddress ? 
                    newAddress.slice(0, 6) + '...' + newAddress.slice(-4) : 
                    'Wallet not connected';
                this.walletText.setText(displayAddress);
            });
        }
    }

    toggleMusic() {
        const bgMusic = this.scene.sound.get('bgMusic');
        if (bgMusic) {
            if (bgMusic.isPlaying) {
                bgMusic.pause();
                this.scene.registry.set('musicEnabled', false);
                this.settingsButton.setText('⚙️ Music: OFF');
            } else {
                bgMusic.resume();
                this.scene.registry.set('musicEnabled', true);
                this.settingsButton.setText('⚙️ Music: ON');
            }
        }
    }

    updateMusicButton() {
        const bgMusic = this.scene.sound.get('bgMusic');
        if (bgMusic && (!bgMusic.isPlaying || this.scene.registry.get('musicEnabled') === false)) {
            this.settingsButton.setText('⚙️ Music: OFF');
            if (bgMusic.isPlaying) bgMusic.pause();
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
        this.hpText.setText('HP: ' + hp);
    }

    showGameOver() {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        // Add dark overlay
        const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setDepth(98);

        // Create glitch effect container
        const gameOverContainer = this.scene.add.container(width/2, height * 0.3).setDepth(99);

        // Add "GAME OVER" text with shadow layers
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
        const scoreText = this.scene.add.text(width/2, height * 0.5, `FINAL SCORE: ${finalScore}`, {
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
        }).setOrigin(0.5).setDepth(99);

        // Add instruction text with blinking effect
        const instructionText = this.scene.add.text(width/2, height * 0.7, 'PRESS SPACE TO CONTINUE', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            color: '#ffd700',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(99);

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
                    x: width/2 + Phaser.Math.Between(-5, 5),
                    y: height * 0.3 + Phaser.Math.Between(-5, 5),
                    duration: 50,
                    yoyo: true,
                    repeat: 3
                });
            },
            loop: true
        });

        return { overlay, gameOverContainer, scoreText, instructionText };
    }

    destroy() {
        console.log('Destroying GameUI in scene:', this.scene.scene.key);
        
        // Clean up event listeners
        if (this.scene) {
            this.scene.events.off('create', this.updateCameraIgnoreList, this);
            this.scene.events.off('wake', this.updateCameraIgnoreList, this);
            this.scene.events.off('resume', this.updateCameraIgnoreList, this);
            this.scene.events.off('addedtoscene', this.handleNewObject, this);
        }
        
        // Remove UI camera
        if (this.uiCamera) {
            this.scene.cameras.remove(this.uiCamera);
            this.uiCamera = null;
        }
        
        // Destroy container and its contents
        if (this.container) {
            this.container.destroy(true);
            this.container = null;
        }

        // Clear scene reference
        this.scene = null;
    }
}