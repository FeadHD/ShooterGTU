class BulletManager {
    constructor(scene) {
        this.scene = scene;
        this.bullets = this.scene.physics.add.group();
    }

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
