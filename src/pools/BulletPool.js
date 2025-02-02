/**
 * Bullet Object Pool
 * Manages a reusable pool of bullet objects for efficient memory usage
 * Extends the base ObjectPool class with bullet-specific functionality
 */
import { ObjectPool } from './ObjectPool';
import { Bullet } from '../prefabs/Bullet';

export class BulletPool extends ObjectPool {
    /**
     * Initialize the bullet pool
     * @param {Phaser.Scene} scene - The game scene this pool belongs to
     * @param {number} initialSize - Initial number of bullets to create (default: 20)
     */
    constructor(scene, initialSize = 20) {
        super(scene, 'bullet', initialSize);
    }

    /**
     * Create a new bullet instance
     * Called internally when pool needs to grow
     * @returns {Bullet} New bullet instance
     * @protected
     */
    createNewObject() {
        return new Bullet(this.scene, 0, 0);
    }

    /**
     * Get a bullet from the pool and initialize it
     * @param {number} x - Starting X position
     * @param {number} y - Starting Y position
     * @param {Phaser.Math.Vector2} velocity - Bullet velocity
     * @param {number} damage - Damage amount (default: 10)
     * @returns {Bullet} Configured bullet instance
     */
    get(x, y, velocity, damage = 10) {
        const bullet = super.get();
        bullet.setPosition(x, y);
        bullet.setVelocity(velocity.x, velocity.y);
        bullet.damage = damage;
        return bullet;
    }

    /**
     * Update all active bullets
     * Automatically releases bullets that go out of bounds
     */
    update() {
        // Check if bullets are out of bounds and release them
        this.active.forEach(bullet => {
            const bounds = this.scene.physics.world.bounds;
            if (!bounds.contains(bullet.x, bullet.y)) {
                this.release(bullet);  // Return to pool when out of bounds
            }
        });
    }
}
