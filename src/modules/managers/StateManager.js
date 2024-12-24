// 3. StateManager.js
export class StateManager {
    constructor(scene) {
        this.scene = scene;
        this.registry = scene.registry;
        this.events = scene.events;
    }

    initializeGameState() {
        const defaults = {
            score: 0,
            lives: 3,
            playerHP: 100,
            bitcoins: 0,
            musicEnabled: true
        };

        Object.entries(defaults).forEach(([key, value]) => {
            if (this.registry.get(key) === undefined) {
                this.registry.set(key, value);
            }
        });
    }

    get(key) {
        return this.registry.get(key);
    }

    set(key, value) {
        this.registry.set(key, value);
    }

    increment(key, amount = 1) {
        const currentValue = this.get(key);
        this.set(key, currentValue + amount);
        return currentValue + amount;
    }

    decrement(key, amount = 1) {
        const currentValue = this.get(key);
        this.set(key, currentValue - amount);
        return currentValue - amount;
    }

    reset(key) {
        const defaults = {
            score: 0,
            lives: 3,
            playerHP: 100,
            bitcoins: 0,
            musicEnabled: true
        };
        
        if (key) {
            this.set(key, defaults[key]);
        } else {
            Object.entries(defaults).forEach(([key, value]) => {
                this.set(key, value);
            });
        }
    }

    onStateChange(callback) {
        this.registry.events.on('changedata', callback);
    }

    offStateChange(callback) {
        this.registry.events.off('changedata', callback);
    }

    saveToLocalStorage() {
        const gameState = {};
        ['score', 'lives', 'playerHP', 'bitcoins', 'musicEnabled'].forEach(key => {
            gameState[key] = this.get(key);
        });
        localStorage.setItem('gameState', JSON.stringify(gameState));
    }

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

    clearSavedState() {
        localStorage.removeItem('gameState');
    }
}