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

export class BaseScene extends Scene {
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

        // Add collision between bullets and platforms
        this.physics.add.collider(this.bullets, this.platforms, (bullet) => {
            this.destroyBullet(bullet);
        }, null, this);

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

    update() {
        if (this.player) {
            this.player.update();
        }

        if (this.debug) {
            this.debug.update();
        }

        // Check for space key press during game over
        if (this.gameOver && this.spaceKey && this.spaceKey.isDown) {
            // Clean up current scene
            this.cleanup();
            
            // Reset registry values
            this.registry.set('lives', 3);
            this.registry.set('playerHP', 100);
            this.registry.set('score', 0);
            this.registry.set('bitcoins', 0);

            // Stop current scene and start from MainMenu
            this.scene.start('MainMenu');
        }
    }

    cleanup() {
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

        // Clean up input
        if (this.input) {
            this.input.keyboard.enabled = false;
            this.input.keyboard.removeAllKeys();
            this.input.removeAllListeners();
        }

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
