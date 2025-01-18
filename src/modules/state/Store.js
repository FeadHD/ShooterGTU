/**
 * Store.js
 * Redux-like state management store for the game
 * Handles state updates, history tracking, and persistence
 */

import { EventEmitter } from 'events';
import { ActionTypes, GameStatus, PlayerState } from './types';

export class Store extends EventEmitter {
    /**
     * Initialize store with default state and event handling
     */
    constructor() {
        super();
        this.state = this.getInitialState();
        this.subscribers = new Set();
        this.history = [];
        this.maxHistoryLength = 100;  // Limit history to prevent memory issues
    }

    /**
     * Define initial state structure with default values
     * Contains game status, player stats, and settings
     */
    getInitialState() {
        return {
            game: {
                status: GameStatus.MENU,
                score: 0,
                lives: 3,
                level: 1,
                checkpoint: null
            },
            player: {
                health: 100,
                stamina: 100,
                bitcoins: 0,
                state: PlayerState.IDLE,
                position: { x: 0, y: 0 }
            },
            settings: {
                musicEnabled: true,
                soundEnabled: true,
                musicVolume: 0.7,
                soundVolume: 1.0
            }
        };
    }

    /**
     * STATE ACCESS
     */

    // Return copy of current state to prevent direct mutations
    getState() {
        return { ...this.state };
    }

    // Get specific state slice using selector function
    select(selector) {
        return selector(this.state);
    }

    /**
     * STATE UPDATES AND EVENTS
     */

    // Process action and update state, tracking history
    dispatch(action) {
        const prevState = { ...this.state };
        const nextState = this.reducer(prevState, action);
        
        this.addToHistory({ action, prevState, nextState });
        this.state = nextState;
        this.notifySubscribers(action);
        this.emit('stateChanged', this.state);
        
        return nextState;
    }

    // Register callback for state changes, returns unsubscribe function
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    /**
     * STATE REDUCER
     * Handles all state updates based on action type
     */
    reducer(state, action) {
        switch (action.type) {
            case ActionTypes.UPDATE_SCORE:
                return {
                    ...state,
                    game: {
                        ...state.game,
                        score: action.payload
                    }
                };
                
            case ActionTypes.UPDATE_LIVES:
                return {
                    ...state,
                    game: {
                        ...state.game,
                        lives: action.payload
                    }
                };
                
            case ActionTypes.UPDATE_HEALTH:
                return {
                    ...state,
                    player: {
                        ...state.player,
                        health: action.payload
                    }
                };
                
            case ActionTypes.UPDATE_STAMINA:
                return {
                    ...state,
                    player: {
                        ...state.player,
                        stamina: action.payload
                    }
                };
                
            case ActionTypes.UPDATE_BITCOINS:
                return {
                    ...state,
                    player: {
                        ...state.player,
                        bitcoins: action.payload
                    }
                };
                
            case ActionTypes.UPDATE_PLAYER_STATE:
                return {
                    ...state,
                    player: {
                        ...state.player,
                        state: action.payload
                    }
                };
                
            case ActionTypes.UPDATE_GAME_STATUS:
                return {
                    ...state,
                    game: {
                        ...state.game,
                        status: action.payload
                    }
                };
                
            case ActionTypes.UPDATE_SETTINGS:
                return {
                    ...state,
                    settings: {
                        ...state.settings,
                        ...action.payload
                    }
                };
                
            default:
                return state;
        }
    }

    /**
     * HISTORY MANAGEMENT
     */

    // Track state changes with timestamps
    addToHistory({ action, prevState, nextState }) {
        const timestamp = Date.now();
        this.history.push({ action, prevState, nextState, timestamp });
        
        if (this.history.length > this.maxHistoryLength) {
            this.history.shift();  // Remove oldest entry
        }
    }

    // Notify subscribers of state changes
    notifySubscribers(action) {
        this.subscribers.forEach(callback => callback(this.state, action));
    }

    // Get copy of state change history
    getHistory() {
        return [...this.history];
    }

    /**
     * STATE PERSISTENCE
     */

    // Reset to initial state
    reset() {
        this.state = this.getInitialState();
        this.notifySubscribers({ type: 'RESET' });
    }

    // Save state to localStorage
    persist() {
        try {
            localStorage.setItem('gameState', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to persist state:', error);
        }
    }

    // Load state from localStorage
    hydrate() {
        try {
            const savedState = localStorage.getItem('gameState');
            if (savedState) {
                this.state = JSON.parse(savedState);
                this.notifySubscribers({ type: 'HYDRATE' });
            }
        } catch (error) {
            console.error('Failed to hydrate state:', error);
        }
    }
}
