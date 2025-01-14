/**
 * Manages the loading and initialization of entities from LDtk level data.
 * Works in conjunction with LevelLoader and LDTKTileManager to handle entity-specific aspects.
 */
export class LDTKEntityManager {
    constructor(scene) {
        this.scene = scene;
        this.entityInstances = new Map(); // Store entity instances by their LDtk IID
        this.entityLayers = new Map();    // Store entities by layer name
        this.entityFactories = new Map(); // Store entity creation functions by entity type
        this.debug = false;               // Debug flag
    }

    /**
     * Initialize entity factories for different entity types
     * @param {Object} factories - Map of entity types to their factory functions
     */
    registerEntityFactories(factories) {
        Object.entries(factories).forEach(([type, factory]) => {
            this.entityFactories.set(type, factory);
        });
    }

    /**
     * Process and create entities from LDtk level data
     * @param {Object} levelData - The LDtk level data
     * @param {number} worldX - World X offset for the level
     * @param {number} worldY - World Y offset for the level
     */
    createEntities(levelData, worldX = 0, worldY = 0) {
        const layerInstances = levelData.layerInstances || [];
        
        // Process each layer that contains entities
        layerInstances.forEach(layer => {
            if (layer.__type === "Entities") {
                this.processEntityLayer(layer, worldX, worldY);
            }
        });
    }

    /**
     * Process a single entity layer
     * @param {Object} layer - The entity layer data from LDtk
     * @param {number} worldX - World X offset
     * @param {number} worldY - World Y offset
     */
    processEntityLayer(layer, worldX, worldY) {
        const layerEntities = new Set();
        this.entityLayers.set(layer.__identifier, layerEntities);

        layer.entityInstances.forEach(entity => {
            const instance = this.createEntityInstance(entity, worldX, worldY);
            if (instance) {
                this.entityInstances.set(entity.iid, instance);
                layerEntities.add(instance);
            }
        });
    }

    /**
     * Create a single entity instance
     * @param {Object} entityData - The entity data from LDtk
     * @param {number} worldX - World X offset
     * @param {number} worldY - World Y offset
     * @returns {Object} The created entity instance
     */
    createEntityInstance(entityData, worldX, worldY) {
        const factory = this.entityFactories.get(entityData.__identifier);
        if (!factory) {
            console.warn(`No factory registered for entity type: ${entityData.__identifier}`);
            return null;
        }

        // Calculate world position
        const x = entityData.px[0] + worldX;
        const y = entityData.px[1] + worldY;

        // Process entity fields
        const fields = this.processEntityFields(entityData.fieldInstances);

        // Create the entity using the factory
        const entity = factory(this.scene, x, y, fields);
        
        if (this.debug) {
            console.log(`Created entity: ${entityData.__identifier} at (${x}, ${y})`, fields);
            this.updateDebugText();
        }

        return entity;
    }

    /**
     * Process entity fields from LDtk
     * @param {Array} fieldInstances - Array of field instances from LDtk
     * @returns {Object} Processed fields
     */
    processEntityFields(fieldInstances) {
        const fields = {};
        fieldInstances.forEach(field => {
            fields[field.__identifier] = field.__value;
        });
        return fields;
    }

    /**
     * Get an entity instance by its LDtk IID
     * @param {string} iid - The entity's LDtk IID
     * @returns {Object} The entity instance
     */
    getEntityById(iid) {
        return this.entityInstances.get(iid);
    }

    /**
     * Get all entities in a specific layer
     * @param {string} layerName - The name of the layer
     * @returns {Set} Set of entities in the layer
     */
    getEntitiesByLayer(layerName) {
        return this.entityLayers.get(layerName) || new Set();
    }

    /**
     * Clean up entities when transitioning levels or scenes
     */
    cleanup() {
        this.entityInstances.clear();
        this.entityLayers.clear();
    }

    /**
     * Enable or disable debug mode
     * @param {boolean} enabled - Whether to enable debug mode
     */
    setDebug(enabled) {
        this.debug = enabled;
        if (this.debug) {
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
     * Update debug text with current entity counts
     */
    updateDebugText() {
        if (!this.debug || !this.debugText) return;

        const counts = {};
        this.entityInstances.forEach(entity => {
            const type = entity.constructor.name;
            counts[type] = (counts[type] || 0) + 1;
        });

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
