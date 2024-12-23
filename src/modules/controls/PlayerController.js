import Phaser from 'phaser';

export class PlayerController {
    constructor(scene) {
        this.scene = scene;
        this.controls = {
            up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
    }

    setupShootingControls(player) {
        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                const direction = player.flipX ? 'left' : 'right';
                player.shoot(direction);
            }
        });
    }

    isMovingLeft() {
        return this.controls.left.isDown;
    }

    isMovingRight() {
        return this.controls.right.isDown;
    }

    isJumping() {
        return this.controls.up.isDown;
    }

    destroy() {
        // Clean up event listeners and key bindings
        Object.values(this.controls).forEach(key => key.destroy());
    }
}
