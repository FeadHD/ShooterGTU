import { BaseScene } from '../elements/BaseScene';
import { GameConfig } from '../../config/GameConfig';
import { Player } from '../../prefabs/Player';
import { ManagerFactory } from '../../modules/di/ManagerFactory';
import { AssetManager } from '../../modules/managers/AssetManager';
import { Zapper } from '../../prefabs/enemies/Zapper';

export class WayneWorld extends BaseScene {
    // Constants
    static ENTITY_ACTIVE_BUFFER = 1; // Number of sections around the player to keep entities active

    constructor() {
        super({ key: 'WayneWorld' });
        this.tileColliderAdded = false;
        this.messageShown = false;
        this.currentLevel = 0; // Track which level section we're in
        this.totalEnemies = 21; // Combined enemies from all levels
        this.remainingEnemies = this.totalEnemies;
        this.checkpoints = new Map(); // Store checkpoint positions
        this.levelIndicatorText = null;
        this.isTransitioning = false;
        this.nextLevelBuffer = null; // Store next level's tiles
        this.bufferDistance = 200; // Distance before level end to start buffering
        
        // Progressive loading properties
        this.loadedSections = new Set();
        this.sectionWidth = 2048; // Fixed section width
        this.lastLoadedSection = -1; // Track the last loaded section
        this.activeEntities = new Map(); // Store active entities by section
        this.entityBuffer = 2; // Number of sections to keep loaded for entities
        this.sectionEntities = new Map(); // Store entity data by section
        this.currentLevelData = null;
        this.gameStarted = false;
        this.loadedTilesCount = 0; // Add counter for loaded tiles
        this.audioManager = null;
        this.levelBounds = {
            x: 0,
            y: 0,
            width: 0,  // Will be updated with actual level data
            height: 0  // Will be updated with actual level data
        };
        this.levelHeight = 0; // Initialize levelHeight as instance property
        
        // Debug tracking
        this.entityStats = {
            totalLoaded: 0,
            totalUnloaded: 0,
            activeBySection: new Map()
        };
    }

    preload() {
        super.preload();
    
        // Initialize AssetManager and attach it to the scene
        const assets = new AssetManager(this);
    
        // Initialize ManagerFactory
        const managerFactory = new ManagerFactory();
        console.log('ManagerFactory initialized:', managerFactory);
    
        // Create LDTK Entity Manager first
        const ldtkEntityManager = ManagerFactory.createEntityManager(this);
    
        // Now register entity factories
        ldtkEntityManager.registerEntityFactories({
            Enemy: (scene, x, y, fields) => new Enemy(scene, x, y),
            Bitcoin: (scene, x, y, fields) => new Bitcoin(scene, x, y),
            Zapper: (scene, x, y, fields) => new Zapper(scene, x, y, fields),
            PlayerStart: (scene, x, y, fields) => new PlayerStart(scene, x, y),
            // Add other entities here
        });
    
        // Assign AssetManager to the scene
        this.assetManager = assets;
        console.log('AssetManager assigned to scene:', this.assetManager);
    
        // Load assets via AssetManager
        this.assetManager.loadAssets();
    }
    
