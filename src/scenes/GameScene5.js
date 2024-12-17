import { BaseScene } from './BaseScene';
import { BossEnemy } from './EnemyTypes';

export class GameScene5 extends BaseScene {
    constructor() {
        super({ key: 'GameScene5' });
        this.bossDefeated = false;
    }

    create() {
        this.cameras.main.setBackgroundColor('#744242');
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
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        bullet.destroy();
        
        if (this.boss && this.boss.sprite === enemySprite) {
            if (this.boss.damage(1)) {
                // Boss is dead
                this.boss.destroy();
                this.addPoints(100); // Big points for killing the boss
                this.bossDefeated = true;
            }
        }
    }

    update() {
        super.update();

        // Update boss patrol
        if (this.boss) this.boss.update();

        if (this.player.x < 20) {
            this.scene.start('GameScene4');
        } else if (this.bossDefeated && this.player.x > this.scale.width - 20) {
            // Transition to mission complete when boss is defeated and player moves right
            this.scene.start('MissionComplete');
        }
    }
}
