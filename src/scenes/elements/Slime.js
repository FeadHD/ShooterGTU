import { Enemy } from './EnemyTypes';

export class Slime extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'slime_idle', 1);

        // Replace rectangle with sprite
        if (this.sprite) {
            this.sprite.destroy();
        }
        
        // Create new sprite
        this.sprite = scene.physics.add.sprite(x, y, 'slime_idle', 0);
        console.log('Created slime sprite at:', x, y);

        if (this.sprite) {
            // Make sure sprite is visible and scaled appropriately
            this.sprite.setVisible(true);
            this.sprite.setActive(true);
            this.sprite.setScale(2); // Scale to 2x size
            this.sprite.setFrame(0);
            
            // Set up physics with rectangular hitbox for better collisions
            this.sprite.body.setSize(14, 14); // Slightly smaller than sprite
            this.sprite.body.setOffset(9, 9); // Center the hitbox
            this.sprite.body.setGravityY(1000);
            this.sprite.body.setCollideWorldBounds(true);
            this.sprite.body.setBounce(0.2); // Reduced bounce for more stable movement
            this.sprite.body.setFriction(1);
            this.sprite.body.setDragX(200); // Increased drag for better control
            this.sprite.body.setMaxVelocity(300, 1000); // Limit maximum velocity
            this.sprite.body.setImmovable(false);
            this.sprite.body.setAllowGravity(true);
            this.sprite.body.moves = true;

            // Position slime on top of the ground (2 pixels lower)
            const spawnY = scene.getSpawnHeight() + 2;
            this.sprite.y = spawnY;

            // Clean up any existing health bars
            if (this.healthBar) this.healthBar.destroy();
            if (this.healthBarBackground) this.healthBarBackground.destroy();
            
            // Create health bar
            this.createHealthBar();
            
            // Create animations
            this.createAnimations();
            
            // Start playing idle animation
            this.playAnimation('idle');
            
            // Initialize movement
            this.initializeMovement();

            // Store reference to this enemy instance on the sprite
            this.sprite.enemy = this;
        }

        // Set movement properties
        this.jumpForce = -350; // Reduced jump force
        this.jumpChance = 0.015; // Reduced jump chance
        this.lastJumpTime = 0;
        this.jumpCooldown = 1500; // Increased cooldown between jumps
        this.horizontalJumpForce = 150; // Reduced horizontal force

        // Slime enemy class implementation
        this.scene = scene;
        this.health = 3;
        this.maxHealth = 3;
        this.moveSpeed = 80; // Slightly reduced speed
        this.damageAmount = 20;
        this.scoreValue = 10;
        
        // Add invincibility flag
        this.isInvincible = false;
        this.isDying = false;
        this.direction = 1; // 1 for right, -1 for left
    }

    createHealthBar() {
        // Destroy existing health bars if they exist
        if (this.healthBar) this.healthBar.destroy();
        if (this.healthBarBackground) this.healthBarBackground.destroy();

        // Create health bar background
        this.healthBarBackground = this.scene.add.rectangle(
            this.sprite.x,
            this.sprite.y - 30,
            50,
            5,
            0xff0000
        );

        // Create health bar foreground
        this.healthBar = this.scene.add.rectangle(
            this.sprite.x,
            this.sprite.y - 30,
            50,
            5,
            0x00ff00
        );

        // Set the origin to match the sprite
        this.healthBarBackground.setOrigin(0.5, 0.5);
        this.healthBar.setOrigin(0.5, 0.5);

        // Set depth to ensure health bars are always visible
        this.healthBarBackground.setDepth(1);
        this.healthBar.setDepth(1);
    }

    updateHealthBar() {
        if (!this.sprite || !this.healthBar || !this.healthBarBackground) return;

        // Update health bar position
        const barY = this.sprite.y - 30;
        this.healthBarBackground.setPosition(this.sprite.x, barY);
        this.healthBar.setPosition(this.sprite.x, barY);

        // Update health bar width based on current health
        const healthPercent = Math.max(0, this.health) / this.maxHealth;
        this.healthBar.width = 50 * healthPercent;
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
                    end: 5
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
        // Basic horizontal movement
        this.sprite.setVelocityX(this.moveSpeed * this.direction);
        
        // Change direction when hitting world bounds
        this.sprite.body.onWorldBounds = true;
        this.worldBoundsListener = this.onWorldBounds.bind(this);
        this.sprite.body.world.on('worldbounds', this.worldBoundsListener, this);
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
        this.sprite.body.moves = false;  // Prevent any further movement
        this.moveSpeed = 0;  // Stop horizontal movement
        
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
        if (this.isDying) return;  // Skip all updates if dying

        if (!this.sprite || !this.sprite.body) return;

        const currentTime = this.scene.time.now;

        // Update health bar position
        if (this.healthBar && this.healthBarBackground) {
            this.healthBar.x = this.sprite.x;
            this.healthBar.y = this.sprite.y - 30;
            this.healthBarBackground.x = this.sprite.x;
            this.healthBarBackground.y = this.sprite.y - 30;
        }

        // Handle movement only if not dying
        if (this.sprite.body.onFloor()) {
            // Random chance to jump when on floor
            if (Math.random() < this.jumpChance) {
                this.jump();
            }
        }
    }

    jump() {
        if (!this.sprite || !this.sprite.body) return;

        // Play jump animation
        this.playAnimation('jump');

        // Apply vertical jump force
        this.sprite.body.setVelocityY(this.jumpForce);

        // Apply horizontal force in random direction
        const direction = Math.random() < 0.5 ? -1 : 1;
        this.sprite.body.setVelocityX(direction * this.horizontalJumpForce);
    }
}
