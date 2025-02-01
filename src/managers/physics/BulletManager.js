/**
 * BulletManager.js
 * Manages bullet creation, pooling, and lifecycle
 * Handles bullet physics and collision detection
 */

import { Bullet } from '../../prefabs/Bullet';

class BulletManager {
    /**
     * Initialize bullet management system
     * Creates physics group for bullet pooling
     * @param {Phaser.Scene} scene - Scene to attach bullets to
     */
    constructor(scene) {
        if (!scene) {
            throw new Error('Scene is required to initialize BulletManager.');
        }
        this.scene = scene;

        // Create bullet pool with physics
        this.bullets = this.scene.physics.add.group({
            classType: Bullet,          // Custom bullet class
            maxSize: 20,                // Limit active bullets
            runChildUpdate: true,       // Auto-update bullets
            allowGravity: false         // Projectile motion
        });
    }

    /**
     * Create physics group for bullet pooling
     * Sets up bullet behavior and constraints
     * @private
     */
    #createBulletGroup() {
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: -1,               // Unlimited bullets
            runChildUpdate: true,
            allowGravity: false,
            immovable: true
        });
    }

    /**
     * Deactivate and hide bullet
     * Called when bullet hits target or leaves screen
     * @param {Bullet} bullet - Bullet to destroy
     */
    destroyBullet(bullet) {
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false;
    }

    /**
     * Create new bullet from pool
     * Sets initial position and velocity
     * @returns {Bullet|null} Created bullet or null if pool full
     */
    createBullet(x, y, velocityX) {
        const bullet = this.bullets.get(x, y);
        if (bullet) {
            bullet.setActive(true)
                 .setVisible(true)
                 .setVelocityX(velocityX);
        }
        return bullet;
    }

    /**
     * Get bullet physics group
     * Used by collision manager for detection
     * @returns {Phaser.Physics.Arcade.Group} Bullet group
     */
    getGroup() {
        return this.bullets;
    }
}

export { BulletManager };