import { Scene } from 'phaser';

export class MissionComplete extends Scene {
    constructor() {
        super({ key: 'MissionComplete' });
    }

    preload() {
        // Load particle image
        this.load.image('particle', 'assets/particle.png');
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

    create() {
        this.cameras.main.setBackgroundColor('#000000');
        
        const width = this.scale.width;
        const height = this.scale.height;

        // Add congratulations text
        this.add.text(width/2, height * 0.3, 'Congratulations!', {
            fontFamily: 'Retronoid',
            fontSize: '48px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Add mission completion text
        this.add.text(width/2, height * 0.5, "You've finished Mission ONE:", {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(width/2, height * 0.6, 'Ledger Heist', {
            fontFamily: 'Retronoid',
            fontSize: '40px',
            fill: '#ffd700'  // Gold color for mission name
        }).setOrigin(0.5);

        // Add instruction text
        this.add.text(width/2, height * 0.8, 'Press SPACE to return to menu', {
            fontFamily: 'Retronoid',
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Add keyboard input
        this.input.keyboard.on('keydown-SPACE', () => {
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
