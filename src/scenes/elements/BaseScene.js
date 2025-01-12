// @ai-do-not-touch

/**
 * BaseScene.js
 * ============
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
 * Core:
 * - /modules/di/ManagerFactory.js      : Creates and manages game systems
 * - /modules/state/Store.js            : Global state management
 * - /modules/state/types.js            : Game state type definitions
 * 
 * UI Elements:
 * - /scenes/elements/GameUI.js         : Game interface components
 * 
 * Game Objects:
 * - /prefabs/Bullet.js                 : Projectile management
 * - /prefabs/ParallaxBackground.js     : Scrolling background
 * - /prefabs/Player.js                 : Player character
 * 
 * Configuration:
 * - /config/GameConfig.js              : Game settings and constants
 */

import { Scene } from 'phaser';
import { ManagerFactory } from '../../modules/di/ManagerFactory';
import { GameUI } from './GameUI';
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
    COLLIDING_TILES: [257, 260, 261, 641, 642, 643, 644, 645, 705, 706, 707]  // Tile IDs that should have collision
};

/**
 * Base scene class that handles game initialization, updates, and cleanup.
 * This class serves as a foundation for all game scenes.
 */
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

    /**
     * Preload assets required for the scene.
     * This includes character spritesheets and particle textures.
     */
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

    /**
     * Create and initialize game objects, managers, and systems.
     * This includes setting up the canvas, physics, input, and audio.
     */
    create() {
        // Setup core systems
        const managers = ManagerFactory.createManagers(this);
        this.gameState = managers.gameState;
        this.persistence = managers.persistence;
        this.soundManager = managers.sound;
        this.musicManager = managers.music;
        this.entityManager = managers.entityManager;
        this.enemies = managers.enemies;
        this.hazards = managers.hazards;
        this.animations = managers.animations;
        this.effects = managers.effects;
        this.boundaries = managers.boundaries;
        this.debug = managers.debug;
        this.collisionManager = managers.collision;
        this.errorSystem = new ErrorSystem(this);
        this.eventManager = managers.events;

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
        this.#setupCollisions();
        
        // Setup audio
        this.#setupMusic();
        
        // Setup visuals
        this.#createParallaxBackground();
        this.#createUI();
        
        // Setup gameplay elements
        this.#storeSpawnInfo(width, height);
        this.#initializeGameSystems();
        this.#createBulletGroup();
        this.#createPlayerIfNeeded(width);
        
        // Setup state and events
        this.#initializeController();
        this.#registerSceneEvents();
        this.#initializeSceneState();
    }

    // =====================
    // Core System Methods
    // =====================
    
    /** Configure world physics boundaries */
    #setupWorldPhysics(width, height) {
        this.physics.world.setBounds(0, 0, width, height);
    }

    /** Create static platforms that the player can collide with and stand on */
    #createPlatforms() {
        this.platforms = this.physics.add.staticGroup();
    }

    /** Set up all necessary collision detection between game entities */
    #setupCollisions() {
        this.collisionManager.setupCollisions();
    }

    // =====================
    // Audio Methods
    // =====================
    
    /** Set up background music with volume from registry */
    #setupMusic() {
        const bgMusic = this.sound.add('bgMusic', { loop: true });
        const musicVolume = this.registry.get('musicVolume') || 1;
        bgMusic.setVolume(musicVolume);
        this.musicManager.setCurrentMusic(bgMusic);
        this.musicManager.play();
    }

    // =====================
    // Physics and World Methods
    // =====================
    
    /** Create parallax background layers for a sense of depth and movement */
    #createParallaxBackground() {
        this.parallaxBackground = new ParallaxBackground(this);
    }

    /** Create and configure the heads-up display (HUD) for score, health, etc. */
    #createUI() {
        // Create UI
        this.gameUI = new GameUI(this);
        this.gameUI.container.setScrollFactor(0);
        this.gameUI.updateCameraIgnoreList();
    }

    // =====================
    // Gameplay Methods
    // =====================
    
    /** Store ground level and player spawn coordinates for respawning and level setup */
    #storeSpawnInfo(width, height) {
        this.groundTop = getGroundTop(height);
        this.playerSpawnPoint = {
            x: width * GameConfig.PLAYER.SPAWN_OFFSET_X,
            y: this.getSpawnHeight()
        };
    }

    /** Initialize game state and create all character/enemy animations */
    #initializeGameSystems() {
        this.gameState.initializeGameState();
        this.animations.createAllAnimations();
    }

    /** Create a physics group for bullets with specific properties for projectile behavior */
    #createBulletGroup() {
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: -1,
            runChildUpdate: true,
            allowGravity: false,
            immovable: true
        });
    }

    /** Create the player character if not explicitly skipped by the scene */
    #createPlayerIfNeeded(width) {
        if (!this.skipPlayerCreation) {
            this.createPlayer(width);
            this.boundaries.createBoundaries(this.player);
        }
    }

    /** Create and configure the player character with proper physics and collision */
    createPlayer(width) {
        // Create player using the Player prefab
        this.player = new Player(this, width * GameConfig.PLAYER.SPAWN_OFFSET_X, this.playerSpawnPoint.y);
        
        // Add collision with platforms
        this.physics.add.collider(this.player, this.platforms);

        return this.player;
    }

    // =====================
    // State and Event Methods
    // =====================
    
    /** Initialize the player controller for handling input and movement */
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

    /** Register event handlers for scene lifecycle events */
    #registerSceneEvents() {
        this.events.on('wake', this.onSceneWake, this);
        this.events.on('resume', this.onSceneResume, this);
        this.events.on('shutdown', this.shutdown, this);
        this.events.on('sleep', this.cleanup, this);
    }

    /** Initialize and sync scene state with global game state */
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
            this.gameState.initializeGameState();
            
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
     * Safely clean up bullet objects when they hit something or go off screen.
     */
    destroyBullet(bullet) {
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false;
    }

    /**
     * Handle collision between player bullets and enemies, including damage calculation.
     */
    hitEnemyWithBullet(bullet, enemySprite) {
        this.enemies.handleBulletHit(bullet, enemySprite);
    }

    /**
     * Process player damage when colliding with enemies, including invulnerability period.
     */
    hitEnemy(player, enemy) {
        // Don't process damage if player is already dying or dead
        if (player.isDying || this.gameState.get('playerHP') <= 0) {
            if (!this.isDying) {
                this.eventManager.emit(GameEvents.PLAYER_DEATH, {
                    position: { x: player.x, y: player.y },
                    cause: 'enemy_collision'
                });
            }
            return;
        }
        
        // Get current HP before damage
        const currentHP = this.gameState.get('playerHP');
        
        // Get enemy damage amount
        const damage = enemy.enemy ? enemy.enemy.damageAmount : PLAYER_CONSTANTS.DEFAULT_ENEMY_DAMAGE;
        
        // Calculate new HP but don't let it go below 0
        const newHP = Math.max(0, currentHP - damage);
        this.gameState.set('playerHP', newHP);
        this.gameUI.updateHP(newHP);

        // Emit health change event
        this.eventManager.emit(GameEvents.HEALTH_CHANGE, {
            oldHealth: currentHP,
            newHealth: newHP,
            damage: damage,
            source: enemy
        });

        // Set invulnerability period
        this.invulnerableUntil = this.time.now + PLAYER_CONSTANTS.INVULNERABILITY_DURATION;
        
        // Visual feedback
        this.effects.createFlashEffect(player);
        
        // Check for player death
        if (newHP <= 0 && !this.isDying) {
            this.eventManager.emit(GameEvents.PLAYER_DEATH, {
                position: { x: player.x, y: player.y },
                cause: 'enemy_damage',
                enemy: enemy
            });
        }
    }

    /**
     * Handle player death sequence, animations, and life system.
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
                        finalScore: this.gameState.get('score'),
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
     * Handle complete game over state
     */
    handleGameOver() {
        this.store.dispatch({ type: ActionTypes.UPDATE_GAME_STATUS, payload: GameStatus.GAME_OVER });
        this.handleFullRestart();
    }

    /**
     * Perform a full scene restart, resetting all game state
     */
    handleFullRestart() {
        this.cleanup();
        this.registry.set('lives', PLAYER_CONSTANTS.INITIAL_LIVES);
        this.registry.set('playerHP', PLAYER_CONSTANTS.INITIAL_HP);
        this.registry.set('score', 0);
        this.registry.set('bitcoins', 0);
        this.scene.restart();
    }

    /**
     * Reset player position and state after death, with temporary invulnerability.
     */
    handleRespawn() {
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
        this.gameState.set('playerHP', PLAYER_CONSTANTS.INITIAL_HP);
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
     */
    setupTileCollisions(map, layer) {
        // Set collision for specific tile IDs
        layer.setCollision(TILE_CONSTANTS.COLLIDING_TILES);
        
        // Add collision between player and layer
        if (this.player) {
            this.physics.add.collider(this.player, layer);
        }
        
        // Set world bounds based on map size
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    }

    /**
     * Update game state each frame, handling player movement, debug info, and game over state
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
     * Clean up all game objects and managers before scene shutdown
     */
    cleanup() {
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
        if (this.gameState) this.gameState = null;
        if (this.persistence) this.persistence = null;
        if (this.soundManager) this.soundManager = null;
        if (this.musicManager) this.musicManager = null;
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

    /**
     * Re-enable keyboard input when scene wakes from sleep.
     */
    onSceneWake() {
        this.input.keyboard.enabled = true;
    }

    /**
     * Re-enable keyboard input when scene resumes from pause.
     */
    onSceneResume() {
        this.input.keyboard.enabled = true;
    }

    /**
     * Clean up resources and call parent shutdown when scene is destroyed
     */
    shutdown() {
        this.cleanup();
        super.shutdown();
    }

    /**
     * Handle updates to global game state and update local scene accordingly.
     */
    handleStoreUpdate(state, action) {
        try {
            switch(action.type) {
                case ActionTypes.UPDATE_SCORE:
                    this.gameState.set('score', state.game.score);
                    this.sceneState.levelData.currentScore = state.game.score;
                    break;
                case ActionTypes.UPDATE_HEALTH:
                    this.gameState.set('playerHP', state.player.health);
                    if (state.player.health <= 0) {
                        this.store.dispatch({ type: ActionTypes.UPDATE_GAME_STATUS, payload: GameStatus.GAME_OVER });
                    }
                    break;
                case ActionTypes.UPDATE_LIVES:
                    this.gameState.set('lives', state.game.lives);
                    break;
                case ActionTypes.UPDATE_BITCOINS:
                    this.gameState.set('bitcoins', state.game.bitcoins);
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

    /**
     * Process game status changes like pause, resume, and game over.
     */
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

    /**
     * Update scene-specific state like time elapsed and checkpoints.
     */
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

    /**
     * Calculate appropriate spawn height relative to ground level.
     */
    getSpawnHeight() {
        return this.groundTop - 16;
    }
}
