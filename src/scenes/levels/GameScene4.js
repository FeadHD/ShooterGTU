import { BaseScene } from '../elements/BaseScene';
import { StrongEnemy } from '../../prefabs/EnemyTypes';
import { GameUI } from '../elements/GameUI';
import { Bitcoin } from '../../prefabs/Bitcoin';

export class GameScene4 extends BaseScene {
    constructor() {
        super({ key: 'GameScene4' });
    }

    preload() {
        // Load victory music
        this.load.audio('victoryMusic', 'assets/sounds/congratulations.mp3');
    }

    create() {
        this.cameras.main.setBackgroundColor('#2A2A2A');
        super.create();

        const { width, height } = this.scale;

        // Set player to left side
        this.player.x = width * 0.1;

        // Set up the main game camera
        this.cameras.main.setZoom(1.5);
        this.cameras.main.setBounds(0, 0, width, height);
        this.cameras.main.startFollow(this.player, true, 0.25, 0.25, 0, 0);

        // Set up UI
        this.gameUI = new GameUI(this);
        
        // Make sure UI stays fixed
        this.gameUI.container.setScrollFactor(0);

        // Create victory music with volume control
        this.victoryMusic = this.sound.add('victoryMusic', { volume: 0.3 });

        // Add scene text
        this.add.text(width/2, height * 0.1, 'Scene 4', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Set next scene
        this.nextSceneName = 'GameScene5';
        
        // Create enemy group with proper physics properties
        this.enemies = this.physics.add.group({
            collideWorldBounds: true,
            bounceX: 0.5,
            bounceY: 0.2,
            dragX: 200
        });

        // Create bitcoin group
        this.bitcoins = this.add.group();

        // Add 10 bitcoins in a diagonal pattern
        const startX = width * 0.2;
        const endX = width * 0.8;
        const spacing = (endX - startX) / 9; // 9 spaces for 10 coins
        const baseY = height - 150; // Base Y position (150px from bottom)
        const heightStep = 15; // Each coin is 15px higher than the last

        for (let i = 0; i < 10; i++) {
            const x = startX + (i * spacing);
            const y = baseY - (i * heightStep); // Each coin gets progressively higher
            const bitcoin = new Bitcoin(this, x, y);
            this.bitcoins.add(bitcoin);
            this.physics.add.overlap(this.player, bitcoin, () => {
                bitcoin.collect();
            });
        }

        // Wait a short moment for platforms to be fully set up
        this.time.delayedCall(100, () => {
            // Use helper method to get correct spawn height
            const enemyY = this.getSpawnHeight();

            // Create five strong enemies at different positions
            this.enemy1 = new StrongEnemy(this, width * 0.2, enemyY);  // Far left
            this.enemy2 = new StrongEnemy(this, width * 0.4, enemyY);  // Left
            this.enemy3 = new StrongEnemy(this, width * 0.6, enemyY);  // Middle
            this.enemy4 = new StrongEnemy(this, width * 0.8, enemyY);  // Right
            this.enemy5 = new StrongEnemy(this, width * 0.9, enemyY); // Far right

            // Add enemies to the group
            this.enemies.add(this.enemy1.sprite);
            this.enemies.add(this.enemy2.sprite);
            this.enemies.add(this.enemy3.sprite);
            this.enemies.add(this.enemy4.sprite);
            this.enemies.add(this.enemy5.sprite);

            // Set up collisions
            this.physics.add.collider(this.enemies, this.platforms);
            this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
            
            // Add collisions between enemies with proper handling
            this.physics.add.collider(
                this.enemies,
                this.enemies,
                this.handleEnemyCollision,
                null,
                this
            );

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

            // Set number of enemies
            this.remainingEnemies = 5;
        });

        // Flag to track if all enemies are defeated
        this.allEnemiesDefeated = false;
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
                x: particle.x + (vx * 0.3), // Move in direction over 300ms
                y: particle.y + (vy * 0.3),
                alpha: 0,
                scale: 0.1,
                duration: 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        this.hitSound.play(); // Play hit sound
        bullet.destroy();
        
        // Find the enemy object that owns this sprite
        const enemy = [this.enemy1, this.enemy2, this.enemy3, this.enemy4, this.enemy5].find(e => e.sprite === enemySprite);
        if (enemy && enemy.damage(1)) {
            // Enemy is dead
            enemy.destroy();
            this.addPoints(10);
            this.remainingEnemies--;
            if (this.remainingEnemies === 0) {
                this.allEnemiesDefeated = true;
            }
        }
    }

    handleEnemyCollision(enemy1, enemy2) {
        // If enemies are moving towards each other, reverse their directions
        if ((enemy1.body.velocity.x > 0 && enemy2.body.velocity.x < 0) ||
            (enemy1.body.velocity.x < 0 && enemy2.body.velocity.x > 0)) {

            if (enemy1.enemy) {
                enemy1.enemy.reverseDirection();
                // Add slight upward velocity for better separation
                enemy1.body.setVelocityY(-150);
            }
            if (enemy2.enemy) {
                enemy2.enemy.reverseDirection();
                // Add slight upward velocity for better separation
                enemy2.body.setVelocityY(-150);
            }
        }

        // Ensure enemies bounce off each other
        const pushForce = 100;
        if (enemy1.x < enemy2.x) {
            enemy1.body.setVelocityX(-pushForce);
            enemy2.body.setVelocityX(pushForce);
        } else {
            enemy1.body.setVelocityX(pushForce);
            enemy2.body.setVelocityX(-pushForce);
        }
    }

    update() {
        super.update();

        // Update enemy patrols
        if (this.enemy1) this.enemy1.update();
        if (this.enemy2) this.enemy2.update();
        if (this.enemy3) this.enemy3.update();
        if (this.enemy4) this.enemy4.update();
        if (this.enemy5) this.enemy5.update();

        // Check for scene transition
        if (this.allEnemiesDefeated && this.player.x > this.scale.width - 20) {
            console.log('Transitioning to Scene 5...'); // Debug log
            // Stop any current music
            if (this.sound.get('backgroundMusic')) {
                this.sound.get('backgroundMusic').stop();
            }
            this.scene.start('GameScene5');
            console.log('Scene 5 started'); // Debug log
        }
    }
}
