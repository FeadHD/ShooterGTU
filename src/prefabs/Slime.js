import { Enemy } from './EnemyTypes';

export class Slime extends Enemy {
    constructor(scene, x, y) {
        // Call parent constructor with minimal parameters
        super(scene, x, y, 'slime_idle', 3);
        
        // Destroy the rectangle sprite created by parent
        if (this.sprite) {
            this.sprite.destroy();
        }
        
        // Create slime sprite
        this.sprite = scene.physics.add.sprite(x, y, 'slime_idle', 0);
        console.log('Created slime sprite at:', x, y);

        if (this.sprite) {
            // Make sure sprite is visible and scaled appropriately
            this.sprite.setVisible(true);
            this.sprite.setActive(true);
            this.sprite.setScale(2); // Scale to 2x size
            this.sprite.setFrame(0);
            
            // Set up physics with rectangular hitbox for better collisions
            this.sprite.body.setSize(28, 22); // Make hitbox more square
            this.sprite.body.setOffset(2, 2); // Center the hitbox
            this.sprite.body.setGravityY(1000);
            this.sprite.body.setCollideWorldBounds(true);
            this.sprite.body.setBounce(0.2); // Reduced bounce for more stable movement
            this.sprite.body.setFriction(1);
            this.sprite.body.setDragX(200); // Increased drag for better control
            this.sprite.body.setMaxVelocity(300, 1000); // Limit maximum velocity
            this.sprite.body.setImmovable(false);
            this.sprite.body.setAllowGravity(true);
            this.sprite.body.moves = true;
            this.sprite.body.enable = true;

            // Add these new properties for better tile collision
            this.sprite.body.pushable = false; // Prevents being pushed by other physics bodies
            this.sprite.body.setMass(1); // Consistent mass for collision calculations
            
            // Ensure solid collision with tiles
            this.sprite.body.checkCollision.up = true;
            this.sprite.body.checkCollision.down = true;
            this.sprite.body.checkCollision.left = true;
            this.sprite.body.checkCollision.right = true;

            // Position slime on top of the ground
            this.sprite.y = y;
            this.sprite.body.reset(x, y);
            
            // Store reference to this enemy instance on the sprite
            this.sprite.enemy = this;

            // Set movement properties
            this.jumpForce = -350; 
            this.jumpChance = 0.015; 
            this.lastJumpTime = 0;
            this.jumpCooldown = 1500; 
            this.horizontalJumpForce = 150; 

            // Slime enemy class implementation
            this.health = 3;
            this.maxHealth = 3;
            this.moveSpeed = 80; 
            this.damageAmount = 20;
            this.scoreValue = 10;
            
            // Add player tracking properties
            this.detectionRange = 800; 
            this.aggroRange = 200; 
            
            // Add invincibility flag
            this.isInvincible = false;
            this.isDying = false;
            this.direction = Math.random() < 0.5 ? -1 : 1; 
        }
    }

    createHealthBar() {
        const width = 32;
        const height = 4;
        const padding = 2;
        const y = -20; 

        // Create background bar
        this.healthBarBackground = this.scene.add.rectangle(
            0,
            y,
            width + padding * 2,
            height + padding * 2,
            0x000000
        );
        this.healthBarBackground.setDepth(1);
        this.healthBarBackground.setOrigin(0.5, 0.5);
        
        // Create health bar
        this.healthBar = this.scene.add.rectangle(
            0,
            y,
            width,
            height,
            0xff0000
        );
        this.healthBar.setDepth(1);
        this.healthBar.setOrigin(0.5, 0.5);

        // Make health bars ignore physics
        if (this.healthBarBackground.body) {
            this.healthBarBackground.body.enable = false;
        }
        if (this.healthBar.body) {
            this.healthBar.body.enable = false;
        }
    }

    updateHealthBar() {
        if (this.healthBar && this.sprite) {
            // Update position to follow slime
            const healthBarY = this.sprite.y - 20;
            this.healthBarBackground.setPosition(this.sprite.x, healthBarY);
            this.healthBar.setPosition(this.sprite.x, healthBarY);

            // Update health bar width based on current health
            const width = 32;
            const healthPercentage = this.health / this.maxHealth;
            this.healthBar.width = width * healthPercentage;
        }
    }

    createAnimations() {
        // Remove existing animations if they exist
        ['idle', 'jump', 'death'].forEach(anim => {
            const key = `slime_${anim}`;
            if (this.scene.anims.exists(key)) {
                this.scene.anims.remove(key);
            }
        });

        // Create the idle animation
        this.scene.anims.create({
            key: 'slime_idle',
            frames: this.scene.anims.generateFrameNumbers('slime_idle', {
                start: 0,
                end: 3
            }),
            frameRate: 8,
            repeat: -1
        });

        // Create the jump animation
        this.scene.anims.create({
            key: 'slime_jump',
            frames: this.scene.anims.generateFrameNumbers('slime_jump', {
                start: 0,
                end: 3
            }),
            frameRate: 8,
            repeat: -1
        });

        // Create the death animation
        this.createDeathAnimation();
    }

