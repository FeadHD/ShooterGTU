import Phaser from 'phaser';
import { PlayerController } from '../modules/controls/PlayerController';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'character_idle');
        
        this.scene = scene;
        this.maxJumps = 2;        // Maximum number of jumps allowed
        this.jumpsAvailable = this.maxJumps;  // Start with max jumps
        this.isDying = false;
        this.invulnerableUntil = 0;
        this.movementSpeed = 300;
        this.jumpSpeed = -350;    // Reduced jump speed for lower gravity
        this.doubleJumpSpeed = -300;  // Second jump slightly weaker
        this.playerHP = scene.registry.get('playerHP') || 100;
        this.lastDamageTaken = 0; // Track last damage taken
        
        // Add sprite to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up physics properties
        this.setScale(2)
            .setCollideWorldBounds(true)
            .setBounce(0.1)
            .setGravityY(400)  // Match world gravity
            .setAlpha(1) // Set opacity to 100%
            .setDepth(1000); // Set a high depth value to render in front of everything
            
        this.body.setSize(20, 27);
        
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
        this.scene.effectsManager.playSound('laser');
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
        
        this.scene.effectsManager.playSound('hit');
    }

    die() {
        if (this.isDying) return;  // Prevent multiple death calls
        
        this.isDying = true;
        this.setVelocity(0, 0);
        this.body.moves = false;
        
        // Disable controls
        this.controller.enabled = false;
        
        // Decrease lives
        const lives = this.scene.stateManager.decrement('lives');
        this.scene.gameUI.updateLives(lives);
    
        console.log('Playing death animation');  // Debug log
        // Play death animation
        this.play('character_Death', true);  // Force start the animation
        this.once('animationcomplete', () => {
            console.log('Death animation complete');  // Debug log
            if (lives <= 0) {
                this.handleGameOver();
            } else {
                this.handleRespawn();
            }
        });
    }

    handleGameOver() {
        // Stop the timer
        this.scene.gameUI.stopTimer();
        
        const gameOverElements = this.scene.gameUI.showGameOver();
        this.scene.gameOverElements = gameOverElements;
        this.scene.gameOver = true;
        this.scene.input.mouse.enabled = false;
        
        // Add space key for restart
        this.scene.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    handleRespawn() {
        // Use scene's spawn point if available, otherwise use default position
        const spawnPoint = this.scene.playerSpawnPoint || {
            x: this.scene.cameras.main.width * 0.1,
            y: this.scene.groundTop - 16
        };
        
        this.setPosition(spawnPoint.x, spawnPoint.y);
        this.setVelocity(0, 0);
        
        // Reset player state
        this.isDying = false;
        this.body.moves = true;
        this.setAlpha(1);
        this.controller.enabled = true;  // Re-enable controls
        
        // Reset player HP
        this.playerHP = 100;  // Update the player's own HP property
        this.lastDamageTaken = 0;  // Reset last damage taken
        this.scene.stateManager.set('playerHP', this.playerHP);
        this.scene.gameUI.updateHP(this.playerHP);
    }

    update() {
        if (this.body && !this.isDying) {  
            // Reset jumps when landing
            if (this.body.onFloor()) {
                this.jumpsAvailable = this.maxJumps;
            }

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

            // Handle jumping
            if (this.controller.controls.jump.isDown && !this.controller.controls.jump.wasJustPressed) {
                if (this.body.onFloor() && this.jumpsAvailable === this.maxJumps) {
                    // First jump
                    this.setVelocityY(this.jumpSpeed);
                    this.jumpsAvailable--;
                    this.play('character_Jump', true);
                } else if (this.jumpsAvailable > 0) {
                    // Double jump
                    this.setVelocityY(this.doubleJumpSpeed);
                    this.jumpsAvailable--;
                    this.play('character_Jump', true);
                }
                // Set wasJustPressed to prevent multiple jumps from a single press
                this.controller.controls.jump.wasJustPressed = true;
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