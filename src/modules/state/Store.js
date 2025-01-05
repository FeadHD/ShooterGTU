import { EventEmitter } from 'events';
import { ActionTypes, GameStatus, PlayerState } from './types';

export class Store extends EventEmitter {
    constructor() {
        super();
        this.state = this.getInitialState();
        this.subscribers = new Set();
        this.history = [];
        this.maxHistoryLength = 100;
    }

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

    // Get current state
    getState() {
        return { ...this.state };
    }

    // Get specific state slice
    select(selector) {
        return selector(this.state);
    }

    // Dispatch an action to update state
    dispatch(action) {
        const prevState = { ...this.state };
        const nextState = this.reducer(prevState, action);
        
        // Save to history
        this.addToHistory({ action, prevState, nextState });
        
        // Update state
        this.state = nextState;
        
        // Notify subscribers
        this.notifySubscribers(action);
        
        // Emit change event
        this.emit('stateChanged', this.state);
        
        return nextState;
    }

    // Subscribe to state changes
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    // Main reducer
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

    // Add state change to history
    addToHistory({ action, prevState, nextState }) {
        const timestamp = Date.now();
        this.history.push({ action, prevState, nextState, timestamp });
        
        // Maintain history length
        if (this.history.length > this.maxHistoryLength) {
            this.history.shift();
        }
    }

    // Notify all subscribers
    notifySubscribers(action) {
        this.subscribers.forEach(callback => callback(this.state, action));
    }

    // Get state history
    getHistory() {
        return [...this.history];
    }

    // Reset state to initial
    reset() {
        this.state = this.getInitialState();
        this.notifySubscribers({ type: 'RESET' });
    }

    // Save state to storage
    persist() {
        try {
            localStorage.setItem('gameState', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to persist state:', error);
        }
    }

    // Load state from storage
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
