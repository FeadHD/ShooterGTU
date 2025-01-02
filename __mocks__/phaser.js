class MockScene {
    constructor() {
        this.add = {
            sprite: jest.fn().mockReturnThis(),
            image: jest.fn().mockReturnThis(),
        };
        this.physics = {
            add: {
                sprite: jest.fn().mockReturnThis(),
                collider: jest.fn(),
                overlap: jest.fn(),
            },
        };
        this.cameras = {
            main: {
                setBounds: jest.fn(),
                startFollow: jest.fn(),
            },
        };
        this.input = {
            keyboard: {
                addKeys: jest.fn().mockReturnValue({
                    W: {},
                    A: {},
                    S: {},
                    D: {},
                    SPACE: {},
                }),
            },
        };
        this.anims = {
            create: jest.fn(),
            play: jest.fn(),
        };
    }
}

const Phaser = {
    Scene: MockScene,
    Physics: {
        Arcade: {
            Sprite: jest.fn(),
        },
    },
    GameObjects: {
        Sprite: jest.fn(),
        Image: jest.fn(),
    },
};

module.exports = Phaser;
