/**
 * EnemyManager.js
 * Manages enemy entities in the game, including their lifecycle, combat interactions,
 * and level progression tracking. Extends EntityManager for core entity functionality.
 */

import { EntityManager } from './EntityManager';
import { GameConfig } from '../../config/GameConfig';
import { GameEvents } from '../core/EventManager';

/**
 * Manages enemy entities in the game with dual support for:
 * 1. Event-based enemies (modern implementation with event emitters)
 * 2. Traditional enemies (direct property access)
 * 
 * Integration Points:
 * - EntityManager: Provides core entity tracking and querying
 * - EffectsManager: Visual/audio feedback on hits
 * - GameStateManager: Score tracking via Phaser registry
 */
export class EnemyManager extends EntityManager {
    /**
     * Initialize the enemy management system
     * @param {Phaser.Scene} scene - The game scene this manager belongs to
     */
    constructor(scene) {
        super(scene);
        this.remainingEnemies = 0; // Tracks enemies for level completion
    }

    /** 
     * Register a new enemy with the management system
     * 
     * Features:
     * - Supports both modern (event-based) and legacy enemies
     * - Automatically sets up health tracking
     * - Initializes event listeners for health and death
     * 
     * @param {Object} enemy - Enemy instance to manage
     * @param {Phaser.GameObjects.Sprite} sprite - Enemy's visual representation
     * @param {number} [health] - Starting health for legacy enemies
     */
    addEnemy(enemy, sprite, health) {
        super.add(enemy, 'enemy');
        this.remainingEnemies++;

        // Set up appropriate health tracking system
        if (typeof enemy.on === 'function') {
            // Modern event-based enemy
            enemy.on('healthChanged', this.handleEnemyHealthChanged.bind(this));
            enemy.on('died', this.handleEnemyDeath.bind(this));
        } else if (health !== undefined) {
            // Legacy enemy with direct property access
            enemy.currentHealth = health;
            enemy.maxHealth = health;
        }
    }

    /** 
     * Process bullet collision with enemy
     * 
     * Workflow:
     * 1. Trigger hit effects (visual/audio)
     * 2. Calculate and apply damage
     * 3. Check for death condition
     * 4. Clean up bullet
     * 
     * @param {Phaser.GameObjects.GameObject} bullet - Colliding bullet
     * @param {Phaser.GameObjects.Sprite} enemySprite - Hit enemy sprite
     */
    handleBulletHit(bullet, enemySprite) {
        // Visual and audio feedback
        if (this.scene.effectsManager) {
            this.scene.effectsManager.createHitEffect(bullet.x, bullet.y);
            this.scene.effectsManager.playSound('hit');
        }

        // Damage application
        const enemy = this.getEnemyBySprite(enemySprite);
        if (enemy) {
            const damage = bullet.damage || GameConfig.PLAYER.DAMAGE || 1;

            if (typeof enemy.takeDamage === 'function') {
                // Modern enemy with damage handler
                enemy.takeDamage(damage);
            } else {
                // Legacy enemy with direct health manipulation
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

        // Cleanup collided bullet
        if (bullet?.destroy) bullet.destroy();
    }

    /** 
     * Broadcast enemy health changes to interested systems
     * Used for UI updates, achievements, and sound effects
     * 
     * @param {Object} enemy - Enemy with changed health
     */
    handleEnemyHealthChanged(enemy) {
        this.eventManager.emit(GameEvents.ENEMY_HEALTH_CHANGED, { enemy });
    }

    /** 
     * Process enemy death event
     * 
     * Actions:
     * 1. Remove from management system
     * 2. Update enemy counter
     * 3. Award score points
     * 4. Check level completion
     * 
     * @param {Object} enemy - Defeated enemy
     */
    handleEnemyDeath(enemy) {
        this.remove(enemy, 'enemy');
        this.remainingEnemies--;

        // Award points based on enemy type
        const points = enemy.isBoss ? 50 : 10;

        // Add a console log to confirm points awarding
        console.log(`[EnemyManager] handleEnemyDeath: awarding ${points} points.`);

        // Updated line: Use scene.gameStateManager instead of scene.gameState
        if (this.scene.gameStateManager?.increment) {
            this.scene.gameStateManager.increment('score', points);
        }

    }

    /** 
     * Find enemy entity from sprite reference
     * Essential for collision system sprite-to-entity mapping
     * 
     * @param {Phaser.GameObjects.Sprite} sprite - Sprite to look up
     * @returns {Object} Matching enemy entity or undefined
     */
    getEnemyBySprite(sprite) {
        return this.getAll('enemy').find(enemy => enemy.sprite === sprite);
    }

}
