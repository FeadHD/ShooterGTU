import { Store } from './Store';
import * as actions from './actions';
import { GameStatus, PlayerState } from './types';

export class GameStateManager {
    constructor() {
        this.store = new Store();
        this.setupSubscriptions();
    }

    setupSubscriptions() {
        // Auto-persist state changes
        this.store.subscribe((state, action) => {
            this.store.persist();
        });
    }

    // Initialize game state
    initializeGameState() {
        // Load saved state or use initial state
        this.store.hydrate();
    }

    // Game state methods
    updateScore(score) {
        this.store.dispatch(actions.updateScore(score));
    }

    incrementScore(amount) {
        const currentScore = this.store.select(state => state.game.score);
        this.updateScore(currentScore + amount);
    }

    updateLives(lives) {
        this.store.dispatch(actions.updateLives(lives));
    }

    decrementLives() {
        const currentLives = this.store.select(state => state.game.lives);
        if (currentLives > 0) {
            this.updateLives(currentLives - 1);
        }
        if (currentLives - 1 <= 0) {
            this.handleGameOver();
        }
    }

    updateHealth(health) {
        this.store.dispatch(actions.updateHealth(health));
    }

    updateStamina(stamina) {
        this.store.dispatch(actions.updateStamina(Math.max(0, Math.min(100, stamina))));
    }

    updateBitcoins(bitcoins) {
        this.store.dispatch(actions.updateBitcoins(bitcoins));
    }

    // Player state methods
    updatePlayerState(state) {
        if (Object.values(PlayerState).includes(state)) {
            this.store.dispatch(actions.updatePlayerState(state));
        }
    }

    // Game status methods
    updateGameStatus(status) {
        if (Object.values(GameStatus).includes(status)) {
            this.store.dispatch(actions.updateGameStatus(status));
        }
    }

    // Settings methods
    updateSettings(settings) {
        this.store.dispatch(actions.updateSettings(settings));
    }

    // Game flow methods
    startGame() {
        this.updateGameStatus(GameStatus.PLAYING);
    }

    pauseGame() {
        this.updateGameStatus(GameStatus.PAUSED);
    }

    resumeGame() {
        this.updateGameStatus(GameStatus.PLAYING);
    }

    handleGameOver() {
        this.updateGameStatus(GameStatus.GAME_OVER);
    }

    // State access methods
    getState() {
        return this.store.getState();
    }

    select(selector) {
        return this.store.select(selector);
    }

    // Reset methods
    reset() {
        this.store.reset();
    }

    // Subscription methods
    subscribe(callback) {
        return this.store.subscribe(callback);
    }

    // Debug methods
    getStateHistory() {
        return this.store.getHistory();
    }
}
