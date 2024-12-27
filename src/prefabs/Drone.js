import Enemy from './Enemy.js';

export class Drone extends Enemy {
    constructor(scene, x, y, config = {}) {
        super(scene, x, y, {
            ...config,
            spriteKey: 'Bot1v1',
            maxHealth: config.maxHealth || 75,
            damage: config.damage || 20
        });

        // Movement properties
        this.speed = config.speed || 100;
        this.flyingHeight = config.flyingHeight || 100;
        this.horizontalMovementRange = config.horizontalMovementRange || 50;
        
        // Weapon properties
        this.laserColor = config.laserColor || 0xff0000;
        this.laserRange = 500;
        this.laserChargeTime = 2000;
        this.laserChargeDuration = 0;
        this.isLaserCharging = false;
        this.laserLine = null;
        this.type = 'flying';

        // Patrol properties
        this.patrolPoints = config.patrolPoints || [
            { x: x - 200, y: this.flyingHeight },
            { x: x + 200, y: this.flyingHeight }
        ];
        this.currentPatrolIndex = 0;
        this.patrolWaitTime = config.patrolWaitTime || 2000;
        this.lastPatrolPointReached = 0;
        this.isWaiting = false;

        // Debug graphics
        this.debugGraphics = null;

        // Set up flying properties once sprite is created
        this.scene.time.addEvent({
            delay: 100,
            callback: () => this.setupFlyingProperties(),
            callbackScope: this
        });
    }

    setupFlyingProperties() {
        if (this.sprite && this.sprite.body) {
            this.sprite.body.setAllowGravity(false);
            this.sprite.body.setGravity(0, 0);
            this.sprite.body.setVelocityY(0);
            this.sprite.y = this.flyingHeight;
            
            // Set up initial position at flying height
            this.sprite.setPosition(this.sprite.x, this.flyingHeight);
            
            // Update patrol points to match flying height
            this.patrolPoints = this.patrolPoints.map(point => ({
                ...point,
                y: this.flyingHeight
            }));
        } else {
            // If sprite isn't ready yet, try again in the next frame
            this.scene.time.addEvent({
                delay: 100,
                callback: () => this.setupFlyingProperties(),
                callbackScope: this,
                loop: false
            });
        }
    }

    updateDebugPath() {
        // Check if debug is enabled through the scene's debug system
        const debugEnabled = this.scene.debugSystem?.enabled;
        
        if (debugEnabled) {
            if (!this.debugGraphics) {
                this.debugGraphics = this.scene.add.graphics();
            }
            
            this.debugGraphics.clear();

            // Draw laser range circle
            if (this.sprite) {
                this.debugGraphics.lineStyle(2, 0xff0000, 0.5);  // Red color with 0.5 alpha
                this.debugGraphics.strokeCircle(this.sprite.x, this.sprite.y, this.laserRange);
            }
            
            // Draw patrol path
            this.debugGraphics.lineStyle(2, 0x00ff00, 1);
            
            // Draw lines between patrol points
            for (let i = 0; i < this.patrolPoints.length; i++) {
                const startPoint = this.patrolPoints[i];
                const endPoint = this.patrolPoints[(i + 1) % this.patrolPoints.length];
                
                this.debugGraphics.beginPath();
                this.debugGraphics.moveTo(startPoint.x, startPoint.y);
                this.debugGraphics.lineTo(endPoint.x, endPoint.y);
                this.debugGraphics.strokePath();
                
                // Draw points
                this.debugGraphics.fillStyle(0xff0000, 1);
                this.debugGraphics.fillCircle(startPoint.x, startPoint.y, 5);
            }
        } else if (this.debugGraphics) {
            // If debug is disabled and graphics exist, destroy them
            this.debugGraphics.destroy();
            this.debugGraphics = null;
        }
    }

    update() {
        if (!this.isAlive || !this.sprite) return;

        // Update debug visualization
        this.updateDebugPath();

        // Check for player in range and shoot laser
        this.checkAndShootLaser();

        // Only handle patrol movement
        this.move();
    }

