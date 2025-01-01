// Default configurations
export const DEFAULT_ENEMY_CONFIG = {
    speed: 100,
    health: 100,
    damage: 10,
    spawnRate: 1000,
    points: 100
};

export const DEFAULT_TRAP_CONFIG = {
    damage: 20,
    duration: 5000,
    cooldown: 3000,
    cost: 50
};

export const DEFAULT_PROCEDURAL_CONFIG = {
    roomSize: 800,
    corridorWidth: 100,
    minRooms: 5,
    maxRooms: 10,
    enemiesPerRoom: 3
};
