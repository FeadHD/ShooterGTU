import { BaseScene } from '../elements/BaseScene';
import { GameConfig } from '../../config/GameConfig';
import CameraManager from '../../modules/managers/CameraManager';
import { CollisionManager } from '../../modules/managers/CollisionManager';
import { TextStyleManager } from '../../modules/managers/TextStyleManager';
import { UIManager } from '../elements/UIManager';
import { TransitionScreen } from '../elements/TransitionScreen';
import { Enemy } from '../../prefabs/Enemy';
import MeleeWarrior from '../../prefabs/MeleeWarrior';
import { AlarmTrigger } from '../../prefabs/AlarmTrigger';
import AudioManager from '../../modules/managers/AudioManager';
import { Bitcoin } from '../../prefabs/Bitcoin';
import { Slime } from '../../prefabs/Slime';
import Drone from '../../prefabs/Drone';
import Trampoline from '../../prefabs/Trampoline';
import { Trap } from '../../prefabs/Trap';
import { TrapManager } from '../../modules/managers/TrapManager';
import { EnemyManager } from '../../modules/managers/entities/EnemyManager';
import { EffectsManager } from '../../modules/managers/EffectsManager';
import { BulletPool } from '../../modules/managers/pools/BulletPool';
import { Player } from '../../prefabs/Player';
import { AntivirusWall } from '../../prefabs/AntivirusWall';
import { Ramp } from '../../prefabs/Ramp.js';
import { ManagerFactory } from '../../modules/di/ManagerFactory';
import { DestructibleBlock } from '../../prefabs/DestructibleBlock';
import { FallingDestructibleBlock } from '../../prefabs/FallingDestructibleBlock';
import { DisappearingPlatform } from '../../prefabs/DisappearingPlatform';
import { Turret } from '../../prefabs/Turret';

