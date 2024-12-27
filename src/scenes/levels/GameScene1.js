import { BaseScene } from '../elements/BaseScene';
import { GameUI } from '../elements/GameUI';
import { Slime } from '../../prefabs/Slime';
import { Bitcoin } from '../../prefabs/Bitcoin';
import Drone from '../../prefabs/Drone'; 
import CameraManager from '../../modules/managers/CameraManager';

export class GameScene1 extends BaseScene {
    constructor() {
        super({ key: 'GameScene1' });
        this.tileColliderAdded = false;
        this.messageShown = false;
        this.totalEnemies = 4; // Increased to include drone
        this.remainingEnemies = this.totalEnemies;
        this.drone = null; // Add drone reference
    }

    preload() {
        // Load all audio files
        this.load.audio('laser', 'assets/sounds/laser.wav');
        this.load.audio('hit', 'assets/sounds/hit.wav');
        this.load.audio('victoryMusic', 'assets/sounds/congratulations');

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
        // Call parent create first to set up base systems
        super.create();
        
        const { width, height } = this.scale;
        
        // Initialize debug system if not already initialized
        if (!this.debugSystem) {
            this.debugSystem = {
                enabled: false,
                toggle: () => {
                    this.debugSystem.enabled = !this.debugSystem.enabled;
                    this.updateDebugVisuals();
                }
            };
        }

        // Add ESC key for pause menu
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.pauseKey.on('down', () => {
            this.pauseGame();
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

        // Initialize slimes group
        this.slimes = this.physics.add.group({
            collideWorldBounds: true,
            bounceX: 0.5,
            bounceY: 0.2,
            dragX: 200
        });

        // Add collision between bullets and slimes
        this.physics.add.collider(this.bullets, this.slimes, (bullet, slimeSprite) => {
            // Get the slime instance from the sprite
            const slime = slimeSprite.enemy;
            if (slime) {
                // Damage the slime
                slime.damage(1);
                
                // Create hit effect and destroy bullet
                this.effectsManager.createHitEffect(bullet.x, bullet.y);
                bullet.destroy();
            }
        }, null, this);

        // Hide the scene initially
        this.cameras.main.setAlpha(0);

        // Set up UI
        this.gameUI = new GameUI(this);
        
        // Make sure UI stays fixed
        this.gameUI.container.setScrollFactor(0);
        
        // Debug UI visibility
        console.log('GameScene1 UI Setup:', {
            container: {
                x: this.gameUI.container.x,
                y: this.gameUI.container.y,
                visible: this.gameUI.container.visible,
                alpha: this.gameUI.container.alpha,
                children: this.gameUI.container.length
            },
            camera: {
                visible: this.gameUI.uiCamera.visible,
                active: this.gameUI.uiCamera.active,
                viewport: this.gameUI.uiCamera.viewport,
                scroll: {
                    x: this.gameUI.uiCamera.scrollX,
                    y: this.gameUI.uiCamera.scrollY
                },
                zoom: this.gameUI.uiCamera.zoom
            }
        });

        // Update camera ignore lists
        this.gameUI.updateCameraIgnoreList();
        
        // Create enemy group
        this.enemies = this.physics.add.group({
            collideWorldBounds: true,
            bounceX: 0.5,
            bounceY: 0.2,
            dragX: 200
        });

        // Create bitcoin group
        this.bitcoins = this.add.group();

        // Add 10 bitcoins spread across the level
        const startX = width * 0.2;
        const endX = width * 0.8;
        const spacing = (endX - startX) / 9; // 9 spaces for 10 coins
        const baseY = height - 150; // Base Y position (150px from bottom)

        for (let i = 0; i < 10; i++) {
            const x = startX + (i * spacing);
            const y = baseY - Phaser.Math.Between(0, 100); // Random height up to 100px above base
            const bitcoin = new Bitcoin(this, x, y);
            this.bitcoins.add(bitcoin);
            this.physics.add.overlap(this.player, bitcoin, () => {
                bitcoin.collect();
            });
        }

        // Create drones group with consistent physics settings
        this.drones = this.physics.add.group({
            runChildUpdate: true,
            collideWorldBounds: true,
            dragX: 200,
            bounceX: 0.2,
            bounceY: 0.2,
            gravityY: 0
        });

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
            // Add collision between player and tile layer
            if (this.player && this.mapLayer) {
                this.physics.add.collider(this.player, this.mapLayer);
            }

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
    }

    setupRestOfScene() {
        // Create player if it doesn't exist
        if (!this.player) {
            this.createPlayer(this.scale.width);
        }

        // Set up collisions with tile layer if not already done
        if (this.player && this.mapLayer && !this.tileColliderAdded) {
            this.physics.add.collider(this.player, this.mapLayer);
            this.tileColliderAdded = true;
            
            // Add collision between bullets and tile layer
            this.physics.add.collider(this.bullets, this.mapLayer, (bullet) => {
                this.effectsManager.createHitEffect(bullet.x, bullet.y);
                this.destroyBullet(bullet);
            }, null, this);
        }

        // Function to find valid spawn points for enemies
        const findSpawnPoints = () => {
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
                        // Position enemy exactly on top of the tile
                        spawnPoints.push({ 
                            x: x * 32 + 16, // Center of tile
                            y: y * 32 - 8   // Just above the tile
                        });
                    }
                }
            }
            return spawnPoints;
        };

