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
        this.load.spritesheet('character_Idle', '/assets/player/idle.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('character_Walking', '/assets/player/run.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('character_Jump', '/assets/player/jump.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('character_Fall', '/assets/player/fall.png', { frameWidth: 32, frameHeight: 32 });

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
        // Call parent create first to set up base systems
        super.create();
        
        // Set up world bounds and physics
        this.physics.world.setBounds(0, 0, 640, 360);
        
        // Set scene background color
        this.cameras.main.setBackgroundColor('#ffffff');
        
        // Add semi-transparent white background
        const bg = this.add.rectangle(320, 180, 640, 360, 0xFFFFFF);
        bg.setAlpha(0.5);  // 50% transparency
        bg.setDepth(-1);   // Keep it at the back

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

        // Store player spawn point (near the left side, above ground)
        this.playerSpawnPoint = {
            x: 100,
            y: 280  // Adjust this based on your ground level
        };

        // Create player using BaseScene's method
        this.createPlayer(this.LEVEL_WIDTH);
        
        // Ensure player has proper physics and collision
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, layer);

        // Make sure player controller is enabled
        if (this.player.controller) {
            this.player.controller.enabled = true;
        }

        // Add ESC key for pause menu
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.pauseKey.on('down', () => {
            this.pauseGame();
        });

        // Reset and set up camera AFTER player creation
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setFollowOffset(0, 0);
        
        // Update debug text with initial values
        if (this.debugText) {
            this.debugText.setText(
                `Camera: ${Math.floor(this.cameras.main.scrollX)},${Math.floor(this.cameras.main.scrollY)}\n` +
                `Player: ${Math.floor(this.player.x)},${Math.floor(this.player.y)}\n` +
                `World Bounds: ${this.LEVEL_WIDTH}x${this.LEVEL_HEIGHT}`
            );
        }
        
        // Debug rectangle to show level bounds
        this.debugBounds = this.add.graphics();
        this.debugBounds.lineStyle(2, 0x00ff00);
        this.debugBounds.strokeRect(0, 0, this.LEVEL_WIDTH, this.LEVEL_HEIGHT);
        
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
            const x = this.scale.width * (0.3 + (0.4 * (i / enemyConfig.MeleeWarrior)));
            this.createAndInitWarrior(x);
        }

        // Spawn Drones
        for (let i = 0; i < enemyConfig.Drone; i++) {
            const droneX = this.scale.width * (0.4 + (0.2 * i));
            const enemyY = this.scale.height * 0.2;

            const drone = new Drone(this, droneX, enemyY, {
                maxHealth: 75,
                damage: 20,
                speed: 100,
                flyingHeight: enemyY,
                horizontalMovementRange: 100
            });

            this.drones.add(drone.sprite);
            this.enemyManager.addEnemy(drone, drone.sprite, drone.maxHealth);

            const patrolPoints = [
                { x: droneX - 200, y: enemyY },
                { x: droneX + 200, y: enemyY }
            ];
            drone.setPatrolPath(patrolPoints);

            this.events.on('update', () => {
                if (drone && drone.sprite && drone.sprite.active) {
                    drone.update();
                }
            });
        }

        const bitcoinSpawnPoints = this.findSpawnPointsForBitcoins();
        bitcoinSpawnPoints.forEach(point => {
            const bitcoin = new Bitcoin(this, point.x, point.y);
            this.bitcoins.add(bitcoin);
        });

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
        this.remainingEnemies = Object.values(enemyConfig).reduce((a, b) => a + b, 0);

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
        super.update(time, delta);

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

        // Update debug visuals if enabled
        this.updateDebugVisuals();

        // Update debug text if it exists
        if (this.debugText) {
            this.debugText.setText(
                `Camera: ${Math.floor(this.cameras.main.scrollX)},${Math.floor(this.cameras.main.scrollY)}\n` +
                `Player: ${Math.floor(this.player.x)},${Math.floor(this.player.y)}\n` +
                `World Bounds: ${this.LEVEL_WIDTH}x${this.LEVEL_HEIGHT}`
            );
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
        
        // Disable player controller
        if (this.player && this.player.controller) {
            this.player.controller.enabled = false;
        }
        
        this.scene.launch('PauseMenu');
        this.scene.pause();
    }

    resumeGame() {
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