    create() {
        super.create();

        // Initialize managers
        this.managers = ManagerFactory.createManagers(this);
        this.ldtkManager = ManagerFactory.getLDTKTileManager(this);

        if (!this.audioManager) {
            this.audioManager = this.managers.audio;
            this.initializeAudioSystem();
        }

        // Use the LDTKEntityManager created in preload or initialize again if necessary
        if (!this.ldtkEntityManager) {
            const ldtkEntityManager = ManagerFactory.createEntityManager(this);
            console.log('LDTKEntityManager initialized in create:', ldtkEntityManager);
            this.ldtkEntityManager = ldtkEntityManager;
        }

        // Access CameraManager through ManagerFactory
        this.cameraManager = ManagerFactory.getCameraManager(this);
        this.cameraManager.setupCamera(); // Set up the camera

        // Load LDTK data first to get dimensions
        const ldtkData = this.cache.json.get('combined-level');
        if (!ldtkData || !ldtkData.levels || ldtkData.levels.length === 0) {
            console.error('Failed to load LDTK data');
            return;
        }

        // Get current level dimensions from LDTK data
        const currentLevelData = ldtkData.levels[this.currentLevel];
        
        // Calculate total level dimensions
        this.singleLevelWidth = currentLevelData.pxWid;
        this.levelHeight = currentLevelData.pxHei;  // Store as instance property
        this.totalLevels = ldtkData.levels.length;
        
        // Calculate total width for all levels
        const totalWidth = this.singleLevelWidth * this.totalLevels;
        
        // Set level bounds using the total width of all levels
        this.levelBounds = {
            x: 0,
            y: 0,
            width: totalWidth,  // Use total width of all levels
            height: this.levelHeight
        };
        
        console.log("Level bounds set to:", {
            singleLevelWidth: this.singleLevelWidth,
            totalWidth,
            height: this.levelHeight,
            totalLevels: this.totalLevels
        });

        // Initialize debug text
        this.debugText = this.add.text(16, 16, '', {
            fontSize: '24px',
            fill: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
            fixedWidth: 300
        }).setScrollFactor(0).setDepth(1001).setVisible(false);

        // Get level dimensions from LDTK
        const firstLevel = ldtkData.levels[0];
        this.singleLevelWidth = firstLevel.pxWid || 2048;
        // Level height already set above
        this.totalLevels = ldtkData.levels.length;
        
        // Calculate total width
        const levelWidth = this.singleLevelWidth * this.totalLevels;
        const worldHeight = this.levelHeight;

        console.log('World dimensions:', {
            sectionWidth: this.sectionWidth,
            singleLevelWidth: this.singleLevelWidth,
            totalWidth: levelWidth,
            worldHeight: worldHeight,
            totalLevels: this.totalLevels
        });



        // Initialize base scene without creating player yet
        this.skipPlayerCreation = true;
        super.create();
        this.skipPlayerCreation = false;

        // Create managers first
        this.managers = ManagerFactory.createManagers(this);

        // Create animations before initializing entities
        console.log('Creating  animations...');
        const animationManager = ManagerFactory.getAnimationManager();
        animationManager.createZapperAnimations(this);
        animationManager.createBulletAnimations(this);

        console.log('animations created:', this.anims.exists('zapper_idle'));
        // Create animations
        this.anims.create({
            key: 'zapper_wake',
            frames: this.anims.generateFrameNumbers('zapper_spritesheet', { start: 0, end: 3 }), // Update the frame range
            frameRate: 10,
            repeat: 0,
        });
        

        // Get managers from container
        this.ldtkEntityManager = this.managers.ldtkEntityManager;
        this.enemyManager = this.managers.enemies;
        this.hazardManager = this.managers.hazards;
        this.bulletPool = this.managers.bullets;
        this.effectsManager = this.managers.effects;

        if (!this.ldtkEntityManager) {
            console.error('LDTKEntityManager not initialized');
            return;
        }

        // Enable debug mode if needed
        if (this.showDebug) {
            this.ldtkEntityManager.setDebug(true);
        }

        // Create physics groups
        this.platforms = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group({
            bounceX: 0.2,
            bounceY: 0.2,
            collideWorldBounds: true
        });
        const bulletManager = ManagerFactory.getBulletManager(this);
        this.bullets = bulletManager.getGroup(); // Optional, if you still need a reference

        // Store level data for later use
        this.currentLevelData = ldtkData;

        // Initialize managers
        this.tileManager = ManagerFactory.getLDTKTileManager(this);

        // Create the base tilemap with dynamic dimensions
        this.map = this.make.tilemap({
            tileWidth: 32,
            tileHeight: 32,
            width: Math.ceil(levelWidth / 32),
            height: Math.ceil(worldHeight / 32)
        });

        // Add tileset
        this.tileset = this.map.addTilesetImage('GtuTileset');
        if (!this.tileset) {
            console.error('Failed to load tileset');
            return;
        }

        // Create separate layers for ground and platforms
        this.groundLayer = this.map.createBlankLayer('Ground', this.tileset);
        this.platformLayer = this.map.createBlankLayer('Platforms', this.tileset);

        // Set world bounds
        this.physics.world.setBounds(0, 0, levelWidth, worldHeight);
        
        // Create initial level section
        this.loadLevelSection(0);

        // Set up collision detection
        this.setupCollisions();

        // Find player start position from LDTK data
        let playerStartX = 100;
        let playerStartY = 100;
    
        if (this.currentLevelData && this.currentLevelData.levels[0].layerInstances) {
            const entitiesLayer = this.currentLevelData.levels[0].layerInstances.find(
                layer => layer.__identifier === 'Entities'
            );
            
            if (entitiesLayer) {
                const playerStart = entitiesLayer.entityInstances.find(
                    entity => entity.__identifier === 'PlayerStart'
                );
                
                if (playerStart) {
                    playerStartX = playerStart.px[0];
                    playerStartY = playerStart.px[1];
                    console.log('Found LDTK player start position:', { playerStartX, playerStartY });
                } else {
                    console.log('No LDTK PlayerStart found, using default position');
                }
            }
        }

        // Always store the spawn point, whether from LDTK or default
        this.playerSpawnPoint = { x: playerStartX, y: playerStartY };
        console.log('Setting player spawn point:', this.playerSpawnPoint);

        // Create player at the spawn position
        this.createPlayer(playerStartX, playerStartY);

        // Add colliders first
        this.physics.add.collider(this.player, this.groundLayer);
        this.physics.add.collider(this.player, this.platformLayer);
        this.physics.add.collider(this.enemies, this.groundLayer);
        this.physics.add.collider(this.enemies, this.platformLayer);

        // Ensure player is set before initializing the camera
        if (this.player) {
            this.cameraManager.player = this.player; // Assign the player to the camera manager
            this.cameraManager.init({ 
                player: this.player,
                levelBounds: this.levelBounds
            });
            console.log('Camera initialized with player at position:', { x: this.player.x, y: this.player.y });
        } else {
            console.warn('Player not created successfully - camera initialization skipped');
        }

        // Set up initial registry values for UI
        console.log('Setting up initial registry values');
        this.registry.set('score', 0);
        this.registry.set('lives', 3);
        this.registry.set('playerHP', GameConfig.PLAYER.INITIAL_HP);
        this.registry.set('maxPlayerHP', GameConfig.PLAYER.INITIAL_HP);
        this.registry.set('stamina', 100);
        this.registry.set('bitcoins', 0);

        // Setup UI and other elements
        console.log("WayneWorld: Starting UI setup...");
        this.setupUI();

        // Add debug graphics for boundaries
        this.boundaryGraphics = this.add.graphics();
        this.boundaryGraphics.setDepth(1000);
        this.showDebug = false;
        
        // Debug controls
        this.debugKey = this.input.keyboard.addKey('E');
        this.debugKey.on('down', () => {
            this.showDebug = !this.showDebug;
            if (!this.showDebug) {
                this.boundaryGraphics.clear();
            }
            // Toggle LDTKEntityManager debug mode
            if (this.ldtkEntityManager) {
                this.ldtkEntityManager.setDebug(this.showDebug);
            }
        });
    }

