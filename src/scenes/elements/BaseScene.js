// @ai-do-not-touch

import { Scene } from 'phaser';
import { container } from '../../modules/di/ServiceContainer';
import { ManagerFactory } from '../../modules/di/ManagerFactory';
import { GameUI } from './GameUI';
import { Bullet } from '../../prefabs/Bullet';
import { ParallaxBackground } from '../../prefabs/ParallaxBackground';
import { Player } from '../../prefabs/Player';
import { DebugSystem } from '../../_Debug/DebugSystem';
import { GameConfig, getGroundTop, getSpawnHeight } from '../../config/GameConfig';
import { Store } from '../../modules/state/Store';
import { ActionTypes, GameStatus, PlayerState } from '../../modules/state/types';
import { updateScore, updateHealth, updateLives, updateBitcoins, updatePlayerState } from '../../modules/state/actions';

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
    }

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

    create() {
        // Prevent right-click context menu
        this.game.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        }, false);

        // Get the canvas dimensions
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Initialize managers using factory
        const managers = ManagerFactory.createManagers(this);
        
        // Assign managers to scene
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

        // Initialize background music with volume from registry
        const bgMusic = this.sound.add('bgMusic', { loop: true });
        const musicVolume = this.registry.get('musicVolume') || 1;
        bgMusic.setVolume(musicVolume);
        this.musicManager.setCurrentMusic(bgMusic);
        this.musicManager.play();

        this.input.keyboard.enabled = true;  // Ensure keyboard is enabled on scene start

        // Set up world physics
        this.physics.world.setBounds(0, 0, width, height);

        // Create parallax background first, before other elements
        this.parallaxBackground = new ParallaxBackground(this);

        // Create platforms group for collision
        this.platforms = this.physics.add.staticGroup();
        
        // Store reference for spawning entities
        this.groundTop = getGroundTop(height);
        
        // Default spawn point (can be overridden by child scenes)
        this.playerSpawnPoint = {
            x: width * GameConfig.PLAYER.SPAWN_OFFSET_X,
            y: getSpawnHeight(this.groundTop)
        };

        // Initialize game state and animations
        this.gameState.initializeGameState();
        this.animations.createAllAnimations();

        // Create bullet group with physics
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: -1,  // Remove bullet limit
            runChildUpdate: true,  // This will call preUpdate on each bullet
            allowGravity: false,  // Disable gravity for all bullets in the group
            immovable: true  // Make bullets not affected by collisions
        });

        // Set up all collisions using CollisionManager
        this.collisionManager.setupCollisions();

        // Create game elements - only create player if not skipped
        if (!this.skipPlayerCreation) {
            this.createPlayer(width);
            this.boundaries.createBoundaries(this.player);
        }

        // Create UI
        this.createUI();
        
        // Listen for scene events
        this.events.on('wake', this.onSceneWake, this);
        this.events.on('resume', this.onSceneResume, this);
        this.events.on('shutdown', this.cleanup, this);
        this.events.on('sleep', this.cleanup, this);

        // Initialize debug system
        this.debug.initialize();

        // Initialize controller
        this.initializeController();

        // Initialize scene state
        this.initializeSceneState();
    }

    initializeSceneState() {
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
            this.store.dispatch(updatePlayerState(PlayerState.IDLE));

            console.log('Scene state initialized!');
        } catch (error) {
            this.handleError(error, 'state');
        }
    }

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
            this.handleError(error, 'storeUpdate');
        }
    }

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

    createPlayer(width) {
        // Create player using the Player prefab
        this.player = new Player(this, width * GameConfig.PLAYER.SPAWN_OFFSET_X, this.playerSpawnPoint.y);
        
        // Add collision with platforms
        this.physics.add.collider(this.player, this.platforms);

        return this.player;
    }

    createUI() {
        // Create UI
        this.gameUI = new GameUI(this);
        this.gameUI.container.setScrollFactor(0);
        this.gameUI.updateCameraIgnoreList();
    }

    destroyBullet(bullet) {
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false;
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        this.enemies.handleBulletHit(bullet, enemySprite);
    }

    hitEnemy(player, enemy) {
        // Don't process damage if player is already dying or dead
        if (player.isDying || this.gameState.get('playerHP') <= 0) {
            if (!this.isDying) {
                this.handlePlayerDeath();
            }
            return;
        }
        
        // Get current HP before damage
        const currentHP = this.gameState.get('playerHP');
        
        // Get enemy damage amount
        const damage = enemy.enemy ? enemy.enemy.damageAmount : 25;
        
        // Calculate new HP but don't let it go below 0
        const newHP = Math.max(0, currentHP - damage);
        this.gameState.set('playerHP', newHP);
        this.gameUI.updateHP(newHP);

        // Set invulnerability period (2 seconds for all enemies)
        this.invulnerableUntil = this.time.now + 2000;
        
        // Visual feedback
        this.effects.createFlashEffect(player);
        
        // Check for player death
        if (newHP <= 0 && !this.isDying) {
            this.handlePlayerDeath();
        }
    }

    handlePlayerDeath() {
        if (this.isDying) return; // Prevent multiple death handlers
        
        this.isDying = true;
        this.player.setVelocity(0, 0);
        this.player.body.moves = false;
        
        // Decrease lives using StateManager
        const lives = this.gameState.decrement('lives');
        this.gameUI.updateLives(lives);
    
        // Play death animation if it exists
        if (this.anims.exists('character_Death')) {
            this.player.play('character_Death');
            this.player.once('animationcomplete', () => {
                if (lives <= 0) {
                    this.gameState.handleGameOver();
                } else {
                    this.handleRespawn();
                }
            });
        } else {
            // If no death animation, wait a moment then proceed
            this.time.delayedCall(1000, () => {
                if (lives <= 0) {
                    this.gameState.handleGameOver();
                } else {
                    this.handleRespawn();
                }
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
        this.gameState.set('playerHP', 100);
        this.gameUI.updateHP(100);
        
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

    setupTileCollisions(map, layer) {
        // These are the tile IDs that should collide based on the JSON
        const collidingTiles = [257, 260, 261, 641, 642, 643, 644, 645, 705, 706, 707];
        
        // Set collision for specific tile IDs
        layer.setCollision(collidingTiles);
        
        // Add collision between player and layer
        if (this.player) {
            this.physics.add.collider(this.player, layer);
        }
        
        // Set world bounds based on map size
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    }

    initializeController() {
        try {
            // Create controller if player exists
            if (this.player) {
                this.controller = new PlayerController(this);
            }
        } catch (error) {
            this.handleError(error, 'controller');
        }
    }

    handleError(error, context) {
        console.error(`Error in ${context}:`, error);
        
        // Log error but don't crash the game
        if (this.debug && this.debug.enabled) {
            // Create debug text for error
            const errorText = this.add.text(10, 10, `Error: ${error.message} in ${context}`, {
                fontSize: '16px',
                fill: '#ff0000'
            });
            errorText.setScrollFactor(0);
            errorText.setDepth(1000);
            
            // Remove text after 3 seconds
            this.time.delayedCall(3000, () => {
                errorText.destroy();
            });
        }
        
        // Attempt recovery based on context
        switch(context) {
            case 'controller':
                // Try to reinitialize controller
                if (this.controller) {
                    if (typeof this.controller.destroy === 'function') {
                        this.controller.destroy();
                    }
                    this.controller = null;
                    // Try to create controller again after a short delay
                    this.time.delayedCall(100, () => {
                        this.initializeController();
                    });
                }
                break;
            case 'player':
                // Reset player position if there's an error
                if (this.player && this.playerSpawnPoint) {
                    this.player.setPosition(this.playerSpawnPoint.x, this.playerSpawnPoint.y);
                }
                break;
            case 'physics':
                if (this.physics && this.physics.world) {
                    this.physics.world.resume();
                }
                break;
        }
    }

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
                this.registry.set('lives', 3);
                this.registry.set('playerHP', 100);
                this.registry.set('score', 0);
                this.registry.set('bitcoins', 0);
                this.scene.start('MainMenu');
            }
        } catch (error) {
            this.handleError(error, 'update');
        }
    }

    cleanup() {
        // Clean up input first to prevent callbacks during cleanup
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

    onSceneWake() {
        this.input.keyboard.enabled = true;
    }

    onSceneResume() {
        this.input.keyboard.enabled = true;
    }

    shutdown() {
        this.cleanup();
        super.shutdown();
    }

    // Helper method to get spawn height for entities
    getSpawnHeight() {
        return this.groundTop - 16;
    }
}
