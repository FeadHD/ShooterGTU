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
        if (!enemy) return;

        // Call takeDamage if the enemy has that method
        if (typeof enemy.takeDamage === 'function') {
            enemy.takeDamage(1);
            enemyData.currentHealth = enemy.health || enemy.currentHealth;
            if (enemy.updateHealthBar) {
                enemy.updateHealthBar();
            }
            return;
        }

        // Fallback for enemies without takeDamage method
        enemyData.currentHealth--;
        enemy.currentHealth = enemyData.currentHealth;
        if (typeof enemy.health !== 'undefined') {
            enemy.health = enemyData.currentHealth;
        }
        console.log('Enemy hit, health:', enemyData.currentHealth);

        // Update health bar if enemy has one
        if (enemy.updateHealthBar) {
            enemy.updateHealthBar();
        }

        if (enemyData.currentHealth <= 0) {
            if (enemy.die) {
                enemy.die();
            }
            this.enemies.delete(enemySprite);
            this.remainingEnemies--;
            console.log('Enemy defeated, remaining:', this.remainingEnemies);
            
            // Award points
            const points = enemy.isBoss ? 50 : 10;
            this.scene.gameState.increment('score', points);
            
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
