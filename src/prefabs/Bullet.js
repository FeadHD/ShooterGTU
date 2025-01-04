export class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet_animation');
        
        // Set up physics body
        scene.physics.add.existing(this);
        this.body.setAllowGravity(false);  // Ensure no gravity affects the bullet
        this.body.setSize(24, 24);
        this.body.setImmovable(true);  // Make bullet not affected by collisions
        
        // Set initial scale and alpha
        this.setScale(1);
        this.setAlpha(1);
        
        // Play bullet animation
        this.play('bullet_anim');
    }

    fire(x, y, direction) {
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;
        
        // Position the bullet at player's position
        this.setPosition(x, y);
        
        // Set bullet rotation and velocity based on direction
        this.setAngle(direction === 'right' ? 0 : 180);
        const speed = 600;
        this.setVelocity(
            direction === 'right' ? speed : -speed,
            0  // No vertical velocity
        );
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Get level bounds from physics world
        const levelWidth = this.scene.physics.world.bounds.width;

        // Destroy bullet if it goes off screen
        if (this.x < -50 || this.x > levelWidth + 50) {
            this.destroy();
        }
    }
}
