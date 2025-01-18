import { BaseScene } from '../elements/BaseScene';
import { CollisionManager } from '../../modules/managers/CollisionManager';
import { TextStyleManager } from '../../modules/managers/TextStyleManager';
import { UIManager } from '../elements/UIManager';
import { TransitionScreen } from '../elements/TransitionScreen';
import Enemy from '../../prefabs/Enemy';
import MeleeWarrior from '../../prefabs/MeleeWarrior';
import { AlarmTrigger } from '../../prefabs/AlarmTrigger';
import { AudioManager } from '../../modules/managers/AudioManager';
import { Bitcoin } from '../../prefabs/Bitcoin';
import { Slime } from '../../prefabs/Slime';
import Drone from '../../prefabs/Drone';
import Trampoline from '../../prefabs/Trampoline';
import { Trap } from '../../prefabs/Trap';
import { DestructibleBlock } from '../../prefabs/DestructibleBlock';
import { FallingDestructibleBlock } from '../../prefabs/FallingDestructibleBlock';
import { DisappearingPlatform } from '../../prefabs/DisappearingPlatform';
import { Turret } from '../../prefabs/Turret';
import { EnemyManager } from '../../modules/managers/entities/EnemyManager';
import { EffectsManager } from '../../modules/managers/EffectsManager';
import { Bullet } from '../../prefabs/Bullet';
import { GameConfig } from '../../config/GameConfig';
import CameraManager from '../../modules/managers/CameraManager';
import { LDTKTileManager } from '../../modules/managers/LDTKTileManager';
import { BulletPool } from '../../modules/managers/pools/BulletPool';
import { Player } from '../../prefabs/Player';
import { eventBus } from '../../modules/events/EventBus';
import { ManagerFactory } from '../../modules/di/ManagerFactory';

export class CombinedGtuLevel extends BaseScene {
    constructor() {
        super({ key: 'CombinedGtuLevel' });
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
        this.activeEntities = new Set();
        this.currentLevelData = null;
        this.gameStarted = false;
        this.loadedTilesCount = 0; // Add counter for loaded tiles
    }

    preload() {
        super.preload();
        
        // Load tileset with correct path
        this.load.image('GtuTileset', 'assets/levels/image/GtuTileset.png');
        
        // Load level data
        this.load.json('combined-level', 'assets/levels/Json/TestGTU.ldtk');
        
        // Load character sprites and animations
        this.load.spritesheet('character_idle', 'assets/character/character_Idle.png', {
            frameWidth: 32,
            frameHeight: 48
        });
        this.load.spritesheet('character_jump', 'assets/character/character_Jump.png', {
            frameWidth: 32,
            frameHeight: 48
        });
        this.load.spritesheet('character_crouch', 'assets/character/character_Crouch.png', {
            frameWidth: 32,
            frameHeight: 48
        });
        this.load.spritesheet('character_death', 'assets/character/character_Death.png', {
            frameWidth: 32,
            frameHeight: 48
        });
        this.load.spritesheet('character_rollover', 'assets/character/character_Rollover.png', {
            frameWidth: 32,
            frameHeight: 48
        });
        this.load.spritesheet('character_walking', 'assets/character/character_Walking.png', {
            frameWidth: 32,
            frameHeight: 48
        });
        
        // Load enemy sprites
        this.load.image('enemy', 'assets/enemy.png');
        this.load.image('warrior_idle', 'assets/enemys/warrior/IDLE.png');
        this.load.image('warrior_attack1', 'assets/enemys/warrior/ATTACK 1.png');
        this.load.image('warrior_attack2', 'assets/enemys/warrior/ATTACK 2.png');
        this.load.image('warrior_attack3', 'assets/enemys/warrior/ATTACK 3.png');
        this.load.image('warrior_death', 'assets/enemys/warrior/DEATH.png');
        this.load.image('warrior_defend', 'assets/enemys/warrior/DEFEND.png');
        this.load.image('warrior_hurt', 'assets/enemys/warrior/HURT.png');
        this.load.image('warrior_jump', 'assets/enemys/warrior/JUMP.png');
        this.load.image('warrior_run', 'assets/enemys/warrior/RUN.png');
        this.load.image('warrior_walk', 'assets/enemys/warrior/WALK.png');
        
        // Load slime sprites
        this.load.image('slime_idle', 'assets/enemys/slime/slime_idle.png');
        this.load.image('slime_jump', 'assets/enemys/slime/slime_jump.png');
        this.load.image('slime_death', 'assets/enemys/slime/slime_death.png');
        
        // Load bullet sprite
        this.load.spritesheet('bullet_animation', 'assets/sprites/bullet.png', {
            frameWidth: 24,
            frameHeight: 24
        });

        // Load drone sprites
        this.load.image('drone', 'assets/enemys/drone/Bot1v1.png');
        
        // Load object sprites
        this.load.image('trampoline', 'assets/Objects/Trampoline/Trampoline.png');
        this.load.image('bitcoin', 'assets/bitcoin/Bitcoin_1.png');
        
        // Load particle effects
        this.load.image('particle', 'assets/particles/particle.png');
        
        // Load UI elements
        this.load.image('bg', 'assets/bg.png');
        
        // Load audio assets
        this.load.audio('turretLaser', 'assets/sounds/laser.wav');
        this.load.audio('laser', 'assets/sounds/laser.wav');
        this.load.audio('hit', 'assets/sounds/hit.wav');
        this.load.audio('victoryMusic', 'assets/sounds/congratulations.wav');
        this.load.audio('bgMusic', 'assets/audio/bgMusic.wav');
        this.load.audio('alarm', 'assets/sounds/alarm.wav');
    }

