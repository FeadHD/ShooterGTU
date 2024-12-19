export class CollisionHandler {
    constructor(scene) {
        this.scene = scene;
    }

    setupCollisions(player, enemies, weapon, buildingsLayer, ground) {
        // Player collisions
        if (buildingsLayer) {
            this.scene.physics.add.collider(player.getSprite(), buildingsLayer);
        }
        if (ground) {
            this.scene.physics.add.collider(player.getSprite(), ground);
        }

        // Enemy collisions
        if (buildingsLayer) {
            this.scene.physics.add.collider(enemies, buildingsLayer);
        }
        if (ground) {
            this.scene.physics.add.collider(enemies, ground);
        }
        this.scene.physics.add.collider(enemies, enemies);

        // Combat collisions
        this.scene.physics.add.overlap(
            player.getSprite(),
            enemies,
            this.handlePlayerEnemyCollision,
            null,
            this
        );

        this.scene.physics.add.overlap(
            weapon.getBullets(),
            enemies,
            this.handleBulletEnemyCollision,
            null,
            this
        );
    }

    handleBulletEnemyCollision(bullet, enemySprite) {
        // Deactivate the bullet
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false;
        
        // Get the enemy instance and apply damage
        const enemy = enemySprite.getData('enemyInstance');
        if (enemy) {
            const enemyDestroyed = enemy.damage(1);
            
            // Play hit sound if available
            if (this.scene.hitSound) {
                this.scene.hitSound.play();
            }

            // Award points if enemy was destroyed
            if (enemyDestroyed) {
                const currentScore = this.scene.registry.get('score') || 0;
                this.scene.registry.set('score', currentScore + 10);
                
                // Optional: Add particle effects or other visual feedback
                this.createDestroyEffect(enemySprite.x, enemySprite.y);
            }
        }
    }

    handlePlayerEnemyCollision(playerSprite, enemySprite) {
        const enemy = enemySprite.getData('enemyInstance');
        if (enemy) {
            // Check if player is falling onto enemy (stomping)
            if (playerSprite.body.velocity.y > 0 && 
                playerSprite.y < enemySprite.y - enemySprite.height/2) {
                
                if (enemy.damage(1)) {
                    // Enemy destroyed by stomp
                    if (this.scene.hitSound) {
                        this.scene.hitSound.play();
                    }
                    const currentScore = this.scene.registry.get('score') || 0;
                    this.scene.registry.set('score', currentScore + 5);
                }
                
                // Make player bounce off enemy
                playerSprite.setVelocityY(-300);
            }
            // Uncomment to enable player damage from enemy contact
            /*else {
                // Player takes damage from enemy contact
                if (this.scene.handlePlayerDeath) {
                    this.scene.handlePlayerDeath();
                }
            }*/
        }
    }

    createDestroyEffect(x, y) {
        // Create particle effect for enemy destruction
        const particles = this.scene.add.particles(x, y, 'particle', {
            speed: { min: -100, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: 500,
            quantity: 10,
            gravityY: 200
        });

        // Remove particle emitter after animation completes
        this.scene.time.delayedCall(500, () => {
            particles.destroy();
        });
    }
}
