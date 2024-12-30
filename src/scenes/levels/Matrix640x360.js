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
import { AlarmTrigger } from '../../prefabs/AlarmTrigger';

export class Matrix640x360 extends BaseScene{
    constructor() {
        super({ 
            key: 'Matrix640x360',
            backgroundColor: 'cyan',
        });
        this.tileColliderAdded = false;
        this.messageShown = false;
        this.totalEnemies = 7;
        this.remainingEnemies = this.totalEnemies;
        this.drone = null;
        
        // Fixed dimensions for Matrix room
        this.ROOM_WIDTH = 640;
        this.ROOM_HEIGHT = 360;
    }

    preload() {
        super.preload();  // This loads the character animations

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

        // Load all audio files
        this.load.audio('laser', '/assets/sounds/laser.wav');
        this.load.audio('hit', '/assets/sounds/hit.wav');
        this.load.audio('victoryMusic', '/assets/sounds/congratulations');
        this.load.audio('thezucc', '/assets/sounds/thezucc.wav');
        this.load.audio('alarm', '/assets/sounds/alarm.wav');  // Add alarm sound

        // Load character spritesheets
        this.load.spritesheet('character_idle', 'assets/sprites/character/idle.png', {
            frameWidth: 24,
            frameHeight: 24
        });
        this.load.spritesheet('character_walking', 'assets/sprites/character/walking.png', {
            frameWidth: 24,
            frameHeight: 24
        });
        this.load.spritesheet('character_run', 'assets/sprites/character/run.png', {
            frameWidth: 24,
            frameHeight: 24
        });
        this.load.spritesheet('character_jump', 'assets/sprites/character/jump.png', {
            frameWidth: 24,
            frameHeight: 24
        });
        this.load.spritesheet('character_fall', 'assets/sprites/character/fall.png', {
            frameWidth: 24,
            frameHeight: 24
        });
        this.load.spritesheet('character_shoot', 'assets/sprites/character/shoot.png', {
            frameWidth: 24,
            frameHeight: 24
        });

        // Load other necessary assets
        this.load.spritesheet('bullet', 'assets/sprites/bullet.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        this.load.spritesheet('hit-effect', 'assets/sprites/hit-effect.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // Load tileset with error handling
        this.load.on('loaderror', (file) => {
            console.error('Error loading file:', file.src);
        });
    }

    create() {
        // Get trap config from scene data or TheZucc scene
        const sceneData = this.scene.settings.data;
        const zuccScene = this.scene.get('TheZucc');
        
        // Try to get alarm count from multiple sources
        const alarmCount = (
            // First try scene data (passed when starting scene)
            sceneData?.trapConfig?.AlarmTrigger !== undefined ? sceneData.trapConfig.AlarmTrigger :
            // Then try getting it from TheZucc scene
            zuccScene?.trapConfig?.AlarmTrigger !== undefined ? zuccScene.trapConfig.AlarmTrigger :
            // Default to 1 if neither exists
            1
        );
        
        this.trapConfig = {
            AlarmTrigger: alarmCount
        };
        
        console.log('Matrix: Got alarm count:', this.trapConfig.AlarmTrigger, 
                    'from:', sceneData?.trapConfig ? 'scene data' : 
                            zuccScene?.trapConfig ? 'TheZucc scene' : 
                            'default');

        // Stop any existing background music and play thezucc
        if (this.sound.get('bgMusic')) {
            this.sound.get('bgMusic').stop();
        }
        
        // Store background music reference
        this.bgMusic = this.sound.add('thezucc', { loop: true });
        this.bgMusic.play();

        // Load fonts before initializing UI
        WebFont.load({
            google: {
                families: ['Press Start 2P']
            },
            active: () => {
                // Initialize managers and UI first
                this.stateManager = new StateManager(this);
                this.effectsManager = new EffectsManager(this);
                this.enemyManager = new EnemyManager(this);  // Add enemy manager initialization
                this.collisionManager = new CollisionManager(this);
                this.boundaryManager = new SceneBoundaryManager(this);
                this.animationManager = new AnimationManager(this);
                this.gameUI = new GameUI(this);
                
                // Create animations
                this.animationManager.createAllAnimations();
                
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
                this.cameras.main.setBackgroundColor('#000000');
                
                // Set up camera with 1:1 zoom to match exact 640x360 dimensions
                this.cameras.main.setZoom(1);  // No zoom scaling
                this.cameras.main.centerOn(320, 180);  // Center on middle of scene
                
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
                this.traps = this.physics.add.group();
                
                // Create the player
                this.playerSpawnPoint = {
                    x: this.scale.width * 0.1, // 10% from left edge
                    y: 100 // Higher up to avoid tiles
                };

                // Create the player
                this.player = new Player(this, this.playerSpawnPoint.x, this.playerSpawnPoint.y);
                this.player.setPosition(this.playerSpawnPoint.x, this.playerSpawnPoint.y);
                this.player.setVelocity(0, 0);  // Ensure player starts stationary

                // Create platforms
                this.platforms = this.physics.add.staticGroup();
                
                // Load level data
                const levelData = this.cache.json.get('matrix');
                
                // Create platforms from level data
                const platformLayer = levelData.layerInstances.find(layer => layer.__identifier === "WannabeeTileset");
                if (platformLayer && platformLayer.gridTiles) {
                    platformLayer.gridTiles.forEach(tile => {
                        const x = tile.px[0] + 16; // Center of tile
                        const y = tile.px[1] + 16;
                        const platform = this.platforms.create(x, y, 'megapixel');
                        platform.setImmovable(true);
                    });
                }

                // Initialize alarm triggers group
                this.alarmTriggers = this.physics.add.staticGroup({
                    classType: AlarmTrigger,
                    runChildUpdate: true
                });
                
                // Find valid spawn points for alarms after platforms are created
                const alarmSpawnPoints = this.findSpawnPointsForAlarms();
                
                // Create alarm triggers at random valid positions
                if (alarmSpawnPoints.length > 0) {
                    // Get number of alarms to create from trapConfig
                    const numAlarms = this.trapConfig.AlarmTrigger;
                    console.log('Matrix: Creating', numAlarms, 'alarms');
                    
                    // Shuffle spawn points
                    Phaser.Utils.Array.Shuffle(alarmSpawnPoints);
                    
                    // Create alarm triggers up to the configured amount or available spawn points
                    for (let i = 0; i < Math.min(numAlarms, alarmSpawnPoints.length); i++) {
                        const spawnPoint = alarmSpawnPoints[i];
                        const alarm = this.alarmTriggers.create(spawnPoint.x, spawnPoint.y, null, false);
                        alarm.setSize(32, 32);
                        console.log('Matrix: Created alarm at', spawnPoint.x, spawnPoint.y);
                    }
                }

                // Set up alarm trigger collision after both player and triggers exist
                this.physics.add.overlap(
                    this.player,
                    this.alarmTriggers,
                    (player, trap) => {
                        trap.triggerAlarm();
                    }
                );

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

                // Set up the Matrix room camera to stretch to HD
                const mainCam = this.cameras.main;
                mainCam.setViewport(0, 0, 1920, 1080); // Full HD viewport
                mainCam.setBounds(0, 0, this.ROOM_WIDTH, this.ROOM_HEIGHT);
                mainCam.setBackgroundColor('#000000');
                mainCam.setScroll(0, 0);  // Lock camera position
                
                // Calculate zoom to stretch to full screen
                const zoomX = 1920 / this.ROOM_WIDTH;
                const zoomY = 1080 / this.ROOM_HEIGHT;
                mainCam.setZoom(Math.min(zoomX, zoomY));  // Stretch to fill screen
                
                // Initialize debug graphics
                this.debugGraphics = this.add.graphics();

                // Ensure player has proper physics and collision
                this.player.setCollideWorldBounds(true);
                this.physics.add.collider(this.player, layer);

                // Make sure player controller is enabled
                if (this.player.controller) {
                    this.player.controller.enabled = true;
                }

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

                // Initialize debug system
                this.debugSystem = new DebugSystem(this);
                
            }
        });
    }

    findSpawnPointsForAlarms() {
        const spawnPoints = [];
        const tileWidth = 32;
        const tileHeight = 32;
        const numColumns = Math.floor(this.scale.width / tileWidth);
        const numRows = Math.floor(this.scale.height / tileHeight);

        // Check each column
        for (let col = 0; col < numColumns; col++) {
            // Start from second row from top to leave room for alarm
            for (let row = 1; row < numRows; row++) {
                const x = col * tileWidth + tileWidth / 2;
                const y = row * tileHeight;

                // Check if there's a platform at this position
                const hasPlatform = this.platforms.getChildren().some(platform => {
                    const bounds = platform.getBounds();
                    return bounds.contains(x, y);
                });

                // Check if there's a platform below but not above
                const hasPlatformAbove = this.platforms.getChildren().some(platform => {
                    const bounds = platform.getBounds();
                    return bounds.contains(x, y - tileHeight);
                });

                // If we found a platform and the space above is empty
                if (hasPlatform && !hasPlatformAbove) {
                    spawnPoints.push({
                        x: x,
                        y: y - tileHeight + tileHeight / 2 // Position alarm in center of tile above
                    });
                }
            }
        }

        return spawnPoints;
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

            // Draw alarm trigger debug boxes
            if (this.alarmTriggers) {
                this.alarmTriggers.getChildren().forEach(alarm => {
                    this.debugGraphics.lineStyle(2, 0xff0000);
                    const bounds = alarm.getBounds();
                    this.debugGraphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
                    
                    // Add debug text above alarm
                    if (!alarm.debugText) {
                        alarm.debugText = this.add.text(bounds.x, bounds.y - 20, '', {
                            fontSize: '16px',
                            backgroundColor: '#000000',
                            color: '#ff0000',
                            padding: { x: 4, y: 2 }
                        });
                    }
                    alarm.debugText.setText(`ALARM TRIGGER\nPos: ${Math.round(bounds.x)},${Math.round(bounds.y)}\nSize: ${bounds.width}x${bounds.height}`);
                    alarm.debugText.setPosition(bounds.x, bounds.y - 60);
                    alarm.debugText.setScrollFactor(1);
                });
            }
        } else {
            // Clean up text when debug is disabled
            if (this.spawnText) {
                this.spawnText.destroy();
                this.spawnText = null;
            }
            // Clean up alarm debug text
            if (this.alarmTriggers) {
                this.alarmTriggers.getChildren().forEach(alarm => {
                    if (alarm.debugText) {
                        alarm.debugText.destroy();
                        alarm.debugText = null;
                    }
                });
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

    spawnTraps() {
        if (!this.trapConfig) return;
        
        // Get available platform positions
        const platformPositions = [];
        this.platformGroup.getChildren().forEach(platform => {
            platformPositions.push({
                x: platform.x + platform.width/2,
                y: platform.y - 32 // Position above platform
            });
        });
        
        // Shuffle positions
        for (let i = platformPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [platformPositions[i], platformPositions[j]] = [platformPositions[j], platformPositions[i]];
        }
        
        // NOTE: Alarm triggers are now handled in active() method
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
