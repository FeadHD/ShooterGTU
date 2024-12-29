import { BaseScene } from '../elements/BaseScene';
import { GameUI } from '../elements/GameUI';
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
import { EnemyManager } from '../../modules/managers/EnemyManager';
import { Bullet } from '../../prefabs/Bullet';
import { Player } from '../../prefabs/Player'; // Changed to named import

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
        this.load.spritesheet('character_idle', '/assets/player/idle.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('character_run', '/assets/player/run.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('character_jump', '/assets/player/jump.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('character_fall', '/assets/player/fall.png', { frameWidth: 32, frameHeight: 32 });

        // Load all audio files
        this.load.audio('laser', '/assets/sounds/laser.wav');
        this.load.audio('hit', '/assets/sounds/hit.wav');
        this.load.audio('victoryMusic', '/assets/sounds/congratulations');

        // Load tileset with error handling
        this.load.on('loaderror', (file) => {
            console.error('Error loading file:', file.src);
        });
    }

    create() {
        // Set up world bounds and physics
        this.physics.world.setBounds(0, 0, 640, 360);
        
        // Set scene background color
        this.cameras.main.setBackgroundColor('#ffffff');
        
        // Add semi-transparent white background
        const bg = this.add.rectangle(320, 180, 640, 360, 0xFFFFFF);
        bg.setAlpha(0.5);  // 50% transparency
        bg.setDepth(-1);   // Keep it at the back

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
            tileLayer.gridTiles.forEach(tile => {
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
            });
        }

        // Enable collision on the layer
        layer.setCollisionByProperty({ collides: true });
        
        // Store references
        this.map = map;
        this.mapLayer = layer;

        // Initialize registry values
        this.registry.set('playerHP', 100);
        this.registry.set('lives', 3);
        this.registry.set('score', 0);
        this.registry.set('bitcoins', 0);

        // Initialize managers
        this.stateManager = new StateManager(this);
        this.animationManager = new AnimationManager(this);
        this.debugSystem = new DebugSystem(this);
        this.boundaryManager = new SceneBoundaryManager(this);
        this.effectsManager = new EffectsManager(this);
        this.enemyManager = new EnemyManager(this);

        // Initialize game UI
        this.gameUI = new GameUI(this);

        // Initialize bullets group
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 10,
            runChildUpdate: true
        });

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

        // Set world bounds
        this.physics.world.setBounds(0, 0, this.LEVEL_WIDTH, this.LEVEL_HEIGHT);
        
        // Configure the main camera to show full screen
        const mainCam = this.cameras.main;
        mainCam.setViewport(offsetX, offsetY, this.LEVEL_WIDTH * scale, this.LEVEL_HEIGHT * scale);
        mainCam.setBounds(0, 0, this.LEVEL_WIDTH, this.LEVEL_HEIGHT);
        mainCam.setBackgroundColor('#000000');
        mainCam.setZoom(scale);

        // Add resize listener to handle window resizing
        window.addEventListener('resize', () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            
            const newScaleX = newWidth / this.LEVEL_WIDTH;
            const newScaleY = newHeight / this.LEVEL_HEIGHT;
            const newScale = Math.min(newScaleX, newScaleY);
            
            const newOffsetX = (newWidth - (this.LEVEL_WIDTH * newScale)) / 2;
            const newOffsetY = (newHeight - (this.LEVEL_HEIGHT * newScale)) / 2;
            
            mainCam.setViewport(newOffsetX, newOffsetY, this.LEVEL_WIDTH * newScale, this.LEVEL_HEIGHT * newScale);
            mainCam.setZoom(newScale);
        });

        // Store player spawn point (near the left side, above ground)
        const SPAWN_X = 100;
        const SPAWN_Y = 280; // Adjust this based on your ground level
        
        // Add debug visualization for spawn point (before creating player)
        this.debugSpawnPoint = this.add.graphics();
        this.debugSpawnPoint.lineStyle(2, 0xff0000);
        this.debugSpawnPoint.strokeCircle(SPAWN_X, SPAWN_Y, 10);
        this.debugSpawnPoint.lineStyle(2, 0x00ff00);
        this.debugSpawnPoint.lineBetween(SPAWN_X - 15, SPAWN_Y, SPAWN_X + 15, SPAWN_Y);
        this.debugSpawnPoint.lineBetween(SPAWN_X, SPAWN_Y - 15, SPAWN_X, SPAWN_Y + 15);

        // Add debug text for camera info
        this.debugText = this.add.text(10, 10, '', { 
            font: '16px Arial', 
            fill: '#ff0000',
            backgroundColor: '#ffffff' 
        });
        this.debugText.setScrollFactor(0);  // Fix to camera

        // Set up world physics
        this.physics.world.gravity.y = 800;
        
        // Create platforms group for collision
        this.platforms = this.physics.add.staticGroup();

        // Create player at spawn point
        this.player = new Player(this, SPAWN_X, SPAWN_Y);
        this.physics.add.existing(this.player);
        this.player.setCollideWorldBounds(true);
        
        // Store spawn point for respawning
        this.playerSpawnPoint = {
            x: SPAWN_X,
            y: SPAWN_Y
        };

        // Enable keyboard input
        this.input.keyboard.enabled = true;

        // Reset and set up camera AFTER player creation
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setFollowOffset(0, 0);
        
        // Debug rectangle to show level bounds
        this.debugBounds = this.add.graphics();
        this.debugBounds.lineStyle(2, 0x00ff00);
        this.debugBounds.strokeRect(0, 0, this.LEVEL_WIDTH, this.LEVEL_HEIGHT);
        
        // Update debug text
        this.debugText.setText(
            `Camera: ${Math.floor(this.cameras.main.scrollX)},${Math.floor(this.cameras.main.scrollY)}\n` +
            `Player: ${Math.floor(this.player.x)},${Math.floor(this.player.y)}\n` +
            `World Bounds: ${this.LEVEL_WIDTH}x${this.LEVEL_HEIGHT}`
        );

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
                    this.initializeGameElements();
                }
            });
        });

        // Create debug graphics
        this.debugGraphics = this.add.graphics();
    }

    initializeGameElements() {
        // Initialize game elements without animations or delays
        const spawnPoints = this.findSpawnPointsForSlimes();
        spawnPoints.forEach(point => {
            this.createAndInitSlime(point.x, point.y);
        });

        const bitcoinSpawnPoints = this.findSpawnPointsForBitcoins();
        bitcoinSpawnPoints.forEach(point => {
            const bitcoin = new Bitcoin(this, point.x, point.y);
            this.bitcoins.add(bitcoin);
        });

        // Spawn warriors at different x positions
        const warrior1 = this.createAndInitWarrior(this.scale.width * 0.4);
        const warrior2 = this.createAndInitWarrior(this.scale.width * 0.6);

        // Create random position warriors
        const numRandomWarriors = 1;
        for (let i = 0; i < numRandomWarriors; i++) {
            const spawnPointsForWarriors = this.findSpawnPointsForSlimes(); // Reuse slime spawn point logic
            if (spawnPointsForWarriors.length > 0) {
                const spawnIndex = Math.floor(Math.random() * spawnPointsForWarriors.length);
                const spawnPoint = spawnPointsForWarriors[spawnIndex];
                this.createAndInitWarrior(spawnPoint.x);
                spawnPointsForWarriors.splice(spawnIndex, 1);
            }
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

        // Set initial number of enemies
        this.remainingEnemies = 7;

        // Start game immediately
        this.startGame();
    }

    createAndInitSlime(x, y) {
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
    }

    createAndInitWarrior(x) {
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
    }

    startGame() {
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

    pauseGame() {
        if (this.isGamePaused) return;
        
        this.isGamePaused = true;
        this.physics.pause();
        this.scene.launch('PauseMenu');
        this.scene.pause();
    }

    resumeGame() {
        this.isGamePaused = false;
        this.physics.resume();
        this.scene.resume();
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
        const lives = this.stateManager.get('lives');
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
