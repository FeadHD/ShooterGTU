import Enemy from './Enemy';
import { PlatformPathFinder } from '../modules/pathfinding/PathFinder';

class MeleeWarrior extends Enemy {
    constructor(scene, x, y, config = {}) {
        super(scene, x, y, {
            ...config,
            spriteKey: 'enemymeleewarrior_IDLE',
            maxHealth: 3,
            damage: config.damage || 30,
            type: 'ground'
        });

        // Health is handled by parent Enemy class, no need to set it here

        // Movement properties
        this.speed = config.speed || 150;
        this.detectionRange = config.detectionRange || 300;
        this.attackRange = config.attackRange || 50;
        this.attackCooldown = config.attackCooldown || 1000;
        this.lastAttackTime = 0;
        this.isAttacking = false;
        this.direction = 1;

        // Auto movement properties
        this.startTime = null;  // Will be set when movement begins
        this.moveTime = 60000; // 1 minute in milliseconds
        this.idleTime = 10000; // 10 seconds in milliseconds
        this.isMoving = false;  // Start as not moving
        this.jumpForce = -400;
        this.jumpCooldown = 1000; // 1 second between jumps
        this.lastJumpTime = 0;
        this.movementStarted = false;  // New flag to track if movement has started

        // Pathfinding properties
        this.pathFinder = new PlatformPathFinder(scene);
        this.currentPath = null;
        this.pathUpdateCooldown = 5000; // Increased to 5 seconds
        this.lastPathUpdate = 0;
        this.currentPathIndex = 0;
        this.gridInitialized = false;
        this.directMovementRange = 150; // Increased range for direct movement

        // Initialize pathfinding grid only once after the scene is fully created
        this.scene.events.once('create', () => {
            if (!this.gridInitialized) {
                this.pathFinder.initializeGrid();
                this.gridInitialized = true;
            }
        });

        // Set up sprite data
        if (this.sprite) {
            this.sprite.setData('type', 'warrior');
            this.sprite.setData('health', this.currentHealth);
            this.sprite.setData('maxHealth', this.maxHealth);
            this.sprite.setData('speed', this.speed);
            this.sprite.setData('detectionRange', this.detectionRange);
            this.sprite.setData('attackRange', this.attackRange);
            this.sprite.setData('isAttacking', this.isAttacking);
            this.sprite.setData('warrior', this);
        }

        // Adjust sprite size and physics body
        if (this.sprite) {
            const targetHeight = 128;
            const scale = targetHeight / this.sprite.height;
            const scaledWidth = this.sprite.width * scale;
            this.sprite.setDisplaySize(scaledWidth, targetHeight);
            
            this.sprite.body.setCollideWorldBounds(true);
            this.sprite.body.setBounce(0.2);
            this.sprite.body.setDrag(200);
            
            this.sprite.body.setSize(32, 32);
            const offsetX = 32;
            const offsetY = 28;
            this.sprite.body.setOffset(offsetX, offsetY);
            
            if (this.scene.enemies) {
                this.scene.enemies.add(this.sprite);
            }
        }
    }

    update(time, delta) {
        if (!this.sprite || !this.sprite.active) return;

        // Initialize movement if not started
        if (!this.movementStarted) {
            this.startTime = Date.now();
            this.movementStarted = true;
            this.isMoving = true;
        }

        const currentTime = Date.now();
        const player = this.scene.player;
        
        // Check if player is in detection range
        const distanceToPlayer = player ? 
            Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, player.x, player.y) : 
            Infinity;
        
