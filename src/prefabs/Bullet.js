/**
 * Bullet Game Object
 * Represents a projectile in the game world
 * Handles physics, movement, and lifecycle management
 */
export class Bullet extends Phaser.Physics.Arcade.Sprite {
    /**
     * Create a new bullet instance
     * @param {Phaser.Scene} scene - The scene this bullet belongs to
     * @param {number} x - Initial X position
     * @param {number} y - Initial Y position
     */
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet_animation');
        
        // Physics setup
        scene.physics.add.existing(this);
        this.body.setAllowGravity(false);    // Bullets ignore gravity
        this.body.setSize(24, 24);           // Collision box size
        this.body.setImmovable(true);        // No physics reactions
        
        // Visual setup
        this.setScale(1);
        this.setAlpha(1);
        this.play('bullet_anim');            // Start animation
    }

    /**
     * Activate and launch the bullet
     * @param {number} x - Starting X position
     * @param {number} y - Starting Y position
     * @param {string} direction - Direction to fire ('left' or 'right')
     */
    fire(x, y, direction) {
        // Enable bullet
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;
        
        // Position at firing point
        this.setPosition(x, y);
        
        // Set direction and velocity
        this.setAngle(direction === 'right' ? 0 : 180);  // Face direction
        const speed = 600;                                // Pixels per second
        this.setVelocity(
            direction === 'right' ? speed : -speed,       // Horizontal speed
            0                                            // No vertical movement
        );
    }

    /**
     * Update bullet state
     * Handles out-of-bounds detection and cleanup
     * @param {number} time - Current time
     * @param {number} delta - Time since last update
     */
    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Check if bullet is out of bounds
        const levelWidth = this.scene.physics.world.bounds.width;
        if (this.x < -50 || this.x > levelWidth + 50) {
            this.destroy();  // Remove bullet when off screen
        }
    }
}
