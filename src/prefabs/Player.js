import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'character_idle');
        
        this.scene = scene;
        this.jumpsAvailable = 2;
        this.isDying = false;
        this.invulnerableUntil = 0;
        this.movementSpeed = 300;
        this.jumpSpeed = -450;
        this.playerHP = scene.registry.get('playerHP') || 100;
        
        // Add sprite to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up physics properties
        this.setScale(2)
            .setCollideWorldBounds(true)
            .setBounce(0.1)
            .setGravityY(300);
            
        this.body.setSize(32, 32);
        
        // Start idle animation if it exists
        if (scene.anims.exists('character_idle')) {
            this.play('character_idle');
        }

        // Set up controls
        this.setupControls();
    }

    setupControls() {
        // WASD controls
        this.controls = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Mouse controls for shooting
        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                const direction = this.flipX ? 'left' : 'right';
                this.shoot(direction);
            }
        });
    }

    shoot(direction = 'right') {
        const bullet = this.scene.bullets.get(this.x, this.y);
        if (!bullet) return;
        
        bullet.body.setAllowGravity(false);
        bullet.body.setImmovable(true);
        bullet.fire(this.x, this.y, direction);
        this.scene.laserSound.play();
    }

    takeDamage() {
        if (this.isDying) return;
        
        // Check invulnerability
        if (this.scene.time.now < this.invulnerableUntil) return;

        this.playerHP -= 25;
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
        
        this.scene.hitSound.play();
    }

    die() {
        this.isDying = true;
        this.setVelocity(0, 0);
        this.body.moves = false;
        
        // Decrease lives
        const lives = this.scene.registry.get('lives') - 1;
        this.scene.registry.set('lives', lives);
        this.scene.gameUI.updateLives(lives);
    
        // Play death animation
        this.play('character_death');
        this.once('animationcomplete', () => {
            if (lives <= 0) {
                this.handleGameOver();
            } else {
                this.handleRespawn();
            }
        });
    }

    handleGameOver() {
        const gameOverElements = this.scene.gameUI.showGameOver();
        this.scene.gameOverElements = gameOverElements;
        this.scene.gameOver = true;
        this.scene.input.mouse.enabled = false;
        
        // Add space key for restart
        this.scene.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    handleRespawn() {
        this.scene.time.delayedCall(500, () => {
            // Reset HP
            this.playerHP = 100;
            this.scene.registry.set('playerHP', 100);
            this.scene.gameUI.updateHP(100);
            
            // Reset state
            this.isDying = false;
            this.scene.input.keyboard.enabled = true;
            this.scene.input.mouse.enabled = true;
            this.body.moves = true;
            
            // Restart scene
            this.scene.scene.restart();
        });
    }

    update() {
        if (this.isDying) return;

        const onGround = this.body.onFloor();

        // Reset jumps when touching ground
        if (onGround) {
            this.jumpsAvailable = 2;
        }

        // Handle horizontal movement
        if (this.controls.left.isDown) {
            this.setVelocityX(-this.movementSpeed);
            this.flipX = true;
            if (onGround) this.play('character_walk', true);
        } else if (this.controls.right.isDown) {
            this.setVelocityX(this.movementSpeed);
            this.flipX = false;
            if (onGround) this.play('character_walk', true);
        } else {
            this.setVelocityX(0);
            if (onGround) this.play('character_idle', true);
        }

        // Handle jumping
        if (this.controls.up.isDown && Phaser.Input.Keyboard.JustDown(this.controls.up)) {
            if (this.jumpsAvailable > 0) {
                this.setVelocityY(this.jumpSpeed);
                this.play('character_jump', true);
                this.jumpsAvailable--;
            }
        }
    }
}