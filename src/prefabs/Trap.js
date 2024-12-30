import Phaser from 'phaser';

class Trap extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        
        // Add to scene
        scene.add.existing(this);
        
        // Set up physics body size
        this.setSize(32, 5);
        
        // Create visible graphics
        const graphics = scene.add.graphics();
        graphics.lineStyle(2, 0xff0000);
        graphics.strokeRect(-16, -2.5, 32, 5);  // Center the graphics
        graphics.fillStyle(0xff0000, 0.5);
        graphics.fillRect(-16, -2.5, 32, 5);    // Center the graphics
        this.add(graphics);

        // Initialize damage properties
        this.lastDamageTime = 0;
        this.damageInterval = 1000; // 1 second in milliseconds
        this.damageAmount = 5;
    }

    damagePlayer(player) {
        const currentTime = this.scene.time.now;
        
        // Check if enough time has passed since last damage
        if (currentTime - this.lastDamageTime >= this.damageInterval) {
            // Update last damage time
            this.lastDamageTime = currentTime;
            
            // Apply damage
            player.damage(this.damageAmount);
            
            // Flash the player red
            player.flash(0xff0000);
        }
    }
}

export { Trap };
