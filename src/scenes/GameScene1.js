import { BaseScene } from './BaseScene';
import { Slime } from './Slime';

export class GameScene1 extends BaseScene {
    constructor() {
        super({ key: 'GameScene1' });
    }

    preload() {
        // Load all audio files
        this.load.audio('laser', 'assets/sounds/laser.wav');
        this.load.audio('hit', 'assets/sounds/hit.wav');
        this.load.audio('victoryMusic', 'assets/sounds/congratulations');
    }

    create() {
        super.create();
        
        const { width, height } = this.scale;
        
        // Set next scene
        this.nextSceneName = 'GameScene2';
        
        // Set player to left side
        this.player.x = width * 0.1;

        // Add scene text
        this.add.text(width/2, height * 0.1, 'Scene 1', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Add instruction text
        this.instructionText = this.add.text(width/2, height * 0.2, 'Defeat all enemies to proceed!', {
            fontFamily: 'Retronoid',
            fontSize: '24px',
            fill: '#ff0'
        }).setOrigin(0.5);

        // Create enemy group
        this.enemies = this.physics.add.group();

        // Wait a short moment for platforms to be fully set up
        this.time.delayedCall(100, () => {
            // Use helper method to get correct spawn height
            const enemyY = this.getSpawnHeight();

            // Create two weak enemies at different positions
            this.enemy1 = new Slime(this, width * 0.3, enemyY);  // Moved from 0.3 to 0.5 (middle)
            this.enemy2 = new Slime(this, width * 0.7, enemyY);  // Moved from 0.7 to 0.8 (further right)

            // Add enemies to the group
            this.enemies.add(this.enemy1.sprite);
            this.enemies.add(this.enemy2.sprite);

            // Set up collisions
            this.physics.add.collider(this.enemies, this.platforms);

            // Add collision between player and enemies
            this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
            this.physics.add.collider(this.bullets, this.enemies, this.hitEnemyWithBullet, null, this);
            
            // Set number of enemies
            this.remainingEnemies = 2;
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
        const enemy = [this.enemy1, this.enemy2].find(e => e.sprite === enemySprite);
        if (enemy && enemy.damage(1)) {
            // Enemy is dead
            enemy.destroy();
            this.addPoints(10);
            this.remainingEnemies--;
        }
    }

    update() {
        super.update();

        // Update enemy patrols
        if (this.enemy1) this.enemy1.update();
        if (this.enemy2) this.enemy2.update();

        // Check if player has reached the right side and all enemies are defeated
        const allEnemiesDefeated = !this.enemy1?.sprite?.active && !this.enemy2?.sprite?.active;
        if (this.player.x > this.scale.width - 20 && allEnemiesDefeated) {
            this.scene.start('GameScene2');
        }
    }
}