export class GameScene1 extends BaseScene {
    constructor() {
        super({ 
            key: 'GameScene1',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 300 },
                    debug: false
                },
                matter: {
                    gravity: { y: 0.5 },
                    debug: false
                }
            }
        });
        this.tileColliderAdded = false;
        this.messageShown = false;
        this.totalEnemies = 7; // Increased to include drone and melee warriors
        this.remainingEnemies = this.totalEnemies;
        this.drone = null; // Add drone reference
    }

    preload() {
        super.preload();
        
        // Load turret laser sound
        this.load.audio('turretLaser', 'assets/sounds/laser.wav');
        
        // Load all audio files
        this.load.audio('laser', 'assets/sounds/laser.wav');
        this.load.audio('hit', 'assets/sounds/hit.wav');
        this.load.audio('victoryMusic', 'assets/sounds/congratulations');
        this.load.audio('bgMusic', 'assets/audio/bgMusic.wav');
        this.load.audio('alarm', '/assets/sounds/alarm.wav');  // Add alarm sound with correct path

        // Load spark particle for trampoline
        this.load.image('spark', 'assets/particles/spark.png');

        // Load particle texture for lava wall
        this.load.atlas('flares', 'assets/particles/flares.png', 'assets/particles/flares.json');

        // Load tileset with error handling
        this.load.on('loaderror', (file) => {
            console.error('Error loading file:', file.src);
        });

        // Load tileset
        this.load.image('megapixel', 'assets/levels/image/WannabeeTileset.png');
        
        // Load level data
        this.load.json('level1', 'assets/levels/Json/G1S1v1f.json');
    }

    create() {
        // Initialize transition screen first
        this.transitionScreen = new TransitionScreen(this);
        
        // Start transition
        this.transitionScreen.start(() => {
            // After transition completes, continue with scene setup
            super.create();
            
            const { width, height } = this.scale;

            // Set initial game state
            this.gameStarted = false;
            
            // Create managers first
            this.managers = ManagerFactory.createManagers(this);
            
            // Initialize UI right away
            this.gameUI = this.managers.ui;
            
            // Initialize camera manager
            this.cameraManager = new CameraManager(this);
            this.cameraManager.init(this.player);
            this.cameraManager.playIntroSequence(this.player);

            // Add space key binding to skip intro
            this.skipKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            this.skipKey.on('down', () => {
                if (!this.gameStarted && this.cameraManager && this.cameraManager.isIntroPlaying) {
                    this.cameraManager.stopIntroSequence();
                    this.startGame();
                }
            });
            
            // Set initial registry values
            this.registry.set('score', 0);
            this.registry.set('lives', 3);
            this.registry.set('playerHP', 100);
            this.registry.set('stamina', 100);
            this.registry.set('bitcoins', 0);

            // Initialize update event for UI
            this.events.on('update', () => {
                if (this.gameUI) {
                    const score = this.registry.get('score') || 0;
                    const lives = this.registry.get('lives') || 3;
                    const hp = this.registry.get('playerHP') || 100;
                    const bitcoins = this.registry.get('bitcoins') || 0;
                    
                    this.gameUI.updateScore(score);
                    this.gameUI.updateLives(lives);
                    this.gameUI.updateHP(hp);
                    this.gameUI.updateBitcoins(bitcoins);
                }
            });
            
            // Initialize debug system if not already initialized
            if (!this.debugSystem) {
                this.debugSystem = {
                    enabled: false,
                    toggle: () => {
                        this.debugSystem.enabled = !this.debugSystem.enabled;
                    }
                };
            }

            // Get audio manager instance
            this.audioManager = this.managers.audio;

            // Load and play background music
            const bgMusic = this.sound.add('bgMusic', {
                loop: true,
                volume: this.registry.get('musicVolume') ?? 1
            });
            this.audioManager.setCurrentMusic(bgMusic);
            this.audioManager.playMusic();

            // Add registry listener for volume changes
            this.registry.events.on('changedata-musicVolume', (parent, value) => {
                if (this.audioManager) {
                    this.audioManager.setMusicVolume(value);
                }
            });

            // Create raycaster for laser collision detection
            this.raycaster = {
                createRay: (config) => {
                    return {
                        cast: (target) => {
                            if (!target || !target.getBounds) return false;
                            
                            const ray = this.createRay({
                                origin: { x: this.player.x, y: this.player.y },
                                target: { x: target.x, y: target.y }
                            });
                            
                            if (!ray || !ray.start || !ray.end) return false;
                            
                            return this.lineIntersectsRect(ray, target.getBounds());
                        }
                    };
                }
            };

            // Add ESC key for pause menu
            this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
            this.pauseKey.on('down', () => {
                if (!this.gameStarted) {
                    // Skip intro if game hasn't started
                    if (this.cameraManager && this.cameraManager.isIntroPlaying) {
                        this.cameraManager.stopIntroSequence();
                    }
                    this.startGame();
                } else {
                    // Normal pause functionality if game is running
                    this.pauseGame();
                }
            });

            // Game paused flag
            this.isGamePaused = false;

            // Define initial spawn position (near the left side of the level)
            const SPAWN_X_PERCENTAGE = 0.1;  // 10% from left edge
            const SPAWN_Y = 500;             // Fixed height from top
            
            // Override base scene's spawn point for this level
            this.playerSpawnPoint = {
                x: width * SPAWN_X_PERCENTAGE,
                y: SPAWN_Y
            };
            
            // Set player position to spawn point
            this.player.setPosition(this.playerSpawnPoint.x, this.playerSpawnPoint.y);
            
            // Set world bounds to match the level size
            const levelWidth = 3840; // Adjust this to match your level width
            const levelHeight = 1080; // Adjust this to match your level height
            this.physics.world.setBounds(0, 0, levelWidth, levelHeight);
            
            // Set camera bounds to match world bounds
            this.cameras.main.setBounds(0, 0, levelWidth, levelHeight);
            
            // Set next scene
            this.nextSceneName = 'GameScene2';
            
            // Set up the main game camera
            this.cameras.main.setZoom(1.5);
            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

            // Initialize collision manager
            this.collisionManager = new CollisionManager(this);

            // Initialize slimes group
            this.slimes = this.physics.add.group({
                collideWorldBounds: true,
                bounceX: 0.5,
                bounceY: 0.2,
                dragX: 200
            });

            // Initialize drones group with consistent physics settings
            this.drones = this.physics.add.group({
                runChildUpdate: true,
                collideWorldBounds: true,
                dragX: 200,
                bounceX: 0.2,
                bounceY: 0.2,
                gravityY: 0
            });

            // Create enemy group
            this.enemies = this.physics.add.group({
                collideWorldBounds: true,
                bounceX: 0.5,
                bounceY: 0.2,
                dragX: 200
            });

            // Set up collisions between enemies and platforms
            this.physics.add.collider(this.enemies, this.platforms);
            
            // Set up collisions between enemies and each other
            this.physics.add.collider(this.enemies, this.enemies, this.handleEnemyCollision, null, this);
            
            // Set up collisions between enemies and player
            this.physics.add.overlap(this.enemies, this.player, (enemySprite, player) => {
                if (enemySprite.enemy && !this.isDying) {
                    this.managers.collisions.handlePlayerEnemyOverlap(player, enemySprite);
                }
            }, null, this);

            // Create bitcoin group
            this.bitcoins = this.add.group();

            // Create player if it doesn't exist
            if (!this.player) {
                this.createPlayer(this.scale.width);
                // Disable player controls initially
                this.player.controller.enabled = false;
            }

            // Initialize alarm triggers group
            this.alarmTriggers = this.physics.add.staticGroup({
                classType: AlarmTrigger,
                runChildUpdate: true
            });
            

            // Set up alarm trigger collision
            this.physics.add.overlap(
                this.player,
                this.alarmTriggers,
                (player, trap) => {
                    trap.triggerAlarm();
                }
            );

            // Add a ramp on top of a tile
            const rampX = 15 * 32; // 15 tiles from the left
            const rampY = 14 * 32; // 14 tiles from the top
            this.ramp = new Ramp(this, rampX, rampY, 64, 32);

            // Debug level data loading
            const levelData = this.cache.json.get('level1');
            
            if (!levelData) {
                console.error('Failed to load level data');
                return;
            }

            // Get the layer instance for Megapixel layer
            const megapixelLayer = levelData.layerInstances[0];  // First layer is our Megapixel layer
            if (!megapixelLayer) {
                console.error('Megapixel layer not found');
                return;
            }

            // Create tilemap from JSON using level dimensions
            const map = this.make.tilemap({ 
                width: Math.ceil(levelData.pxWid / megapixelLayer.__gridSize),
                height: Math.ceil(levelData.pxHei / megapixelLayer.__gridSize),
                tileWidth: megapixelLayer.__gridSize,
                tileHeight: megapixelLayer.__gridSize
            });
            
            // Add tileset to map
            const tileset = map.addTilesetImage('megapixel', 'megapixel', 32, 32, 0, 0);
            
            if (!tileset) {
                console.error('Failed to create tileset');
                return;
            }
            
            // Create layer from LDtk data
            const layer = map.createBlankLayer('Megapixel', tileset, 0, 0);
            
            if (!layer) {
                console.error('Failed to create layer');
                return;
            }

            // Store layer and map references
            this.mapLayer = layer;
            this.map = map;

            // Create a promise to track tile placement
            const placeTilesPromise = new Promise((resolve) => {
                if (megapixelLayer.gridTiles && megapixelLayer.gridTiles.length > 0) {
                    let tilesPlaced = 0;
                    const totalTiles = megapixelLayer.gridTiles.length;
                    const totalRows = Math.ceil(levelData.pxHei / megapixelLayer.__gridSize);

                    // Create a map to track platform tiles
                    const platformTiles = new Set();

                    // First pass: identify platform tiles
                    megapixelLayer.gridTiles.forEach((tile) => {
                        const gridX = Math.floor(tile.px[0] / megapixelLayer.__gridSize);
                        const gridY = Math.floor(tile.px[1] / megapixelLayer.__gridSize);
                        if (gridY === 8 || tile.t === 370) { // Platform height or solid tile type
                            platformTiles.add(`${gridX},${gridY}`);
                        }
                    });

                    // Second pass: place tiles and set up collisions
                    megapixelLayer.gridTiles.forEach((tile) => {
                        const gridX = Math.floor(tile.px[0] / megapixelLayer.__gridSize);
                        const gridY = Math.floor(tile.px[1] / megapixelLayer.__gridSize);
                        
                        try {
                            // Place the tile at the grid coordinates
                            const placedTile = layer.putTileAt(tile.t, gridX, gridY);
                            
                            // Check if this tile is in the bottom two rows
                            if (gridY >= totalRows - 2) {
                                // Add collision for bottom tiles
                                placedTile.setCollision(true);
                                
                                // Create collision rectangle for this tile
                                const tileRect = this.add.rectangle(
                                    gridX * megapixelLayer.__gridSize + megapixelLayer.__gridSize/2,
                                    gridY * megapixelLayer.__gridSize + megapixelLayer.__gridSize/2,
                                    megapixelLayer.__gridSize,
                                    megapixelLayer.__gridSize
                                );
                                tileRect.setVisible(false);  // Hide the rectangle by default
                                this.physics.add.existing(tileRect, true);
                                this.platforms.add(tileRect);
                            }

                            // Set collision for tiles with ID between 400 and 500
                            if (tile.t >= 400 && tile.t <= 500) {
                                placedTile.setCollision(true);
                                
                                // Create collision rectangle for solid tiles
                                const solidRect = this.add.rectangle(
                                    gridX * megapixelLayer.__gridSize + megapixelLayer.__gridSize/2,
                                    gridY * megapixelLayer.__gridSize + megapixelLayer.__gridSize/2,
                                    megapixelLayer.__gridSize,
                                    megapixelLayer.__gridSize
                                );
                                solidRect.setVisible(false);  // Hide the rectangle by default
                                this.physics.add.existing(solidRect, true);
                                this.platforms.add(solidRect);
                            }
                            
                            tilesPlaced++;
                            
                            if (tilesPlaced === totalTiles) {
                                resolve();
                            }
                        } catch (error) {
                            console.error('Error placing tile:', {
                                gridX, gridY,
                                px: tile.px,
                                tileId: tile.t,
                                error: error.message
                            });
                            tilesPlaced++;
                            if (tilesPlaced === totalTiles) {
                                resolve();
                            }
                        }
                    });
                } else {
                    resolve();
                }
            });

            // Wait for tiles to be placed before setting up the antivirus wall
            placeTilesPromise.then(() => {
                // Create antivirus wall after tiles are placed
                this.antivirusWall = new AntivirusWall(
                    this,
                    GameConfig.ANTIVIRUS_WALL.START_OFFSET
                );
                
                // Set up collision between antivirus wall and map layer
                if (this.mapLayer && this.antivirusWall && this.antivirusWall.wall) {
                    // Enable collision for all tiles in the layer
                    this.mapLayer.setCollisionByProperty({ collides: true });
                    
                    // Create a custom collision handler for the antivirus wall and tiles
                    this.physics.add.overlap(this.antivirusWall.wall, this.mapLayer, (wall, tile) => {
                        if (this.antivirusWall.movingForward) {
                            // Destroy tiles when moving forward
                            if (tile && tile.index !== -1) {  // -1 is an empty tile
                                // Store just the tile index and position
                                const tileData = {
                                    index: tile.index,
                                    x: tile.x,
                                    y: tile.y
                                };
                                this.antivirusWall.storeTileInfo(tile.x, tile.y, tileData);
                                
                                // Just make the tile invisible instead of removing it
                                tile.setVisible(false);
                                
                                // Create destruction effect
                                if (this.antivirusWall.createDestructionEffect) {
                                    this.antivirusWall.createDestructionEffect(
                                        tile.pixelX + tile.width / 2,
                                        tile.pixelY + tile.height / 2
                                    );
                                }
                            }
                        } else {
                            // Make tiles visible when moving backward
                            if (tile) {
                                tile.setVisible(true);
                                
                                // Create building effect
                                if (this.antivirusWall.createDestructionEffect) {
                                    this.antivirusWall.createDestructionEffect(
                                        tile.pixelX + tile.width / 2,
                                        tile.pixelY + tile.height / 2
                                    );
                                }
                            }
                        }
                    });

                    // Set up collision between player and antivirus wall
                    this.physics.add.overlap(this.player, this.antivirusWall.wall, this.handleAntivirusCollision, null, this);
                }
                
                // Continue with scene setup
                this.setupRestOfScene();
            });

            // Create debug graphics
            this.debugGraphics = this.add.graphics();

            // Remove the duplicate antivirus wall creation and collision setup
            // this.antivirusWall = new AntivirusWall(this, 0); // This line should be removed
            // this.physics.add.overlap(this.player, this.antivirusWall.wall, this.handleAntivirusCollision, null, this); // This line should be removed
        });
    }

    setupRestOfScene() {
        // Initialize managers and UI
        this.gameUI = this.managers.ui;
        this.trapManager = new TrapManager(this);
        this.enemyManager = new EnemyManager(this);
        this.effectsManager = new EffectsManager(this);
        this.bulletPool = new BulletPool(this);

        // Create physics group for enemies if not exists
        if (!this.enemies) {
            this.enemies = this.physics.add.group();
        }

        // Show the start message
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

        // Calculate proper spawn height
        const spawnHeight = this.getSpawnHeight();

        // Create and initialize warriors at proper height
        const createAndInitWarrior = (x) => {
            const spawnHeight = this.getSpawnHeight();
            if (spawnHeight !== null) {
                const warrior = new MeleeWarrior(this, x, spawnHeight);
                if (warrior && warrior.sprite) {
                    // Add to physics group
                    this.enemies.add(warrior.sprite);
                    warrior.sprite.setData('type', 'warrior');
                    warrior.sprite.setData('enemy', warrior);
                    
                    // Add warrior-specific debug data
                    warrior.sprite.setData('health', warrior.maxHealth);
                    warrior.sprite.setData('maxHealth', warrior.maxHealth);
                    warrior.sprite.setData('isAttacking', false);
                    warrior.sprite.setData('direction', warrior.direction);
                    warrior.sprite.setData('detectionRange', warrior.detectionRange);
                    warrior.sprite.setData('attackRange', warrior.attackRange);
                    
                    // Add warrior to enemy manager
                    this.enemyManager.addEnemy(warrior, warrior.sprite, warrior.maxHealth);
                    
                    return warrior;
                }
                return null;
            }
        };

        // Spawn warriors at different x positions
        const warrior1 = createAndInitWarrior(this.scale.width * 0.4);
        const warrior2 = createAndInitWarrior(this.scale.width * 0.6);

        // Create random position warriors
        const numRandomWarriors = 1;
        for (let i = 0; i < numRandomWarriors; i++) {
            const spawnPointsForWarriors = this.findSpawnPointsForSlimes(); // Reuse slime spawn point logic
            if (spawnPointsForWarriors.length > 0) {
                const spawnIndex = Math.floor(Math.random() * spawnPointsForWarriors.length);
                const spawnPoint = spawnPointsForWarriors[spawnIndex];
                createAndInitWarrior(spawnPoint.x);
                spawnPointsForWarriors.splice(spawnIndex, 1);
            }
        }

        // Create collision manager after enemies are created
        this.collisionManager = new CollisionManager(this);
        this.collisionManager.setupCollisions();

        // Spawn bitcoins after map is loaded
        const bitcoinSpawnPoints = this.findSpawnPointsForBitcoins();
        const numBitcoins = Math.min(10, bitcoinSpawnPoints.length);

        // Spawn bitcoins at valid positions
        for (let i = 0; i < numBitcoins; i++) {
            const spawnPoint = bitcoinSpawnPoints[i];
            const bitcoin = new Bitcoin(this, spawnPoint.x, spawnPoint.y);
            this.bitcoins.add(bitcoin);
            this.physics.add.overlap(this.player, bitcoin, () => {
                bitcoin.collect();
            });
        }

        // Spawn drone at the top part of the scene
        if (this.player) {
            const enemyY = this.scale.height * 0.2; // Top 20% of the screen
            const droneX = this.scale.width * 0.6; // Adjust horizontal position as needed

            // Create drone at the spawn point
            const drone = new Drone(this, droneX, enemyY, {
                maxHealth: 75,
                damage: 20,
                speed: 100,
                flyingHeight: enemyY,
                horizontalMovementRange: 100
            });

            // Add drone sprite to the drones group
            this.drones.add(drone.sprite);

            // Add drone to enemy manager
            this.enemyManager.addEnemy(drone, drone.sprite, drone.maxHealth);

            // Set up patrol path
            const patrolPoints = [
                { x: droneX - 200, y: enemyY },  // Left point
                { x: droneX + 200, y: enemyY }   // Right point
            ];
            drone.setPatrolPath(patrolPoints);

            // Add to scene update
            this.events.on('update', () => {
                if (drone && drone.sprite && drone.sprite.active) {
                    drone.update();
                }
            });

            // Store drone reference
            this.drone = drone;
        } else {
            console.warn('Cannot spawn drone: player not found');
        }

        // Create fixed position slimes
        const enemyY = this.scale.height * 0.7;

        const createAndInitSlime = (x, y) => {
            const slime = new Slime(this, x, y);
            if (slime && slime.sprite) {
                // Add to physics group
                this.slimes.add(slime.sprite);
                
                // Set up sprite
                slime.sprite.setActive(true);
                slime.sprite.setVisible(true);
                
                // Set up physics body
                if (slime.sprite.body) {
                    slime.sprite.body.reset(x, y);
                    slime.sprite.body.enable = true;
                    slime.sprite.body.moves = true;
                }
                
                // Add to enemy manager
                this.enemyManager.addEnemy(slime, slime.sprite, slime.maxHealth);
                
                // Create health bar
                slime.createHealthBar();
                
                // Start movement
                slime.initializeMovement();
                
                // Add update callback
                this.events.on('update', () => {
                    if (slime && slime.sprite && slime.sprite.active) {
                        slime.update();
                        slime.updateHealthBar();
                    }
                });
                
                return slime;
            }
            return null;
        };

        this.enemy1 = createAndInitSlime(this.scale.width * 0.3, enemyY);
        this.enemy2 = createAndInitSlime(this.scale.width * 0.7, enemyY);

        // Create random position slimes
        const numRandomSlimes = 1; 
        for (let i = 0; i < numRandomSlimes; i++) {
            const spawnPointsForSlimes = this.findSpawnPointsForSlimes();
            if (spawnPointsForSlimes.length > 0) {
                const spawnIndex = Math.floor(Math.random() * spawnPointsForSlimes.length);
                const spawnPoint = spawnPointsForSlimes[spawnIndex];
                createAndInitSlime(spawnPoint.x, spawnPoint.y);
                spawnPointsForSlimes.splice(spawnIndex, 1);
            }
        }

        // Set up player-enemy collision for damage
        this.physics.add.overlap(this.player, this.slimes, (player, enemySprite) => {
            if (enemySprite.enemy && !this.isDying) {
                this.managers.collisions.handlePlayerEnemyOverlap(player, enemySprite);
            }
        }, null, this);

        // Add collisions between enemies with increased bounce
        this.physics.add.collider(
            this.slimes,
            this.slimes,
            this.handleEnemyCollision,
            null,
            this
        );

        // Create destructible blocks
        this.destructibleBlocks = this.add.group();
        
        // Add some example destructible blocks
        const block1 = new DestructibleBlock(this, 2600, 466);
        const block2 = new DestructibleBlock(this, 2600, 498);
        const block3 = new DestructibleBlock(this, 2600, 528);
        
        this.destructibleBlocks.add(block1);
        this.destructibleBlocks.add(block2);
        this.destructibleBlocks.add(block3);

        // Set up collision between bullets and destructible blocks
        this.physics.add.collider(this.bullets, this.destructibleBlocks, (bullet, block) => {
            bullet.destroy();
            block.destroy();
        });

        // Set up collision between player and destructible blocks
        this.physics.add.collider(this.player, this.destructibleBlocks);

        // Create falling destructible blocks group
        this.fallingBlocks = this.add.group();

        // Add falling blocks in specific positions
        const fallingBlockPositions = [
            { x: 2368, y: 402 },
            { x: 2368, y: 434 },
            { x: 2368, y: 466 },
            { x: 2368, y: 498 },
            { x: 2368, y: 528 },
            { x: 2400, y: 402 },
            { x: 2400, y: 434 },
            { x: 2400, y: 466 },
            { x: 2400, y: 498 },
            { x: 2400, y: 528 }
        ];

        // Create each falling block at its position
        fallingBlockPositions.forEach(pos => {
            const block = new FallingDestructibleBlock(this, pos.x, pos.y);
            this.fallingBlocks.add(block);
        });

        // Set up collision between bullets and falling blocks
        this.physics.add.collider(this.bullets, this.fallingBlocks, (bullet, block) => {
            bullet.destroy();
            block.destroy();
        });

        // Set up collision between player and falling blocks
        this.physics.add.collider(this.player, this.fallingBlocks);
        
        // Set up collision between falling blocks and platforms
        this.physics.add.collider(this.fallingBlocks, this.platforms);
        
        // Add collision between falling blocks themselves
        this.physics.add.collider(this.fallingBlocks, this.fallingBlocks);

        // Check distance to player every frame for falling blocks
        this.time.addEvent({
            delay: 100, // Check every 100ms
            callback: () => {
                this.fallingBlocks.getChildren().forEach(block => {
                    const distance = Math.abs(this.player.x - block.x);
                    if (distance < 200) {
                        block.startFalling();
                    }
                });
            },
            loop: true
        });

        // Create disappearing platforms
        this.disappearingPlatforms = this.add.group();
        
        // Add some example disappearing platforms
        const platform1 = new DisappearingPlatform(this, 1410, 560);
        const platform2 = new DisappearingPlatform(this, 1482, 560);
        const platform3 = new DisappearingPlatform(this, 1554, 560);
        const platform4 = new DisappearingPlatform(this, 500, 330);
        const platform5 = new DisappearingPlatform(this, 572, 430);
        const platform6 = new DisappearingPlatform(this, 644, 400);
        
        this.disappearingPlatforms.add(platform1);
        this.disappearingPlatforms.add(platform2);
        this.disappearingPlatforms.add(platform3);
        this.disappearingPlatforms.add(platform4);
        this.disappearingPlatforms.add(platform5);
        this.disappearingPlatforms.add(platform6);

        // Set up collision between player and disappearing platforms
        this.physics.add.collider(this.player, this.disappearingPlatforms, (player, platform) => {
            // Only trigger when player is standing on the platform
            if (player.body.touching.down && platform.body.touching.up) {
                platform.disappear();
            }
        });

        // Add turrets
        const turretPositions = [
            { x: 308, y: 384, direction: 'right', rotation: 'ceiling' },  // Ceiling mounted
        ];

        // Create turrets group if it doesn't exist
        if (!this.turrets) {
            this.turrets = this.add.group();
        }

        // Place turrets
        turretPositions.forEach(pos => {
            const turret = new Turret(this, pos.x, pos.y, pos.direction, pos.rotation);
            this.turrets.add(turret);
        });

        // Set up collision between player and turret lasers
        this.physics.add.overlap(this.player, this.turrets.getChildren().map(t => t.lasers), (player, laser) => {
            laser.destroy();
            player.takeDamage(2);
        });

        // Create and set up alarm trigger
        if (!this.alarmTriggers) {
            this.alarmTriggers = this.physics.add.staticGroup();
        }
        
        const alarmTrigger = new AlarmTrigger(this, 308, 528); // Place it below the turret
        this.alarmTriggers.add(alarmTrigger);
        
        // Set up collision between player and alarm trigger
        this.physics.add.overlap(this.player, this.alarmTriggers, (player, trigger) => {
            trigger.triggerAlarm();
        });

        // Create trap at specific location
        if (this.platforms) {
            // Create a new trap at the specified coordinates
            const trap = new Trap(this, 835, 448);
            this.trapManager.traps.add(trap);
            
            // Enable physics for the trap
            this.physics.world.enable(trap);
            trap.body.setCollideWorldBounds(true);
            trap.body.setImmovable(true);
            
            // Add collision with map layer
            this.physics.add.collider(trap, this.mapLayer);
            
            // Set up trap collisions with player
            this.physics.add.overlap(
                this.player,
                this.trapManager.traps,
                (player, trap) => trap.damagePlayer(player)
            );
        }

        // Set initial number of enemies
        this.remainingEnemies = 7;

        // Wait a short moment for platforms to be fully set up
        this.time.delayedCall(100, () => {
            // Calculate spawn height relative to ground
            const enemyY = this.groundTop - 16;  // Same calculation as player spawn

            // Set number of enemies
            this.remainingEnemies = 7;
        });
        
        // Add trampoline at x=735 on top of a solid tile
        // Placing it higher up on the solid platform visible in the screenshot
        this.trampoline = new Trampoline(this, 735, 448);
    }

    findSpawnPointsForSlimes() {
        // Return default spawn points if map is not loaded
        if (!this.map || !this.map.getLayer('Ground')) {
            return [
                { x: 200, y: 300 },
                { x: 400, y: 300 },
                { x: 600, y: 300 }
            ];
        }

        const spawnPoints = [];
        const groundLayer = this.map.getLayer('Ground').tilemapLayer;
        
        // Get the dimensions of the tilemap
        const mapWidth = this.map.width;
        const mapHeight = this.map.height;
        
        // Check each tile position
        for (let x = 0; x < mapWidth; x++) {
            for (let y = 0; y < mapHeight; y++) {
                const tile = groundLayer.getTileAt(x, y);
                if (tile) {
                    // Check if there's ground below this position
                    const tileBelow = groundLayer.getTileAt(x, y + 1);
                    if (tileBelow) {
                        // Add this position as a potential spawn point
                        spawnPoints.push({
                            x: x * this.map.tileWidth,
                            y: y * this.map.tileHeight
                        });
                    }
                }
            }
        }
        return spawnPoints.length > 0 ? spawnPoints : [
            { x: 200, y: 300 },
            { x: 400, y: 300 },
            { x: 600, y: 300 }
        ];
    }

    findSpawnPointsForBitcoins() {
        // Reuse the same logic for bitcoin spawn points
        return this.findSpawnPointsForSlimes();
    }

    startGame() {
        // Stop intro sequence if it's playing
        if (this.cameraManager.isIntroPlaying) {
            this.cameraManager.stopIntroSequence();
        }

        // Enable player controls
        if (this.player) {
            this.player.controller.enabled = true;
        }

        // Start the timer
        this.gameUI.startTimer();

        // Set game as started
        this.gameStarted = true;
        this.isGamePaused = false;
        
        // Delay antivirus wall start by 5 seconds
        this.time.delayedCall(5000, () => {
            if (this.antivirusWall && this.gameStarted && !this.isGamePaused) {
                this.antivirusWall.start();
                
                // Add warning effect
                this.cameras.main.flash(500, 0, 136, 255); // Flash blue
                // You can add a warning sound here if you have one
                // this.sound.play('warning');
            }
        });
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        // Skip if enemy is already being destroyed
        if (!enemySprite.active || !enemySprite.body || !enemySprite.body.enable) {
            bullet.destroy();
            return;
        }
        
        // Use the EnemyManager to handle the bullet hit
        if (this.enemyManager) {
            this.enemyManager.handleBulletHit(bullet, enemySprite);
        }
        
        // Update remaining enemies count
        this.remainingEnemies = Math.max(0, this.remainingEnemies - 1);
    }

    handleEnemyCollision(enemy1, enemy2) {
        // If enemies are moving towards each other, reverse their directions
        if ((enemy1.body.velocity.x > 0 && enemy2.body.velocity.x < 0) ||
            (enemy1.body.velocity.x < 0 && enemy2.body.velocity.x > 0)) {
            
            if (enemy1.enemy) {
                enemy1.enemy.reverseDirection();
                // Add slight upward velocity for better separation
                enemy1.setVelocityY(-150);
            }
            if (enemy2.enemy) {
                enemy2.enemy.reverseDirection();
                // Add slight upward velocity for better separation
                enemy2.setVelocityY(-150);
            }
        }
        
        // Ensure enemies bounce off each other
        const pushForce = 100;
        if (enemy1.x < enemy2.x) {
            enemy1.setVelocityX(-pushForce);
            enemy2.setVelocityX(pushForce);
        } else {
            enemy1.setVelocityX(pushForce);
            enemy2.setVelocityX(-pushForce);
        }
    }

    update(time, delta) {
        // Only update game elements if the game has started
        if (!this.gameStarted) return;

        super.update(time, delta);
        if (this.isGamePaused) return;

        // Update antivirus wall
        if (this.antivirusWall) {
            this.antivirusWall.update(time, delta);
            
            // Check if player is too far behind the antivirus wall
            if (this.player && this.player.x < this.antivirusWall.getX() - 20) {
                this.handleAntivirusCollision();
            }
        }

        // Skip rest of update if player doesn't exist
        if (!this.player) return;

        // Update bullet pool to check for out-of-bounds bullets
        this.bulletPool.update();

        // Update all turrets
        this.turrets.getChildren().forEach(turret => turret.update());

        // Update all enemies
        if (this.enemies) {
            this.enemies.getChildren().forEach(enemySprite => {
                if (enemySprite.getData('type') === 'warrior') {
                    const warrior = enemySprite.getData('enemy');
                    if (warrior) {
                        warrior.update(time, delta);
                    }
                }
            });
        }

        // Update game UI
        if (this.gameUI) {
            this.gameUI.update(time, delta);
        }

        // Update debug visuals if enabled
        this.updateDebugVisuals();

        // Check for scene transition
        const reachedEnd = this.player.x > 3740;
        
        // Check for active slimes based on their health
        const activeSlimes = this.slimes.getChildren().filter(slime => 
            slime.enemy && slime.enemy.health > 0
        );
        const activeSlimeCount = activeSlimes.length;
        const allSlimesDefeated = activeSlimeCount === 0;

        // Debug info
        console.log({
            reachedEnd,
            playerX: this.player.x,
            endX: 3740,
            mapWidth: 3840,
            activeSlimeCount,
            allSlimesDefeated,
            slimeDetails: activeSlimes.map(slime => ({
                health: slime.enemy?.health,
                active: slime.active,
                visible: slime.visible
            }))
        });

        // Transition to next scene if player has reached the end and defeated all slimes
        if (reachedEnd && allSlimesDefeated) {
            this.scene.start('GameScene2');
        }
    }

    updateDebugVisuals() {
        // Clear previous debug graphics
        if (this.debugGraphics) {
            this.debugGraphics.clear();
        }

        // Only show debug visuals if debug system is enabled
        if (this.debugSystem?.enabled) {
            // Draw spawn point indicator
            this.debugGraphics.lineStyle(2, 0x00ff00);  // Green outline
            this.debugGraphics.strokeCircle(this.playerSpawnPoint.x, this.playerSpawnPoint.y, 20);
            
            // Draw X in the center
            this.debugGraphics.lineStyle(2, 0xff0000);  // Red X
            const x = this.playerSpawnPoint.x;
            const y = this.playerSpawnPoint.y;
            this.debugGraphics.beginPath();
            this.debugGraphics.moveTo(x - 10, y - 10);
            this.debugGraphics.lineTo(x + 10, y + 10);
            this.debugGraphics.moveTo(x + 10, y - 10);
            this.debugGraphics.lineTo(x - 10, y + 10);
            this.debugGraphics.strokePath();
            
            // Add "SPAWN" text
            const spawnText = this.add.text(x, y - 30, 'SPAWN', {
                fontSize: '16px',
                fill: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 4, y: 2 }
            });
            spawnText.setOrigin(0.5);
            spawnText.setScrollFactor(1);
            
            // Store the text to remove it later
            if (this.spawnText) {
                this.spawnText.destroy();
            }
            this.spawnText = spawnText;
        } else {
            // Clean up text when debug is disabled
            if (this.spawnText) {
                this.spawnText.destroy();
                this.spawnText = null;
            }
        }
    }

    handleAntivirusCollision() {
        if (this.player && !this.player.isDying) {
            this.player.die();
            
            // Reset antivirus wall when player dies
            if (this.antivirusWall) {
                this.antivirusWall.reset();
            }
        }
    }

    lineIntersectsRect(line, rect) {
        if (!line || !line.start || !line.end || !rect) return false;
        
        // Line start and end points
        const x1 = line.start.x;
        const y1 = line.start.y;
        const x2 = line.end.x;
        const y2 = line.end.y;

        // Rectangle bounds
        const left = rect.x;
        const right = rect.x + rect.width;
        const top = rect.y;
        const bottom = rect.y + rect.height;

        // Check if line intersects with any of the rectangle's edges
        return this.lineIntersectsLine(x1, y1, x2, y2, left, top, right, top) ||      // Top edge
               this.lineIntersectsLine(x1, y1, x2, y2, right, top, right, bottom) ||  // Right edge
               this.lineIntersectsLine(x1, y1, x2, y2, left, bottom, right, bottom) || // Bottom edge
               this.lineIntersectsLine(x1, y1, x2, y2, left, top, left, bottom);      // Left edge
    }

    lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        // Calculate denominators
        const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (den === 0) return false;  // Lines are parallel

        // Calculate intersection point
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

        // Check if intersection point lies within both line segments
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }

    cleanup() {
        super.cleanup();
        
        // Clean up pools
        if (this.bulletPool) {
            this.bulletPool.destroy();
        }
    }
}
