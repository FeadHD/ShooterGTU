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
import { BulletPool } from '../../modules/managers/pools/BulletPool';
import { GameConfig } from '../../config/GameConfig';
import { CombinedLevelCamera } from '../../modules/managers/CombinedLevelCamera';
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
    }

    preload() {
        super.preload();
        
        // Load tileset with correct path
        this.load.image('GtuTileset', 'assets/GtuTileset/GtuTileset.png');
        
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
        
        // Initialize managers
        this.cameraManager = new CombinedLevelCamera(this, 3840, 3240); // Set level dimensions
        this.collisionManager = new CollisionManager(this);
        this.enemyManager = new EnemyManager(this);
        this.effectsManager = new EffectsManager(this);
        
        // Create physics groups
        this.platforms = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        
        // Load the level from LDtk
        const levelData = this.cache.json.get('combined-level');
        if (!levelData || !levelData.levels || !levelData.levels[0]) {
            console.error('Failed to load level data');
            return;
        }

        const level = levelData.levels[0];
        console.log('Level data:', {
            width: level.pxWid,
            height: level.pxHei,
            gridSize: level.__gridSize
        });

        // Create a simple tilemap with the correct dimensions
        const map = this.make.tilemap({
            width: Math.ceil(level.pxWid / 32),
            height: Math.ceil(level.pxHei / 32),
            tileWidth: 32,
            tileHeight: 32
        });

        // Add the tileset
        const tileset = map.addTilesetImage('GtuTileset');
        if (!tileset) {
            console.error('Failed to load tileset');
            return;
        }

        // Create layers
        const platformLayer = map.createBlankLayer('Platforms', tileset);
        if (!platformLayer) {
            console.error('Failed to create platform layer');
            return;
        }

        // Process each layer
        level.layerInstances.forEach(layerInstance => {
            if (layerInstance.__identifier === 'IntGrid') {
                // Convert IntGrid to tiles
                const width = layerInstance.__cWid;
                const height = layerInstance.__cHei;
                const csv = layerInstance.intGridCsv;

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const idx = y * width + x;
                        const value = csv[idx];
                        
                        if (value === 1) { // This is a platform tile
                            const tile = platformLayer.putTileAt(257, x, y); // Use the correct tile index from your tileset
                            if (tile) {
                                tile.setCollision(true);
                            }
                        }
                    }
                }
            } else if (layerInstance.__identifier === 'Entities') {
                this.processEntities(layerInstance);
            }
        });

        // Set world bounds
        this.physics.world.setBounds(0, 0, level.pxWid, level.pxHei);
        
        // Initialize UI
        this.setupUI();
        
        console.log('Level creation complete');
    }
    
    getLayerDepth(identifier) {
        const depths = {
            'Background': 0,
            'Platforms': 1,
            'Decorations': 2
        };
        return depths[identifier] || 0;
    }
    
    processEntities(layer) {
        if (!layer || !layer.entityInstances) {
            console.error('Invalid entity layer:', layer);
            return;
        }

        layer.entityInstances.forEach(entity => {
            const x = entity.__worldX;
            const y = entity.__worldY;
            
            console.log('Processing entity:', entity.__identifier, 'at', x, y);
            
            switch (entity.__identifier) {
                case 'PlayerStart':
                    this.createPlayer(x, y);
                    break;
                case 'Enemy':
                    const enemy = new Enemy(this, x, y);
                    this.enemies.add(enemy);
                    break;
                case 'MeleeWarrior':
                    const warrior = new MeleeWarrior(this, x, y);
                    this.enemies.add(warrior);
                    break;
                case 'Slime':
                    const slime = new Slime(this, x, y);
                    this.enemies.add(slime);
                    break;
                case 'Drone':
                    const drone = new Drone(this, x, y);
                    this.enemies.add(drone);
                    break;
                case 'Turret':
                    const turret = new Turret(this, x, y);
                    this.enemies.add(turret);
                    break;
                case 'Trap':
                    const trap = new Trap(this, x, y);
                    this.enemies.add(trap);
                    break;
                case 'Trampoline':
                    new Trampoline(this, x, y);
                    break;
                case 'DestructibleBlock':
                    new DestructibleBlock(this, x, y);
                    break;
                case 'DisappearingPlatform':
                    new DisappearingPlatform(this, x, y);
                    break;
                case 'Bitcoin':
                    new Bitcoin(this, x, y);
                    break;
                default:
                    console.warn('Unknown entity type:', entity.__identifier);
            }
        });
    }

    createPlayer(x, y) {
        // Override BaseScene's createPlayer to use exact coordinates
        if (this.preventAutoPlayerCreation) return; // Skip if called from BaseScene's create()
        
        console.log('Creating player at exact coordinates:', x, y);
        this.player = new Player(this, x, y);
        this.add.existing(this.player);
        this.physics.add.existing(this.player);
        
        // Set up player physics properties
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0);
        this.player.setGravityY(300);
        
        // Add collision with platforms and any collision layers
        this.physics.add.collider(this.player, this.platforms);
        
        // Add collision with tilemap layers that have collision
        const collidableLayers = this.children.list.filter(child => 
            child.type === 'TilemapLayer' && child.collisionMap
        );
        
        collidableLayers.forEach(layer => {
            console.log('Adding collision between player and layer:', layer.name);
            this.physics.add.collider(this.player, layer);
        });
        
        // Add collision with enemies
        this.physics.add.collider(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);
        
        // Store spawn point for respawning
        this.playerSpawnPoint = { x, y };
        
        // Set up camera to follow player
        if (this.cameraManager) {
            this.cameraManager.init(this.player);
        } else {
            this.cameras.main.startFollow(this.player, true);
            this.cameras.main.setDeadzone(100, 100);
        }

        return this.player;
    }

    setupUI() {
        // Initialize game UI
        this.gameUI = new GameUI(this);
        this.gameUI.container.setScrollFactor(0);
        this.gameUI.updateCameraIgnoreList();

        // Set up initial player HP
        const INITIAL_HP = 100; // Default HP if config not available
        this.registry.set('playerHP', INITIAL_HP);
        this.registry.set('maxPlayerHP', INITIAL_HP);

        // Create level indicator text
        this.levelIndicatorText = this.add.text(16, 16, 'Level 0', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(1000);

        // Set up the combined level structure
        this.setupCombinedLevel();
        this.setupCheckpoints();

        // Show start message
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

        // Set up collisions after all game objects are created
        if (!this.collisionManager) {
            this.collisionManager = new CollisionManager(this);
        }
        this.collisionManager.setupCollisions();
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
                this.effectsManager.createHitEffect(player.x, player.y, 0xff0000); // Red color for damage
                this.effectsManager.playSound('hit');
            }
            
            // Make player temporarily invulnerable
            player.invulnerableUntil = this.time.now + 1000; // 1 second of invulnerability
            
            // Check for game over
            if (newHP <= 0) {
                this.handlePlayerDeath();
            }
        }
    }

    handlePlayerDeath() {
        // TO DO: Implement game over logic
    }

    setupCombinedLevel() {
        const tileWidth = this.scale.width;
        const tileHeight = this.scale.height;

        // Create level sections
        this.levelSections = {
            // Level 0 (Tiles 0,0 and 1,0)
            level0: [
                {
                    x: 0,
                    y: 0,
                    setup: () => this.setupLevel0Tile1()
                },
                {
                    x: tileWidth,
                    y: 0,
                    setup: () => this.setupLevel0Tile2()
                }
            ],
            // Level 1 (Tiles 0,1 and 1,1)
            level1: [
                {
                    x: 0,
                    y: tileHeight,
                    setup: () => this.setupLevel1Tile1()
                },
                {
                    x: tileWidth,
                    y: tileHeight,
                    setup: () => this.setupLevel1Tile2()
                }
            ],
            // Level 2 (Tiles 0,2 and 1,2)
            level2: [
                {
                    x: 0,
                    y: tileHeight * 2,
                    setup: () => this.setupLevel2Tile1()
                },
                {
                    x: tileWidth,
                    y: tileHeight * 2,
                    setup: () => this.setupLevel2Tile2()
                }
            ]
        };

        // Set up all level sections
        Object.values(this.levelSections).flat().forEach(tile => tile.setup());
    }

    setupCheckpoints() {
        // Add checkpoints at the transition points between levels
        const { width, height } = this.scale;
        
        // Checkpoint for Level 0
        this.checkpoints.set(0, {
            x: width / 2,
            y: height * 0.8,
            level: 0
        });

        // Checkpoint for Level 1
        this.checkpoints.set(1, {
            x: width / 2,
            y: height * 1.8,
            level: 1
        });

        // Checkpoint for Level 2
        this.checkpoints.set(2, {
            x: width / 2,
            y: height * 2.8,
            level: 2
        });

        // Create checkpoint markers
        this.checkpoints.forEach((checkpoint, level) => {
            const marker = this.add.sprite(checkpoint.x, checkpoint.y, 'spark');
            marker.setScale(2);
            marker.setTint(0x00ff00);
            
            // Add pulsing effect
            this.tweens.add({
                targets: marker,
                alpha: 0.5,
                yoyo: true,
                repeat: -1,
                duration: 1000
            });
        });
    }

    // Platform creation methods
    createPlatform(x, y, width, height) {
        const platform = this.add.rectangle(x, y, width, height, 0x00ff00);
        this.physics.add.existing(platform, true);
        platform.body.allowGravity = false;
        platform.body.immovable = true;
        this.platforms.add(platform);
        return platform;
    }

    createTrampoline(x, y) {
        const trampoline = new Trampoline(this, x, y);
        return trampoline;
    }

    createDestructibleBlock(x, y) {
        const block = new DestructibleBlock(this, x, y);
        return block;
    }

    createDisappearingPlatform(x, y) {
        const platform = new DisappearingPlatform(this, x, y);
        return platform;
    }

    // Enemy creation methods
    createSlime(x, y) {
        const slime = new Slime(this, x, y);
        // Slime class creates its own sprite internally
        if (slime.sprite) {
            this.enemies.add(slime.sprite);
        }
        return slime;
    }

    createMeleeWarrior(x, y) {
        const warrior = new MeleeWarrior(this, x, y);
        // MeleeWarrior class creates its own sprite internally
        if (warrior.sprite) {
            this.enemies.add(warrior.sprite);
        }
        return warrior;
    }

    createDrone(x, y) {
        const drone = new Drone(this, x, y);
        // Drone class creates its own sprite internally
        if (drone.sprite) {
            this.enemies.add(drone.sprite);
        }
        return drone;
    }

    createTurret(x, y) {
        const turret = new Turret(this, x, y);
        // Turret is itself a sprite
        this.add.existing(turret);
        this.enemies.add(turret);
        return turret;
    }

    createTrap(x, y) {
        const trap = new Trap(this, x, y);
        // Check if trap has a sprite property or is itself a sprite
        if (trap.sprite) {
            this.hazards.add(trap.sprite);
        } else {
            this.hazards.add(trap);
        }
        return trap;
    }

    // Level 0 tile setups
    setupLevel0Tile1() {
        this.createPlatform(100, 300, 200, 20);
        this.createSlime(150, 250);
    }

    setupLevel0Tile2() {
        this.createPlatform(this.scale.width + 100, 400, 200, 20);
        this.createMeleeWarrior(this.scale.width + 150);
    }

    // Level 1 tile setups
    setupLevel1Tile1() {
        const y = this.scale.height;
        this.createPlatform(200, y + 350, 200, 20);
        this.createTrampoline(200, y + 280);
        this.createSlime(150, y + 250);
    }

    setupLevel1Tile2() {
        const x = this.scale.width;
        const y = this.scale.height;
        this.createPlatform(x + 150, y + 300, 200, 20);
        this.createDrone(x + 450, y + 150);
    }

    // Level 2 tile setups
    setupLevel2Tile1() {
        const y = this.scale.height * 2;
        this.createPlatform(150, y + 300, 200, 20);
        this.createPlatform(400, y + 200, 200, 20);
        this.createMeleeWarrior(200, y + 250);
    }

    setupLevel2Tile2() {
        const x = this.scale.width;
        const y = this.scale.height * 2;
        this.createPlatform(x + 200, y + 350, 300, 20);
        this.createDrone(x + 300, y + 200);
        this.createTurret(x + 150, y + 200);
    }

    update(time, delta) {
        super.update(time, delta);
        
        if (this.player && this.cameraManager) {
            // Check if player has reached the end of current level section
            const levelWidth = this.tileWidth * 64; // 64 tiles per level section
            const nextLevelX = (this.currentLevel + 1) * levelWidth;
            
            if (this.player.x >= nextLevelX - 100) { // Start transition 100px before end
                this.loadNextLevel();
            }

            this.cameraManager.update();
        }
    }

    loadNextLevel() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        const nextLevel = this.currentLevel + 1;
        if (nextLevel <= 2) { // We have 3 levels (0, 1, 2)
            // Save current player state
            const playerState = {
                x: this.player.x,
                y: this.player.y,
                health: this.registry.get('playerHP')
            };

            // Update level indicator
            if (this.levelIndicatorText) {
                this.levelIndicatorText.setText(`Level ${nextLevel}`);
            }

            // Transition to next level
            this.currentLevel = nextLevel;
            
            // Update camera bounds for new level
            const levelWidth = this.tileWidth * 64;
            const newBounds = {
                x: this.currentLevel * levelWidth,
                y: 0,
                width: levelWidth,
                height: this.levelHeight
            };
            
            this.cameraManager.camera.setBounds(newBounds.x, newBounds.y, newBounds.width, newBounds.height);
            
            // Reset transition flag after a short delay
            this.time.delayedCall(500, () => {
                this.isTransitioning = false;
            });

            console.log(`Loaded level ${this.currentLevel}`);
        }
    }

    onLevelChange() {
        // Update level indicator if it exists
        if (this.levelIndicatorText) {
            this.levelIndicatorText.setText(`Level ${this.currentLevel}`);
        }
        
        // Play transition effect
        this.cameras.main.flash(500, 0, 0, 0, 0.3);
        
        // Update music and other level-specific changes if music manager exists
        if (this.musicManager) {
            // Stop current music
            this.musicManager.stop();
            
            // Set and play new music based on level
            const music = this.sound.add('bgMusic', { 
                loop: true, 
                volume: Math.max(0.4, 1 - (this.currentLevel * 0.2)) 
            });
            this.musicManager.setCurrentMusic(music);
            this.musicManager.play();
        }
        
        // Save checkpoint at level transition
        this.loadCheckpoint();
    }

    loadCheckpoint() {
        const savedCheckpoint = localStorage.getItem('lastCheckpoint');
        if (savedCheckpoint) {
            const checkpoint = JSON.parse(savedCheckpoint);
            this.currentLevel = checkpoint.level;
            if (this.player) {
                this.player.x = checkpoint.x;
                this.player.y = checkpoint.y;
                this.onLevelChange();
            }
        }
    }
}
