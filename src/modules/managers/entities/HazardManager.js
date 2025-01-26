/**
 * HazardManager.js
 * Manages hazardous game elements including traps, spikes, and alarm triggers.
 * Handles damage application, collision detection, and spawn point management.
 */

import { GameEvents } from '../../managers/EventManager';
import { EntityManager } from './EntityManager';
import { GameConfig } from '../../../config/GameConfig';
import { AlarmTrigger } from '../../../prefabs/AlarmTrigger';
import { Trap } from '../../../prefabs/Trap';

/**
 * HazardManager
 * -------------
 * Manages all hazardous objects: standard hazards (spikes, lasers, etc.) 
 * plus traps and alarm triggers (formerly TrapManager).
 */
export class HazardManager extends EntityManager {
    /**
     * Initialize hazard management system and physics groups
     * @param {Phaser.Scene} scene - The game scene this manager belongs to
     */
    constructor(scene) {
        super(scene);

        // Map for tracking when each hazard last dealt damage
        this.lastDamageTime = new Map();  // Tracks damage cooldowns

        // Groups for traps and alarm triggers (merged from TrapManager)
        this.alarmTriggers = scene.physics.add.staticGroup({
            classType: AlarmTrigger,
            runChildUpdate: true
        });
        this.traps = scene.physics.add.group();
    }

    /**
     * Add a hazard and setup player collision
     * Used for standard hazards like spikes and lasers
     */
    addHazard(hazard, type) {
        super.add(hazard, type);

        // If the hazard has a sprite, set collision overlap with the player
        if (hazard.sprite) {
            this.scene.physics.add.overlap(
                this.scene.player,
                hazard.sprite,
                () => this.handlePlayerCollision(hazard),
                null,
                this
            );
        }
    }

    /**
     * Process player collision with hazard
     * Applies damage with invulnerability cooldown
     */
    handlePlayerCollision(hazard) {
        const now = Date.now();
        const lastDamage = this.lastDamageTime.get(hazard) || 0;

        // Check damage cooldown
        if (now - lastDamage >= GameConfig.PLAYER.INVULNERABLE_DURATION) {
            const damage = hazard.damageAmount || GameConfig.TRAPS.DAMAGE;
            this.scene.player.takeDamage(damage);

            // Record the time we dealt damage
            this.lastDamageTime.set(hazard, now);

            // Emit an event if you have an event bus
            this.eventManager.emit(GameEvents.HAZARD_COLLISION, {
                hazard,
                damage
            });
        }
    }

    /**
     * Find valid spawn points for hazards
     * Checks grid cells avoiding platform collisions
     */
    findSpawnPoints() {
        const points = [];
        const tileSize = 32;
        const margin = tileSize * 2;

        for (let x = margin; x < this.scene.ROOM_WIDTH - margin; x += tileSize) {
            for (let y = margin; y < this.scene.ROOM_HEIGHT - margin; y += tileSize) {
                // Check if point is overlapping a platform
                const hasCollision = this.scene.platforms.getChildren().some(platform => {
                    return Math.abs(platform.x - x) < tileSize &&
                           Math.abs(platform.y - y) < tileSize;
                });

                if (!hasCollision) {
                    points.push({ x, y });
                }
            }
        }
        return points;
    }

    /**
     * Create traps and alarm triggers at valid spawn points
     * Randomizes placement and handles quantity configuration
     */
    createTraps(config) {
        const spawnPoints = this.findSpawnPoints();
        if (spawnPoints.length === 0) return;

        // Randomize order
        Phaser.Utils.Array.Shuffle(spawnPoints);

        // Create alarm triggers
        const numAlarms = config.AlarmTrigger || 0;
        for (let i = 0; i < Math.min(numAlarms, spawnPoints.length); i++) {
            const point = spawnPoints[i];
            const alarm = this.alarmTriggers.create(point.x, point.y, null, false);
            alarm.setSize(32, 32);
            console.log('Created alarm at', point.x, point.y);
        }

        // Create traps with remaining points
        const remainingPoints = spawnPoints.slice(numAlarms);
        const numTraps = config.TrapPrefab || 0;

        for (let i = 0; i < Math.min(numTraps, remainingPoints.length); i++) {
            const point = remainingPoints[i];
            const trap = new Trap(this.scene, point.x, point.y);
            this.traps.add(trap);
            console.log('Created trap at', point.x, point.y);
        }
    }

    /**
     * Setup collision detection between player and alarm triggers
     */
    setupCollisions(player) {
        this.scene.physics.add.overlap(
            player,
            this.alarmTriggers,
            (p, alarmTrigger) => alarmTrigger.triggerAlarm()
        );
    }

    /**
     * Clean up all hazards and reset state
     * Called during scene transitions or shutdown
     */
    cleanup() {
        super.cleanup();
        this.lastDamageTime.clear();

        // Clear traps and alarm triggers
        if (this.alarmTriggers) {
            this.alarmTriggers.clear(true, true);
        }
        if (this.traps) {
            this.traps.clear(true, true);
        }
    }
}
