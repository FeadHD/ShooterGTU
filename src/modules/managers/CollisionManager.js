/**
 * CollisionManager.js
 * Centralized collision handling system for game physics
 * Manages player, enemy, bullet, and environment interactions
 * Handles damage calculations, effects, and event dispatching
 */

export class CollisionManager {
    constructor(scene) {
        // Store the scene reference for accessing game objects (e.g. enemies, bullets, player, etc.)
        this.scene = scene;
        
        // Keep track of which Zappers we've set up collisions for
        this._processedZappers = new Set();
        
        // Add update event to continuously check for new enemies
        this.scene.events.on('update', this.checkNewEnemies, this);
    }

    /**
     * ============================
     * MASTER COLLISION SETUP
     * ============================
     * Main entry point to set up collisions in this scene.
     * Calls sub-methods for tile, enemy, bullet, and player collisions.
     */
    setupCollisions() {
        this.setupTileCollisions();
        this.setupEnemyCollisions();
        this.setupBulletCollisions();
        this.setupPlayerCollisions();
    }

    /**
     * ============================
     * ENEMY COLLISIONS
     * ============================
     * Sets up collisions involving enemy objects (like slimes, drones, etc.).
     */
    setupEnemyCollisions() {
        // If we have a group of slimes, we make them collide with themselves
        if (this.scene.slimes) {
            this.scene.physics.add.collider(
                this.scene.slimes,
                this.scene.slimes,
                this.handleEnemyCollision,
                null,
                this.scene
            );
        }

        // If we have layers (like mapLayer/platforms), let enemies collide with them
        if (this.scene.mapLayer) {
            if (this.scene.slimes) {
                this.scene.physics.add.collider(this.scene.slimes, this.scene.mapLayer);
                this.scene.physics.add.collider(this.scene.slimes, this.scene.platforms);
            }
            if (this.scene.drones) {
                this.scene.physics.add.collider(this.scene.drones, this.scene.mapLayer);
                this.scene.physics.add.collider(this.scene.drones, this.scene.platforms);
            }

            // Additional collisions for a generic 'enemies' group
            if (this.scene.enemies) {
                this.scene.physics.add.collider(this.scene.enemies, this.scene.groundLayer);
                this.scene.physics.add.collider(this.scene.enemies, this.scene.platformLayer);
            }
        }
    }

