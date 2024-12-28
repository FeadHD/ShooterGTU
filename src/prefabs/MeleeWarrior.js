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

    update(time, delta) {
        if (!this.sprite || !this.sprite.active) return;

        // Update debug data
        this.sprite.setData('health', this.health);
        this.sprite.setData('isAttacking', this.isAttacking);
        this.sprite.setData('direction', this.direction);

        super.update(time, delta);

        if (!this.isAlive || this.isAttacking) return;

        // Get player reference
        const player = this.scene.player;
        if (!player) return;

        // Calculate distance to player
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player.x, player.y
        );

        // Update direction based on player position
        this.direction = player.x > this.sprite.x ? 1 : -1;
        this.sprite.setFlipX(this.direction === -1);

        if (distanceToPlayer <= this.attackRange && time > this.lastAttackTime + this.attackCooldown) {
            // Attack if in range and cooldown is over
            this.attack(player);
        } else if (distanceToPlayer <= this.detectionRange) {
            // Move towards player if within detection range
            const angle = Phaser.Math.Angle.Between(
                this.sprite.x, this.sprite.y,
                player.x, player.y
            );
            
            const velocityX = Math.cos(angle) * this.speed;
            const velocityY = Math.sin(angle) * this.speed;
            
            this.sprite.setVelocity(velocityX, velocityY);
            
            // Try to play walk animation
            try {
                if (this.sprite.anims && (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim.key !== 'enemymeleewarrior-walk')) {
                    const walkAnim = this.scene.anims.get('enemymeleewarrior-walk');
                    if (walkAnim) {
                        this.sprite.play('enemymeleewarrior-walk');
                    }
                }
            } catch (error) {
                console.warn('Error playing walk animation:', error);
            }
        } else {
            // Stop and try to play idle animation
            this.sprite.setVelocity(0, 0);
            try {
                if (this.sprite.anims && (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim.key !== 'enemymeleewarrior-idle')) {
                    const idleAnim = this.scene.anims.get('enemymeleewarrior-idle');
                    if (idleAnim) {
                        this.sprite.play('enemymeleewarrior-idle');
                    }
                }
            } catch (error) {
                console.warn('Error playing idle animation:', error);
            }
        }
    }

    attack(target) {
        if (!this.isAlive || this.isAttacking) return;

        this.isAttacking = true;
        this.lastAttackTime = this.scene.time.now;
        
        // Stop movement during attack
        this.sprite.setVelocity(0, 0);
        
        // Play attack animation
        this.sprite.play('enemymeleewarrior-attack');
        
        // Deal damage halfway through the animation
        this.scene.time.delayedCall(500, () => {
            if (this.isAlive && target.takeDamage) {
                target.takeDamage(this.damage);
            }
        });
        
        // Reset attacking state when animation completes
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
