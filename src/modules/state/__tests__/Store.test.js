import { Store } from '../Store';
import { ActionTypes, GameStatus, PlayerState } from '../types';

describe('Store', () => {
    let store;

    beforeEach(() => {
        store = new Store();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('initialization', () => {
        it('should initialize with default state', () => {
            const state = store.getState();
            expect(state.game.status).toBe(GameStatus.MENU);
            expect(state.game.score).toBe(0);
            expect(state.game.lives).toBe(3);
            expect(state.player.health).toBe(100);
            expect(state.player.stamina).toBe(100);
        });
    });

    describe('state updates', () => {
        it('should update score correctly', () => {
            store.dispatch({
                type: ActionTypes.UPDATE_SCORE,
                payload: 100
            });
            expect(store.getState().game.score).toBe(100);
        });

        it('should update player health correctly', () => {
            store.dispatch({
                type: ActionTypes.UPDATE_HEALTH,
                payload: 50
            });
            expect(store.getState().player.health).toBe(50);
        });

        it('should update game status correctly', () => {
            store.dispatch({
                type: ActionTypes.UPDATE_GAME_STATUS,
                payload: GameStatus.PLAYING
            });
            expect(store.getState().game.status).toBe(GameStatus.PLAYING);
        });

        it('should update player state correctly', () => {
            store.dispatch({
                type: ActionTypes.UPDATE_PLAYER_STATE,
                payload: PlayerState.JUMPING
            });
            expect(store.getState().player.state).toBe(PlayerState.JUMPING);
        });
    });

    describe('subscriptions', () => {
        it('should notify subscribers of state changes', () => {
            const mockSubscriber = jest.fn();
            store.subscribe(mockSubscriber);

            store.dispatch({
                type: ActionTypes.UPDATE_SCORE,
                payload: 100
            });

            expect(mockSubscriber).toHaveBeenCalled();
            const [newState, action] = mockSubscriber.mock.calls[0];
            expect(newState.game.score).toBe(100);
            expect(action.type).toBe(ActionTypes.UPDATE_SCORE);
        });

        it('should allow unsubscribing', () => {
            const mockSubscriber = jest.fn();
            const unsubscribe = store.subscribe(mockSubscriber);

            unsubscribe();

            store.dispatch({
                type: ActionTypes.UPDATE_SCORE,
                payload: 100
            });

            expect(mockSubscriber).not.toHaveBeenCalled();
        });
    });

    describe('state history', () => {
        it('should maintain state history', () => {
            store.dispatch({
                type: ActionTypes.UPDATE_SCORE,
                payload: 100
            });

            const history = store.getHistory();
            expect(history).toHaveLength(1);
            expect(history[0].action.type).toBe(ActionTypes.UPDATE_SCORE);
            expect(history[0].nextState.game.score).toBe(100);
        });

        it('should limit history length', () => {
            // Fill history beyond limit
            for (let i = 0; i < 105; i++) {
                store.dispatch({
                    type: ActionTypes.UPDATE_SCORE,
                    payload: i
                });
            }

            const history = store.getHistory();
            expect(history.length).toBeLessThanOrEqual(store.maxHistoryLength);
        });
    });

    describe('persistence', () => {
        it('should persist state to localStorage', () => {
            store.dispatch({
                type: ActionTypes.UPDATE_SCORE,
                payload: 100
            });

            store.persist();

            const savedState = JSON.parse(localStorage.getItem('gameState'));
            expect(savedState.game.score).toBe(100);
        });

        it('should hydrate state from localStorage', () => {
            localStorage.setItem('gameState', JSON.stringify({
                game: { score: 200 },
                player: { health: 50 }
            }));

            store.hydrate();

            expect(store.getState().game.score).toBe(200);
            expect(store.getState().player.health).toBe(50);
        });
    });

    describe('state selection', () => {
        it('should select state using selectors', () => {
            store.dispatch({
                type: ActionTypes.UPDATE_SCORE,
                payload: 100
            });

            const score = store.select(state => state.game.score);
            expect(score).toBe(100);
        });
    });

    describe('reset functionality', () => {
        it('should reset state to initial values', () => {
            store.dispatch({
                type: ActionTypes.UPDATE_SCORE,
                payload: 100
            });

            store.reset();

            const state = store.getState();
            expect(state.game.score).toBe(0);
            expect(state.game.status).toBe(GameStatus.MENU);
        });
    });
});
