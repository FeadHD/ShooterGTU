import { BaseScene } from './BaseScene';
import { MediumEnemy, StrongEnemy } from './EnemyTypes';

export class GameScene3 extends BaseScene {
    constructor() {
        super({ key: 'GameScene3' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#4a6274');
        super.create();
        
        const width = this.scale.width;
        const height = this.scale.height;
        
        // Set player to left side
        this.player.x = width * 0.1;
        
        // Add scene text
        this.add.text(width/2, height * 0.1, 'Castle - Scene 3', { 
            fontFamily: 'Retronoid',
            fontSize: '32px', 
            fill: '#fff' 
        }).setOrigin(0.5);

        // Create enemies group
        this.enemies = this.physics.add.group();

        // Create three medium enemies starting from the right side
        this.mediumEnemies = [];
        for (let i = 0; i < 3; i++) {
            const enemy = new MediumEnemy(this, width * 0.6 + (i * 150), height - 130);
            this.mediumEnemies.push(enemy);
            this.enemies.add(enemy.sprite);
        }

        // Create one strong enemy at the far right
        this.strongEnemy = new StrongEnemy(this, width * 0.9, height - 130);
        this.enemies.add(this.strongEnemy.sprite);

        // Set up collisions
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
        this.physics.add.collider(this.bullets, this.enemies, this.hitEnemyWithBullet, null, this);
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        bullet.destroy();
        
        // Find the enemy object that owns this sprite
        const allEnemies = [...this.mediumEnemies, this.strongEnemy];
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
        this.mediumEnemies.forEach(enemy => {
            if (enemy) enemy.update();
        });
        if (this.strongEnemy) this.strongEnemy.update();

        if (this.player.x > this.scale.width - 20) {
            this.scene.start('GameScene4');
        } else if (this.player.x < 20) this.scene.start('GameScene2');
    }
}
