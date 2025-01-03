import Phaser from 'phaser';
import { PlayerController } from '../modules/controls/PlayerController';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'character_idle');
        
        this.scene = scene;
        this.maxJumps = 1;        // Single jump
        this.jumpsAvailable = this.maxJumps;
        this.isDying = false;
        this.invulnerableUntil = 0;
        this.movementSpeed = 300;
        this.jumpSpeed = -350;    // Single jump speed
        this.playerHP = scene.registry.get('playerHP') || 100;
        this.lastDamageTaken = 0; // Track last damage taken
        
        // Coyote Time and Jump Buffer variables
        this.coyoteTime = 80;     // Standard coyote time for precise platforming
        this.jumpBufferTime = 80; // Reduced from 150ms to 80ms to match coyote time
        this.lastOnGroundTime = 0; // Track when player was last on ground
        this.lastJumpPressedTime = 0; // Track when jump was last pressed
        this.hasBufferedJump = false; // Track if we have a buffered jump

        // Hover mechanics
        this.isHovering = false;          // Current hover state
        this.canStartHover = true;        // Whether we can start a new hover
        this.hoverDuration = 750;         // How long player can hover (ms)
        this.hoverCooldown = 1000;        // Time before can hover again (ms)
        this.hoverForce = -100;           // Reduced from -200 to -100 for lower height
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

    handleHover() {
        const currentTime = this.scene.time.now;
        const isHoverKeyHeld = this.controller.controls.jump.isDown && this.controller.controls.jump.getDuration() > 200;
        
        // Check if we can start hovering
        if (!this.isHovering && isHoverKeyHeld && this.canStartHover && !this.body.onFloor()) {
            // Check cooldown
            if (currentTime - this.lastHoverEndTime >= this.hoverCooldown) {
                this.isHovering = true;
                this.hoverStartTime = currentTime;
            }
        }
        
        // Handle active hover
        if (this.isHovering) {
            const hoverTimeElapsed = currentTime - this.hoverStartTime;
            
            if (hoverTimeElapsed < this.hoverDuration && isHoverKeyHeld) {
                // Apply hover force
                this.setVelocityY(this.hoverForce);
            } else {
                // End hover
                this.isHovering = false;
                this.lastHoverEndTime = currentTime;
            }
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
            }

            // Handle jump input buffering
            if (this.controller.controls.jump.isDown && !this.controller.controls.jump.wasJustPressed) {
                this.lastJumpPressedTime = this.scene.time.now;
                this.controller.controls.jump.wasJustPressed = true;
                
                // Only jump if we're not already hovering
                if (!this.isHovering) {
                    const canCoyoteJump = this.scene.time.now - this.lastOnGroundTime < this.coyoteTime;
                    const hasBufferedJump = this.scene.time.now - this.lastJumpPressedTime < this.jumpBufferTime;

                    if ((canCoyoteJump || this.body.onFloor()) && hasBufferedJump) {
                        // Perform the jump
                        this.setVelocityY(this.jumpSpeed);
                        this.play('character_Jump', true);
                        // Reset jump buffer
                        this.lastJumpPressedTime = 0;
                    }
                }
            }

            // Handle hover mechanics after jump
            this.handleHover();

            // Handle horizontal movement
            if (this.controller.isMovingLeft()) {
                this.setVelocityX(-this.movementSpeed);
                this.setFlipX(true);
                if (this.body.onFloor()) {
                    this.play('character_Walking', true);
                }
            } else if (this.controller.isMovingRight()) {
                this.setVelocityX(this.movementSpeed);
                this.setFlipX(false);
                if (this.body.onFloor()) {
                    this.play('character_Walking', true);
                }
            } else {
                this.setVelocityX(0);
                if (this.body.onFloor()) {
                    this.play('character_Idle', true);
                }
            }

            // Always show jump animation when in the air
            if (!this.body.onFloor()) {
                this.play('character_Jump', true);
            }

            // Reset wasJustPressed when the key is released
            if (!this.controller.controls.jump.isDown) {
                this.controller.controls.jump.wasJustPressed = false;
            }

            // Update bullet group
            if (this.bulletGroup) {
                this.bulletGroup.children.iterate((bullet) => {
                    if (bullet && bullet.active) {
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