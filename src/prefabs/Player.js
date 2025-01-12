import Phaser from 'phaser';
import { PlayerController } from '../modules/controls/PlayerController';
import { eventBus } from '../modules/events/EventBus';
import { GameConfig } from '../config/GameConfig';

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
        this.playerHP = scene.registry.get('playerHP') || GameConfig.PLAYER.INITIAL_HP;
        this.lastDamageTaken = 0;
        
        // Stamina mechanics
        this.maxStamina = 100;
        this.currentStamina = scene.registry.get('stamina') || this.maxStamina;
        scene.registry.set('stamina', this.currentStamina); // Initialize registry
        this.staminaRegenRate = 12;           // base regen per second
        this.groundRegenBonus = 8;            // additional regen when on ground
        this.staminaRegenDelay = 500;         // 0.5s delay before regen starts
        this.lastStaminaUseTime = 0;          // Track when stamina was last used
        
        // Roll stamina costs - progressive drain rates
        this.rollStaminaCosts = [
            { time: 300, cost: 45 },          // 0-300ms: 45/s
            { time: 600, cost: 60 },          // 300-600ms: 60/s
            { time: 900, cost: 85 },          // 600-900ms: 85/s
            { time: 1200, cost: 120 }         // 900-1200ms: 120/s
        ];
        
        // Rollover mechanics
        this.isRolling = false;           // Current rolling state
        this.rollSpeed = 450;             // Speed during roll
        this.rollStartTime = 0;           // When current roll began
        this.rollDirection = 1;           // 1 for right, -1 for left
        
        // Hover stamina costs - progressive drain rates
        this.hoverStaminaCosts = [
            { time: 500, cost: 35 },          // 0-500ms: 35/s
            { time: 1000, cost: 45 },         // 500-1000ms: 45/s
            { time: 1500, cost: 65 },         // 1000-1500ms: 65/s
            { time: 2000, cost: 90 }          // 1500-2000ms: 90/s
        ];
        
        // Hover mechanics
        this.isHovering = false;          // Current hover state
        this.canStartHover = true;        // Whether we can start a new hover
        this.hoverDuration = 2000;        // Max hover duration (2 seconds)
        this.hoverCooldown = 1000;        // Time before can hover again (ms)
        this.hoverForce = -100;           // Base hover force
        this.hoverStartTime = 0;          // When current hover began
        this.lastHoverEndTime = 0;        // When last hover ended
        this.hoverWarningThreshold = 500; // Show warning when 500ms left

        // Coyote Time and Jump Buffer variables
        this.coyoteTime = 80;     // Standard coyote time for precise platforming
        this.lastOnGroundTime = 0; // Track when player was last on ground
        this.lastJumpPressedTime = 0; // Track when jump was last pressed
        this.hasBufferedJump = false; // Track if we have a buffered jump

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
        
        // Create animations if they don't exist
        this.createAnimations();

        // Start idle animation if it exists
        if (scene.anims.exists('character_Idle')) {
            this.playAnimation('character_Idle');
        }

        // Set up controls
        this.controller = new PlayerController(scene);
        this.controller.setupShootingControls(this);
    }

    createAnimations() {
        const anims = [
            {
                key: 'character_Idle',
                spritesheet: 'character_idle',
                frameRate: 8,
                start: 0,
                end: 3,
                repeat: -1
            },
            {
                key: 'character_Run',
                spritesheet: 'character_run',
                frameRate: 10,
                start: 0,
                end: 5,
                repeat: -1
            },
            {
                key: 'character_Jump',
                spritesheet: 'character_jump',
                frameRate: 10,
                start: 0,
                end: 2,
                repeat: 0
            },
            {
                key: 'character_Fall',
                spritesheet: 'character_fall',
                frameRate: 10,
                start: 0,
                end: 2,
                repeat: 0
            },
            {
                key: 'character_Rollover',
                spritesheet: 'character_rollover',
                frameRate: 15,
                start: 0,
                end: 6,
                repeat: 0
            }
        ];

        console.log('Creating player animations...');
        anims.forEach(anim => {
            if (!this.scene.anims.exists(anim.key)) {
                try {
                    this.scene.anims.create({
                        key: anim.key,
                        frames: this.scene.anims.generateFrameNumbers(anim.spritesheet, {
                            start: anim.start,
                            end: anim.end
                        }),
                        frameRate: anim.frameRate,
                        repeat: anim.repeat
                    });
                    console.log(`Created animation: ${anim.key}`);
                } catch (error) {
                    console.error(`Failed to create animation ${anim.key}:`, error);
                }
            }
        });

        console.log('Available animations:', Object.keys(this.scene.anims.anims.entries));
    }

    playAnimation(key, ignoreIfPlaying = true) {
        try {
            if (this.scene.anims.exists(key)) {
                const anim = this.scene.anims.get(key);
                if (anim && anim.frames.length > 0) {
                    super.play(key, ignoreIfPlaying);
                } else {
                    console.warn(`Animation ${key} exists but has no frames`);
                }
            } else {
                console.warn(`Animation ${key} does not exist`);
            }
        } catch (error) {
            console.error(`Error playing animation ${key}:`, error);
        }
    }

    shoot(direction = 'right') {
        // Get a bullet from the scene's bullets group
        const bullet = this.scene.bullets.get(this.x, this.y);
        if (!bullet) return;
        
        // Fire the bullet
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

        // Take damage
        this.lastDamageTaken = GameConfig.PLAYER.DAMAGE;
        this.playerHP = Math.max(0, this.playerHP - this.lastDamageTaken);
        this.scene.registry.set('playerHP', this.playerHP);
        
        // Emit HP change event
        eventBus.emit('playerHPChanged', this.playerHP);

        if (this.playerHP <= 0) {
            this.die();
            return;
        }

        // Set invulnerability period
        this.invulnerableUntil = this.scene.time.now + GameConfig.PLAYER.INVULNERABLE_DURATION;
        this.makeInvulnerable();
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

        // Reset antivirus wall if it exists
        if (this.scene.antivirusWall) {
            this.scene.antivirusWall.reset();
        }
        
        // Play death animation
        if (this.scene.anims.exists('character_Death')) {
            this.playAnimation('character_Death', true);
            this.once('animationcomplete', () => {
                this.setAlpha(0);
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
        this.playerHP = GameConfig.PLAYER.INITIAL_HP;
        this.scene.registry.set('playerHP', this.playerHP);
        eventBus.emit('playerHPChanged', this.playerHP);
        
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

    getRollStaminaCost(elapsedTime) {
        for (let i = 0; i < this.rollStaminaCosts.length; i++) {
            if (elapsedTime <= this.rollStaminaCosts[i].time) {
                return this.rollStaminaCosts[i].cost;
            }
        }
        return this.rollStaminaCosts[this.rollStaminaCosts.length - 1].cost;
    }

    getHoverStaminaCost(elapsedTime) {
        for (let i = 0; i < this.hoverStaminaCosts.length; i++) {
            if (elapsedTime <= this.hoverStaminaCosts[i].time) {
                return this.hoverStaminaCosts[i].cost;
            }
        }
        return this.hoverStaminaCosts[this.hoverStaminaCosts.length - 1].cost;
    }

    handleRoll() {
        const currentTime = this.scene.time.now;
        const isRollKeyHeld = this.controller.controls.shift.isDown;
        
        // Check if we should stop rolling
        if (this.isRolling) {
            if (!isRollKeyHeld || this.currentStamina <= 0) {
                this.isRolling = false;
                this.lastStaminaUseTime = currentTime;
                // Stop roll animation
                this.playAnimation('character_Idle');
                return;
            }
            
            // Calculate roll duration and stamina cost
            const rollTimeElapsed = currentTime - this.rollStartTime;
            const currentDrainRate = this.getRollStaminaCost(rollTimeElapsed);
            const staminaCostThisFrame = currentDrainRate * (this.scene.game.loop.delta / 1000);
            
            // Consume stamina
            this.currentStamina = Math.max(0, this.currentStamina - staminaCostThisFrame);
            this.lastStaminaUseTime = currentTime;
            this.scene.registry.set('stamina', this.currentStamina);
            
            // Apply roll movement if we have stamina
            if (this.currentStamina > 0) {
                // Set velocity based on roll direction
                this.setVelocityX(this.rollSpeed * this.rollDirection);
            } else {
                this.isRolling = false;
                // Stop roll animation when out of stamina
                this.playAnimation('character_Idle');
            }
        }
        
        // Check if we can start rolling
        if (!this.isRolling && isRollKeyHeld && this.currentStamina > 0) {
            // Determine roll direction based on player's facing direction or movement
            if (this.controller.isMovingLeft()) {
                this.rollDirection = -1;
            } else if (this.controller.isMovingRight()) {
                this.rollDirection = 1;
            } else {
                this.rollDirection = this.flipX ? -1 : 1;
            }
            
            this.isRolling = true;
            this.rollStartTime = currentTime;
            this.lastStaminaUseTime = currentTime;
            
            // Start roll animation
            try {
                this.playAnimation('character_Rollover');
            } catch (error) {
                console.error('Error playing rollover animation:', error);
                this.isRolling = false;
            }
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
        
        // Check if we should stop hovering
        if (this.isHovering) {
            if (!isHoverKeyHeld || this.currentStamina <= 0 || this.body.onFloor()) {
                this.isHovering = false;
                this.lastHoverEndTime = currentTime;
                this.lastStaminaUseTime = currentTime;
                return;
            }
        }
        
        // Check if we can start hovering
        if (!this.isHovering && !this.isJumping && isHoverKeyHeld && this.canStartHover && !this.body.onFloor() && hoverHoldTime > 100) {
            // Check cooldown and start hover
            if (currentTime - this.lastHoverEndTime >= this.hoverCooldown && this.currentStamina > 0) {
                this.isHovering = true;
                this.hoverStartTime = currentTime;
                this.lastStaminaUseTime = currentTime;
                
                // Give a small upward boost when starting hover
                if (this.body.velocity.y > 0) {
                    this.setVelocityY(this.body.velocity.y * 0.5);
                }
            }
        }
        
        // Handle active hover
        if (this.isHovering) {
            const hoverTimeElapsed = currentTime - this.hoverStartTime;
            
            // Stop hover if max duration reached
            if (hoverTimeElapsed >= this.hoverDuration) {
                this.isHovering = false;
                this.lastHoverEndTime = currentTime;
                this.lastStaminaUseTime = currentTime;
                return;
            }
            
            // Calculate and apply progressive stamina drain
            const currentDrainRate = this.getHoverStaminaCost(hoverTimeElapsed);
            const staminaCostThisFrame = currentDrainRate * (this.scene.game.loop.delta / 1000);
            
            // Consume stamina
            this.currentStamina = Math.max(0, this.currentStamina - staminaCostThisFrame);
            this.lastStaminaUseTime = currentTime;
            this.scene.registry.set('stamina', this.currentStamina);
            
            // Apply hover physics
            if (this.currentStamina > 0) {
                this.setVelocityY(this.hoverForce);
            } else {
                this.isHovering = false;
                this.lastHoverEndTime = currentTime;
            }
        }
    }

    handleJump() {
        const currentTime = this.scene.time.now;
        
        // Track jump button press timing
        if (this.controller.controls.jump.isDown) {
            this.lastJumpPressedTime = currentTime;
        }
        
        // Check if we should jump (including during roll)
        const canJump = (currentTime - this.lastOnGroundTime < this.coyoteTime) && 
                       (currentTime - this.lastJumpPressedTime < this.jumpBufferTime) &&
                       this.jumpsAvailable > 0 && !this.isJumping && !this.isHovering;
        
        if (canJump) {
            this.isJumping = true;
            this.jumpsAvailable--;
            this.setVelocityY(this.jumpSpeed);
            
            // Keep roll velocity if rolling
            if (!this.isRolling) {
                this.setVelocityX(0);
            }
            
            // Play jump animation only if not rolling
            if (!this.isRolling) {
                this.playAnimation('character_Jump', true);
            }
        }
        
        // Reset jump state when landing
        if (this.body.onFloor()) {
            this.isJumping = false;
            // Only reset animation if not rolling
            if (!this.isRolling) {
                if (this.body.velocity.x !== 0) {
                    this.playAnimation('character_Walking', true);
                } else {
                    this.playAnimation('character_Idle', true);
                }
            }
        }
    }

    update() {
        if (this.body && !this.isDying) {  
            const currentTime = this.scene.time.now;
            
            // Handle stamina regeneration
            if (!this.isHovering && !this.isRolling && currentTime - this.lastStaminaUseTime >= this.staminaRegenDelay) {
                let regenRate = this.staminaRegenRate;
                
                // Add ground bonus if on ground
                if (this.body.onFloor()) {
                    regenRate += this.groundRegenBonus;
                }
                
                // Apply regeneration
                this.currentStamina = Math.min(
                    this.maxStamina,
                    this.currentStamina + (regenRate * (this.scene.game.loop.delta / 1000))
                );
                this.scene.registry.set('stamina', this.currentStamina);
            }

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

            // Check for wall collision during roll
            if (this.isRolling && (this.body.blocked.left || this.body.blocked.right)) {
                this.isRolling = false;
                this.lastStaminaUseTime = currentTime;
                // Stop roll animation on wall collision
                this.playAnimation('character_Idle');
            }

            // Handle roll and jump
            this.handleRoll();
            this.handleJump();  // Allow jumping during roll

            // Only handle normal movement if not rolling
            if (!this.isRolling) {
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
                        this.playAnimation('character_Walking', true);
                    } else {
                        this.playAnimation('character_Idle', true);
                    }
                } else {
                    this.playAnimation('character_Jump', true);
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