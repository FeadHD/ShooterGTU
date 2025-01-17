import { EntityManager } from './EntityManager';
import { GameConfig } from '../../../config/GameConfig';
import { GameEvents } from '../../../modules/managers/EventManager';

/**
 * Manages enemy entities in the game with dual support for:
 * 1. Event-based enemies (modern implementation with event emitters)
 * 2. Traditional enemies (direct property access)
 * 
 * Integration Points:
 * - EntityManager: Provides core entity tracking and querying
 * - EffectsManager: Visual/audio feedback on hits
 * - GameState: Score tracking
 * - EventBus: Game-wide event communication
 */
export class EnemyManager extends EntityManager {
    constructor(scene) {
        super(scene);
        this.remainingEnemies = 0;
    }

    /** 
     * Adds an enemy to the manager with compatibility layer.
     * 
     * Integration Patterns:
     * 1. Event-based: Uses 'healthChanged' and 'died' events
     * 2. Traditional: Direct health property management
     * 
     * @param {Object} enemy - Enemy instance to manage
     * @param {Phaser.GameObjects.Sprite} sprite - Enemy's sprite reference
     * @param {number} [health] - Initial health for traditional enemies
     */
    addEnemy(enemy, sprite, health) {
        super.add(enemy, 'enemy');
        this.remainingEnemies++;

        if (typeof enemy.on === 'function') {
            enemy.on('healthChanged', this.handleEnemyHealthChanged.bind(this));
            enemy.on('died', this.handleEnemyDeath.bind(this));
        } else if (health !== undefined) {
            enemy.currentHealth = health;
            enemy.maxHealth = health;
        }
    }

    /** 
     * Collision resolution between bullets and enemies.
     * 
     * System Interactions:
     * 1. EffectsManager: Hit effects and sounds
     * 2. Health System: Damage calculation and application
     * 3. Death System: Cleanup and event emission
     * 
     * @param {Phaser.GameObjects.GameObject} bullet - The bullet that hit
     * @param {Phaser.GameObjects.Sprite} enemySprite - The enemy's sprite that was hit
     */
    handleBulletHit(bullet, enemySprite) {
        if (this.scene.effectsManager) {
            this.scene.effectsManager.createHitEffect(bullet.x, bullet.y);
            this.scene.effectsManager.playSound('hit');
        }

        const enemy = this.getEnemyBySprite(enemySprite);
        if (enemy) {
            const damage = bullet.damage || GameConfig.PLAYER.DAMAGE || 1;

            if (typeof enemy.takeDamage === 'function') {
                enemy.takeDamage(damage);
            } else {
                enemy.currentHealth -= damage;
                
                if (enemy.updateHealthBar) {
                    enemy.updateHealthBar();
                }

                if (enemy.currentHealth <= 0) {
                    if (enemy.die) enemy.die();
                    this.handleEnemyDeath(enemy);
                }
            }
        }

        if (bullet?.destroy) bullet.destroy();
    }

    /** 
     * Event handler for health changes. Broadcasts to EventBus for:
     * - UI updates
     * - Achievement tracking
     * - Sound effects
     * 
     * @param {Object} enemy - Enemy whose health changed
     */
    handleEnemyHealthChanged(enemy) {
        this.eventBus.emit('enemyHealthChanged', { enemy });
    }

    /** 
     * Death processing pipeline:
     * 1. Entity cleanup (EntityManager)
     * 2. Counter management (remainingEnemies)
     * 3. Score system integration
     * 4. Level progression check
     * 
     * @param {Object} enemy - Enemy that died
     */
    handleEnemyDeath(enemy) {
        this.remove(enemy, 'enemy');
        this.remainingEnemies--;

        const points = enemy.isBoss ? 50 : 10;
        if (this.scene.gameState?.increment) {
            this.scene.gameState.increment('score', points);
        }

        this.checkLevelComplete();
    }

    /** 
     * Entity lookup by sprite reference.
     * Used by collision system to map sprites back to entities.
     * 
     * @param {Phaser.GameObjects.Sprite} sprite - Sprite to look up
     * @returns {Object} Associated enemy entity
     */
    getEnemyBySprite(sprite) {
        return this.getAll('enemy').find(enemy => enemy.sprite === sprite);
    }

    /** 
     * Level completion check.
     * Triggers game progression via EventBus when all enemies are defeated.
     */
    checkLevelComplete() {
        if (this.remainingEnemies <= 0) {
            this.eventBus.emit('levelComplete');
        }
    }
}
