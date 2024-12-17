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
        // Flash the enemy when hit
        this.sprite.setAlpha(0.5);
        setTimeout(() => this.sprite.setAlpha(1), 100);
        return this.currentHealth <= 0;
    }

    destroy() {
        this.sprite.destroy();
    }

    update() {
        if (!this.sprite || !this.sprite.active) return;

        const player = this.scene.player;
        if (!player) return;

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
        this.aggroRange = 400; // Longest range
        this.moveSpeed = 100;  // Slowest but strongest
        this.patrolSpeed = 75;
    }
}
