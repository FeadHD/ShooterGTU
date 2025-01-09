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
import { Bullet } from '../../prefabs/Bullet';
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
        
        // Progressive loading properties
        this.loadedSections = new Set();
        this.sectionWidth = 1280; // Width of each level section
        this.activeEntities = new Set();
        this.currentLevelData = null;
        this.gameStarted = false;
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
        
        // Load bullet sprite
        this.load.spritesheet('bullet_animation', 'assets/sprites/bullet.png', {
            frameWidth: 24,
            frameHeight: 24
        });

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

        // Create bullet animation
        this.anims.create({
            key: 'bullet_anim',
            frames: this.anims.generateFrameNumbers('bullet_animation', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        // Create physics groups
        this.platforms = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        
        // Initialize bullets group (replacing BulletPool)
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 20,
            runChildUpdate: true,
            allowGravity: false
        });
        
        // Create a group for debug text
        this.debugTexts = this.add.group();
        
        // Load LDTK data to get dimensions
        const ldtkData = this.cache.json.get('combined-level');
        if (!ldtkData || !ldtkData.levels || ldtkData.levels.length === 0) {
            console.error('Failed to load LDTK data');
            return;
        }

        // Get level dimensions from LDTK
        const firstLevel = ldtkData.levels[0];
        this.singleLevelWidth = firstLevel.pxWid || 2048;
        const levelHeight = firstLevel.pxHei || 512;
        this.totalLevels = ldtkData.levels.length;
        
        // Calculate total width
        const levelWidth = this.singleLevelWidth * this.totalLevels;
        const worldHeight = levelHeight;

        console.log('World dimensions from LDTK:', {
            singleLevelWidth: this.singleLevelWidth,
            totalWidth: levelWidth,
            worldHeight: worldHeight,
            levelHeight: levelHeight,
            totalLevels: this.totalLevels
        });

        // Initialize managers
        this.cameraManager = new CombinedLevelCamera(this);
        this.collisionManager = new CollisionManager(this);
        this.enemyManager = new EnemyManager(this);
        this.effectsManager = new EffectsManager(this);
        this.tileManager = new LDTKTileManager(this);

        // Create the base tilemap with dynamic dimensions
        this.map = this.make.tilemap({
            tileWidth: 32,
            tileHeight: 32,
            width: Math.ceil(levelWidth / 32),
            height: Math.ceil(worldHeight / 32)
        });

        // Add tileset
        this.tileset = this.map.addTilesetImage('GtuTileset');
        if (!this.tileset) {
            console.error('Failed to load tileset');
            return;
        }

        // Create separate layers for ground and platforms
        this.groundLayer = this.map.createBlankLayer('Ground', this.tileset);
        this.platformLayer = this.map.createBlankLayer('Platforms', this.tileset);
        
        if (!this.groundLayer || !this.platformLayer) {
            console.error('Failed to create layers');
            return;
        }

        // Set world bounds
        this.physics.world.setBounds(0, 0, levelWidth, worldHeight);

        // Load initial level data
        this.currentLevelData = this.cache.json.get('combined-level');
        
        // Create initial level section
        this.loadLevelSection(0);
        
        // Initialize camera
        this.levelCamera = new CombinedLevelCamera(this);
        this.levelCamera.init(this.player);
        
        // Set up collision detection
        this.setupCollisions();

        // Create player at the start
        this.createPlayer(100, 200); // Moved player spawn point up to account for higher level

        // Add colliders
        this.physics.add.collider(this.player, this.groundLayer);
        this.physics.add.collider(this.player, this.platformLayer);
        this.physics.add.collider(this.enemies, this.groundLayer);
        this.physics.add.collider(this.enemies, this.platformLayer);
        
        // Set up camera to follow player smoothly with the new height
        if (this.cameraManager && this.cameraManager.camera) {
            this.cameraManager.camera.setBounds(0, 0, levelWidth, worldHeight);
            this.cameraManager.camera.startFollow(this.player, true, 0.1, 0.1);
        }

        // Set camera and world bounds
        this.cameras.main.setBounds(0, 0, levelWidth, worldHeight);
        this.physics.world.setBounds(0, 0, levelWidth, worldHeight);

        // Initialize UI
        this.setupUI();

        // Add debug graphics for boundaries
        this.boundaryGraphics = this.add.graphics();
        this.boundaryGraphics.setDepth(1000);
        
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

    setupCollisions() {
        // Add collisions between bullets and enemies
        this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
            bullet.destroy();
            enemy.damage(10);
        });

        // Add collisions between bullets and platforms
        this.physics.add.collider(this.bullets, this.platforms, (bullet) => {
            bullet.destroy();
        });
    }

    loadLevelSection(startX) {
        if (this.loadedSections.has(startX)) return;
        
        // Mark this section as loaded
        this.loadedSections.add(startX);
        
        // Calculate section bounds
        const sectionEnd = startX + this.sectionWidth;
        
        if (!this.currentLevelData || !this.currentLevelData.levels) {
            console.error('No level data available');
            return;
        }

        // Find the level that contains this section
        const levelIndex = Math.floor(startX / this.singleLevelWidth);
        const level = this.currentLevelData.levels[levelIndex];
        
        if (!level) {
            console.error('No level data found for section at', startX);
            return;
        }

        // Find the Solid layer
        const solidLayer = level.layerInstances.find(layer => 
            layer.__identifier === 'Solid' || layer.__type === 'IntGrid'
        );

        if (solidLayer) {
            // Calculate the relative position within the level
            const relativeStartX = startX % this.singleLevelWidth;
            
            // Process auto-layer tiles
            if (solidLayer.autoLayerTiles) {
                solidLayer.autoLayerTiles.forEach(tile => {
                    const tileX = tile.px[0] + level.worldX;
                    const tileY = tile.px[1];
                    
                    // Only place tiles within the current section
                    if (tileX >= startX && tileX < sectionEnd) {
                        const gridX = Math.floor(tileX / 32);
                        const gridY = Math.floor(tileY / 32);
                        
                        // Map LDTK tile IDs to our tileset IDs
                        let tileId = tile.t;
                        switch(tileId) {
                            case 257: // Basic platform
                                tileId = 642;
                                break;
                            case 258: // Platform variation
                                tileId = 643;
                                break;
                            case 261: // Another platform variation
                                tileId = 644;
                                break;
                            default:
                                tileId = 642; // Default to basic platform
                        }
                        
                        // Place the tile in both layers for visual and collision
                        this.groundLayer.putTileAt(tileId, gridX, gridY);
                        const platformTile = this.platformLayer.putTileAt(tileId, gridX, gridY);
                        if (platformTile) {
                            platformTile.setCollision(true);
                        }
                    }
                });
            }

            // Process IntGrid values
            if (solidLayer.intGridCsv) {
                const width = solidLayer.__cWid;
                const height = solidLayer.__cHei;
                const startTile = Math.floor(relativeStartX / 32);
                const endTile = Math.ceil(sectionEnd / 32);

                for (let y = 0; y < height; y++) {
                    for (let x = startTile; x < endTile; x++) {
                        const idx = y * width + x;
                        const value = solidLayer.intGridCsv[idx];
                        
                        if (value > 0) {
                            const worldX = Math.floor((x * 32 + level.worldX) / 32);
                            const worldY = Math.floor(y);
                            
                            // Map IntGrid values to tileset IDs
                            let tileId;
                            switch(value) {
                                case 1: // Ground
                                    tileId = 642;
                                    break;
                                case 2: // Platform
                                    tileId = 643;
                                    break;
                                default:
                                    tileId = 642;
                            }
                            
                            // Place tiles in both layers
                            this.groundLayer.putTileAt(tileId, worldX, worldY);
                            const platformTile = this.platformLayer.putTileAt(tileId, worldX, worldY);
                            if (platformTile) {
                                platformTile.setCollision(true);
                            }
                        }
                    }
                }
            }
        }

        // Set collision for the platform layer
        this.platformLayer.setCollisionByExclusion([-1]);
        
        // Spawn entities for this section
        this.spawnEntitiesInSection(startX, sectionEnd);
    }

    loadNextLevelSection(cameraRight) {
        const nextSectionStart = Math.floor(cameraRight / this.sectionWidth) * this.sectionWidth;
        this.loadLevelSection(nextSectionStart);
    }

    cleanupBehindPlayer(cleanupX) {
        // Remove entities that are too far behind
        for (const entity of this.activeEntities) {
            if (entity.x < cleanupX) {
                entity.destroy();
                this.activeEntities.delete(entity);
            }
        }
        
        // Remove tile hitboxes that are too far behind
        this.tileManager.cleanupHitboxes(cleanupX);
    }

    spawnEntitiesInSection(startX, endX) {
        if (!this.currentLevelData || !this.currentLevelData.layerInstances) return;
        
        // Find entities layer
        const entitiesLayer = this.currentLevelData.layerInstances.find(
            layer => layer.__identifier === 'Entities'
        );
        
        if (!entitiesLayer) return;
        
        // Spawn entities within this section
        entitiesLayer.entityInstances.forEach(entity => {
            const entityX = entity.__worldX;
            if (entityX >= startX && entityX < endX) {
                const spawnedEntity = this.spawnEntity(entity);
                if (spawnedEntity) {
                    this.activeEntities.add(spawnedEntity);
                }
            }
        });
    }

    spawnEntity(entityData) {
        // Implementation of entity spawning based on type
        switch(entityData.__identifier) {
            case 'Enemy':
                return new Enemy(this, entityData.__worldX, entityData.__worldY);
            case 'Bitcoin':
                return new Bitcoin(this, entityData.__worldX, entityData.__worldY);
            // Add other entity types as needed
        }
        return null;
    }

    update(time, delta) {
        super.update(time, delta);
        
        if (this.player && this.cameraManager) {
            // Update current level indicator based on player position
            const currentLevel = Math.floor(this.player.x / this.singleLevelWidth);
            if (currentLevel !== this.currentLevel && this.levelIndicatorText) {
                this.currentLevel = currentLevel;
                this.levelIndicatorText.setText(`Level ${currentLevel}`);
            }
        }
        
        // Update boundary visualization
        if (this.boundaryGraphics) {
            this.boundaryGraphics.clear();
            
            // Draw world boundaries in red
            this.boundaryGraphics.lineStyle(4, 0xff0000, 1);
            this.boundaryGraphics.strokeRect(0, 0, this.singleLevelWidth * this.totalLevels, 512);
            
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
        
        // Load next level section if necessary
        const cameraRight = this.cameras.main.worldView.right;
        if (cameraRight > this.sectionWidth && !this.loadedSections.has(cameraRight)) {
            this.loadNextLevelSection(cameraRight);
        }
        
        // Clean up entities behind the player
        const cleanupX = this.player.x - this.sectionWidth;
        this.cleanupBehindPlayer(cleanupX);
    }

    setupUI() {
        // Initialize game UI
        this.gameUI = new GameUI(this);
        if (this.gameUI.container) {
            this.gameUI.container.setScrollFactor(0);
        }

        // Set up initial player HP
        const INITIAL_HP = 100;
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

        // Show start message if gameUI exists
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

    togglePause() {
        if (this.scene.isPaused('CombinedGtuLevel')) {
            this.scene.resume('CombinedGtuLevel');
            if (this.gameUI) {
                this.gameUI.hidePauseMenu();
            }
        } else {
            this.scene.pause('CombinedGtuLevel');
            if (this.gameUI) {
                this.gameUI.showPauseMenu();
            }
        }
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
                this.effectsManager.createHitEffect(player.x, player.y, 0xff0000);
                this.effectsManager.playSound('hit');
            }
            
            // Make player temporarily invulnerable
            player.invulnerableUntil = this.time.now + 1000;
            
            // Check for game over
            if (newHP <= 0) {
                this.handlePlayerDeath();
            }
        }
    }

    handlePlayerDeath() {
        // Implement game over logic here
        console.log('Player died!');
        this.scene.restart();
    }
}
