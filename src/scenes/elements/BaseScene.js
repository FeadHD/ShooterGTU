// @ai-do-not-touch

/**
 * BaseScene.js
 * ============
 * 
 * The foundational scene class for ShooterGTU, providing core game functionality and structure.
 * All game scenes inherit from this class to ensure consistent behavior and initialization.
 * 
 * System Dependencies:
 * -------------------
 * - Phaser 3.x Game Framework
 * - Web Browser with ES6+ support
 * - WebGL or Canvas rendering support
 * - Local storage for game state persistence
 * - Audio system support
 * 
 * File Dependencies:
 * -----------------
 * Core Systems:
 * - /modules/di/ManagerFactory.js      : Dependency injection and manager creation
 * - /modules/state/Store.js            : Global state management using Redux pattern
 * - /modules/state/types.js            : Type definitions for actions and state
 * - /systems/ErrorSystem.js            : Error handling and recovery
 * 
 * Managers:
 * - /modules/managers/CollisionManager.js : Handles all game collisions
 * - /modules/managers/EventManager.js     : Game-wide event system
 * - /modules/managers/AnimationManager.js : Character and object animations
 * - /modules/managers/BulletManager.js    : Bullet pooling and management
 * 
 * UI Elements:
 * - /scenes/elements/UIManager.js      : HUD and interface components
 * 
 * Game Objects:
 * - /prefabs/Bullet.js                 : Projectile system
 * - /prefabs/ParallaxBackground.js     : Multi-layered scrolling background
 * - /prefabs/Player.js                 : Player character controller
 * 
 * Configuration:
 * - /config/GameConfig.js              : Game constants and settings
 * 
 * Features:
 * ---------
 * - Automatic manager initialization through ManagerFactory
 * - Centralized collision handling via CollisionManager
 * - Event-driven communication between game components
 * - Flexible state management for game progression
 * - Built-in error handling and recovery
 * - Configurable physics and world boundaries
 * - Integrated audio system with volume control
 * - Parallax background support
 * - Debug mode with visual helpers
 */

import { Scene } from 'phaser';
import { ManagerFactory } from '../../modules/di/ManagerFactory';
import { Bullet } from '../../prefabs/Bullet';
import { ParallaxBackground } from '../../prefabs/ParallaxBackground';
import { Player } from '../../prefabs/Player';
import { GameConfig, getGroundTop } from '../../config/GameConfig';
import { Store } from '../../modules/state/Store';
import { GameEvents } from '../../modules/managers/EventManager';
import { ActionTypes, GameStatus, PlayerState } from '../../modules/state/types';
import { ErrorSystem } from '../../systems/ErrorSystem';

// Game Constants
const PLAYER_CONSTANTS = {
    INVULNERABILITY_DURATION: 2000,  // Duration of invulnerability in milliseconds
    DEFAULT_ENEMY_DAMAGE: 25,        // Default damage when no specific enemy damage is set
    INITIAL_HP: 100,                // Starting/max player HP
    INITIAL_LIVES: 3,               // Starting number of lives
    FLASH_DURATION: 200,            // Duration of flash effect in milliseconds
    FLASH_ALPHA: 0.5,               // Alpha value during flash effect
    FLASH_REPEATS: 4                // Number of times to repeat flash effect
};

const TILE_CONSTANTS = {
    COLLIDING_TILES: [257, 258, 259, 260, 261, 641, 642, 643, 644, 645, 705, 706, 707, 708, 709]  // Tile IDs that should have collision
};

/** Base scene class that handles game initialization, updates, and cleanup. Provides foundation for all game scenes with standardized setup and management of core game systems. */
export class BaseScene extends Scene {
    constructor(config) {
        super(config);
        this.store = new Store();
        this.sceneState = {
            isReady: false,
            isPlaying: false,
            isLoading: true,
            startTime: Date.now(),
            levelData: {
                currentScore: 0,
                enemiesDefeated: 0,
                timeElapsed: 0,
                checkpoints: []
            }
        };
        this.gameOver = false;
        this.spaceKey = null;
        this.isDying = false;
    }

