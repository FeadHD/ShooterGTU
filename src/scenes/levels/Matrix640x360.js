import { BaseScene } from '../elements/BaseScene';
import { Slime } from '../../prefabs/Slime';
import { Bitcoin } from '../../prefabs/Bitcoin';
import Drone from '../../prefabs/Drone';
import { CollisionManager } from '../../modules/managers/CollisionManager';
import MeleeWarrior from '../../prefabs/MeleeWarrior';
import { AnimationManager } from '../../modules/managers/AnimationManager';
import { StateManager } from '../../modules/managers/StateManager';
import { DebugSystem } from '../../_Debug/DebugSystem';
import { SceneBoundaryManager } from '../../modules/managers/BoundaryManager';
import { EffectsManager } from '../../modules/managers/EffectsManager';
import { EnemyManager } from '../../modules/managers/EnemyManager'; // Import EnemyManager
import { Bullet } from '../../prefabs/Bullet';
import { Player } from '../../prefabs/Player'; // Changed to named import
import { ProceduralGenerator } from '../../scripts/ProceduralGenerator';
import { GameUI } from '../elements/GameUI';

export class Matrix640x360 extends BaseScene{
    constructor() {
        super({ 
            key: 'Matrix640x360',
            backgroundColor: '#ffffff'  // Set white background
        });
        this.tileColliderAdded = false;
        this.messageShown = false;
        this.totalEnemies = 7; // Increased to include drone and melee warriors
        this.remainingEnemies = this.totalEnemies;
        this.drone = null; // Add drone reference
    }

