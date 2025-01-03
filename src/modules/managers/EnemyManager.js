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
        const enemyData = this.enemies.get(enemySprite);
        if (!enemyData) return;

        // Play effects
        this.scene.effectsManager.createHitEffect(bullet.x, bullet.y);
        this.scene.effectsManager.playSound('hit');
        bullet.destroy();

        // Get enemy instance
        const enemy = enemyData.instance;

        // If it's a warrior, call takeDamage directly
        if (enemy && enemySprite.getData('type') === 'warrior') {
            enemy.takeDamage(1);
            enemyData.currentHealth = enemy.currentHealth;
            enemySprite.setData('health', enemy.currentHealth);
            if (enemy.updateHealthBar) {
                enemy.updateHealthBar();
            }
            return;
        }

        // For other enemies, update health normally
        enemyData.currentHealth--;
        enemyData.instance.currentHealth = enemyData.currentHealth;
        // Also update health for Slime class compatibility
        if (typeof enemyData.instance.health !== 'undefined') {
            enemyData.instance.health = enemyData.currentHealth;
        }
        console.log('Enemy hit, health:', enemyData.currentHealth);

        // Update health bar if enemy has one
        if (enemyData.instance.updateHealthBar) {
            enemyData.instance.updateHealthBar();
        }

        if (enemyData.currentHealth <= 0) {
            if (enemyData.instance.die) {
                enemyData.instance.die();
            }
            this.enemies.delete(enemySprite);
            this.remainingEnemies--;
            console.log('Enemy defeated, remaining:', this.remainingEnemies);
            
            // Award points
            const points = enemyData.instance.isBoss ? 50 : 10;
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
