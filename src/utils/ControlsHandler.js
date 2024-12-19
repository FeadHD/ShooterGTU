import { gameConfig } from '../config/gameConfig';

export class ControlsHandler {
    constructor(scene) {
        this.scene = scene;
        this.cursors = null;
        this.wasd = null;
        this.keyBindings = null;
        this.mouseInput = null;
        this.isJumpPressed = false;
        this.lastDirection = 'right';

        this.setupControls();
    }

    setupControls() {
        // Set up arrow key controls
        this.cursors = this.scene.input.keyboard.createCursorKeys();

        // Set up WASD controls
        this.wasd = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Additional key bindings
        this.keyBindings = this.scene.input.keyboard.addKeys({
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            esc: Phaser.Input.Keyboard.KeyCodes.ESC
        });

        // Mouse input
        this.mouseInput = this.scene.input.activePointer;

        // Set up shooting on mouse click
        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.handleShoot();
            }
        });

        // Handle pause on ESC
        this.keyBindings.esc.on('down', () => {
            this.handlePause();
        });
    }

    update() {
        // Update last direction based on movement
        if (this.isMovingLeft()) {
            this.lastDirection = 'left';
        } else if (this.isMovingRight()) {
            this.lastDirection = 'right';
        }

        // Handle continuous actions
        if (this.isShiftPressed()) {
            this.handleRun();
        }
    }

    // Movement checks
    isMovingLeft() {
        return this.cursors.left.isDown || this.wasd.left.isDown;
    }

    isMovingRight() {
        return this.cursors.right.isDown || this.wasd.right.isDown;
    }

    isMovingUp() {
        return this.cursors.up.isDown || this.wasd.up.isDown;
    }

    isMovingDown() {
        return this.cursors.down.isDown || this.wasd.down.isDown;
    }

    // Action checks
    isJumping() {
        const jumpPressed = this.isMovingUp() || this.keyBindings.space.isDown;
        
        // Handle jump only once per press
        if (jumpPressed && !this.isJumpPressed) {
            this.isJumpPressed = true;
            return true;
        }
        
        // Reset jump when keys are released
        if (!jumpPressed) {
            this.isJumpPressed = false;
        }
        
        return false;
    }

    isShiftPressed() {
        return this.keyBindings.shift.isDown;
    }

    getMovementDirection() {
        if (this.isMovingLeft()) return 'left';
        if (this.isMovingRight()) return 'right';
        return null;
    }

    // Action handlers
    handleShoot() {
        // Determine shooting direction
        let shootDirection;
        if (this.wasd.left.isDown) {
            shootDirection = 'left';
        } else if (this.wasd.right.isDown) {
            shootDirection = 'right';
        } else {
            // Use mouse position relative to player
            const player = this.scene.player?.getSprite();
            if (player) {
                shootDirection = this.mouseInput.x < player.x ? 'left' : 'right';
            } else {
                shootDirection = this.lastDirection;
            }
        }

        // Emit shoot event for the scene to handle
        this.scene.events.emit('shoot', shootDirection);
    }

    handleRun() {
        // Emit run event for the scene to handle
        this.scene.events.emit('run');
    }

    handlePause() {
        // Emit pause event for the scene to handle
        this.scene.events.emit('pause');
    }

    // Utility methods
    getMousePosition() {
        return {
            x: this.mouseInput.x,
            y: this.mouseInput.y
        };
    }

    getLastDirection() {
        return this.lastDirection;
    }

    // Clean up
    destroy() {
        // Clean up any event listeners
        this.keyBindings.esc.removeAllListeners();
        this.scene.input.removeAllListeners('pointerdown');
    }
}
