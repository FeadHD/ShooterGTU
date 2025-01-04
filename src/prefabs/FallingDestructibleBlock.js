import { DestructibleBlock } from './DestructibleBlock';

export class FallingDestructibleBlock extends DestructibleBlock {
    constructor(scene, x, y) {
        // Create texture if it doesn't exist
        if (!scene.textures.exists('falling_destructible_block')) {
            const graphics = scene.add.graphics();
            graphics.lineStyle(2, 0x000000);
            graphics.fillStyle(0x800080, 1); // Purple color
            graphics.fillRect(0, 0, 32, 32);
            graphics.strokeRect(0, 0, 32, 32);
            graphics.generateTexture('falling_destructible_block', 32, 32);
            graphics.destroy();
        }

        // Call parent with our custom texture and make it dynamic
        super(scene, x, y, false); // false = not static
        this.setTexture('falling_destructible_block');
        
        // Set physics properties
        this.body.enable = true;
        this.body.moves = true;
        this.body.allowGravity = true;
        this.body.gravity.y = 300;
        this.body.collideWorldBounds = true;
        this.body.immovable = false;
        
        // Optional: Add a slight rotation when falling
        this.rotationSpeed = Phaser.Math.Between(-1, 1);
        
        // Track if the block is currently falling
        this.isFalling = false;
        
        // Listen for collisions
        scene.physics.world.on('collide', this.handleCollision, this);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        // Add slight rotation while falling
        if (this.body && !this.body.touching.down && this.isFalling) {
            this.angle += this.rotationSpeed;
        }
        
        // Reset rotation when on ground
        if (this.body && this.body.touching.down) {
            this.angle = 0;
            this.isFalling = false;
            
            // Apply some drag when on ground
            if (Math.abs(this.body.velocity.x) > 0) {
                this.body.velocity.x *= 0.95; // Simple friction
            }
        }
    }

    handleCollision(gameObject1, gameObject2) {
        // Check if this block is involved in the collision
        if (gameObject1 !== this && gameObject2 !== this) return;
        
        // Play impact sound if we have one
        if (this.scene.sound.get('block_impact')) {
            const velocity = Math.abs(this.body.velocity.y);
            const volume = Phaser.Math.Clamp(velocity / 500, 0, 1) * 0.5;
            this.scene.sound.play('block_impact', { volume });
        }
        
        // Add a small bounce effect
        if (this.body.touching.down) {
            this.body.velocity.y = -Math.abs(this.body.velocity.y) * 0.2;
        }
    }

    startFalling() {
        if (!this.isFalling && this.body) {
            this.isFalling = true;
            // Make sure physics are enabled
            this.body.enable = true;
            this.body.moves = true;
            this.body.allowGravity = true;
            this.body.immovable = false;
            // Add a small random horizontal velocity for variety
            this.body.velocity.x = Phaser.Math.Between(-50, 50);
        }
    }

    // Override the original destroy method to clean up our collision listener
    destroy(fromScene) {
        this.scene.physics.world.off('collide', this.handleCollision, this);
        super.destroy(fromScene);
    }

    // Override parent's destruction effect to use purple particles
    playDestructionEffect() {
        // Create particles for the explosion effect
        const particles = this.scene.add.particles(this.x, this.y, 'falling_destructible_block', {
            speed: { min: 100, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.2, end: 0 },
            blendMode: 'SCREEN',
            lifespan: 800,
            gravityY: 300,
            quantity: 20,
            emitting: false
        });

        // Destroy the particle system after animation completes
        this.scene.time.delayedCall(1000, () => {
            particles.destroy();
        });
        
        // Play a sound if we have one
        if (this.scene.sound.get('block_break')) {
            this.scene.sound.play('block_break', { volume: 0.5 });
        }
        
        // Add a small camera shake
        this.scene.cameras.main.shake(100, 0.005);
    }
}