    createDeathAnimation() {
        // Create the death animation if it doesn't exist
        if (!this.scene.anims.exists('slime_death')) {
            this.scene.anims.create({
                key: 'slime_death',
                frames: this.scene.anims.generateFrameNumbers('slime_death', {
                    start: 0,
                    end: 4
                }),
                frameRate: 10,
                repeat: 0
            });
        }
    }

    playAnimation(type) {
        if (!this.sprite || !this.scene) return;

        const animKey = `slime_${type}`;
        if (this.scene.anims.exists(animKey)) {
            // For death animation, make sure we're using the right texture
            if (type === 'death') {
                this.sprite.setTexture('slime_death', 0);
            }
            this.sprite.play(animKey, true);
        } else if (type === 'death') {
            // If death animation doesn't exist, create it
            this.createDeathAnimation();
            this.sprite.setTexture('slime_death', 0);
            this.sprite.play('slime_death', true);
        }
    }

    initializeMovement() {
        if (this.sprite && this.sprite.body) {
            // Set initial velocity
            this.sprite.setVelocityX(this.moveSpeed * this.direction);
            
            // Create animations if they don't exist
            this.createAnimations();
            
            // Start playing idle animation
            this.playAnimation('idle');
            
            // Change direction when hitting world bounds
            this.sprite.body.onWorldBounds = true;
            this.worldBoundsListener = this.onWorldBounds.bind(this);
            this.sprite.body.world.on('worldbounds', this.worldBoundsListener, this);
        }
    }

    onWorldBounds(body) {
        if (!this.sprite || !this.sprite.body) return;
        if (body.gameObject === this.sprite) {
            // Reverse direction
            this.reverseDirection();
        }
    }

    reverseDirection() {
        this.direction *= -1;
        this.sprite.setVelocityX(this.moveSpeed * this.direction);
        this.sprite.flipX = this.direction < 0;
    }

    damage(amount) {
        if (this.health <= 0 || this.isInvincible) return false; // Already dead or invincible
        
        this.health -= amount;
        this.updateHealthBar();
        
        // Flash the enemy and make temporarily invincible
        if (this.sprite && this.sprite.active) {
            this.isInvincible = true;
            this.sprite.setAlpha(0.5);
            setTimeout(() => {
                if (this.sprite && this.sprite.active) {
                    this.sprite.setAlpha(1);
                    this.isInvincible = false;
                }
            }, 100);
        }

        // Check if dead
        if (this.health <= 0) {
            this.health = 0; // Ensure health doesn't go negative
            this.isInvincible = true; // Stay invincible while dying
            this.isDying = true; // Set dying flag
            
            // Hide health bars immediately
            if (this.healthBar) {
                this.healthBar.setVisible(false);
            }
            if (this.healthBarBackground) {
                this.healthBarBackground.setVisible(false);
            }
            
            // Enable physics for falling
            if (this.sprite && this.sprite.body) {
                this.sprite.body.enable = true;
                this.sprite.body.allowGravity = true;
                this.sprite.body.checkCollision.none = false;
                this.sprite.body.setVelocityX(0);
                
                // Create a timer to check for ground collision
                let groundCheckTimer = this.scene.time.addEvent({
                    delay: 10,
                    callback: () => {
                        if (this.sprite && this.sprite.body && this.sprite.body.onFloor()) {
                            // Stop the timer
                            groundCheckTimer.destroy();
                            
                            // Once on the ground, disable physics and play death animation
                            this.sprite.body.enable = false;
                            
                            // Make sure death animation exists and play it
                            const deathAnim = 'slime_death';
                            if (!this.scene.anims.exists(deathAnim)) {
                                this.createDeathAnimation();
                            }
                            
                            // Set texture and play animation
                            this.sprite.setTexture('slime_death', 0);
                            this.sprite.play(deathAnim);
                            
                            // Listen for animation completion
                            this.sprite.on('animationcomplete', (animation) => {
                                if (animation.key === deathAnim) {
                                    this.destroy();
                                }
                            });
                        }
                    },
                    callbackScope: this,
                    loop: true
                });
            } else {
                // If no sprite or scene, destroy immediately
                this.destroy();
            }
            
            return true;
        }
        return false;
    }

    destroy() {
        // Remove world bounds listener
        if (this.sprite && this.sprite.body && this.sprite.body.world) {
            this.sprite.body.world.off('worldbounds', this.worldBoundsListener, this);
        }

        // Destroy sprite and health bars
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
        if (this.healthBar) {
            this.healthBar.destroy();
            this.healthBar = null;
        }
        if (this.healthBarBackground) {
            this.healthBarBackground.destroy();
            this.healthBarBackground = null;
        }
    }