    /****************************
     * SCENE LIFECYCLE METHODS
     ****************************/
    
    update(time, delta) {
        super.update(time, delta);
    
        // Update subsystems
        this.updateBulletPool();
        this.updateCamera();
    
        // Update sections and entities based on player position
        if (this.player && this.cameras.main) {
            const playerSection = Math.floor(this.player.x / this.sectionWidth);
            this.handleSectionManagement(playerSection);
        }

        // Update all enemies in the scene, including Zapper/
        if (this.enemies) {
            this.enemies.children.iterate(enemy => {
                if (enemy.update) {
                    enemy.update(time, delta);
                }
            });
        }
    
    // Log LDTKEntityManager details outside the loop
    console.log('LDTKEntityManager instance in WayneWorld:', this.ldtkEntityManager);
    console.log('Available methods on LDTKEntityManager:', Object.keys(this.ldtkEntityManager));
    console.log('Zapper.update called', { time, delta });

        // Update debug graphics if enabled
        this.updateDebugGraphics();
    }

    // Update bullet pool
    updateBulletPool() {
        if (this.bulletPool) {
            this.bulletPool.update();
        }
    }
    
    // Update camera
    updateCamera() {
        if (this.cameraManager && this.player) {
            this.cameraManager.update();
        }
    }

    handleSectionManagement(playerSection) {
        console.log(`Managing sections for player in section: ${playerSection}`);
    
        // First clean up distant sections
        this.cleanUpDistantSections(playerSection);
    
        // Then load adjacent sections
        this.loadAdjacentSections(this.player.x);
    
        // Finally update entities for active sections
        this.updateSectionEntities(playerSection);
    }
    

