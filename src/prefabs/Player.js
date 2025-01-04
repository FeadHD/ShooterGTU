import Phaser from 'phaser';
import { PlayerController } from '../modules/controls/PlayerController';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'character_idle');
        
        this.scene = scene;
        this.maxJumps = 1;                // Maximum number of jumps
        this.jumpsAvailable = 1;          // Current jumps available
        this.isJumping = false;           // Track if currently in jump
        this.jumpSpeed = -330;            // Jump velocity
        this.jumpBufferTime = 200;        // Jump buffer timing (200ms)
        this.lastJumpTime = 0;            // When the last jump occurred
        this.isDying = false;
        this.invulnerableUntil = 0;
        this.movementSpeed = 300;
        this.playerHP = scene.registry.get('playerHP') || 100;
        this.lastDamageTaken = 0;
        
        // Rollover mechanics
        this.isRolling = false;           // Current rolling state
        this.rollSpeed = 450;             // Speed during roll
        this.rollDuration = 600;          // How long the roll lasts (ms)
        this.rollCooldown = 800;          // Time before can roll again (ms)
        this.lastRollTime = 0;            // When the last roll ended
        this.canRoll = true;              // Whether we can start a new roll

        // Coyote Time and Jump Buffer variables
        this.coyoteTime = 80;     // Standard coyote time for precise platforming
        this.lastOnGroundTime = 0; // Track when player was last on ground
        this.lastJumpPressedTime = 0; // Track when jump was last pressed
        this.hasBufferedJump = false; // Track if we have a buffered jump

        // Hover mechanics
        this.isHovering = false;          // Current hover state
        this.canStartHover = true;        // Whether we can start a new hover
        this.hoverDuration = 650;         // How long player can hover (0.65 seconds)
        this.hoverCooldown = 1000;        // Time before can hover again (ms)
        this.hoverForce = -100;           // Base hover force
        this.hoverStartTime = 0;          // When current hover began
        this.lastHoverEndTime = 0;        // When last hover ended

        // Add sprite to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up physics properties
        this.setScale(2)
            .setBounce(0.1)
            .setGravityY(400)  // Match world gravity
            .setAlpha(1) // Set opacity to 100%
            .setDepth(1000); // Set a high depth value to render in front of everything
            
        this.body.setSize(12, 27); // Set width to 12px, keep height at 27px
        
        // Start idle animation if it exists
        if (scene.anims.exists('character_idle')) {
            this.play('character_idle');
        }

        // Set up controls
        this.controller = new PlayerController(scene);
        this.controller.setupShootingControls(this);
    }

    shoot(direction = 'right') {
        const bullet = this.scene.bullets.get(this.x, this.y);
        if (!bullet) return;
        
        bullet.body.setAllowGravity(false);
        bullet.body.setImmovable(true);
        bullet.fire(this.x, this.y, direction);
        
        // Only play sound if effectsManager exists
        if (this.scene.effectsManager && this.scene.effectsManager.playSound) {
            this.scene.effectsManager.playSound('laser');
        }
    }

    takeDamage() {
        if (this.isDying) return;
        
        // Check invulnerability
        if (this.scene.time.now < this.invulnerableUntil) return;

        this.lastDamageTaken = 25; // Store the damage amount
        this.playerHP -= this.lastDamageTaken;
        this.scene.registry.set('playerHP', this.playerHP);
        this.scene.gameUI.updateHP(this.playerHP);

        if (this.playerHP <= 0) {
            this.die();
        } else {
            this.makeInvulnerable();
        }
    }

    makeInvulnerable() {
        // Set invulnerability for 1000ms
        this.invulnerableUntil = this.scene.time.now + 1000;
        
        // Create flashing effect
        this.scene.tweens.add({
            targets: this,
            alpha: { from: 0.5, to: 1 },
            duration: 100,
            repeat: 4,
            yoyo: true,
            onComplete: () => {
                if (!this.isDying) this.alpha = 1;
            }
        });
        
        // Only play sound if effectsManager exists
        if (this.scene.effectsManager && this.scene.effectsManager.playSound) {
            this.scene.effectsManager.playSound('hit');
        }
    }

    die() {
        if (this.isDying) return;  // Prevent multiple death calls
        
        this.isDying = true;
        this.setVelocity(0, 0);
        this.body.moves = false;
        
        // Disable controls
        this.controller.enabled = false;
        
        // Update lives in registry and UI only if we're in a game scene
        if (this.scene.gameUI) {
            const currentLives = this.scene.registry.get('lives');
            if (currentLives > 0) {
                this.scene.registry.set('lives', currentLives - 1);
                this.scene.gameUI.updateLives(currentLives - 1);
            }
        }
        
        // Play death animation
        if (this.scene.anims.exists('character_Death')) {
            this.play('character_Death', true);
            this.once('animationcomplete', () => {
                this.setAlpha(0); // Hide player after death animation
                // Reset after animation completes
                this.scene.time.delayedCall(500, () => {
                    this.respawn();
                });
            });
        } else {
            // If no death animation, just wait and respawn
            this.setAlpha(0);
            this.scene.time.delayedCall(500, () => {
                this.respawn();
            });
        }
    }

    fallDeath() {
        if (this.isDying) return;

        this.isDying = true;
        this.setVelocity(0, 0);
        this.body.moves = false;
        this.controller.enabled = false;

        // Update lives in registry and UI only if we're in a game scene
        if (this.scene.gameUI) {
            const currentLives = this.scene.registry.get('lives');
            if (currentLives > 0) {
                this.scene.registry.set('lives', currentLives - 1);
                this.scene.gameUI.updateLives(currentLives - 1);
            }
        }

        // Immediately respawn without animation
        this.setAlpha(0);
        this.respawn();
    }

    respawn() {
        // Reset player state
        this.isDying = false;
        this.body.moves = true;
        this.setAlpha(1);
        this.controller.enabled = true;  // Re-enable controls
        
        // Reset HP
        this.playerHP = 100;
        this.scene.registry.set('playerHP', this.playerHP);
        
        // Make player temporarily invulnerable
        this.makeInvulnerable();
        
        // Reset position to spawn point if it exists, otherwise use default
        if (this.scene.playerSpawnPoint) {
            this.setPosition(this.scene.playerSpawnPoint.x, this.scene.playerSpawnPoint.y);
        } else {
            this.setPosition(100, this.scene.scale.height - 100);
        }
        
        this.setVelocity(0, 0);
    }

    startRoll() {
        const currentTime = this.scene.time.now;
        if (!this.canRoll || this.isRolling || this.isHovering || currentTime - this.lastRollTime < this.rollCooldown) {
            console.log('Cannot roll:', { canRoll: this.canRoll, isRolling: this.isRolling, isHovering: this.isHovering });
            return;
        }

        this.isRolling = true;
        this.canRoll = false;
        const direction = this.controller.isMovingLeft() ? -1 : 1;
        
        // Set rollover velocity
        this.setVelocityX(direction * this.rollSpeed);
        
        try {
            // Play rollover animation
            console.log('Starting rollover animation');
            const anim = this.play('character_Rollover');
            console.log('Animation object:', anim);
            
            // Set up a timer to end the roll
            this.scene.time.delayedCall(this.rollDuration, () => {
                console.log('Roll finished');
                this.isRolling = false;
                this.lastRollTime = currentTime;
                
                // Set up cooldown timer
                this.scene.time.delayedCall(this.rollCooldown, () => {
                    this.canRoll = true;
                });
            });
        } catch (error) {
            console.error('Error playing rollover animation:', error);
            this.isRolling = false;
            this.canRoll = true;
        }
    }

    handleHover() {
        const currentTime = this.scene.time.now;
        const isHoverKeyHeld = this.controller.controls.jump.isDown;
        const hasReleasedJumpSinceLastJump = !this.controller.controls.jump.isDown;
        const hoverHoldTime = this.controller.controls.jump.getDuration();
        
        if (hasReleasedJumpSinceLastJump) {
            this.canStartHover = true;
        }
        
        // Check if we can start hovering (must be in air, key held for 100ms, and not jumping)
        if (!this.isHovering && !this.isJumping && isHoverKeyHeld && this.canStartHover && !this.body.onFloor() && hoverHoldTime > 100) {
            // Only check cooldown
            if (currentTime - this.lastHoverEndTime >= this.hoverCooldown) {
                this.isHovering = true;
                this.hoverStartTime = currentTime;
                // Give a small upward boost when starting hover
                if (this.body.velocity.y > 0) {
                    this.setVelocityY(this.body.velocity.y * 0.5);
                }
            }
        }
        
        // Handle active hover
        if (this.isHovering) {
            const hoverTimeElapsed = currentTime - this.hoverStartTime;
            
            if (hoverTimeElapsed < this.hoverDuration && isHoverKeyHeld) {
                // Apply hover force
                this.setVelocityY(this.hoverForce);
                
                // Basic horizontal control during hover
                if (this.controller.isMovingLeft()) {
                    const hoverSpeed = this.movementSpeed * 0.8;
                    this.setVelocityX(-hoverSpeed);
                    this.setFlipX(true);
                } else if (this.controller.isMovingRight()) {
                    const hoverSpeed = this.movementSpeed * 0.8;
                    this.setVelocityX(hoverSpeed);
                    this.setFlipX(false);
                } else {
                    // Gradual horizontal slowdown
                    this.setVelocityX(this.body.velocity.x * 0.95);
                }
            } else {
                // End hover
                this.isHovering = false;
                this.lastHoverEndTime = currentTime;
                this.canStartHover = false; // Need to release jump again
            }
        }
    }

    handleJump() {
        const currentTime = this.scene.time.now;
        const jumpPressed = this.controller.controls.jump.isDown && !this.controller.controls.jump.wasJustPressed;

        if (jumpPressed) {
            this.lastJumpPressedTime = currentTime;
            this.controller.controls.jump.wasJustPressed = true;
        }
        
        // Check for buffered jump when touching ground
        const hasBufferedJump = currentTime - this.lastJumpPressedTime < this.jumpBufferTime;
        const canJump = (this.body.onFloor() || currentTime - this.lastOnGroundTime < this.coyoteTime) && !this.isHovering;
        
        // Execute jump if we have a buffered jump and can jump
        if (hasBufferedJump && canJump) {
            this.isJumping = true;
            this.setVelocityY(this.jumpSpeed);
            this.play('character_Jump', true);
            this.lastJumpTime = currentTime;
            // Reset jump buffer
            this.lastJumpPressedTime = 0;
            // Disable hover briefly to prevent interference
            this.canStartHover = false;
        }
        
        // Reset jump pressed state when released
        if (!this.controller.controls.jump.isDown) {
            this.controller.controls.jump.wasJustPressed = false;
            this.isJumping = false;
        }
    }

    update() {
        if (this.body && !this.isDying) {  
            // Check if player has fallen off the map
            if (this.y > this.scene.scale.height + 100) {
                this.fallDeath();
                return;
            }

            // Update ground time for Coyote Time
            if (this.body.onFloor()) {
                this.lastOnGroundTime = this.scene.time.now;
                this.jumpsAvailable = this.maxJumps;
                this.canStartHover = false; // Reset hover when touching ground
            }

            // Check for rollover
            if (this.controller.isRolling() && !this.isRolling) {
                this.startRoll();
            }

            if (!this.isRolling) {
                this.handleJump();

                // Handle normal movement
                if (this.controller.isMovingLeft()) {
                    if (this.isHovering) {
                        this.setVelocityX(-this.movementSpeed * 0.8);
                    } else {
                        this.setVelocityX(-this.movementSpeed);
                    }
                    this.setFlipX(true);
                } else if (this.controller.isMovingRight()) {
                    if (this.isHovering) {
                        this.setVelocityX(this.movementSpeed * 0.8);
                    } else {
                        this.setVelocityX(this.movementSpeed);
                    }
                    this.setFlipX(false);
                } else {
                    // Gradual slowdown
                    if (this.isHovering) {
                        this.setVelocityX(this.body.velocity.x * 0.95);
                    } else {
                        this.setVelocityX(0);
                    }
                }

                // Only try to hover if we're in the air
                if (!this.body.onFloor()) {
                    this.handleHover();
                }

                // Handle animations
                if (this.body.onFloor()) {
                    if (this.body.velocity.x !== 0) {
                        this.play('character_Walking', true);
                    } else {
                        this.play('character_Idle', true);
                    }
                } else {
                    this.play('character_Jump', true);
                }
            }

            // Update bullet group
            if (this.bulletGroup) {
                this.bulletGroup.children.iterate((bullet) => {
                    if (bullet) {
                        if (bullet.x < 0 || bullet.x > this.scene.game.config.width) {
                            bullet.destroy();
                        }
                    }
                });
            }
        }
    }

    destroy() {
        if (this.controller) {
            this.controller.destroy();
        }
        super.destroy();
    }
}