import { BaseScene } from '../elements/BaseScene';
import { MediumEnemy } from '../elements/EnemyTypes';

export class GameScene2 extends BaseScene {
    constructor() {
        super({ key: 'GameScene2' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#4A4A4A');
        super.create();

        const { width, height } = this.scale;

        // Set player to left side
        this.player.x = width * 0.1;

        // Add scene text
        this.add.text(width/2, height * 0.1, 'Scene 2', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Set next scene (can be modified if you add more scenes)
        this.nextSceneName = 'GameScene1';

        // Create enemy group with proper physics properties
        this.enemies = this.physics.add.group({
            collideWorldBounds: true,
            bounceX: 0.5,
            bounceY: 0.2,
            dragX: 200
        });

        // Wait a short moment for platforms to be fully set up
        this.time.delayedCall(100, () => {
            // Use helper method to get correct spawn height
            const enemyY = this.getSpawnHeight();

            // Create three medium enemies at different positions
            this.enemy1 = new MediumEnemy(this, width * 0.25, enemyY);
            this.enemy2 = new MediumEnemy(this, width * 0.5, enemyY);
            this.enemy3 = new MediumEnemy(this, width * 0.75, enemyY);

            // Add enemies to the group
            this.enemies.add(this.enemy1.sprite);
            this.enemies.add(this.enemy2.sprite);
            this.enemies.add(this.enemy3.sprite);

            // Set up collisions
            this.physics.add.collider(this.enemies, this.platforms);

            // Add collision between player and enemies
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
            this.remainingEnemies = 3;
        });
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
        const enemy = [this.enemy1, this.enemy2, this.enemy3].find(e => e.sprite === enemySprite);
        if (enemy && enemy.damage(1)) {
            // Enemy is dead
            enemy.destroy();
            this.addPoints(10);
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

        if (this.player.x > this.scale.width - 20) {
            // Store the current music state before transitioning
            const bgMusic = this.sound.get('bgMusic');
            const isMusicPlaying = bgMusic ? bgMusic.isPlaying : false;
            this.registry.set('musicEnabled', isMusicPlaying);

            this.scene.start('GameScene3');
        } else if (this.player.x < 20) {
            // Store the current music state before transitioning
            const bgMusic = this.sound.get('bgMusic');
            const isMusicPlaying = bgMusic ? bgMusic.isPlaying : false;
            this.registry.set('musicEnabled', isMusicPlaying);

            this.scene.start('GameScene1');
        }
    }
}