    cleanUpDistantSections(playerSection) {
        const bufferSections = WayneWorld.ENTITY_ACTIVE_BUFFER;
    
        this.loadedSections.forEach(sectionIndex => {
            if (sectionIndex < playerSection - bufferSections || sectionIndex > playerSection + bufferSections) {
                console.log(`Unloading section ${sectionIndex} (too far from player section ${playerSection})`);
                this.unloadSection(sectionIndex);
            }
        });
    }
    

    // Update debug graphics if enabled
    updateDebugGraphics() {
        if (this.showDebug) {
            this.drawDebugGraphics();
        } else if (this.boundaryGraphics) {
            this.boundaryGraphics.clear();
        }
    }
    

    /****************************
     * LEVEL LOADING & MANAGEMENT
     ****************************/
    
    loadLevelSection(startX) {
        const sectionIndex = Math.floor(startX / this.sectionWidth);
        if (this.loadedSections.has(sectionIndex)) {
            console.log(`Section ${sectionIndex} is already loaded.`);
            return;
        }
    
        console.log(`Loading section ${sectionIndex} at ${startX}`);
        this.loadedSections.add(sectionIndex);
        this.lastLoadedSection = Math.max(this.lastLoadedSection, sectionIndex);
        
        if (!this.currentLevelData || !this.currentLevelData.levels) {
            console.error('No level data available');
            return;
        }

        // Calculate which levels this section spans
        const startLevelIndex = Math.floor(startX / this.singleLevelWidth);
        const endLevelIndex = Math.floor((startX + this.sectionWidth - 1) / this.singleLevelWidth);
        
        console.log(`Section ${sectionIndex} spans levels:`, {
            startLevel: startLevelIndex,
            endLevel: endLevelIndex,
            startX,
            sectionWidth: this.sectionWidth
        });

        // First pass: Load all tiles for this section
        for (let currentLevelIndex = startLevelIndex; currentLevelIndex <= endLevelIndex; currentLevelIndex++) {
            const currentLevel = this.currentLevelData.levels[currentLevelIndex];
            if (!currentLevel) continue;

            const levelStartX = currentLevelIndex * this.singleLevelWidth;
            
            // Find the Solid layer
            const solidLayer = currentLevel.layerInstances.find(layer => 
                layer.__identifier === 'Solid' || layer.__type === 'IntGrid'
            );

            if (solidLayer) {
                // Convert world coordinates to level-local tile coordinates
                const startTile = Math.floor((startX - levelStartX) / 32);
                const endTile = Math.ceil((startX + this.sectionWidth - 1) / 32);
                const width = solidLayer.__cWid;
                const height = solidLayer.__cHei;

                // Process IntGrid values
                if (solidLayer.intGridCsv) {
                    for (let y = 0; y < height; y++) {
                        for (let x = startTile; x < endTile && x < width; x++) {
                            const idx = y * width + x;
                            const value = solidLayer.intGridCsv[idx];
                            
                            if (value > 0) {
                                const worldX = Math.floor((x * 32 + levelStartX) / 32);
                                const worldY = y;
                                const tileId = value - 1;
                                
                                const groundTile = this.groundLayer.putTileAt(tileId, worldX, worldY, true);
                                if (groundTile) {
                                    groundTile.setCollision(true);
                                }
                            }
                        }
                    }
                }

                // Process auto-layer tiles
                if (solidLayer.autoLayerTiles) {
                    solidLayer.autoLayerTiles.forEach(tile => {
                        const tileX = tile.px[0] + levelStartX;
                        const tileY = tile.px[1];
                        
                        if (tileX >= startX && tileX < startX + this.sectionWidth) {
                            const gridX = Math.floor(tileX / 32);
                            const gridY = Math.floor(tileY / 32);
                            const tileId = tile.t;
                            
                            const platformTile = this.platformLayer.putTileAt(tileId, gridX, gridY, true);
                            if (platformTile) {
                                platformTile.setCollision(true);
                            }
                        }
                    });
                }
            }
        }

        // Set collision for the platform layer
        this.platformLayer.setCollisionByExclusion([-1]);

        // Force physics world update to ensure all colliders are active
        this.physics.world.step(0);

        // Second pass: Create entities after tiles are loaded and physics is updated
        for (let currentLevelIndex = startLevelIndex; currentLevelIndex <= endLevelIndex; currentLevelIndex++) {
            const currentLevel = this.currentLevelData.levels[currentLevelIndex];
            if (!currentLevel) continue;

            const levelStartX = currentLevelIndex * this.singleLevelWidth;
            
            // Process entities for this level section after tiles are loaded
            if (this.ldtkEntityManager) {
                console.log('zzz --------- Starting entity creation ---------');
                console.log('zzz Level data:', {
                    levelIndex: currentLevelIndex,
                    offset: levelStartX,
                    entityLayers: currentLevel.layerInstances.filter(l => l.__type === "Entities").length
                });
                
                const createdEntities = this.ldtkEntityManager.createEntities(currentLevel, levelStartX, 0);
                console.log('zzz Created entities count:', createdEntities.length);
                console.log('zzz --------- Entity creation complete ---------');
                
                // Track created entities for this section
                if (createdEntities && createdEntities.length > 0) {
                    // Store in active entities map
                    const sectionEntities = this.activeEntities.get(sectionIndex) || [];
                    sectionEntities.push(...createdEntities);
                    this.activeEntities.set(sectionIndex, sectionEntities);

                    // Update entity stats
                    this.entityStats.totalLoaded += createdEntities.length;
                    const currentCount = this.entityStats.activeBySection.get(sectionIndex) || 0;
                    this.entityStats.activeBySection.set(sectionIndex, currentCount + createdEntities.length);

                    console.log(`Added ${createdEntities.length} entities to section ${sectionIndex}`);
                }
            }
        }
        
        console.log(`Section ${sectionIndex} loaded successfully`);
    }

