import { BaseScene } from './BaseScene';
import { WeakEnemy } from './EnemyTypes';

export class GameScene1 extends BaseScene {
    constructor() {
        super({ key: 'GameScene1' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#5A5A5A');
        super.create();

        const width = this.scale.width;
        const height = this.scale.height;

        // Set player to left side
        this.player.x = width * 0.1;

        // Add scene text
        this.add.text(width/2, height * 0.1, 'Scene 1', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Create enemies group
        this.enemies = this.physics.add.group();

        // Create two weak enemies at different positions
        this.enemy1 = new WeakEnemy(this, width * 0.5, height - 130);  // Middle of screen
        this.enemy2 = new WeakEnemy(this, width * 0.8, height - 130);  // Right side

        // Add enemies to the group
        this.enemies.add(this.enemy1.sprite);
        this.enemies.add(this.enemy2.sprite);

        // Set up collisions
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
        this.physics.add.collider(this.bullets, this.enemies, this.hitEnemyWithBullet, null, this);
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        this.hitSound.play(); // Play hit sound
        bullet.destroy();
        
        // Find the enemy object that owns this sprite
        const enemy = [this.enemy1, this.enemy2].find(e => e.sprite === enemySprite);
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

        if (this.player.x > this.scale.width - 20) {
            this.scene.start('GameScene2');
        }
    }
}
