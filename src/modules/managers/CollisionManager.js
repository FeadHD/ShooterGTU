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
            // Add Zapper collisions with ground and platforms
            if (this.scene.enemies) {
                this.scene.physics.add.collider(this.scene.enemies, this.scene.groundLayer);
                this.scene.physics.add.collider(this.scene.enemies, this.scene.platformLayer);
            }
        }
    }

    setupBulletCollisions() {
        if (!this.scene.bullets) return;

        // Bullet collisions with map
        if (this.scene.mapLayer) {
            this.scene.physics.add.collider(
                this.scene.bullets,
                this.scene.mapLayer,
                this.handleBulletCollision,
                null,
                this
            );
        }

        // Bullet collisions with platforms
        if (this.scene.platforms) {
            this.scene.physics.add.collider(
                this.scene.bullets,
                this.scene.platforms,
                this.handleBulletCollision,
                null,
                this
            );
        }

        // Set up bullet collisions with all enemy groups
        if (this.scene.enemies) {
            this.scene.physics.add.overlap(
                this.scene.bullets,
                this.scene.enemies,
                (bullet, enemySprite) => {
                    if (this.scene.enemyManager) {
                        this.scene.enemyManager.handleBulletHit(bullet, enemySprite);
                    }
                },
                null,
                this
            );
        }

        if (this.scene.slimes) {
            this.scene.physics.add.overlap(
                this.scene.bullets,
                this.scene.slimes,
                (bullet, enemySprite) => {
                    if (this.scene.enemyManager) {
                        this.scene.enemyManager.handleBulletHit(bullet, enemySprite);
                    }
                },
                null,
                this
            );
        }

        if (this.scene.drones) {
            this.scene.physics.add.overlap(
                this.scene.bullets,
                this.scene.drones,
                (bullet, enemySprite) => {
                    if (this.scene.enemyManager) {
                        this.scene.enemyManager.handleBulletHit(bullet, enemySprite);
                    }
                },
                null,
                this
            );
        }

        if (this.scene.meleeWarriors) {
            this.scene.physics.add.overlap(
                this.scene.bullets,
                this.scene.meleeWarriors,
                (bullet, enemySprite) => {
                    if (this.scene.enemyManager) {
                        this.scene.enemyManager.handleBulletHit(bullet, enemySprite);
                    }
                },
                null,
                this
            );
        }
    }

    setupPlayerCollisions() {
        if (!this.scene.player) return;

        // Player collision with map layers
        if (this.scene.groundLayer) {
            this.scene.physics.add.collider(this.scene.player, this.scene.groundLayer);
        }
        if (this.scene.platformLayer) {
            this.scene.physics.add.collider(this.scene.player, this.scene.platformLayer);
        }

        // Add collision between player and map layer
        if (this.scene.mapLayer) {
            this.scene.physics.add.collider(this.scene.player, this.scene.mapLayer);
        }

        // Add collision between player and platforms
        if (this.scene.platforms) {
            this.scene.physics.add.collider(this.scene.player, this.scene.platforms);
        }

        // Add collision between player and ramp
        if (this.scene.ramp) {
            this.scene.physics.add.collider(this.scene.player, this.scene.ramp);
        }

        // Helper function to check if damage can be applied
        const canApplyDamage = () => {
            return !this.scene.isDying && 
                   (!this.scene.invulnerableUntil || this.scene.time.now >= this.scene.invulnerableUntil);
        };

        // Player collision with enemies
        if (this.scene.enemies) {
            this.scene.physics.add.overlap(
                this.scene.player,
                this.scene.enemies,
                (player, enemy) => {
                    if (!player.isInvulnerable) {
                        // Handle Zapper shock damage
                        if (enemy.isAttacking) {
                            player.takeDamage(enemy.damage);
                        } else {
                            player.takeDamage(10); // Default collision damage
                        }
                    }
                },
                null,
                this
            );
        }

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

    setupTileCollisions(map, layer) {
        if (!layer) return;

        // Set collision for specific tile IDs
        const COLLIDING_TILES = [257, 260, 261, 641]; 
        layer.setCollision(COLLIDING_TILES);
        
        // Add collision between player and layer
        if (this.scene.player) {
            this.scene.physics.add.collider(this.scene.player, layer);
        }
        
        // Set world bounds based on map size if map is provided
        if (map) {
            this.scene.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        }

        // Setup other tile-based collisions
        if (this.scene.mapLayer) {
            // Add collisions for enemies
            if (this.scene.slimes) {
                this.scene.physics.add.collider(this.scene.slimes, layer);
            }
            if (this.scene.drones) {
                this.scene.physics.add.collider(this.scene.drones, layer);
            }
            if (this.scene.enemies) {
                this.scene.physics.add.collider(this.scene.enemies, layer);
            }

            // Add collisions for bullets
            if (this.scene.bullets) {
                this.scene.physics.add.collider(
                    this.scene.bullets,
                    layer,
                    this.handleBulletCollision,
                    null,
                    this
                );
            }
        }
    }

    handleBulletCollision(bullet) {
        if (this.scene.effectsManager) {
            this.scene.effectsManager.createHitEffect(bullet.x, bullet.y);
        }
        bullet.destroy();
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
