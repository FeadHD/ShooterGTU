/**
 * EventManager.js
 * Manages game-wide events and provides a centralized event handling system.
 */

import { BaseManager } from '../di/BaseManager';

// Event name constants to prevent typos and enable autocomplete
export const GameEvents = {
    // Entity Events
    PLAYER_DEATH: 'player:death',
    PLAYER_RESPAWN: 'player:respawn',
    ENEMY_DEATH: 'enemy:death',
    ENEMY_SPAWN: 'enemy:spawn',
    BOSS_SPAWN: 'boss:spawn',
    BOSS_PHASE_CHANGE: 'boss:phaseChange',

    // Gameplay Events
    SCORE_CHANGE: 'gameplay:scoreChange',
    HEALTH_CHANGE: 'gameplay:healthChange',
    LEVEL_COMPLETE: 'gameplay:levelComplete',
    CHECKPOINT_REACHED: 'gameplay:checkpointReached',
    GAME_OVER: 'gameplay:gameOver',

    // Item Events
    ITEM_PICKUP: 'item:pickup',
    ITEM_USE: 'item:use',
    POWERUP_START: 'powerup:start',
    POWERUP_END: 'powerup:end',

    // System Events
    SCENE_READY: 'system:sceneReady',
    RESOURCES_LOADED: 'system:resourcesLoaded',
    ERROR_OCCURRED: 'system:error'
};

export class EventManager extends BaseManager {
    constructor(scene) {
        super();
        this.scene = scene;
        this.events = scene.events; // Use Phaser's built-in event emitter
        this.registeredEvents = new Set();
        
        // Register with container
        this.container.register('events', this);
    }

    /**
     * Initialize event system and register default handlers
     */
    initialize() {
        console.log('Initializing event system...');
        
        // Register default event handlers
        this.registerDefaultEvents();
        
        // Emit scene ready event
        this.emit(GameEvents.SCENE_READY, { sceneName: this.scene.scene.key });
    }

    /**
     * Register core event handlers
     */
    registerDefaultEvents() {
        // Player events
        this.on(GameEvents.PLAYER_DEATH, ({ position, cause }) => {
            console.log(`Player died at position ${position.x},${position.y} due to ${cause}`);
            if (this.scene.handlePlayerDeath) {
                this.scene.handlePlayerDeath();
            }
        });

        this.on(GameEvents.PLAYER_RESPAWN, ({ position }) => {
            console.log(`Player respawning at ${position.x},${position.y}`);
            if (this.scene.handleRespawn) {
                this.scene.handleRespawn();
            }
        });

        // Enemy events
        this.on(GameEvents.ENEMY_DEATH, ({ enemy, position, killedBy }) => {
            console.log(`Enemy ${enemy.id} died at ${position.x},${position.y}`);
            if (this.scene.handleEnemyDeath) {
                this.scene.handleEnemyDeath(enemy, killedBy);
            }
        });

        // Item events
        this.on(GameEvents.ITEM_PICKUP, ({ item, player }) => {
            console.log(`Player picked up ${item.type}`);
            if (this.scene.handleItemPickup) {
                this.scene.handleItemPickup(item, player);
            }
        });

        // System events
        this.on(GameEvents.ERROR_OCCURRED, ({ error, context }) => {
            console.error(`Error in ${context}:`, error);
            if (this.scene.errorSystem) {
                this.scene.errorSystem.handleError(error, context);
            }
        });
    }

    /**
     * Register an event handler
     */
    on(eventName, callback) {
        if (!this.registeredEvents.has(eventName)) {
            this.registeredEvents.add(eventName);
        }
        this.events.on(eventName, callback);
    }

    /**
     * Register a one-time event handler
     */
    once(eventName, callback) {
        this.events.once(eventName, callback);
    }

    /**
     * Emit an event with optional data
     */
    emit(eventName, data = {}) {
        // Add timestamp and scene info to all events
        const eventData = {
            ...data,
            timestamp: Date.now(),
            scene: this.scene.scene.key
        };
        
        this.events.emit(eventName, eventData);
    }

    /**
     * Remove an event handler
     */
    off(eventName, callback) {
        this.events.off(eventName, callback);
    }

    /**
     * Remove all handlers for an event
     */
    removeAllListeners(eventName) {
        this.events.removeAllListeners(eventName);
        this.registeredEvents.delete(eventName);
    }

    /**
     * Clean up all event handlers
     */
    destroy() {
        this.registeredEvents.forEach(eventName => {
            this.removeAllListeners(eventName);
        });
        this.registeredEvents.clear();
    }
}
