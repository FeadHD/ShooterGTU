import { BaseManager } from '../../di/BaseManager';

export class EntityManager extends BaseManager {
    constructor(scene) {
        super();
        this.scene = scene;
        this.entities = new Map();
        this.eventBus = this.container.get('eventBus');
    }

    add(entity, type) {
        if (!this.entities.has(type)) {
            this.entities.set(type, new Set());
        }
        this.entities.get(type).add(entity);
        
        // Emit entity added event
        this.eventBus.emit('entityAdded', { entity, type });
    }

    remove(entity, type) {
        const entities = this.entities.get(type);
        if (entities) {
            entities.delete(entity);
            // Emit entity removed event
            this.eventBus.emit('entityRemoved', { entity, type });
        }
    }

    getAll(type) {
        return Array.from(this.entities.get(type) || []);
    }

    update() {
        // Update all entities
        for (const entities of this.entities.values()) {
            for (const entity of entities) {
                if (entity.update) {
                    entity.update();
                }
            }
        }
    }

    cleanup() {
        // Cleanup all entities
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
