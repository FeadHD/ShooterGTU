import Phaser from 'phaser';
import { GameConfig } from '../../config/GameConfig';

export class Zapper extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Use a default texture if zapper_idle is not loaded
        const textureKey = scene.textures.exists('zapper_idle') ? 'zapper_idle' : 'bullet';
        super(scene, x, y, textureKey);

        console.log('Creating Zapper with texture:', textureKey);

        // Basic setup
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Add to enemies group
        if (scene.enemies) {
            scene.enemies.add(this);
            // Add to enemy manager
            if (scene.enemyManager) {
                scene.enemyManager.addEnemy(this, this, this.maxHealth);
            }
        }

        // Physics properties
        this.setScale(1.5)
            .setBounce(0.1)
            .setGravityY(0)  // Remove gravity
            .setCollideWorldBounds(true)
            .setDepth(5);

        // Make it immovable
        this.body.setImmovable(true);

        // Set hitbox size to match sprite dimensions exactly
        this.body.setSize(16, 24); // Smaller hitbox for more precise hits
        this.body.setOffset(8, 8); // Center horizontally and align to bottom

        // Combat properties
        this.maxHealth = 50;
        this.health = this.maxHealth;
        this.damage = 50; // Shock damage
        this.speed = 100;
        this.attackRange = 60;
        this.attackCooldown = 2000;
        this.lastAttackTime = 0;
        this.awakenRange = 100;
        this.isHit = false;
        this.hitCooldown = 200;
        this.lastHitTime = 0;

        // Create shock sprite with physics
        this.shockSprite = scene.add.sprite(x, y, 'zapper_shock');
        this.shockSprite.setScale(1.5);
        this.shockSprite.setDepth(4); // Below Zapper
        this.shockSprite.setVisible(false);
        scene.physics.add.existing(this.shockSprite);
        this.shockSprite.body.setSize(32, 24); // Smaller hitbox for more precise hits
        this.shockSprite.body.setOffset(16, 4); // Center the hitbox
        this.shockSprite.body.allowGravity = false;
        this.shockSprite.body.immovable = true;
        this.shockSprite.body.enable = false;

        // Add collision between shock and player
        if (scene.player) {
            scene.physics.add.overlap(scene.player, this.shockSprite, () => {
                if (this.shockSprite.visible && !scene.player.isInvulnerable) {
                    scene.player.takeDamage(this.damage);
                }
            });
        }

        // Create health bar
        this.healthBar = scene.add.graphics();
        this.healthBar.setDepth(5);
        this.updateHealthBar();
        this.healthBar.visible = false;

        // State
        this.isAwake = false;
        this.isWakingUp = false;
        this.isAttacking = false;
        this.isDying = false;
        this.isDead = false;
        this.facingRight = true;

        // Store previous animation key
        this.previousAnim = null;
        this.currentAnimKey = null;

        // Try to play idle animation, but don't fail if it's not ready
        this.scene.game.events.once('ready', () => {
            this.playAnimationIfValid('zapper_idle');
        });
    }

    // Helper method to safely play animations
    playAnimationIfValid(key, ignoreIfPlaying = true) {
        if (!this.scene || !this.scene.anims) {
            console.warn('Scene or animations not available');
            return false;
        }

        // Check if animation exists and has frames
        const anim = this.scene.anims.get(key);
        if (!anim || !anim.frames || anim.frames.length === 0) {
            console.warn(`Animation ${key} not found or has no frames`);
            return false;
        }

        // Don't replay if already playing this animation
        if (ignoreIfPlaying && this.anims.currentAnim && this.anims.currentAnim.key === key) {
            return true;
        }

        try {
            this.play(key);
            this.currentAnimKey = key;
            return true;
        } catch (err) {
            console.warn(`Failed to play animation ${key}:`, err);
            return false;
        }
    }

    updateHealthBar() {
        this.healthBar.clear();
        
        // Bar dimensions
        const width = 32;
        const height = 4;
        const x = this.x - width/2;
        const y = this.y - 25; // Position above the sprite
        
        // Background (red)
        this.healthBar.fillStyle(0xff0000);
        this.healthBar.fillRect(x, y, width, height);
        
        // Health (green)
        const healthWidth = (this.health / this.maxHealth) * width;
        this.healthBar.fillStyle(0x00ff00);
        this.healthBar.fillRect(x, y, healthWidth, height);
    }

    takeDamage(amount) {
        if (this.isDying || this.isDead) {
            console.log('Already dying/dead, ignoring damage');
            return;
        }

        // Make invulnerable during idle and wake-up
        if (!this.isAwake || this.isWakingUp) {
            console.log('Zapper is invulnerable during idle/wake-up');
            return;
        }

        // Check hit cooldown
        const currentTime = this.scene.time.now;
        if (currentTime < this.lastHitTime + this.hitCooldown) {
            return;
        }
        this.lastHitTime = currentTime;

        this.health -= amount;
        console.log(`Zapper took ${amount} damage, health: ${this.health}`);

        // Show health bar when hit
        if (this.healthBar) {
            this.healthBar.visible = true;
            this.updateHealthBar();
        }

        // Flash red when hit
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });

        if (this.health <= 0) {
            this.die();
        }
    }

    preUpdate(time, delta) {
        // Don't update if destroyed
        if (!this.scene || this.isDead) return;
        
        super.preUpdate(time, delta);

        // Update shock sprite position if visible
        if (this.shockSprite && this.shockSprite.visible) {
            this.shockSprite.setPosition(this.x + (this.facingRight ? 32 : -32), this.y);
            this.shockSprite.setFlipX(!this.facingRight);
        }

        if (this.isDying) {
            // Only set velocity if we still can
            if (this.body && this.body.enable) {
                this.setVelocity(0, 0);
            }
            return;
        }

        // Update health bar position
        if (this.healthBar && this.healthBar.visible) {
            this.updateHealthBar();
        }

        // Get player reference if needed
        const player = this.scene.player;
        if (!player) return;

        // Check if player is in range to wake up (horizontal distance only)
        if (player && !this.isAwake && !this.isWakingUp) {
            const horizontalDistance = Math.abs(this.x - player.x);
            if (horizontalDistance < this.awakenRange) {
                this.wakeUp();
            }
        }

        // Move towards player if awake
        if (this.isAwake && !this.isWakingUp) {
            this.moveTowardsPlayer(player);
        }

        // Update facing direction
        if (this.isAwake && !this.isWakingUp) {
            // Attack if in range and cooldown is over
            const horizontalDistance = Math.abs(this.x - player.x);
            if (horizontalDistance <= this.attackRange && time > this.lastAttackTime + this.attackCooldown) {
                this.attack();
            }
        } else {
            // Stay still if not awake or during wake animation
            if (this.body && this.body.enable) {
                this.setVelocityX(0);
            }
        }
    }

    wakeUp() {
        if (this.isWakingUp || this.isAwake) return;

        console.log('Zapper waking up!');
        this.isWakingUp = true;
        
        // Show health bar during wake up
        this.healthBar.visible = true;
        
        // Check if animations are available
        if (!this.scene || !this.scene.anims) {
            console.warn('Scene or animations not available');
            this.isWakingUp = false;
            this.isAwake = true;
            return;
        }
        
        // Play wake animation if it exists
        if (this.scene.anims.exists('zapper_wake')) {
            console.log('Playing zapper wake animation');
            try {
                this.playAnimationIfValid('zapper_wake');
                
                this.once('animationcomplete', () => {
                    console.log('Wake animation complete');
                    this.isWakingUp = false;
                    this.isAwake = true;
                    
                    // Start walking immediately after waking
                    if (this.scene && this.scene.anims && this.scene.anims.exists('zapper_walk')) {
                        try {
                            this.playAnimationIfValid('zapper_walk', false);
                        } catch (err) {
                            console.warn('Failed to play walk animation:', err);
                        }
                    }
                });
            } catch (err) {
                console.warn('Failed to play wake animation:', err);
                this.isWakingUp = false;
                this.isAwake = true;
                
                // Fallback to walk animation
                if (this.scene && this.scene.anims && this.scene.anims.exists('zapper_walk')) {
                    try {
                        this.playAnimationIfValid('zapper_walk', false);
                    } catch (err) {
                        console.warn('Failed to play walk animation:', err);
                    }
                }
            }
        } else {
            console.warn('Wake animation not found');
            this.isWakingUp = false;
            this.isAwake = true;
            
            // Fallback to walk animation
            if (this.scene && this.scene.anims && this.scene.anims.exists('zapper_walk')) {
                try {
                    this.playAnimationIfValid('zapper_walk', false);
                } catch (err) {
                    console.warn('Failed to play walk animation:', err);
                }
            }
        }
    }

    moveTowardsPlayer(player) {
        if (this.isDying || this.isDead || !this.body || !this.body.enable || this.isAttacking) return;

        // Calculate direction to player
        const directionX = player.x - this.x;
        
        // Set velocity based on direction
        const speed = 100;
        this.setVelocityX(directionX > 0 ? speed : -speed);
        
        // Update facing direction
        this.facingRight = directionX > 0;
        this.setFlipX(!this.facingRight);

        // Play walk animation if not attacking
        if (!this.isAttacking) {
            this.playAnimationIfValid('zapper_walk');
        }
    }

    attack() {
        if (this.isDying || this.isDead || this.isAttacking) return;

        console.log('Zapper attacking');
        this.isAttacking = true;
        
        if (this.body && this.body.enable) {
            this.setVelocityX(0);
        }
        
        // Play attack and shock animations together
        if (this.scene && this.scene.anims.exists('zapper_attack')) {
            console.log('Playing attack and shock animations');
            try {
                this.playAnimationIfValid('zapper_attack');
                
                // Position and show shock sprite
                if (this.scene.anims.exists('zapper_shock')) {
                    this.shockSprite.setVisible(true);
                    this.shockSprite.body.enable = true;
                    this.shockSprite.setPosition(this.x + (this.facingRight ? 32 : -32), this.y);
                    this.shockSprite.setFlipX(!this.facingRight);
                    this.shockSprite.play('zapper_shock').once('animationcomplete', () => {
                        this.shockSprite.setVisible(false);
                        this.shockSprite.body.enable = false;
                    });
                }

                // Play attack animation
                this.anims.play('zapper_attack').once('animationcomplete', () => {
                    console.log('Attack animation complete');
                    this.isAttacking = false;
                    // Return to walk animation if we were walking
                    if (this.scene && this.scene.anims.exists('zapper_walk')) {
                        this.playAnimationIfValid('zapper_walk', false);
                    }
                });
            } catch (err) {
                console.warn('Failed to play attack animation:', err);
                this.isAttacking = false;
                
                // Return to walk animation if we were walking
                if (this.scene && this.scene.anims.exists('zapper_walk')) {
                    this.playAnimationIfValid('zapper_walk', false);
                }
            }
        } else {
            // If no animation, just set a timer
            this.scene.time.delayedCall(500, () => {
                if (!this.isDead) {
                    this.isAttacking = false;
                }
            });
        }

        this.lastAttackTime = this.scene.time.now;
    }

    die() {
        console.log('Zapper health reached 0, dying...');
        this.isDying = true;
        
        // Only modify physics if we still can
        if (this.body) {
            this.body.enable = false;
            this.setVelocity(0, 0);
            this.setAcceleration(0, 0);
            this.setImmovable(true);
        }
        
        // Play death animation if it exists
        if (this.scene && this.scene.anims.exists('zapper_death')) {
            console.log('Playing death animation');
            this.playAnimationIfValid('zapper_death').once('animationcomplete', () => {
                console.log('Death animation complete, destroying Zapper');
                if (this.healthBar) {
                    this.healthBar.visible = false;
                }
                this.isDead = true;
                this.destroy();
            });
        } else {
            console.warn('Death animation not found, destroying immediately');
            if (this.healthBar) {
                this.healthBar.visible = false;
            }
            this.isDead = true;
            this.destroy();
        }
    }

    destroy(fromScene) {
        // Clean up shock sprite
        if (this.shockSprite) {
            this.shockSprite.destroy();
        }
        // Clean up health bar when destroyed
        if (this.healthBar) {
            this.healthBar.destroy();
        }
        super.destroy(fromScene);
    }
}
