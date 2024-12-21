import { BaseScene } from '../elements/BaseScene';
import { GameUI } from '../elements/GameUI';
import { Slime } from '../../prefabs/Slime';

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

        // Set up the main game camera
        this.cameras.main.setZoom(2.5);
        this.cameras.main.setBounds(0, 0, width, height);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        
        // Set up UI
        this.gameUI = new GameUI(this);
        
        // Make sure UI stays fixed
        this.gameUI.container.setScrollFactor(0);
        
        // Debug UI visibility
        console.log('GameScene1 UI Setup:', {
            container: {
                x: this.gameUI.container.x,
                y: this.gameUI.container.y,
                visible: this.gameUI.container.visible,
                alpha: this.gameUI.container.alpha,
                children: this.gameUI.container.length
            },
            camera: {
                visible: this.gameUI.uiCamera.visible,
                active: this.gameUI.uiCamera.active,
                viewport: this.gameUI.uiCamera.viewport,
                scroll: {
                    x: this.gameUI.uiCamera.scrollX,
                    y: this.gameUI.uiCamera.scrollY
                },
                zoom: this.gameUI.uiCamera.zoom
            }
        });

        // Update camera ignore lists
        this.gameUI.updateCameraIgnoreList();
        
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
            bounceX: 0.5,
            bounceY: 0.2,
            dragX: 200
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
            
            // Add collisions between enemies with increased bounce
            this.physics.add.collider(
                this.enemies,
                this.enemies,
                this.handleEnemyCollision,
                null,
                this
            );
            
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

    handleEnemyCollision(enemy1, enemy2) {
        // If enemies are moving towards each other, reverse their directions
        if ((enemy1.body.velocity.x > 0 && enemy2.body.velocity.x < 0) ||
            (enemy1.body.velocity.x < 0 && enemy2.body.velocity.x > 0)) {
            
            if (enemy1.enemy) {
                enemy1.enemy.reverseDirection();
                // Add slight upward velocity for better separation
                enemy1.setVelocityY(-150);
            }
            if (enemy2.enemy) {
                enemy2.enemy.reverseDirection();
                // Add slight upward velocity for better separation
                enemy2.setVelocityY(-150);
            }
        }
        
        // Ensure enemies bounce off each other
        const pushForce = 100;
        if (enemy1.x < enemy2.x) {
            enemy1.setVelocityX(-pushForce);
            enemy2.setVelocityX(pushForce);
        } else {
            enemy1.setVelocityX(pushForce);
            enemy2.setVelocityX(-pushForce);
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
