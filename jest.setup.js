require('@testing-library/jest-dom');

// Mock Phaser
global.Phaser = {
    Game: jest.fn(),
    Scene: class MockScene {},
    GameObjects: {
        Sprite: jest.fn(),
        Image: jest.fn(),
    },
    Physics: {
        Arcade: {
            Sprite: jest.fn(),
        },
    },
};
