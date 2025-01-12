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
        this.awakenRange = 50;

        // Create health bar
        this.healthBar = scene.add.graphics();
        this.healthBar.setDepth(5);
        this.updateHealthBar();
        this.healthBar.visible = false; // Start hidden

        // State
        this.isAwake = false;
        this.isWakingUp = false;  // New state for wake animation
        this.isAttacking = false;
        this.isDying = false;
        this.facingRight = true;

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

    takeDamage(amount) {
        if (this.isDying) return;

        this.health = Math.max(0, this.health - amount);
        this.updateHealthBar();
        
        if (this.health <= 0) {
            this.isDying = true;
            this.body.enable = false;
            this.setVelocity(0, 0);
            this.destroy();
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (this.isDying) {
            this.setVelocity(0, 0);
            return;
        }

        // Update health bar position
        if (this.healthBar.visible) {
            this.updateHealthBar();
        }

        // Get player reference if needed
        const player = this.scene.player;
        if (!player) return;

        // Check if player is in range to wake up
        if (player && !this.isAwake && !this.isWakingUp) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            if (distance < this.awakenRange) {
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
            if (Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) <= this.attackRange && time > this.lastAttackTime + this.attackCooldown) {
                this.attack();
            }
        } else {
            // Stay still if not awake or during wake animation
            this.setVelocityX(0);
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
        if (this.isDying) return;

        // Calculate direction to player
        const directionX = player.x - this.x;
        
        // Set velocity based on direction
        const speed = 100;
        this.setVelocityX(directionX > 0 ? speed : -speed);
        
        // Update facing direction
        this.facingRight = directionX > 0;
        this.setFlipX(!this.facingRight);

        // Play walk animation
        if (this.scene.anims.exists('zapper_walk')) {
            this.anims.play('zapper_walk', true);
        }
    }

    attack() {
        if (this.isDying) return;

        this.isAttacking = true;
        this.setVelocityX(0);
        this.lastAttackTime = this.scene.time.now;

        // Reset attacking state after cooldown
        this.scene.time.delayedCall(500, () => {
            this.isAttacking = false;
        });
    }

    destroy() {
        // Clean up health bar when destroyed
        if (this.healthBar) {
            this.healthBar.destroy();
        }
        super.destroy();
    }
}
