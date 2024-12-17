import { BaseScene } from './BaseScene';
import { StrongEnemy } from './EnemyTypes';

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

        const width = this.scale.width;
        const height = this.scale.height;

        // Set player to left side
        this.player.x = width * 0.1;

        // Create victory music with volume control
        this.victoryMusic = this.sound.add('victoryMusic', { volume: 0.3 });
        console.log('Victory music loaded:', this.victoryMusic); // Debug log

        // Add scene text
        this.add.text(width/2, height * 0.1, 'Scene 4', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Create enemies group
        this.enemies = this.physics.add.group();

        // Calculate exact spawn height
        const enemyY = height - 90; // Spawn higher up for faster fall

        // Create five strong enemies at different positions
        this.enemy1 = new StrongEnemy(this, width * 0.2, enemyY);  // Far left
        this.enemy2 = new StrongEnemy(this, width * 0.4, enemyY);  // Left
        this.enemy3 = new StrongEnemy(this, width * 0.6, enemyY);  // Middle
        this.enemy4 = new StrongEnemy(this, width * 0.8, enemyY);  // Right
        this.enemy5 = new StrongEnemy(this, width * 0.95, enemyY); // Far right

        // Add enemies to the group
        this.enemies.add(this.enemy1.sprite);
        this.enemies.add(this.enemy2.sprite);
        this.enemies.add(this.enemy3.sprite);
        this.enemies.add(this.enemy4.sprite);
        this.enemies.add(this.enemy5.sprite);

        // Set up collisions
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
        this.physics.add.collider(this.bullets, this.enemies, this.hitEnemyWithBullet, null, this);

        // Add invisible wall on the left to prevent going back
        const wall = this.add.rectangle(0, height/2, 20, height, 0x000000, 0);
        this.physics.add.existing(wall, true);
        this.physics.add.collider(this.player, wall);

        // Flag to track if all enemies are defeated
        this.allEnemiesDefeated = false;
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        this.hitSound.play(); // Play hit sound
        bullet.destroy();
        
        // Find the enemy object that owns this sprite
        const enemy = [this.enemy1, this.enemy2, this.enemy3, this.enemy4, this.enemy5].find(e => e.sprite === enemySprite);
        if (enemy && enemy.damage(1)) {
            // Enemy is dead
            enemy.destroy();
            this.addPoints(10);
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

        // Check if all enemies are defeated
        if (!this.allEnemiesDefeated) {
            this.allEnemiesDefeated = ![this.enemy1, this.enemy2, this.enemy3, this.enemy4, this.enemy5].some(enemy => enemy && enemy.sprite.active);
            
            if (this.allEnemiesDefeated) {
                console.log('All enemies defeated in Scene 4!'); // Debug log
            }
        }

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
