/**
 * GameStateManager.js
 * Centralizes game state using Phaser's registry + event bus for communication.
 * Also supports optional local storage, state change listeners, etc.
 */

import { GameConfig } from '../../config/GameConfig';
import { BaseManager } from '../core/BaseManager';
import { GameEvents } from '../core/EventManager';

export class GameStateManager extends BaseManager {
    /**
     * @param {Phaser.Scene} scene - The scene that owns this manager
     */
    constructor(scene) {
        super();
        this.scene = scene;
        this.registry = scene.registry;
        this.events = scene.events;
        this.eventManager = scene.eventManager;
    }

    /**
     * Initialize default game state values (if not already set).
     * Emits 'gameStateInitialized' once done.
     */
    initializeGameState() {
        // Use GameConfig for defaults + fill in anything missing.
        const defaults = {
            score: GameConfig.UI?.INITIAL_SCORE ?? 0,
            lives: GameConfig.UI?.DEFAULT_LIVES ?? 3,
            playerHP: GameConfig.PLAYER?.INITIAL_HP ?? 100,
            bitcoins: GameConfig.UI?.INITIAL_COINS ?? 0,
            musicEnabled: true,
            gameStarted: false,
            stamina: 100
        };

        Object.entries(defaults).forEach(([key, value]) => {
            if (!this.registry.has(key)) {
                this.registry.set(key, value);
            }
        });

        // Emit initial state
        this.eventManager.emit(GameEvents.GAME_STATE_INITIALIZED, defaults);
    }

    /**
     * Get a value from Phaser's registry
     * @param {string} key - The state key
     * @returns {any} The current value
     */
    get(key) {
        return this.registry.get(key);
    }

    /**
     * Set a value in Phaser's registry + emit 'stateChanged'
     * @param {string} key - The state key
     * @param {any} value - New value
     */
    set(key, value) {
        console.log(`\n[GameStateManager] set(): Updating ${key} to`, value);
        this.registry.set(key, value);
        this.eventManager.emit(GameEvents.STATE_CHANGED, { key, value });
    }

    /**
     * Increase a numeric state value
     * @param {string} key - The state key
     * @param {number} amount - Amount to increase (default 1)
     */
    increment(key, amount = 1) {
        const currentValue = this.get(key) || 0;
        this.set(key, currentValue + amount);
    }

    /**
     * Decrease a numeric state value (clamped at 0)
     * @param {string} key - The state key
     * @param {number} amount - Amount to decrease (default 1)
     */
    decrement(key, amount = 1) {
        const currentValue = this.get(key) || 0;
        const newValue = Math.max(0, currentValue - amount);
        this.set(key, newValue);
    }

    /**
     * Reset single key or entire game state to default values
     * @param {string} [key] - If provided, only reset that key
     */
    reset(key) {
        const defaults = {
            score: GameConfig.UI?.INITIAL_SCORE ?? 0,
            lives: GameConfig.UI?.DEFAULT_LIVES ?? 3,
            playerHP: GameConfig.PLAYER?.INITIAL_HP ?? 100,
            bitcoins: GameConfig.UI?.INITIAL_COINS ?? 0,
            musicEnabled: true,
            gameStarted: false,
            stamina: 100
        };

        if (key) {
            this.set(key, defaults[key]);
        } else {
            Object.entries(defaults).forEach(([k, value]) => {
                this.set(k, value);
            });
        }
    }

    /**
     * Register a callback for Phaser registry changes.
     * @param {Function} callback - Called on 'changedata' events
     */
    onStateChange(callback) {
        this.registry.events.on('changedata', callback);
    }

    /**
     * Remove a callback for Phaser registry changes.
     * @param {Function} callback - The function to remove
     */
    offStateChange(callback) {
        this.registry.events.off('changedata', callback);
    }

    /**
     * Save current state to local storage
     */
    saveToLocalStorage() {
        const keys = [
            'score',
            'lives',
            'playerHP',
            'bitcoins',
            'musicEnabled',
            'gameStarted',
            'stamina'
        ];
        const gameState = {};
        keys.forEach(key => {
            gameState[key] = this.get(key);
        });
        localStorage.setItem('gameState', JSON.stringify(gameState));
    }

    /**
     * Load saved state from local storage
     * @returns {boolean} True if state loaded successfully
     */
    loadFromLocalStorage() {
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            Object.entries(gameState).forEach(([key, value]) => {
                this.set(key, value);
            });
            return true;
        }
        return false;
    }

    /**
     * Clear saved game state from local storage
     */
    clearSavedState() {
        localStorage.removeItem('gameState');
    }

    /**
     * Trigger game over logic
     * Currently just emits 'gameOver' event, which Scenes can listen for.
     */
    handleGameOver() {
        console.log('\n[GameStateManager] handleGameOver(): Game Over triggered');
        this.eventManager.emit(GameEvents.GAME_OVER);
    }
}
