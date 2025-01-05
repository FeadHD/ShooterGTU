module.exports = {
    default: jest.fn().mockImplementation((scene, x, y) => ({
        x,
        y,
        body: {
            velocity: { x: 0, y: 0 },
            blocked: { down: true },
            onFloor: jest.fn().mockReturnValue(true)
        },
        controller: {
            controls: {
                jump: { isDown: false, wasJustPressed: false }
            },
            enabled: true,
            isMovingDown: jest.fn(),
            isMovingLeft: jest.fn(),
            isMovingRight: jest.fn(),
            isMovingUp: jest.fn()
        },
        doubleJumpSpeed: -300,
        jumpSpeed: -330,
        movementSpeed: 160,
        isDying: false,
        setPosition: jest.fn(),
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        setFlipX: jest.fn(),
        play: jest.fn(),
        setAlpha: jest.fn(),
        setCollideWorldBounds: jest.fn(),
        setDepth: jest.fn(),
        setGravityY: jest.fn(),
        setImmovable: jest.fn(),
        setScale: jest.fn(),
        setTexture: jest.fn(),
        setTint: jest.fn(),
        update: jest.fn().mockImplementation(function() {
            // Handle horizontal movement
            if (this.controller.isMovingLeft()) {
                this.setVelocityX(-this.movementSpeed);
                this.setFlipX(true);
            } else if (this.controller.isMovingRight()) {
                this.setVelocityX(this.movementSpeed);
                this.setFlipX(false);
            } else {
                this.setVelocityX(0);
                this.play('character_Idle', true);
            }

            // Handle jumping
            if (this.controller.isMovingUp() && this.body.blocked.down) {
                this.setVelocityY(this.jumpSpeed);
                this.play('character_Jump', true);
            }
        })
    }))
};
