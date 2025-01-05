const managerMocks = {
    animations: {
        createAllAnimations: jest.fn(),
        update: jest.fn(),
    },
    boundaries: {
        createBoundaries: jest.fn(),
        update: jest.fn(),
    },
    gameState: {
        initializeGameState: jest.fn(),
        update: jest.fn(),
    },
    music: {
        setCurrentMusic: jest.fn(),
        update: jest.fn(),
    },
    entityManager: {
        update: jest.fn(),
    },
    hazards: {
        update: jest.fn(),
    },
    debug: {
        update: jest.fn(),
    },
    sound: {
        add: jest.fn(),
        play: jest.fn(),
    },
    persistence: {
        save: jest.fn(),
        load: jest.fn(),
    },
    effects: {
        createEffect: jest.fn(),
        update: jest.fn(),
    },
    enemies: {
        update: jest.fn(),
        addEnemy: jest.fn(),
        removeEnemy: jest.fn(),
        getEnemies: jest.fn().mockReturnValue([]),
        getEnemyCount: jest.fn().mockReturnValue(0),
        handleBulletHit: jest.fn(),
        add: jest.fn(),
    },
};

const ManagerFactory = {
    createManagers: jest.fn().mockReturnValue(managerMocks),
};

module.exports = { ManagerFactory, managerMocks };
