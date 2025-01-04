import { BaseScene } from '../elements/BaseScene';
import CameraManager from '../../modules/managers/CameraManager';
import { CollisionManager } from '../../modules/managers/CollisionManager';
import { TextStyleManager } from '../../modules/managers/TextStyleManager';
import { GameUI } from '../elements/GameUI';
import { TransitionScreen } from '../elements/TransitionScreen';
import { Enemy } from '../../prefabs/Enemy';
import MeleeWarrior from '../../prefabs/MeleeWarrior';
import { AlarmTrigger } from '../../prefabs/AlarmTrigger';
import { MusicManager } from '../../modules/managers/MusicManager';
import { Bitcoin } from '../../prefabs/Bitcoin';
import { Slime } from '../../prefabs/Slime';
import Drone from '../../prefabs/Drone';
import Trampoline from '../../prefabs/Trampoline';
import { Trap } from '../../prefabs/Trap';
import { TrapManager } from '../../modules/managers/TrapManager';
import { DisappearingPlatform } from '../../prefabs/DisappearingPlatform';
import { DestructibleBlock } from '../../prefabs/DestructibleBlock';

export class GameScene1 extends BaseScene {
    constructor() {
        super({ key: 'GameScene1' });
        this.tileColliderAdded = false;
        this.messageShown = false;
        this.totalEnemies = 7; // Increased to include drone and melee warriors
        this.remainingEnemies = this.totalEnemies;
        this.drone = null; // Add drone reference
    }

