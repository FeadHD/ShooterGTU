import Phaser from 'phaser';

export default class Trampoline extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'trampoline');
        
        this.scene = scene;
        this.bounceStrength = -1000; // Super bouncy! Much stronger than before
        this.isCharging = false;
        this.chargeMultiplier = 1;
        
        // Create a blue rectangle for the trampoline
        this.trampolineGraphics = scene.add.rectangle(x, y, 32, 10, 0x0000ff);
        this.trampolineGraphics.setOrigin(0.5);
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true = static body
        
        // Set sprite scale
        this.setScale(1);
        this.setAlpha(0); // Hide the sprite itself since we're using the rectangle
        
        // Set bounce area to match the blue rectangle
        this.body.setSize(32, 10); // Full width, 10px height
        this.body.setOffset(0, 0); // No offset needed
        
        // Add a stronger glow effect
        this.trampolineGraphics.postFX.addGlow(0x0088ff, 8, 0, false, 0.2, 16);
        
        // Create a simple white rectangle for particles instead of using a texture
        const particleGraphics = scene.add.graphics();
        particleGraphics.fillStyle(0xffffff, 1);
        particleGraphics.fillRect(0, 0, 4, 4);
        const particleTexture = particleGraphics.generateTexture('particleTexture', 4, 4);
        particleGraphics.destroy();
        
        // Add particle emitter for bounce effect
        this.particles = scene.add.particles(x, y, {
            key: 'particleTexture',
            speed: { min: 100, max: 200 },
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            gravityY: 300,
            emitting: false
        });
        
        this.setupPlayerCollision();
    }

    setupPlayerCollision() {
        // Add overlap instead of collider for more control
        this.scene.physics.add.overlap(this, this.scene.player, this.handleBounce, null, this);
    }

    handleBounce(trampoline, player) {
        // Only bounce if player is falling onto the trampoline
        if (player.body.velocity.y > 0) {
            // Calculate bounce strength based on fall speed
            let finalBounceStrength = this.bounceStrength;
            
            // Add extra bounce if falling from high
            if (player.body.velocity.y > 500) {
                finalBounceStrength *= 1.5;
                this.chargeMultiplier = 1.5;
            }
            
            // Apply bounce force
            player.setVelocityY(finalBounceStrength * this.chargeMultiplier);
            
            // Reset player's jumps
            player.jumpsAvailable = player.maxJumps;
            
            // Visual feedback for bounce
            this.scene.tweens.add({
                targets: this.trampolineGraphics,
                scaleY: 0.3,
                duration: 100,
                yoyo: true,
                ease: 'Bounce.easeOut',
                onComplete: () => {
                    // Extra wobble effect
                    this.scene.tweens.add({
                        targets: this.trampolineGraphics,
                        scaleY: 1.2,
                        duration: 50,
                        yoyo: true,
                        repeat: 2,
                        ease: 'Sine.easeInOut'
                    });
                }
            });
            
            // Emit particles at the trampoline's position
            this.particles.emitParticleAt(this.trampolineGraphics.x, this.trampolineGraphics.y - 5, 20);
            
            // Screen shake for powerful bounces
            if (this.chargeMultiplier > 1) {
                this.scene.cameras.main.shake(200, 0.005);
            }
            
            // Play bounce sound if available
            if (this.scene.effectsManager && this.scene.effectsManager.playSound) {
                this.scene.effectsManager.playSound('bounce');
            }
            
            // Reset charge
            this.chargeMultiplier = 1;
        }
    }
}