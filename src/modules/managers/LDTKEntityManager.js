export class LDTKEntityManager {
    constructor(scene) {
        this.scene = scene;
        this.assetManager = scene.assetManager;
        this.entityInstances = new Map();
        this.entityLayers = new Map();
        this.entityFactories = new Map();
        this.loadedEntityPositions = new Set();
        this.debug = false;
        this.debugText = null;

        // Log initialization
        console.log('LDTKEntityManager initialized with scene:', scene);

        // Get reference to AssetManager
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

    registerEntityFactories(factories) {
        console.log('Registering entity factories:', Object.keys(factories));
        Object.entries(factories).forEach(([type, factory]) => {
            this.entityFactories.set(type, factory);
            console.log(`Factory registered for type: ${type}`);
        });
    }

    createEntities(levelData, worldX = 0, worldY = 0) {
        // Log start of entity creation
        console.log('Creating entities for level data:', levelData);

        const layerInstances = levelData.layerInstances || [];
        const createdEntities = [];

        layerInstances.forEach(layer => {
            if (layer.__type === "Entities") {
                console.log(`Processing layer: ${layer.__identifier}`); // Log layer being processed
                const layerEntities = this.processEntityLayer(layer, worldX, worldY);
                createdEntities.push(...layerEntities);
            }
        });

        // Log total created entities
        console.log('Total entities created:', createdEntities.length);
        return createdEntities;
    }

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

    getPositionKey(entity, worldX, worldY) {
        // Log position key generation
        const key = `${entity.px[0] + worldX},${entity.px[1] + worldY}`;
        console.log('Generated position key:', key);
        return key;
    }

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

    createEntityInstance(entityData, worldX = 0, worldY = 0) {
        console.log('Processing entity with identifier:', entityData.__identifier);
    
        const factory = this.entityFactories.get(entityData.__identifier);
        if (!factory) {
            console.warn(`No factory found for entity type: ${entityData.__identifier}`);
            return this.createFallbackEntity(entityData, worldX, worldY);
        }
    
        console.log(`Factory found for type: ${entityData.__identifier}`);
        const x = entityData.px[0] + worldX;
        const y = entityData.px[1] + worldY;
        const fields = entityData.fieldInstances || [];
        const instance = factory(this.scene, x, y, fields);
        console.log(`Factory created instance for type: ${entityData.__identifier}`, instance);
    
        return instance;
    }
    

    createFallbackEntity(entityData, worldX, worldY) {
        console.warn(`Creating fallback entity for ${entityData.__identifier}`);
        const x = entityData.px[0] + worldX;
        const y = entityData.px[1] + worldY;
    
        const fallbackEntity = this.scene.add.sprite(x, y, 'default_sprite');
        this.scene.physics.add.existing(fallbackEntity);
        return fallbackEntity;
    }
}
