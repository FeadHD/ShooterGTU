import { BaseScene } from './BaseScene';
import { MediumEnemy, StrongEnemy } from './EnemyTypes';

export class GameScene4 extends BaseScene {
    constructor() {
        super({ key: 'GameScene4' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#427454');
        super.create();
        
        const width = this.scale.width;
        const height = this.scale.height;
        
        // Set player to left side
        this.player.x = width * 0.1;
        
        // Add scene text
        this.add.text(width/2, height * 0.1, 'Garden - Scene 4', { 
            fontFamily: 'Retronoid',
            fontSize: '32px', 
            fill: '#fff' 
        }).setOrigin(0.5);

        // Create enemies group
        this.enemies = this.physics.add.group();

        // Create four strong enemies starting from the right side
        this.strongEnemies = [];
        for (let i = 0; i < 4; i++) {
            const enemy = new StrongEnemy(this, width * 0.5 + (i * 120), height - 130);
            this.strongEnemies.push(enemy);
            this.enemies.add(enemy.sprite);
        }

        // Create two medium enemies at the far right
        this.mediumEnemies = [];
        for (let i = 0; i < 2; i++) {
            const enemy = new MediumEnemy(this, width * 0.9 + (i * 100), height - 130);
            this.mediumEnemies.push(enemy);
            this.enemies.add(enemy.sprite);
        }

        // Set up collisions
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
        this.physics.add.collider(this.bullets, this.enemies, this.hitEnemyWithBullet, null, this);
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        this.hitSound.play(); // Play hit sound
        bullet.destroy();
        
        // Find the enemy object that owns this sprite
        const allEnemies = [...this.strongEnemies, ...this.mediumEnemies];
        const enemy = allEnemies.find(e => e && e.sprite === enemySprite);
        
        if (enemy && enemy.damage(1)) {
            // Enemy is dead
            enemy.destroy();
            // More points for stronger enemies
            const points = enemy instanceof StrongEnemy ? 40 : 20;
            this.addPoints(points);
        }
    }

    update() {
        super.update();

        // Update enemy patrols
        this.strongEnemies.forEach(enemy => {
            if (enemy) enemy.update();
        });
        this.mediumEnemies.forEach(enemy => {
            if (enemy) enemy.update();
        });

        if (this.player.x > this.scale.width - 20) {
            this.scene.start('GameScene5');
        } else if (this.player.x < 20) this.scene.start('GameScene3');
    }
}