    create() {
        super.create();

        // Get managers
        this.managers = ManagerFactory.createManagers(this);
        this.audioManager = this.managers.audio;

        // Start background music if enabled
        const musicEnabled = this.registry.get('musicEnabled');
        if (musicEnabled !== false && this.audioManager) {
            this.audioManager.playMusic('bgMusic', {
                loop: true,
                volume: this.registry.get('musicVolume') ?? 1
            });
        }

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

        // Create physics groups
        this.platforms = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
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

        // Initialize managers
        this.effectsManager = this.managers.effects;
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

        // Store level data for later use
        this.currentLevelData = ldtkData;
        
        // Create initial level section
        this.loadLevelSection(0);
        
        // Initialize camera with proper dimensions
        this.levelCamera = new CameraManager(this, levelWidth, worldHeight);
        
        // Set up collision detection
        this.setupCollisions();

        // NOW create the player after tiles are loaded
        this.createPlayer(100, 384); // Y position set to be on top of tiles

        // Initialize camera with player
        this.levelCamera.init(this.player);

        // Initialize managers after player and tiles are loaded
        this.enemyManager = this.managers.enemies;
        this.hazardManager = this.managers.hazards;
        this.bulletPool = this.managers.bullets;

        // Set up camera bounds and following
        const { width, height } = this.scale;
        this.cameras.main.setBounds(0, 0, levelWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 1, 1);
        this.cameras.main.setDeadzone(0);
        this.cameras.main.setFollowOffset(0, -height/4);

        // Add colliders
        this.physics.add.collider(this.player, this.groundLayer);
        this.physics.add.collider(this.player, this.platformLayer);
        this.physics.add.collider(this.enemies, this.groundLayer);
        this.physics.add.collider(this.enemies, this.platformLayer);

        // Setup UI and other elements
        this.setupUI();
        
        // Add debug graphics for boundaries
        this.boundaryGraphics = this.add.graphics();
        this.boundaryGraphics.setDepth(1000);
        this.showDebug = false;
        this.debugKey = this.input.keyboard.addKey('E');
        this.debugKey.on('down', () => {
            this.showDebug = !this.showDebug;
            if (!this.showDebug) {
                this.boundaryGraphics.clear();
            }
        });
    }

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

        // Calculate the level index and local coordinates
        const levelIndex = Math.floor(startX / this.singleLevelWidth);
        const level = this.currentLevelData.levels[levelIndex];
        
        if (!level) {
            console.error(`No level data found for section ${sectionIndex}`);
            return;
        }

        // Calculate section bounds
        const sectionStartX = startX;
        const sectionEndX = startX + this.sectionWidth;
        
        // Calculate which levels this section spans
        const startLevelIndex = Math.floor(sectionStartX / this.singleLevelWidth);
        const endLevelIndex = Math.floor((sectionEndX - 1) / this.singleLevelWidth);
        
        console.log(`Section ${sectionIndex} spans levels:`, {
            startLevel: startLevelIndex,
            endLevel: endLevelIndex,
            sectionStartX,
            sectionEndX
        });

