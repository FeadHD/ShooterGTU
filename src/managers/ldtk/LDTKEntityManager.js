/**
 * Manages LDTK entity creation and management in the game
 * Handles entity instantiation, positioning, and layer organization
 * Integrates with Phaser's scene and physics systems
 */
export class LDTKEntityManager {
    /**
     * Creates a new LDTKEntityManager instance
     * @param {Phaser.Scene} scene - The Phaser scene this manager belongs to
     */
    constructor(scene) {
        this.scene = scene;
        this.assetManager = scene.assetManager;
        // Track entity instances and their organization
        this.entityInstances = new Map();  // Maps entity IDs to instances
        this.entityLayers = new Map();     // Maps layer names to entity sets
        this.entityFactories = new Map();  // Maps entity types to factory functions
        this.loadedEntityPositions = new Set(); // Tracks occupied positions
        this.debug = false;
        this.debugText = null;

        // Get reference to AssetManager for texture loading
        this.assetManager = scene.assetManager || {
            getTextureKeyForEntity: () => ({ spritesheet: 'default_sprite', defaultAnim: null }),
            getDefaultTexture: () => 'default_sprite',
        };

        if (!this.assetManager) {
            console.error('AssetManager is not linked to LDTKEntityManager.');
        } else {
            console.log('AssetManager linked successfully:', this.assetManager);
        }
    }

    /**
     * Registers entity factory functions for different entity types
     * @param {Object} factories - Map of entity types to their factory functions
     */
    registerEntityFactories(factories) {
        console.log('Registering entity factories:', Object.keys(factories));
        Object.entries(factories).forEach(([type, factory]) => {
            this.entityFactories.set(type, factory);
            console.log(`Factory registered for type: ${type}`);
        });
    }

    /**
     * Creates a single entity instance from LDTK entity data
     * @param {Object} entityData - LDTK entity data
     * @param {number} worldX - World X offset
     * @param {number} worldY - World Y offset
     * @returns {Phaser.GameObjects.GameObject} The created entity instance
     */
    createEntityInstance(entityData, worldX = 0, worldY = 0) {
        const factory = this.entityFactories.get(entityData.__identifier);
        if (!factory) {
            console.warn(`No factory found for entity type: ${entityData.__identifier}`);
            return this.createFallbackEntity(entityData, worldX, worldY);
        }
    
        const x = entityData.px[0] + worldX;
        const y = entityData.px[1] + worldY;
        const fields = entityData.fieldInstances || [];
    
        console.log(`Creating entity of type ${entityData.__identifier} at (${x}, ${y})`);
    
        const instance = factory(this.scene, x, y, fields);
    
        // Add entities to appropriate Phaser groups based on type
        if (entityData.__identifier === 'Zapper' || entityData.__identifier === 'Enemy') {
            if (this.scene.enemies) {
                this.scene.enemies.add(instance);
                console.log(`Added ${entityData.__identifier} to enemies group`);
            }
        } else if (entityData.__identifier === 'NeutralObject') {
            if (this.scene.neutralEntities) {
                this.scene.neutralEntities.add(instance);
                console.log(`Added ${entityData.__identifier} to neutralEntities group`);
            }
        } else if (entityData.__identifier === 'InteractiveObject') {
            if (this.scene.interactiveEntities) {
                this.scene.interactiveEntities.add(instance);
                console.log(`Added ${entityData.__identifier} to interactiveEntities group`);
            }
        }
    
        return instance;
    }

    /**
     * Creates all entities from a level's data
     * @param {Object} levelData - LDTK level data
     * @param {number} worldX - World X offset
     * @param {number} worldY - World Y offset
     * @returns {Array} Array of created entity instances
     */
    createEntities(levelData, worldX = 0, worldY = 0) {
        console.log('Creating entities for level data:', levelData);
      
        const layerInstances = levelData.layerInstances || [];
        const createdEntities = [];
      
        layerInstances.forEach(layer => {
            if (layer.__type === "Entities") {
                console.log(`Processing layer: ${layer.__identifier}`);
          
                // Ensure processing only valid entities in the layer
                if (layer.entityInstances) {
                    layer.entityInstances.forEach(entityData => {
                        const entity = this.createEntityInstance(entityData, worldX, worldY);
                        if (entity) {
                            createdEntities.push(entity);
                        }
                    });
                } else {
                    console.warn(`No entities found in layer ${layer.__identifier}`);
                }
            }
        });
      
        console.log('Total entities created:', createdEntities.length);
        return createdEntities;
    }
    
