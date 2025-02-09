/**
 * Manages game state persistence using browser's localStorage
 * Handles saving, loading, and clearing game state data
 */
export class PersistenceManager {
    /**
     * Creates a new PersistenceManager instance
     * @param {GameStateManager} gameStateManager - Reference to the game's state manager
     */
    constructor(gameStateManager) {
        this.gameStateManager = gameStateManager;
    }

    /**
     * Saves current game state to localStorage
     * Converts all registry values to a JSON string
     */
    saveToLocalStorage() {
        const gameState = {};
        const registry = this.gameStateManager.registry;
        
        // Extract all key-value pairs from the registry
        registry.getAll().forEach(({ key, value }) => {
            gameState[key] = value;
        });

        // Store the state as a JSON string in localStorage
        localStorage.setItem('gameState', JSON.stringify(gameState));
    }

    /**
     * Loads saved game state from localStorage
     * @returns {boolean} True if state was loaded successfully, false if no saved state exists
     */
    loadFromLocalStorage() {
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
            // Parse and restore each saved value to the game state
            const gameState = JSON.parse(savedState);
            Object.entries(gameState).forEach(([key, value]) => {
                this.gameStateManager.set(key, value);
            });
            return true;
        }
        return false;
    }

    /**
     * Clears any saved game state from localStorage
     * Used when resetting the game or starting fresh
     */
    clearSavedState() {
        localStorage.removeItem('gameState');
    }
}
