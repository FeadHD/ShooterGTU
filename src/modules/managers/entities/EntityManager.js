/**
 * EntityManager.js
 * Core manager for all game entities, providing tracking, updates, and lifecycle management.
 * Extends BaseManager for dependency injection capabilities.
 */

import { BaseManager } from '../../di/BaseManager';

export class EntityManager extends BaseManager {
    /**
     * Initialize entity management system
     * Sets up entity collections and event bus connection
     */
    constructor(scene) {
        super();
        this.scene = scene;
        this.entities = new Map();  // Type-based entity storage
        this.eventBus = this.container.get('eventBus');
    }

    /**
     * Register a new entity with the manager
     * Groups entities by type and broadcasts addition
     */
    add(entity, type) {
        if (!this.entities.has(type)) {
            this.entities.set(type, new Set());
        }
        this.entities.get(type).add(entity);
        
        // Notify systems of new entity
        this.eventBus.emit('entityAdded', { entity, type });
    }

    /**
     * Remove an entity from management
     * Broadcasts removal for system cleanup
     */
    remove(entity, type) {
        const entities = this.entities.get(type);
        if (entities) {
            entities.delete(entity);
            // Notify systems of removal
            this.eventBus.emit('entityRemoved', { entity, type });
        }
    }

    /**
     * Get all entities of a specific type
     * Converts Set to Array for easier iteration
     */
    getAll(type) {
        return Array.from(this.entities.get(type) || []);
    }

    /**
     * Update all managed entities
     * Calls update() on entities that support it
     */
    update() {
        for (const entities of this.entities.values()) {
            for (const entity of entities) {
                if (entity.update) {
                    entity.update();
                }
            }
        }
    }

    /**
     * Clean up all entities
     * Called during scene transitions or shutdown
     */
    cleanup() {
        for (const entities of this.entities.values()) {
            for (const entity of entities) {
                if (entity.destroy) {
                    entity.destroy();
                }
            }
            entities.clear();
        }
        this.entities.clear();
    }
}
