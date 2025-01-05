import { GameConfig } from '../../../config/GameConfig';
import { BaseManager } from '../../di/BaseManager';

export class GameStateManager extends BaseManager {
    constructor(scene) {
        super();
        this.scene = scene;
        this.registry = scene.registry;
        this.events = scene.events;
        this.eventBus = this.container.get('eventBus');
    }

    initializeGameState() {
        const defaults = {
            score: GameConfig.UI.INITIAL_SCORE,
            lives: GameConfig.UI.DEFAULT_LIVES,
            playerHP: GameConfig.PLAYER.INITIAL_HP,
            bitcoins: GameConfig.UI.INITIAL_COINS,
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
        this.eventBus.emit('gameStateInitialized', defaults);
    }

    get(key) {
        return this.registry.get(key);
    }

    set(key, value) {
        this.registry.set(key, value);
        this.eventBus.emit('stateChanged', { key, value });
    }

    increment(key, amount = 1) {
        const currentValue = this.get(key);
        this.set(key, currentValue + amount);
    }

    decrement(key, amount = 1) {
        const currentValue = this.get(key);
        this.set(key, currentValue - amount);
    }

    reset(key) {
        const defaults = {
            score: GameConfig.UI.INITIAL_SCORE,
            lives: GameConfig.UI.DEFAULT_LIVES,
            playerHP: GameConfig.PLAYER.INITIAL_HP,
            bitcoins: GameConfig.UI.INITIAL_COINS,
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

    handleGameOver() {
        this.eventBus.emit('gameOver');
    }
}
