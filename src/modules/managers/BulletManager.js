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

       /**
     * Destroy the given bullet.
     */
       destroyBullet(bullet) {
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false;

       }

   // Existing methods (createBullet, handleCollisions, etc.)
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