    move() {
        if (!this.isAlive || !this.sprite) return;

        const currentTarget = this.patrolPoints[this.currentPatrolIndex];
        const distanceToTarget = Phaser.Math.Distance.Between(
            this.sprite.x,
            this.sprite.y,
            currentTarget.x,
            currentTarget.y
        );

        // Check if reached patrol point
        if (distanceToTarget < 10) {
            if (!this.isWaiting) {
                this.isWaiting = true;
                this.lastPatrolPointReached = this.scene.time.now;
                this.sprite.setVelocity(0, 0);
                return;
            }

            // Check if wait time is over
            if (this.scene.time.now - this.lastPatrolPointReached >= this.patrolWaitTime) {
                this.isWaiting = false;
                this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            }
            return;
        }

        // Move towards patrol point if not waiting
        if (!this.isWaiting) {
            const angle = Math.atan2(
                currentTarget.y - this.sprite.y,
                currentTarget.x - this.sprite.x
            );

            const velocityX = Math.cos(angle) * this.speed;
            const velocityY = Math.sin(angle) * this.speed;

            this.sprite.setVelocity(velocityX, velocityY);
            
            // Maintain flying height
            if (Math.abs(this.sprite.y - this.flyingHeight) > 5) {
                const heightDiff = this.flyingHeight - this.sprite.y;
                this.sprite.setVelocityY(Math.sign(heightDiff) * this.speed);
            }
            
            // Face movement direction
            this.sprite.flipX = velocityX < 0;
        }
    }

    checkAndShootLaser() {
        if (!this.sprite || !this.scene.player) return;

        // Calculate distance to player
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x,
            this.sprite.y,
            this.scene.player.x,
            this.scene.player.y
        );

        // Check if player is in range
        if (distanceToPlayer <= this.laserRange) {
            if (!this.isLaserCharging) {
                // Start charging laser
                this.isLaserCharging = true;
                this.laserChargeDuration = 0;
                
                // Create charging effect (red glow)
                this.sprite.setTint(0xff0000);
            } else {
                // Increment charge duration
                this.laserChargeDuration += this.scene.game.loop.delta;

                // Check if laser is fully charged
                if (this.laserChargeDuration >= this.laserChargeTime) {
                    this.shootLaser();
                    this.isLaserCharging = false;
                    this.laserChargeDuration = 0;
                }
            }
        } else {
            // Reset laser state when player is out of range
            this.isLaserCharging = false;
            this.laserChargeDuration = 0;
            this.sprite.clearTint();
            if (this.laserLine) {
                this.laserLine.destroy();
                this.laserLine = null;
            }
        }
    }

    shootLaser() {
        if (!this.sprite || !this.scene.player) return;

        // Create laser line effect
        if (this.laserLine) {
            this.laserLine.destroy();
        }

        this.laserLine = this.scene.add.graphics();
        this.laserLine.lineStyle(2, this.laserColor, 1);
        this.laserLine.beginPath();
        this.laserLine.moveTo(this.sprite.x, this.sprite.y);
        this.laserLine.lineTo(this.scene.player.x, this.scene.player.y);
        this.laserLine.strokePath();

        // Play laser sound if available
        if (this.scene.sound.get('laser')) {
            this.scene.sound.play('laser');
        }

        // Damage player
        if (this.scene.player.takeDamage) {
            this.scene.player.takeDamage(this.damage);
        }

        // Clear laser after a short delay
        this.scene.time.delayedCall(100, () => {
            if (this.laserLine) {
                this.laserLine.destroy();
                this.laserLine = null;
            }
            this.sprite.clearTint();
        });
    }

    setPatrolPath(points) {
        this.patrolPoints = points.map(point => ({
            x: point.x,
            y: point.y || this.flyingHeight
        }));
        this.currentPatrolIndex = 0;
        this.updateDebugPath();
    }
}

export default Drone;