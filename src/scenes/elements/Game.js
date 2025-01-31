/**
 * Game.js
 * Main gameplay scene handling core game mechanics including:
 * - Player movement and shooting
 * - Enemy spawning and collision
 * - Score and energy management
 */

import { Scene } from 'phaser';
import { PauseMenu } from './PauseMenu';
import { MainMenu } from '../menus/MainMenu';
import { DevHub } from '../menus/DevHub/DevHub';
import { Credits } from '../menus/Credits';

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    /**
     * GAME STATE INITIALIZATION
     * Set up initial game variables and registry values
     */
    init() {
        // Initialize core game state in registry
        this.registry.set('score', 0);
        this.registry.set('playerHP', 100);
        
        // Set default music state if not configured
        if (this.registry.get('musicEnabled') === undefined) {
            this.registry.set('musicEnabled', true);
        }
        
        // Weapon cooldown tracking
        this.lastFired = 0;
    }

    /**
     * SCENE SETUP
     * Create game objects, setup physics, and initialize systems
     */
    create() {
        // Setup visual elements
        this.add.image(512, 384, 'background');
        this.setupUI();
        
        // Configure audio
        this.setupAudio();

        // Initialize game entities
        this.setupPlayer();
        this.setupWeapons();
        this.setupEnemies();
        
        // Setup collision detection
        this.setupCollisions();
        
        // Initialize input handling
        this.setupControls();
        
        // Start enemy spawning
        this.spawnEnemies();
        
        // Register additional scenes
        this.scene.add('MainMenu', MainMenu);
        this.scene.add('DevHub', DevHub);
        this.scene.add('Credits', Credits);
    }

    /**
     * AUDIO SETUP
     * Configure and manage game audio
     */
    setupAudio() {
        const musicVolume = this.registry.get('musicVolume') || 1;
        // Apply volume to all music tracks
        this.sound.getAll().forEach(sound => {
            if (sound.key && (
                sound.key.toLowerCase().includes('music') || 
                sound.key.toLowerCase().includes('bgm') ||
                sound.key.toLowerCase().includes('theme')
            )) {
                sound.setVolume(musicVolume);
            }
        });
    }

    /**
     * UI SETUP
     * Create and configure UI elements
     */
    setupUI() {
        // Score display with arcade styling
        this.scoreText = this.add.text(16, 16, 'SCORE: 0', {
            fontFamily: 'ArcadeClassic',
            fontSize: '32px',
            fill: '#00ffff',
            stroke: '#ffffff',
            strokeThickness: 1
        });

        // Energy bar display
        this.energyBar = this.add.rectangle(100, 50, 200, 20, 0x00ff00);
        this.energyBar.setOrigin(0);
    }

    /**
     * ENTITY SETUP
     * Initialize player, weapons, and enemies
     */
    setupPlayer() {
        this.player = this.physics.add.sprite(512, 700, 'player')
            .setCollideWorldBounds(true);
    }

    setupWeapons() {
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 10  // Limit concurrent bullets
        });
    }

    setupEnemies() {
        this.enemies = this.physics.add.group();
    }

    /**
     * PHYSICS AND COLLISION SETUP
     */
    setupCollisions() {
        // Bullet-enemy collisions
        this.physics.add.overlap(
            this.bullets,
            this.enemies,
            (bullet, enemy) => this.managers.collisions.handleBulletEnemyOverlap(bullet, enemy),
            null,
            this
        );

        // Player-enemy collisions
        this.physics.add.overlap(
            this.player,
            this.enemies,
            (player, enemy) => this.managers.collisions.handlePlayerEnemyOverlap(player, enemy),
            null,
            this
        );
    }

    /**
     * INPUT HANDLING SETUP
     */
    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-SPACE', () => {
            this.shoot();
        });
    }

    /**
     * GAME LOOP
     * Update game state each frame
     */
    update() {
        this.handlePlayerMovement();
        this.updateEnergyBar();
        this.cleanupEntities();
    }

    updateEnergyBar() {
        // Gradually decrease energy over time
        this.energyBar.width = Math.max(this.energyBar.width - 0.05, 0);
    }

    cleanupEntities() {
        // Remove out-of-bounds bullets
        this.bullets.children.each(bullet => {
            if (bullet.active && (bullet.y < -10 || bullet.y > 800)) {
                bullet.destroy();
            }
        });

        // Remove out-of-bounds enemies
        this.enemies.children.each(enemy => {
            if (enemy.active && enemy.y > 800) {
                enemy.destroy();
            }
        });
    }

    /**
     * PLAYER CONTROLS
     */
    handlePlayerMovement() {
        // Reset velocity each frame
        this.player.setVelocity(0);

        // Apply movement based on input
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-300);
        }
        if (this.cursors.right.isDown) {
            this.player.setVelocityX(300);
        }
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-300);
        }
        if (this.cursors.down.isDown) {
            this.player.setVelocityY(300);
        }
    }

    /**
     * COMBAT MECHANICS
     */
    shoot() {
        const bullet = this.bullets.get(this.player.x, this.player.y - 20);
        if (bullet) {
            bullet.setActive(true)
                .setVisible(true)
                .setVelocityY(-400);
        }
    }

    spawnEnemies() {
        // Periodically spawn enemies at random x positions
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                const x = Phaser.Math.Between(50, 974);
                const enemy = this.enemies.create(x, -20, 'enemy');
                enemy.setVelocityY(150);
            },
            loop: true
        });
    }

    /**
     * COLLISION HANDLERS
     */
    hitEnemy(bullet, enemy) {
        // Handle bullet-enemy collision
        bullet.destroy();
        enemy.destroy();
        this.score += 10;
        this.scoreText.setText('SCORE: ' + this.score);

        // Reward player with energy
        this.energyBar.width = Math.min(this.energyBar.width + 20, 200);
    }

    hitPlayer(player, enemy) {
        // Handle player-enemy collision
        enemy.destroy();
        
        // Update player health
        const currentHP = this.registry.get('playerHP') || 100;
        const damage = 10;
        const newHP = Math.max(currentHP - damage, 0);
        this.registry.set('playerHP', newHP);
        
        // Update energy bar to reflect health
        this.energyBar.width = (newHP / 100) * 200;

        // Check for game over
        if (newHP <= 0) {
            this.gameOver();
        }
    }

    /**
     * SCENE TRANSITIONS
     */
    gameOver() {
        this.scene.start('GameOver');
    }
}
