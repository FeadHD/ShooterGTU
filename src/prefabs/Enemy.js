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

        // Create health bar
        this.createHealthBar();
    }

    initializeSprite(spriteKey = 'enemy') {
        // Only create sprite if it doesn't exist
        if (!this.sprite) {
            // Create sprite in the scene with initial position
            this.sprite = this.scene.physics.add.sprite(this.x, this.y, spriteKey);
            
            // Configure sprite physics
            if (this.sprite.body) {
                this.sprite.setCollideWorldBounds(true);
                
                // Set up basic physics properties
                this.sprite.body.setBounce(0.2);
                this.sprite.body.setDrag(200, 0);
                
                // If this is a flying type, disable gravity
                if (this.type === 'flying') {
                    this.sprite.body.setAllowGravity(false);
                    this.sprite.body.setGravity(0, 0);
                }
            }
        }
    }

    createHealthBar() {
        if (!this.sprite) return;

        // Create health bar background
        this.healthBarBackground = this.scene.add.graphics();
        this.healthBarBackground.fillStyle(0x000000, 0.5);
        this.healthBarBackground.fillRect(0, 0, 32, 4);

        // Create health bar foreground
        this.healthBar = this.scene.add.graphics();

        // Update initial health bar
        this.updateHealthBar();
    }

    updateHealthBar() {
        if (!this.healthBar || !this.healthBarBackground || !this.sprite) return;

        // Clear previous health bars
        this.healthBar.clear();
        this.healthBarBackground.clear();

        // Health bar background (dark)
        this.healthBarBackground.fillStyle(0x000000, 0.5);
        this.healthBarBackground.fillRect(
            this.sprite.x - 16, 
            this.sprite.y - 20, 
            32, 
            4
        );

        // Calculate health percentage
        const healthPercentage = this.currentHealth / this.maxHealth;

        // Health bar color (slime-like green)
        const barColor = 0x00ff00;

        // Draw health bar foreground
        this.healthBar.fillStyle(barColor, 1);
        this.healthBar.fillRect(
            this.sprite.x - 16, 
            this.sprite.y - 20, 
            32 * healthPercentage, 
            4
        );
    }

    takeDamage(amount) {
        this.currentHealth -= amount;
        
        // Update health bar
        this.updateHealthBar();
        
        if (this.currentHealth <= 0) {
            this.die();
        }
    }

    die() {
        this.isAlive = false;
        
        // Destroy health bar
        if (this.healthBar) {
            this.healthBar.destroy();
            this.healthBarBackground.destroy();
        }
        
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
        // Update health bar position if alive
        if (this.isAlive && this.sprite) {
            this.updateHealthBar();
        }
    }
}

export default Enemy;
