import { BaseScene } from './BaseScene';
import { BossEnemy } from './EnemyTypes';

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
        this.cameras.main.setBackgroundColor('#2A2A2A');
        super.create();

        const width = this.scale.width;
        const height = this.scale.height;

        this.player.x = width * 0.1;
        this.bossDefeated = false;

        // Add scene text
        this.add.text(width/2, height * 0.1, 'Boss Room - Scene 5', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Create enemies group
        this.enemies = this.physics.add.group();

        // Create the boss at the right side
        this.boss = new BossEnemy(this, width * 0.8, height - 130);
        this.enemies.add(this.boss.sprite);

        // Set up collisions
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
        this.physics.add.collider(this.bullets, this.enemies, this.hitEnemyWithBullet, null, this);

        // Add invisible wall on the left to prevent going back
        const wall = this.add.rectangle(0, height/2, 20, height, 0x000000, 0);
        this.physics.add.existing(wall, true);
        this.physics.add.collider(this.player, wall);
        console.log('Scene 5 created successfully'); // Debug log
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        this.hitSound.play(); // Play hit sound
        bullet.destroy();
        
        if (this.boss && this.boss.sprite === enemySprite) {
            if (this.boss.damage(1)) {
                // Boss is dead
                this.boss.destroy();
                this.addPoints(100); // Big points for killing the boss
                this.boss = null; // Set boss to null when destroyed
                this.bossDefeated = true;
            }
        }
    }

    update() {
        super.update();

        if (this.boss) {
            this.boss.update();
        }

        // Check if boss is defeated
        if (!this.bossDefeated && !this.boss) {
            this.bossDefeated = true;
            console.log('Boss defeated in Scene 5!'); // Debug log
            
            // Show victory message
            const width = this.scale.width;
            const height = this.scale.height;
            this.add.text(width/2, height/2, 'Final Boss Defeated!', {
                fontFamily: 'Retronoid',
                fontSize: '64px',
                fill: '#fff'
            }).setOrigin(0.5);

            // Add instruction text
            this.add.text(width/2, height/2 + 80, 'Move right to continue', {
                fontFamily: 'Retronoid',
                fontSize: '32px',
                fill: '#fff'
            }).setOrigin(0.5);
        }

        // Check for scene transition
        if (this.bossDefeated && this.player.x > this.scale.width - 20) {
            // Stop any current music
            if (this.sound.get('bgMusic')) {
                this.sound.get('bgMusic').stop();
            }
            this.scene.start('MissionComplete');
        }
    }
}
