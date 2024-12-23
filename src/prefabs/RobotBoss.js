export class RobotBoss extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'robotBoss');
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Basic properties
        this.health = 100;
        this.damage = 25;
        this.moveSpeed = 100;
        this.isMovingRight = true;

        // Physics setup
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(0.2);
        this.body.setGravityY(800);

        // Create laser group
        this.lasers = scene.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        // Attack cooldown
        this.canAttack = true;
        this.attackCooldown = 2000; // 2 seconds
    }

    update() {
        if (!this.active) return;

        const player = this.scene.player;
        if (!player) return;

        // Basic left-right movement
        if (this.isMovingRight) {
            this.body.setVelocityX(this.moveSpeed);
            this.flipX = false;
        } else {
            this.body.setVelocityX(-this.moveSpeed);
            this.flipX = true;
        }

        // Change direction when hitting world bounds
        if (this.body.blocked.right) {
            this.isMovingRight = false;
        } else if (this.body.blocked.left) {
            this.isMovingRight = true;
        }

        // Try to shoot if possible
        if (this.canAttack && player.active) {
            this.shootLaser();
        }
    }

    shootLaser() {
        this.canAttack = false;

        // Create laser
        const laser = this.lasers.create(this.x, this.y, 'laser');
        
        // Calculate angle to player
        const angle = Phaser.Math.Angle.Between(
            this.x, 
            this.y, 
            this.scene.player.x, 
            this.scene.player.y
        );

        // Set laser velocity
        const speed = 300;
        laser.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        laser.setRotation(angle);

        // Destroy laser after 2 seconds
        this.scene.time.delayedCall(2000, () => {
            laser.destroy();
        });

        // Reset attack cooldown
        this.scene.time.delayedCall(this.attackCooldown, () => {
            this.canAttack = true;
        });
    }

    takeDamage(damage) {
        this.health -= damage;

        // Flash effect when taking damage
        this.scene.tweens.add({
            targets: this,
            alpha: 0.5,
            duration: 100,
            yoyo: true
        });

        // Check if boss is defeated
        if (this.health <= 0) {
            this.destroy();
        }
    }
}
