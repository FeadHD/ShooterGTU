import { Scene } from 'phaser';
import { ManagerFactory } from '../../modules/di/ManagerFactory';

export class MissionComplete extends Scene {
    constructor() {
        super({ key: 'MissionComplete' });
    }

    preload() {
        // Load particle image
        this.load.image('particle', 'assets/particle.png');
        // Load victory music
        this.load.audio('victoryMusic', 'assets/sounds/congratulations.mp3');
        // Load background music for restart
        this.load.audio('bgMusic', 'assets/sounds/mainmenumusic.mp3');
    }

    createFirework(x, y) {
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
        const particles = [];
        
        // Create multiple particles for the firework
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Phaser.Math.Between(100, 400);
            const particle = this.add.circle(x, y, 2, Phaser.Math.RND.pick(colors));
            
            // Add physics to the particle
            this.physics.add.existing(particle);
            particle.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            particle.body.setAllowGravity(false);
            
            particles.push(particle);
        }

        // Fade out and destroy particles
        this.tweens.add({
            targets: particles,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                particles.forEach(particle => particle.destroy());
            }
        });
    }

    saveScore() {
        const currentScore = this.registry.get('score') || 0;
        const walletAddress = this.registry.get('walletAddress');
        const playerName = walletAddress || 'Guest';

        // Get existing scores
        let scores = JSON.parse(localStorage.getItem('topScores') || '[]');
        
        // Add new score
        scores.push({
            playerName: playerName,
            score: currentScore,
            timestamp: Date.now()
        });

        // Sort scores in descending order
        scores.sort((a, b) => b.score - a.score);

        // Keep only top 10
        scores = scores.slice(0, 10);

        // Save back to localStorage
        localStorage.setItem('topScores', JSON.stringify(scores));
    }

    create() {
        // Stop any existing music
        this.sound.stopAll();

        // Get managers
        this.managers = ManagerFactory.createManagers(this);
        this.audioManager = this.managers.audio;

        // Get music state
        const musicEnabled = this.registry.get('musicEnabled');

        // Play victory music only if music is enabled
        if (musicEnabled !== false && this.audioManager) {
            this.audioManager.playMusic('victoryMusic', { 
                volume: 0.3, 
                loop: true 
            });
        }
        console.log('Playing victory music in mission complete scene'); // Debug log

        this.cameras.main.setBackgroundColor('#000000');
        
        const width = this.scale.width;
        const height = this.scale.height;

        // Add music control button
        const musicButton = this.add.text(width - 100, 20, '⚙️ Music: ON', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(1, 0);

        // Update initial button state
        if (musicEnabled === false) {
            musicButton.setText('⚙️ Music: OFF');
        }

        musicButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => musicButton.setStyle({ fill: '#ff0' }))
            .on('pointerout', () => musicButton.setStyle({ fill: '#fff' }))
            .on('pointerdown', () => {
                if (this.audioManager && this.audioManager.isPlaying('victoryMusic')) {
                    this.audioManager.pauseMusic('victoryMusic');
                    this.registry.set('musicEnabled', false);
                    musicButton.setText('⚙️ Music: OFF');
                } else {
                    this.audioManager.resumeMusic('victoryMusic');
                    this.registry.set('musicEnabled', true);
                    musicButton.setText('⚙️ Music: ON');
                }
            });

        // Get final stats
        const finalScore = this.registry.get('score') || 0;
        const bitcoins = this.registry.get('bitcoins') || 0;
        const bonusPoints = bitcoins * 5;
        const totalFinalScore = finalScore + bonusPoints;

        // Create mission complete text
        this.add.text(width/2, height/3, 'Mission Complete!', {
            fontFamily: 'Retronoid',
            fontSize: '64px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Create score text that will animate
        const scoreText = this.add.text(width/2, height/2, `Score: ${finalScore}`, {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Create bitcoin text that will animate
        const bitcoinText = this.add.text(width/2, height/2 + 50, 'Bitcoins: ' + bitcoins, {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#FFD700' // Gold color to match the UI
        }).setOrigin(0.5);

        // Animate bitcoin count down to zero and score up
        let currentCount = bitcoins;
        let currentScore = finalScore;
        const countInterval = 50; // Time between each count in ms
        const countTimer = this.time.addEvent({
            delay: countInterval,
            callback: () => {
                // Update bitcoin count
                currentCount--;
                bitcoinText.setText('Bitcoins: ' + currentCount);
                
                // Update score with animation
                currentScore += 5;
                scoreText.setText('Score: ' + currentScore);
                
                // Flash score text in gold
                this.tweens.add({
                    targets: scoreText,
                    scale: { from: 1.2, to: 1 },
                    duration: 100,
                    ease: 'Quad.out'
                });
                
                // Temporarily change score color to gold
                scoreText.setFill('#FFD700');
                this.time.delayedCall(100, () => {
                    scoreText.setFill('#ffffff');
                });
                
                // Play coin sound
                if (this.sound.get('coin')) {
                    this.sound.play('coin', { volume: 0.3 });
                }
                
                if (currentCount <= 0) {
                    countTimer.destroy();
                    // Reset bitcoin counter to 0
                    this.registry.set('bitcoins', 0);
                    // Update final score in registry
                    this.registry.set('score', totalFinalScore);
                    
                    // Final score flash
                    this.tweens.add({
                        targets: scoreText,
                        scale: { from: 1.5, to: 1 },
                        duration: 200,
                        ease: 'Bounce.out',
                        onComplete: () => {
                            // Save the score after all animations are complete
                            this.saveScore();
                        }
                    });
                }
            },
            repeat: bitcoins - 1
        });

        // Add instruction text
        this.add.text(width/2, height * 0.8, 'Press SPACE to return to menu', {
            fontFamily: 'Retronoid',
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Add space key listener
        this.input.keyboard.on('keydown-SPACE', () => {
            // Stop and cleanup all music
            this.sound.stopAll();
            if (this.audioManager) {
                this.audioManager.stopMusic('victoryMusic');
                this.audioManager.destroy();
            }
            
            // Reset the score to 0
            this.registry.set('score', 0);
            
            this.scene.start('MainMenu');
        });

        // Create periodic fireworks
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                // Random positions for fireworks
                const x = Phaser.Math.Between(width * 0.2, width * 0.8);
                const y = Phaser.Math.Between(height * 0.2, height * 0.6);
                this.createFirework(x, y);
            },
            loop: true
        });

        // Initial fireworks burst
        for (let i = 0; i < 3; i++) {
            const x = Phaser.Math.Between(width * 0.2, width * 0.8);
            const y = Phaser.Math.Between(height * 0.2, height * 0.6);
            this.createFirework(x, y);
        }
    }
}
