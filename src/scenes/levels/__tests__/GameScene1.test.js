jest.mock('phaser', () => require('../__mocks__/phaser.mock'));
jest.mock('../../elements/BaseScene', () => require('../__mocks__/baseScene.mock'));
jest.mock('../../../modules/di/ManagerFactory', () => require('../__mocks__/managers.mock'));
jest.mock('../../../prefabs/Player', () => require('../__mocks__/player.mock'));
jest.mock('../../../prefabs/Trampoline', () => require('../__mocks__/trampoline.mock'));
jest.mock('../../elements/UIManager', () => require('../__mocks__/gameUI.mock'));
jest.mock('../../elements/TransitionScreen', () => require('../__mocks__/transitionScreen.mock'));

const { GameScene1 } = require('../GameScene1');
const { ManagerFactory, managerMocks } = require('../__mocks__/managers.mock');

describe('GameScene1', () => {
    let gameScene;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Create a new instance for each test
        gameScene = new GameScene1();

        // Set up required properties
        gameScene.scale = { width: 800, height: 600 };
        gameScene.registry = {
            get: jest.fn().mockReturnValue(0),
            set: jest.fn(),
            events: {
                on: jest.fn()
            }
        };
        gameScene.events = {
            on: jest.fn()
        };
        gameScene.sound = {
            add: jest.fn().mockReturnValue({
                play: jest.fn(),
                setVolume: jest.fn(),
                destroy: jest.fn(),
                isPlaying: false
            })
        };

        // Create required UI components
        gameScene.gameUI = {
            startTimer: jest.fn(),
            animateUIElements: jest.fn(),
            updateScore: jest.fn(),
            updateLives: jest.fn(),
            updateHP: jest.fn(),
            updateBitcoins: jest.fn()
        };

        // Call preload to initialize any necessary assets
        gameScene.preload();
    });

    describe('dependency injection', () => {
        it('should create and inject managers through ManagerFactory', () => {
            // Act
            const managers = ManagerFactory.createManagers(gameScene);
            
            // Assert
            expect(ManagerFactory.createManagers).toHaveBeenCalledWith(gameScene);
            expect(managers).toBeDefined();
            expect(managers).toEqual(managerMocks);
            
            // Verify manager methods are available
            expect(managers.animations.createAllAnimations).toBeDefined();
            expect(managers.boundaries.createBoundaries).toBeDefined();
            expect(managers.gameState.initializeGameState).toBeDefined();
            expect(managers.music.setCurrentMusic).toBeDefined();
            expect(managers.entityManager.update).toBeDefined();
            expect(managers.hazards.update).toBeDefined();
            expect(managers.debug.update).toBeDefined();
        });
    });
});
