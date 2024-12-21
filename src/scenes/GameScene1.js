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
        this.enemies = this.physics.add.group({
            collideWorldBounds: true,
            bounceX: 0,
            bounceY: 0
        });

        // Wait a short moment for platforms to be fully set up
        this.time.delayedCall(100, () => {
            // Use helper method to get correct spawn height
            const enemyY = this.getSpawnHeight();

            // Create two slimes at different positions
            this.enemy1 = new Slime(this, width * 0.3, enemyY);
            this.enemy2 = new Slime(this, width * 0.7, enemyY);

            // Add enemies to the group
            this.enemies.add(this.enemy1.sprite);
            this.enemies.add(this.enemy2.sprite);

            // Set up collisions
            this.physics.add.collider(this.enemies, this.platforms);
            this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
            
            // Set up bullet collisions with process callback
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
            
            // Set number of enemies
            this.remainingEnemies = 2;
        });
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        // Skip if enemy is already being destroyed
        if (!enemySprite.active || !enemySprite.body || !enemySprite.body.enable) {
            bullet.destroy();
            return;
        }
        
        // Create particles at hit location
        this.createHitEffect(bullet.x, bullet.y);
        
        // Play hit sound and destroy bullet
        this.hitSound.play();
        bullet.destroy();
        
        // Get the enemy instance directly from the sprite
        const enemy = enemySprite.enemy;
        if (enemy && !enemy.isInvincible) {
            // If enemy dies from this hit
            if (enemy.damage(1)) {
                // Add points before destroying the enemy
                this.addPoints(10);
                this.remainingEnemies--;
                
                // Check if level is complete
                if (this.remainingEnemies <= 0) {
                    this.checkLevelComplete();
                }
            }
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