    preload() {
        super.preload();

        // Load fonts
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
        
        // Load tileset as spritesheet
        this.load.spritesheet('megapixel', '/assets/levels/image/WannabeeTileset.png', {
            frameWidth: 32,
            frameHeight: 32,
            spacing: 0,
            margin: 0
        });
        
        // Load LDtk level data
        this.load.json('matrix', '/assets/levels/Json/Matrix_640w_360h.json');

        // Load player sprites
        this.load.spritesheet('character_Idle', '/assets/player/idle.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('character_Walking', '/assets/player/run.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('character_Jump', '/assets/player/jump.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('character_Fall', '/assets/player/fall.png', { frameWidth: 32, frameHeight: 32 });

        // Load all audio files
        this.load.audio('laser', '/assets/sounds/laser.wav');
        this.load.audio('hit', '/assets/sounds/hit.wav');
        this.load.audio('victoryMusic', '/assets/sounds/congratulations');
        this.load.audio('thezucc', '/assets/sounds/thezucc.wav'); // Load thezucc audio

        // Load tileset with error handling
        this.load.on('loaderror', (file) => {
            console.error('Error loading file:', file.src);
        });
    }

    create() {
        // Stop any existing background music and play thezucc
        if (this.sound.get('bgMusic')) {
            this.sound.get('bgMusic').stop();
        }
        this.sound.play('thezucc', { loop: true });

        // Load fonts before initializing UI
        WebFont.load({
            google: {
                families: ['Press Start 2P']
            },
            active: () => {
                // Initialize managers and UI first
                this.stateManager = new StateManager(this);
                this.effectsManager = new EffectsManager(this);
                this.gameUI = new GameUI(this);
                
                // Initialize raycaster
                this.raycaster = {
                    createRay: (config) => {
                        return {
                            origin: config.origin,
                            cast: (target) => {
                                return {
                                    hasHit: false // No walls in Matrix scene, so laser always hits
                                };
                            }
                        };
                    }
                };
                
                // Set up world bounds and physics
                this.physics.world.setBoundsCollision(true, true, true, true);
                this.physics.world.setBounds(0, 0, 640, 360); // Match scene dimensions
                
                // Set scene boundaries
                this.cameras.main.setBounds(0, 0, 640, 360);
                
                // Set scene background color
                this.cameras.main.setBackgroundColor('#ffffff');
                
                // Add semi-transparent white background
                const bg = this.add.rectangle(320, 180, 640, 360, 0xFFFFFF);
                bg.setAlpha(0.5);  // 50% transparency
                bg.setDepth(-1);   // Keep it at the back

                // Initialize groups
                this.enemies = this.physics.add.group();
                this.slimes = this.physics.add.group();
                this.drones = this.physics.add.group();
                this.bitcoins = this.add.group();
                this.bullets = this.physics.add.group({
                    classType: Bullet,
                    maxSize: 10,
                    runChildUpdate: true
                });

                // Initialize managers
                this.collisionManager = new CollisionManager(this);
                this.animationManager = new AnimationManager(this);
                this.enemyManager = new EnemyManager(this); // Initialize EnemyManager
                this.animationManager.createAllAnimations();

                // Initialize game state
                this.stateManager.set('playerHP', 100);
                this.stateManager.set('score', 0);
                this.stateManager.set('bitcoins', 0);

                // Wait for font to load before creating UI
                WebFont.load({
                    google: {
                        families: ['Retronoid']
                    },
                    active: () => {
                        // Initialize UI after font is loaded
                        // this.gameUI = new GameUI(this);
                    }
                });

                // Define spawn position constants
                const SPAWN_X_PERCENTAGE = 0.1;  // 10% from left edge
                const SPAWN_Y = 100;             // Higher up to avoid tiles
                
                // Set spawn point for this level
                this.playerSpawnPoint = {
                    x: this.scale.width * SPAWN_X_PERCENTAGE,
                    y: SPAWN_Y
                };

                // Create the player
                this.player = new Player(this, this.playerSpawnPoint.x, this.playerSpawnPoint.y);
                this.player.setPosition(this.playerSpawnPoint.x, this.playerSpawnPoint.y);
                this.player.setVelocity(0, 0);  // Ensure player starts stationary

                // Check if we should generate a procedural level
                if (this.scene.settings.data && this.scene.settings.data.procedural) {
                    this.createProceduralLevel(this.scene.settings.data.proceduralConfig);
                } else {
                    this.createStaticLevel();
                }

                // Add debug text for camera info
                this.debugText = this.add.text(10, 10, '', { 
                    font: '16px Arial', 
                    fill: '#ff0000',
                    backgroundColor: '#ffffff' 
                });
                this.debugText.setScrollFactor(0);  // Fix to camera
                this.debugText.setDepth(1000);      // Keep on top

                // Load level data from LDtk
                const levelData = this.cache.json.get('matrix');
        
                if (!levelData || !levelData.layerInstances) {
                    console.error('Invalid level data:', levelData);
                    return;
                }

                // Get the layer instance for WannabeeTileset layer
                const tileLayer = levelData.layerInstances.find(layer => layer.__identifier === "WannabeeTileset");
        
                if (!tileLayer) {
                    console.error('WannabeeTileset layer not found');
                    return;
                }

                // Create a tilemap for collision handling
                const map = this.make.tilemap({
                    width: Math.ceil(levelData.pxWid / tileLayer.__gridSize),
                    height: Math.ceil(levelData.pxHei / tileLayer.__gridSize),
                    tileWidth: tileLayer.__gridSize,
                    tileHeight: tileLayer.__gridSize
                });

                // Add the tileset image to the map
                const tileset = map.addTilesetImage('megapixel');
        
                // Create a static layer for collisions
                const layer = map.createBlankLayer('collision', tileset);
                if (!layer) {
                    console.error('Failed to create collision layer');
                    return;
                }

                // Create a group for visual tiles
                this.tileLayer = this.add.group();

                // Helper function to convert source coordinates to frame index
                const getFrameFromSrc = (src) => {
                    const tilesPerRow = 25; // Number of tiles per row in the tileset
                    const tileX = src[0] / tileLayer.__gridSize;
                    const tileY = src[1] / tileLayer.__gridSize;
                    return tileY * tilesPerRow + tileX;
                };

                // Place tiles according to the LDtk data
                if (tileLayer.gridTiles) {
                    const placeTilesPromise = Promise.all(tileLayer.gridTiles.map(tile => {
                        const frameIndex = getFrameFromSrc(tile.src);
        
                        // Create visual sprite
                        const tileSprite = this.add.sprite(
                            tile.px[0],  // x position
                            tile.px[1],  // y position
                            'megapixel',
                            frameIndex
                        );
                        tileSprite.setOrigin(0);
                        this.tileLayer.add(tileSprite);

                        // Add collision tile
                        const tileX = Math.floor(tile.px[0] / tileLayer.__gridSize);
                        const tileY = Math.floor(tile.px[1] / tileLayer.__gridSize);
                        const collisionTile = layer.putTileAt(frameIndex, tileX, tileY);
                        if (collisionTile) {
                            collisionTile.setCollision(true);
                        }
                        return Promise.resolve();
                    }));

                    // Wait for all tiles to be placed before showing the scene
                    placeTilesPromise.then(() => {
                        // Set up all collisions using CollisionManager
                        if (this.collisionManager) {
                            this.collisionManager.setupCollisions();
                            
                            // Set up player-enemy collision
                            this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
                                if (enemy.getData('enemy') && !this.isDying) {
                                    this.hitEnemy(player, enemy);
                                }
                            }, null, this);
                        }

                        // Initialize game elements
                        this.initializeGameElements();
        
                        // Make sure camera follows the player from BaseScene
                        this.cameras.main.startFollow(this.player);
        
                        console.log('Matrix640x360 scene setup complete');
                    });
                }

                // Set up game dimensions
                this.LEVEL_WIDTH = 640;
                this.LEVEL_HEIGHT = 360;

                // Get the actual screen dimensions
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;

                // Calculate scale to fit screen while maintaining aspect ratio
                const scaleX = screenWidth / this.LEVEL_WIDTH;
                const scaleY = screenHeight / this.LEVEL_HEIGHT;
                const scale = Math.min(scaleX, scaleY);

                // Calculate centered position
                const offsetX = (screenWidth - (this.LEVEL_WIDTH * scale)) / 2;
                const offsetY = (screenHeight - (this.LEVEL_HEIGHT * scale)) / 2;

                // Configure the main camera to show full screen
                const mainCam = this.cameras.main;
                mainCam.setViewport(offsetX, offsetY, this.LEVEL_WIDTH * scale, this.LEVEL_HEIGHT * scale);
                mainCam.setBounds(0, 0, this.LEVEL_WIDTH, this.LEVEL_HEIGHT);
                mainCam.setBackgroundColor('#000000');
                mainCam.setZoom(scale);

                // Ensure player has proper physics and collision
                this.player.setCollideWorldBounds(true);
                this.physics.add.collider(this.player, layer);

                // Make sure player controller is enabled
                if (this.player.controller) {
                    this.player.controller.enabled = true;
                }

                // Reset and set up camera AFTER player creation
                this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
                this.cameras.main.setFollowOffset(0, 0);

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
                this.physics.add.collider(this.enemies, layer);
        
                // Set up collisions between enemies and each other
                this.physics.add.collider(this.enemies, this.enemies, this.handleEnemyCollision, null, this);
        
                // Set up collisions between enemies and player
                this.physics.add.overlap(this.enemies, this.player, (enemySprite, player) => {
                    if (enemySprite.getData('enemy') && !this.isDying) {
                        this.hitEnemy(player, enemySprite);
                    }
                }, null, this);

                // Add ESC key for pause menu
                this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
                this.pauseKey.on('down', () => {
                    if (!this.isGamePaused) {
                        this.pauseGame();
                    }
                });

                // Ensure UI camera is properly set up
                if (this.gameUI) {
                    this.gameUI.updateCameraIgnoreList();
                }

                // Debug level data loading
                if (!this.cache.json.get('matrix')) {
                    console.error('Failed to load level data');
                    return;
                }

                // Get the layer instance for Megapixel layer
                const megapixelLayer = levelData.layerInstances[0];  // First layer is our Megapixel layer
                if (!megapixelLayer) {
                    console.error('Megapixel layer not found');
                    return;
                }

                // Create debug graphics
                this.debugGraphics = this.add.graphics();
                
                // Initialize debug system
                this.debugSystem = new DebugSystem(this);
                
            }
        });
    }