        if (player && distanceToPlayer < this.detectionRange) {
            // Player detected - use pathfinding
            if (currentTime - this.lastPathUpdate > this.pathUpdateCooldown) {
                // Initialize grid if not done
                if (!this.gridInitialized) {
                    this.pathFinder.initializeGrid();
                    this.gridInitialized = true;
                }
                
                // Simple direct movement if path not found or too close
                if (distanceToPlayer < this.directMovementRange) {
                    // Move directly towards player
                    const angle = Phaser.Math.Angle.Between(
                        this.sprite.x,
                        this.sprite.y,
                        player.x,
                        player.y
                    );
                    this.sprite.setVelocityX(Math.cos(angle) * this.speed);
                    this.direction = Math.cos(angle) > 0 ? 1 : -1;
                    this.sprite.flipX = this.direction < 0;
                } else {
                    // Update path to player less frequently
                    this.currentPath = this.pathFinder.findPath(
                        this.sprite.x,
                        this.sprite.y,
                        player.x,
                        player.y
                    );
                    this.lastPathUpdate = currentTime;
                    this.currentPathIndex = 0;
                }
            }

            // Follow path if exists
            if (this.currentPath && this.currentPath.length > 0) {
                const targetPoint = this.currentPath[this.currentPathIndex];
                const distanceToPoint = Phaser.Math.Distance.Between(
                    this.sprite.x,
                    this.sprite.y,
                    targetPoint.x,
                    targetPoint.y
                );

                // Move towards current path point
                if (distanceToPoint > 5) {
                    const angle = Phaser.Math.Angle.Between(
                        this.sprite.x,
                        this.sprite.y,
                        targetPoint.x,
                        targetPoint.y
                    );
                    this.sprite.setVelocityX(Math.cos(angle) * this.speed);
                    
                    // Update sprite direction
                    this.direction = Math.cos(angle) > 0 ? 1 : -1;
                    this.sprite.flipX = this.direction < 0;

                    // Jump if target is higher
                    if (targetPoint.y < this.sprite.y - 10 && this.sprite.body.onFloor()) {
                        this.sprite.setVelocityY(this.jumpForce);
                    }
                } else {
                    // Move to next point in path
                    this.currentPathIndex++;
                    if (this.currentPathIndex >= this.currentPath.length) {
                        this.currentPath = null;
                    }
                }
            }
        } else {
            // No player in range - use automatic movement
            const timeSinceStart = currentTime - this.startTime;
            const cycleTime = this.moveTime + this.idleTime;
            const timeInCycle = timeSinceStart % cycleTime;

            // Determine if we should be moving or idle
            this.isMoving = timeInCycle < this.moveTime;

            if (this.isMoving) {
                // Check for obstacles ahead
                const rayStart = {
                    x: this.sprite.x + (this.direction * 32),
                    y: this.sprite.y
                };
                const rayEnd = {
                    x: this.sprite.x + (this.direction * 64),
                    y: this.sprite.y
                };

                // Check for ground ahead
                const groundRayStart = {
                    x: this.sprite.x + (this.direction * 64),
                    y: this.sprite.y
                };
                const groundRayEnd = {
                    x: this.sprite.x + (this.direction * 64),
                    y: this.sprite.y + 64
                };

                // Cast rays using Phaser's ray casting
                const obstacles = this.scene.platforms.getChildren();
                let hitObstacle = false;
                let hasGround = false;

                obstacles.forEach(obstacle => {
                    // Check for obstacle ahead
                    if (this.lineIntersectsRect(
                        rayStart.x, rayStart.y,
                        rayEnd.x, rayEnd.y,
                        obstacle.x, obstacle.y,
                        obstacle.width, obstacle.height
                    )) {
                        hitObstacle = true;
                    }

                    // Check for ground ahead
                    if (this.lineIntersectsRect(
                        groundRayStart.x, groundRayStart.y,
                        groundRayEnd.x, groundRayEnd.y,
                        obstacle.x, obstacle.y,
                        obstacle.width, obstacle.height
                    )) {
                        hasGround = true;
                    }
                });

                // Handle movement and jumping
                if (currentTime - this.lastJumpTime > this.jumpCooldown) {
                    // Check for tall walls first
                    if (this.checkForTallWall()) {
                        // If there's a tall wall, reverse direction
                        this.reverseDirection();
                    } else if (hitObstacle) {
                        // Jump over obstacle only if it's not a tall wall
                        this.sprite.setVelocityY(this.jumpForce);
                        this.lastJumpTime = currentTime;
                    } else if (!hasGround) {
                        // Try to find and jump to higher platform
                        const platformAbove = this.findPlatformAbove();
                        if (platformAbove) {
                            const jumpHeight = this.sprite.y - platformAbove.y;
                            this.sprite.setVelocityY(this.calculateJumpForce(jumpHeight));
                            this.lastJumpTime = currentTime;
                        } else {
                            // If no platform found, reverse direction
                            this.reverseDirection();
                        }
                    }
                }

                // Move horizontally
                this.sprite.setVelocityX(this.speed * this.direction);
                
                // Update sprite facing direction
                this.sprite.flipX = this.direction < 0;
            } else {
                // Idle state - stop horizontal movement
                this.sprite.setVelocityX(0);
            }
        }

