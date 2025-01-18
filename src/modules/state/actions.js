/**
 * actions.js
 * Redux-style action creators for managing game state.
 * Each action creator returns an object with a type and payload
 * to be processed by the game's reducers.
 */

import { ActionTypes } from './types';

/**
 * PLAYER STATISTICS
 * Actions for updating core player metrics during gameplay
 */

// Update player's current score
export const updateScore = (score) => ({
    type: ActionTypes.UPDATE_SCORE,
    payload: score
});

// Update player's remaining lives
export const updateLives = (lives) => ({
    type: ActionTypes.UPDATE_LIVES,
    payload: lives
});

// Update player's current health points
export const updateHealth = (health) => ({
    type: ActionTypes.UPDATE_HEALTH,
    payload: health
});

// Update player's stamina/energy level
export const updateStamina = (stamina) => ({
    type: ActionTypes.UPDATE_STAMINA,
    payload: stamina
});

// Update player's collected bitcoins/currency
export const updateBitcoins = (bitcoins) => ({
    type: ActionTypes.UPDATE_BITCOINS,
    payload: bitcoins
});

/**
 * GAME PROGRESSION
 * Actions for tracking player progress through the game
 */

// Update current game level/stage
export const updateLevel = (level) => ({
    type: ActionTypes.UPDATE_LEVEL,
    payload: level
});

// Update latest reached checkpoint
export const updateCheckpoint = (checkpoint) => ({
    type: ActionTypes.UPDATE_CHECKPOINT,
    payload: checkpoint
});

/**
 * GAME CONFIGURATION
 * Actions for managing game settings and preferences
 */

// Update game settings (audio, controls, etc.)
export const updateSettings = (settings) => ({
    type: ActionTypes.UPDATE_SETTINGS,
    payload: settings
});

/**
 * PLAYER STATE
 * Actions for managing player's current state/condition
 */

// Update player's current state (idle, moving, attacking, etc.)
export const updatePlayerState = (state) => ({
    type: ActionTypes.UPDATE_PLAYER_STATE,
    payload: state
});

/**
 * GAME STATE
 * Actions for managing overall game state
 */

// Update game status (menu, playing, paused, game over)
export const updateGameStatus = (status) => ({
    type: ActionTypes.UPDATE_GAME_STATUS,
    payload: status
});
