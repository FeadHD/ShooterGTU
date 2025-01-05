import { GameStateManager } from '../GameStateManager';
import { GameStatus, PlayerState } from '../types';

describe('GameStateManager', () => {
    let gameStateManager;

    beforeEach(() => {
        gameStateManager = new GameStateManager();
        localStorage.clear();
    });

    describe('initialization', () => {
        it('should initialize with default state', () => {
            const state = gameStateManager.getState();
            expect(state.game.status).toBe(GameStatus.MENU);
            expect(state.player.health).toBe(100);
        });
    });

    describe('game state methods', () => {
        it('should update score', () => {
            gameStateManager.updateScore(100);
            expect(gameStateManager.select(state => state.game.score)).toBe(100);
        });

        it('should increment score', () => {
            gameStateManager.updateScore(100);
            gameStateManager.incrementScore(50);
            expect(gameStateManager.select(state => state.game.score)).toBe(150);
        });

        it('should update lives', () => {
            gameStateManager.updateLives(2);
            expect(gameStateManager.select(state => state.game.lives)).toBe(2);
        });

        it('should decrement lives and trigger game over', () => {
            gameStateManager.updateLives(1);
            gameStateManager.decrementLives();
            expect(gameStateManager.select(state => state.game.lives)).toBe(0);
            expect(gameStateManager.select(state => state.game.status)).toBe(GameStatus.GAME_OVER);
        });

        it('should update health', () => {
            gameStateManager.updateHealth(50);
            expect(gameStateManager.select(state => state.player.health)).toBe(50);
        });

        it('should update stamina with limits', () => {
            gameStateManager.updateStamina(150); // Over max
            expect(gameStateManager.select(state => state.player.stamina)).toBe(100);

            gameStateManager.updateStamina(-10); // Under min
            expect(gameStateManager.select(state => state.player.stamina)).toBe(0);
        });

        it('should update bitcoins', () => {
            gameStateManager.updateBitcoins(5);
            expect(gameStateManager.select(state => state.player.bitcoins)).toBe(5);
        });
    });

    describe('player state methods', () => {
        it('should update player state', () => {
            gameStateManager.updatePlayerState(PlayerState.JUMPING);
            expect(gameStateManager.select(state => state.player.state)).toBe(PlayerState.JUMPING);
        });

        it('should ignore invalid player states', () => {
            const initialState = gameStateManager.select(state => state.player.state);
            gameStateManager.updatePlayerState('INVALID_STATE');
            expect(gameStateManager.select(state => state.player.state)).toBe(initialState);
        });
    });

    describe('game flow methods', () => {
        it('should handle game start', () => {
            gameStateManager.startGame();
            expect(gameStateManager.select(state => state.game.status)).toBe(GameStatus.PLAYING);
        });

        it('should handle game pause', () => {
            gameStateManager.pauseGame();
            expect(gameStateManager.select(state => state.game.status)).toBe(GameStatus.PAUSED);
        });

        it('should handle game resume', () => {
            gameStateManager.pauseGame();
            gameStateManager.resumeGame();
            expect(gameStateManager.select(state => state.game.status)).toBe(GameStatus.PLAYING);
        });

        it('should handle game over', () => {
            gameStateManager.handleGameOver();
            expect(gameStateManager.select(state => state.game.status)).toBe(GameStatus.GAME_OVER);
        });
    });

    describe('settings methods', () => {
        it('should update settings', () => {
            const newSettings = {
                musicEnabled: false,
                soundVolume: 0.5
            };
            gameStateManager.updateSettings(newSettings);
            expect(gameStateManager.select(state => state.settings.musicEnabled)).toBe(false);
            expect(gameStateManager.select(state => state.settings.soundVolume)).toBe(0.5);
        });
    });

    describe('subscription system', () => {
        it('should notify subscribers of state changes', () => {
            const mockSubscriber = jest.fn();
            gameStateManager.subscribe(mockSubscriber);

            gameStateManager.updateScore(100);

            expect(mockSubscriber).toHaveBeenCalled();
        });

        it('should allow unsubscribing', () => {
            const mockSubscriber = jest.fn();
            const unsubscribe = gameStateManager.subscribe(mockSubscriber);

            unsubscribe();
            gameStateManager.updateScore(100);

            expect(mockSubscriber).not.toHaveBeenCalled();
        });
    });

    describe('debug features', () => {
        it('should track state history', () => {
            gameStateManager.updateScore(100);
            gameStateManager.updateHealth(50);

            const history = gameStateManager.getStateHistory();
            expect(history.length).toBe(2);
            expect(history[1].nextState.game.score).toBe(100);
            expect(history[1].nextState.player.health).toBe(50);
        });
    });
});
