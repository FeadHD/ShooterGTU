import { BaseScene } from '../elements/BaseScene';
import { UIManager } from '../elements/UIManager';
import { TransitionScreen } from '../elements/TransitionScreen';
import Enemy from '../../prefabs/Enemy';
import { MusicManager } from '../../modules/managers/audio/MusicManager';
import { Bitcoin } from '../../prefabs/Bitcoin';
import { TrapManager } from '../../modules/managers/TrapManager';
import { EnemyManager } from '../../modules/managers/EnemyManager';
import { Bullet } from '../../prefabs/Bullet';
import { GameConfig } from '../../config/GameConfig';
import CameraManager from '../../modules/managers/CameraManager';
import { LDTKTileManager } from '../../modules/managers/LDTKTileManager';
import { BulletPool } from '../../modules/managers/pools/BulletPool';
import { Player } from '../../prefabs/Player';
import { eventBus } from '../../modules/events/EventBus';
import { ManagerFactory } from '../../modules/di/ManagerFactory';
import { LDTKEntityManager } from '../../modules/managers/LDTKEntityManager';
import { AssetManager } from '../../modules/managers/AssetManager';

export class WayneWorld extends BaseScene {
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
        this.sectionWidth = 640; // Fixed section width of 20 tiles
        this.lastLoadedSection = -1; // Track the last loaded section
        this.activeEntities = new Map(); // Store active entities by section
        this.entityBuffer = 2; // Number of sections to keep loaded for entities
        this.sectionEntities = new Map(); // Store entity data by section
        this.currentLevelData = null;
        this.gameStarted = false;
        this.loadedTilesCount = 0; // Add counter for loaded tiles
    }

    preload() {
        super.preload();
        
        // Get AssetManager from ManagerFactory
        this.managers = ManagerFactory.createManagers(this);
        this.managers.assets.loadAssets();
    }

    create() {
        super.create();

        // Initialize audio system first
        this.initializeAudio();
        
        // Load LDTK data first to get dimensions
        const ldtkData = this.cache.json.get('combined-level');
        if (!ldtkData || !ldtkData.levels || ldtkData.levels.length === 0) {
            console.error('Failed to load LDTK data');
            return;
        }

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
        const levelHeight = firstLevel.pxHei || 512;
        this.totalLevels = ldtkData.levels.length;
        
        // Calculate total width
        const levelWidth = this.singleLevelWidth * this.totalLevels;
        const worldHeight = levelHeight;

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

        // Create Zapper animations before initializing entities
        console.log('Creating Zapper animations...');
        
        this.anims.create({
            key: 'zapper_idle',
            frames: this.anims.generateFrameNumbers('zapper_idle', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'zapper_wake',
            frames: this.anims.generateFrameNumbers('zapper_wake', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: 0
        });

        this.anims.create({
            key: 'zapper_walk',
            frames: this.anims.generateFrameNumbers('zapper_walk', { start: 0, end: 7 }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'zapper_shock',
            frames: this.anims.generateFrameNumbers('zapper_shock', { start: 0, end: 5 }),
            frameRate: 15,
            repeat: 0
        });

        console.log('Zapper animations created:', this.anims.exists('zapper_idle'));

        // Get managers from container
        this.ldtkEntityManager = this.managers.ldtkEntityManager;
        this.enemyManager = this.managers.enemies;
        this.trapManager = this.managers.traps;
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
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 20,
            runChildUpdate: true,
            allowGravity: false
        });

        // Create bullet animation
        this.anims.create({
            key: 'bullet-travel',
            frames: this.anims.generateFrameNumbers('bullet', { start: 0, end: 7 }),
            frameRate: 16,
            repeat: -1
        });

        // Store level data for later use
        this.currentLevelData = ldtkData;

        // Initialize managers
        this.tileManager = new LDTKTileManager(this);

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

        // Initialize camera with proper dimensions and player AFTER player is fully set up
        this.cameraManager = new CameraManager(this, levelWidth, worldHeight);
        if (this.player) {
            this.cameraManager.player = this.player;
            this.cameraManager.init(this.player);
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
        console.log('Setting up UI elements');
        this.setupUI();
        
        // Start background music after everything is set up
        this.startBackgroundMusic();
        
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

        // Update bullet pool if it exists
        if (this.bulletPool) {
            this.bulletPool.update();
        }

        // Update camera manager only if player exists
        if (this.cameraManager && this.player) {
            this.cameraManager.update();
        }

        if (this.player && this.cameras.main) {
            const playerSection = Math.floor(this.player.x / this.sectionWidth);
            
            // Always load sections around player position
            this.loadAdjacentSections(this.player.x);
            
            // Clean up sections that are too far away
            this.loadedSections.forEach(sectionIndex => {
                if (Math.abs(sectionIndex - playerSection) > 2) {
                    this.unloadSection(sectionIndex);
                }
            });
        }

        // Update debug graphics if enabled
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
            return;
        }
        
        console.log(`Loading section ${sectionIndex} at startX: ${startX}`);
        
        // Mark this section as loaded
        this.loadedSections.add(sectionIndex);
        this.lastLoadedSection = Math.max(this.lastLoadedSection, sectionIndex);
        
        if (!this.currentLevelData || !this.currentLevelData.levels) {
            console.error('No level data available');
            return;
        }

        // Reset tile counter for this section
        let sectionTilesCount = 0;

        // Calculate which levels this section spans
        const startLevelIndex = Math.floor(startX / this.singleLevelWidth);
        const endLevelIndex = Math.floor((startX + this.sectionWidth - 1) / this.singleLevelWidth);
        
        console.log(`Section ${sectionIndex} spans levels:`, {
            startLevel: startLevelIndex,
            endLevel: endLevelIndex,
            startX,
            sectionWidth: this.sectionWidth
        });

        // Process each level that this section spans
        for (let currentLevelIndex = startLevelIndex; currentLevelIndex <= endLevelIndex; currentLevelIndex++) {
            const currentLevel = this.currentLevelData.levels[currentLevelIndex];
            if (!currentLevel) continue;

            const levelStartX = currentLevelIndex * this.singleLevelWidth;
            
            // Process entities for this level section
            if (this.ldtkEntityManager) {
                console.log(`Creating entities for level ${currentLevelIndex} at offset ${levelStartX}`);
                this.ldtkEntityManager.createEntities(currentLevel, levelStartX, 0);
            }

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

                console.log(`Processing tiles for level ${currentLevelIndex}:`, {
                    startTile,
                    endTile,
                    width,
                    height
                });

                // Process IntGrid values
                if (solidLayer.intGridCsv) {
                    for (let y = 0; y < height; y++) {
                        for (let x = startTile; x < endTile && x < width; x++) {
                            const idx = y * width + x;
                            const value = solidLayer.intGridCsv[idx];
                            
                            if (value > 0) {
                                const worldX = Math.floor((x * 32 + levelStartX) / 32);
                                const worldY = y;

                                // Use the actual tile ID from the LDTK data
                                const tileId = value - 1; // LDTK uses 1-based indices, Phaser uses 0-based
                                
                                // Place solid tiles in ground layer
                                const groundTile = this.groundLayer.putTileAt(tileId, worldX, worldY, true);
                                if (groundTile) {
                                    groundTile.setCollision(true);
                                }

                                if (sectionIndex === 3) {
                                    console.log(`Placed tile at (${worldX}, ${worldY}) from level ${currentLevelIndex}`);
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
                            
                            // Use the actual tile ID from the autoLayer data
                            const tileId = tile.t;
                            
                            // Place platform tiles in platform layer
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
        
        console.log(`Section ${sectionIndex} loaded successfully`);
    }

    loadAdjacentSections(playerX) {
        const playerSection = Math.floor(playerX / this.sectionWidth);
        const bufferSections = 2; // Keep 2 sections loaded in each direction
        
        // Load sections in both directions
        for (let offset = -bufferSections; offset <= bufferSections; offset++) {
            const sectionToLoad = playerSection + offset;
            
            // Don't try to load sections before the start of the level
            if (sectionToLoad >= 0 && !this.loadedSections.has(sectionToLoad)) {
                const sectionStart = sectionToLoad * this.sectionWidth;
                console.log(`Loading section ${sectionToLoad} around player position`);
                this.loadLevelSection(sectionStart);
            }
        }

        // Handle entity loading/unloading
        this.updateSectionEntities(playerSection);
    }

    unloadSection(sectionIndex) {
        if (!this.loadedSections.has(sectionIndex)) {
            return;
        }
        
        console.log(`Unloading section ${sectionIndex}`);
        
        // Calculate section bounds
        const sectionStartX = sectionIndex * this.sectionWidth;
        const sectionEndX = sectionStartX + this.sectionWidth;
        
        // Remove entities in this section
        this.activeEntities.forEach((entities, index) => {
            if (index === sectionIndex) {
                this.removeSectionEntities(index);
            }
        });
        
        // Clear tiles in this section
        if (this.groundLayer) {
            for (let x = Math.floor(sectionStartX / 32); x < Math.ceil(sectionEndX / 32); x++) {
                for (let y = 0; y < this.groundLayer.layer.height; y++) {
                    this.groundLayer.putTileAt(-1, x, y);
                    if (this.platformLayer) {
                        this.platformLayer.putTileAt(-1, x, y);
                    }
                }
            }
        }
        
        // Mark section as unloaded
        this.loadedSections.delete(sectionIndex);
    }

    /****************************
     * ENTITY MANAGEMENT
     ****************************/
    
    updateSectionEntities(playerSection) {
        // Calculate range for entities
        const minEntitySection = Math.max(0, playerSection - this.entityBuffer);
        const maxEntitySection = Math.min(
            Math.ceil(this.singleLevelWidth / this.sectionWidth),
            playerSection + this.entityBuffer
        );

        // Load new entities
        for (let i = minEntitySection; i <= maxEntitySection; i++) {
            if (!this.activeEntities.has(i)) {
                this.loadSectionEntities(i);
            }
        }

        // Remove far entities
        for (const [sectionIndex, entities] of this.activeEntities) {
            if (sectionIndex < minEntitySection || sectionIndex > maxEntitySection) {
                this.removeSectionEntities(sectionIndex);
            }
        }
    }

    loadSectionEntities(sectionIndex) {
        if (this.activeEntities.has(sectionIndex)) {
            return; // Already loaded
        }

        const sectionStartX = sectionIndex * this.sectionWidth;
        const sectionEndX = sectionStartX + this.sectionWidth;
        
        // Get entities for this section from LDTK
        const levelIndex = Math.floor(sectionStartX / this.singleLevelWidth);
        const currentLevel = this.currentLevelData.levels[levelIndex];
        if (!currentLevel) return;

        const levelStartX = levelIndex * this.singleLevelWidth;
        const sectionEntities = [];

        // Create entities through the manager
        if (this.ldtkEntityManager) {
            console.log(`Creating entities for section ${sectionIndex} (level ${levelIndex})`);
            
            // Filter entities that belong to this section
            const entityLayer = currentLevel.layerInstances.find(layer => 
                layer.__identifier === 'Entities'
            );

            if (entityLayer) {
                const sectionEntitiesData = entityLayer.entityInstances.filter(entity => {
                    const worldX = entity.__worldX + levelStartX;
                    return worldX >= sectionStartX && worldX < sectionEndX;
                });

                // Create each entity in this section
                sectionEntitiesData.forEach(entityData => {
                    const entity = this.ldtkEntityManager.createEntity(
                        entityData.__identifier,
                        entityData.__worldX + levelStartX,
                        entityData.__worldY,
                        entityData.fieldInstances
                    );
                    if (entity) {
                        sectionEntities.push(entity);
                    }
                });
            }
        }

        this.activeEntities.set(sectionIndex, sectionEntities);
    }

    removeSectionEntities(sectionIndex) {
        const entities = this.activeEntities.get(sectionIndex);
        if (!entities) return;

        console.log(`Removing entities from section ${sectionIndex}`);
        
        entities.forEach(entity => {
            if (entity.destroy) {
                entity.destroy();
            }
        });

        this.activeEntities.delete(sectionIndex);
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
        if (player.invulnerableUntil <= this.time.now) {
            // Get current HP
            const currentHP = this.registry.get('playerHP');
            const damage = 10; // Standard damage amount
            
            // Apply damage
            const newHP = Math.max(0, currentHP - damage);
            this.registry.set('playerHP', newHP);
            
            // Create hit effect at player's position
            if (this.effectsManager) {
                this.effectsManager.createHitEffect(player.x, player.y, 0xff0000);
                this.effectsManager.playSound('hit');
            }
            
            // Make player temporarily invulnerable
            player.invulnerableUntil = this.time.now + 1000;
            
            // Check for game over
            if (newHP <= 0) {
                this.handlePlayerDeath();
            }
        }
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
        console.log('WayneWorld: Starting UI setup...');

        // Create UI Manager
        if (!this.gameUI) {
            console.log('WayneWorld: Creating new UIManager instance');
            this.gameUI = new UIManager(this);
        } else {
            console.log('WayneWorld: UIManager already exists');
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
        // Add collisions between bullets and enemies
        this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
            bullet.destroy();
            if (typeof enemy.takeDamage === 'function') {
                enemy.takeDamage(10);
            }
        });

        // Add collisions between bullets and platforms
        this.physics.add.collider(this.bullets, this.platforms, (bullet) => {
            bullet.destroy();
        });
    }

    /****************************
     * DEBUG & VISUALIZATION
     ****************************/
    
    drawDebugGraphics() {
        if (!this.boundaryGraphics) {
            this.boundaryGraphics = this.add.graphics();
        }

        this.boundaryGraphics.clear();

        // Draw world boundaries in red
        this.boundaryGraphics.lineStyle(4, 0xff0000, 1);
        const totalWidth = this.singleLevelWidth * this.totalLevels;
        this.boundaryGraphics.strokeRect(0, 0, totalWidth, this.scale.height);

        // Draw section boundaries in blue
        this.boundaryGraphics.lineStyle(2, 0x0000ff, 1);
        for (let i = 0; i <= this.lastLoadedSection + 1; i++) {
            const sectionX = i * this.sectionWidth;
            this.boundaryGraphics.strokeRect(sectionX, 0, this.sectionWidth, this.scale.height);
        }

        // Draw camera boundaries in green
        this.boundaryGraphics.lineStyle(2, 0x00ff00, 1);
        const camera = this.cameras.main;
        this.boundaryGraphics.strokeRect(
            camera.scrollX,
            camera.scrollY,
            camera.width,
            camera.height
        );

        // Draw player position in yellow
        if (this.player) {
            this.boundaryGraphics.lineStyle(4, 0xffff00, 1);
            this.boundaryGraphics.strokeRect(
                this.player.x - 16,
                this.player.y - 16,
                32,
                32
            );
        }

        // Set graphics depth to be above everything
        this.boundaryGraphics.setDepth(1000);
    }

    /****************************
     * AUDIO SYSTEM
     ****************************/
    
    initializeAudio() {
        if (!this.game.sound.locked) {
            // Audio system is ready, initialize immediately
            this.setupAudioSystem();
        } else {
            // Wait for audio system to unlock
            this.game.sound.once('unlocked', () => {
                this.setupAudioSystem();
            });
        }
    }

    setupAudioSystem() {
        try {
            this.game.sound.pauseOnBlur = false;
            this.musicManager = new MusicManager(this);
            console.log('Audio system initialized successfully');
        } catch (error) {
            console.warn('Error initializing audio system:', error);
        }
    }

    startBackgroundMusic() {
        // Delay music start to ensure scene is ready
        this.time.delayedCall(1000, () => {
            try {
                if (!this.musicManager) {
                    console.warn('Music manager not initialized');
                    return;
                }

                const bgMusic = this.sound.add('bgMusic', {
                    loop: true,
                    volume: 0.5
                });

                // Add custom property to track desired state
                bgMusic.shouldBePlaying = true;

                this.musicManager.setCurrentMusic(bgMusic);
                bgMusic.play();
                console.log('Background music started successfully');
            } catch (error) {
                console.warn('Error starting background music:', error);
            }
        });
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
