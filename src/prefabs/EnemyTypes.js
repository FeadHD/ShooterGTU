/**
 * EnemyTypes.js
 * Defines different enemy classes with varying attributes and behaviors
 * Implements a hierarchical enemy system from weak to boss enemies
 */

/**
 * Base Enemy class
 * Provides core functionality for all enemy types:
 * - Health and damage system
 * - Physics and collision handling
 * - AI behavior (patrol and chase)
 * - Visual feedback (health bars, hit effects)
 */
class Enemy {
    /**
     * Initialize enemy with core attributes and physics
     * @param {Phaser.Scene} scene - Current game scene
     * @param {number} x - Initial X position
     * @param {number} y - Initial Y position
     * @param {string} sprite - Sprite key for enemy
     * @param {number} health - Initial health points
     * @param {number} tint - Color tint for enemy sprite
     */
    constructor(scene, x, y, sprite, health, tint = 0xff0000) {
        this.scene = scene;
        
        // Position enemy above ground level
        const groundTop = scene.groundTop || (scene.scale.height - 100);
        y = groundTop - 24; // Ensure enemy spawns above ground
        
        // Create physics sprite if not handled by child class
        if (!this.sprite) {
            this.sprite = scene.add.rectangle(x, y, 32, 48, tint);
            scene.physics.add.existing(this.sprite);
            this.sprite.setScale(1);  // Consistent base scale
            this.sprite.enemy = this; // Reference for collision handling
        }
        
        // Health system initialization
        this.maxHealth = health;
        this.currentHealth = health;
        
        // Configure physics for movement and collisions
        if (this.sprite && this.sprite.body) {
            this.setupPhysics();
        }

        // AI behavior configuration
        this.setupBehavior();
        
        // Create health bar for non-boss enemies
        if (!(this instanceof BossEnemy)) {
            this.createHealthBar();
        }
    }

