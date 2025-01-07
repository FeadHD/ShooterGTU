export class CollisionManager {
    constructor(scene) {
        this.scene = scene;
    }

    setupCollisions() {
        this.setupTileCollisions();
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

            // Melee Warriors
            if (this.scene.enemies) {
                this.scene.physics.add.overlap(
                    this.scene.bullets,
                    this.scene.enemies,
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

    setupTileCollisions() {
        // Get all tilemap layers
        const tilemapLayers = this.scene.children.list.filter(child => 
            child.type === 'TilemapLayer'
        );

        // Define solid tile IDs
        const solidTileIds = [641, 642, 643, 644];

        console.log('Setting up tile collisions for layers:', 
            tilemapLayers.map(layer => layer.name)
        );

        tilemapLayers.forEach(layer => {
            // Add collision between layer and game objects
            if (this.scene.player) {
                this.scene.physics.add.collider(this.scene.player, layer);
            }
            if (this.scene.enemies) {
                this.scene.physics.add.collider(this.scene.enemies, layer);
            }
            if (this.scene.bullets) {
                this.scene.physics.add.collider(
                    this.scene.bullets, 
                    layer,
                    (bullet) => {
                        if (this.scene.effectsManager) {
                            this.scene.effectsManager.createHitEffect(bullet.x, bullet.y);
                        }
                        bullet.destroy();
                    }
                );
            }
        });

        // Add collisions with platform rectangles
        if (this.scene.platforms) {
            if (this.scene.player) {
                this.scene.physics.add.collider(this.scene.player, this.scene.platforms);
            }
            if (this.scene.enemies) {
                this.scene.physics.add.collider(this.scene.enemies, this.scene.platforms);
            }
            if (this.scene.bullets) {
                this.scene.physics.add.collider(
                    this.scene.bullets,
                    this.scene.platforms,
                    (bullet) => {
                        if (this.scene.effectsManager) {
                            this.scene.effectsManager.createHitEffect(bullet.x, bullet.y);
                        }
                        bullet.destroy();
                    }
                );
            }
        }
    }

    handleBulletHit(bullet, enemySprite) {
        if (!enemySprite.active || !enemySprite.body || !enemySprite.body.enable) {
            bullet.destroy();
            return;
        }

        // Store bullet hit position for warrior defense behavior
        if (enemySprite.getData('type') === 'warrior') {
            const warrior = enemySprite.getData('enemy');
            if (warrior) {
                warrior.lastBulletHitPos = { x: bullet.x, y: bullet.y };
            }
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