    loadAdjacentSections(playerX) {
        const playerSection = Math.floor(playerX / this.sectionWidth);
        const bufferSections = WayneWorld.ENTITY_ACTIVE_BUFFER;
    
        for (let offset = -bufferSections; offset <= bufferSections; offset++) {
            const sectionToLoad = playerSection + offset;
    
            if (sectionToLoad >= 0 && !this.loadedSections.has(sectionToLoad)) {
                const sectionStart = sectionToLoad * this.sectionWidth;
                console.log(`Loading section ${sectionToLoad} at ${sectionStart}`);
                this.loadLevelSection(sectionStart);
            }
        }
    }
    

    unloadSection(sectionIndex) {
        if (!this.loadedSections.has(sectionIndex)) {
            console.log(`Section ${sectionIndex} is not loaded.`);
            return;
        }
    
        console.log(`Unloading section ${sectionIndex}`);
        this.removeSectionEntities(sectionIndex);
        
        // Remove tiles in this section
        const sectionStartX = sectionIndex * this.sectionWidth;
        const sectionEndX = sectionStartX + this.sectionWidth;
    
        if (this.groundLayer) {
            for (let x = Math.floor(sectionStartX / 32); x < Math.ceil(sectionEndX / 32); x++) {
                for (let y = 0; y < this.groundLayer.layer.height; y++) {
                    this.groundLayer.putTileAt(-1, x, y); // Unload ground tiles
                    if (this.platformLayer) {
                        this.platformLayer.putTileAt(-1, x, y); // Unload platform tiles
                    }
                }
            }
        }
    
        // Mark section as unloaded
        this.loadedSections.delete(sectionIndex);
    }

