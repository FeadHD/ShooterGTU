import Enemy from './Enemy';

class MeleeWarrior extends Enemy {
    constructor(scene, x, y, config = {}) {
        super(scene, x, y, {
            ...config,
            spriteKey: 'enemymeleewarrior_IDLE',  // Updated to match uppercase filename
            maxHealth: config.maxHealth || 100,
            damage: config.damage || 30,
            type: 'ground'
        });

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
            // Set display size to match other entities
            this.sprite.setDisplaySize(64, 64);
            
            // Adjust physics body size and offset
            this.sprite.body.setSize(48, 64);  // Smaller hitbox width for better collisions
            this.sprite.body.setOffset(24, 10); // Center the hitbox and raise it a bit
            
            // Set data for debug display
            this.sprite.setData('type', 'warrior');
            this.sprite.setData('health', this.health);
            this.sprite.setData('maxHealth', this.maxHealth);
            this.sprite.setData('speed', this.speed);
            this.sprite.setData('detectionRange', this.detectionRange);
            this.sprite.setData('attackRange', this.attackRange);
            this.sprite.setData('isAttacking', this.isAttacking);
            this.sprite.setData('warrior', this);  // Store reference to this warrior
        }

        // Create animations once scene is ready
        if (this.scene.events) {
            this.scene.events.once('create', () => {
                this.createAnimations();
            });
        }
    }

    createAnimations() {
        console.log('Creating melee warrior animations...');
        
        try {
            // Animation configurations with correct frame counts
            const animConfigs = {
                'IDLE': { endFrame: 5, repeat: -1, frameRate: 8 },
                'WALK': { endFrame: 7, repeat: -1, frameRate: 8 },
                'ATTACK': { endFrame: 6, repeat: 0, frameRate: 12 },
                'DEATH': { endFrame: 8, repeat: 0, frameRate: 8 }
            };
            
            // Log available textures
            console.log('Available textures:', this.scene.textures.list);
            
            // Create animations based on configs
            Object.entries(animConfigs).forEach(([key, config]) => {
                const spriteKey = `enemymeleewarrior_${key}`;
                const animKey = `enemymeleewarrior-${key.toLowerCase()}`;
                const texture = this.scene.textures.get(spriteKey);
                
                if (texture) {
                    console.log(`${spriteKey} texture:`, {
                        frameTotal: texture.frameTotal,
                        width: texture.source[0].width,
                        height: texture.source[0].height
                    });
                    
                    if (!this.scene.anims.exists(animKey)) {
                        console.log(`Creating animation: ${animKey} with ${config.endFrame + 1} frames`);
                        this.scene.anims.create({
                            key: animKey,
                            frames: this.scene.anims.generateFrameNumbers(spriteKey, { 
                                start: 0, 
                                end: config.endFrame
                            }),
                            frameRate: config.frameRate,
                            repeat: config.repeat
                        });
                    }
                } else {
                    console.error(`${spriteKey} texture not found!`);
                }
            });

            // Start idle animation if sprite exists
            if (this.sprite && this.sprite.active) {
                console.log('Starting idle animation');
                const idleAnim = this.scene.anims.get('enemymeleewarrior-idle');
                if (idleAnim) {
                    this.sprite.play('enemymeleewarrior-idle');
                } else {
                    console.error('Idle animation not found');
                }
            } else {
                console.warn('Sprite not ready for animation');
            }
        } catch (error) {
            console.error('Error creating animations:', error);
            console.error('Error stack:', error.stack);
        }
    }

    update(time, delta) {
        super.update(time, delta);

        if (!this.isAlive || !this.sprite || this.isAttacking) return;

        // Update debug data
        if (this.sprite) {
            this.sprite.setData('health', this.health);
            this.sprite.setData('isAttacking', this.isAttacking);
        }

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
