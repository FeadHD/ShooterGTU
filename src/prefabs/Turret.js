export class Turret extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, direction = 'right', rotation = 'floor') {
        // Create base texture if it doesn't exist
        if (!scene.textures.exists('turret_base')) {
            const graphics = scene.add.graphics();
            
            // Draw half-circle housing with metallic appearance
            graphics.lineStyle(2, 0x2d4f1e); // Dark border
            graphics.fillStyle(0x5a6f4d); // Metallic green
            
            // Main housing shape
            graphics.beginPath();
            graphics.arc(16, 16, 16, Math.PI, 0, false);
            graphics.closePath();
            graphics.fillPath();
            graphics.strokePath();
            
            // Inner shading for metallic look
            graphics.lineStyle(1, 0x2d4f1e, 0.5);
            graphics.beginPath();
            graphics.arc(16, 16, 14, Math.PI, 0, false);
            graphics.strokePath();
            
            // Top highlight
            graphics.lineStyle(1, 0x6a7f5d, 0.5);
            graphics.beginPath();
            graphics.arc(16, 16, 15, Math.PI, 0, false);
            graphics.strokePath();
            
            // Add mounting screws
            graphics.fillStyle(0x333333);
            graphics.fillCircle(6, 16, 2);  // Left screw
            graphics.fillCircle(26, 16, 2); // Right screw
            
            graphics.generateTexture('turret_base', 32, 32);
            graphics.destroy();
        }

        // Create mini laser texture if it doesn't exist
        if (!scene.textures.exists('mini_laser')) {
            const graphics = scene.add.graphics();
            
            // Small, bright laser dot
            graphics.fillStyle(0xff0000);
            graphics.fillCircle(2, 2, 2);
            
            // Add glow effect
            graphics.lineStyle(1, 0xff3333, 0.5);
            graphics.strokeCircle(2, 2, 3);
            
            graphics.generateTexture('mini_laser', 4, 4);
            graphics.destroy();
        }

        // Initialize sprite with base texture
        super(scene, x, y, 'turret_base');
        scene.add.existing(this);

        // Store properties
        this.mountRotation = rotation;
        this.direction = direction === 'right' ? 1 : -1;
        
        // Create gun and targeting system
        this.gun = scene.add.sprite(x, y, 'turret_base');
        this.gun.setScale(0.5);
        this.gun.setTint(0x333333);
        
        // Create laser group
        this.lasers = scene.add.group();
        
        // Shooting properties
        this.detectionRange = 250;
        this.shootDelay = 100; // Time between shots
        this.nextShootTime = 0;
        this.spreadAngle = Math.PI / 6; // 30 degrees spread
        this.numLasers = 3; // Number of lasers per shot
        this.laserSpeed = 150; // Slower velocity
        
        // Alarm state
        this.isActive = false;
        this.activationDelay = 500; // Time before turret starts shooting after alarm
        this.activationTime = 0;
        
        // Position based on rotation
        switch(rotation) {
            case 'floor':
                this.angle = 0;
                this.gun.y = y + 16;
                break;
            case 'ceiling':
                this.angle = 180;
                this.gun.y = y - 16;
                break;
            case 'leftWall':
                this.angle = 90;
                this.gun.x = x + 16;
                break;
            case 'rightWall':
                this.angle = -90;
                this.gun.x = x - 16;
                break;
        }

        // Flip if facing left
        if (direction === 'left') {
            this.setFlipX(true);
            this.gun.setFlipX(true);
        }

        // Listen for alarm event
        scene.events.on('alarmTriggered', this.onAlarmTriggered, this);
        scene.events.on('alarmReset', this.onAlarmReset, this);
    }

    onAlarmTriggered() {
        this.isActive = true;
        this.activationTime = this.scene.time.now + this.activationDelay;
        
        // Flash red when activated
        this.scene.tweens.add({
            targets: [this, this.gun],
            tint: 0xff0000,
            duration: 200,
            yoyo: true,
            repeat: 2
        });
    }

    onAlarmReset() {
        this.isActive = false;
        this.setTint(0xffffff);
        this.gun.setTint(0x333333);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        // Update gun position
        this.gun.x = this.x;
        this.gun.y = this.y;
        
        // Only process if alarm is triggered and activation delay has passed
        if (!this.isActive || time < this.activationTime) return;
        
        // Get player reference and check if active
        const player = this.scene.player;
        if (!player || !player.active) return;

        // Calculate angle to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if player is in range
        if (distance < this.detectionRange) {
            // Calculate base angle to player
            let targetAngle = Math.atan2(dy, dx);
            
            // Shoot if enough time has passed
            if (time > this.nextShootTime) {
                this.shootLasers(targetAngle);
                this.nextShootTime = time + this.shootDelay;
            }
        }
    }

    shootLasers(baseAngle) {
        // Calculate spread between lasers
        const spreadStep = this.spreadAngle / (this.numLasers - 1);
        
        // Create multiple lasers with spread
        for (let i = 0; i < this.numLasers; i++) {
            // Calculate angle with spread and random variation
            const spreadOffset = -this.spreadAngle/2 + (spreadStep * i);
            const randomSpread = (Math.random() - 0.5) * (Math.PI / 12); // ±15 degrees random variation
            const angle = baseAngle + spreadOffset + randomSpread;
            
            // Create laser sprite
            const laser = this.scene.physics.add.sprite(this.x, this.y, 'mini_laser');
            
            if (laser) {
                laser.setActive(true);
                laser.setVisible(true);
                
                // Set physics properties
                laser.body.setCircle(2);
                laser.body.allowGravity = false;
                
                // Add random speed variation
                const speedVariation = Math.random() * 50 - 25; // ±25 speed variation
                const finalSpeed = this.laserSpeed + speedVariation;
                
                // Set velocity with spread
                laser.setVelocity(
                    Math.cos(angle) * finalSpeed,
                    Math.sin(angle) * finalSpeed
                );
                
                // Add to group and destroy after 2 seconds
                this.lasers.add(laser);
                this.scene.time.delayedCall(2000, () => {
                    if (laser.active) {
                        laser.destroy();
                    }
                });
            }
        }
    }

    destroy() {
        // Clean up event listeners
        this.scene.events.off('alarmTriggered', this.onAlarmTriggered, this);
        this.scene.events.off('alarmReset', this.onAlarmReset, this);
        
        this.gun.destroy();
        super.destroy();
    }
}
