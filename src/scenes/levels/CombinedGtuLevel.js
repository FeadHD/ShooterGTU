import { BaseScene } from '../elements/BaseScene';
import { CollisionManager } from '../../modules/managers/CollisionManager';
import { TextStyleManager } from '../../modules/managers/TextStyleManager';
import { GameUI } from '../elements/GameUI';
import { TransitionScreen } from '../elements/TransitionScreen';
import { Enemy } from '../../prefabs/Enemy';
import MeleeWarrior from '../../prefabs/MeleeWarrior';
import { AlarmTrigger } from '../../prefabs/AlarmTrigger';
import { MusicManager } from '../../modules/managers/audio/MusicManager';
import { Bitcoin } from '../../prefabs/Bitcoin';
import { Slime } from '../../prefabs/Slime';
import Drone from '../../prefabs/Drone';
import Trampoline from '../../prefabs/Trampoline';
import { Trap } from '../../prefabs/Trap';
import { TrapManager } from '../../modules/managers/TrapManager';
import { DestructibleBlock } from '../../prefabs/DestructibleBlock';
import { FallingDestructibleBlock } from '../../prefabs/FallingDestructibleBlock';
import { DisappearingPlatform } from '../../prefabs/DisappearingPlatform';
import { Turret } from '../../prefabs/Turret';
import { EnemyManager } from '../../modules/managers/EnemyManager';
import { EffectsManager } from '../../modules/managers/EffectsManager';
import { BulletPool } from '../../modules/managers/pools/BulletPool';
import { GameConfig } from '../../config/GameConfig';
import { CombinedLevelCamera } from '../../modules/managers/CombinedLevelCamera';
import { LDTKTileManager } from '../../modules/managers/LDTKTileManager';
import { Player } from '../../prefabs/Player';

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
    }

    preload() {
        super.preload();
        
        // Load tileset with correct path
        this.load.image('GtuTileset', 'assets/levels/image/GtuTileset.png');
        
        // Load level data
        this.load.json('combined-level', 'assets/levels/Json/TestGTU.ldtk');
        
        // Load character sprites and animations
        this.load.image('character_idle', 'assets/character/character_Idle.png');
        this.load.image('character_jump', 'assets/character/character_Jump.png');
        this.load.image('character_crouch', 'assets/character/character_Crouch.png');
        this.load.image('character_death', 'assets/character/character_Death.png');
        this.load.image('character_rollover', 'assets/character/character_Rollover.png');
        this.load.image('character_walking', 'assets/character/character_Walking.png');
        
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

        // Create physics groups
        this.platforms = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        
        // Set up game dimensions
        this.singleLevelWidth = 1280; // Updated level width
        this.totalLevels = 3;
        const levelWidth = this.singleLevelWidth * this.totalLevels;
        const levelHeight = 720;
        const worldHeight = 320; // New world height for physics boundaries

        // Initialize managers
        this.cameraManager = new CombinedLevelCamera(this, levelWidth, levelHeight);
        this.collisionManager = new CollisionManager(this);
        this.enemyManager = new EnemyManager(this);
        this.effectsManager = new EffectsManager(this);
        this.tileManager = new LDTKTileManager(this);
        
        // Create the base tilemap
        this.map = this.make.tilemap({
            width: Math.ceil(levelWidth / 32),
            height: Math.ceil(worldHeight / 32), // Use world height for tilemap
            tileWidth: 32,
            tileHeight: 32
        });

        // Add the tileset
        this.tileset = this.map.addTilesetImage('GtuTileset');
        if (!this.tileset) {
            console.error('Failed to load tileset GtuTileset');
            return;
        }

        // Create platform layer
        this.platformLayer = this.map.createBlankLayer('Platforms', this.tileset);
        if (!this.platformLayer) {
            console.error('Failed to create platform layer');
            return;
        }

        // Set collision for all tiles in the Solid layer
        // These are the tile IDs we've seen in the LDTK file for solid tiles
        const solidTileIds = [
            257, 258,  // Basic ground and platform
            642, 643, 644, 645,  // Platform variations
            705, 706, 707, 708, 709  // Ground variations
        ];
        this.platformLayer.setCollision(solidTileIds, true);

        // Reset current level to 0
        this.currentLevel = 0;

        // Load initial level
        this.loadLevelData(0);
        
        // Initialize UI
        this.setupUI();

        // Set world bounds to match actual level dimensions
        this.physics.world.setBounds(0, 0, levelWidth, worldHeight);
        
        console.log('Scene creation complete');

        // Add debug graphics for boundaries
        this.boundaryGraphics = this.add.graphics();
        this.boundaryGraphics.setDepth(1000); // Make sure it's visible above other elements
        
        // Draw world boundaries in red
        this.boundaryGraphics.lineStyle(4, 0xff0000, 1);
        this.boundaryGraphics.strokeRect(0, 0, levelWidth, worldHeight);
        
        // Draw camera boundaries in blue
        this.boundaryGraphics.lineStyle(4, 0x0000ff, 1);
        const cameraBounds = this.cameras.main.getBounds();
        this.boundaryGraphics.strokeRect(
            cameraBounds.x,
            cameraBounds.y,
            cameraBounds.width,
            cameraBounds.height
        );
    }

    loadLevelData(levelIndex) {
        const levelData = this.cache.json.get('combined-level');
        if (!levelData || !levelData.levels || !levelData.levels[levelIndex]) {
            console.error('Failed to load level data for level', levelIndex);
            return;
        }

        const level = levelData.levels[levelIndex];
        console.log(`Loading level ${levelIndex} data at world position: ${level.worldX}px, ${level.worldY}px`);
        
        // Create hitboxes for the level tiles
        this.tileManager.createTileHitboxes(level, level.worldX, level.worldY);
        
        // Add collisions for player if it exists
        if (this.player) {
            this.tileManager.addCollider(this.player);
        }
        
        // Add collisions for enemies group
        this.tileManager.addCollider(this.enemies);
        
        // Process each layer
        level.layerInstances.forEach(layerInstance => {
            console.log('Processing layer:', layerInstance.__identifier);
            
            if (layerInstance.__identifier === 'Solid') {
                // Handle auto-layer tiles (these are all solid since they're in the Solid layer)
                if (layerInstance.autoLayerTiles) {
                    layerInstance.autoLayerTiles.forEach(tile => {
                        const worldX = Math.floor((tile.px[0] + level.worldX) / 32);
                        const worldY = Math.floor((tile.px[1] + level.worldY) / 32);
                        const tileId = tile.t;
                        
                        // Place the tile and ensure it has collision
                        const placedTile = this.platformLayer.putTileAt(tileId, worldX, worldY);
                        if (placedTile) {
                            placedTile.setCollision(true);
                            placedTile.properties = { ...placedTile.properties, isSolid: true };
                        }
                    });
                }

                // Process IntGrid values for additional collision areas
                const width = layerInstance.__cWid;
                const height = layerInstance.__cHei;
                const csv = layerInstance.intGridCsv;

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const idx = y * width + x;
                        const value = csv[idx];
                        
                        if (value > 0) {
                            const worldX = Math.floor((x * 32 + level.worldX) / 32);
                            const worldY = Math.floor((y * 32 + level.worldY) / 32);
                            
                            // Ensure any tile in this position has collision
                            const tile = this.platformLayer.getTileAt(worldX, worldY);
                            if (tile) {
                                tile.setCollision(true);
                                tile.properties = { ...tile.properties, isSolid: true };
                            }
                        }
                    }
                }
            } else if (layerInstance.__identifier === 'Entities') {
                if (layerInstance.entityInstances) {
                    layerInstance.entityInstances.forEach(entity => {
                        if (entity.__identifier === 'PlayerStart') {
                            console.log('Found PlayerStart at:', entity.__worldX, entity.__worldY);
                            if (!this.player) {
                                this.player = new Player(this, entity.__worldX, entity.__worldY);
                                this.add.existing(this.player);
                                this.physics.add.existing(this.player);
                                this.player.body.setCollideWorldBounds(true);
                                
                                if (this.cameraManager) {
                                    this.cameraManager.followPlayer(this.player);
                                }
                            }
                        }
                    });
                }
            }
        });

        // Set camera bounds based on actual level dimensions
        if (this.cameraManager) {
            const bounds = {
                x: level.worldX,
                y: level.worldY,
                width: level.pxWid,
                height: level.pxHei
            };
            this.cameraManager.camera.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
        }
    }

    bufferNextLevel() {
        const nextLevel = this.currentLevel + 1;
        if (nextLevel > 2) return;

        console.log(`Buffering level ${nextLevel}`);
        this.loadLevelData(nextLevel);
    }

    getLayerDepth(identifier) {
        const depths = {
            'Background': 0,
            'Platforms': 1,
            'Decorations': 2
        };
        return depths[identifier] || 0;
    }
    
    processEntities(layer) {
        if (!layer || !layer.entityInstances) return;

        layer.entityInstances.forEach(entity => {
            if (entity.__identifier === 'PlayerStart') {
                console.log('Found PlayerStart at:', entity.__worldX, entity.__worldY);
                // Create player using the Player class
                if (!this.player) {
                    this.player = new Player(this, entity.__worldX, entity.__worldY);
                    this.add.existing(this.player);
                    this.physics.add.existing(this.player);
                    this.player.body.setCollideWorldBounds(true);
                    
                    // Set up camera to follow player
                    if (this.cameraManager) {
                        this.cameraManager.followPlayer(this.player);
                    }
                }
            } else if (entity.__identifier === 'Enemy') {
                const enemy = new Enemy(this, entity.__worldX, entity.__worldY);
                this.enemies.add(enemy);
            } else if (entity.__identifier === 'MeleeWarrior') {
                const warrior = new MeleeWarrior(this, entity.__worldX, entity.__worldY);
                this.enemies.add(warrior);
            } else if (entity.__identifier === 'Slime') {
                const slime = new Slime(this, entity.__worldX, entity.__worldY);
                this.enemies.add(slime);
            } else if (entity.__identifier === 'Drone') {
                const drone = new Drone(this, entity.__worldX, entity.__worldY);
                this.enemies.add(drone);
            } else if (entity.__identifier === 'Turret') {
                const turret = new Turret(this, entity.__worldX, entity.__worldY);
                this.enemies.add(turret);
            } else if (entity.__identifier === 'Trap') {
                const trap = new Trap(this, entity.__worldX, entity.__worldY);
                this.enemies.add(trap);
            } else if (entity.__identifier === 'Trampoline') {
                new Trampoline(this, entity.__worldX, entity.__worldY);
            } else if (entity.__identifier === 'DestructibleBlock') {
                new DestructibleBlock(this, entity.__worldX, entity.__worldY);
            } else if (entity.__identifier === 'DisappearingPlatform') {
                new DisappearingPlatform(this, entity.__worldX, entity.__worldY);
            } else if (entity.__identifier === 'Bitcoin') {
                new Bitcoin(this, entity.__worldX, entity.__worldY);
            } else {
                console.warn('Unknown entity type:', entity.__identifier);
            }
        });
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

    setupUI() {
        // Initialize game UI
        this.gameUI = new GameUI(this);
        this.gameUI.container.setScrollFactor(0);
        this.gameUI.updateCameraIgnoreList();

        // Set up initial player HP
        const INITIAL_HP = 100; // Default HP if config not available
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

        // Set up the combined level structure
        this.setupCombinedLevel();
        this.setupCheckpoints();

        // Show start message
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
                this.effectsManager.createHitEffect(player.x, player.y, 0xff0000); // Red color for damage
                this.effectsManager.playSound('hit');
            }
            
            // Make player temporarily invulnerable
            player.invulnerableUntil = this.time.now + 1000; // 1 second of invulnerability
            
            // Check for game over
            if (newHP <= 0) {
                this.handlePlayerDeath();
            }
        }
    }

    handlePlayerDeath() {
        // TO DO: Implement game over logic
    }

    setupCombinedLevel() {
        const tileWidth = this.scale.width;
        const tileHeight = this.scale.height;

        // Create level sections
        this.levelSections = {
            // Level 0 (Tiles 0,0 and 1,0)
            level0: [
                {
                    x: 0,
                    y: 0,
                    setup: () => this.setupLevel0Tile1()
                },
                {
                    x: tileWidth,
                    y: 0,
                    setup: () => this.setupLevel0Tile2()
                }
            ],
            // Level 1 (Tiles 0,1 and 1,1)
            level1: [
                {
                    x: 0,
                    y: tileHeight,
                    setup: () => this.setupLevel1Tile1()
                },
                {
                    x: tileWidth,
                    y: tileHeight,
                    setup: () => this.setupLevel1Tile2()
                }
            ],
            // Level 2 (Tiles 0,2 and 1,2)
            level2: [
                {
                    x: 0,
                    y: tileHeight * 2,
                    setup: () => this.setupLevel2Tile1()
                },
                {
                    x: tileWidth,
                    y: tileHeight * 2,
                    setup: () => this.setupLevel2Tile2()
                }
            ]
        };

        // Set up all level sections
        Object.values(this.levelSections).flat().forEach(tile => tile.setup());
    }

    setupCheckpoints() {
        // Add checkpoints at the transition points between levels
        const { width, height } = this.scale;
        
        // Checkpoint for Level 0
        this.checkpoints.set(0, {
            x: width / 2,
            y: height * 0.8,
            level: 0
        });

        // Checkpoint for Level 1
        this.checkpoints.set(1, {
            x: width / 2,
            y: height * 1.8,
            level: 1
        });

        // Checkpoint for Level 2
        this.checkpoints.set(2, {
            x: width / 2,
            y: height * 2.8,
            level: 2
        });

        // Create checkpoint markers
        this.checkpoints.forEach((checkpoint, level) => {
            const marker = this.add.sprite(checkpoint.x, checkpoint.y, 'spark');
            marker.setScale(2);
            marker.setTint(0x00ff00);
            
            // Add pulsing effect
            this.tweens.add({
                targets: marker,
                alpha: 0.5,
                yoyo: true,
                repeat: -1,
                duration: 1000
            });
        });
    }

    // Platform creation methods
    createPlatform(x, y, width, height) {
        const platform = this.add.rectangle(x, y, width, height, 0x00ff00);
        this.physics.add.existing(platform, true);
        platform.body.allowGravity = false;
        platform.body.immovable = true;
        this.platforms.add(platform);
        return platform;
    }

    createTrampoline(x, y) {
        const trampoline = new Trampoline(this, x, y);
        return trampoline;
    }

    createDestructibleBlock(x, y) {
        const block = new DestructibleBlock(this, x, y);
        return block;
    }

    createDisappearingPlatform(x, y) {
        const platform = new DisappearingPlatform(this, x, y);
        return platform;
    }

    // Enemy creation methods
    createSlime(x, y) {
        const slime = new Slime(this, x, y);
        // Slime class creates its own sprite internally
        if (slime.sprite) {
            this.enemies.add(slime.sprite);
        }
        return slime;
    }

    createMeleeWarrior(x, y) {
        const warrior = new MeleeWarrior(this, x, y);
        // MeleeWarrior class creates its own sprite internally
        if (warrior.sprite) {
            this.enemies.add(warrior.sprite);
        }
        return warrior;
    }

    createDrone(x, y) {
        const drone = new Drone(this, x, y);
        // Drone class creates its own sprite internally
        if (drone.sprite) {
            this.enemies.add(drone.sprite);
        }
        return drone;
    }

    createTurret(x, y) {
        const turret = new Turret(this, x, y);
        // Turret is itself a sprite
        this.add.existing(turret);
        this.enemies.add(turret);
        return turret;
    }

    createTrap(x, y) {
        const trap = new Trap(this, x, y);
        // Check if trap has a sprite property or is itself a sprite
        if (trap.sprite) {
            this.hazards.add(trap.sprite);
        } else {
            this.hazards.add(trap);
        }
        return trap;
    }

    // Level 0 tile setups
    setupLevel0Tile1() {
        this.createPlatform(100, 300, 200, 20);
        this.createSlime(150, 250);
    }

    setupLevel0Tile2() {
        this.createPlatform(this.scale.width + 100, 400, 200, 20);
        this.createMeleeWarrior(this.scale.width + 150);
    }

    // Level 1 tile setups
    setupLevel1Tile1() {
        const y = this.scale.height;
        this.createPlatform(200, y + 350, 200, 20);
        this.createTrampoline(200, y + 280);
        this.createSlime(150, y + 250);
    }

    setupLevel1Tile2() {
        const x = this.scale.width;
        const y = this.scale.height;
        this.createPlatform(x + 150, y + 300, 200, 20);
        this.createDrone(x + 450, y + 150);
    }

    // Level 2 tile setups
    setupLevel2Tile1() {
        const y = this.scale.height * 2;
        this.createPlatform(150, y + 300, 200, 20);
        this.createPlatform(400, y + 200, 200, 20);
        this.createMeleeWarrior(200, y + 250);
    }

    setupLevel2Tile2() {
        const x = this.scale.width;
        const y = this.scale.height * 2;
        this.createPlatform(x + 200, y + 350, 300, 20);
        this.createDrone(x + 300, y + 200);
        this.createTurret(x + 150, y + 200);
    }

    update(time, delta) {
        super.update(time, delta);
        
        if (this.player && this.cameraManager) {
            // Check for level transition
            if (!this.isTransitioning) {
                const playerX = this.player.x;
                const currentLevelEnd = (this.currentLevel + 1) * this.singleLevelWidth;
                const transitionThreshold = 100; // pixels before level end to trigger transition

                // Check if player is near the end of current level
                if (playerX > currentLevelEnd - transitionThreshold) {
                    this.isTransitioning = true;
                    this.loadNextLevel();
                }
            }
        }
        
        // Update boundary visualization
        if (this.boundaryGraphics) {
            this.boundaryGraphics.clear();
            
            // Draw world boundaries in red
            this.boundaryGraphics.lineStyle(4, 0xff0000, 1);
            this.boundaryGraphics.strokeRect(0, 0, this.singleLevelWidth * this.totalLevels, 320);
            
            // Draw camera boundaries in blue
            this.boundaryGraphics.lineStyle(4, 0x0000ff, 1);
            const cameraBounds = this.cameras.main.getBounds();
            this.boundaryGraphics.strokeRect(
                cameraBounds.x,
                cameraBounds.y,
                cameraBounds.width,
                cameraBounds.height
            );

            // Log camera bounds for debugging
            console.log('Camera bounds:', cameraBounds);
        }
    }

    loadNextLevel() {
        const nextLevel = this.currentLevel + 1;
        if (nextLevel >= this.totalLevels) {
            this.isTransitioning = false;
            return; // Don't load if we're at the last level
        }

        console.log(`Loading level ${nextLevel}`);

        // Calculate new camera and world bounds
        const worldBounds = {
            x: 0,
            y: 0,
            width: this.singleLevelWidth * this.totalLevels,
            height: 320
        };

        const cameraBounds = {
            x: nextLevel * this.singleLevelWidth,
            y: 0,
            width: this.singleLevelWidth,
            height: 720
        };

        // Update physics world bounds
        this.physics.world.setBounds(
            worldBounds.x,
            worldBounds.y,
            worldBounds.width,
            worldBounds.height
        );

        // Start camera transition
        if (this.cameraManager && this.cameraManager.camera) {
            // Smoothly pan to new position
            this.cameras.main.pan(
                cameraBounds.x + (this.singleLevelWidth / 2), // Center of new level
                this.cameras.main.scrollY,
                1000, // Duration in ms
                'Sine.easeInOut'
            );

            // Update camera bounds after pan
            this.time.delayedCall(1000, () => {
                this.cameraManager.camera.setBounds(
                    cameraBounds.x,
                    cameraBounds.y,
                    cameraBounds.width,
                    cameraBounds.height
                );
                
                // Load the new level data
                this.loadLevelData(nextLevel);
                
                // Update level indicator
                if (this.levelIndicatorText) {
                    this.levelIndicatorText.setText(`Level ${nextLevel}`);
                }

                // Update current level
                this.currentLevel = nextLevel;
                
                // Clear old level hitboxes and create new ones
                if (this.tileManager) {
                    this.tileManager.clearHitboxes();
                    const levelData = this.cache.json.get('combined-level');
                    if (levelData && levelData.levels[nextLevel]) {
                        this.tileManager.createTileHitboxes(
                            levelData.levels[nextLevel],
                            levelData.levels[nextLevel].worldX,
                            levelData.levels[nextLevel].worldY
                        );
                        // Re-add colliders
                        if (this.player) {
                            this.tileManager.addCollider(this.player);
                        }
                        this.tileManager.addCollider(this.enemies);
                    }
                }

                // Update boundary visualization
                if (this.boundaryGraphics) {
                    this.boundaryGraphics.clear();
                    
                    // Draw world boundaries in red
                    this.boundaryGraphics.lineStyle(4, 0xff0000, 1);
                    this.boundaryGraphics.strokeRect(
                        worldBounds.x,
                        worldBounds.y,
                        worldBounds.width,
                        worldBounds.height
                    );
                    
                    // Draw camera boundaries in blue
                    this.boundaryGraphics.lineStyle(4, 0x0000ff, 1);
                    this.boundaryGraphics.strokeRect(
                        cameraBounds.x,
                        cameraBounds.y,
                        cameraBounds.width,
                        cameraBounds.height
                    );
                }

                // Reset transition flag
                this.isTransitioning = false;
                console.log(`Transition to level ${this.currentLevel} complete`);
                this.onLevelChange();
            });
        }
    }

    onLevelChange() {
        // Update music if music manager exists
        if (this.musicManager) {
            this.musicManager.stop();
            const music = this.sound.add('bgMusic', { 
                loop: true, 
                volume: Math.max(0.4, 1 - (this.currentLevel * 0.2)) 
            });
            this.musicManager.setCurrentMusic(music);
            this.musicManager.play();
        }
        
        // Save checkpoint
        this.saveCheckpoint();
    }

    saveCheckpoint() {
        const checkpoint = {
            level: this.currentLevel,
            playerState: {
                x: this.player.x,
                y: this.player.y,
                health: this.registry.get('playerHP')
            }
        };
        
        this.checkpoints.set(this.currentLevel, checkpoint);
        console.log('Saved checkpoint for level', this.currentLevel);
    }
}
