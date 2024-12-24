import { Scene } from 'phaser';
import { GameUI } from './GameUI';
import { Bullet } from '../../prefabs/Bullet';
import { ParallaxBackground } from '../../prefabs/ParallaxBackground';
import { Player } from '../../prefabs/Player';
import { AnimationManager } from '../../modules/managers/AnimationManager';
import { StateManager } from '../../modules/managers/StateManager';
import { DebugSystem } from '../../_Debug/DebugSystem';
import { SceneBoundaryManager } from '../../modules/managers/BoundaryManager';
import { EffectsManager } from '../../modules/managers/EffectsManager';

export class BaseScene extends Scene {
    preload() {
        // Load character spritesheet if not already loaded
        if (!this.textures.exists('character')) {
            this.load.spritesheet('character', 'assets/character.png', {
                frameWidth: 24,
                frameHeight: 24
            });
        }
        
        // Load particle texture
        this.load.image('particle', 'assets/particle.png');
    }

    create() {
        // Get the canvas dimensions
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Initialize managers
        this.stateManager = new StateManager(this);
        this.animationManager = new AnimationManager(this);
        this.debugSystem = new DebugSystem(this);
        this.boundaryManager = new SceneBoundaryManager(this);
        this.effectsManager = new EffectsManager(this);

        // Initialize game state and animations
        this.stateManager.initializeGameState();
        this.animationManager.createAllAnimations();

        this.input.keyboard.enabled = true;  // Ensure keyboard is enabled on scene start

        // Set up world physics
        this.physics.world.gravity.y = 800;
        this.physics.world.setBounds(0, 0, width, height);

        // Create parallax background first, before other elements
        this.parallaxBackground = new ParallaxBackground(this);

        // Create platforms group for collision
        this.platforms = this.physics.add.staticGroup();
        
        // Store reference for spawning entities
        this.groundTop = height - 64;
        this.getSpawnHeight = () => this.groundTop - 16;

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

        // Ensure font is loaded before creating UI
        if (typeof WebFont !== 'undefined') {
            WebFont.load({
                custom: {
                    families: ['Retronoid'],
                    urls: ['assets/fonts/fonts.css']
                },
                active: () => {
                    console.log('Font loaded in BaseScene, creating UI');
                    this.createUI();
                },
                inactive: () => {
                    console.warn('Font failed to load in BaseScene, using fallback');
                    this.createUI();
                }
            });
        } else {
            console.warn('WebFont not available in BaseScene, creating UI anyway');
            this.createUI();
        }

        // Initialize game tracking
        this.remainingEnemies = 0;
        this.nextSceneName = '';
        
        // Listen for scene events
        this.events.on('wake', this.onSceneWake, this);
        this.events.on('resume', this.onSceneResume, this);
        this.events.on('shutdown', this.cleanup, this);
        this.events.on('sleep', this.cleanup, this);

        // Add debug graphics and toggle
        this.debugGraphics = this.add.graphics();
        this.debugGraphics.setDepth(999);
        this.showDebug = false;
        
        // Add E key for debug toggle
        this.input.keyboard.addKey('E').on('down', () => {
            this.showDebug = !this.showDebug;
            if (!this.showDebug) {
                this.debugGraphics.clear();
            }
        });
    }

    createPlayer(width) {
        // Create player using the Player prefab
        this.player = new Player(this, width * 0.1, this.getSpawnHeight());
        
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
        this.effectsManager.createHitEffect(bullet.x, bullet.y);
        this.effectsManager.playSound('hit');
        bullet.destroy();

        const enemy = [this.enemy1, this.enemy2, this.boss].find(e => e && e.sprite === enemySprite);
        if (enemy) {
            enemy.currentHealth--;
            console.log('Enemy hit, health:', enemy.currentHealth);
            if (enemy.currentHealth <= 0) {
                enemy.sprite.destroy();
                this.remainingEnemies--;
                console.log('Enemy defeated, remaining:', this.remainingEnemies);
                this.addPoints(enemy === this.boss ? 50 : 10);
                this.checkLevelComplete();
            }
        }
    }

    checkLevelComplete() {
        if (this.remainingEnemies <= 0) {
            const currentScene = this.scene.key;
            // Don't show completion text for Scene 5 as it has its own handling
            if (currentScene !== 'GameScene5') {
                const sceneNumber = parseInt(currentScene.slice(-1));
                this.nextSceneName = `GameScene${sceneNumber + 1}`;
            }
        }
    }

    hitEnemy(player, enemy) {
        if (this.isDying) return;
        
        // Check if player is currently invulnerable
        if (this.time.now < this.invulnerableUntil) return;

        // Use StateManager to decrement player HP
        const currentHP = this.stateManager.decrement('playerHP', 25);
        this.gameUI.updateHP(currentHP);

        // Set invulnerability period
        this.invulnerableUntil = this.time.now + 1000;
        
        // Visual feedback
        this.tweens.add({
            targets: player,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 4,
            onComplete: () => {
                player.setAlpha(1);
            }
        });

        // Check for player death
        if (currentHP <= 0) {
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
        // Reset player position
        this.player.setPosition(this.cameras.main.width * 0.1, this.getSpawnHeight());
        this.player.setVelocity(0, 0);
        
        // Reset player state
        this.isDying = false;
        this.player.body.moves = true;
        this.player.setAlpha(1);
        
        // Reset player HP
        this.stateManager.set('playerHP', 100);
        this.gameUI.updateHP(100);
        
        // Play respawn animation or idle
        if (this.anims.exists('character_respawn')) {
            this.player.play('character_respawn');
        } else {
            this.player.play('character_Idle');
        }
        
        // Make player temporarily invulnerable
        this.invulnerableUntil = this.time.now + 2000;
    }

    update() {
        if (this.player) {
            this.player.update();
        }

        if (this.debugSystem) {
            this.debugSystem.update();
        }
    }

    addPoints(points) {
        const currentScore = this.registry.get('score');
        this.registry.set('score', currentScore + points);
        this.gameUI.updateScore(currentScore + points);
    }

    cleanup() {
        // Clean up any event listeners or timers here
        if (this.player) {
            this.player.destroy();
        }
    }

    onSceneWake() {
        // Re-enable input when scene wakes up
        this.input.keyboard.enabled = true;
        this.input.mouse.enabled = true;
    }

    onSceneResume() {
        // Re-enable input when scene resumes
        this.input.keyboard.enabled = true;
        this.input.mouse.enabled = true;
    }

    shutdown() {
        // Clean up when scene is shut down
        if (this.effectsManager) {
            this.effectsManager.cleanup();
        }
        this.cleanup();
        super.shutdown();
    }
}
