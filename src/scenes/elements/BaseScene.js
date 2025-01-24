/**
 * BaseScene.js
 * Foundation scene class that all game scenes inherit from.
 * Handles core game setup, state management, and cleanup.
 */

// Import core dependencies
import { Scene } from 'phaser';
import { ManagerFactory } from '../../modules/di/ManagerFactory';
import { Bullet } from '../../prefabs/Bullet';
import { ParallaxBackground } from '../../prefabs/ParallaxBackground';
import { Player } from '../../prefabs/Player';
import { GameConfig, getGroundTop } from '../../config/GameConfig';
import { GameEvents } from '../../modules/managers/EventManager';
import { ErrorSystem } from '../../systems/ErrorSystem';

// Constants for player and tile properties
const PLAYER_CONSTANTS = {
    INVULNERABILITY_DURATION: 2000,
    DEFAULT_ENEMY_DAMAGE: 25,
    INITIAL_HP: 100,
    INITIAL_LIVES: 3,
    FLASH_DURATION: 200,
    FLASH_ALPHA: 0.5,
    FLASH_REPEATS: 4
};

const TILE_CONSTANTS = {
    COLLIDING_TILES: [257, 258, 259, 260, 261, 641, 642, 643, 644, 645, 705, 706, 707, 708, 709]
};

export class BaseScene extends Scene {
    constructor(config) {
        super(config);

        // Initialize scene state tracking
        this.sceneState = {
            isReady: false,
            isPlaying: false,
            isLoading: true,
            startTime: Date.now(),
            levelData: {
                timeElapsed: 0,
                currentScore: 0,
                checkpoints: []
            }
        };
        
        this.gameOver = false;
        this.isDying = false;
    }

    // =====================
    // Core Scene Setup
    // =====================

    /** Load essential game assets (sprites, particles) */
    preload() {
        if (!this.textures.exists('character')) {
            this.load.spritesheet('character', 'assets/character/character_idle.png', {
                frameWidth: GameConfig.SPRITES.CHARACTER.WIDTH,
                frameHeight: GameConfig.SPRITES.CHARACTER.HEIGHT
            });
        }
        this.load.image('particle', 'assets/particle.png');
    }

    /** Initialize scene: managers, physics, UI, and game elements */
    create() {
        // Create managers first
        this.managers = ManagerFactory.createManagers(this);
        
        // Setup core systems
        this.gameStateManager = this.managers.gameState;
        this.persistenceManager = this.managers.persistence;
        this.audioManager = this.managers.audio;
        this.entityManager = this.managers.entityManager;
        this.enemies = this.managers.enemies;
        this.hazards = this.managers.hazards;
        this.animations = this.managers.animations;
        this.effects = this.managers.effects;
        this.boundaries = this.managers.boundaries;
        this.debug = this.managers.debug;
        this.collisionManager = this.managers.collision;
        this.errorSystem = new ErrorSystem(this);
        this.eventManager = this.managers.events;

        // Initialize systems
        this.animations.initialize();
        this.eventManager.initialize();
        this.input.mouse.disableContextMenu();
        this.input.keyboard.enabled = true;

        const { width, height } = {
            width: this.cameras.main.width,
            height: this.cameras.main.height
        };

        this.#setupWorldPhysics(width, height);
        this.#createPlatforms();
        this.#setupMusic();
        this.#createParallaxBackground();
        this.#createUI();
        if (this.gameUI) {
            this.gameUI.startTimer(); 
        }
        this.#storeSpawnInfo(width, height);
        this.#initializeGameSystems();
        this.#initializeController();
        this.#registerSceneEvents();
        this.#initializeSceneState();
    }

    // =====================
    // World Setup Methods
    // =====================

