class Drone {
    constructor(scene, x, y, config = {}) {
        // Basic drone properties
        this.scene = scene;
        this.x = x;
        this.y = y;

        // Health and damage configuration
        this.maxHealth = config.maxHealth || 50;
        this.currentHealth = this.maxHealth;
        this.damage = config.damage || 15;

        // Flying drone-specific properties
        this.flyingHeight = config.flyingHeight || 100;
        this.horizontalMovementRange = config.horizontalMovementRange || 50;
        this.laserColor = config.laserColor || 0xff0000; // Red laser

        // Movement and behavior
        this.speed = config.speed || 75;
        this.isAlive = true;

        // Drone type
        this.type = 'flying';

        // Laser properties
        this.laserRange = 500; // Maximum laser range
        this.laserChargeTime = 2000; // 2 seconds to fully charge
        this.laserChargeDuration = 0;
        this.isLaserCharging = false;
        this.laserLine = null;

        // Sprite configuration
        this.sprite = null;
        this.initializeSprite('Bot1v1');

        // Health bar configuration
        this.healthBar = null;
    }

    initializeSprite(spriteKey = 'Bot1v1') {
        // Create drone sprite with flying capabilities
        this.sprite = this.scene.physics.add.sprite(this.x, this.y, spriteKey);
        
        // Configure drone physics for flying
        this.sprite.setCollideWorldBounds(true);
        this.sprite.body.setAllowGravity(false); // Disable gravity for flying

        // Set sprite to 32x32
        this.sprite.setDisplaySize(32, 32);

        // Create health bar
        this.createHealthBar();
    }

    createHealthBar() {
        if (!this.sprite) return;

        // Create health bar background
        const barWidth = 32;
        const barHeight = 4;
        
        this.healthBar = this.scene.add.graphics();
        this.updateHealthBar();
    }

    updateHealthBar() {
        if (!this.healthBar || !this.sprite) return;

        // Clear previous health bar
        this.healthBar.clear();

        // Calculate health percentage
        const healthPercentage = this.currentHealth / this.maxHealth;

        // Health bar background (dark)
        this.healthBar.fillStyle(0x000000, 0.5);
        this.healthBar.fillRect(
            this.sprite.x - 16, 
            this.sprite.y - 20, 
            32, 
            4
        );

        // Health bar foreground (green to red)
        let barColor = 0x00ff00; // Green when healthy
        if (healthPercentage < 0.3) barColor = 0xff0000; // Red when low health
        else if (healthPercentage < 0.6) barColor = 0xffff00; // Yellow when medium health

        // Specific color for slime-like health bar
        barColor = 0x00ff00; // Bright green

        this.healthBar.fillStyle(barColor, 1);
        this.healthBar.fillRect(
            this.sprite.x - 16, 
            this.sprite.y - 20, 
            32 * healthPercentage, 
            4
        );
    }

    fireLaser(targetX, targetY) {
        if (!this.isAlive) return;

        // Calculate distance to player
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x, 
            this.sprite.y, 
            targetX, 
            targetY
        );

        // Only fire if player is within laser range
        if (distanceToPlayer <= this.laserRange) {
            // Start charging laser
            this.isLaserCharging = true;
            this.laserChargeDuration = 0;

            // Remove previous laser if exists
            if (this.laserLine) {
                this.laserLine.destroy();
            }

            // Create initial laser line
            this.laserLine = this.scene.add.line(
                this.sprite.x, 
                this.sprite.y, 
                this.sprite.x, 
                this.sprite.y, 
                targetX, 
                targetY, 
                this.laserColor
            );

            // Set laser properties
            this.laserLine.setLineWidth(2);
            this.laserLine.setAlpha(0.5);
        }
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
        }
        
        // Add explosion or destruction effect
        if (this.sprite) {
            // Optional: Add explosion animation
            this.sprite.destroy();
        }
    }

    move(targetX, targetY) {
        if (!this.isAlive) return;

        // Advanced flying movement with horizontal oscillation
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        
        // Maintain flying height and add horizontal movement variation
        const oscillation = Math.sin(this.scene.time.now * 0.001) * this.horizontalMovementRange;
        
        if (this.sprite) {
            // Use setVelocity for movement
            this.sprite.setVelocity(
                Math.cos(angle) * this.speed + oscillation, 
                Math.sin(angle) * this.speed
            );

            // Maintain a consistent flying height
            this.sprite.y = this.flyingHeight;
        }
    }

    update(time, delta) {
        // Ensure drone stays at flying height
        if (this.sprite) {
            this.sprite.y = this.flyingHeight;
        }

        // Update health bar position
        if (this.isAlive) {
            this.updateHealthBar();
        }

        // Laser charging mechanism
        if (this.isLaserCharging && this.laserLine) {
            this.laserChargeDuration += delta;

            // Calculate charge progress (0 to 1)
            const chargeProgress = Math.min(this.laserChargeDuration / this.laserChargeTime, 1);

            // Update laser line length based on charge progress
            if (this.laserLine) {
                const targetX = this.laserLine.getData('endX');
                const targetY = this.laserLine.getData('endY');

                // Interpolate laser line length
                const currentEndX = Phaser.Math.Linear(this.sprite.x, targetX, chargeProgress);
                const currentEndY = Phaser.Math.Linear(this.sprite.y, targetY, chargeProgress);

                this.laserLine.setTo(
                    this.sprite.x, 
                    this.sprite.y, 
                    currentEndX, 
                    currentEndY
                );

                // Adjust laser opacity based on charge
                this.laserLine.setAlpha(0.5 + (chargeProgress * 0.5));

                // Complete laser charging
                if (chargeProgress >= 1) {
                    this.isLaserCharging = false;
                    
                    // Optional: Add laser damage or effect here
                    this.scene.events.emit('drone-laser-fired', {
                        startX: this.sprite.x,
                        startY: this.sprite.y,
                        endX: targetX,
                        endY: targetY,
                        damage: this.damage
                    });
                }
            }
        }

        // Optional: Advanced drone behavior update
        if (this.isAlive) {
            // Example: Periodic laser firing
            if (Math.random() < 0.02) { // 2% chance each update
                this.fireLaser(this.scene.player.x, this.scene.player.y);
            }
        }
    }
}

export default Drone;