    die() {
        if (!this.sprite || this.isDying) {
            console.log('Die called but sprite missing or already dying');
            return;
        }
        
        console.log('Starting death sequence');
        this.isDying = true;
        
        // Completely stop all movement and physics
        this.sprite.setVelocity(0, 0);
        this.sprite.body.allowGravity = false;
        this.sprite.body.enable = false;
        this.sprite.body.moves = false;  
        this.moveSpeed = 0;  
        
        // Remove world bounds collision
        this.sprite.body.onWorldBounds = false;
        if (this.sprite.body.world) {
            this.sprite.body.world.off('worldbounds', this.worldBoundsListener, this);
        }
        
        // Destroy health bar
        if (this.healthBar) this.healthBar.destroy();
        if (this.healthBarBackground) this.healthBarBackground.destroy();

        // Play death animation
        this.playAnimation('death');
        
        // Listen for animation complete
        this.sprite.on('animationcomplete', (animation) => {
            if (animation.key === 'slime_death') {
                // Add a small fade out effect
                this.scene.tweens.add({
                    targets: this.sprite,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => {
                        // Clean up after fade
                        this.destroy();
                    }
                });
            }
        });
    }

    update() {
        if (!this.sprite || !this.sprite.body || !this.sprite.active) return;

        const currentTime = this.scene.time.now;

        // Basic movement
        if (this.sprite.body.onFloor()) {
            // Ensure slime is moving in its direction
            if (Math.abs(this.sprite.body.velocity.x) < this.moveSpeed) {
                this.sprite.setVelocityX(this.moveSpeed * this.direction);
            }
            
            // Update sprite flip based on direction
            this.sprite.flipX = this.direction < 0;
            
            // Random chance to jump when on floor
            if (Math.random() < this.jumpChance && 
                currentTime - this.lastJumpTime >= this.jumpCooldown) {
                this.jump();
            }
        }

        // Track player if available
        if (this.scene.player && this.scene.player.sprite) {
            const player = this.scene.player.sprite;
            const distanceToPlayer = Phaser.Math.Distance.Between(
                this.sprite.x,
                this.sprite.y,
                player.x,
                player.y
            );

            // If player is within detection range
            if (distanceToPlayer <= this.detectionRange) {
                // Move towards player
                this.direction = player.x < this.sprite.x ? -1 : 1;
                this.sprite.setVelocityX(this.moveSpeed * this.direction);
                this.sprite.flipX = this.direction < 0;

                // Handle jumping
                if (this.sprite.body.onFloor()) {
                    if (distanceToPlayer <= this.aggroRange) {
                        // More aggressive jumping when close to player
                        if (Math.random() < this.jumpChance * 3 && 
                            currentTime - this.lastJumpTime >= this.jumpCooldown) {
                            this.jumpTowardsPlayer(player);
                        }
                    }
                }
            }
        }

        // Check if slime hits world bounds and reverse direction
        if (this.sprite.body.blocked.left || this.sprite.body.blocked.right) {
            this.direction *= -1;
        }

        // Update health bar position
        this.updateHealthBar();
    }

    jumpTowardsPlayer(player) {
        if (!this.sprite || !this.sprite.body || !this.sprite.body.onFloor()) return;

        this.lastJumpTime = this.scene.time.now;
        
        // Play jump animation
        this.playAnimation('jump');

        // Apply vertical jump force
        this.sprite.body.setVelocityY(this.jumpForce);

        // Calculate direction to player
        const direction = player.x < this.sprite.x ? -1 : 1;
        
        // Check if there's a wall in the direction we want to jump
        const tileX = Math.floor((this.sprite.x + direction * 16) / 32);
        const tileY = Math.floor(this.sprite.y / 32);
        const tile = this.scene.mapLayer.getTileAt(tileX, tileY);
        
        if (!tile || !tile.collides) {
            this.sprite.setVelocityX(direction * this.horizontalJumpForce);
            this.sprite.flipX = direction < 0;
        }
    }

    jump() {
        if (!this.sprite || !this.sprite.body || !this.sprite.body.onFloor()) return;

        // Play jump animation
        this.playAnimation('jump');

        // Apply vertical jump force
        this.sprite.body.setVelocityY(this.jumpForce);

        // Apply horizontal force in random direction
        const direction = Math.random() < 0.5 ? -1 : 1;
        
        // Check if there's a wall in the direction we want to jump
        const tileX = Math.floor((this.sprite.x + direction * 16) / 32);
        const tileY = Math.floor(this.sprite.y / 32);
        const tile = this.scene.mapLayer.getTileAt(tileX, tileY);
        
        if (!tile || !tile.collides) {
            this.sprite.setVelocityX(direction * this.horizontalJumpForce);
            this.sprite.flipX = direction < 0;
        }
    }
}
