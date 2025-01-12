import Phaser from 'phaser';
import { GameConfig } from '../../config/GameConfig';

export class Zapper extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Use a default texture if zapper_idle is not loaded
        const textureKey = scene.textures.exists('zapper_idle') ? 'zapper_idle' : 'bullet';
        super(scene, x, y, textureKey);

        console.log('Creating Zapper with texture:', textureKey);
        console.log('Available textures:', Object.keys(scene.textures.list));

        // Basic setup
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Physics properties
        this.setScale(2)
            .setBounce(0.1)
            .setGravityY(300)
            .setCollideWorldBounds(true)
            .setDepth(5);

        // Set hitbox size
        this.body.setSize(20, 32);

        // Combat properties
        this.health = 100;
        this.damage = 20;
        this.speed = 100;
        this.attackRange = 200;
        this.attackCooldown = 2000;
        this.lastAttackTime = 0;

        // State
        this.isAwake = false;
        this.isAttacking = false;
        this.isDying = false;
        this.facingRight = true;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (this.isDying) return;

        // Get player reference if needed
        const player = this.scene.player;
        if (!player) return;

        // Calculate distance to player
        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // Update facing direction
        this.facingRight = player.x > this.x;
        this.setFlipX(!this.facingRight);

        // Attack if in range and cooldown is over
        if (distanceToPlayer <= this.attackRange && time > this.lastAttackTime + this.attackCooldown) {
            this.attack();
        }
        // Move towards player if not attacking
        else if (!this.isAttacking) {
            this.moveTowardsPlayer(player);
        }
    }

    moveTowardsPlayer(player) {
        const direction = player.x > this.x ? 1 : -1;
        this.setVelocityX(direction * this.speed);
    }

    attack() {
        this.isAttacking = true;
        this.setVelocityX(0);
        this.lastAttackTime = this.scene.time.now;

        // Reset attacking state after cooldown
        this.scene.time.delayedCall(500, () => {
            this.isAttacking = false;
        });
    }

    takeDamage(damage) {
        this.health -= damage;

        if (this.health <= 0 && !this.isDying) {
            this.die();
        }
    }

    die() {
        this.isDying = true;
        this.body.setVelocity(0);
        this.body.setEnable(false);
        
        // Destroy after a short delay
        this.scene.time.delayedCall(500, () => {
            this.destroy();
        });
    }
}