        // Create drones group with consistent physics settings
        this.drones = this.physics.add.group({
            runChildUpdate: true,
            collideWorldBounds: true,
            dragX: 200,
            bounceX: 0.2,
            bounceY: 0.2,
            gravityY: 0
        });

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

            // Add drone to physics group
            if (drone && drone.sprite) {
                // Set up sprite properties
                drone.sprite.setActive(true);
                drone.sprite.setVisible(true);
                
                // Set up physics body
                if (drone.sprite.body) {
                    drone.sprite.body.reset(droneX, enemyY);
                    drone.sprite.body.enable = true;
                    drone.sprite.body.moves = true;
                    drone.sprite.body.setAllowGravity(false);
                    drone.sprite.body.setGravityY(0);
                    drone.sprite.body.setVelocityY(0);
                    drone.sprite.body.setImmovable(true);
                }

                // Add drone sprite to the drones group
                this.drones.add(drone.sprite);
                // Store the enemy instance on the sprite for debug access
                drone.sprite.enemy = drone;

                // Set up patrol path
                const patrolPoints = [
                    { x: droneX - 200, y: enemyY },  // Left point
                    { x: droneX + 200, y: enemyY }   // Right point
                ];
                drone.setPatrolPath(patrolPoints);

                // Add collision with map layer
                if (this.mapLayer) {
                    this.physics.add.collider(drone.sprite, this.mapLayer, null, null, this);
                    this.physics.add.collider(drone.sprite, this.platforms);
                }

                // Add to scene update
                this.events.on('update', () => {
                    if (drone && drone.sprite && drone.sprite.active) {
                        drone.update();
                    }
                });

                // Store drone reference
                this.drone = drone;
            }
        } else {
            console.warn('Cannot spawn drone: player not found');
        }

        // Create and set up slimes group with consistent physics settings
        // this.slimes = this.physics.add.group({
        //     runChildUpdate: true,
        //     collideWorldBounds: true,
        //     dragX: 200,
        //     bounceX: 0.2,
        //     bounceY: 0.2,
        //     gravityY: 1000
        // });

        // Add collision between slimes and tile layer
        if (this.mapLayer) {
            // Set up tile collision properties
            this.mapLayer.setCollisionByProperty({ collides: true });
            this.mapLayer.setCollision(370); // Solid tile type

            // Add collider between slimes and map layer
            this.physics.add.collider(this.slimes, this.mapLayer, null, null, this);
            
            // Add collider between slimes and platforms
            this.physics.add.collider(this.slimes, this.platforms);
        }

        // Add collider between slimes and platforms
        this.physics.add.collider(this.slimes, this.platforms);

        // Function to find valid spawn points for slimes
        const findSpawnPointsForSlimes = () => {
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
        };

        // Find valid spawn points
        const spawnPointsForSlimes = findSpawnPointsForSlimes();

        // Create all slimes (both random and fixed positions)
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

        // Create fixed position slimes
        const enemyY = this.scale.height * 0.7;
        this.enemy1 = createAndInitSlime(this.scale.width * 0.3, enemyY);
        this.enemy2 = createAndInitSlime(this.scale.width * 0.7, enemyY);

        // Create random position slimes
        const numRandomSlimes = 1; 
        for (let i = 0; i < numRandomSlimes; i++) {
            if (spawnPointsForSlimes.length > 0) {
                const spawnIndex = Math.floor(Math.random() * spawnPointsForSlimes.length);
                const spawnPoint = spawnPointsForSlimes[spawnIndex];
                createAndInitSlime(spawnPoint.x, spawnPoint.y);
                spawnPointsForSlimes.splice(spawnIndex, 1);
            }
        }

        // Set up collisions between slimes
        this.physics.add.collider(this.slimes, this.slimes);

        // Set up bullet collisions
        this.physics.add.collider(
            this.bullets, 
            this.slimes, 
            this.hitEnemyWithBullet, 
            (bullet, enemySprite) => {
                return enemySprite.enemy && !enemySprite.enemy.isInvincible;
            },
            this
        );

        // Create camera bounds
        this.cameras.main.setBounds(0, 0, 3840, 1080);
        this.cameras.main.startFollow(this.player);

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
        this.remainingEnemies = 4;

        // Wait a short moment for platforms to be fully set up
        this.time.delayedCall(100, () => {
            // Calculate spawn height relative to ground
            const enemyY = this.groundTop - 16;  // Same calculation as player spawn

            // Set up bullet collisions with process callback
            this.physics.add.collider(
                this.bullets, 
                this.slimes, 
                this.hitEnemyWithBullet, 
                (bullet, enemySprite) => {
                    // Only process collision if enemy is not invincible
                    return enemySprite.enemy && !enemySprite.enemy.isInvincible;
                },
                this
            );
            
            // Set number of enemies
            this.remainingEnemies = 4;
        });
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        // Skip if enemy is already being destroyed
        if (!enemySprite.active || !enemySprite.body || !enemySprite.body.enable) {
            bullet.destroy();
            return;
        }
        
        // Create particles at hit location
        this.effectsManager.createHitEffect(bullet.x, bullet.y);
        
        // Play hit sound and destroy bullet
        this.hitSound.play();
        bullet.destroy();
        
        // Get the enemy instance directly from the sprite
        const enemy = enemySprite.enemy;
        if (enemy && !enemy.isInvincible) {
            // If enemy dies from this hit
            if (enemy.damage(1)) {
                // Add points before destroying the enemy
                this.addPoints(10);
                this.remainingEnemies--;
                
                // Log enemy death
                console.log(`Enemy defeated! Remaining enemies: ${this.remainingEnemies}`);
                
                // Check if level is complete
                if (this.remainingEnemies <= 0) {
                    console.log('All enemies defeated! You can now proceed.');
                    this.checkLevelComplete();
                }
            }
        }
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
        if (this.isGamePaused) return;

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
        if (this.player.lives <= 0) {
            // Game Over - stop timer and transition
            this.gameUI.stopTimer();
            this.scene.start('GameOver');
            return;
        }

        // Reset player position and make them temporarily invulnerable
        this.player.setPosition(this.spawnPoint.x, this.spawnPoint.y);
        this.player.setInvulnerable();
    }
}
