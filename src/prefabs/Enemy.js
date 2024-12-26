class Enemy {
    constructor(scene, x, y, config = {}) {
        // Basic enemy properties
        this.scene = scene;
        this.x = x;
        this.y = y;

        // Health and damage configuration
        this.maxHealth = config.maxHealth || 100;
        this.currentHealth = this.maxHealth;
        this.damage = config.damage || 10;

        // Movement and behavior
        this.speed = config.speed || 50;
        this.isAlive = true;

        // Enemy type or variant
        this.type = config.type || 'basic';

        // Optional sprite or game object configuration
        this.sprite = null;
        this.initializeSprite(config.spriteKey);
    }

    initializeSprite(spriteKey = 'enemy') {
        // Create sprite in the scene with initial position
        this.sprite = this.scene.physics.add.sprite(this.x, this.y, spriteKey);
        
        // Optional: Configure sprite physics
        this.sprite.setCollideWorldBounds(true);
    }

    takeDamage(amount) {
        this.currentHealth -= amount;
        
        if (this.currentHealth <= 0) {
            this.die();
        }
    }

    die() {
        this.isAlive = false;
        
        // Optional: Add death animation or effects
        if (this.sprite) {
            this.sprite.destroy();
        }
    }

    move(targetX, targetY) {
        if (!this.isAlive) return;

        // Basic movement towards a target
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        
        // Update sprite velocity based on angle and speed
        if (this.sprite) {
            this.sprite.setVelocity(
                Math.cos(angle) * this.speed, 
                Math.sin(angle) * this.speed
            );
        }
    }

    attack(target) {
        // Basic attack method
        if (!this.isAlive) return;

        // Optional: Implement attack logic
        console.log(`Enemy attacking with ${this.damage} damage`);
    }

    update(time, delta) {
        // Optional: Update method for complex enemy behavior
        // Can be overridden by specific enemy types
    }
}

export default Enemy;
