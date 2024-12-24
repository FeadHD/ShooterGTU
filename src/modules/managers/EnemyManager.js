export class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        this.enemies = new Map(); // Store enemies with their sprites as keys
        this.remainingEnemies = 0;
    }

    addEnemy(enemy, sprite, health) {
        this.enemies.set(sprite, {
            instance: enemy,
            currentHealth: health
        });
        this.remainingEnemies++;
    }

    handleBulletHit(bullet, enemySprite) {
        const enemy = this.enemies.get(enemySprite);
        if (!enemy) return;

        // Play effects
        this.scene.effectsManager.createHitEffect(bullet.x, bullet.y);
        this.scene.effectsManager.playSound('hit');
        bullet.destroy();

        // Update enemy health
        enemy.currentHealth--;
        console.log('Enemy hit, health:', enemy.currentHealth);

        if (enemy.currentHealth <= 0) {
            enemySprite.destroy();
            this.enemies.delete(enemySprite);
            this.remainingEnemies--;
            console.log('Enemy defeated, remaining:', this.remainingEnemies);
            
            // Award points
            const points = enemy.instance.isBoss ? 50 : 10;
            this.scene.stateManager.increment('score', points);
            
            this.checkLevelComplete();
        }
    }

    checkLevelComplete() {
        if (this.remainingEnemies <= 0) {
            const currentScene = this.scene.scene.key;
            // Don't show completion text for Scene 5 as it has its own handling
            if (currentScene !== 'GameScene5') {
                const sceneNumber = parseInt(currentScene.slice(-1));
                this.scene.nextSceneName = `GameScene${sceneNumber + 1}`;
            }
        }
    }

    cleanup() {
        this.enemies.clear();
        this.remainingEnemies = 0;
    }
}
