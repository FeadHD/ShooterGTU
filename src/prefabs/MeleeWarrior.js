import Enemy from './Enemy';
import { PathFinder } from '../modules/pathfinding/PathFinder';

class MeleeWarrior extends Enemy {
    constructor(scene, x, y, config = {}) {
        super(scene, x, y, {
            ...config,
            spriteKey: 'enemymeleewarrior_IDLE',
            maxHealth: 3,
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
        this.attackCooldown = config.attackCooldown || 1000;
        this.lastAttackTime = 0;
        this.isAttacking = false;
        this.direction = 1;

        // Pathfinding properties
        this.pathFinder = new PathFinder(scene);
        this.currentPath = null;
        this.pathUpdateCooldown = 500; // Update path every 500ms
        this.lastPathUpdate = 0;
        this.currentPathIndex = 0;

        // Initialize pathfinding grid
        this.scene.events.once('create', () => {
            this.pathFinder.initializeGrid();
        });

        // Adjust sprite size and physics body
        if (this.sprite) {
            const targetHeight = 128;
            const scale = targetHeight / this.sprite.height;
            const scaledWidth = this.sprite.width * scale;
            this.sprite.setDisplaySize(scaledWidth, targetHeight);
            
            this.sprite.body.setCollideWorldBounds(true);
            this.sprite.body.setBounce(0.2);
            this.sprite.body.setDrag(200);
            
            this.sprite.body.setSize(32, 32);
            const offsetX = 32;
            const offsetY = 28;
            this.sprite.body.setOffset(offsetX, offsetY);
            
            if (this.scene.enemies) {
                this.scene.enemies.add(this.sprite);
            }
            
            this.sprite.setData('type', 'warrior');
            this.sprite.setData('health', this.health);
            this.sprite.setData('maxHealth', this.maxHealth);
            this.sprite.setData('speed', this.speed);
            this.sprite.setData('detectionRange', this.detectionRange);
            this.sprite.setData('attackRange', this.attackRange);
            this.sprite.setData('isAttacking', this.isAttacking);
            this.sprite.setData('warrior', this);
        }
    }

    update() {
        if (!this.sprite || !this.sprite.active) return;

        // Update sprite data for debug display
        this.sprite.setData('health', this.health);
        this.sprite.setData('maxHealth', this.maxHealth);
        this.sprite.setData('speed', Math.abs(this.sprite.body.velocity.x));
        this.sprite.setData('state', this.isAttacking ? 'Attack' : (Math.abs(this.sprite.body.velocity.x) > 0 ? 'Run' : 'Idle'));

        const player = this.scene.player;
        if (!player || !player.active) return;

        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x,
            this.sprite.y,
            player.x,
            player.y
        );

        if (distanceToPlayer <= this.detectionRange) {
            const currentTime = this.scene.time.now;

            // Update path periodically
            if (currentTime - this.lastPathUpdate >= this.pathUpdateCooldown) {
                this.currentPath = this.pathFinder.findPath(
                    this.sprite.x,
                    this.sprite.y,
                    player.x,
                    player.y
                );
                this.currentPathIndex = 0;
                this.lastPathUpdate = currentTime;
            }

            if (distanceToPlayer <= this.attackRange && !this.isAttacking) {
                // Stop and attack
                this.sprite.setVelocityX(0);
                if (currentTime - this.lastAttackTime >= this.attackCooldown) {
                    this.attack();
                    this.lastAttackTime = currentTime;
                }
            } else if (!this.isAttacking && this.currentPath && this.currentPath.length > 0) {
                // Follow path
                const targetPoint = this.currentPath[this.currentPathIndex];
                const distanceToPoint = Phaser.Math.Distance.Between(
                    this.sprite.x,
                    this.sprite.y,
                    targetPoint.x,
                    targetPoint.y
                );

                if (distanceToPoint < 10) {
                    // Move to next point in path
                    this.currentPathIndex++;
                    if (this.currentPathIndex >= this.currentPath.length) {
                        this.currentPath = null;
                    }
                } else {
                    // Move towards current target point
                    const angle = Phaser.Math.Angle.Between(
                        this.sprite.x,
                        this.sprite.y,
                        targetPoint.x,
                        targetPoint.y
                    );

                    this.sprite.setVelocityX(Math.cos(angle) * this.speed);
                    this.direction = this.sprite.x < targetPoint.x ? 1 : -1;
                    this.sprite.setFlipX(this.direction === -1);

                    if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim.key !== 'enemymeleewarrior-run') {
                        this.sprite.play('enemymeleewarrior-run');
                    }
                }
            }
        } else {
            // Return to idle when player is out of range
            this.sprite.setVelocityX(0);
            this.currentPath = null;
            if (!this.isAttacking && (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim.key !== 'enemymeleewarrior-idle')) {
                this.sprite.play('enemymeleewarrior-idle');
            }
        }
    }

    attack() {
        if (!this.sprite || this.isAttacking) return;

        this.isAttacking = true;
        this.sprite.play('enemymeleewarrior-attack');
        
        const player = this.scene.player;
        if (player && Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, player.x, player.y) <= this.attackRange) {
            player.takeDamage(this.damage);
        }

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