    preload() {
        // Load all audio files
        this.load.audio('laser', 'assets/sounds/laser.wav');
        this.load.audio('hit', 'assets/sounds/hit.wav');
        this.load.audio('victoryMusic', 'assets/sounds/congratulations');
        this.load.audio('bgMusic', 'assets/audio/bgMusic.wav');
        this.load.audio('alarm', '/assets/sounds/alarm.wav');  // Add alarm sound with correct path

        // Load spark particle for trampoline
        this.load.image('spark', 'assets/particles/spark.png');

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
        
        // Start with transition screen
        this.transitionScreen.start(() => {
            // After transition completes, continue with scene setup
            super.create();
            
            const { width, height } = this.scale;

            // Set initial game state
            this.gameStarted = false;
            
            // Set initial registry values
            this.registry.set('score', 0);
            this.registry.set('lives', 3);
            this.registry.set('playerHP', 100);
            this.registry.set('bitcoins', 0);
            
            // Start timer and show UI
            this.gameUI.startTimer();
            this.gameUI.animateUIElements();
            
            // Initialize update event for UI
            this.events.on('update', () => {
                // Update UI elements
                const score = this.registry.get('score') || 0;
                const lives = this.registry.get('lives') || 3;
                const hp = this.registry.get('playerHP') || 100;
                const bitcoins = this.registry.get('bitcoins') || 0;
                
                this.gameUI.updateScore(score);
                this.gameUI.updateLives(lives);
                this.gameUI.updateHP(hp);
                this.gameUI.updateBitcoins(bitcoins);
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

            // Initialize background music if not already playing
            const musicVolume = this.registry.get('musicVolume') ?? 1; // Use nullish coalescing to allow 0
            if (!this.bgMusic || !this.bgMusic.isPlaying) {
                // If there's an existing stopped music instance, destroy it
                if (this.bgMusic) {
                    this.bgMusic.destroy();
                }
                
                // Create new music instance with current volume
                this.bgMusic = this.sound.add('bgMusic', {
                    loop: true,
                    volume: musicVolume
                });

                // Only play if volume is not 0
                if (musicVolume > 0) {
                    this.bgMusic.play();
                }
            } else {
                // Update volume of existing music
                this.bgMusic.setVolume(musicVolume);
                
                // Pause/resume based on volume
                if (musicVolume === 0 && this.bgMusic.isPlaying) {
                    this.bgMusic.pause();
                } else if (musicVolume > 0 && !this.bgMusic.isPlaying) {
                    this.bgMusic.resume();
                }
            }

            // Add registry listener for volume changes
            this.registry.events.on('changedata-musicVolume', (parent, value) => {
                if (this.bgMusic) {
                    this.bgMusic.setVolume(value);
                    // Pause/resume based on volume
                    if (value === 0 && this.bgMusic.isPlaying) {
                        this.bgMusic.pause();
                    } else if (value > 0 && !this.bgMusic.isPlaying) {
                        this.bgMusic.resume();
                    }
                }
            });

            // Create raycaster for laser collision detection
            this.raycaster = {
                createRay: (config) => {
                    return {
                        cast: (target) => {
                            const start = config.origin;
                            const end = { x: target.x, y: target.y };
                            const obstacles = target.obstacles;

                            // Check if line intersects with any obstacle
                            for (const obstacle of obstacles) {
                                if (this.lineIntersectsRect(
                                    start.x, start.y,
                                    end.x, end.y,
                                    obstacle.x, obstacle.y,
                                    obstacle.width, obstacle.height
                                )) {
                                    return { hasHit: true };
                                }
                            }
                            return { hasHit: false };
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

            // Initialize camera manager
            this.cameraManager = new CameraManager(this);
            this.cameraManager.init(this.player);
            this.cameraManager.playIntroSequence(this.player);

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
                    this.hitEnemy(player, enemySprite);
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
            
            // Create an alarm trigger 4 tiles to the right of player spawn and 2 tiles down
            const alarm = this.alarmTriggers.create(this.playerSpawnPoint.x + 128, this.playerSpawnPoint.y + 32);
            alarm.setSize(32, 32);
            alarm.setDepth(5); // Same depth as enemies to be visible in front of tiles

            // Set up alarm trigger collision
            this.physics.add.overlap(
                this.player,
                this.alarmTriggers,
                (player, trap) => {
                    trap.triggerAlarm();
                }
            );

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

            // Wait for all tiles to be placed before showing the scene
            placeTilesPromise.then(() => {
                // Set up all collisions using CollisionManager
                this.collisionManager.setupCollisions();

                console.log('All tiles placed, showing scene');
                // Fade in the scene
                this.tweens.add({
                    targets: this.cameras.main,
                    alpha: 1,
                    duration: 500,
                    ease: 'Linear',
                    onComplete: () => {
                        // Continue with the rest of the scene setup
                        this.setupRestOfScene();
                    }
                });
            });

            // Create debug graphics
            this.debugGraphics = this.add.graphics();

            // Store background music reference
            // Removed this.bgMusic = this.sound.add('bgMusic', { loop: true });
            // Removed this.bgMusic.play();
        });
    }

    setupRestOfScene() {
        // Initialize managers and UI
        this.cameraManager = new CameraManager(this);
        this.collisionManager = new CollisionManager(this);
        this.gameUI = new GameUI(this);
        this.trapManager = new TrapManager(this);

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
                this.hitEnemy(player, enemySprite);
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
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        // Skip if enemy is already being destroyed
        if (!enemySprite.active || !enemySprite.body || !enemySprite.body.enable) {
            bullet.destroy();
            return;
        }
        
        // Destroy the bullet first
        bullet.destroy();
        
        // Use the EnemyManager to handle the bullet hit
        this.enemyManager.handleBulletHit(bullet, enemySprite);
        
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
            this.gameUI.update(time);
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

    resumeGame() {
        if (!this.isGamePaused) return;
        
        this.isGamePaused = false;
        
        // Restore game state
        if (this.pausedState) {
            // Restore player state
            if (this.player && this.pausedState.playerState) {
                this.player.x = this.pausedState.playerState.x;
                this.player.y = this.pausedState.playerState.y;
                if (this.player.body && this.pausedState.playerState.velocity) {
                    this.player.body.velocity.x = this.pausedState.playerState.velocity.x;
                    this.player.body.velocity.y = this.pausedState.playerState.velocity.y;
                }
            }

            // Restore enemy states
            if (this.enemies && this.pausedState.enemyStates) {
                this.pausedState.enemyStates.forEach(enemyState => {
                    const enemy = this.enemies.getChildren().find(e => e.id === enemyState.id);
                    if (enemy) {
                        enemy.x = enemyState.x;
                        enemy.y = enemyState.y;
                        if (enemy.body && enemyState.velocity) {
                            enemy.body.velocity.x = enemyState.velocity.x;
                            enemy.body.velocity.y = enemyState.velocity.y;
                        }
                        // Re-enable enemy AI if it exists
                        if (enemy.startFollowing && typeof enemy.startFollowing === 'function') {
                            enemy.startFollowing();
                        }
                    }
                });
            }

            // Restore bullet states
            if (this.bullets && this.pausedState.bulletStates) {
                const bullets = this.bullets.getChildren();
                this.pausedState.bulletStates.forEach((bulletState, index) => {
                    if (bullets[index]) {
                        bullets[index].x = bulletState.x;
                        bullets[index].y = bulletState.y;
                        if (bullets[index].body && bulletState.velocity) {
                            bullets[index].body.velocity.x = bulletState.velocity.x;
                            bullets[index].body.velocity.y = bulletState.velocity.y;
                        }
                    }
                });
            }

            // Restore game time and score
            this.gameTime = this.pausedState.gameTime;
            this.score = this.pausedState.score;

            // Clear the stored state
            this.pausedState = null;
        }
        
        // Resume physics world
        if (this.physics && this.physics.world) {
            try {
                // Resume physics world
                this.physics.world.resume();
                
                // Make sure physics debug is in the right state
                if (this.physics.world.debugGraphic) {
                    this.physics.world.debugGraphic.clear();
                }
                
                // Resume all physics bodies and reset their states
                this.physics.world.bodies.entries.forEach(body => {
                    if (body && !body.destroyed) {
                        body.enable = true;
                        body.moves = true;
                        if (body.velocity) {
                            body.velocity.x = body.velocity.x || 0;
                            body.velocity.y = body.velocity.y || 0;
                        }
                    }
                });

                // Reset physics world step
                this.physics.world.step(0);
            } catch (error) {
                console.warn('Could not resume physics:', error);
            }
        }
        
        // Re-enable player controller and input
        if (this.player) {
            if (this.player.controller) {
                this.player.controller.enabled = true;
            }
            if (this.player.body && !this.player.body.destroyed) {
                this.player.body.enable = true;
                this.player.body.moves = true;
            }
        }
        
        // Re-enable input system
        if (this.input && this.input.keyboard) {
            this.input.keyboard.enabled = true;
        }
        
        // Resume any animations
        this.anims.resumeAll();
        
        // Resume all tweens
        if (this.tweens) {
            this.tweens.resumeAll();
        }
        
        // Resume the scene (do this last to ensure everything is ready)
        this.scene.resume();
    }

    pauseGame() {
        if (this.isGamePaused) return;
        
        // Store game state before pausing
        this.pausedState = {
            playerState: {
                x: this.player?.x,
                y: this.player?.y,
                velocity: {
                    x: this.player?.body?.velocity?.x,
                    y: this.player?.body?.velocity?.y
                }
            },
            enemyStates: this.enemies?.getChildren().map(enemy => ({
                id: enemy.id,
                x: enemy.x,
                y: enemy.y,
                velocity: {
                    x: enemy.body?.velocity?.x,
                    y: enemy.body?.velocity?.y
                }
            })),
            bulletStates: this.bullets?.getChildren().map(bullet => ({
                x: bullet.x,
                y: bullet.y,
                velocity: {
                    x: bullet.body?.velocity?.x,
                    y: bullet.body?.velocity?.y
                }
            })),
            gameTime: this.gameTime,
            score: this.score
        };
        
        this.isGamePaused = true;
        
        // Launch pause menu before pausing the scene
        this.scene.launch('PauseMenu');
        
        // Pause physics world
        if (this.physics && this.physics.world) {
            try {
                // Pause physics world
                this.physics.world.pause();
                
                // Disable all physics bodies
                this.physics.world.bodies.entries.forEach(body => {
                    if (body && !body.destroyed) {
                        body.enable = false;
                    }
                });
            } catch (error) {
                console.warn('Could not pause physics:', error);
            }
        }
        
        // Disable player controller and input
        if (this.player) {
            if (this.player.controller) {
                this.player.controller.enabled = false;
            }
            if (this.player.body && !this.player.body.destroyed) {
                this.player.body.enable = false;
            }
            
            // Stop any ongoing player animations
            if (this.player.anims) {
                this.player.anims.pause();
            }
        }
        
        // Disable input system
        if (this.input && this.input.keyboard) {
            this.input.keyboard.enabled = false;
        }
        
        // Pause enemy AI
        if (this.enemies) {
            this.enemies.getChildren().forEach(enemy => {
                if (enemy.stopFollowing && typeof enemy.stopFollowing === 'function') {
                    enemy.stopFollowing();
                }
                if (enemy.body && !enemy.body.destroyed) {
                    enemy.body.enable = false;
                }
            });
        }
        
        // Pause any animations
        this.anims.pauseAll();
        
        // Pause all tweens
        if (this.tweens) {
            this.tweens.pauseAll();
        }
        
        // Pause the scene (do this last to ensure everything is properly stored)
        this.scene.pause();
    }

    gameOver() {
        this.gameUI.stopTimer(); // Stop the timer
        this.scene.start('GameOver');
    }

    returnToMainMenu() {
        this.gameUI.stopTimer(); // Stop the timer
        this.scene.start('MainMenu');
    }

    quitGame() {
        this.gameUI.stopTimer(); // Stop the timer
        window.close();
    }

    handlePlayerDeath() {
        const lives = this.registry.get('lives');
        if (lives <= 0) {
            // Game Over - stop timer and transition
            this.gameUI.stopTimer();
            this.scene.start('GameOver');
        }
    }

    findSpawnPointsForSlimes() {
        const spawnPoints = [];
        const mapWidth = this.mapLayer.width;
        const mapHeight = this.mapLayer.height;

        // Scan the map for solid tiles (type 370)
        for (let x = 0; x < mapWidth; x++) {
            for (let y = 0; y < mapHeight - 1; y++) {
                const tile = this.mapLayer.getTileAt(x, y);
                const tileAbove = this.mapLayer.getTileAt(x, y - 1);
                
                // Check if current tile is solid and tile above is empty
                if ((tile && (tile.index === 370 || tile.collides)) && 
                    (!tileAbove || (!tileAbove.collides && tileAbove.index !== 370))) {
                    // Position slime exactly on top of the tile
                    spawnPoints.push({ 
                        x: x * 32 + 16, // Center of tile
                        y: y * 32 - 8   // Just above the tile
                    });
                }
            }
        }
        return spawnPoints;
    }

    findSpawnPointsForBitcoins() {
        const spawnPoints = [];
        const tileHeight = 32;
        const levelWidth = this.scale.width;
        const maxJumpHeight = 5 * tileHeight; // Maximum 5 tiles above platform
        
        // Sample points across the level width
        for (let x = levelWidth * 0.1; x < levelWidth * 0.9; x += 100) {
            // Find platforms at this x coordinate
            const platformsAtX = this.platforms.getChildren().filter(platform => {
                const bounds = platform.getBounds();
                return x >= bounds.left && x <= bounds.right;
            });

            if (platformsAtX.length > 0) {
                // Sort platforms by Y position (top to bottom)
                platformsAtX.sort((a, b) => a.y - b.y);

                // For each platform, try to place a bitcoin above it
                for (const platform of platformsAtX) {
                    const platformTop = platform.getBounds().top;
                    let validY = null;

                    // Try positions above the platform, within jump height
                    for (let y = platformTop - tileHeight; y >= platformTop - maxJumpHeight; y -= tileHeight) {
                        // Check if this position collides with any platform
                        const hasCollision = this.platforms.getChildren().some(p => {
                            const bounds = p.getBounds();
                            return bounds.contains(x, y);
                        });

                        if (!hasCollision) {
                            validY = y;
                            break;
                        }
                    }

                    if (validY !== null) {
                        spawnPoints.push({ x, y: validY });
                        break; // Only one spawn point per x coordinate
                    }
                }
            }
        }
        
        // Shuffle the spawn points
        return Phaser.Utils.Array.Shuffle(spawnPoints);
    }

    lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
        // Check if line intersects with any of the rectangle's edges
        return this.lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry) ||          // Top edge
               this.lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh) || // Right edge
               this.lineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh) || // Bottom edge
               this.lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx, ry + rh);             // Left edge
    }

    lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denominator = ((x2 - x1) * (y4 - y3)) - ((y2 - y1) * (x4 - x3));
        if (denominator === 0) return false;

        const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
        const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;

        return (ua >= 0 && ua <= 1) && (ub >= 0 && ub <= 1);
    }
}
