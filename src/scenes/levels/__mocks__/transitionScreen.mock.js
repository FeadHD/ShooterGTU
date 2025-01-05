module.exports = {
    TransitionScreen: jest.fn().mockImplementation(() => ({
        start: jest.fn().mockImplementation(callback => callback())
    }))
};
