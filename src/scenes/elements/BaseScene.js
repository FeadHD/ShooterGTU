import { Scene } from 'phaser';
import { GameUI } from './GameUI';
import { Bullet } from '../../prefabs/Bullet';
import { ParallaxBackground } from '../../prefabs/ParallaxBackground';
import { Player } from '../../prefabs/Player';
import { AnimationManager } from '../../modules/managers/AnimationManager';

export class BaseScene extends Scene {
    preload() {
        // Load bullet spritesheet if not already loaded
        if (!this.textures.exists('bullet_animation')) {
            this.load.spritesheet('bullet_animation', 'assets/sprites/bullet_animation.png', {
                frameWidth: 24,
                frameHeight: 24
            });
        }
    }

    create() {
        // Get the canvas dimensions
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Initialize game state if not set
        if (this.registry.get('score') === undefined) {
            this.registry.set('score', 0);
        }
        if (this.registry.get('lives') === undefined || this.registry.get('lives') <= 0) {
            this.registry.set('lives', 3);
        }
        if (this.registry.get('playerHP') === undefined) {
            this.registry.set('playerHP', 100);
        }
        if (!this.registry.get('bitcoins')) {
            this.registry.set('bitcoins', 0);
        }

        this.input.keyboard.enabled = true;  // Ensure keyboard is enabled on scene start

        // Initialize animation manager and create animations
        this.animationManager = new AnimationManager(this);
        this.animationManager.createAllAnimations();

        // Set up world
        this.physics.world.gravity.y = 800;
        this.physics.world.setBounds(0, 0, width, height);

        // Create parallax background first, before other elements
        console.log('BaseScene: Creating parallax background...');
        this.parallaxBackground = new ParallaxBackground(this);

        // Create platforms group for collision
        this.platforms = this.physics.add.staticGroup();
        
        // Store reference for spawning entities
        this.groundTop = height - 64;
        this.getSpawnHeight = () => this.groundTop - 16;

        // Create particles and sounds
        this.hitParticles = this.add.particles({
            key: 'particle',
            config: {
                speed: { min: 100, max: 200 },
                scale: { start: 1, end: 0 },
                tint: 0xffff00,
                blendMode: 'ADD',
                lifespan: 300,
                quantity: 10,
                emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, 20) }
            }
        });
        this.laserSound = this.sound.add('laser', { volume: 0.05 });
        this.hitSound = this.sound.add('hit', { volume: 0.1 });

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
        this.createSceneBoundaries();
        this.createPlayer(width);

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

    createAnimations() {
        // All animations are now handled by AnimationManager
        // This method is kept for backward compatibility
        // and can be removed once all scenes are updated
    }

    createPlayer(width) {
        // Create player using the Player prefab
        this.player = new Player(this, width * 0.1, this.getSpawnHeight());
        
        // Add collision with platforms
        this.physics.add.collider(this.player, this.platforms);

        // Add collision with bullets
        this.physics.add.collider(this.bullets, this.platforms, (bullet) => {
            this.destroyBullet(bullet);
        });

        return this.player;
    }

    createSceneBoundaries() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // Create invisible wall only on the left to prevent going back
        const leftBoundary = this.add.rectangle(0, height/2, 10, height, 0x000000, 0);
        this.physics.add.existing(leftBoundary, true);
        
        // Add collision between player and left boundary
        if (this.player) {
            this.physics.add.collider(this.player, leftBoundary);
        }
    }

    createUI() {
        // Create UI
        this.gameUI = new GameUI(this);
        this.gameUI.container.setScrollFactor(0);
        this.gameUI.updateCameraIgnoreList();
    }

    shoot(direction = 'right') {
        const bullet = this.bullets.get(this.player.x, this.player.y);
        if (!bullet) return;
        
        // Ensure bullet physics properties are set
        bullet.body.setAllowGravity(false);
        bullet.body.setImmovable(true);
        
        bullet.fire(this.player.x, this.player.y, direction);
        this.laserSound.play();
    }

    destroyBullet(bullet) {
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false;
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        this.createHitEffect(bullet.x, bullet.y);
        this.hitSound.play();
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

    createHitEffect(x, y) {
        for(let i = 0; i < 10; i++) {
            const particle = this.add.circle(x, y, 3, 0xffff00);
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            
            this.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * speed * 0.3,
                y: particle.y + Math.sin(angle) * speed * 0.3,
                alpha: 0,
                scale: 0.1,
                duration: 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    hitEnemy(player, enemy) {
        if (this.isDying) return;
        
        // Check if player is currently invulnerable
        if (this.time.now < this.invulnerableUntil) return;

        this.playerHP -= 25;
        this.registry.set('playerHP', this.playerHP); // Store HP in registry
        this.gameUI.updateHP(this.playerHP);

        if (this.playerHP <= 0) {
            this.handlePlayerDeath();
        } else {
            // Set invulnerability for 1000ms
            this.invulnerableUntil = this.time.now + 1000;
            
            // Create flashing effect during invulnerability
            this.tweens.add({
                targets: player,
                alpha: { from: 0.5, to: 1 },
                duration: 100,
                repeat: 4,
                yoyo: true,
                onComplete: () => {
                    if (!this.isDying) this.alpha = 1;
                }
            });
            
            this.hitSound.play();
        }
    }

    handlePlayerDeath() {
        this.isDying = true;
        this.player.setVelocity(0, 0);
        this.player.body.moves = false;
        
        // Decrease lives
        const lives = this.registry.get('lives') - 1;
        this.registry.set('lives', lives);
        this.gameUI.updateLives(lives);
    
        // Play death animation
        this.player.play('character_death');
        this.player.once('animationcomplete', () => {
            if (lives <= 0) {
                this.handleGameOver();
            } else {
                this.handleRespawn();
            }
        });
    }

    update() {
        if (this.showDebug) {
            this.debugGraphics.clear();
            this.platforms.children.entries.forEach(platform => {
                this.debugGraphics.lineStyle(1, 0x00ff00);
                this.debugGraphics.strokeRect(platform.x, platform.y, platform.width, platform.height);
            });
        }
        
        if (this.player) {
            this.player.update();
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
        this.cleanup();
        super.shutdown();
    }
}
