import { ObjectPool } from '../ObjectPool';
import { Bullet } from '../../../prefabs/Bullet';

export class BulletPool extends ObjectPool {
    constructor(scene, initialSize = 20) {
        super(scene, 'bullet', initialSize);
    }

    createNewObject() {
        return new Bullet(this.scene, 0, 0);
    }

    get(x, y, velocity, damage = 10) {
        const bullet = super.get();
        bullet.setPosition(x, y);
        bullet.setVelocity(velocity.x, velocity.y);
        bullet.damage = damage;
        return bullet;
    }

    update() {
        // Check if bullets are out of bounds and release them
        this.active.forEach(bullet => {
            const bounds = this.scene.physics.world.bounds;
            if (!bounds.contains(bullet.x, bullet.y)) {
                this.release(bullet);
            }
        });
    }
}
