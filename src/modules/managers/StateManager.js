// 3. StateManager.js
export class StateManager {
    constructor(scene) {
        this.scene = scene;
        this.registry = scene.registry;
        this.events = scene.events;
    }

    initializeGameState() {
        // Initialize game state if not already set
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

    get(key) {
        return this.registry.get(key);
    }

    set(key, value) {
        this.registry.set(key, value);
        return value;
    }

    increment(key, amount = 1) {
        const currentValue = this.registry.get(key);
        const newValue = currentValue + amount;
        this.registry.set(key, newValue);
        return newValue;
    }

    decrement(key, amount = 1) {
        const currentValue = this.registry.get(key);
        const newValue = Math.max(0, currentValue - amount);
        this.registry.set(key, newValue);
        return newValue;
    }

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

    onStateChange(callback) {
        this.registry.events.on('changedata', callback);
    }

    offStateChange(callback) {
        this.registry.events.off('changedata', callback);
    }

    saveToLocalStorage() {
        const gameState = {};
        ['score', 'lives', 'playerHP', 'bitcoins', 'musicEnabled', 'gameStarted', 'stamina'].forEach(key => {
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

    handleGameOver() {
        this.scene.scene.start('GameOver');
    }
}