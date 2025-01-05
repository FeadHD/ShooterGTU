module.exports = {
    GameUI: jest.fn().mockImplementation(() => ({
        startTimer: jest.fn(),
        animateUIElements: jest.fn(),
        updateScore: jest.fn(),
        updateLives: jest.fn(),
        updateHP: jest.fn(),
        updateBitcoins: jest.fn()
    }))
};
