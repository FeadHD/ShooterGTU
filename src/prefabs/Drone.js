import Enemy from './Enemy.js';

export class Drone extends Enemy {
    constructor(scene, x, y, config = {}) {
        super(scene, x, y, {
            ...config,
            spriteKey: 'Bot1v1',
            maxHealth: 3,
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

        // Store reference to this enemy instance on the sprite
        if (this.sprite) {
            this.sprite.enemy = this;
        }

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
        if (!this.sprite || !this.isAlive) return;

        // Update health bar position
        this.updateHealthBar();

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
            // Check if there are walls between drone and player
            const ray = this.scene.raycaster.createRay({
                origin: {
                    x: this.sprite.x,
                    y: this.sprite.y
                }
            });

            // Get all platforms/walls in the scene
            const platforms = this.scene.platforms ? this.scene.platforms.getChildren() : [];
            
            // Check if ray hits any platform before reaching player
            const hasLineOfSight = !platforms.some(platform => {
                const bounds = platform.getBounds();
                return ray.cast({
                    x: this.scene.player.x,
                    y: this.scene.player.y,
                    obstacles: [{
                        x: bounds.x,
                        y: bounds.y,
                        width: bounds.width,
                        height: bounds.height
                    }]
                }).hasHit;
            });

            if (hasLineOfSight) {
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
                // Reset laser state if line of sight is blocked
                this.isLaserCharging = false;
                this.laserChargeDuration = 0;
                this.sprite.clearTint();
                if (this.laserLine) {
                    this.laserLine.destroy();
                    this.laserLine = null;
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

        // Calculate direction to player
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y,
            this.scene.player.x, this.scene.player.y
        );

        // Cast a ray to find the first collision point
        let endX = this.scene.player.x;
        let endY = this.scene.player.y;
        let hitWall = false;

        // Get all platforms/walls
        const platforms = this.scene.platforms ? this.scene.platforms.getChildren() : [];
        
        // Check each platform for intersection
        platforms.forEach(platform => {
            const bounds = platform.getBounds();
            const intersection = this.raycastLine(
                this.sprite.x, this.sprite.y,
                endX, endY,
                bounds.x, bounds.y,
                bounds.width, bounds.height
            );
            
            if (intersection) {
                hitWall = true;
                endX = intersection.x;
                endY = intersection.y;
            }
        });

        // Draw laser line only to the collision point
        this.laserLine = this.scene.add.graphics();
        this.laserLine.lineStyle(2, this.laserColor, 1);
        this.laserLine.beginPath();
        this.laserLine.moveTo(this.sprite.x, this.sprite.y);
        this.laserLine.lineTo(endX, endY);
        this.laserLine.strokePath();

        // Play laser sound if available
        if (this.scene.sound.get('laser')) {
            this.scene.sound.play('laser');
        }

        // Only damage player if laser reaches them
        if (!hitWall && this.scene.player.takeDamage) {
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

    raycastLine(x1, y1, x2, y2, rx, ry, rw, rh) {
        // Check intersection with each edge of the rectangle
        const edges = [
            { x1: rx, y1: ry, x2: rx + rw, y2: ry },         // Top
            { x1: rx + rw, y1: ry, x2: rx + rw, y2: ry + rh }, // Right
            { x1: rx, y1: ry + rh, x2: rx + rw, y2: ry + rh }, // Bottom
            { x1: rx, y1: ry, x2: rx, y2: ry + rh }          // Left
        ];

        let closestIntersection = null;
        let minDistance = Infinity;

        edges.forEach(edge => {
            const intersection = this.lineIntersection(
                x1, y1, x2, y2,
                edge.x1, edge.y1, edge.x2, edge.y2
            );

            if (intersection) {
                const distance = Phaser.Math.Distance.Between(x1, y1, intersection.x, intersection.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIntersection = intersection;
                }
            }
        });

        return closestIntersection;
    }

    lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denominator = ((x2 - x1) * (y4 - y3)) - ((y2 - y1) * (x4 - x3));
        if (denominator === 0) return null;

        const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
        const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;

        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
            return {
                x: x1 + (ua * (x2 - x1)),
                y: y1 + (ua * (y2 - y1))
            };
        }

        return null;
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