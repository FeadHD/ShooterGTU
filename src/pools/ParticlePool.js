/**
 * Particle Effect Pool
 * Manages reusable particle objects for visual effects
 * Uses circle shapes with tweens for particle animations
 */
import { ObjectPool } from './ObjectPool';

export class ParticlePool extends ObjectPool {
    /**
     * Initialize the particle pool
     * @param {Phaser.Scene} scene - The game scene this pool belongs to
     * @param {number} initialSize - Initial number of particles to create (default: 50)
     */
    constructor(scene, initialSize = 50) {
        super(scene, 'particle', initialSize);
    }

    /**
     * Create a new particle object
     * Uses Phaser circle shape with default white color
     * @returns {Phaser.GameObjects.Arc} New particle instance
     * @protected
     */
    createNewObject() {
        return this.scene.add.circle(0, 0, 3, 0xffffff);
    }

    /**
     * Get a particle from the pool and initialize it
     * @param {number} x - Starting X position
     * @param {number} y - Starting Y position
     * @param {number} color - Particle color in hex (default: white)
     * @returns {Phaser.GameObjects.Arc} Configured particle
     */
    get(x, y, color = 0xffffff) {
        const particle = super.get();
        particle.setPosition(x, y);
        particle.setFillStyle(color);
        return particle;
    }

    /**
     * Create a burst particle effect
     * Spawns multiple particles in a circular pattern with fade out
     * @param {number} x - Effect center X position
     * @param {number} y - Effect center Y position
     * @param {number} color - Particle color in hex (default: yellow)
     * @param {number} count - Number of particles to spawn (default: 10)
     * @returns {Array<Phaser.GameObjects.Arc>} Array of created particles
     */
    createEffect(x, y, color = 0xffff00, count = 10) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            // Create and position particle
            const particle = this.get(x, y, color);
            const angle = Math.random() * Math.PI * 2;        // Random direction
            const speed = 100 + Math.random() * 100;         // Random speed
            
            // Animate particle with tween
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * speed * 0.3,  // Move outward
                y: particle.y + Math.sin(angle) * speed * 0.3,
                alpha: 0,       // Fade out
                scale: 0.1,     // Shrink
                duration: 300,  // Animation time
                ease: 'Power2', // Smooth motion
                onComplete: () => {
                    this.release(particle);  // Return to pool when done
                }
            });
            particles.push(particle);
        }
        return particles;
    }
}