    /**
     * Processes a single entity layer, creating and tracking its entities
     * @param {Object} layer - LDTK layer data
     * @param {number} worldX - World X offset
     * @param {number} worldY - World Y offset
     * @returns {Array} Array of created entity instances
     */
    processEntityLayer(layer, worldX, worldY) {
        console.log('Processing entity layer:', layer.__identifier);
        console.log('Number of entities in layer:', layer.entityInstances.length);
        console.log('Entities in layer:', layer.entityInstances.map(e => e.__identifier));

        const layerEntities = new Set();
        const createdEntities = [];
        this.entityLayers.set(layer.__identifier, layerEntities);

        layer.entityInstances.forEach(entity => {
            const positionKey = this.getPositionKey(entity, worldX, worldY);

            if (this.loadedEntityPositions.has(positionKey)) {
                console.warn(`Entity already exists at position (${positionKey}), skipping creation.`);
                return;
            }

            // Log entity creation attempt
            console.log('Attempting to create entity:', {
                identifier: entity.__identifier,
                positionKey,
                worldPosition: { x: entity.px[0] + worldX, y: entity.px[1] + worldY },
            });

            const instance = this.tryCreateEntity(entity, worldX, worldY);
            if (instance) {
                this.registerEntity(instance, entity, layerEntities, positionKey, createdEntities);
            } else {
                console.warn('Entity creation failed for:', entity.__identifier);
            }
        });

        console.log('Layer processing complete for:', layer.__identifier);
        console.log('Total created entities in this layer:', createdEntities.length);

        return createdEntities;
    }

    /**
     * Generates a unique key for an entity's position
     * @private
     */
    getPositionKey(entity, worldX, worldY) {
        // Log position key generation
        const key = `${entity.px[0] + worldX},${entity.px[1] + worldY}`;
        console.log('Generated position key:', key);
        return key;
    }

    /**
     * Attempts to create an entity, with error handling
     * @private
     */
    tryCreateEntity(entity, worldX, worldY) {
        try {
            console.log('Creating entity with data:', {
                identifier: entity.__identifier,
                position: { x: entity.px[0], y: entity.px[1] },
                worldPosition: { x: entity.px[0] + worldX, y: entity.px[1] + worldY },
            });

            const instance = this.createEntityInstance(entity, worldX, worldY);
            console.log('Entity instance created:', {
                identifier: entity.__identifier,
                instance,
            });

            return instance;
        } catch (error) {
            console.error(`Error creating entity (${entity.__identifier}):`, error);
            return null;
        }
    }

    /**
     * Registers a created entity in the tracking systems
     * @private
     */
    registerEntity(instance, entity, layerEntities, positionKey, createdEntities) {
        console.log('Registering entity:', {
            identifier: entity.__identifier,
            positionKey,
            instance,
        });

        this.entityInstances.set(entity.iid, instance);
        layerEntities.add(instance);
        this.loadedEntityPositions.add(positionKey);
        createdEntities.push(instance);
    }

    /**
     * Creates a basic fallback sprite when no factory exists
     * @private
     */
    createFallbackEntity(entityData, worldX, worldY) {
        console.warn(`Creating fallback entity for ${entityData.__identifier}`);
        const x = entityData.px[0] + worldX;
        const y = entityData.px[1] + worldY;
    
        const fallbackEntity = this.scene.add.sprite(x, y, 'default_sprite');
        this.scene.physics.add.existing(fallbackEntity);
        return fallbackEntity;
    }

    /**
     * Retrieves the player start coordinates from the level data
     * @param {object} levelData - The level data object
     * @param {number} worldX - World X offset
     * @param {number} worldY - World Y offset
     * @returns {object} The player start coordinates as an object with 'x' and 'y' properties
     */
    getPlayerStart(levelData, worldX = 0, worldY = 0) {
        console.log('Getting PlayerStart from level data:', levelData);
        
        // Handle both direct layerInstances and nested levels structure
        const layerInstances = levelData.layerInstances || 
                              (levelData.levels?.[0]?.layerInstances) || 
                              [];
        
        console.log('Layer instances:', layerInstances);
        
        for (const layer of layerInstances) {
            console.log('Checking layer:', {
                identifier: layer.__identifier,
                type: layer.__type,
                entityCount: layer.entityInstances?.length
            });
            
            if (layer.__type === "Entities") {
                // Then find the entity named "PlayerStart"
                const playerStartEntity = layer.entityInstances?.find(
                  e => e.__identifier === "PlayerStart"
                );
              
                console.log('PlayerStart entity found:', playerStartEntity);
              
                if (playerStartEntity) {
                  const spawn = {
                    x: playerStartEntity.px[0],
                    y: playerStartEntity.px[1]
                  };
                  console.log('Found PlayerStart:', spawn);
                  return spawn;
                }
              }
            }
        }
    }