// Enemy class definitions with different health points
export class Enemy {
    constructor(scene, x, y, sprite, health, tint = 0xff0000) {
        this.scene = scene;
        this.sprite = scene.add.rectangle(x, y, 32, 48, tint);
        scene.physics.add.existing(this.sprite);
        this.sprite.setScale(1);  // All enemies have same scale
        this.maxHealth = health;
        this.currentHealth = health;
        
        // Set up physics properties
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setBounce(0);
        this.sprite.body.setFriction(1);
        this.sprite.body.setGravityY(800); // Match world gravity
        this.sprite.body.setDragX(50); // Add some drag for smoother movement
        
        // Adjust physics body size and offset
        this.sprite.body.setSize(32, 46); // Slightly smaller height
        this.sprite.body.setOffset(0, 1); // Move collision box up slightly

        // Enemy behavior properties
        this.aggroRange = 300; // Distance at which enemy starts chasing player
        this.moveSpeed = 150;  // Movement speed when chasing
        this.patrolSpeed = 100; // Movement speed when patrolling
        
        // Set up patrol boundaries
        this.leftBound = 20;  // Just enough space to not trigger scene change
        this.rightBound = scene.scale.width - 20;  // Just enough space to not trigger scene change
        
        // Set initial velocity for patrol
        this.setVelocityX(this.patrolSpeed);
        
        // Create health bar after all setup is complete (except for BossEnemy)
        if (!(this instanceof BossEnemy)) {
            this.createHealthBar();
        }
    }

    createHealthBar() {
        // Calculate actual display size (accounting for scale)
        const displayWidth = this.sprite.width * this.sprite.scaleX;
        const displayHeight = this.sprite.height * this.sprite.scaleY;
        
        // Make health bar wider than the enemy
        const healthBarWidth = displayWidth * 1.5; // 50% wider than enemy
        
        // Health bar height scales with enemy size
        const healthBarHeight = Math.max(6, Math.floor(displayHeight * 0.08));
        
        // Position above enemy's head with padding
        const yOffset = displayHeight / 2 + healthBarHeight * 2;
        
        // Create the bars
        this.healthBarBackground = this.scene.add.rectangle(
            this.sprite.x,
            this.sprite.y - yOffset,
            healthBarWidth,
            healthBarHeight,
            0xff0000
        );
        
        this.healthBar = this.scene.add.rectangle(
            this.sprite.x,
            this.sprite.y - yOffset,
            healthBarWidth,
            healthBarHeight,
            0x00ff00
        );
    }

    setVelocityX(velocity) {
        this.sprite.body.setVelocityX(velocity);
    }

    setVelocityY(velocity) {
        this.sprite.body.setVelocityY(velocity);
    }

    getX() {
        return this.sprite.x;
    }

    damage(amount) {
        this.currentHealth -= amount;
        
        // Update health bar width based on current health percentage
        const healthPercent = this.currentHealth / this.maxHealth;
        const baseWidth = this.healthBarBackground.width; // Use background width as reference
        this.healthBar.width = baseWidth * healthPercent;
        
        // Keep bars centered on enemy
        this.healthBar.x = this.sprite.x;
        this.healthBarBackground.x = this.sprite.x;
        
        // Flash the enemy when hit only if sprite exists
        if (this.sprite && this.sprite.active) {
            this.sprite.setAlpha(0.5);
            setTimeout(() => {
                if (this.sprite && this.sprite.active) {
                    this.sprite.setAlpha(1);
                }
            }, 100);
        }
        
        return this.currentHealth <= 0;
    }

    destroy() {
        if (this.healthBar) {
            this.healthBar.destroy();
            this.healthBar = null;
        }
        if (this.healthBarBackground) {
            this.healthBarBackground.destroy();
            this.healthBarBackground = null;
        }
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
    }

    update() {
        if (!this.sprite || !this.sprite.active) return;

        const player = this.scene.player;
        if (!player) return;

        // Update health bar position to follow enemy
        const enemyHeight = this.sprite.height * this.sprite.scaleY;
        const healthBarHeight = Math.max(6, Math.floor(enemyHeight * 0.08));
        const yOffset = enemyHeight / 2 + healthBarHeight * 2;
        this.healthBarBackground.y = this.sprite.y - yOffset;
        this.healthBar.y = this.sprite.y - yOffset;
        this.healthBarBackground.x = this.sprite.x;
        this.healthBar.x = this.sprite.x;

        // Calculate distance to player
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x,
            this.sprite.y,
            player.x,
            player.y
        );

        // If player is within aggro range, chase them
        if (distanceToPlayer < this.aggroRange) {
            // Move towards player on X axis only
            if (this.sprite.x < player.x) {
                this.setVelocityX(this.moveSpeed);
            } else {
                this.setVelocityX(-this.moveSpeed);
            }
        } else {
            // Normal patrol behavior when player is out of range
            if (this.getX() >= this.rightBound) {
                this.setVelocityX(-this.patrolSpeed);
            } else if (this.getX() <= this.leftBound) {
                this.setVelocityX(this.patrolSpeed);
            }
        }
    }
}

export class WeakEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'player', 1, 0x00FFFF); // Light blue/cyan color, 1 HP
        this.aggroRange = 250; // Shorter range
        this.moveSpeed = 160;  // Faster but weaker
    }
}

export class MediumEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'player', 2, 0xFFD700); // Yellow/gold color, 2 HP
        this.aggroRange = 300; // Medium range
        this.moveSpeed = 140;  // Medium speed
    }
}

export class StrongEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'player', 4, 0x8A2BE2); // Purple/violet color, 4 HP
        this.aggroRange = 350; // Longer range
        this.moveSpeed = 120;  // Slower but stronger
    }
}

export class BossEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'player', 10, 0xFF0000); // Bright red color, 10 HP
        this.sprite.setScale(2); // Boss is bigger
        
        // Update physics body for the new scale
        this.sprite.body.setSize(32, 46);
        this.sprite.body.setOffset(0, 1);
        
        // Create health bar only after setting scale
        this.createHealthBar();
        
        this.aggroRange = 400; // Longest range
        this.moveSpeed = 100;  // Slowest but strongest
        this.patrolSpeed = 75;
    }
}
