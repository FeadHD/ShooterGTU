/**
 * Player.js - Main player character class
 * A complete implementation of the player character with:
 * - Movement: walking, jumping with coyote time, and wall detection
 * - Combat: shooting mechanics and damage system
 * - Special abilities: hover (air float) and roll (quick dodge)
 * - Resource management: health and stamina systems
 */

import Phaser from 'phaser';
import { PlayerController } from '../modules/controls/PlayerController';
import { GameEvents } from '../modules/managers/EventManager';
import { GameConfig } from '../config/GameConfig';

export class Player extends Phaser.Physics.Arcade.Sprite {
    /**
     * Initialize player with core mechanics and state
     * @param {Phaser.Scene} scene - Current game scene
     * @param {number} x - Initial X position
     * @param {number} y - Initial Y position
     */
    constructor(scene, x, y) {
        super(scene, x, y, 'character_idle');
        this.scene = scene;

        // ======================
        // MOVEMENT CORE SYSTEMS
        // ======================
        // Jump system with coyote time (grace period for jumping after leaving platform)
        this.maxJumps = 1;          // Double jump not enabled (set to 2 for double jump)
        this.jumpsAvailable = 1;     // Resets when touching ground
        this.isJumping = false;      // Tracks current jump state
        this.jumpSpeed = -330;       // Negative for upward movement
        this.jumpBufferTime = 200;   // Grace period for jump input (ms)
        this.lastJumpTime = 0;       // Time tracking for jump buffering

        // Core state tracking
        this.isDying = false;        // Death state flag
        this.invulnerableUntil = 0;  // Invulnerability timer
        this.movementSpeed = 300;    // Base horizontal movement speed

        // ======================
        // HEALTH & STAMINA
        // ======================
        // Health system with persistence
        this.playerHP =
            this.scene.registry.get('playerHP') || GameConfig.PLAYER.INITIAL_HP;
        this.lastDamageTaken = 0;    // Track last damage for UI/effects

        // Stamina system for special abilities
        this.maxStamina = 100;
        this.currentStamina =
            this.scene.registry.get('stamina') || this.maxStamina;
        this.scene.registry.set('stamina', this.currentStamina);
        this.staminaRegenRate = 12;        // Base stamina regen per second
        this.groundRegenBonus = 8;         // Extra regen when on ground
        this.staminaRegenDelay = 500;      // Delay before stamina starts recovering
        this.lastStaminaUseTime = 0;       // Time tracking for regen delay

        // ======================
        // SPECIAL ABILITIES
        // ======================
        // Roll ability - Quick dodge with increasing stamina cost over time
        this.rollStaminaCosts = [
            { time: 300, cost: 45 },   // First 300ms: 45 stamina/s
            { time: 600, cost: 60 },   // 300-600ms: 60 stamina/s
            { time: 900, cost: 85 },   // 600-900ms: 85 stamina/s
            { time: 1200, cost: 120 }  // 900-1200ms: 120 stamina/s
        ];
        this.isRolling = false;
        this.rollSpeed = 450;          // Roll movement speed
        this.rollStartTime = 0;        // Time tracking for roll duration
        this.rollDirection = 1;        // 1 for right, -1 for left

        // Hover ability - Mid-air float with increasing stamina cost
        this.hoverStaminaCosts = [
            { time: 500, cost: 35 },    // First 500ms: 35 stamina/s
            { time: 1000, cost: 45 },   // 500-1000ms: 45 stamina/s
            { time: 1500, cost: 65 },   // 1000-1500ms: 65 stamina/s
            { time: 2000, cost: 90 }    // 1500-2000ms: 90 stamina/s
        ];
        this.isHovering = false;
        this.canStartHover = true;
        this.hoverDuration = 2000;      // Max hover time (2 seconds)
        this.hoverCooldown = 1000;      // Time before can hover again
        this.hoverForce = -100;         // Upward force while hovering
        this.hoverStartTime = 0;        // Time tracking for hover duration
        this.lastHoverEndTime = 0;      // Time tracking for cooldown
        this.hoverWarningThreshold = 500; // Warning when 500ms of hover left

        // ======================
        // PLATFORMING HELPERS
        // ======================
        // Coyote time system - Allows jump slightly after leaving platform
        this.coyoteTime = 80;           // Time window for late jumps (ms)
        this.lastOnGroundTime = 0;      // Time tracking for coyote time
        this.lastJumpPressedTime = 0;   // Time tracking for jump buffer
        this.hasBufferedJump = false;   // Jump buffering state

        // ======================
        // LIVES SYSTEM
        // ======================
        // Persistent lives tracking
        this.playerLives =
            this.scene.registry.get('playerLives') || GameConfig.PLAYER.INITIAL_LIVES;
        this.scene.registry.set('playerLives', this.playerLives);

        // ======================
        // PHYSICS SETUP
        // ======================
        // Add to scene and enable physics
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);