        // Process each level that this section spans
        for (let currentLevelIndex = startLevelIndex; currentLevelIndex <= endLevelIndex; currentLevelIndex++) {
            const currentLevel = this.currentLevelData.levels[currentLevelIndex];
            if (!currentLevel) continue;

            const levelStartX = currentLevelIndex * this.singleLevelWidth;
            const levelEndX = levelStartX + currentLevel.pxWid;
            
            // Find intersection between section and level
            const intersectStartX = Math.max(sectionStartX, levelStartX);
            const intersectEndX = Math.min(sectionEndX, levelEndX);
            
            if (intersectStartX >= intersectEndX) continue;

            console.log(`Processing level ${currentLevelIndex} for section ${sectionIndex}:`, {
                levelStartX,
                levelEndX,
                intersectStartX,
                intersectEndX
            });

            // Find the Solid layer
            const solidLayer = currentLevel.layerInstances.find(layer => 
                layer.__identifier === 'Solid' || layer.__type === 'IntGrid'
            );

            if (solidLayer) {
                // Convert world coordinates to level-local tile coordinates
                const startTile = Math.floor((intersectStartX - levelStartX) / 32);
                const endTile = Math.ceil((intersectEndX - levelStartX) / 32);
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
                                this.groundLayer.putTileAt(tileId, worldX, worldY, true);
                                const platformTile = this.platformLayer.putTileAt(tileId, worldX, worldY, true);
                                if (platformTile) {
                                    platformTile.setCollision(true);
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
                        
                        if (tileX >= intersectStartX && tileX < intersectEndX) {
                            const gridX = Math.floor(tileX / 32);
                            const gridY = Math.floor(tileY / 32);
                            
                            // Use the actual tile ID from the autoLayer data
                            const tileId = tile.t;
                            this.groundLayer.putTileAt(tileId, gridX, gridY, true);
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
        
        // Spawn entities for this section
        this.spawnEntitiesInSection(sectionStartX, sectionEndX);
        
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
    }

    setupCollisions() {
        // Add collisions between bullets and enemies
        this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
            bullet.destroy();
            enemy.damage(10);
        });

        // Add collisions between bullets and platforms
        this.physics.add.collider(this.bullets, this.platforms, (bullet) => {
            bullet.destroy();
        });
    }

    update(time, delta) {
        super.update(time, delta);

        // Update bullet pool if it exists
        if (this.bulletPool) {
            this.bulletPool.update();
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

    unloadSection(sectionIndex) {
        if (!this.loadedSections.has(sectionIndex)) return;

        console.log(`Unloading section ${sectionIndex}`);

        // Calculate section bounds
        const sectionStartX = sectionIndex * this.sectionWidth;
        const sectionEndX = sectionStartX + this.sectionWidth;

        // Clear tiles in this section
        const tileWidth = 32;
        const startTileX = Math.floor(sectionStartX / tileWidth);
        const endTileX = Math.ceil(sectionEndX / tileWidth);

        // Remove tiles from both layers
        if (this.groundLayer) {
            for (let x = startTileX; x < endTileX; x++) {
                for (let y = 0; y < this.groundLayer.height; y++) {
                    this.groundLayer.removeTileAt(x, y);
                    this.platformLayer.removeTileAt(x, y);
                }
            }
        }

        // Remove section from loaded sections
        this.loadedSections.delete(sectionIndex);
        
        // Update last loaded section if necessary
        if (sectionIndex === this.lastLoadedSection) {
            this.lastLoadedSection = Math.max(...Array.from(this.loadedSections));
        }
    }

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

    spawnEntitiesInSection(startX, endX) {
        if (!this.currentLevelData || !this.currentLevelData.layerInstances) return;
        
        // Find entities layer
        const entitiesLayer = this.currentLevelData.layerInstances.find(
            layer => layer.__identifier === 'Entities'
        );
        
        if (!entitiesLayer) return;
        
        // Spawn entities within this section
        entitiesLayer.entityInstances.forEach(entity => {
            const entityX = entity.__worldX;
            if (entityX >= startX && entityX < endX) {
                const spawnedEntity = this.spawnEntity(entity);
                if (spawnedEntity) {
                    this.activeEntities.add(spawnedEntity);
                }
            }
        });
    }

    spawnEntity(entityData) {
        // Implementation of entity spawning based on type
        switch(entityData.__identifier) {
            case 'Enemy':
                return new Enemy(this, entityData.__worldX, entityData.__worldY);
            case 'Bitcoin':
                return new Bitcoin(this, entityData.__worldX, entityData.__worldY);
            // Add other entity types as needed
        }
        return null;
    }

    setupUI() {
        // Initialize game UI
        this.gameUI = this.managers.ui;
        if (this.gameUI.container) {
            this.gameUI.container.setScrollFactor(0);
        }

        // Set up initial player HP
        const INITIAL_HP = 100;
        this.registry.set('playerHP', INITIAL_HP);
        this.registry.set('maxPlayerHP', INITIAL_HP);

        // Create level indicator text
        this.levelIndicatorText = this.add.text(16, 16, `Level ${this.currentLevel}`, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(1000);

        // Show start message if gameUI exists
        if (this.gameUI) {
            this.gameUI.showStartMessage();
        }

        // Add space key listener for starting the game
        const spaceKey = this.input.keyboard.addKey('SPACE');
        spaceKey.once('down', () => {
            if (!this.gameStarted) {
                this.startGame();
            }
        });

        // Add ESC key for pause menu
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.pauseKey.on('down', () => {
            if (!this.gameStarted) return;
            this.togglePause();
        });
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

    createPlayer(x, y) {
        if (this.player) {
            console.log('Player already exists, skipping creation');
            return;
        }

        console.log('Creating player at exact coordinates:', x, y);
        this.player = new Player(this, x, y);
        this.add.existing(this.player);
        this.physics.add.existing(this.player);
        
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

    cleanup() {
        super.cleanup();
        
        // Clean up managers
        if (this.enemyManager) this.enemyManager.cleanup();
        if (this.effectsManager) this.effectsManager.cleanup();
        if (this.hazardManager) this.hazardManager.cleanup();
        if (this.bulletPool) this.bulletPool.destroy();
        
        // Clean up physics groups
        if (this.enemies) this.enemies.clear(true, true);
        
        // Clear loaded sections
        this.loadedSections.clear();
        this.activeEntities.clear();
    }
}
