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
            
            // Set up physics with circular hitbox
            this.sprite.body.setCircle(8); // Radius of 8 pixels (16x16 circle)
            this.sprite.body.setOffset(8, 8); // Center the hitbox
            this.sprite.body.setGravityY(1000); // Set gravity to 1000
            this.sprite.body.setCollideWorldBounds(true);
            this.sprite.body.setBounce(0.3); // Add some bounce for hopping effect
            this.sprite.body.setFriction(1);
            this.sprite.body.setDragX(100); // Increased drag to stop faster
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

            // Debug flag for death
            this.isDying = false;
        }

        // Set movement properties
        this.jumpForce = -400;
        this.jumpChance = 0.02; // Increased jump chance
        this.lastJumpTime = 0;
        this.jumpCooldown = 1000; // 1 second cooldown between jumps
        this.horizontalJumpForce = 200; // Increased horizontal force for bigger jumps

        // Slime enemy class implementation
        this.scene = scene;
        this.health = 3; // Reduced health to make it easier to kill
        this.maxHealth = 3;
        this.moveSpeed = 100;
        this.damageAmount = 20; // Renamed from damage to avoid confusion
        this.scoreValue = 50;

        // Add custom properties to the sprite
        this.sprite.enemy = this;
        this.sprite.setCollideWorldBounds(true);
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
        this.scene.anims.create({
            key: 'slime_death',
            frames: this.scene.anims.generateFrameNumbers('slime_death', {
                start: 0,
                end: 5  // Increased to include all frames
            }),
            frameRate: 10,  // Slightly faster animation
            repeat: 0,  // Play once
            hideOnComplete: true  // Hide the sprite when animation completes
        });

        console.log('Created animations:', 
            this.scene.anims.exists('slime_idle'),
            this.scene.anims.exists('slime_jump'),
            this.scene.anims.exists('slime_death')
        );
    }

    playAnimation(type) {
        try {
            if (!this.sprite || !this.scene) return;

            const animKey = `slime_${type}`;
            
            // Only play if animation exists and is different from current
            if (this.scene.anims.exists(animKey)) {
                if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim.key !== animKey) {
                    if (type === 'death') {
                        // For death animation, set texture first
                        this.sprite.setTexture('slime_death');
                    }
                    this.sprite.play(animKey, true);
                }
            } else {
                console.warn(`Animation ${animKey} does not exist`);
            }
        } catch (error) {
            console.warn('Animation error:', error);
        }
    }

    initializeMovement() {
        // Basic horizontal movement
        this.sprite.setVelocityX(this.moveSpeed);
        
        // Change direction when hitting world bounds
        this.sprite.body.onWorldBounds = true;
        this.sprite.body.world.on('worldbounds', this.onWorldBounds, this);
    }

    onWorldBounds() {
        // Reverse direction when hitting world bounds
        this.moveSpeed = -this.moveSpeed;
        this.sprite.setVelocityX(this.moveSpeed);
        // Flip the sprite based on direction
        this.sprite.flipX = this.moveSpeed > 0;
    }

    damage(amount) {
        if (this.isDying) return;

        this.health -= amount;
        console.log(`Slime took ${amount} damage. Health: ${this.health}`);
        
        // Update health bar
        this.updateHealthBar();

        // Check if slime should die
        if (this.health <= 0) {
            console.log('Health <= 0, triggering death');
            this.health = 0;
            this.die();
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
            this.sprite.body.world.off('worldbounds', this.onWorldBounds, this);
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

    destroy() {
        console.log('Destroying slime');
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