    removeSectionEntities(sectionIndex) {
        const entities = this.activeEntities.get(sectionIndex);
        if (!entities) {
            console.warn(`No entities found to unload for section ${sectionIndex}`);
            return;
        }
    
        console.log(`Removing ${entities.length} entities from section ${sectionIndex}`);
    
        // Save entity data for reloading
        const entityData = entities.map(entity => ({
            type: entity.type || entity.ldtkData?.__identifier || 'Unknown',
            x: entity.x,
            y: entity.y,
            properties: entity.properties || {}, // Additional properties
        }));
    
        this.sectionEntities.set(sectionIndex, entityData); // Safely save data
    
        // Destroy each entity
        entities.forEach(entity => {
            if (entity && typeof entity.destroy === 'function') {
                entity.destroy();
            }
        });
    
        this.activeEntities.delete(sectionIndex);
    
        console.log(`Entities removed and saved for section ${sectionIndex}`);
    }
    
    
    

    /****************************
     * ENTITY MANAGEMENT
     ****************************/
    
    updateSectionEntities(playerSection) {
        const minEntitySection = Math.max(0, playerSection - WayneWorld.ENTITY_ACTIVE_BUFFER);
        const maxEntitySection = playerSection + WayneWorld.ENTITY_ACTIVE_BUFFER;
    
        console.log(`Player section: ${playerSection}`);
        console.log(`Active range: ${minEntitySection} to ${maxEntitySection}`);
        console.log(`Loaded sections: ${Array.from(this.loadedSections)}`);
    
        // First unload far entities
        for (const [sectionIndex, entities] of this.activeEntities) {
            if (sectionIndex < minEntitySection || sectionIndex > maxEntitySection) {
                console.log(`Unloading entities for section ${sectionIndex}`);
                this.removeSectionEntities(sectionIndex);
            }
        }
    
        // Then load new entities for sections in range
        for (let i = minEntitySection; i <= maxEntitySection; i++) {
            console.log(`Trying to load section ${i}`);
            if (!this.activeEntities.has(i) && this.loadedSections.has(i)) {
                console.log(`Loading entities for section ${i}`);
                this.loadSectionEntities(i);
            }
        }
    }

    loadSectionEntities(sectionIndex) {
        console.log(`GRAY Attempting to load entities for section ${sectionIndex}`);
        if (this.activeEntities.has(sectionIndex)) {
            console.log(`Entities for section ${sectionIndex} are already loaded.`);
            return;
        }
    
        console.log(`Loading entities for section ${sectionIndex}`);
        const sectionEntities = []; // Temporary array for recreated entities
    
        // Fetch saved entities for the section
        console.log('GRAY Current saved entities:', this.sectionEntities);
        const savedEntities = this.sectionEntities.get(sectionIndex);
        console.log(`GRAY Fetched saved entities for section ${sectionIndex}:`, savedEntities);
    
        if (savedEntities) {
            savedEntities.forEach(data => {
                console.log(`Recreating entity:`, data);
                let entity;
            
                if (data.type === 'Zapper') {
                    entity = new Zapper(this, data.x, data.y);
                    console.log('Zapper created:', entity);
                } else {
                    entity = this.ldtkEntityManager.createEntityInstance(
                        { __identifier: data.type, px: [data.x, data.y], fieldInstances: data.properties },
                        0,
                        0
                    );
                    console.log(`${data.type} entity created:`, entity);
                }
            
                if (entity) {
                    Object.assign(entity, data.properties || {}); // Restore properties
                    sectionEntities.push(entity);
                } else {
                    console.warn(`Failed to recreate entity:`, data);
                }
            });
            
    
            // Clear saved data after successfully recreating entities
            this.sectionEntities.delete(sectionIndex);
        } else {
            console.warn(`No saved entities found for section ${sectionIndex}`);
        }
    
        if (sectionEntities.length > 0) {
            this.activeEntities.set(sectionIndex, sectionEntities);
            console.log(`Entities loaded for section ${sectionIndex}:`, sectionEntities);            
        }
    }
    
    
    /****************************
     * PLAYER MANAGEMENT
     ****************************/
    