        // Configure physics properties
        this.setScale(2)
            .setBounce(0.1)           // Slight bounce for better feel
            .setGravityY(400)         // Gravity affects player
            .setAlpha(1)
            .setDepth(1000);          // Render above most objects

        this.body.setSize(12, 27);    // Collision box size

        // Initialize core systems
        this.controller = new PlayerController(this.scene);
        this.controller.setupShootingControls(this);
    }

    /**
     * Plays an animation on the player character with error handling
     * @param {string} key - The animation key to play
     * @param {boolean} ignoreIfPlaying - If true, won't restart animation if already playing
     */
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

    /**
     * Handles player shooting mechanics
     * Creates a bullet and plays shooting sound effect
     * @param {string} direction - Direction to shoot ('right' or 'left')
     */
    shoot(direction = 'right') {
        const bullet = this.scene.bullets?.get(this.x, this.y);
        if (!bullet) return;

        bullet.fire(this.x, this.y, direction);

        if (this.scene.effectsManager?.playSound) {
            this.scene.effectsManager.playSound('laser');
        }
    }

    /**
     * Processes damage taken by the player
     * - Checks invulnerability status
     * - Updates HP and triggers events
     * - Handles death if HP reaches 0
     * @param {number} amount - Amount of damage to apply
     */
    takeDamage(amount = GameConfig.PLAYER.DAMAGE) {
        if (this.isDying) return;
        if (this.scene.time.now < this.invulnerableUntil) return;

        this.lastDamageTaken = amount;
        this.playerHP = Math.max(0, this.playerHP - amount);
        this.scene.registry.set('playerHP', this.playerHP);

        // Emit HP changed event
        this.scene.eventManager.emit(GameEvents.PLAYER_HP_CHANGED, this.playerHP);

        // If HP is 0, call die()
        if (this.playerHP <= 0) {
            this.die();
            return;
        }

        // Make invulnerable briefly
        this.invulnerableUntil = this.scene.time.now + GameConfig.PLAYER.INVULNERABLE_DURATION;
        this.makeInvulnerable();
    }

    /**
     * Makes player temporarily invulnerable with visual feedback
     * - Applies alpha tween effect for visibility
     * - Plays hit sound effect
     */
    makeInvulnerable() {
        // Set invulnerability for 1 second
        this.invulnerableUntil = this.scene.time.now + 1000;

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

        if (this.scene.effectsManager?.playSound) {
            this.scene.effectsManager.playSound('hit');
        }
    }

    /**
     * Handles player death state and respawn logic
     * - Decrements lives and updates registry
     * - Triggers game over if no lives remain
     * - Disables controls and physics during death
     */
    die() {
        if (this.isDying) return;
        this.isDying = true;

        // Decrement playerLives
        this.playerLives--;
        this.scene.registry.set('playerLives', this.playerLives);

        // If no lives left => emit GAME_OVER
        if (this.playerLives <= 0) {
            this.scene.eventManager.emit(GameEvents.GAME_OVER, {
                position: { x: this.x, y: this.y },
                cause: 'noLives'
            });

            // Freeze controls/physics
            this.controller.enabled = false;
            this.body.moves = false;
            console.log('Game Over - No Lives Remaining');
            return;
        }

        // Otherwise, this is a normal "death" for one life => emit PLAYER_DEATH
        this.scene.eventManager.emit(GameEvents.PLAYER_DEATH, {
            position: { x: this.x, y: this.y },
            cause: 'lostOneLife'
        });

        // Disable controls and physics
        this.controller.enabled = false;
        this.body.moves = false;

        // Just fade out, then respawn
        this.setAlpha(0);
        this.respawn();
    }

    /**
     * Special death handling for falling off the map
     * - Disables player controls and physics
     * - Updates lives counter and UI
     * - Triggers respawn sequence
     */
    fallDeath() {
        if (this.isDying) return;

        this.isDying = true;
        this.setVelocity(0, 0);
        this.body.moves = false;
        this.controller.enabled = false;

        // If there's a UI for lives
        if (this.scene.gameUI) {
            const currentLives = this.scene.registry.get('playerLives');
            if (currentLives > 0) {
                this.scene.registry.set('playerLives', currentLives - 1);
                this.scene.gameUI.updateLives(currentLives - 1);
            }
        }

        this.setAlpha(0);
        this.respawn();
    }

    /**
     * Resets player state after death
     * - Restores HP and controls
     * - Makes player briefly invulnerable
     * - Moves player to spawn point
     */
    respawn() {
        this.isDying = false;
        this.body.moves = true;
        this.setAlpha(1);
        this.controller.enabled = true;

        // Reset HP
        this.playerHP = GameConfig.PLAYER.INITIAL_HP;
        this.scene.registry.set('playerHP', this.playerHP);
        this.scene.eventManager.emit(GameEvents.PLAYER_HP_CHANGED, this.playerHP);

        this.makeInvulnerable();

        // Use scene's spawn point
        const spawnPoint = this.scene.playerSpawnPoint;
        this.setPosition(spawnPoint.x, spawnPoint.y);
        this.setVelocity(0, 0);
    }

    /**
     * Calculates stamina cost for rolling based on duration
     * Cost increases the longer the roll is maintained
     * @param {number} elapsedTime - Time spent rolling in milliseconds
     * @returns {number} Stamina cost per second
     */
    getRollStaminaCost(elapsedTime) {
        for (let i = 0; i < this.rollStaminaCosts.length; i++) {
            if (elapsedTime <= this.rollStaminaCosts[i].time) {
                return this.rollStaminaCosts[i].cost;
            }
        }
        return this.rollStaminaCosts[this.rollStaminaCosts.length - 1].cost;
    }

    /**
     * Calculates stamina cost for hovering based on duration
     * Cost increases the longer the hover is maintained
     * @param {number} elapsedTime - Time spent hovering in milliseconds
     * @returns {number} Stamina cost per second
     */
    getHoverStaminaCost(elapsedTime) {
        for (let i = 0; i < this.hoverStaminaCosts.length; i++) {
            if (elapsedTime <= this.hoverStaminaCosts[i].time) {
                return this.hoverStaminaCosts[i].cost;
            }
        }
        return this.hoverStaminaCosts[this.hoverStaminaCosts.length - 1].cost;
    }

    /**
     * Handles the roll ability mechanics
     * - Manages roll state and stamina consumption
     * - Controls roll animation and movement
     * - Handles roll cancellation
     */
    handleRoll() {
        const currentTime = this.scene.time.now;
        const isRollKeyHeld = this.controller.controls.shift.isDown;

        if (this.isRolling) {
            if (!isRollKeyHeld || this.currentStamina <= 0) {
                this.isRolling = false;
                this.lastStaminaUseTime = currentTime;
                this.playAnimation('character_Idle');
                return;
            }

            const rollTimeElapsed = currentTime - this.rollStartTime;
            const currentDrainRate = this.getRollStaminaCost(rollTimeElapsed);
            const staminaCostThisFrame =
                currentDrainRate * (this.scene.game.loop.delta / 1000);

            this.currentStamina = Math.max(
                0,
                this.currentStamina - staminaCostThisFrame
            );
            this.lastStaminaUseTime = currentTime;
            this.scene.registry.set('stamina', this.currentStamina);

            if (this.currentStamina > 0) {
                this.setVelocityX(this.rollSpeed * this.rollDirection);
            } else {
                this.isRolling = false;
                this.playAnimation('character_Idle');
            }
        }

        if (!this.isRolling && isRollKeyHeld && this.currentStamina > 0) {
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

            try {
                this.playAnimation('character_Roll');
            } catch (error) {
                console.error('Error playing rollover animation:', error);
                this.isRolling = false;
            }
        }
    }

    /**
     * Handles the hover ability mechanics
     * - Manages hover state and stamina consumption
     * - Controls hover animation and movement
     * - Handles hover cancellation
     */
    handleHover() {
        const currentTime = this.scene.time.now;
        const isHoverKeyHeld = this.controller.controls.jump.isDown;
        const hasReleasedJumpSinceLastJump = !this.controller.controls.jump.isDown;
        const hoverHoldTime = this.controller.controls.jump.getDuration();

        if (hasReleasedJumpSinceLastJump) {
            this.canStartHover = true;
        }

        if (this.isHovering) {
            if (!isHoverKeyHeld || this.currentStamina <= 0 || this.body.onFloor()) {
                this.isHovering = false;
                this.lastHoverEndTime = currentTime;
                this.lastStaminaUseTime = currentTime;
                return;
            }
        }

        if (
            !this.isHovering &&
            !this.isJumping &&
            isHoverKeyHeld &&
            this.canStartHover &&
            !this.body.onFloor() &&
            hoverHoldTime > 100
        ) {
            if (
                currentTime - this.lastHoverEndTime >= this.hoverCooldown &&
                this.currentStamina > 0
            ) {
                this.isHovering = true;
                this.hoverStartTime = currentTime;
                this.lastStaminaUseTime = currentTime;

                if (this.body.velocity.y > 0) {
                    this.setVelocityY(this.body.velocity.y * 0.5);
                }
            }
        }

        if (this.isHovering) {
            const hoverTimeElapsed = currentTime - this.hoverStartTime;
            if (hoverTimeElapsed >= this.hoverDuration) {
                this.isHovering = false;
                this.lastHoverEndTime = currentTime;
                this.lastStaminaUseTime = currentTime;
                return;
            }

            const currentDrainRate = this.getHoverStaminaCost(hoverTimeElapsed);
            const staminaCostThisFrame =
                currentDrainRate * (this.scene.game.loop.delta / 1000);

            this.currentStamina = Math.max(
                0,
                this.currentStamina - staminaCostThisFrame
            );
            this.lastStaminaUseTime = currentTime;
            this.scene.registry.set('stamina', this.currentStamina);

            if (this.currentStamina > 0) {
                this.setVelocityY(this.hoverForce);
            } else {
                this.isHovering = false;
                this.lastHoverEndTime = currentTime;
            }
        }
    }

    /**
     * Handles the jump ability mechanics
     * - Manages jump state and stamina consumption
     * - Controls jump animation and movement
     * - Handles jump cancellation
     */
    handleJump() {
        const currentTime = this.scene.time.now;

        if (this.controller.controls.jump.isDown) {
            this.lastJumpPressedTime = currentTime;
        }

        const canJump =
            currentTime - this.lastOnGroundTime < this.coyoteTime &&
            currentTime - this.lastJumpPressedTime < this.jumpBufferTime &&
            this.jumpsAvailable > 0 &&
            !this.isJumping &&
            !this.isHovering;

        if (canJump) {
            this.isJumping = true;
            this.jumpsAvailable--;
            this.setVelocityY(this.jumpSpeed);

            if (!this.isRolling) {
                this.setVelocityX(0);
            }

            if (!this.isRolling) {
                this.playAnimation('character_Jump', true);
            }
        }

        if (this.body.onFloor()) {
            this.isJumping = false;
            if (!this.isRolling) {
                if (this.body.velocity.x !== 0) {
                    this.playAnimation('character_Walk', true);
                } else {
                    this.playAnimation('character_Idle', true);
                }
            }
        }
    }

    /**
     * Updates player state and handles movement logic
     * - Regenerates stamina if not rolling/hovering
     * - Checks for falling off the map
     * - Updates ground time for coyote time
     * - Cancels rolling if blocked by a wall
     * - Handles roll & jump logic
     * - Movement logic if not rolling
     * - Updates animations
     */
    update() {
        if (this.body && !this.isDying) {
            const currentTime = this.scene.time.now;

            // Regenerate stamina if not rolling/hovering
            if (
                !this.isHovering &&
                !this.isRolling &&
                currentTime - this.lastStaminaUseTime >= this.staminaRegenDelay
            ) {
                let regenRate = this.staminaRegenRate;
                if (this.body.onFloor()) {
                    regenRate += this.groundRegenBonus;
                }

                this.currentStamina = Math.min(
                    this.maxStamina,
                    this.currentStamina +
                        (regenRate * (this.scene.game.loop.delta / 1000))
                );
                this.scene.registry.set('stamina', this.currentStamina);
            }

            // Check if player has fallen off the map
            if (this.y > this.scene.scale.height + 100) {
                this.fallDeath();
                return;
            }

            // Update ground time for coyote time
            if (this.body.onFloor()) {
                this.lastOnGroundTime = this.scene.time.now;
                this.jumpsAvailable = this.maxJumps;
                this.canStartHover = false;
            }

            // Cancel rolling if blocked by a wall
            if (this.isRolling && (this.body.blocked.left || this.body.blocked.right)) {
                this.isRolling = false;
                this.lastStaminaUseTime = currentTime;
                this.playAnimation('character_Idle');
            }

            // Handle roll & jump logic
            this.handleRoll();
            this.handleJump();

            // Movement logic if not rolling
            if (!this.isRolling) {
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
                    // Slow down
                    if (this.isHovering) {
                        this.setVelocityX(this.body.velocity.x * 0.95);
                    } else {
                        this.setVelocityX(0);
                    }
                }

                // If not on floor, handle hover
                if (!this.body.onFloor()) {
                    this.handleHover();
                }

                // Update animations
                if (this.body.onFloor()) {
                    if (this.body.velocity.x !== 0) {
                        this.playAnimation('character_Walk', true);
                    } else {
                        this.playAnimation('character_Idle', true);
                    }
                } else {
                    this.playAnimation('character_Jump', true);
                }
            }

            // Clean up bullets if you have a bullet group
            if (this.bulletGroup) {
                this.bulletGroup.children.iterate(bullet => {
                    if (bullet && (bullet.x < 0 || bullet.x > this.scene.game.config.width)) {
                        bullet.destroy();
                    }
                });
            }
        }
    }

    /**
     * Destroys the player object and its controller
     */
    destroy() {
        if (this.controller) {
            this.controller.destroy();
        }
        super.destroy();
    }
}
