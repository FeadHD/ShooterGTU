class BulletManager {
    constructor(scene) {
        this.scene = scene;
        this.bullets = this.scene.physics.add.group();
    }

    /** Create a physics group for bullets with specific properties for projectile behavior */
    #createBulletGroup() {
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: -1,
            runChildUpdate: true,
            allowGravity: false,
            immovable: true
        });
   }

   // Existing methods (createBullet, handleCollisions, etc.)
    createBullet(x, y, velocityX) {
        const bullet = this.bullets.create(x, y, 'bullet');
        bullet.setVelocityX(velocityX);
        return bullet;
    }

    handleCollisions(targetGroup, callback) {
        this.scene.physics.add.overlap(this.bullets, targetGroup, callback);
    }
}

export { BulletManager };
