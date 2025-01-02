import { BaseScene } from '../elements/BaseScene';
import { GameUI } from '../elements/GameUI';
import { LevelLoader } from '../../modules/managers/LevelLoader';
import { TrapManager } from '../../modules/managers/TrapManager';
import { SceneInitializer } from '../../modules/managers/SceneInitializer';
import { StateManager } from '../../modules/managers/StateManager';
import { EffectsManager } from '../../modules/managers/EffectsManager';
import { EnemyManager } from '../../modules/managers/EnemyManager';
import { CollisionManager } from '../../modules/managers/CollisionManager';
import { SceneBoundaryManager } from '../../modules/managers/BoundaryManager';
import { AnimationManager } from '../../modules/managers/AnimationManager';
import { DebugSystem } from '../../_Debug/DebugSystem';

export class Matrix640x360 extends BaseScene {
    constructor() {
        super({ 
            key: 'Matrix640x360',
            backgroundColor: 'cyan',
        });
        this.ROOM_WIDTH = 640;
        this.ROOM_HEIGHT = 360;
        this.totalEnemies = 7;
        this.remainingEnemies = this.totalEnemies;
        this.isGamePaused = false;
    }

    preload() {
        // Load level data
        this.load.json('matrix', '/assets/levels/Json/Matrix_640w_360h.json');
        
        // Load all audio files
        this.load.audio('laser', '/assets/sounds/laser.wav');
        this.load.audio('hit', '/assets/sounds/hit.wav');
        this.load.audio('victoryMusic', '/assets/sounds/congratulations');
        this.load.audio('thezucc', '/assets/sounds/thezucc.wav');
        this.load.audio('alarm', '/assets/sounds/alarm.wav');

        // Load tileset
        this.load.spritesheet('megapixel', '/assets/levels/image/WannabeeTileset.png', {
            frameWidth: 32,
            frameHeight: 32,
            spacing: 0,
            margin: 0
        });

        // Load other assets from BaseScene
        super.preload();
    }

    create() {
        // Get trap config
        const sceneData = this.scene.settings.data;
        const zuccScene = this.scene.get('TheZucc');
        this.trapConfig = {
            AlarmTrigger: sceneData?.trapConfig?.AlarmTrigger ?? 
                         zuccScene?.trapConfig?.AlarmTrigger ?? 1
        };

        // Setup background music
        if (this.sound.get('bgMusic')) {
            this.sound.get('bgMusic').stop();
        }
        this.bgMusic = this.sound.add('thezucc', { loop: true });
        this.bgMusic.play();

        // Initialize scene
        WebFont.load({
            google: { families: ['Press Start 2P'] },
            active: () => {
                this.initializeLevel();
                // Add ESC key for pause menu after level initialization
                this.input.keyboard.on('keydown-ESC', () => {
                    if (!this.isGamePaused) {
                        this.pauseGame();
                    }
                });
            }
        });
    }

    initializeLevel() {
        // Initialize scene components
        const initializer = new SceneInitializer(this);
        const managers = initializer.initializeScene();
        Object.assign(this, managers);

        // Load level
        const levelLoader = new LevelLoader(this);
        const { map, layer } = levelLoader.loadLevel('matrix');
        
        // Check if level loading failed
        if (!map || !layer) {
            console.error('Failed to load level. Returning to main menu...');
            this.scene.start('MainMenu');
            return;
        }

        // Set up collisions between player and tiles
        this.physics.add.collider(this.player, this.tileLayer);
        this.physics.add.collider(this.player, layer);
        
        // Set up collisions between enemies and tiles
        this.physics.add.collider(this.enemies, this.tileLayer);
        this.physics.add.collider(this.enemies, layer);
        
        // Set up collisions between bullets and tiles
        this.physics.add.collider(this.bullets, this.tileLayer, (bullet) => bullet.destroy());
        this.physics.add.collider(this.bullets, layer, (bullet) => bullet.destroy());

        // Setup traps
        const trapManager = new TrapManager(this);
        trapManager.createTraps(this.trapConfig);
        trapManager.setupCollisions(this.player);

        // Initialize UI and collisions
        this.gameUI = new GameUI(this);
        this.collisionManager.setupCollisions();
        
        // Start game
        this.startGame();
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
        
        // Update debug system
        if (this.debugSystem) {
            this.debugSystem.update(time);
        }

        // Check for active slimes based on their health
        if (this.slimes) {
            this.slimes.children.iterate(slime => {
                if (slime && slime.health <= 0) {
                    slime.destroy();
                }
            });
        }
    }

    updateDebugVisuals() {
        if (this.debugGraphics) {
            this.debugGraphics.clear();
            this.debugSystem.drawDebugInfo();
        }
    }

    pauseGame() {
        if (this.isGamePaused) return;
        
        this.isGamePaused = true;
        this.physics.pause();
        
        // Disable player input
        if (this.player && this.player.controller) {
            this.player.controller.enabled = false;
        }

        // Launch the pause menu scene
        this.scene.launch('PauseMenu');
        this.scene.pause();
    }

    resumeGame() {
        if (!this.isGamePaused) return;
        
        this.isGamePaused = false;
        this.physics.resume();
        
        // Re-enable player input
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
