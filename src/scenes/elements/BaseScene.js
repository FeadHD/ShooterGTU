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
        // Get the canvas dimensions
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Initialize managers using factory
        const managers = ManagerFactory.createManagers(this);
        
        // Assign managers to scene
        this.stateManager = managers.stateManager;
        this.animationManager = managers.animationManager;
        this.effectsManager = managers.effectsManager;
        this.enemyManager = managers.enemyManager;
        this.boundaryManager = managers.boundaryManager;
        this.debugSystem = managers.debugSystem;

        // Initialize background music with volume from registry
        if (this.sound.get('bgMusic')) {
            const musicVolume = this.registry.get('musicVolume') || 1;
            this.sound.get('bgMusic').setVolume(musicVolume);
        }

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
        this.stateManager.initializeGameState();
        this.animationManager.createAllAnimations();

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

        // Create game elements
        this.createPlayer(width);
        this.boundaryManager.createBoundaries(this.player);

        // Create UI
        this.createUI();
        
        // Listen for scene events
        this.events.on('wake', this.onSceneWake, this);
        this.events.on('resume', this.onSceneResume, this);
        this.events.on('shutdown', this.cleanup, this);
        this.events.on('sleep', this.cleanup, this);

        // Initialize debug system
        this.debugSystem.initialize();
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
        this.enemyManager.handleBulletHit(bullet, enemySprite);
    }

    hitEnemy(player, enemy) {
        // Don't process damage if player is already dying or dead
        if (player.isDying || this.stateManager.get('playerHP') <= 0) {
            if (!this.isDying) {
                this.handlePlayerDeath();
            }
            return;
        }
        
        // Get current HP before damage
        const currentHP = this.stateManager.get('playerHP');
        
        // Get enemy damage amount
        const damage = enemy.enemy ? enemy.enemy.damageAmount : 25;
        
        // Calculate new HP but don't let it go below 0
        const newHP = Math.max(0, currentHP - damage);
        this.stateManager.set('playerHP', newHP);
        this.gameUI.updateHP(newHP);

        // Set invulnerability period (2 seconds for all enemies)
        this.invulnerableUntil = this.time.now + 2000;
        
        // Visual feedback
        this.effectsManager.createFlashEffect(player);
        
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
        const lives = this.stateManager.decrement('lives');
        this.gameUI.updateLives(lives);
    
        // Play death animation if it exists
        if (this.anims.exists('character_Death')) {
            this.player.play('character_Death');
            this.player.once('animationcomplete', () => {
                if (lives <= 0) {
                    this.stateManager.handleGameOver();
                } else {
                    this.handleRespawn();
                }
            });
        } else {
            // If no death animation, wait a moment then proceed
            this.time.delayedCall(1000, () => {
                if (lives <= 0) {
                    this.stateManager.handleGameOver();
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
        this.stateManager.set('playerHP', 100);
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

    update() {
        if (this.player) {
            this.player.update();
        }

        if (this.debugSystem) {
            this.debugSystem.update();
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
        if (this.stateManager) this.stateManager = null;
        if (this.animationManager) this.animationManager = null;
        if (this.effectsManager) this.effectsManager = null;
        if (this.enemyManager) this.enemyManager = null;
        if (this.debugSystem) this.debugSystem = null;

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
