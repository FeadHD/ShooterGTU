export class CollisionManager {
    constructor(scene) {
        this.scene = scene;
    }

    setupCollisions() {
        this.setupEnemyCollisions();
        this.setupBulletCollisions();
        this.setupPlayerCollisions();
    }

    setupEnemyCollisions() {
        // Set up collisions between enemies
        if (this.scene.slimes) {
            this.scene.physics.add.collider(
                this.scene.slimes,
                this.scene.slimes,
                this.handleEnemyCollision,
                null,
                this.scene
            );
        }

        // Add collision between enemies and platforms/map
        if (this.scene.mapLayer) {
            if (this.scene.slimes) {
                this.scene.physics.add.collider(this.scene.slimes, this.scene.mapLayer);
                this.scene.physics.add.collider(this.scene.slimes, this.scene.platforms);
            }
            if (this.scene.drones) {
                this.scene.physics.add.collider(this.scene.drones, this.scene.mapLayer);
                this.scene.physics.add.collider(this.scene.drones, this.scene.platforms);
            }
        }
    }

    setupBulletCollisions() {
        // Bullet collisions with map
        if (this.scene.mapLayer && this.scene.bullets) {
            this.scene.physics.add.collider(
                this.scene.bullets,
                this.scene.mapLayer,
                (bullet) => {
                    this.scene.effectsManager.createHitEffect(bullet.x, bullet.y);
                    bullet.destroy();
                },
                null,
                this.scene
            );
        }

        // Bullet collisions with enemies
        if (this.scene.bullets) {
            // Slimes
            if (this.scene.slimes) {
                this.scene.physics.add.overlap(
                    this.scene.bullets,
                    this.scene.slimes,
                    this.handleBulletHit,
                    this.canHitEnemy,
                    this
                );
            }

            // Drones
            if (this.scene.drones) {
                this.scene.physics.add.overlap(
                    this.scene.bullets,
                    this.scene.drones,
                    this.handleBulletHit,
                    this.canHitEnemy,
                    this
                );
            }
        }
    }

    setupPlayerCollisions() {
        if (this.scene.player) {
            // Player collision with map and platforms
            if (this.scene.mapLayer) {
                this.scene.physics.add.collider(this.scene.player, this.scene.mapLayer);
                this.scene.physics.add.collider(this.scene.player, this.scene.platforms);
            }

            // Helper function to check if damage can be applied
            const canApplyDamage = () => {
                return !this.scene.isDying && 
                       (!this.scene.invulnerableUntil || this.scene.time.now >= this.scene.invulnerableUntil);
            };

            // Player collision with enemies
            if (this.scene.slimes) {
                this.scene.physics.add.overlap(
                    this.scene.player,
                    this.scene.slimes,
                    (player, enemySprite) => {
                        if (enemySprite.enemy && canApplyDamage()) {
                            this.scene.hitEnemy(player, enemySprite);
                        }
                    },
                    null,
                    this.scene
                );
            }

            if (this.scene.drones) {
                this.scene.physics.add.overlap(
                    this.scene.player,
                    this.scene.drones,
                    (player, droneSprite) => {
                        if (droneSprite.enemy && canApplyDamage()) {
                            this.scene.hitEnemy(player, droneSprite);
                        }
                    },
                    null,
                    this.scene
                );
            }
        }
    }

    handleBulletHit(bullet, enemySprite) {
        if (!enemySprite.active || !enemySprite.body || !enemySprite.body.enable) {
            bullet.destroy();
            return;
        }
        bullet.destroy();
        this.scene.enemyManager.handleBulletHit(bullet, enemySprite);
    }

    canHitEnemy(bullet, enemySprite) {
        return enemySprite.enemy && !enemySprite.enemy.isInvincible;
    }

    handleEnemyCollision(enemy1, enemy2) {
        // If enemies are moving towards each other, reverse their directions
        if ((enemy1.body.velocity.x > 0 && enemy2.body.velocity.x < 0) ||
            (enemy1.body.velocity.x < 0 && enemy2.body.velocity.x > 0)) {
            
            if (enemy1.enemy) {
                enemy1.enemy.reverseDirection();
                enemy1.setVelocityY(-150);
            }
            if (enemy2.enemy) {
                enemy2.enemy.reverseDirection();
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
}
