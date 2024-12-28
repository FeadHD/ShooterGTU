import Enemy from './Enemy';

class MeleeWarrior extends Enemy {
    constructor(scene, x, y, config = {}) {
        super(scene, x, y, {
            ...config,
            spriteKey: 'enemymeleewarrior_IDLE',  // Updated to match uppercase filename
            maxHealth: 3, // Set to match slime's health
            damage: config.damage || 30,
            type: 'ground'
        });

        // Initialize health
        this.health = 3;
        this.maxHealth = 3;

        // Movement properties
        this.speed = config.speed || 150;
        this.detectionRange = config.detectionRange || 300;
        this.attackRange = config.attackRange || 50;
        this.attackCooldown = config.attackCooldown || 1000; // 1 second
        this.lastAttackTime = 0;
        this.isAttacking = false;
        this.direction = 1; // 1 for right, -1 for left

        // Adjust sprite size and physics body
        if (this.sprite) {
            // Calculate scale to make height 128px (doubled from 64px)
            const targetHeight = 128;
            const scale = targetHeight / this.sprite.height;
            const scaledWidth = this.sprite.width * scale;
            
            // Set display size maintaining aspect ratio
            this.sprite.setDisplaySize(scaledWidth, targetHeight);
            
            // Enable physics and set up collision body
            this.sprite.body.setCollideWorldBounds(true);
            this.sprite.body.setBounce(0.2);
            this.sprite.body.setDrag(200);
            
            // Set collision box to be 32x32 while keeping sprite size large
            this.sprite.body.setSize(32, 32); // Height reduced to 32px
            
            // Position the hitbox with specific offsets:
            // - 32px from the left
            // - 28px from top (4px higher than before)
            const offsetX = 32;
            const offsetY = 28; // Moved up by 4px from previous position
            this.sprite.body.setOffset(offsetX, offsetY);
            
            // Add to enemies group if it exists
            if (this.scene.enemies) {
                this.scene.enemies.add(this.sprite);
            }
            
            // Set data for debug display
            this.sprite.setData('type', 'warrior');
            this.sprite.setData('health', this.health);
            this.sprite.setData('maxHealth', this.maxHealth);
            this.sprite.setData('speed', this.speed);
            this.sprite.setData('detectionRange', this.detectionRange);
            this.sprite.setData('attackRange', this.attackRange);
            this.sprite.setData('isAttacking', this.isAttacking);
            this.sprite.setData('warrior', this);  // Store reference to this warrior

            // Start playing idle animation
            this.sprite.play('enemymeleewarrior-idle');
        }
    }

    update() {
        if (!this.sprite || !this.sprite.active) return;

        // Update sprite data for debug display
        this.sprite.setData('health', this.health);
        this.sprite.setData('maxHealth', this.maxHealth);
        this.sprite.setData('speed', Math.abs(this.sprite.body.velocity.x));
        this.sprite.setData('state', this.isAttacking ? 'Attack' : (Math.abs(this.sprite.body.velocity.x) > 0 ? 'Run' : 'Idle'));

        // Get player reference
        const player = this.scene.player;
        if (!player || !player.active) return;

        // Calculate distance to player
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x,
            this.sprite.y,
            player.x,
            player.y
        );

        // Check if player is within detection range
        if (distanceToPlayer <= this.detectionRange) {
            // Move towards player if not in attack range
            if (distanceToPlayer > this.attackRange && !this.isAttacking) {
                // Calculate direction to player
                const angle = Phaser.Math.Angle.Between(
                    this.sprite.x,
                    this.sprite.y,
                    player.x,
                    player.y
                );

                // Set velocity based on angle
                this.sprite.setVelocityX(Math.cos(angle) * this.speed);
                
                // Update sprite direction
                this.direction = this.sprite.x < player.x ? 1 : -1;
                this.sprite.setFlipX(this.direction === -1);

                // Play run animation
                if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim.key !== 'enemymeleewarrior-run') {
                    this.sprite.play('enemymeleewarrior-run');
                }
            } else {
                // Stop moving when in attack range or attacking
                this.sprite.setVelocityX(0);

                // Attack if cooldown is over and not already attacking
                const currentTime = this.scene.time.now;
                if (!this.isAttacking && currentTime - this.lastAttackTime >= this.attackCooldown) {
                    this.attack();
                    this.lastAttackTime = currentTime;
                }
            }
        } else {
            // Return to idle state when player is out of range
            this.sprite.setVelocityX(0);
            if (!this.isAttacking && (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim.key !== 'enemymeleewarrior-idle')) {
                this.sprite.play('enemymeleewarrior-idle');
            }
        }
    }

    attack() {
        if (!this.sprite || this.isAttacking) return;

        this.isAttacking = true;
        
        // Play attack animation
        this.sprite.play('enemymeleewarrior-attack');
        
        // Deal damage to player if in range
        const player = this.scene.player;
        if (player && Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, player.x, player.y) <= this.attackRange) {
            player.takeDamage(this.damage);
        }

        // Reset attack state after animation
        this.sprite.once('animationcomplete', () => {
            this.isAttacking = false;
            this.sprite.play('enemymeleewarrior-idle');
        });
    }

    die() {
        if (!this.isAlive) return;
        
        this.isAlive = false;
        this.sprite.play('enemymeleewarrior-death');
        
        // Remove physics and interactivity but keep sprite for death animation
        if (this.sprite.body) {
            this.sprite.body.enable = false;
        }
        
        // Destroy after death animation completes
        this.sprite.once('animationcomplete', () => {
            super.die();
        });
    }

    takeDamage(amount) {
        if (!this.isAlive) return;

        super.takeDamage(amount);
        
        // Flash red when taking damage
        if (this.sprite) {
            this.scene.tweens.add({
                targets: this.sprite,
                tint: 0xff0000,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.sprite.setTint(0xffffff);
                }
            });
        }
    }
}

export default MeleeWarrior;