    createPlayer(x, y) {
        if (this.player) {
            console.log('Player already exists, skipping creation');
            return;
        }

        console.log('Creating player at exact coordinates:', x, y);
        this.player = new Player(this, x, y);
        this.add.existing(this.player);
        this.physics.add.existing(this.player);
        
        // Store initial spawn point
        this.playerSpawnPoint = { x, y };
        
        // Set up player physics properties
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0);
        this.player.setGravityY(300);
        
        // Add collision with platforms
        if (this.platforms) {
            this.physics.add.collider(this.player, this.platforms);
        }
        
        // Add collision with tilemap layers that have collision
        if (this.platformLayer) {
            this.physics.add.collider(this.player, this.platformLayer);
        }

        // Initialize camera if we have a camera manager
        if (this.cameraManager) {
            this.cameraManager.init(this.player);
        }

        console.log('Player creation complete:', {
            x: this.player.x,
            y: this.player.y,
            physics: this.player.body ? 'enabled' : 'disabled',
            colliders: {
                platforms: !!this.platforms,
                layer: !!this.platformLayer
            }
        });
    }

    handlePlayerEnemyCollision(player, enemy) {
        // Use the CollisionManager's method instead
        this.managers.collisions.handlePlayerEnemyOverlap(player, enemy);
    }

    handlePlayerDeath() {
        // Implement game over logic here
        console.log('Player died!');
        this.scene.restart();
    }

    /****************************
     * GAME STATE & UI
     ****************************/
    
    setupUI() {
        console.log("WayneWorld: Starting UI setup...");

        // Retrieve UIManager via ManagerFactory
        this.gameUI = ManagerFactory.getUIManager(this);
    
        if (this.gameUI) {
            console.log('WayneWorld: UIManager initialized successfully');
        } else {
            console.error('WayneWorld: Failed to initialize UIManager');
        }

        // Add level indicator text
        console.log('WayneWorld: Creating level indicator text');
        this.levelIndicatorText = this.add.text(this.scale.width / 2, 50, '', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(1001);

        // Show start message if gameUI exists
        if (this.gameUI) {
            console.log('WayneWorld: Showing start message through gameUI');
            this.gameUI.showStartMessage();
        } else {
            console.warn('WayneWorld: GameUI not available for start message');
        }

        // Add space key listener for starting the game
        console.log('WayneWorld: Setting up space key for game start');
        const spaceKey = this.input.keyboard.addKey('SPACE');
        spaceKey.once('down', () => {
            if (!this.gameStarted) {
                console.log('WayneWorld: Space key pressed - starting game');
                this.startGame();
            }
        });

        // Add ESC key for pause menu
        console.log('WayneWorld: Setting up ESC key for pause menu');
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.pauseKey.on('down', () => {
            if (!this.gameStarted) return;
            console.log('WayneWorld: ESC key pressed - toggling pause');
            this.togglePause();
        });

        console.log('WayneWorld: UI setup complete');
    }

    startGame() {
        if (this.player) {
            this.player.controller.enabled = true;
            this.gameStarted = true;
            if (this.gameUI) {
                this.gameUI.hideStartMessage();
            }
        }
    }

    togglePause() {
        if (this.scene.isPaused('CombinedGtuLevel')) {
            this.scene.resume('CombinedGtuLevel');
            if (this.gameUI) {
                this.gameUI.hidePauseMenu();
            }
        } else {
            this.scene.pause('CombinedGtuLevel');
            if (this.gameUI) {
                this.gameUI.showPauseMenu();
            }
        }
    }

    /****************************
     * COLLISION & PHYSICS
     ****************************/
    
    setupCollisions() {
        const bulletManager = ManagerFactory.getBulletManager(this);
    
        // Access the bullet group
        const bullets = bulletManager.getGroup();
    
        // Collisions with enemies
        this.physics.add.overlap(bullets, this.enemies, (bullet, enemy) => {
            bullet.destroy();
            if (typeof enemy.takeDamage === 'function') {
                enemy.takeDamage(10);
            } else {
                console.warn(`Enemy does not have a takeDamage method:`, enemy);
            }
        });
    
        // Collisions with platforms
        this.physics.add.collider(bullets, this.platformLayer, (bullet) => {
            bullet.destroy();
        });
    
        // Ensure entities (enemies/zappers) are properly initialized and handled
        this.enemies.children.each(enemy => {
            if (!enemy.body) {
                console.warn(`Enemy is missing a physics body:`, enemy);
            } else {
                this.physics.add.collider(enemy, this.platformLayer);
            }
        });
    }
    


    /****************************
     * DEBUG & VISUALIZATION
     ****************************/
    
    drawDebugGraphics() {
        if (!this.boundaryGraphics) return;
        
        this.boundaryGraphics.clear();

        // Draw section boundaries
        this.boundaryGraphics.lineStyle(2, 0xff0000, 1);
        this.loadedSections.forEach(sectionIndex => {
            const x = sectionIndex * this.sectionWidth;
            this.boundaryGraphics.strokeRect(x, 0, this.sectionWidth, this.cameras.main.height);
        });

        // Update debug text with entity information
        let totalCurrentEntities = 0;
        this.entityStats.activeBySection.forEach(count => totalCurrentEntities += count);

        const debugInfo = [
            `Section: ${Math.floor(this.player?.x / this.sectionWidth) || 0}`,
            `Loaded Sections: ${Array.from(this.loadedSections).join(', ')}`,
            `Active Tiles: ${this.loadedTilesCount}`,
            `Total Entities Loaded: ${this.entityStats.totalLoaded}`,
            `Total Entities Unloaded: ${this.entityStats.totalUnloaded}`,
            `Current Active Entities: ${totalCurrentEntities}`,
            `Entities by Section: ${Array.from(this.entityStats.activeBySection.entries())
                .map(([section, count]) => `[${section}:${count}]`).join(' ')}`
        ].join('\n');

        if (this.debugText) {
            this.debugText.setText(debugInfo);
            this.debugText.setVisible(true);
        }
    }

    /****************************
     * AUDIO SYSTEM
     ****************************/
    
    initializeAudioSystem() {
        try {
            this.game.sound.pauseOnBlur = false;
            if (this.audioManager) {
                this.audioManager.playBackgroundMusic('bgMusic');
            }
            console.log('Audio system initialized successfully');
        } catch (error) {
            console.warn('Error initializing audio system:', error);
        }
    }
    

    /****************************
     * CLEANUP & RESET
     ****************************/
    
    cleanup() {
        if (this.ldtkEntityManager) {
            this.ldtkEntityManager.cleanup();
        }
        
        // Clean up all active entities
        for (const [sectionIndex, entities] of this.activeEntities) {
            this.removeSectionEntities(sectionIndex);
        }
        this.activeEntities.clear();
        
        // Clean up physics groups
        if (this.enemies) {
            this.enemies.clear(true, true);
        }
        if (this.bullets) {
            this.bullets.clear(true, true);
        }
        
        // Clean up layers
        if (this.groundLayer) {
            this.groundLayer.destroy();
        }
        if (this.platformLayer) {
            this.platformLayer.destroy();
        }
        
        // Clean up player
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
        
        // Reset state
        this.loadedSections.clear();
        this.lastLoadedSection = -1;
        this.currentLevelData = null;
        this.gameStarted = false;
    }
}
