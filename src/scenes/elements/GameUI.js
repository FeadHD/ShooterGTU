import { Scene } from 'phaser';

export class GameUI {
    constructor(scene) {
        this.scene = scene;
        this.textConfig = {
            fontSize: '24px',
            fontFamily: 'Retronoid'
        };
        this.setupUI();
    }

    setupUI() {
        const width = this.scene.scale.width;
        this.createScoreDisplay();
        this.createLivesDisplay();
        this.createHPDisplay();
        this.createSettingsButton(width);
        this.createWalletDisplay(width);
        this.setupWalletListeners();
    }

    createScoreDisplay() {
        const currentScore = this.scene.registry.get('score') || 0;
        this.scoreText = this.scene.add.text(16, 16, 'Score: ' + currentScore, {
            ...this.textConfig,
            fill: '#fff'
        }).setScrollFactor(0);
    }

    createLivesDisplay() {
        this.livesText = this.scene.add.text(16, 56, 'Lives: ' + this.scene.registry.get('lives'), {
            ...this.textConfig,
            fill: '#ff0000'
        }).setScrollFactor(0);
    }

    createHPDisplay() {
        this.hpText = this.scene.add.text(16, 96, 'HP: ' + this.scene.playerHP, {
            ...this.textConfig,
            fill: '#00ff00'
        }).setScrollFactor(0);
    }

    createSettingsButton(width) {
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
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.settingsButton.setStyle({ fill: '#ff0' }))
        .on('pointerout', () => this.settingsButton.setStyle({ fill: '#fff' }))
        .on('pointerdown', () => this.toggleMusic());

        this.updateMusicButton();
    }

    createWalletDisplay(width) {
        const walletAddress = this.scene.registry.get('walletAddress');
        const displayAddress = walletAddress ? 
            walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4) : 
            'Wallet not connected';

        this.walletText = this.scene.add.text(width - 140, 20, displayAddress, {
            fontSize: '20px',
            fontFamily: 'Retronoid',
            fill: '#00ffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
            stroke: '#ffffff',
            strokeThickness: 1
        })
        .setOrigin(1, 0)
        .setScrollFactor(0);
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
        this.scoreText.destroy();
        this.livesText.destroy();
        this.hpText.destroy();
        this.settingsButton.destroy();
        this.walletText.destroy();
    }
}