import Phaser from 'phaser';
import { GameConfig } from '../../config/GameConfig';

export class Zapper extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Use a default texture if zapper_idle is not loaded
        const textureKey = scene.textures.exists('zapper_idle') ? 'zapper_idle' : 'bullet';
        super(scene, x, y, textureKey);
        this.type = 'Zapper'; // Explicitly set type

        console.log('Creating Zapper with texture:', textureKey);

        // Combat properties
        this.maxHealth = 50;
        this.health = this.maxHealth;
        this.damage = 50;
        this.speed = 100;
        this.attackRange = 60;
        this.attackCooldown = 2000;
        this.lastAttackTime = 0;
        this.awakenRange = 100;
        this.isHit = false;
        this.hitCooldown = 200;
        this.lastHitTime = 0;

        // States
        this.isAwake = false;
        this.isWakingUp = false;
        this.isAttacking = false;
        this.isDying = false;
        this.isDead = false;
        this.facingRight = true;

        // Add sprite to the scene
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

        // Basic physics settings
        this.setScale(1.5)
            .setBounce(0.1)
            .setGravityY(0)
            .setCollideWorldBounds(true)
            .setDepth(5);

        this.body.setImmovable(true);
        this.body.setSize(24, 32);
        this.body.setOffset(4, 0);

        // Shock sprite setup
        this.shockSprite = scene.add.sprite(x, y, 'zapper_shock');
        this.shockSprite.setScale(1.5);
        this.shockSprite.setDepth(4);
        this.shockSprite.setVisible(false);
        scene.physics.add.existing(this.shockSprite);
        this.shockSprite.body.setSize(32, 24);
        this.shockSprite.body.setOffset(16, 4);
        this.shockSprite.body.allowGravity = false;
        this.shockSprite.body.immovable = true;
        this.shockSprite.body.enable = false;

        // Health bar
        this.healthBar = scene.add.graphics();
        this.healthBar.setDepth(5);
        this.updateHealthBar();
        this.healthBar.visible = false;

        // Wait for scene to be ready before playing animations
        if (scene.events) {
            scene.events.once('create', () => {
                this.playAnimationIfValid('zapper_idle');
            });
        }
    }

    playAnimationIfValid(key, ignoreIfPlaying = true) {
        if (!this.scene || !this.scene.anims) return this;

        const anim = this.scene.anims.get(key);
        if (!anim || !anim.frames?.length) {
            console.warn(`Animation ${key} not found or has no frames`);
            return this;
        }

        if (ignoreIfPlaying && this.anims.currentAnim && this.anims.currentAnim.key === key) {
            return this;
        }

        try {
            this.play(key);
            return this;
        } catch (err) {
            console.warn(`Failed to play animation ${key}:`, err);
            return this;
        }
    }

    updateHealthBar() {
        this.healthBar.clear();
        const width = 32;
        const height = 4;
        const x = this.x - width / 2;
        const y = this.y - 25;

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

        // Make invulnerable during idle/wake-up
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
        if (!this.scene || this.isDead) return;
        super.preUpdate(time, delta);

        if (this.shockSprite && this.shockSprite.visible) {
            this.shockSprite.setPosition(this.x + (this.facingRight ? 32 : -32), this.y);
            this.shockSprite.setFlipX(!this.facingRight);
        }

        if (this.isDying) {
            if (this.body && this.body.enable) {
                this.setVelocity(0, 0);
            }
            return;
        }

        // Update health bar position
        if (this.healthBar && this.healthBar.visible) {
            this.updateHealthBar();
        }

        const player = this.scene.player;
        if (!player) return;

        // Wake up if player is close
        if (!this.isAwake && !this.isWakingUp) {
            const horizontalDistance = Math.abs(this.x - player.x);
            if (horizontalDistance < this.awakenRange) {
                this.wakeUp();
            }
        }

        // Move if awake
        if (this.isAwake && !this.isWakingUp) {
            this.moveTowardsPlayer(player);

            const horizontalDistance = Math.abs(this.x - player.x);
            if (horizontalDistance <= this.attackRange && time > this.lastAttackTime + this.attackCooldown) {
                this.attack();
            }
        } else {
            // Stay still if not awake
            if (this.body && this.body.enable) {
                this.setVelocityX(0);
            }
        }
    }

    wakeUp() {
        if (this.isWakingUp || this.isAwake) return;
        console.log('Zapper waking up!');
        this.isWakingUp = true;
        this.healthBar.visible = true;

        if (!this.scene?.anims) {
            console.warn('Scene or animations not available');
            this.isWakingUp = false;
            this.isAwake = true;
            return;
        }

        if (this.scene.anims.exists('zapper_wake')) {
            console.log('Playing zapper wake animation');
            this.playAnimationIfValid('zapper_wake');
            
            this.once('animationcomplete', () => {
                console.log('Wake animation complete');
                this.isWakingUp = false;
                this.isAwake = true;
                if (this.scene.anims.exists('zapper_walk')) {
                    this.playAnimationIfValid('zapper_walk', false);
                }
            });
        } else {
            console.warn('Wake animation not found');
            this.isWakingUp = false;
            this.isAwake = true;
            if (this.scene.anims.exists('zapper_walk')) {
                this.playAnimationIfValid('zapper_walk', false);
            }
        }
    }

    moveTowardsPlayer(player) {
        if (this.isDying || this.isDead || !this.body?.enable || this.isAttacking) return;

        const directionX = player.x - this.x;
        const speed = 100;
        this.setVelocityX(directionX > 0 ? speed : -speed);

        this.facingRight = directionX > 0;
        this.setFlipX(!this.facingRight);

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
        
        if (this.scene?.anims.exists('zapper_attack')) {
            console.log('Playing attack and shock animations');
            this.playAnimationIfValid('zapper_attack');
            
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

            this.anims.play('zapper_attack').once('animationcomplete', () => {
                console.log('Attack animation complete');
                this.isAttacking = false;
                if (this.scene && this.scene.anims.exists('zapper_walk')) {
                    this.playAnimationIfValid('zapper_walk', false);
                }
            });
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
        if (this.isDead || this.isDying) return;
        console.log('Zapper health reached 0, dying...');
        this.isDying = true;
        
        if (this.body) {
            this.body.enable = false;
            this.setVelocity(0, 0);
            this.setAcceleration(0, 0);
            this.setImmovable(true);
        }
        
        if (this.scene?.anims.exists('zapper_death')) {
            console.log('Playing death animation');
            this.play('zapper_death').once('animationcomplete', () => {
                console.log('Death animation complete, destroying Zapper');

                // **** Emit 'died' so EnemyManager can award points ****
                this.emit('died', this);

                this.isDead = true;
                this.destroy();
            });
        } else {
            console.warn('Death animation not found, destroying immediately');
            
            // Emit 'died' even if no animation
            this.emit('died', this);

            this.isDead = true;
            this.destroy();
        }
    }

    destroy(fromScene) {
        if (this.shockSprite) {
            this.shockSprite.destroy();
        }
        if (this.healthBar) {
            this.healthBar.destroy();
        }
        super.destroy(fromScene);
    }
}
