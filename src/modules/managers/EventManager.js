/**
 * EventManager.js
 * Centralized event management system for game-wide communication
 * Provides type-safe event constants and standardized event handling
 * Extends BaseManager for dependency injection support
 */

import { BaseManager } from '../di/BaseManager';

/**
 * Game-wide event constants
 * Organized by category for better maintainability
 * Use these instead of string literals to prevent typos
 */
export const GameEvents = {
    // Entity lifecycle and state events
    PLAYER_DEATH: 'player:death',          // Triggered when player dies
    PLAYER_RESPAWN: 'player:respawn',      // Triggered on player respawn
    ENEMY_DEATH: 'enemy:death',            // Triggered when enemy is defeated
    ENEMY_SPAWN: 'enemy:spawn',            // Triggered when new enemy spawns
    BOSS_SPAWN: 'boss:spawn',              // Triggered when boss appears
    BOSS_PHASE_CHANGE: 'boss:phaseChange', // Triggered on boss phase transition

    // Core gameplay state changes
    SCORE_CHANGE: 'gameplay:scoreChange',         // Score updates
    HEALTH_CHANGE: 'gameplay:healthChange',       // Health modifications
    LEVEL_COMPLETE: 'gameplay:levelComplete',     // Level completion
    CHECKPOINT_REACHED: 'gameplay:checkpointReached', // Checkpoint activation
    GAME_OVER: 'gameplay:gameOver',               // Game over state

    // Item and power-up events
    ITEM_PICKUP: 'item:pickup',            // Item collection
    ITEM_USE: 'item:use',                  // Item usage
    POWERUP_START: 'powerup:start',        // Power-up activation
    POWERUP_END: 'powerup:end',            // Power-up expiration

    // System and resource events
    SCENE_READY: 'system:sceneReady',          // Scene initialization complete
    RESOURCES_LOADED: 'system:resourcesLoaded', // Asset loading complete
    ERROR_OCCURRED: 'system:error'              // Error handling
};

/**
 * EventManager class
 * Handles registration, emission, and cleanup of game events
 * Integrates with Phaser's event system for scene-specific events
 */
export class EventManager extends BaseManager {
    /**
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     */
    constructor(scene) {
        super();
        this.scene = scene;
        this.events = scene.events;           // Phaser's event emitter
        this.registeredEvents = new Set();    // Track active events
        
        // Register this manager in the DI container
        this.container.register('events', this);
    }

    /**
     * Initialize event system and setup default handlers
     * Called automatically when scene starts
     */
    initialize() {
        console.log('Initializing event system...');
        
        // Setup core event handlers
        this.registerDefaultEvents();
        
        // Signal scene is ready for game logic
        this.emit(GameEvents.SCENE_READY, { sceneName: this.scene.scene.key });
    }

    /**
     * Register default event handlers for core game events
     * Connects events to scene-specific handler methods
     */
    registerDefaultEvents() {
        // Player lifecycle events
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

        // Enemy interaction events
        this.on(GameEvents.ENEMY_DEATH, ({ enemy, position, killedBy }) => {
            console.log(`Enemy ${enemy.id} died at ${position.x},${position.y}`);
            if (this.scene.handleEnemyDeath) {
                this.scene.handleEnemyDeath(enemy, killedBy);
            }
        });

        // Item interaction events
        this.on(GameEvents.ITEM_PICKUP, ({ item, player }) => {
            console.log(`Player picked up ${item.type}`);
            if (this.scene.handleItemPickup) {
                this.scene.handleItemPickup(item, player);
            }
        });

        // Error handling
        this.on(GameEvents.ERROR_OCCURRED, ({ error, context }) => {
            console.error(`Error in ${context}:`, error);
            if (this.scene.errorSystem) {
                this.scene.errorSystem.handleError(error, context);
            }
        });
    }

    /**
     * Register an event handler
     * @param {string} eventName - Event identifier from GameEvents
     * @param {Function} callback - Handler function
     */
    on(eventName, callback) {
        if (!this.registeredEvents.has(eventName)) {
            this.registeredEvents.add(eventName);
        }
        this.events.on(eventName, callback);
    }

    /**
     * Register a one-time event handler
     * Automatically removed after first trigger
     * @param {string} eventName - Event identifier from GameEvents
     * @param {Function} callback - Handler function
     */
    once(eventName, callback) {
        this.events.once(eventName, callback);
    }

    /**
     * Emit an event with data
     * Automatically adds timestamp and scene info
     * @param {string} eventName - Event identifier from GameEvents
     * @param {Object} data - Event payload
     */
    emit(eventName, data = {}) {
        const eventData = {
            ...data,
            timestamp: Date.now(),
            scene: this.scene.scene.key
        };
        
        this.events.emit(eventName, eventData);
    }

    /**
     * Remove a specific event handler
     * @param {string} eventName - Event identifier from GameEvents
     * @param {Function} callback - Handler to remove
     */
    off(eventName, callback) {
        this.events.off(eventName, callback);
    }

    /**
     * Remove all handlers for an event
     * @param {string} eventName - Event identifier from GameEvents
     */
    removeAllListeners(eventName) {
        this.events.removeAllListeners(eventName);
        this.registeredEvents.delete(eventName);
    }

    /**
     * Clean up all event handlers
     * Called automatically when scene is destroyed
     */
    destroy() {
        this.registeredEvents.forEach(eventName => {
            this.removeAllListeners(eventName);
        });
        this.registeredEvents.clear();
    }
}