    /**
     * ============================
     * BULLET COLLISIONS
     * ============================
     * Sets up overlap/collision checks involving bullets vs. enemies, platforms, etc.
     */
    setupBulletCollisions() {
        // Make sure we have bullets before setting up any collisions
        // We check either scene.bullets or a bullet manager's group
        if (!this.scene.bullets && !this.scene.managers.bullets?.getGroup()) return;

        // Get the bullet group either directly or from the bullet manager
        const bulletGroup = this.scene.bullets || this.scene.managers.bullets.getGroup();
        if (!bulletGroup) return;

        // 1) Bullet vs Enemies overlap
        if (this.scene.enemies) {
            this.scene.physics.add.overlap(
                bulletGroup,
                this.scene.enemies,
                (bullet, enemySprite) => {
                    // Example: if we have an enemyManager that handles bullet hits
                    if (this.scene.enemyManager) {
                        this.scene.enemyManager.handleBulletHit(bullet, enemySprite);
                    }
                },
                null,
                this
            );
        }

        // 2) Bullet collisions with platforms
        if (this.scene.platforms) {
            this.scene.physics.add.collider(
                bulletGroup,
                this.scene.platforms,
                this.handleBulletCollision,
                null,
                this
            );
        }

        // Overlaps with slimes
        if (this.scene.slimes) {
            this.scene.physics.add.overlap(
                bulletGroup,
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

        // Overlaps with drones
        if (this.scene.drones) {
            this.scene.physics.add.overlap(
                bulletGroup,
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

        // Overlaps with meleeWarriors
        if (this.scene.meleeWarriors) {
            this.scene.physics.add.overlap(
                bulletGroup,
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

    /**
     * Example method extracted from BaseScene for bullet vs. enemy overlap logic.
     * If you prefer not to use arrow functions above, you can call this method instead.
     */
    hitEnemyWithBullet(bullet, enemySprite) {
        if (this.scene.enemies) {
            this.scene.enemies.handleBulletHit(bullet, enemySprite);
        }
    }

    /**
     * ============================
     * PLAYER COLLISIONS
     * ============================
     * Sets up overlap/collision checks for player vs. enemies, layers, ramps, etc.
     */
    setupPlayerCollisions() {
        // Make sure our player actually exists
        if (!this.scene.player) return;

        // Basic collisions with ground and platform layers
        if (this.scene.groundLayer) {
            this.scene.physics.add.collider(this.scene.player, this.scene.groundLayer);
        }
        if (this.scene.platformLayer) {
            this.scene.physics.add.collider(this.scene.player, this.scene.platformLayer);
        }
        if (this.scene.mapLayer) {
            this.scene.physics.add.collider(this.scene.player, this.scene.mapLayer);
        }
        if (this.scene.platforms) {
            this.scene.physics.add.collider(this.scene.player, this.scene.platforms);
        }
        if (this.scene.ramp) {
            this.scene.physics.add.collider(this.scene.player, this.scene.ramp);
        }

        // Overlap checks for damage calculations, etc.
        // Player vs. generic enemies group
        if (this.scene.enemies) {
            this.scene.physics.add.overlap(
                this.scene.player,
                this.scene.enemies,
                (player, enemy) => {
                    // Example: If the enemy is attacking, do more damage
                    if (!player.isInvulnerable) {
                        if (enemy.isAttacking) {
                            player.takeDamage(enemy.damage);
                        } else {
                            player.takeDamage(10);
                        }
                    }
                },
                null,
                this
            );
        }

        // Player vs. slimes
        if (this.scene.slimes) {
            this.scene.physics.add.overlap(
                this.scene.player,
                this.scene.slimes,
                this.handlePlayerEnemyOverlap, // We'll define this method below
                null,
                this
            );
        }

        // Player vs. drones
        if (this.scene.drones) {
            this.scene.physics.add.overlap(
                this.scene.player,
                this.scene.drones,
                this.handlePlayerEnemyOverlap,
                null,
                this
            );
        }

        // (Feel free to add more for other enemy groups, e.g., meleeWarriors, etc.)
    }

    /**
     * ============================
     * handlePlayerEnemyOverlap
     * ============================
     * This method replaces "hitEnemy()" from BaseScene.
     * It's called when the player overlaps with an enemy (like slimes, drones).
     * We reference scene data (gameState, gameUI) via "this.scene".
     */
    handlePlayerEnemyOverlap(player, enemy) {
        // If the player is already dying, skip
        if (player.isDying) {
            return;
        }
    
        // Calculate how much damage to inflict
        const damage = enemy.enemy ? enemy.enemy.damageAmount : 25;
    
        // Just call player.takeDamage(...)
        player.takeDamage(damage);
    }

    /**
     * ============================
     * CHECK NEW ENEMIES
     * ============================
     * Continuously checks for new enemies and sets up their collisions
     */
    checkNewEnemies() {
        if (!this.scene.player || !this.scene.enemies) return;

        // Check for new Zappers
        this.scene.enemies.getChildren().forEach(enemy => {
            if (enemy.type === 'Zapper' && enemy.shockSprite && !this._processedZappers.has(enemy)) {
                // Set up collision between player and shock sprite
                this.scene.physics.add.overlap(
                    this.scene.player,
                    enemy.shockSprite,
                    () => {
                        if (enemy.shockSprite.visible && !this.scene.player.isInvulnerable) {
                            this.scene.player.takeDamage(enemy.damage);
                        }
                    }
                );
                
                // Remember we've processed this Zapper
                this._processedZappers.add(enemy);
            }
        });
    }

    /**
     * ============================
     * TILE COLLISIONS
     * ============================
     * Sets up collisions with tile layers, e.g., map or platforms.
     */
    setupTileCollisions(map, layer) {
        if (!layer) return;

        // Example: define colliding tile IDs
        const COLLIDING_TILES = [257, 260, 261, 641];
        layer.setCollision(COLLIDING_TILES);

        // Player vs. the specified layer
        if (this.scene.player) {
            this.scene.physics.add.collider(this.scene.player, layer);
        }

        // Optionally set world bounds from map dimension
        if (map) {
            this.scene.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        }

        // Additional tile collisions with enemies or bullets
        if (this.scene.mapLayer) {
            if (this.scene.slimes) {
                this.scene.physics.add.collider(this.scene.slimes, layer);
            }
            if (this.scene.drones) {
                this.scene.physics.add.collider(this.scene.drones, layer);
            }
            if (this.scene.enemies) {
                this.scene.physics.add.collider(this.scene.enemies, layer);
            }
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

    /**
     * Called when a bullet collides with a tile layer (e.g., a wall or platform).
     * We create a hit effect (if possible) and destroy the bullet.
     */
    handleBulletCollision(bullet) {
        if (this.scene.effectsManager) {
            this.scene.effectsManager.createHitEffect(bullet.x, bullet.y);
        }
        bullet.destroy();
    }

    /**
     * Called when two enemies collide with each other (e.g., slimes).
     * Reverses direction or bounces them off one another.
     */
    handleEnemyCollision(enemy1, enemy2) {
        // If enemies are moving towards each other, reverse direction
        if (
            (enemy1.body.velocity.x > 0 && enemy2.body.velocity.x < 0) ||
            (enemy1.body.velocity.x < 0 && enemy2.body.velocity.x > 0)
        ) {
            if (enemy1.enemy) {
                enemy1.enemy.reverseDirection();
                enemy1.setVelocityY(-150);
            }
            if (enemy2.enemy) {
                enemy2.enemy.reverseDirection();
                enemy2.setVelocityY(-150);
            }
        }

        // Ensure enemies bounce off each other with a push force
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
