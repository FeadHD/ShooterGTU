module.exports = {
    default: jest.fn().mockImplementation(() => ({
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
        update: jest.fn()
    }))
};