        // Update sprite data for debug display
        this.sprite.setData('health', this.currentHealth);
        this.sprite.setData('maxHealth', this.maxHealth);
        this.sprite.setData('speed', Math.abs(this.sprite.body.velocity.x));
        this.sprite.setData('state', this.isAttacking ? 'Attack' : 
            (distanceToPlayer < this.detectionRange ? 'Chase' :
                (Math.abs(this.sprite.body.velocity.x) > 0 ? 'Patrol' : 'Idle')));

        if (distanceToPlayer <= this.attackRange && !this.isAttacking) {
            // Stop and attack
            this.sprite.setVelocityX(0);
            if (currentTime - this.lastAttackTime >= this.attackCooldown) {
                this.attack();
                this.lastAttackTime = currentTime;
            }
        }
    }

    attack() {
        if (!this.sprite || this.isAttacking) return;

        this.isAttacking = true;
        this.sprite.play('enemymeleewarrior-attack');
        
        const player = this.scene.player;
        if (player && Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, player.x, player.y) <= this.attackRange) {
            player.takeDamage(this.damage);
        }

        this.sprite.once('animationcomplete', () => {
            this.isAttacking = false;
            this.sprite.play('enemymeleewarrior-idle');
        });
    }

    die() {
        if (!this.isAlive) return;
        
        this.isAlive = false;
        this.sprite.play('enemymeleewarrior-death');
        
        // Remove physics and interactivity but keep sprite for death animation
        if (this.sprite.body) {
            this.sprite.body.enable = false;
        }
        
        // Destroy after death animation completes
        this.sprite.once('animationcomplete', () => {
            super.die();
        });
    }

    takeDamage(amount) {
        if (!this.isAlive) return;

        super.takeDamage(amount);
        
        // Flash red when taking damage
        if (this.sprite) {
            this.scene.tweens.add({
                targets: this.sprite,
                tint: 0xff0000,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.sprite.setTint(0xffffff);
                }
            });
        }
    }

    // Helper method to find platform above the warrior
    findPlatformAbove() {
        const platforms = this.scene.platforms.getChildren();
        let nearestPlatform = null;
        let nearestDistance = Infinity;

        platforms.forEach(platform => {
            // Only consider platforms that are above and within reasonable horizontal distance
            if (platform.y < this.sprite.y && 
                Math.abs(platform.x - this.sprite.x) < 100) {
                const distance = this.sprite.y - platform.y;
                if (distance < nearestDistance && distance < 200) { // Max jump height
                    nearestPlatform = platform;
                    nearestDistance = distance;
                }
            }
        });

        return nearestPlatform;
    }

    // Helper method to calculate required jump force based on height
    calculateJumpForce(height) {
        // Basic physics calculation for jump force
        // You might need to adjust this based on your game's gravity
        return Math.min(-400, -Math.sqrt(2 * Math.abs(height) * this.scene.physics.world.gravity.y));
    }

    // Helper method to check line intersection with rectangle
    lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
        const left = this.lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx, ry + rh);
        const right = this.lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
        const top = this.lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry);
        const bottom = this.lineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);
        return left || right || top || bottom;
    }

    // Helper method to check line intersection
    lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denominator = ((x2 - x1) * (y4 - y3)) - ((y2 - y1) * (x4 - x3));
        if (denominator === 0) return false;
        
        const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
        const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;
        
        return (ua >= 0 && ua <= 1) && (ub >= 0 && ub <= 1);
    }

    // Helper method to check for tall walls
    checkForTallWall() {
        const rayStartX = this.sprite.x + (this.direction * 32);
        const rayStartY = this.sprite.y - 32; // Start from character's head level
        
        // Cast multiple rays vertically to check wall height
        for (let i = 0; i < 2; i++) { // Check 2 blocks high
            const rayEndX = rayStartX;
            const rayEndY = rayStartY - (i * 32); // Check each block level
            
            const obstacles = this.scene.platforms.getChildren();
            for (const obstacle of obstacles) {
                if (this.lineIntersectsRect(
                    rayStartX, rayEndY,
                    rayEndX, rayEndY + 32,
                    obstacle.x, obstacle.y,
                    obstacle.width, obstacle.height
                )) {
                    return true; // Found a wall at this height
                }
            }
        }
        return false;
    }

    reverseDirection() {
        this.direction *= -1;
        if (this.sprite) {
            this.sprite.flipX = this.direction < 0;
        }
    }
}

export default MeleeWarrior;