    /** Preload required assets for the scene including character spritesheet, particle effects, sound effects, background music, and UI elements. */
    preload() {
        // Load character spritesheet if not already loaded
        if (!this.textures.exists('character')) {
            this.load.spritesheet('character', 'assets/character.png', {
                frameWidth: GameConfig.SPRITES.CHARACTER.WIDTH,
                frameHeight: GameConfig.SPRITES.CHARACTER.HEIGHT
            });
        }
        
        // Load particle texture
        this.load.image('particle', 'assets/particle.png');
    }

    /** Create and initialize all game objects, managers, and systems in order: managers, core systems, world, platforms, visuals, gameplay elements, and state systems. */
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

        // Initialize core systems
        this.animations.initialize();
        this.eventManager.initialize();

        // Disable right-click context menu and enable keyboard input
        this.input.mouse.disableContextMenu();
        this.input.keyboard.enabled = true;

        const { width, height } = {
            width: this.cameras.main.width,
            height: this.cameras.main.height
        };
        
        // Setup physics and world
        this.#setupWorldPhysics(width, height);
        this.#createPlatforms();
        
        // Setup audio
        this.#setupMusic();
        
        // Setup visuals
        this.#createParallaxBackground();
        this.#createUI();
        
        // Setup gameplay elements
        this.#storeSpawnInfo(width, height);
        this.#initializeGameSystems();
        //this.#createPlayerIfNeeded(width);
        
