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

        // Set up patrol boundaries
        this.leftBound = 20;  // Just enough space to not trigger scene change
        this.rightBound = scene.scale.width - 20;  // Just enough space to not trigger scene change
        
        // Set initial velocity
        this.setVelocityX(100);
    }

    setVelocityX(velocity) {
        this.sprite.body.setVelocityX(velocity);
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
        if (this.sprite && this.sprite.active) {
            if (this.getX() >= this.rightBound) {
                this.setVelocityX(-100);
            } else if (this.getX() <= this.leftBound) {
                this.setVelocityX(100);
            }
        }
    }
}

export class WeakEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'player', 1, 0x00FFFF); // Light blue/cyan color, 1 HP
    }
}

export class MediumEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'player', 2, 0xFFD700); // Yellow/gold color, 2 HP
    }
}

export class StrongEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'player', 4, 0x8A2BE2); // Purple/violet color, 4 HP
    }
}

export class BossEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'player', 10, 0xFF0000); // Bright red color, 10 HP
        this.sprite.setScale(2); // Boss is bigger
        
        // Make boss move slower but more menacing
        this.setVelocityX(75);
    }

    update() {
        if (this.sprite && this.sprite.active) {
            if (this.getX() >= this.rightBound) {
                this.setVelocityX(-75);
            } else if (this.getX() <= this.leftBound) {
                this.setVelocityX(75);
            }
        }
    }
}

// Example usage:
/*
    // Create enemies
    const weakEnemy = new WeakEnemy(this, 200, 300);    // Dies in 1 hit
    const mediumEnemy = new MediumEnemy(this, 400, 300); // Dies in 2 hits
    const strongEnemy = new StrongEnemy(this, 600, 300); // Dies in 4 hits

    // Handle bullet collision
    this.physics.add.collider(bullet, enemy.sprite, () => {
        if (enemy.damage(1)) {
            // Enemy is dead
            enemy.destroy();
            // Add score or other effects
        }
    });
*/
