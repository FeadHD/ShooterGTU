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
        this.assetManager = scene.assetManager;
        this.entityInstances = new Map(); // Track entities by unique ID
        this.entityLayers = new Map();    // Group entities by layer
        this.entityFactories = new Map(); // Store creation functions
        this.loadedEntityPositions = new Set(); // Keep track of loaded entity positions
        this.debug = false;               // Debug visualization
        this.debugText = null;
        
        // Get reference to AssetManager
        this.assetManager = scene.assetManager || {
            getTextureKeyForEntity: () => ({ spritesheet: 'default_sprite', defaultAnim: null }),
            getDefaultTexture: () => 'default_sprite'
        };

        // Check if AssetManager is available
        if (!this.assetManager) {
            console.error('AssetManager is not linked to LDTKEntityManager.');
        }
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
     * @returns {Array} Array of created entity instances
     */
    createEntities(levelData, worldX = 0, worldY = 0) {
        const layerInstances = levelData.layerInstances || [];
        const createdEntities = [];
        
        layerInstances.forEach(layer => {
            if (layer.__type === "Entities") {
                const layerEntities = this.processEntityLayer(layer, worldX, worldY);
                createdEntities.push(...layerEntities);
            }
        });

        return createdEntities;
    }

    /**
     * Process single entity layer
     * Creates and tracks all entities in layer
     * @param {Object} layer - LDtk layer data
     * @param {number} worldX - World offset X
     * @param {number} worldY - World offset Y
     * @returns {Array} Array of created entity instances
     */
    processEntityLayer(layer, worldX, worldY) {
        console.log('Processing entity layer:', layer.__identifier);
        console.log('Number of entities in layer:', layer.entityInstances.length);
    
        const layerEntities = new Set();
        const createdEntities = [];
        this.entityLayers.set(layer.__identifier, layerEntities);
    
        // Process each entity in the layer
        layer.entityInstances.forEach(entity => {
            const positionKey = this.getPositionKey(entity, worldX, worldY);
    
            // Ensure the entity position is unique before creating it
            if (!this.loadedEntityPositions.has(positionKey)) {
                console.log('Creating new entity at position:', positionKey);
    
                const instance = this.tryCreateEntity(entity, worldX, worldY, positionKey);
                if (instance) {
                    this.registerEntity(instance, entity, layerEntities, positionKey, createdEntities);
                } else {
                    console.warn('Entity creation failed for:', entity.__identifier);
                }
            } else {
                console.warn(`Entity already exists at position (${positionKey}), skipping creation.`);
            }
        });
    
        console.log('Layer processing complete for:', layer.__identifier);
        console.log('Total created entities in this layer:', createdEntities.length);
    
        return createdEntities;
    }

    getPositionKey(entity, worldX, worldY) {
        return `${entity.px[0] + worldX},${entity.px[1] + worldY}`;
    }

    /**
     * Try to create an entity instance
     * @param {Object} entity - LDtk entity definition
     * @param {number} worldX - World position X
     * @param {number} worldY - World position Y
     * @param {string} positionKey - Unique position identifier
     * @returns {Object} Created entity instance
     */
    tryCreateEntity(entity, worldX, worldY, positionKey) {
        console.log('Processing entity:', {
            identifier: entity.__identifier,
            position: { x: entity.px[0], y: entity.px[1] },
            worldPosition: { x: entity.px[0] + worldX, y: entity.px[1] + worldY },
            fields: entity.fieldInstances || []
        });
    
        try {
            const instance = this.createEntityInstance(entity, worldX, worldY);
            return instance;
        } catch (error) {
            console.error(`Error creating entity at position (${positionKey}):`, error);
            return null;
        }
    }

    /**
     * Register created entity instance
     * @param {Object} instance - Entity instance
     * @param {Object} entity - LDtk entity definition
     * @param {Set} layerEntities - Set of entities in the layer
     * @param {string} positionKey - Unique position identifier
     * @param {Array} createdEntities - Array of created entities
     */
    registerEntity(instance, entity, layerEntities, positionKey, createdEntities) {
        console.log('Entity created successfully:', {
            type: instance.type,
            position: { x: instance.x, y: instance.y }
        });
    
        this.entityInstances.set(entity.iid, instance);
        layerEntities.add(instance);
        this.loadedEntityPositions.add(positionKey);
        createdEntities.push(instance);
    }

    /**
     * Create single game entity
     * Uses registered factory for entity type
     * @param {Object} entityData - LDtk entity definition
     * @param {number} worldX - World position X
     * @param {number} worldY - World position Y
     * @returns {Object} Created entity instance
     */
    createEntityInstance(entityData, worldX = 0, worldY = 0, retryCount = 0) {
        const MAX_RETRIES = 5;
        const RETRY_DELAY = 100;
    
        console.log('Creating entity with data:', {
            identifier: entityData.__identifier,
            position: { x: entityData.px[0], y: entityData.px[1] },
            worldPosition: { x: entityData.px[0] + worldX, y: entityData.px[1] + worldY }
        });
    
        // Normalize the identifier
        const normalizedIdentifier = entityData.__identifier.toLowerCase();
        console.log('Normalized identifier:', normalizedIdentifier);
    
        // Call AssetManager to retrieve texture data
        const textureData = this.assetManager.getTextureKeyForEntity(normalizedIdentifier);
        console.log('Texture data retrieved from AssetManager:', textureData);
    
        // Check if the texture exists in Phaser
        if (!this.scene.textures.exists(textureData.spritesheet)) {
            if (retryCount < MAX_RETRIES) {
                console.warn(`Texture ${textureData.spritesheet} not registered. Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
                setTimeout(() => {
                    this.createEntityInstance(entityData, worldX, worldY, retryCount + 1);
                }, RETRY_DELAY);
                return null;
            } else {
                console.error(`Failed to create entity after ${MAX_RETRIES} retries: ${normalizedIdentifier}`);
                return null;
            }
        }
    
        // Use the spritesheet to create the entity
        const spritesheet = textureData.spritesheet;
        const x = entityData.px[0] + worldX;
        const y = entityData.px[1] + worldY;
    
        const entity = this.scene.add.sprite(x, y, spritesheet);
        console.log('Entity created with texture:', {
            identifier: normalizedIdentifier,
            texture: spritesheet,
            position: { x, y }
        });
    
        return entity;
    }
    

    normalizeIdentifier(identifier) {
        // Normalize by converting to lowercase
        return identifier.toLowerCase();
    }
    
    createFallbackEntity(entityData, worldX, worldY) {
        console.warn(`Creating fallback entity for ${entityData.__identifier}`);
        console.log('Fallback details:', {
            entityIdentifier: entityData.__identifier,
            worldPosition: { x: entityData.px[0] + worldX, y: entityData.px[1] + worldY },
            fieldInstances: entityData.fieldInstances || null,
            worldOffsets: { worldX, worldY }
        });
    
        const x = entityData.px[0] + worldX;
        const y = entityData.px[1] + worldY;
    
        const fallbackEntity = this.scene.add.sprite(x, y, 'default_sprite');
        console.log('Created fallback entity sprite:', fallbackEntity);
    
        // Add basic physics
        this.scene.physics.add.existing(fallbackEntity);
        if (fallbackEntity.body) {
            fallbackEntity.body.setCollideWorldBounds(true);
            fallbackEntity.body.setImmovable(true);
        } else {
            console.warn('Fallback entity does not have a physics body.');
        }
    
        fallbackEntity.type = entityData.__identifier;
        fallbackEntity.isFallback = true;
    
        console.log('Final fallback entity created:', fallbackEntity);
        return fallbackEntity;
    }
    
    

    setupEntityBehavior(entity) {
        switch (entity.type) {
            case 'Zapper':
                // Add Zapper-specific behavior
                entity.attack = function() {
                    if (this.animations.includes('zapper_attack')) {
                        this.play('zapper_attack').once('animationcomplete', () => {
                            this.play('zapper_idle');
                        });
                    }
                };
                break;
            // Add more entity types as needed
        }
    }

    processEntityFields(fieldInstances) {
        const properties = {};
        if (Array.isArray(fieldInstances)) {
            fieldInstances.forEach(field => {
                if (field && field.__identifier) {
                    properties[field.__identifier] = field.__value;
                }
            });
        }
        return properties;
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
