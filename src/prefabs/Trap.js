import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

class Trap extends Phaser.GameObjects.Container {
    constructor(scene, x, y, config = {}) {
        super(scene, x, y);
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up physics body size (increased by 10px)
        this.body.setSize(42, 15);
        this.body.setOffset(-21, -7.5);
        
        // Create visible graphics with thicker appearance
        const graphics = scene.add.graphics();
        
        // Outer glow effect
        graphics.lineStyle(4, 0xff3333, 0.4);
        graphics.strokeRect(-21, -7.5, 42, 15);
        
        // Main trap body
        graphics.lineStyle(2, 0xff0000);
        graphics.strokeRect(-21, -7.5, 42, 15);
        graphics.fillStyle(0xff0000, 0.5);
        graphics.fillRect(-21, -7.5, 42, 15);
        
        // Inner detail
        graphics.lineStyle(1, 0xff6666);
        graphics.strokeRect(-16, -5, 32, 10);
        
        this.add(graphics);

        // Create particle manager
        this.particles = scene.add.particles({
            key: 'spark',
            config: {
                x: 0,
                y: 0,
                speed: { 
                    min: GameConfig.TRAPS.PARTICLES.SPEED.MIN, 
                    max: GameConfig.TRAPS.PARTICLES.SPEED.MAX 
                },
                angle: { min: 0, max: 360 },
                scale: { start: 0.2, end: 0 },
                blendMode: 'ADD',
                lifespan: 1000,
                tint: 0xff0000,
                frequency: 100,
                alpha: { start: 0.6, end: 0 },
                quantity: 1
            }
        });
        
        // Add particles to container
        this.add(this.particles);

        // Initialize damage properties
        this.lastDamageTime = 0;
        this.damageInterval = 1000; // 1 second in milliseconds
        this.damageAmount = config.damage || GameConfig.TRAPS.DAMAGE;
    }

    damagePlayer(player) {
        const currentTime = this.scene.time.now;
        
        // Check if enough time has passed since last damage
        if (currentTime - this.lastDamageTime >= this.damageInterval) {
            // Update last damage time
            this.lastDamageTime = currentTime;
            
            // Apply damage using the correct method
            player.takeDamage();
            
            // Emit burst of particles on damage
            this.particles.emitParticleAt(0, 0, 10);
        }
    }
    
    preUpdate() {
        // Make sure particles follow the trap
        if (this.particles) {
            this.particles.setPosition(this.x, this.y);
        }
    }
}

export { Trap };
