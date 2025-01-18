/**
 * Base Enemy Class
 * Provides core functionality for all enemy types in the game
 * Handles health, movement, attacks, and visual representation
 */
class Enemy {
    /**
     * Create a new enemy instance
     * @param {Phaser.Scene} scene - The scene this enemy belongs to
     * @param {number} x - Initial X position
     * @param {number} y - Initial Y position
     * @param {Object} config - Enemy configuration options
     */
    constructor(scene, x, y, config = {}) {
        // Core properties
        this.scene = scene;
        this.x = x;
        this.y = y;

        // Combat attributes
        this.maxHealth = config.maxHealth || 100;
        this.currentHealth = this.maxHealth;
        this.damage = config.damage || 10;

        // Behavior settings
        this.speed = config.speed || 50;
        this.isAlive = true;
        this.type = config.type || 'basic';

        // Visual components
        this.sprite = null;
        this.initializeSprite(config.spriteKey);
        this.createHealthBar();
    }

    /**
     * Initialize the enemy's sprite and physics
     * @param {string} spriteKey - Key for the sprite texture
     * @private
     */
    initializeSprite(spriteKey = 'enemy') {
        if (!this.sprite) {
            // Create physics-enabled sprite
            this.sprite = this.scene.physics.add.sprite(this.x, this.y, spriteKey);
            
            if (this.sprite.body) {
                // Configure physics properties
                this.sprite.setCollideWorldBounds(true);
                this.sprite.body.setBounce(0.2);
                this.sprite.body.setDrag(200, 0);
                
                // Special handling for flying enemies
                if (this.type === 'flying') {
                    this.sprite.body.setAllowGravity(false);
                    this.sprite.body.setGravity(0, 0);
                }
            }
        }
    }

    /**
     * Create health bar visual elements
     * Displays current health as a green bar above enemy
     * @private
     */
    createHealthBar() {
        if (!this.sprite) return;

        // Background bar (black)
        this.healthBarBackground = this.scene.add.graphics();
        this.healthBarBackground.fillStyle(0x000000, 0.5);
        this.healthBarBackground.fillRect(0, 0, 32, 4);

        // Foreground bar (green)
        this.healthBar = this.scene.add.graphics();
        this.updateHealthBar();
    }

    /**
     * Update health bar position and fill amount
     * Called when health changes or enemy moves
     * @private
     */
    updateHealthBar() {
        if (!this.healthBar || !this.healthBarBackground || !this.sprite) return;

        // Reset graphics
        this.healthBar.clear();
        this.healthBarBackground.clear();

        // Draw background bar
        this.healthBarBackground.fillStyle(0x000000, 0.5);
        this.healthBarBackground.fillRect(
            this.sprite.x - 16, 
            this.sprite.y - 20, 
            32, 
            4
        );

        // Calculate and draw health percentage
        const healthPercentage = this.currentHealth / this.maxHealth;
        const barColor = 0x00ff00;
        this.healthBar.fillStyle(barColor, 1);
        this.healthBar.fillRect(
            this.sprite.x - 16, 
            this.sprite.y - 20, 
            32 * healthPercentage, 
            4
        );
    }

    /**
     * Handle enemy taking damage
     * Updates health and triggers death if health reaches 0
     * @param {number} amount - Amount of damage to take
     */
    takeDamage(amount) {
        this.currentHealth -= amount;
        this.updateHealthBar();
        
        if (this.currentHealth <= 0) {
            this.die();
        }
    }

    /**
     * Handle enemy death
     * Cleans up sprites and visual elements
     */
    die() {
        this.isAlive = false;
        
        // Clean up visual elements
        if (this.healthBar) {
            this.healthBar.destroy();
            this.healthBarBackground.destroy();
        }
        
        if (this.sprite) {
            this.sprite.destroy();
        }
    }

    /**
     * Move enemy towards a target position
     * @param {number} targetX - Target X coordinate
     * @param {number} targetY - Target Y coordinate
     */
    move(targetX, targetY) {
        if (!this.isAlive) return;

        // Calculate movement angle
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        
        // Apply velocity
        if (this.sprite) {
            this.sprite.setVelocity(
                Math.cos(angle) * this.speed, 
                Math.sin(angle) * this.speed
            );
        }
    }

    /**
     * Basic attack implementation
     * Override in subclasses for specific behavior
     * @param {Object} target - Target to attack
     */
    attack(target) {
        if (!this.isAlive) return;
        console.log(`Enemy attacking with ${this.damage} damage`);
    }

    /**
     * Update loop for enemy behavior
     * @param {number} time - Current time
     * @param {number} delta - Time since last update
     */
    update(time, delta) {
        if (this.isAlive && this.sprite) {
            this.updateHealthBar();
        }
    }
}

export default Enemy;
