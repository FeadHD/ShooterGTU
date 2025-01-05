import { ActionTypes } from './types';

// Game state actions
export const updateScore = (score) => ({
    type: ActionTypes.UPDATE_SCORE,
    payload: score
});

export const updateLives = (lives) => ({
    type: ActionTypes.UPDATE_LIVES,
    payload: lives
});

export const updateHealth = (health) => ({
    type: ActionTypes.UPDATE_HEALTH,
    payload: health
});

export const updateStamina = (stamina) => ({
    type: ActionTypes.UPDATE_STAMINA,
    payload: stamina
});

export const updateBitcoins = (bitcoins) => ({
    type: ActionTypes.UPDATE_BITCOINS,
    payload: bitcoins
});

// Game progress actions
export const updateLevel = (level) => ({
    type: ActionTypes.UPDATE_LEVEL,
    payload: level
});

export const updateCheckpoint = (checkpoint) => ({
    type: ActionTypes.UPDATE_CHECKPOINT,
    payload: checkpoint
});

// Settings actions
export const updateSettings = (settings) => ({
    type: ActionTypes.UPDATE_SETTINGS,
    payload: settings
});

// Player state actions
export const updatePlayerState = (state) => ({
    type: ActionTypes.UPDATE_PLAYER_STATE,
    payload: state
});

// Game status actions
export const updateGameStatus = (status) => ({
    type: ActionTypes.UPDATE_GAME_STATUS,
    payload: status
});