    /**
     * Creates and positions the health bar display
     * Scales with enemy size and updates with health changes
     */
    createHealthBar() {
        // Calculate display dimensions
        const displayWidth = this.sprite.width * this.sprite.scaleX;
        const displayHeight = this.sprite.height * this.sprite.scaleY;
        
        // Configure health bar size
        const healthBarWidth = displayWidth * 1.5; // Wider than enemy
        const healthBarHeight = Math.max(6, Math.floor(displayHeight * 0.08));
        const yOffset = displayHeight / 2 + healthBarHeight * 2;
        
        // Create background and foreground bars
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

    /**
     * Handle damage taken and update visual feedback
     * @param {number} amount - Damage amount to apply
     * @returns {boolean} True if enemy died from damage
     */
    damage(amount) {
        this.currentHealth -= amount;
        
        // Update health bar display
        const healthPercent = this.currentHealth / this.maxHealth;
        const baseWidth = this.healthBarBackground.width;
        this.healthBar.width = baseWidth * healthPercent;
        
        // Keep health bar centered
        this.healthBar.x = this.sprite.x;
        this.healthBarBackground.x = this.sprite.x;
        
        // Visual feedback for damage
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

    /**
     * Main update loop for enemy AI
     * Handles patrol behavior and player chase logic
     */
    update() {
        if (!this.sprite || !this.sprite.active) return;

        const player = this.scene.player;
        if (!player) return;

        // Update health bar position
        this.updateHealthBarPosition();

        // Calculate distance to player for AI
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x,
            this.sprite.y,
            player.x,
            player.y
        );

        // AI behavior: Chase or patrol
        if (distanceToPlayer < this.aggroRange) {
            this.chasePlayer(player);
        } else {
            this.patrol();
        }
    }

    /**
     * Clean up enemy resources
     * Removes health bars and sprite from scene
     */
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

    /**
     * Set up physics properties for the enemy
     * Configures collision, movement, and gravity settings
     * @private
     */
    setupPhysics() {
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setBounce(0.2);
        this.sprite.body.setFriction(1);
        this.sprite.body.setGravityY(800);       // Match world gravity
        this.sprite.body.setDragX(200);          // Smooth deceleration
        this.sprite.body.setMaxVelocity(300, 1000); // Speed limits
        
        // Optimize collision box
        this.sprite.body.setSize(28, 44);        // Slightly smaller than sprite
        this.sprite.body.setOffset(2, 2);        // Center alignment
    }

    /**
     * Configure AI behavior settings
     * Sets up patrol and chase parameters
     * @private
     */
    setupBehavior() {
        // Core behavior settings
        this.aggroRange = 300;    // Player detection range
        this.moveSpeed = 150;     // Chase speed
        this.patrolSpeed = 100;   // Patrol speed
        this.direction = 1;       // Initial direction (right)
        
        // Patrol boundaries
        this.leftBound = 20;      // Left scene margin
        this.rightBound = this.scene.scale.width - 20;  // Right scene margin
        
        // Start patrolling
        this.setVelocityX(this.patrolSpeed * this.direction);
    }

    /**
     * Update health bar position to follow enemy
     * Called every frame during update
     * @private
     */
    updateHealthBarPosition() {
        const enemyHeight = this.sprite.height * this.sprite.scaleY;
        const healthBarHeight = Math.max(6, Math.floor(enemyHeight * 0.08));
        const yOffset = enemyHeight / 2 + healthBarHeight * 2;
        
        // Sync position with enemy
        this.healthBarBackground.y = this.sprite.y - yOffset;
        this.healthBar.y = this.sprite.y - yOffset;
        this.healthBarBackground.x = this.sprite.x;
        this.healthBar.x = this.sprite.x;
    }

    /**
     * Chase behavior when player is in range
     * Moves enemy towards player on X axis
     * @param {Phaser.GameObjects.Sprite} player - Player to chase
     * @private
     */
    chasePlayer(player) {
        if (this.sprite.x < player.x) {
            this.setVelocityX(this.moveSpeed);
        } else {
            this.setVelocityX(-this.moveSpeed);
        }
    }

    /**
     * Patrol behavior when player is out of range
     * Moves enemy back and forth between boundaries
     * @private
     */
    patrol() {
        if (this.getX() >= this.rightBound || this.getX() <= this.leftBound) {
            this.reverseDirection();
        }
    }

    /**
     * Set X velocity for enemy movement
     * @param {number} velocity - X velocity to set
     */
    setVelocityX(velocity) { this.sprite.body.setVelocityX(velocity); }
    
    /**
     * Set Y velocity for enemy movement
     * @param {number} velocity - Y velocity to set
     */
    setVelocityY(velocity) { this.sprite.body.setVelocityY(velocity); }
    
    /**
     * Get current X position of enemy
     * @returns {number} Current X position
     */
    getX() { return this.sprite.x; }
    
    /**
     * Reverse patrol direction and update velocity
     */
    reverseDirection() {
        this.direction *= -1;
        this.setVelocityX(this.patrolSpeed * this.direction);
    }
}

/**
 * Weak Enemy - Fast but fragile
 * Yellow-tinted enemy with low health
 */
class WeakEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'weak_enemy', 1, 0xffff00);
        this.moveSpeed = 100;
        this.patrolSpeed = 75;
    }
}

/**
 * Medium Enemy - Balanced stats
 * Cyan-tinted enemy with moderate health and speed
 */
class MediumEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'player', 2, 0x00ffff);
        this.aggroRange = 300;
        this.moveSpeed = 140;
    }
}

/**
 * Strong Enemy - Tough and aggressive
 * Magenta-tinted enemy with high health
 */
class StrongEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'strong_enemy', 3, 0xff00ff);
        this.moveSpeed = 150;
        this.patrolSpeed = 100;
    }
}

/**
 * Boss Enemy - Unique behaviors and high stats
 * Large red enemy with special physics properties
 */
class BossEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'boss_enemy', 5, 0xff0000);
        
        // Enhanced physical presence
        this.sprite.setScale(2);
        this.sprite.body.setSize(32, 46);
        this.sprite.body.setOffset(0, 1);
        this.sprite.body.setGravityY(2000);
        this.sprite.body.setMass(2);
        
        // Create custom-sized health bar
        this.createHealthBar();
        
        // Aggressive behavior settings
        this.aggroRange = 400;
        this.moveSpeed = 200;
        this.patrolSpeed = 75;
        
        // Ensure proper ground positioning
        const groundTop = scene.groundTop || (scene.scale.height - 100);
        this.sprite.y = groundTop - (46 * this.sprite.scale);
    }
}

export { Enemy, WeakEnemy, MediumEnemy, StrongEnemy, BossEnemy };