    createProceduralLevel(config) {
        // Create procedural generator
        const generator = new ProceduralGenerator(config);
        const level = generator.generateLevel();

        // Create tilemap for the procedural level
        const map = this.make.tilemap({
            width: config.gridWidth,
            height: config.gridHeight,
            tileWidth: 32,
            tileHeight: 32
        });

        // Add the tileset
        const tileset = map.addTilesetImage('megapixel');
        const layer = map.createBlankLayer('level', tileset);

        // Place tiles according to the generated grid
        for (let y = 0; y < config.gridHeight; y++) {
            for (let x = 0; x < config.gridWidth; x++) {
                const tileIndex = generator.grid[y][x];
                if (tileIndex !== 0) {
                    const tile = layer.putTileAt(tileIndex, x, y);
                    if (tile) {
                        tile.setCollision(true);
                    }
                }
            }
        }

        // Get spawn and end points
        const spawnPoint = generator.getSpawnPoint(level.platforms);
        const endPoint = generator.getEndPoint(level.platforms);

        // Create player at spawn point
        this.player = new Player(this, spawnPoint.x * 32, spawnPoint.y * 32);

        // Generate enemy positions
        const enemyPositions = generator.generateEnemyPositions(level.platforms, spawnPoint, endPoint);

        // Place enemies
        enemyPositions.forEach(pos => {
            const x = pos.x * 32;
            const y = pos.y * 32;
            switch (pos.type) {
                case 'slime':
                    this.createAndInitSlime(x, y);
                    break;
                case 'drone':
                    this.createAndInitDrone(x, y);
                    break;
                case 'warrior':
                    this.createAndInitWarrior(x, y);
                    break;
            }
        });

        // Set up collisions
        if (this.collisionManager) {
            this.physics.add.collider(this.player, layer);
            this.physics.add.collider(this.enemies, layer);
            this.physics.add.collider(this.enemies, this.enemies);
            
            // Set up player-enemy collision
            this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
                if (enemy.getData('enemy') && !this.isDying) {
                    this.hitEnemy(player, enemy);
                }
            }, null, this);
            
