import { BaseScene } from '../elements/BaseScene';
import { BossEnemy } from '../../prefabs/EnemyTypes';
import { GameUI } from '../elements/GameUI';
import { Bitcoin } from '../../prefabs/Bitcoin';

export class GameScene5 extends BaseScene {
    constructor() {
        super({ key: 'GameScene5' });
        this.bossDefeated = false;
    }

    preload() {
        // Load victory music
        this.load.audio('victoryMusic', 'assets/sounds/congratulations.mp3');
    }

    create() {
        console.log('Creating Scene 5...'); // Debug log
        this.cameras.main.setBackgroundColor('#1A1A1A');
        super.create();

        const { width, height } = this.scale;

        // Set player to left side
        this.player.x = width * 0.1;

        // Set up the main game camera
        this.cameras.main.setZoom(1.5);
        this.cameras.main.setBounds(0, 0, width, height);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Set up UI
        this.gameUI = new GameUI(this);
        
        // Make sure UI stays fixed
        this.gameUI.container.setScrollFactor(0);

        // Add scene text
        this.add.text(width/2, height * 0.1, 'Boss Room - Scene 5', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Clean up any existing boss
        if (this.boss) {
            this.boss.destroy();
            this.boss = null;
        }

        // Create enemy group with proper physics properties
        this.enemies = this.physics.add.group({
            collideWorldBounds: true,
            bounceX: 0.5,
            bounceY: 0.2,
            dragX: 200
        });

        // Wait a short moment for platforms to be fully set up
        this.time.delayedCall(100, () => {
            // Create the boss at the right side
            const bossY = this.groundTop - 92; // Account for boss's larger size
            this.boss = new BossEnemy(this, width * 0.8, bossY);
            this.enemies.add(this.boss.sprite);

            // Set up collisions
            this.physics.add.collider(this.enemies, this.platforms);
            this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);

            // Add bullet collisions with enemies
            this.physics.add.collider(
                this.bullets,
                this.enemies,
                this.hitEnemyWithBullet,
                (bullet, enemySprite) => {
                    // Only process collision if enemy is not invincible
                    return enemySprite.enemy && !enemySprite.enemy.isInvincible;
                },
                this
            );

            this.physics.add.collider(this.bullets, this.platforms);

            // Add invisible wall on the left to prevent going back
            const wall = this.add.rectangle(0, height/2, 20, height, 0x000000, 0);
            this.physics.add.existing(wall, true);
            this.physics.add.collider(this.player, wall);

            // Set total enemies (just the boss)
            this.remainingEnemies = 1;

            // Extra physics settings for boss sprite
            this.boss.sprite.body.setCollideWorldBounds(true);
            this.boss.sprite.body.setFriction(1);

            // Create bitcoin group
            this.bitcoins = this.add.group();

            // Add 10 bitcoins in a V pattern
            const startX = width * 0.2;
            const endX = width * 0.8;
            const spacing = (endX - startX) / 9; // 9 spaces for 10 coins
            const baseY = height - 150; // Base Y position (150px from bottom)
            const maxHeight = 80; // Maximum height of the V pattern

            for (let i = 0; i < 10; i++) {
                const x = startX + (i * spacing);
                // Create V pattern by using absolute distance from center
                const heightFactor = Math.abs(i - 4.5) / 4.5; // 0 at center, 1 at edges
                const y = baseY - (maxHeight * (1 - heightFactor)); // Highest at center
                const bitcoin = new Bitcoin(this, x, y);
                this.bitcoins.add(bitcoin);
                this.physics.add.overlap(this.player, bitcoin, () => {
                    bitcoin.collect();
                });
            }

            // Create level elements
        });

        // Load victory music if not already loaded
        if (!this.sound.get('victoryMusic')) {
            this.load.audio('victoryMusic', 'assets/sounds/congratulations.mp3');
            this.load.start();
        }

        console.log('Scene 5 created successfully'); // Debug log
    }

    shutdown() {
        // Clean up when leaving the scene
        if (this.boss) {
            this.boss.destroy();
            this.boss = null;
        }
        super.shutdown();
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        // Create particles at hit location
        for(let i = 0; i < 10; i++) {
            const particle = this.add.circle(bullet.x, bullet.y, 3, 0xffff00);
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            this.tweens.add({
                targets: particle,
                x: particle.x + (vx * 0.3),
                y: particle.y + (vy * 0.3),
                alpha: 0,
                scale: 0.1,
                duration: 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        this.hitSound.play();
        bullet.destroy();
        
        if (this.boss && this.boss.sprite === enemySprite) {
            if (this.boss.damage(1)) {
                console.log('Boss defeated!');
                // Boss is dead
                this.boss.destroy();
                this.addPoints(100); // Big points for killing the boss
                this.boss = null;
                this.bossDefeated = true;
                this.remainingEnemies = 0;

                // Add completion text without space key requirement
                this.add.text(this.scale.width/2, this.scale.height/2, 'Boss Defeated!\nHead right to complete the mission', {
                    fontSize: '32px',
                    fill: '#fff',
                    align: 'center'
                }).setOrigin(0.5).setScrollFactor(0);

                // Play victory music
                if (this.victoryMusic && !this.victoryMusic.isPlaying) {
                    this.victoryMusic.play();
                }

                // Disable world bounds collision on the right side
                this.player.body.setCollideWorldBounds(false);
                
                // Set the world bounds to allow moving past the right edge
                this.physics.world.setBounds(0, 0, this.scale.width * 2, this.scale.height);
            }
        }
    }

    update() {
        super.update();

        // Update boss patrol if it exists and ensure it stays above ground
        if (this.boss && this.boss.sprite && this.boss.sprite.active) {
            this.boss.update();
            
            // Extra check to keep boss above ground
            if (this.boss.sprite.y > this.groundTop - 46) {
                this.boss.sprite.y = this.groundTop - 46;
                this.boss.sprite.body.setVelocityY(0);
            }
        }

        // Debug logging for position and state
        if (this.bossDefeated) {
            console.log('Player position:', this.player.x, 'Screen width:', this.scale.width);
        }

        // Check for scene transition when boss is defeated AND player reaches right side
        if (this.bossDefeated && this.player.x > this.scale.width - 100) {
            console.log('Transitioning to MissionComplete scene');
            if (this.sound.get('bgMusic')) {
                this.sound.get('bgMusic').stop();
            }
            this.scene.start('MissionComplete');
        }
    }
}
