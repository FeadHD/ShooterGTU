export const GameConfig = {
    // Scene dimensions
    SCENE: {
        INTRO: {
            WIDTH: 900,
            HEIGHT: 400
        },
        MATRIX: {
            WIDTH: 640,
            HEIGHT: 360
        }
    },

    // Player settings
    PLAYER: {
        INITIAL_HP: 100,
        DAMAGE: 25,
        INVULNERABLE_DURATION: 2000,
        GROUND_OFFSET: 16,
        SPAWN_OFFSET_X: 0.1,
        MOVEMENT_SPEED: 300,
        HOVER_FORCE: -100
    },

    // Enemy settings
    ENEMIES: {
        TOTAL_DEFAULT: 7,
        MELEE_WARRIOR: {
            HEALTH: 100,
            DAMAGE: 25,
            SPEED: 150,
            PATROL_SPEED: 100
        },
        SLIME: {
            HEALTH: 50,
            DAMAGE: 15,
            SPEED: 100
        },
        DRONE: {
            HEALTH: 75,
            DAMAGE: 20,
            SPEED: 200,
            HOVER_HEIGHT: 150
        },
        BOSS: {
            GROUND_OFFSET: 92,
            HEALTH: 500,
            DAMAGE: 50
        }
    },

    // Trap settings
    TRAPS: {
        DAMAGE: 5,
        PARTICLES: {
            SPEED: {
                MIN: 20,
                MAX: 50
            }
        }
    },

    // Projectile settings
    PROJECTILES: {
        BULLET: {
            SPEED: 600,
            DAMAGE: 25
        },
        LASER: {
            BASE_SPEED: 400,
            SPEED_VARIATION: 25
        }
    },

    // World settings
    WORLD: {
        GROUND_OFFSET: 64,
        GRAVITY: 300
    },

    // Sprite dimensions
    SPRITES: {
        CHARACTER: {
            WIDTH: 24,
            HEIGHT: 24
        }
    },

    // UI settings
    UI: {
        DEFAULT_LIVES: 3,
        INITIAL_SCORE: 0,
        INITIAL_COINS: 0,
        HEALTH_BAR: {
            WIDTH_MULTIPLIER: 1.5,
            HEIGHT_RATIO: 0.08,
            MIN_HEIGHT: 6,
            OFFSET_MULTIPLIER: 2
        }
    },

    // Antivirus wall configuration
    ANTIVIRUS_WALL: {
        WIDTH: 32,
        START_OFFSET: -64, // Start 2 tiles outside the map
        SPEED: 80,
        RESPAWN_DELAY: 5000, // milliseconds
        FLASH_DURATION: 500 // milliseconds for warning flash
    }
};

// Helper functions
export const getGroundTop = (height) => height - GameConfig.WORLD.GROUND_OFFSET;
export const getSpawnHeight = (groundTop) => groundTop - GameConfig.PLAYER.GROUND_OFFSET;
export const getHealthBarDimensions = (displayWidth, displayHeight) => ({
    width: displayWidth * GameConfig.UI.HEALTH_BAR.WIDTH_MULTIPLIER,
    height: Math.max(GameConfig.UI.HEALTH_BAR.MIN_HEIGHT, Math.floor(displayHeight * GameConfig.UI.HEALTH_BAR.HEIGHT_RATIO)),
    yOffset: displayHeight / 2 + Math.max(GameConfig.UI.HEALTH_BAR.MIN_HEIGHT, Math.floor(displayHeight * GameConfig.UI.HEALTH_BAR.HEIGHT_RATIO)) * GameConfig.UI.HEALTH_BAR.OFFSET_MULTIPLIER
});
