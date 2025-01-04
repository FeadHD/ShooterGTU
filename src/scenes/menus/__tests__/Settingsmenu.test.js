import 'jest-canvas-mock';
import '@testing-library/jest-dom';
import Settings from '../Settings';

describe('Settings Scene', () => {
    let settingsScene;
    let mockScene;

    beforeEach(() => {
        // Create a reusable mock text object
        const createMockText = () => ({
            setOrigin: jest.fn().mockReturnThis(),
            setInteractive: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            setStyle: jest.fn().mockReturnThis(),
            emit: jest.fn()
        });

        // Mock Phaser scene
        mockScene = {
            add: {
                text: jest.fn().mockImplementation(() => createMockText()),
                image: jest.fn().mockReturnValue({
                    setDisplaySize: jest.fn().mockReturnThis()
                })
            },
            cameras: {
                main: {
                    width: 800,
                    height: 600
                }
            },
            scene: {
                key: 'Settings',
                start: jest.fn(),
                get: jest.fn(),
                settings: {
                    data: {}
                }
            },
            registry: {
                get: jest.fn().mockReturnValue(1)
            },
            sound: {
                add: jest.fn().mockReturnValue({
                    setVolume: jest.fn(),
                    play: jest.fn(),
                    once: jest.fn(),
                    destroy: jest.fn()
                })
            },
            load: {
                image: jest.fn(),
                font: jest.fn(),
                audio: jest.fn()
            }
        };

        // Create Settings scene instance
        settingsScene = new Settings();
        // Inject mock methods
        Object.assign(settingsScene, mockScene);
    });

    test('scene should be created with correct key', () => {
        expect(settingsScene.scene.key).toBe('Settings');
    });

    test('preload should load required assets', () => {
        settingsScene.preload();
        
        expect(settingsScene.load.image).toHaveBeenCalledWith(
            'settingsBackground',
            'assets/settings/settings.png'
        );
        expect(settingsScene.load.font).toHaveBeenCalledWith(
            'Gameplay',
            'assets/fonts/retronoid/Gameplay.ttf'
        );
        expect(settingsScene.load.audio).toHaveBeenCalledWith(
            'confirmSound',
            'assets/sounds/confirmation.mp3'
        );
    });

    test('init should handle pause state correctly', () => {
        const mockGameScene = {
            scene: { pause: jest.fn() },
            physics: { world: { pause: jest.fn() } }
        };
        settingsScene.scene.get.mockReturnValue(mockGameScene);

        settingsScene.init({ fromPause: true, parentScene: 'GameScene' });

        expect(settingsScene.fromPause).toBe(true);
        expect(settingsScene.parentScene).toBe('GameScene');
        expect(mockGameScene.scene.pause).toHaveBeenCalled();
        expect(mockGameScene.physics.world.pause).toHaveBeenCalled();
    });

    test('create should set up UI elements correctly', () => {
        settingsScene.create();

        // Check if background is created
        expect(settingsScene.add.image).toHaveBeenCalledWith(
            400, // width/2
            300, // height/2
            'settingsBackground'
        );

        // Check if title is created
        expect(settingsScene.add.text).toHaveBeenCalledWith(
            400, // width/2
            120, // height*0.2
            'SETTINGS',
            expect.any(Object)
        );

        // Check if buttons are created
        expect(settingsScene.add.text).toHaveBeenCalledWith(
            400, // width/2
            240, // height*0.4
            'Controls',
            expect.any(Object)
        );

        expect(settingsScene.add.text).toHaveBeenCalledWith(
            400, // width/2
            300, // height*0.5
            'Sound Settings',
            expect.any(Object)
        );
    });

    test('button interactions should work correctly', () => {
        // Create a mock button
        const mockButton = {
            setStyle: jest.fn(),
            setOrigin: jest.fn().mockReturnThis(),
            setInteractive: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis()
        };

        // Make add.text return our mock button
        settingsScene.add.text
            .mockReturnValueOnce({ // Title
                setOrigin: jest.fn().mockReturnThis()
            })
            .mockReturnValueOnce(mockButton)  // Controls button
            .mockReturnValueOnce({ // Sound button
                setOrigin: jest.fn().mockReturnThis(),
                setInteractive: jest.fn().mockReturnThis(),
                on: jest.fn().mockReturnThis()
            })
            .mockReturnValueOnce({ // Back button
                setOrigin: jest.fn().mockReturnThis(),
                setInteractive: jest.fn().mockReturnThis(),
                on: jest.fn().mockReturnThis()
            });
        
        // Set up scene data
        settingsScene.scene.settings.data = {
            fromPause: false,
            parentScene: null
        };
        
        // Create the scene which will set up the buttons
        settingsScene.create();
        
        // Get all the event handlers that were registered
        const events = mockButton.on.mock.calls;
        
        // Find and execute the hover handlers
        const pointeroverCall = events.find(call => call[0] === 'pointerover');
        if (pointeroverCall) {
            pointeroverCall[1].call(mockButton); // Execute the handler
            expect(mockButton.setStyle).toHaveBeenCalledWith({ fill: '#00ff00' });
        }
        
        const pointeroutCall = events.find(call => call[0] === 'pointerout');
        if (pointeroutCall) {
            pointeroutCall[1].call(mockButton); // Execute the handler
            expect(mockButton.setStyle).toHaveBeenCalledWith({ fill: '#ffffff' });
        }
        
        // Test click handler
        const pointerdownCall = events.find(call => call[0] === 'pointerdown');
        if (pointerdownCall) {
            pointerdownCall[1].call(mockButton); // Execute the handler
            expect(settingsScene.sound.add).toHaveBeenCalledWith('confirmSound');
            expect(settingsScene.scene.start).toHaveBeenCalledWith('ControlsSettings', {
                fromPause: false,
                parentScene: null
            });
        }
    });
});
