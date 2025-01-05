import { EntityManager } from './EntityManager';
import { GameConfig } from '../../../config/GameConfig';

export class EnemyManager extends EntityManager {
    constructor(scene) {
        super(scene);
        this.remainingEnemies = 0;
    }

    addEnemy(enemy) {
        super.add(enemy, 'enemy');
        this.remainingEnemies++;
        
        // Set up enemy health
        enemy.on('healthChanged', this.handleEnemyHealthChanged.bind(this));
        enemy.on('died', this.handleEnemyDeath.bind(this));
    }

    handleBulletHit(bullet, enemySprite) {
        const enemy = this.getEnemyBySprite(enemySprite);
        if (enemy) {
            enemy.takeDamage(bullet.damage || GameConfig.PLAYER.DAMAGE);
            bullet.destroy();
        }
    }

    handleEnemyHealthChanged(enemy) {
        this.eventBus.emit('enemyHealthChanged', { enemy });
    }

    handleEnemyDeath(enemy) {
        this.remove(enemy, 'enemy');
        this.remainingEnemies--;
        this.checkLevelComplete();
    }

    getEnemyBySprite(sprite) {
        return this.getAll('enemy').find(enemy => enemy.sprite === sprite);
    }

    checkLevelComplete() {
        if (this.remainingEnemies <= 0) {
            this.eventBus.emit('levelComplete');
        }
    }
}
