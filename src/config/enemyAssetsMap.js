/**
 * enemyAssetsMap.js
 * Configuration file for all enemy sprite assets and animations in the game.
 * 
 * This file defines the mapping between enemy types and their associated sprite assets.
 * Each enemy type has a list of actions that correspond to specific sprite files.
 * 
 * File Structure:
 * - Assets should be placed in: assets/enemys/{enemy_type}/{enemy_type}_{action}.png
 * - All sprites should use 32x32 pixel dimensions
 * 
 * Usage:
 * {
 *   enemy_type: ['action1', 'action2', ...],
 * }
 * 
 * Standard Actions:
 * - idle: Default state
 * - walk: Movement animation
 * - attack: Combat animation
 * - death: Defeat animation
 * - wake: Activation animation
 * - shock: Special effects
 * 
 * Example:
 * {
 *   zapper: ['idle', 'walk', 'attack', 'death', 'wake', 'shock']
 * }
 * 
 * Note:
 * - All sprite files must follow the naming convention: {enemy_type}_{action}.png
 * - Animation keys will be generated as: {enemy_type}_{action}
 * - Add new enemy types by creating a new key with an array of supported actions
 */

export const enemyAssets = {
    melee_warrior: [
        'idle',
        'attack1',
        'attack2',
        'attack3',
        'run',
        'hurt',
        'defend',
        'jump',
        'walk',
        'death'
    ],
    drone: [
        'idle'
    ],
    zapper: [
        'idle',
        'hit',
        'walk',
        'attack',
        'shock',
        'death',
        'wake'
    ],
    slime: [
        'idle',
        'jump',
        'death'
    ]
};
