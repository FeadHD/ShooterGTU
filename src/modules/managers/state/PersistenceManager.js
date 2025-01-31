export class PersistenceManager {
    constructor(gameStateManager) {
        this.gameStateManager = gameStateManager;
    }

    saveToLocalStorage() {
        const gameState = {};
        const registry = this.gameStateManager.registry;
        
        // Save all registry values
        registry.getAll().forEach(({ key, value }) => {
            gameState[key] = value;
        });

        localStorage.setItem('gameState', JSON.stringify(gameState));
    }

    loadFromLocalStorage() {
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            Object.entries(gameState).forEach(([key, value]) => {
                this.gameStateManager.set(key, value);
            });
            return true;
        }
        return false;
    }

    clearSavedState() {
        localStorage.removeItem('gameState');
    }
}
