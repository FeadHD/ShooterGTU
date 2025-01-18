/**
 * GameStateManager.js
 * Centralized state management for the game using a Redux-like pattern.
 * Handles game state, player stats, settings, and game flow.
 */

import { Store } from './Store';
import * as actions from './actions';
import { GameStatus, PlayerState } from './types';

export class GameStateManager {
    constructor() {
        // Initialize Redux-like store for state management
        this.store = new Store();
        this.setupSubscriptions();
    }

    /**
     * INITIALIZATION AND PERSISTENCE
     */
    
    setupSubscriptions() {
        // Automatically save state changes to persistent storage
        this.store.subscribe((state, action) => {
            this.store.persist();
        });
    }

    initializeGameState() {
        // Load saved state from storage or use default initial state
        this.store.hydrate();
    }

    /**
     * SCORE AND RESOURCE MANAGEMENT
     * Methods for updating player score, lives, health, and collectibles
     */

    updateScore(score) {
        this.store.dispatch(actions.updateScore(score));
    }

    incrementScore(amount) {
        // Add to current score while maintaining single source of truth
        const currentScore = this.store.select(state => state.game.score);
        this.updateScore(currentScore + amount);
    }

    updateLives(lives) {
        this.store.dispatch(actions.updateLives(lives));
    }

    decrementLives() {
        // Reduce lives and trigger game over if no lives remain
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
        // Clamp stamina between 0 and 100
        this.store.dispatch(actions.updateStamina(Math.max(0, Math.min(100, stamina))));
    }

    updateBitcoins(bitcoins) {
        this.store.dispatch(actions.updateBitcoins(bitcoins));
    }

    /**
     * PLAYER STATE MANAGEMENT
     * Controls player states like idle, jumping, attacking
     */

    updatePlayerState(state) {
        // Only update if the state is valid
        if (Object.values(PlayerState).includes(state)) {
            this.store.dispatch(actions.updatePlayerState(state));
        }
    }

    /**
     * GAME FLOW CONTROL
     * Methods for managing game status and transitions
     */

    updateGameStatus(status) {
        // Validate status before updating
        if (Object.values(GameStatus).includes(status)) {
            this.store.dispatch(actions.updateGameStatus(status));
        }
    }

    updateSettings(settings) {
        // Update game settings (audio, controls, etc.)
        this.store.dispatch(actions.updateSettings(settings));
    }

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

    /**
     * STATE ACCESS AND MANIPULATION
     * Methods for reading and modifying game state
     */

    getState() {
        // Get complete current state
        return this.store.getState();
    }

    select(selector) {
        // Get specific state using selector function
        return this.store.select(selector);
    }

    reset() {
        // Reset state to initial values
        this.store.reset();
    }

    subscribe(callback) {
        // Register listener for state changes
        return this.store.subscribe(callback);
    }

    /**
     * DEBUGGING AND DEVELOPMENT
     */

    getStateHistory() {
        // Get state change history for debugging
        return this.store.getHistory();
    }
}