    /** Configure physics world boundaries */
    #setupWorldPhysics(width, height) {
        this.physics.world.setBounds(0, 0, width, height);
    }

    /** Create static platform group for level geometry */
    #createPlatforms() {
        this.platforms = this.physics.add.staticGroup();
    }

    /** Set up background music with volume control */
    #setupMusic() {
        if (this.audioManager) {
            const musicVolume = this.registry.get('musicVolume') || 1;
            this.audioManager.playMusic('bgMusic', { 
                loop: true,
                volume: musicVolume 
            });
        }
    }

    /** Create scrolling background layers */
    #createParallaxBackground() {
        this.parallaxBackground = new ParallaxBackground(this);
    }

    /** Initialize UI elements and HUD */
    #createUI() {
        this.gameUI = this.managers.ui;
        this.gameUI.container.setScrollFactor(0);
        this.gameUI.updateCameraIgnoreList();
    }

    // =====================
    // Gameplay Setup
    // =====================

    /** Store level spawn points and ground height */
    #storeSpawnInfo(width, height) {
        this.groundTop = getGroundTop(height);
        if (!this.playerSpawnPoint) {
            this.playerSpawnPoint = {
                x: width * GameConfig.PLAYER.SPAWN_OFFSET_X,
                y: getGroundTop(height)
            };
        }
    }

    /** Initialize game state, animations, and collision systems */
    #initializeGameSystems() {
        // Using the simpler registry approach, not the Store
        this.gameStateManager.initializeGameState();
        this.animations.createAllAnimations();
        this.#createBulletGroup();
        if (this.managers.collisions) {
            this.managers.collisions.setupCollisions();
        }
    }

    /** Create bullet pool for projectile management */
    #createBulletGroup() {
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: -1,
            runChildUpdate: true,
            allowGravity: false,
            immovable: true
        });
    }

    /** Create player character at specified position */
    createPlayer(x, y) {
        this.player = new Player(this, x, y);
        this.physics.add.collider(this.player, this.platforms);
        return this.player;
    }

    // =====================
    // State Management
    // =====================

    /** Set up player input controller */
    #initializeController() {
        try {
            if (this.player) {
                this.controller = new PlayerController(this);
            }
        } catch (error) {
            this.errorSystem.handleError(error, 'controller');
        }
    }

    /** Register scene lifecycle event handlers */
    #registerSceneEvents() {
        this.events.on('wake', this.onSceneWake, this);
        this.events.on('resume', this.onSceneResume, this);
        this.events.on('shutdown', this.shutdown, this);
        this.events.on('sleep', this.cleanup, this);
    }

    /** Initialize game state from registry */
    #initializeSceneState() {
        try {
            // REMOVED STORE
            // No more store.getState() or store.subscribe()
            // Instead, read from GameStateManager (Phaser registry)
            // for any needed initial values

            // We might do something like:
            const hp = this.gameStateManager.get('playerHP');
            const lives = this.gameStateManager.get('lives');
            const score = this.gameStateManager.get('score');

            console.log('Initializing scene with HP:', hp, 'Lives:', lives, 'Score:', score);

            this.sceneState.isLoading = false;
            this.sceneState.isReady = true;
            
            // Optionally set the player state to idle or something:
 
            // this.gameStateManager.set('playerState', PlayerState.IDLE);

            console.log('Scene state initialized!');
        } catch (error) {
            this.errorSystem.handleError(error, 'state');
        }
    }

    // =====================
    // Player State Handling
    // =====================

    /** Handle player death sequence and game over logic */
    handlePlayerDeath() {
        if (this.player && !this.isDying) {
            this.isDying = true;
            this.player.disableBody();
            this.player.setVelocity(0);
            
            if (this.animations.hasAnimation('character_Death')) {
                this.animations.play(this.player, 'character_Death');
            }

            this.scene.time.delayedCall(1000, () => {
                this.gameStateManager.handleGameOver();
            });

            this.gameOver = true;
            const lives = this.registry.get('lives') - 1;
            this.registry.set('playerLives', lives);
            
            this.time.delayedCall(2000, () => {
                if (lives <= 0) {
                    this.eventManager.emit(GameEvents.GAME_OVER, {
                        finalScore: this.gameStateManager.get('score'),
                        totalTime: this.time.now - this.sceneState.startTime
                    });
                    this.handleGameOver();
                } else {
                    this.eventManager.emit(GameEvents.PLAYER_RESPAWN, {
                        position: this.playerSpawnPoint,
                        remainingLives: lives
                    });
                    this.handleRespawn();
                }
            });
        }
    }

    /** Process complete game over state */
    handleGameOver() {
        // Instead do whatever your simpler approach does
        // e.g. set game status in the registry
        this.gameOver = true;
        this.gameStateManager.set('lives', 0);
        this.gameStateManager.set('playerHP', 0);
        this.handleFullRestart();
    }

    /** Perform full scene restart and state reset */
    handleFullRestart() {
        this.cleanup();
        this.registry.set('playerLives', PLAYER_CONSTANTS.INITIAL_LIVES);
        this.registry.set('playerHP', PLAYER_CONSTANTS.INITIAL_HP);
        this.registry.set('score', 0);
        this.registry.set('bitcoins', 0);
        this.scene.restart();
    }

    /** Reset player after death with temporary invulnerability */
    handleRespawn() {
        if (!this.player) return;

        const currentScene = this.scene.get(this.scene.key);
        const spawnPoint = currentScene.playerSpawnPoint || this.playerSpawnPoint;

        this.player.setPosition(spawnPoint.x, spawnPoint.y);
        this.player.setVelocity(0, 0);
        
        this.isDying = false;
        this.gameOver = false;
        this.player.enableBody();
        this.player.setAlpha(1);
        
        // Use the registry or GameStateManager for HP:
        this.gameStateManager.set('playerHP', PLAYER_CONSTANTS.INITIAL_HP);
        this.gameUI.updateHP(PLAYER_CONSTANTS.INITIAL_HP);

        this.invulnerableUntil = this.time.now + PLAYER_CONSTANTS.INVULNERABILITY_DURATION;
        
        this.tweens.add({
            targets: this.player,
            alpha: PLAYER_CONSTANTS.FLASH_ALPHA,
            duration: PLAYER_CONSTANTS.FLASH_DURATION,
            yoyo: true,
            repeat: PLAYER_CONSTANTS.FLASH_REPEATS,
            onComplete: () => {
                this.player.setAlpha(1);
            }
        });

        if (this.animations.hasAnimation('character_Idle')) {
            this.animations.play(this.player, 'character_Idle');
        }
    }

    // =====================
    // Collision & Physics
    // =====================

    /** Set up tile-based collision detection */
    setupTileCollisions(map, layer) {
        if (this.collisionManager) {
            this.collisionManager.setupTileCollisions(map, layer);
        }
    }

    // =====================
    // Update Loop & Cleanup
    // =====================

    /** Main update loop: handle player, debug, and game state */
    update(time, delta) {
        try {
            super.update(time, delta);
    
            // Log all text objects once
            if (!this.loggedTextObjects) {
                console.log('Listing all text objects in BaseScene:');
                this.children.list.forEach(obj => {
                    if (obj.type === 'Text') {
                        console.log('Text found:', obj.text, 'at', obj.x, obj.y);
                    }
                });
    
                // Also check the UI container, if that’s where your timer is
                if (this.gameUI && this.gameUI.container) {
                    console.log('Listing text objects in gameUI.container:');
                    this.gameUI.container.list.forEach(child => {
                        if (child.type === 'Text') {
                            console.log('Child text found:', child.text, 'at', child.x, child.y);
                        }
                    });
                }
    
                this.loggedTextObjects = true; // Only log once
            }
    
            // Existing update logic...
            if (this.player) {
                this.player.update();
            }
            if (this.debug) {
                this.debug.update();
            }
            this.updateSceneState();
    
            // etc...
        } catch (error) {
            this.errorSystem.handleError(error, 'update');
        }
    }

    /** Clean up scene resources and event listeners */
    cleanup() {
        if (this.eventManager) {
            this.eventManager.destroy();
        }
        if (this.input) {
            this.input.keyboard.enabled = false;
            this.input.keyboard.removeAllKeys();
            this.input.removeAllListeners();
        }
        if (this.controller) {
            if (typeof this.controller.destroy === 'function') {
                this.controller.destroy();
            }
            this.controller = null;
        }
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
        if (this.gameUI) {
            this.gameUI.destroy();
            this.gameUI = null;
        }
        if (this.bgMusic) {
            this.bgMusic.stop();
            this.bgMusic.destroy();
            this.bgMusic = null;
        }
        if (this.gameStateManager) this.gameStateManager = null;
        if (this.persistenceManager) this.persistenceManager = null;
        if (this.audioManager) this.audioManager = null;
        if (this.entityManager) this.entityManager = null;
        if (this.enemies) this.enemies = null;
        if (this.hazards) this.hazards = null;
        if (this.animations) this.animations = null;
        if (this.effects) this.effects = null;
        if (this.boundaries) this.boundaries = null;
        if (this.debug) this.debug = null;

        this.gameOver = false;
        this.spaceKey = null;
    }

    // =====================
    // Scene State Events
    // =====================

    /** Re-enable input when scene wakes */
    onSceneWake() {
        this.input.keyboard.enabled = true;
    }

    /** Re-enable input when scene resumes */
    onSceneResume() {
        this.input.keyboard.enabled = true;
    }

    /** Clean up when scene shuts down */
    shutdown() {
        this.cleanup();
        super.shutdown();
    }

    /** Update scene-specific state (time, score) */
    updateSceneState() {
        if (this.sceneState.isPlaying) {
            this.sceneState.levelData.timeElapsed = Math.floor((Date.now() - this.sceneState.startTime) / 1000);
            // If you want to reflect registry-based values:
            this.sceneState.levelData.currentScore = this.gameStateManager.get('score');
        }
    }

    /** Calculate appropriate spawn height from ground */
    getSpawnHeight() {
        return this.groundTop - 16;
    }
}
