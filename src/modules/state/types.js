/**
 * types.js
 * Defines constants for action types and game states.
 * Used by reducers to identify actions and by components to track states.
 */

/**
 * ACTION TYPES
 * Constants used by action creators and reducers to identify state changes.
 * Grouped by their related game systems.
 */
export const ActionTypes = {
    /**
     * Player Statistics
     * Actions for updating core player metrics
     */
    UPDATE_SCORE: 'UPDATE_SCORE',       // Change player's current score
    UPDATE_LIVES: 'UPDATE_LIVES',       // Modify remaining lives
    UPDATE_HEALTH: 'UPDATE_HEALTH',     // Update health points
    UPDATE_BITCOINS: 'UPDATE_BITCOINS', // Modify currency amount
    UPDATE_STAMINA: 'UPDATE_STAMINA',   // Change stamina/energy level
    
    /**
     * Game Progress
     * Actions for tracking progression
     */
    UPDATE_LEVEL: 'UPDATE_LEVEL',           // Change current game level
    UPDATE_CHECKPOINT: 'UPDATE_CHECKPOINT',  // Update save/spawn point
    
    /**
     * Game Configuration
     * Actions for managing settings
     */
    UPDATE_SETTINGS: 'UPDATE_SETTINGS',      // Modify game settings
    
    /**
     * Player Status
     * Actions for managing player state
     */
    UPDATE_PLAYER_STATE: 'UPDATE_PLAYER_STATE', // Change player's current state
    
    /**
     * Game Flow
     * Actions for managing game flow
     */
    UPDATE_GAME_STATUS: 'UPDATE_GAME_STATUS'    // Change game's current status
};

/**
 * GAME STATUS STATES
 * Possible states for the overall game flow.
 * Used to determine current game screen and behavior.
 */
export const GameStatus = {
    MENU: 'MENU',           // In main menu or other menus
    PLAYING: 'PLAYING',     // Active gameplay
    PAUSED: 'PAUSED',       // Game temporarily halted
    GAME_OVER: 'GAME_OVER' // Player has lost/game ended
};

/**
 * PLAYER STATES
 * Possible states for the player character.
 * Used for animation and physics control.
 */
export const PlayerState = {
    IDLE: 'IDLE',         // Standing still
    WALKING: 'WALKING',   // Moving horizontally
    JUMPING: 'JUMPING',   // Moving upward
    FALLING: 'FALLING',   // Moving downward
    ROLLING: 'ROLLING',   // Dodge/roll action
    DEAD: 'DEAD'         // Player defeated
};
