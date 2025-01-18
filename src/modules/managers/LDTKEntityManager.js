/**
 * LDTKEntityManager.js
 * Manages game entities defined in LDtk level editor
 * Handles entity creation, tracking, and lifecycle management
 * Provides debug visualization of entity states
 */
export class LDTKEntityManager {
    /**
     * Initialize entity management system
     * @param {Phaser.Scene} scene - Scene to create entities in
     */
    constructor(scene) {
        this.scene = scene;
        this.entityInstances = new Map(); // Track entities by unique ID
        this.entityLayers = new Map();    // Group entities by layer
        this.entityFactories = new Map(); // Store creation functions
        this.loadedEntityPositions = new Set(); // Keep track of loaded entity positions
        this.debug = false;               // Debug visualization
    }

    /**
     * Register entity creation functions
     * Maps entity types to their factory methods
     * @param {Object} factories - Type-to-factory mapping
     */
    registerEntityFactories(factories) {
        Object.entries(factories).forEach(([type, factory]) => {
            this.entityFactories.set(type, factory);
        });
    }

    /**
     * Create all entities in level
     * Called when loading new level section
     * @param {Object} levelData - LDtk level definition
     * @param {number} worldX - Level X offset
     * @param {number} worldY - Level Y offset
     */
    createEntities(levelData, worldX = 0, worldY = 0) {
        const layerInstances = levelData.layerInstances || [];
        
        layerInstances.forEach(layer => {
            if (layer.__type === "Entities") {
                this.processEntityLayer(layer, worldX, worldY);
            }
        });
    }

    /**
     * Process single entity layer
     * Creates and tracks all entities in layer
     * @param {Object} layer - LDtk layer data
     * @param {number} worldX - World offset X
     * @param {number} worldY - World offset Y
     */
    processEntityLayer(layer, worldX, worldY) {
        const layerEntities = new Set();
        this.entityLayers.set(layer.__identifier, layerEntities);

        layer.entityInstances.forEach(entity => {
            const positionKey = `${entity.px[0] + worldX},${entity.px[1] + worldY}`;
            if (!this.loadedEntityPositions.has(positionKey)) {
                const instance = this.createEntityInstance(entity, worldX, worldY);
                if (instance) {
                    this.entityInstances.set(entity.iid, instance);
                    layerEntities.add(instance);
                    this.loadedEntityPositions.add(positionKey);
                }
            } else {
                console.warn(`Entity already exists at position (${positionKey}), skipping creation.`);
            }
        });
    }

    /**
     * Create single game entity
     * Uses registered factory for entity type
     * @param {Object} entityData - LDtk entity definition
     * @param {number} worldX - World position X
     * @param {number} worldY - World position Y
     * @returns {Object} Created entity instance
     */
    createEntityInstance(entityData, worldX, worldY) {
        const factory = this.entityFactories.get(entityData.__identifier);
        if (!factory) {
            console.warn(`No factory registered for entity type: ${entityData.__identifier}`);
            return null;
        }

        // Convert level to world coordinates
        const x = entityData.px[0] + worldX;
        const y = entityData.px[1] + worldY;

        // Extract entity properties
        const fields = this.processEntityFields(entityData.fieldInstances);

        // Instantiate entity
        const entity = factory(this.scene, x, y, fields);
        
        if (this.debug) {
            console.log(`Created entity: ${entityData.__identifier} at (${x}, ${y})`, fields);
            this.updateDebugText();
        }

        return entity;
    }

    /**
     * Process entity custom fields
     * Extracts properties defined in LDtk
     * @param {Array} fieldInstances - LDtk field definitions
     * @returns {Object} Processed field values
     */
    processEntityFields(fieldInstances) {
        const fields = {};
        fieldInstances.forEach(field => {
            fields[field.__identifier] = field.__value;
        });
        return fields;
    }

    /**
     * Get entity by unique ID
     * Used for entity relationships
     * @param {string} iid - LDtk unique identifier
     * @returns {Object} Entity instance
     */
    getEntityById(iid) {
        return this.entityInstances.get(iid);
    }

    /**
     * Get entities in layer
     * Used for layer-specific updates
     * @param {string} layerName - Layer identifier
     * @returns {Set} Layer's entities
     */
    getEntitiesByLayer(layerName) {
        return this.entityLayers.get(layerName) || new Set();
    }

    /**
     * Reset entity tracking
     * Called during level transitions
     */
    cleanup() {
        this.entityInstances.clear();
        this.entityLayers.clear();
    }

    /**
     * Toggle debug visualization
     * Shows entity counts and distribution
     * @param {boolean} enabled - Debug state
     */
    setDebug(enabled) {
        this.debug = enabled;
        if (this.debug) {
            // Create debug overlay
            this.debugText = this.scene.add.text(16, 48, '', {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 5, y: 5 }
            }).setScrollFactor(0).setDepth(1001);
            this.updateDebugText();
        } else if (this.debugText) {
            this.debugText.destroy();
            this.debugText = null;
        }
    }

    /**
     * Update debug statistics
     * Shows current entity counts
     */
    updateDebugText() {
        if (!this.debug || !this.debugText) return;

        // Count entities by type
        const counts = {};
        this.entityInstances.forEach(entity => {
            const type = entity.constructor.name;
            counts[type] = (counts[type] || 0) + 1;
        });

        // Format debug display
        const text = [
            'LDTKEntityManager Debug:',
            `Total Entities: ${this.entityInstances.size}`,
            'Entity Counts:',
            ...Object.entries(counts).map(([type, count]) => `  ${type}: ${count}`),
            'Layers:',
            ...Array.from(this.entityLayers.keys()).map(layer => `  ${layer}: ${this.entityLayers.get(layer).size} entities`)
        ].join('\n');

        this.debugText.setText(text);
    }
}