        // Setup state and events
        this.#initializeController();
        this.#registerSceneEvents();
        this.#initializeSceneState();
    }

    // =====================
    // Core System Methods
    // =====================
    
    /**
     * Configure world physics boundaries and settings.
     * Sets up the physical space where gameplay occurs.
     * 
     * @param {number} width - The width of the game world
     * @param {number} height - The height of the game world
     */
    #setupWorldPhysics(width, height) {
        this.physics.world.setBounds(0, 0, width, height);
    }

    /**
     * Create static platforms for player interaction.
     * These platforms provide the foundation for level design.
     * 
     * Features:
     * - Static physics bodies
     * - Collision detection
     * - Support for different platform types
     */
    #createPlatforms() {
        this.platforms = this.physics.add.staticGroup();
    }

    // =====================
    // Audio Methods
    // =====================
    
    /**
     * Initialize and configure the background music system with volume persistence, looping, and smooth transitions between tracks.
     */
    #setupMusic() {
        if (this.audioManager) {
            const musicVolume = this.registry.get('musicVolume') || 1;
            this.audioManager.playMusic('bgMusic', { 
                loop: true,
                volume: musicVolume 
            });
        }
    }

    // =====================
    // Physics and World Methods
    // =====================
    
    /**
     * Create parallax background with multiple depth layers, configurable scroll speeds, and automatic texture repetition.
     */
    #createParallaxBackground() {
        this.parallaxBackground = new ParallaxBackground(this);
    }

    /**
     * Create and configure the game's UI with HUD elements for health, score, ammunition, and status indicators.
     */
    #createUI() {
        // Create UI
        this.gameUI = this.managers.ui;
        this.gameUI.container.setScrollFactor(0);
        this.gameUI.updateCameraIgnoreList();
    }

    // =====================
    // Gameplay Methods
    // =====================
    
    /**
     * Store ground level and player spawn coordinates for respawning and level setup.
     * 
     * @param {number} width - The width of the game world
     * @param {number} height - The height of the game world
     */
    #storeSpawnInfo(width, height) {
        this.groundTop = getGroundTop(height);
        // Only set playerSpawnPoint if it hasn't already been set
        if (!this.playerSpawnPoint) {
            this.playerSpawnPoint = {
                x: width * GameConfig.PLAYER.SPAWN_OFFSET_X,
                y: getGroundTop(height)  // Use the imported function directly
            };
        }
    }

    /**
     * Initialize game state and create all character/enemy animations, including state initialization and collision setup.
     */
    #initializeGameSystems() {
        this.gameStateManager.initializeGameState();
        this.animations.createAllAnimations();
        this.#createBulletGroup();  // Create bullet group before setting up collisions
        if (this.managers.collisions) {
            this.managers.collisions.setupCollisions();
        }
    }

    /**
     * Create a physics group for bullets with pooling, configurable properties, and projectile behavior.
     */
    #createBulletGroup() {
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: -1,
            runChildUpdate: true,
            allowGravity: false,
            immovable: true
        });
    }

    /**
     * Create the player character if not explicitly skipped by the scene.
     * 
     * @param {number} width - The width of the game world
     */
    createPlayer(x, y) {
        // Create player using the Player prefab and the stored spawn point
        this.player = new Player(this, x, y);
        
        // Add collision with platforms
        this.physics.add.collider(this.player, this.platforms);
    
        return this.player;
    }

    /**
     * Create and configure player character with movement, collision detection, and health management.
     * 
     * Features:
     * - Player movement and input handling
     * - Collision detection with platforms and enemies
     * - Health and damage management
     * 
     * @param {number} width - The width of the game world
     * @returns {Player} The created player character
     */
    // createPlayer(width) {
    //     // Create player using the Player prefab and the stored spawn point
    //     this.player = new Player(this, this.playerSpawnPoint.x, this.playerSpawnPoint.y);
        
    //     // Add collision with platforms
    //     this.physics.add.collider(this.player, this.platforms);
    
    //     return this.player;
    // }

    // =====================
    // State and Event Methods
    // =====================
    
    /**
     * Initialize the player controller for handling input, movement, and animation management.
     */
    #initializeController() {
        try {
            // Create controller if player exists
            if (this.player) {
                this.controller = new PlayerController(this);
            }
        } catch (error) {
            this.errorSystem.handleError(error, 'controller');
        }
    }

    /**
     * Register event handlers for scene lifecycle events (wake, resume, shutdown, sleep).
     */
    #registerSceneEvents() {
        this.events.on('wake', this.onSceneWake, this);
        this.events.on('resume', this.onSceneResume, this);
        this.events.on('shutdown', this.shutdown, this);
        this.events.on('sleep', this.cleanup, this);
    }

    /**
     * Initialize and sync scene state with global game state, including lives, score, health, and other game variables.
     */
    #initializeSceneState() {
        try {
            // Get global state from Store
            const globalState = this.store.getState();
            
            // Sync scene with global state
            this.registry.set('lives', globalState.game.lives);
            this.registry.set('score', globalState.game.score);
            this.registry.set('playerHP', globalState.player.health);
            this.registry.set('bitcoins', globalState.player.bitcoins);
            
            // Set up scene-specific state
            this.gameStateManager.initializeGameState();
            
            // Listen for store changes
            this.store.subscribe((state, action) => {
                this.handleStoreUpdate(state, action);
            });

            // Update scene status
            this.sceneState.isLoading = false;
            this.sceneState.isReady = true;
            this.store.dispatch({ type: ActionTypes.UPDATE_PLAYER_STATE, payload: PlayerState.IDLE });

            console.log('Scene state initialized!');
        } catch (error) {
            this.errorSystem.handleError(error, 'state');
        }
    }

    /**
     * Handle player death sequence, animations, and life system.
     * 
     * Features:
     * - Death animation and effect
     * - Life system management (lives, respawning)
     * - Game over state handling
     */
    handlePlayerDeath() {
        if (this.player && !this.isDying) {
            this.isDying = true;
            
            // Disable player input and physics
            this.player.disableBody();
            this.player.setVelocity(0);
            
            // Play death animation if available
            if (this.animations.hasAnimation('character_Death')) {
                this.animations.play(this.player, 'character_Death');
            }
            
            // Update game state
            this.gameOver = true;
            const lives = this.registry.get('lives') - 1;
            this.registry.set('lives', lives);
            
            // Wait for death animation or timeout
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

    /**
     * Handle complete game over state.
     * 
     * Features:
     * - Game over screen and UI
     * - Final score and statistics display
     * - Restart or menu options
     */
    handleGameOver() {
        // Handle complete game over state with game over screen, final score display, and restart options.
        this.store.dispatch({ type: ActionTypes.UPDATE_GAME_STATUS, payload: GameStatus.GAME_OVER });
        this.handleFullRestart();
    }

    /**
     * Perform a full scene restart, resetting all game state.
     * 
     * Features:
     * - Full game state reset
     * - Scene restart and reload
     */
    handleFullRestart() {
        // Perform a full scene restart, resetting all game state and reloading the scene.
        this.cleanup();
        this.registry.set('lives', PLAYER_CONSTANTS.INITIAL_LIVES);
        this.registry.set('playerHP', PLAYER_CONSTANTS.INITIAL_HP);
        this.registry.set('score', 0);
        this.registry.set('bitcoins', 0);
        this.scene.restart();
    }

    /**
     * Reset player position and state after death, with temporary invulnerability.
     * 
     * Features:
     * - Player position reset
     * - Temporary invulnerability
     * - Flash effect and animation
     */
    handleRespawn() {
        // Reset player position and state after death, adding temporary invulnerability and flash effect.
        if (!this.player) return;

        // Get spawn point from current scene if available
        const currentScene = this.scene.get(this.scene.key);
        const spawnPoint = currentScene.playerSpawnPoint || this.playerSpawnPoint;
        
        // Reset player position using spawn point
        this.player.setPosition(spawnPoint.x, spawnPoint.y);
        this.player.setVelocity(0, 0);
        
        // Reset player state
        this.isDying = false;
        this.gameOver = false;
        this.player.enableBody();
        this.player.setAlpha(1);
        
        // Reset player HP
        this.gameStateManager.set('playerHP', PLAYER_CONSTANTS.INITIAL_HP);
        this.gameUI.updateHP(PLAYER_CONSTANTS.INITIAL_HP);
        
        // Add temporary invulnerability
        this.invulnerableUntil = this.time.now + PLAYER_CONSTANTS.INVULNERABILITY_DURATION;
        
        // Flash effect to show invulnerability
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

        // Reset player animations if needed
        if (this.animations.hasAnimation('character_Idle')) {
            this.animations.play(this.player, 'character_Idle');
        }
    }

    /**
     * Set up collision detection for specific tile types in the level.
     * 
     * Features:
     * - Collision detection for specific tile types
     * - Collision handling and response
     * 
     * @param {object} map - The level map data
     * @param {object} layer - The layer data for collision detection
     */
    setupTileCollisions(map, layer) {
        // Set up collision detection for specific tile types in the level, handling collision detection and response.
        if (this.collisionManager) {
            this.collisionManager.setupTileCollisions(map, layer);
        }
    }

    /**
     * Update game state each frame, handling player movement, debug info, and game over state.
     * 
     * Features:
     * - Player movement and animation
     * - Debug information display
     * - Game over state handling
     * 
     * @param {number} time - The current time
     * @param {number} delta - The time difference since the last update
     */
    update(time, delta) {
        try {
            // Update base components
            super.update(time, delta);

            // Update player if exists
            if (this.player) {
                this.player.update();
            }

            // Update debug if exists
            if (this.debug) {
                this.debug.update();
            }

            // Update scene state
            this.updateSceneState();

            // Handle game over state
            if (this.gameOver && this.controller && this.controller.controls.jump.isDown) {
                this.cleanup();
                this.registry.set('lives', PLAYER_CONSTANTS.INITIAL_LIVES);
                this.registry.set('playerHP', PLAYER_CONSTANTS.INITIAL_HP);
                this.registry.set('score', 0);
                this.registry.set('bitcoins', 0);
                this.scene.start('MainMenu');
            }
        } catch (error) {
            this.errorSystem.handleError(error, 'update');
        }
    }

    /**
     * Clean up all game objects and managers before scene shutdown.
     * 
     * Features:
     * - Game object destruction
     * - Manager cleanup and destruction
     */
    cleanup() {
        // Clean up all game objects and managers before scene shutdown, handling destruction of resources.
        // Clean up managers first
        if (this.eventManager) {
            this.eventManager.destroy();
        }

        // Clean up input
        if (this.input) {
            this.input.keyboard.enabled = false;
            this.input.keyboard.removeAllKeys();
            this.input.removeAllListeners();
        }

        // Clean up controller
        if (this.controller) {
            if (typeof this.controller.destroy === 'function') {
                this.controller.destroy();
            }
            this.controller = null;
        }

        // Clean up game objects
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }

        if (this.gameUI) {
            this.gameUI.destroy();
            this.gameUI = null;
        }

        // Stop and remove background music if it exists
        if (this.bgMusic) {
            this.bgMusic.stop();
            this.bgMusic.destroy();
            this.bgMusic = null;
        }

        // Clean up managers
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

        // Reset flags
        this.gameOver = false;
        this.spaceKey = null;
    }

    // Re-enable keyboard input when scene wakes from sleep.
    onSceneWake() {
        this.input.keyboard.enabled = true;
    }

    // Re-enable keyboard input when scene resumes from pause.
    onSceneResume() {
        this.input.keyboard.enabled = true;
    }

    // Clean up resources and call parent shutdown when scene is destroyed.
    shutdown() {
        this.cleanup();
        super.shutdown();
    }

    // Handle updates to global game state and update local scene accordingly, managing state synchronization.
    handleStoreUpdate(state, action) {
        try {
            switch(action.type) {
                case ActionTypes.UPDATE_SCORE:
                    this.gameStateManager.set('score', state.game.score);
                    this.sceneState.levelData.currentScore = state.game.score;
                    break;
                case ActionTypes.UPDATE_HEALTH:
                    this.gameStateManager.set('playerHP', state.player.health);
                    if (state.player.health <= 0) {
                        this.store.dispatch({ type: ActionTypes.UPDATE_GAME_STATUS, payload: GameStatus.GAME_OVER });
                    }
                    break;
                case ActionTypes.UPDATE_LIVES:
                    this.gameStateManager.set('lives', state.game.lives);
                    break;
                case ActionTypes.UPDATE_BITCOINS:
                    this.gameStateManager.set('bitcoins', state.game.bitcoins);
                    break;
                case ActionTypes.UPDATE_GAME_STATUS:
                    this.handleGameStatusChange(state.game.status);
                    break;
                case ActionTypes.UPDATE_PLAYER_STATE:
                    if (this.player) {
                        this.player.setState(state.player.state);
                    }
                    break;
            }
        } catch (error) {
            this.errorSystem.handleError(error, 'storeUpdate');
        }
    }

    // Process game status changes like pause, resume, and game over, managing scene state transitions.
    handleGameStatusChange(status) {
        switch(status) {
            case GameStatus.PAUSED:
                this.scene.pause();
                this.sceneState.isPlaying = false;
                break;
            case GameStatus.PLAYING:
                this.scene.resume();
                this.sceneState.isPlaying = true;
                break;
            case GameStatus.GAME_OVER:
                this.gameOver = true;
                this.sceneState.isPlaying = false;
                break;
            case GameStatus.MENU:
                this.scene.start('MainMenu');
                break;
        }
    }

    // Update scene-specific state including time elapsed and checkpoints, syncing with global store.
    updateSceneState() {
        if (this.sceneState.isPlaying) {
            // Update time elapsed
            this.sceneState.levelData.timeElapsed = 
                Math.floor((Date.now() - this.sceneState.startTime) / 1000);
            
            // Sync with store
            const state = this.store.getState();
            this.sceneState.levelData.currentScore = state.game.score;
            
            // Update checkpoint if needed
            if (this.checkpoints && this.player) {
                const currentCheckpoint = this.checkpoints.find(cp => 
                    this.player.x >= cp.x && !this.sceneState.levelData.checkpoints.includes(cp.id)
                );
                if (currentCheckpoint) {
                    this.sceneState.levelData.checkpoints.push(currentCheckpoint.id);
                    this.store.dispatch({ 
                        type: ActionTypes.UPDATE_CHECKPOINT, 
                        payload: currentCheckpoint 
                    });
                }
            }
        }
    }

    // Calculate appropriate spawn height relative to ground level.
    getSpawnHeight() {
        return this.groundTop - 16;
    }
}
