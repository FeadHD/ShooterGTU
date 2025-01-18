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
        this.debugText = null;
        
        // Get reference to AssetManager
        this.assetManager = scene.assetManager || {
            getTextureKeyForEntity: () => ({ spritesheet: 'default_sprite', defaultAnim: null }),
            getDefaultTexture: () => 'default_sprite'
        };
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
        const layerEntities = new Set();
        const createdEntities = [];
        this.entityLayers.set(layer.__identifier, layerEntities);

        layer.entityInstances.forEach(entity => {
            const positionKey = `${entity.px[0] + worldX},${entity.px[1] + worldY}`;
            if (!this.loadedEntityPositions.has(positionKey)) {
                const instance = this.createEntityInstance(entity, worldX, worldY);
                if (instance) {
                    this.entityInstances.set(entity.iid, instance);
                    layerEntities.add(instance);
                    this.loadedEntityPositions.add(positionKey);
                    createdEntities.push(instance);
                }
            } else {
                console.warn(`Entity already exists at position (${positionKey}), skipping creation.`);
            }
        });

        return createdEntities;
    }

    /**
     * Create single game entity
     * Uses registered factory for entity type
     * @param {Object} entityData - LDtk entity definition
     * @param {number} worldX - World position X
     * @param {number} worldY - World position Y
     * @returns {Object} Created entity instance
     */
    createEntityInstance(entityData, worldX = 0, worldY = 0) {
        console.log(`Creating entity of type: ${entityData.__identifier} at (${entityData.px[0] + worldX}, ${entityData.px[1] + worldY})`);
    
        try {
            const x = entityData.px[0] + worldX;
            const y = entityData.px[1] + worldY;

            // Special handling for PlayerStart
            if (entityData.__identifier === 'PlayerStart') {
                console.log('Found PlayerStart position:', { x, y });
                // Store the position but don't create an entity
                if (this.scene.createPlayer) {
                    this.scene.createPlayer(x, y);
                } else {
                    console.warn('createPlayer method not found in scene');
                }
                return null;
            }

            // Get texture data from AssetManager
            const textureData = this.assetManager.getTextureKeyForEntity(entityData.__identifier);
            if (!textureData) {
                throw new Error(`No texture data found for entity type: ${entityData.__identifier}`);
            }

            // Create entity sprite
            const spritesheet = this.scene.textures.exists(textureData.spritesheet) 
                ? textureData.spritesheet 
                : 'default_sprite';
                
            const entity = this.scene.add.sprite(x, y, spritesheet);

            // Add physics
            this.scene.physics.add.existing(entity);
            if (entity.body) {
                entity.body.setCollideWorldBounds(true);
                entity.body.setImmovable(true);
            }

            // Play default animation if available
            if (textureData.defaultAnim && this.scene.anims.exists(textureData.defaultAnim)) {
                entity.play(textureData.defaultAnim);
            }

            // Store entity metadata
            entity.type = entityData.__identifier;
            entity.animations = textureData.animations || [];
            entity.properties = this.processEntityFields(entityData.fieldInstances || []);

            // Add entity-specific behavior
            this.setupEntityBehavior(entity);

            console.log(`Successfully created ${entityData.__identifier} entity:`, entity);
            return entity;

        } catch (error) {
            console.error(`Failed to create entity:`, error);
            return this.createFallbackEntity(entityData, worldX, worldY);
        }
    }

    createFallbackEntity(entityData, worldX, worldY) {
        console.warn(`Creating fallback entity for ${entityData.__identifier}`);
        const x = entityData.px[0] + worldX;
        const y = entityData.px[1] + worldY;

        // Create basic sprite with default texture
        const fallbackEntity = this.scene.add.sprite(x, y, 'default_sprite');
        
        // Add basic physics
        this.scene.physics.add.existing(fallbackEntity);
        if (fallbackEntity.body) {
            fallbackEntity.body.setCollideWorldBounds(true);
            fallbackEntity.body.setImmovable(true);
        }

        // Store basic metadata
        fallbackEntity.type = entityData.__identifier;
        fallbackEntity.isFallback = true;

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
