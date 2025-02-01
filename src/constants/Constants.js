/**
 * Constants.js
 * Defines default configurations for game entities.
 * These values serve as fallbacks when specific configurations are not provided.
 */

/**
 * DEFAULT ENEMY CONFIGURATION
 * Base settings for enemy entities if not overridden by specific enemy types
 */
export const DEFAULT_ENEMY_CONFIG = {
    speed: 100,      // Base movement speed in pixels/second
    health: 100,     // Starting health points
    damage: 10,      // Damage dealt to player on contact
    spawnRate: 1000, // Milliseconds between spawns
    points: 100      // Score awarded when defeated
};

/**
 * DEFAULT TRAP CONFIGURATION
 * Base settings for trap objects in the game environment
 */
export const DEFAULT_TRAP_CONFIG = {
    damage: 20,      // Damage dealt to entities
    duration: 5000,  // How long trap remains active (ms)
    cooldown: 3000,  // Time before trap can be triggered again (ms)
    cost: 50         // Resource cost to place trap
};
