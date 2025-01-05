import * as actions from '../actions';
import { ActionTypes } from '../types';

describe('Action Creators', () => {
    describe('game state actions', () => {
        it('should create an action to update score', () => {
            const expectedAction = {
                type: ActionTypes.UPDATE_SCORE,
                payload: 100
            };
            expect(actions.updateScore(100)).toEqual(expectedAction);
        });

        it('should create an action to update lives', () => {
            const expectedAction = {
                type: ActionTypes.UPDATE_LIVES,
                payload: 3
            };
            expect(actions.updateLives(3)).toEqual(expectedAction);
        });

        it('should create an action to update health', () => {
            const expectedAction = {
                type: ActionTypes.UPDATE_HEALTH,
                payload: 75
            };
            expect(actions.updateHealth(75)).toEqual(expectedAction);
        });

        it('should create an action to update stamina', () => {
            const expectedAction = {
                type: ActionTypes.UPDATE_STAMINA,
                payload: 60
            };
            expect(actions.updateStamina(60)).toEqual(expectedAction);
        });

        it('should create an action to update bitcoins', () => {
            const expectedAction = {
                type: ActionTypes.UPDATE_BITCOINS,
                payload: 5
            };
            expect(actions.updateBitcoins(5)).toEqual(expectedAction);
        });
    });

    describe('game progress actions', () => {
        it('should create an action to update level', () => {
            const expectedAction = {
                type: ActionTypes.UPDATE_LEVEL,
                payload: 2
            };
            expect(actions.updateLevel(2)).toEqual(expectedAction);
        });

        it('should create an action to update checkpoint', () => {
            const checkpoint = { x: 100, y: 200 };
            const expectedAction = {
                type: ActionTypes.UPDATE_CHECKPOINT,
                payload: checkpoint
            };
            expect(actions.updateCheckpoint(checkpoint)).toEqual(expectedAction);
        });
    });

    describe('settings actions', () => {
        it('should create an action to update settings', () => {
            const settings = {
                musicEnabled: true,
                soundVolume: 0.8
            };
            const expectedAction = {
                type: ActionTypes.UPDATE_SETTINGS,
                payload: settings
            };
            expect(actions.updateSettings(settings)).toEqual(expectedAction);
        });
    });

    describe('player state actions', () => {
        it('should create an action to update player state', () => {
            const expectedAction = {
                type: ActionTypes.UPDATE_PLAYER_STATE,
                payload: 'JUMPING'
            };
            expect(actions.updatePlayerState('JUMPING')).toEqual(expectedAction);
        });
    });

    describe('game status actions', () => {
        it('should create an action to update game status', () => {
            const expectedAction = {
                type: ActionTypes.UPDATE_GAME_STATUS,
                payload: 'PLAYING'
            };
            expect(actions.updateGameStatus('PLAYING')).toEqual(expectedAction);
        });
    });
});