            // Set up bullet-enemy collision
            this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemySprite) => {
                const enemy = enemySprite.getData('enemy');
                if (enemy && enemy.takeDamage) {
                    enemy.takeDamage(1);
                    bullet.destroy();
                }
            }, null, this);
        }

        // Set camera bounds
        this.cameras.main.setBounds(0, 0, config.gridWidth * 32, config.gridHeight * 32);
        this.cameras.main.startFollow(this.player);

        // Start the game
        this.startGame();
    }

    createStaticLevel() {
        // Existing static level creation code...
    }

    initializeGameElements() {
        // Get enemy configuration from scene data
        const enemyConfig = this.scene.settings.data?.enemyConfig || {
            'Slime': 3,
            'Drone': 1,
            'MeleeWarrior': 3
        };

        // Initialize game elements without animations or delays
        const spawnPoints = this.findSpawnPointsForSlimes();
        
        // Spawn Slimes
        for (let i = 0; i < enemyConfig.Slime && i < spawnPoints.length; i++) {
            const point = spawnPoints[i];
            this.createAndInitSlime(point.x, point.y);
        }

        // Spawn MeleeWarriors
        for (let i = 0; i < enemyConfig.MeleeWarrior; i++) {
            const x = this.LEVEL_WIDTH * (0.3 + (0.4 * (i / Math.max(1, enemyConfig.MeleeWarrior - 1))));
            const y = this.LEVEL_HEIGHT - 64;
            this.createAndInitWarrior(x, y);
        }

        // Spawn Drones
        for (let i = 0; i < enemyConfig.Drone; i++) {
            const x = this.LEVEL_WIDTH * (0.4 + (0.2 * i));
            const y = this.LEVEL_HEIGHT * 0.3;
            const drone = new Drone(this, x, y);
            if (drone.sprite) {
                this.drones.add(drone.sprite);
                this.enemies.add(drone.sprite);
                drone.sprite.setData('enemy', drone);
            }
        }

        // Start the game
        this.gameStarted = true;
    }

    findSpawnPointsForSlimes() {
        const spawnPoints = [];
        const TILE_SIZE = 32;
        const mapWidth = Math.floor(this.LEVEL_WIDTH / TILE_SIZE);
        const mapHeight = Math.floor(this.LEVEL_HEIGHT / TILE_SIZE);

        // Define fixed spawn points for the Matrix level
        const fixedSpawnPoints = [
            { x: 100, y: this.LEVEL_HEIGHT - 64 },  // Left side
            { x: this.LEVEL_WIDTH * 0.3, y: this.LEVEL_HEIGHT - 64 }, // Left-center
            { x: this.LEVEL_WIDTH * 0.5, y: this.LEVEL_HEIGHT - 64 }, // Center
            { x: this.LEVEL_WIDTH * 0.7, y: this.LEVEL_HEIGHT - 64 }, // Right-center
            { x: this.LEVEL_WIDTH - 100, y: this.LEVEL_HEIGHT - 64 }  // Right side
        ];

        return fixedSpawnPoints;
    }

    createAndInitSlime(x, y) {
        const slime = new Slime(this, x, y);
        if (slime.sprite) {
            this.slimes.add(slime.sprite);
            this.enemies.add(slime.sprite);
            this.enemyManager.addEnemy(slime, slime.sprite, slime.health);
            slime.sprite.setData('type', 'slime');
            slime.sprite.setData('enemy', slime);
            slime.initializeMovement();
        }
        return slime;
    }

    createAndInitDrone(x, y) {
        const drone = new Drone(this, x, y);
        if (drone.sprite) {
            this.drones.add(drone.sprite);
            this.enemies.add(drone.sprite);
            this.enemyManager.addEnemy(drone, drone.sprite, drone.health);
            drone.sprite.setData('type', 'drone');
            drone.sprite.setData('enemy', drone);
        }
        return drone;
    }

    createAndInitWarrior(x, y) {
        const warrior = new MeleeWarrior(this, x, y);
        if (warrior.sprite) {
            this.enemies.add(warrior.sprite);
            this.enemyManager.addEnemy(warrior, warrior.sprite, warrior.health);
            warrior.sprite.setData('type', 'warrior');
            warrior.sprite.setData('enemy', warrior);
        }
        return warrior;
    }

    startGame() {
        // Enable player controls
        if (this.player) {
            this.player.controller.enabled = true;
        }

        // Set game as started
        this.gameStarted = true;
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        // Use EnemyManager to handle bullet hits
        this.enemyManager.handleBulletHit(bullet, enemySprite);
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
        super.update(time, delta);

        // Only update game elements if the game has started
        if (!this.gameStarted) return;

        if (this.isGamePaused) return;

        // Update all enemies
        if (this.enemies) {
            this.enemies.getChildren().forEach(enemySprite => {
                const enemy = enemySprite.getData('enemy');
                if (enemy) {
                    enemy.update(time, delta);
                }
            });
        }

        // Update debug system
        if (this.debugSystem) {
            this.debugSystem.update();
        }

        // Check for active slimes based on their health
        const activeSlimes = this.slimes.getChildren().filter(slime => 
            slime.enemy && slime.enemy.health > 0
        );
        const activeSlimeCount = activeSlimes.length;

        // Debug info
        console.log({
            playerX: this.player.x,
            activeSlimeCount,
            slimeDetails: activeSlimes.map(slime => ({
                health: slime.enemy?.health,
                active: slime.active,
                visible: slime.visible
            }))
        });

        // Update debug visuals
        this.updateDebugVisuals();
    }

    updateDebugVisuals() {
        // Clear previous debug graphics
        this.debugGraphics.clear();

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

    pauseGame() {
        if (this.isGamePaused) return;
        
        this.isGamePaused = true;
        this.physics.pause();
        
        // Disable player controller
        if (this.player && this.player.controller) {
            this.player.controller.enabled = false;
        }
        
        // Launch pause menu
        this.scene.launch('PauseMenu');
        this.scene.pause();
    }

    resumeGame() {
        if (!this.isGamePaused) return;
        
        this.isGamePaused = false;
        this.physics.resume();
        
        // Re-enable player controller
        if (this.player && this.player.controller) {
            this.player.controller.enabled = true;
        }
        
        this.scene.resume();
    }

    gameOver() {
        this.scene.start('GameOver');
    }

    returnToMainMenu() {
        this.scene.start('MainMenu');
    }

    quitGame() {
        window.close();
    }

    handlePlayerDeath() {
        const lives = this.stateManager.get('lives');
        if (lives <= 0) {
            // Game Over - stop timer and transition
            this.scene.start('GameOver');
        }
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

    lineIntersectsRect(x1, y1, x2, y2, rectX, rectY, rectWidth, rectHeight) {
        // Helper function to check if a line segment intersects with a rectangle
        const left = rectX;
        const right = rectX + rectWidth;
        const top = rectY;
        const bottom = rectY + rectHeight;

        // Check if the line intersects with any of the rectangle's edges
        return (
            this.lineIntersectsLine(x1, y1, x2, y2, left, top, right, top) ||      // Top edge
            this.lineIntersectsLine(x1, y1, x2, y2, right, top, right, bottom) ||  // Right edge
            this.lineIntersectsLine(x1, y1, x2, y2, left, bottom, right, bottom) || // Bottom edge
            this.lineIntersectsLine(x1, y1, x2, y2, left, top, left, bottom)       // Left edge
        );
    }

    lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        // Helper function to check if two line segments intersect
        const denominator = ((x2 - x1) * (y4 - y3)) - ((y2 - y1) * (x4 - x3));
        if (denominator === 0) return false;

        const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
        const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;

        return (ua >= 0 && ua <= 1) && (ub >= 0 && ub <= 1);
    }

    shutdown() {
        // Clean up physics
        if (this.physics.world) {
            this.physics.world.shutdown();
        }

        // Clean up any running timers
        this.time.removeAllEvents();

        // Destroy all game objects
        this.children.removeAll(true);
        
        // Clean up any event listeners
        this.events.removeAllListeners();
        
        // Clean up any custom properties
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
        
        if (this.enemies) {
            this.enemies.clear(true, true);
            this.enemies = null;
        }
        
        if (this.platforms) {
            this.platforms.clear(true, true);
            this.platforms = null;
        }
        
        if (this.drones) {
            this.drones.clear(true, true);
            this.drones = null;
        }

        // Reset game state
        this.gameStarted = false;
        this.isGamePaused = false;
        
        // Call parent shutdown
        super.shutdown();
    }
}
