import { gameConfig } from '../config/gameConfig';

export class Weapon {
    constructor(scene) {
        this.scene = scene;
        this.bullets = scene.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 10
        });
    }

    shoot(x, y, direction) {
        const bullet = this.bullets.get(x, y, 'bullet');
        
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.body.enable = true;
            
            const velocity = direction === 'left' ? -gameConfig.weapons.bullet.speed : gameConfig.weapons.bullet.speed;
            bullet.setVelocityX(velocity);
            
            // Destroy bullet after lifespan
            this.scene.time.delayedCall(gameConfig.weapons.bullet.lifespan, () => {
                if (bullet.active) {
                    bullet.setActive(false);
                    bullet.setVisible(false);
                    bullet.body.enable = false;
                }
            });
        }
        
        return bullet;
    }

    getBullets() {
        return this.bullets;
    }
}
