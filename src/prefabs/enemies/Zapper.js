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

        // Physics properties
        this.setScale(1.5)
            .setBounce(0.1)
            .setGravityY(0)  // Remove gravity
            .setCollideWorldBounds(true)
            .setDepth(5);

        // Make it immovable
        this.body.setImmovable(true);

        // Set hitbox size to match sprite dimensions exactly
        this.body.setSize(32, 32); // New sprite size
        this.body.setOffset(0, 0); // No offset needed since we're using the full size

        // Combat properties
        this.maxHealth = 50;
        this.health = this.maxHealth;
        this.damage = 20;
        this.speed = 100;
        this.attackRange = 200;
        this.attackCooldown = 2000;
        this.lastAttackTime = 0;
        this.awakenRange = 100; // Changed to 100px
        this.isHit = false;
        this.hitCooldown = 200;
        this.lastHitTime = 0;

        // Create detection range lines
        this.detectionGraphics = scene.add.graphics();
        this.detectionGraphics.setDepth(4); // Below the Zapper
        this.updateDetectionRange();

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

        // Create wake animation if it doesn't exist
        if (!scene.anims.exists('zapper_wake')) {
            scene.anims.create({
                key: 'zapper_wake',
                frames: scene.anims.generateFrameNumbers('zapper_wake', { start: 0, end: 5 }),
                frameRate: 10,
                repeat: 0
            });
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

    updateDetectionRange() {
        if (!this.detectionGraphics || !this.scene) return;

        this.detectionGraphics.clear();
        this.detectionGraphics.lineStyle(2, 0x000000, 1);

        // Draw left line
        this.detectionGraphics.beginPath();
        this.detectionGraphics.moveTo(this.x - this.awakenRange, this.y - 20);
        this.detectionGraphics.lineTo(this.x - this.awakenRange, this.y + 20);
        this.detectionGraphics.strokePath();

        // Draw right line
        this.detectionGraphics.beginPath();
        this.detectionGraphics.moveTo(this.x + this.awakenRange, this.y - 20);
        this.detectionGraphics.lineTo(this.x + this.awakenRange, this.y + 20);
        this.detectionGraphics.strokePath();

        // Draw connecting lines
        this.detectionGraphics.lineStyle(2, 0x000000, 0.3);
        this.detectionGraphics.beginPath();
        this.detectionGraphics.moveTo(this.x - this.awakenRange, this.y);
        this.detectionGraphics.lineTo(this.x + this.awakenRange, this.y);
        this.detectionGraphics.strokePath();
    }

    takeDamage(amount) {
        if (this.isDying || this.isDead) {
            console.log('Already dying/dead, ignoring damage');
            return;
        }

        this.health = Math.max(0, this.health - amount);
        console.log(`Zapper took ${amount} damage. Health: ${this.health}/${this.maxHealth}`);
        this.updateHealthBar();
        
        // Play hit animation if not on cooldown
        const currentTime = this.scene.time.now;
        if (currentTime > this.lastHitTime + this.hitCooldown) {
            this.lastHitTime = currentTime;
            
            // Store current animation
            if (this.anims.currentAnim) {
                this.previousAnim = {
                    key: this.anims.currentAnim.key,
                    repeat: this.anims.currentAnim.repeat
                };
            }
            
            // Play hit animation
            if (this.scene && this.scene.anims.exists('zapper_hit')) {
                console.log('Playing hit animation');
                this.setTexture('zapper_hit');
                this.anims.play('zapper_hit').once('animationcomplete', () => {
                    // Return to previous animation if it exists
                    if (this.previousAnim && !this.isDying && !this.isDead) {
                        this.setTexture(this.previousAnim.key);
                        this.anims.play(this.previousAnim.key, true);
                    }
                });
            }
        }
        
        if (this.health <= 0) {
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
                this.setTexture('zapper_death');
                this.anims.play('zapper_death').once('animationcomplete', () => {
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
    }

    preUpdate(time, delta) {
        // Don't update if destroyed
        if (!this.scene || this.isDead) return;
        
        super.preUpdate(time, delta);

        // Update detection range visualization
        this.updateDetectionRange();

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
        console.log('Zapper waking up!');
        this.isWakingUp = true;
        
        // Show health bar during wake up
        this.healthBar.visible = true;
        
        // Play wake animation
        if (this.scene.anims.exists('zapper_wake')) {
            console.log('Playing zapper wake animation');
            this.setTexture('zapper_wake');
            this.anims.play('zapper_wake').once('animationcomplete', () => {
                console.log('Wake animation complete');
                this.isWakingUp = false;
                this.isAwake = true;
                // Start walking immediately after waking
                if (this.scene.anims.exists('zapper_walk')) {
                    this.setTexture('zapper_walk');
                    this.anims.play('zapper_walk', true);
                }
            });
        } else {
            console.warn('Wake animation not found');
            this.isWakingUp = false;
            this.isAwake = true;
        }
    }

    moveTowardsPlayer(player) {
        if (this.isDying || this.isDead || !this.body || !this.body.enable) return;

        // Calculate direction to player
        const directionX = player.x - this.x;
        
        // Set velocity based on direction
        const speed = 100;
        this.setVelocityX(directionX > 0 ? speed : -speed);
        
        // Update facing direction
        this.facingRight = directionX > 0;
        this.setFlipX(!this.facingRight);

        // Play walk animation
        if (this.scene && this.scene.anims.exists('zapper_walk')) {
            this.anims.play('zapper_walk', true);
        }
    }

    attack() {
        if (this.isDying || this.isDead) return;

        this.isAttacking = true;
        if (this.body && this.body.enable) {
            this.setVelocityX(0);
        }
        this.lastAttackTime = this.scene.time.now;

        // Reset attacking state after cooldown
        this.scene.time.delayedCall(500, () => {
            if (!this.isDead) {
                this.isAttacking = false;
            }
        });
    }

    destroy(fromScene) {
        // Clean up detection graphics
        if (this.detectionGraphics) {
            this.detectionGraphics.destroy();
        }
        // Clean up health bar when destroyed
        if (this.healthBar) {
            this.healthBar.destroy();
        }
        super.destroy(fromScene);
    }
}
