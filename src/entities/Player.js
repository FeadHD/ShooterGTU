import { gameConfig } from '../config/gameConfig';

export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x, y, 'character_idle');
        this.setupPhysics();
        this.setupAnimations();
        this.health = 3;
        this.isRunning = false;
    }

    setupPhysics() {
        const { width, height } = gameConfig.player.size;
        
        this.sprite.setScale(1, 2);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setBounce(0.1);
        this.sprite.setGravityY(300);
        this.sprite.body.setSize(width, height);
        this.sprite.body.setOffset(8, 0);
    }

    setupAnimations() {
        if (this.scene.anims.exists('idle')) {
            this.sprite.play('idle');
        }
    }

    update(controls) {
        const { speed } = gameConfig.player;
        const currentSpeed = this.isRunning ? speed * 1.5 : speed;

        // Handle horizontal movement
        if (controls.isMovingLeft()) {
            this.sprite.setVelocityX(-currentSpeed);
            this.sprite.setFlipX(true);
            if (this.sprite.body.onFloor() && this.scene.anims.exists('run')) {
                this.sprite.play('run', true);
            }
        } else if (controls.isMovingRight()) {
            this.sprite.setVelocityX(currentSpeed);
            this.sprite.setFlipX(false);
            if (this.sprite.body.onFloor() && this.scene.anims.exists('run')) {
                this.sprite.play('run', true);
            }
        } else {
            this.sprite.setVelocityX(0);
            if (this.sprite.body.onFloor() && this.scene.anims.exists('idle')) {
                this.sprite.play('idle', true);
            }
        }

        // Handle jumping
        if (controls.isJumping() && this.sprite.body.onFloor()) {
            this.sprite.setVelocityY(gameConfig.player.jumpVelocity);
            if (this.scene.anims.exists('jump')) {
                this.sprite.play('jump');
            }
        }

        // Update running state
        this.isRunning = controls.isShiftPressed();
    }

    damage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }

    getSprite() {
        return this.sprite;
    }

    setRunning(running) {
        this.isRunning = running;
    }
}
