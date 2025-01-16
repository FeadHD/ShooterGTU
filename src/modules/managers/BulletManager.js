import { Bullet } from '../../prefabs/Bullet';
class BulletManager {
    constructor(scene) {
        if (!scene) {
            throw new Error('Scene is required to initialize BulletManager.');
        }
        this.scene = scene; // Assign the passed scene
        this.bullets = this.scene.physics.add.group({
            classType: Bullet,
            maxSize: 20,
            runChildUpdate: true,
            allowGravity: false
        });
    }

    createBullet(x, y, velocityX) {
        const bullet = this.bullets.get(x, y);
        if (bullet) {
            bullet.setActive(true).setVisible(true).setVelocityX(velocityX);
        }
        return bullet;
    }

    getGroup() {
        return this.bullets;
    }
}

export { BulletManager };