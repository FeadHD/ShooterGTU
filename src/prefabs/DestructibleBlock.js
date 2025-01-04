export class DestructibleBlock extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Create texture if it doesn't exist
        if (!scene.textures.exists('destructible_block')) {
            const graphics = scene.add.graphics();
            graphics.lineStyle(2, 0x000000);
            graphics.fillStyle(0x964B00, 1); // Brown color
            graphics.fillRect(0, 0, 32, 32);
            graphics.strokeRect(0, 0, 32, 32);
            graphics.generateTexture('destructible_block', 32, 32);
            graphics.destroy();
        }

        super(scene, x, y, 'destructible_block');
        
        this.scene = scene;
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true makes it static
        
        // Set the block's size
        this.setDisplaySize(32, 32);
    }

    destroy(fromScene) {
        // Play destruction effect
        this.playDestructionEffect();
        
        // Call parent's destroy after a delay to let particles show
        this.scene.time.delayedCall(100, () => {
            super.destroy(fromScene);
        });
    }

    playDestructionEffect() {
        // Create particles for the explosion effect
        const particles = this.scene.add.particles(this.x, this.y, 'destructible_block', {
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
