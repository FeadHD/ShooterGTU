// configs.js

/**
 * Default enemy configuration for scene initialization
 * @type {Object.<string, number>}
 */
export const DEFAULT_ENEMY_CONFIG = {
    'Slime': 0,
    'Drone': 0,
    'MeleeWarrior': 0
};

/**
 * Default trap configuration for scene initialization
 * @type {Object.<string, number>}
 */
export const DEFAULT_TRAP_CONFIG = {
    'AlarmTrigger': 0,
    'TrapPrefab': 0
};

/**
 * Default procedural level generation configuration
 * @type {Object}
 */
export const DEFAULT_PROCEDURAL_CONFIG = {
    // Grid dimensions
    gridWidth: 20,
    gridHeight: 12,
    
    // Platform generation parameters
    minPlatformWidth: 3,
    maxPlatformWidth: 8,
    platformDensity: 0.6,  // 0.0 to 1.0
    
    // Gap parameters
    minGapWidth: 3,  // In tiles
    maxGapWidth: 5   // In tiles
};

/**
 * UI style configurations for consistent styling across components
 * @type {Object}
 */
export const UI_STYLES = {
    button: {
        fontSize: '24px',
        fill: '#fff',
        backgroundColor: '#34495e',
        padding: { x: 15, y: 10 },
        hoverColor: '#2980b9'
    },
    
    category: {
        fontSize: '36px',
        fill: '#fff',
        fontFamily: 'Arial'
    },
    
    label: {
        fontSize: '32px',
        fill: '#fff',
        fontFamily: 'Arial'
    },
    
    value: {
        fontSize: '24px',
        fill: '#00ff00',
        fontFamily: 'Arial'
    }
};

/**
 * Game difficulty presets
 * @type {Object}
 */
export const DIFFICULTY_PRESETS = {
    easy: {
        enemyMultiplier: 0.5,
        trapMultiplier: 0.5,
        platformDensity: 0.7,
        minGapWidth: 2
    },
    normal: {
        enemyMultiplier: 1.0,
        trapMultiplier: 1.0,
        platformDensity: 0.6,
        minGapWidth: 3
    },
    hard: {
        enemyMultiplier: 1.5,
        trapMultiplier: 1.5,
        platformDensity: 0.5,
        minGapWidth: 4
    }
};

/**
 * Scene category definitions
 * @type {Object}
 */
export const SCENE_CATEGORIES = {
    'ZUCC TESTING': {
        scenes: ['Matrix640x360'],
        showConfig: true
    },
    'PROCEDURAL SCENE': {
        scenes: ['Matrix640x360'],
        showConfig: false,
        showProcedural: true
    },
    'Levels': {
        scenes: [
            'GameScene1',
            'GameScene2',
            'GameScene3',
            'GameScene4',
            'GameScene5'
        ],
        showConfig: false
    },
    'Menus': {
        scenes: [
            'MainMenu',
            'Credits'
        ],
        showConfig: false
    }
};

/**
 * Audio configuration settings
 * @type {Object}
 */
export const AUDIO_CONFIG = {
    defaultVolume: 0.7,
    fadeInDuration: 1000,
    fadeOutDuration: 500,
    maxSimultaneousSounds: 4
};