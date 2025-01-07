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
import { DestructibleBlock } from '../../prefabs/DestructibleBlock';
import { FallingDestructibleBlock } from '../../prefabs/FallingDestructibleBlock';
import { DisappearingPlatform } from '../../prefabs/DisappearingPlatform';
import { Turret } from '../../prefabs/Turret';
import { EnemyManager } from '../../modules/managers/EnemyManager';
import { EffectsManager } from '../../modules/managers/EffectsManager';
import { BulletPool } from '../../modules/managers/pools/BulletPool';
import { AntivirusWall } from '../../prefabs/AntivirusWall';
import GameConfig from '../../config/GameConfig';

export class GtuTestLevel1 extends BaseScene {
    constructor() {
        super({ key: 'GtuTestLevel1' });
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
        this.load.image('megapixel', 'assets/levels/image/GtuTileset.png');
        
        // Load level data
        this.load.json('level1', 'assets/levels/Json/GtuTestLevel1.json');
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
            
            // Set initial registry values
            this.registry.set('score', 0);
            this.registry.set('lives', 3);
            this.registry.set('playerHP', 100);
            this.registry.set('stamina', 100); // Reset stamina to full
            this.registry.set('bitcoins', 0);
            
            // Get level data and dimensions from JSON
            const levelData = this.cache.json.get('level1');
            if (!levelData) {
                console.error('Failed to load level data');
                return;
            }
            const levelWidth = levelData.pxWid;
            const levelHeight = levelData.pxHei;
            
            // Initialize camera manager with level dimensions
            this.cameraManager = new CameraManager(this, levelWidth, levelHeight);
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
            const SPAWN_Y = 256;             // 8 tiles from top
            
            // Override base scene's spawn point for this level
            this.playerSpawnPoint = {
                x: width * SPAWN_X_PERCENTAGE,
                y: SPAWN_Y
            };

            // Set player position
            this.player.setPosition(this.playerSpawnPoint.x, this.playerSpawnPoint.y);
            
            // Set world bounds to match the level size
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

            // Create debug graphics
            this.debugGraphics = this.add.graphics();

            // Store background music reference
            // Removed this.bgMusic = this.sound.add('bgMusic', { loop: true });
            // Removed this.bgMusic.play();

            // Create antivirus wall (make sure it's created after physics world is set up)
            this.antivirusWall = new AntivirusWall(this, 0); // Start at left edge
            
            // Set up collision between player and antivirus wall
            this.physics.add.overlap(this.player, this.antivirusWall.wall, this.handleAntivirusCollision, null, this);

            // Make sure wall is behind UI but in front of other elements
            if (this.gameUI && this.gameUI.container) {
                this.gameUI.container.setDepth(100);
                this.antivirusWall.wall.setDepth(90);
            }

            // Debug level data loading
            if (!levelData) {
                console.error('Failed to load level data');
                return;
            }

            // Get the layer instance for Tiles layer
            const megapixelLayer = levelData.layerInstances[1];  // Second layer is our Tiles layer
            if (!megapixelLayer) {
                console.error('Tiles layer not found');
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
            const layer = map.createBlankLayer('Tiles', tileset, 0, 0);
            
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
                this.setupTileCollisions(this.map, this.mapLayer);

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
        });
    }

    setupRestOfScene() {
        // Initialize managers
        this.effectsManager = new EffectsManager(this);
        this.bulletPool = new BulletPool(this);

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
    }

    setupTileBasedLevel() {
        // Define tile dimensions based on camera view
        const tileWidth = this.scale.width;
        const tileHeight = this.scale.height;

        // Create tile map for level layout (2x2 grid with more challenging content)
        this.levelTiles = [
            // Tile 0,0 (starting area)
            {
                x: 0,
                y: 0,
                setup: () => {
                    // Starting platform with a trampoline
                    this.createPlatform(100, 300, 250, 20);
                    this.createTrampoline(200, 280);
                    this.createSlime(150, 250);
                }
            },
            // Tile 1,0 (right side - combat area)
            {
                x: tileWidth,
                y: 0,
                setup: () => {
                    // Multiple platforms with enemies
                    this.createPlatform(tileWidth + 100, 400, 200, 20);
                    this.createPlatform(tileWidth + 400, 300, 200, 20);
                    this.createMeleeWarrior(tileWidth + 150);
                    this.createDrone(tileWidth + 450, 200);
                }
            },
            // Tile 0,1 (bottom - puzzle area)
            {
                x: 0,
                y: tileHeight,
                setup: () => {
                    // Destructible blocks and disappearing platforms
                    this.createPlatform(200, tileHeight + 350, 200, 20);
                    this.createDestructibleBlock(100, tileHeight + 250);
                    this.createDisappearingPlatform(300, tileHeight + 200);
                    this.createTurret(250, tileHeight + 300);
                }
            },
            // Tile 1,1 (bottom right - challenge area)
            {
                x: tileWidth,
                y: tileHeight,
                setup: () => {
                    // Complex platform arrangement with multiple enemies
                    this.createPlatform(tileWidth + 150, tileHeight + 300, 200, 20);
                    this.createPlatform(tileWidth + 400, tileHeight + 200, 200, 20);
                    this.createMeleeWarrior(tileWidth + 200);
                    this.createDrone(tileWidth + 450, tileHeight + 150);
                    this.createTrap(tileWidth + 300, tileHeight + 280);
                }
            }
        ];

        // Set up each tile
        this.levelTiles.forEach(tile => tile.setup());
    }

    startGame() {
        // Enable player controls
        if (this.player) {
            this.player.controller.enabled = true;
            this.gameStarted = true;
        }
    }

    update(time, delta) {
        // Only update game elements if the game has started
        if (!this.gameStarted) return;

        // Update player if it exists
        if (this.player) {
            this.player.update(time, delta);
        }

        // Update antivirus wall if it exists
        if (this.antivirusWall) {
            this.antivirusWall.update(time, delta);
        }

        // Update bullet pool to check for out-of-bounds bullets
        this.bulletPool.update();

        // Update game UI
        if (this.gameUI) {
            this.gameUI.update(time, delta);
        }

        // Update camera to follow player
        if (this.player) {
            this.cameras.main.startFollow(this.player);
        }

        // Check for scene transition
        const reachedEnd = this.player.x > 3740;
        if (reachedEnd) {
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
        if (this.isDying) return; // Prevent multiple death handlers
        
        this.isDying = true;
        this.player.setVelocity(0, 0);
        this.player.body.moves = false;
        
        // Stop and reset antivirus wall immediately
        if (this.antivirusWall) {
            this.antivirusWall.stop();
            this.antivirusWall.reset(GameConfig.ANTIVIRUS_WALL.START_X);
        }
        
        // Decrease lives using StateManager
        const lives = this.registry.get('lives');
        if (lives <= 0) {
            // Game Over - stop timer and transition
            this.gameUI.stopTimer();
            this.scene.start('GameOver');
        } else {
            // If no death animation, wait a moment then proceed
            this.time.delayedCall(1000, () => {
                this.handleRespawn();
            });
        }
    }

    handleRespawn() {
        // Get spawn point from current scene if available
        const currentScene = this.scene.get(this.scene.key);
        const spawnPoint = currentScene.playerSpawnPoint || this.playerSpawnPoint;
        
        // Reset player position using spawn point
        this.player.setPosition(spawnPoint.x, spawnPoint.y);
        this.player.setVelocity(0, 0);
        
        // Reset player state
        this.isDying = false;
        this.player.body.moves = true;
        this.player.setAlpha(1);
        
        // Reset player HP
        this.registry.set('playerHP', 100);
        this.gameUI.updateHP(100);
        
        // Start antivirus wall after delay
        if (this.antivirusWall) {
            this.time.delayedCall(GameConfig.ANTIVIRUS_WALL.RESPAWN_DELAY, () => {
                if (this.gameStarted && !this.isGamePaused) {
                    this.antivirusWall.start();
                    this.cameras.main.flash(GameConfig.ANTIVIRUS_WALL.FLASH_DURATION, 0, 136, 255);
                }
            });
        }
        
        // Add temporary invulnerability
        this.invulnerableUntil = this.time.now + 2000; // 2 seconds of invulnerability
        
        // Flash effect to show invulnerability
        this.tweens.add({
            targets: this.player,
            alpha: 0.5,
            duration: 200,
            yoyo: true,
            repeat: 4,
            onComplete: () => {
                this.player.setAlpha(1);
            }
        });

        // Reset player animations if needed
        if (this.player.play) {
            this.player.play('character_Idle');
        }
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

    handleAntivirusCollision() {
        // Instant death on antivirus collision
        if (!this.player.isDying) {
            this.player.die();
        }
    }

    cleanup() {
        super.cleanup();
        
        // Clean up pools
        if (this.bulletPool) {
            this.bulletPool.destroy();
        }
    }
}
