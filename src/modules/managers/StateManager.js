/**
 * StateManager.js
 * Manages game state, persistence, and data flow between scenes
 * Handles score, lives, health, and other game-wide variables
 */

export class StateManager {
    /**
     * Initialize state management system
     * @param {Phaser.Scene} scene - Scene this manager belongs to
     */
    constructor(scene) {
        this.scene = scene;
        this.registry = scene.registry;      // Phaser's global registry
        this.events = scene.events;          // Scene event emitter
    }

    /**
     * Set up initial game state values
     * Called when starting a new game or resetting state
     */
    initializeGameState() {
        // Set default values if not already present
        if (!this.registry.has('score')) {
            this.registry.set('score', 0);
        }
        if (!this.registry.has('lives')) {
            this.registry.set('lives', 3);
        }
        if (!this.registry.has('playerHP')) {
            this.registry.set('playerHP', 100);
        }
        if (!this.registry.has('bitcoins')) {
            this.registry.set('bitcoins', 0);
        }
        if (!this.registry.has('musicEnabled')) {
            this.registry.set('musicEnabled', true);
        }
        if (!this.registry.has('gameStarted')) {
            this.registry.set('gameStarted', false);
        }
        if (!this.registry.has('stamina')) {
            this.registry.set('stamina', 100);
        }
    }

    /**
     * Get value from game state
     * @param {string} key - State variable name
     * @returns {any} Current value
     */
    get(key) {
        return this.registry.get(key);
    }

    /**
     * Set value in game state
     * @param {string} key - State variable name
     * @param {any} value - New value
     * @returns {any} Updated value
     */
    set(key, value) {
        this.registry.set(key, value);
        return value;
    }

    /**
     * Increase numeric state value
     * @param {string} key - State variable name
     * @param {number} amount - Amount to increase (default: 1)
     * @returns {number} New value after increase
     */
    increment(key, amount = 1) {
        const currentValue = this.registry.get(key);
        const newValue = currentValue + amount;
        this.registry.set(key, newValue);
        return newValue;
    }

    /**
     * Decrease numeric state value (minimum 0)
     * @param {string} key - State variable name
     * @param {number} amount - Amount to decrease (default: 1)
     * @returns {number} New value after decrease
     */
    decrement(key, amount = 1) {
        const currentValue = this.registry.get(key);
        const newValue = Math.max(0, currentValue - amount);
        this.registry.set(key, newValue);
        return newValue;
    }

    /**
     * Reset state to default values
     * Can reset single key or all state variables
     * @param {string} [key] - Optional key to reset
     */
    reset(key) {
        const defaults = {
            score: 0,
            lives: 3,
            playerHP: 100,
            bitcoins: 0,
            musicEnabled: true,
            gameStarted: false,
            stamina: 100
        };
        
        if (key) {
            this.set(key, defaults[key]);
        } else {
            Object.entries(defaults).forEach(([key, value]) => {
                this.set(key, value);
            });
        }
    }

    /**
     * Register state change listener
     * @param {Function} callback - Function to call on state change
     */
    onStateChange(callback) {
        this.registry.events.on('changedata', callback);
    }

    /**
     * Remove state change listener
     * @param {Function} callback - Function to remove from listeners
     */
    offStateChange(callback) {
        this.registry.events.off('changedata', callback);
    }

    /**
     * Save current game state to browser storage
     * Persists between game sessions
     */
    saveToLocalStorage() {
        const gameState = {};
        ['score', 'lives', 'playerHP', 'bitcoins', 'musicEnabled', 'gameStarted', 'stamina'].forEach(key => {
            gameState[key] = this.get(key);
        });
        localStorage.setItem('gameState', JSON.stringify(gameState));
    }

    /**
     * Load saved game state from browser storage
     * @returns {boolean} True if state was loaded successfully
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
     * Clear saved game state from browser storage
     */
    clearSavedState() {
        localStorage.removeItem('gameState');
    }

    /**
     * Handle game over condition
     * Transitions to game over scene
     */
    handleGameOver() {
        this.scene.scene.start('GameOver');
    }
}