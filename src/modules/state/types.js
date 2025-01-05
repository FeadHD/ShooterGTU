// State action types
export const ActionTypes = {
    // Game state
    UPDATE_SCORE: 'UPDATE_SCORE',
    UPDATE_LIVES: 'UPDATE_LIVES',
    UPDATE_HEALTH: 'UPDATE_HEALTH',
    UPDATE_BITCOINS: 'UPDATE_BITCOINS',
    UPDATE_STAMINA: 'UPDATE_STAMINA',
    
    // Game progress
    UPDATE_LEVEL: 'UPDATE_LEVEL',
    UPDATE_CHECKPOINT: 'UPDATE_CHECKPOINT',
    
    // Settings
    UPDATE_SETTINGS: 'UPDATE_SETTINGS',
    
    // Player state
    UPDATE_PLAYER_STATE: 'UPDATE_PLAYER_STATE',
    
    // Game status
    UPDATE_GAME_STATUS: 'UPDATE_GAME_STATUS'
};

// Game status states
export const GameStatus = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
};

// Player states
export const PlayerState = {
    IDLE: 'IDLE',
    WALKING: 'WALKING',
    JUMPING: 'JUMPING',
    FALLING: 'FALLING',
    ROLLING: 'ROLLING',
    DEAD: 'DEAD'
};
