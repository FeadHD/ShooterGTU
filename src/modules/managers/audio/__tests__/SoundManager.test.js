jest.mock('phaser');

const { SoundManager } = require('../SoundManager');

describe('SoundManager', () => {
    let soundManager;
    let mockScene;
    let mockSound;

    beforeEach(() => {
        // Create mock sound object
        mockSound = {
            play: jest.fn(),
            stop: jest.fn(),
            setVolume: jest.fn(),
            isPlaying: false
        };

        // Create mock scene
        mockScene = {
            registry: {
                get: jest.fn().mockReturnValue(1), // Default volume
                events: {
                    on: jest.fn()
                }
            },
            sound: {
                add: jest.fn().mockReturnValue(mockSound)
            }
        };

        // Create SoundManager instance
        soundManager = new SoundManager(mockScene);
    });

    describe('volume management', () => {
        it('should initialize with default volume from registry', () => {
            expect(mockScene.registry.get).toHaveBeenCalledWith('soundVolume');
            expect(soundManager.getVolume()).toBe(1);
        });

        it('should update all sound volumes when volume is changed', () => {
            // Add some sounds
            soundManager.add('sound1');
            soundManager.add('sound2');

            // Change volume
            soundManager.setVolume(0.5);

            // Verify all sounds had their volume updated
            const sounds = Array.from(soundManager.sounds.values());
            sounds.forEach(sound => {
                expect(sound.setVolume).toHaveBeenCalledWith(0.5);
            });
        });

        it('should update volumes when registry volume changes', () => {
            // Add some sounds
            soundManager.add('sound1');
            soundManager.add('sound2');

            // Get the volume change callback
            const [eventName, callback] = mockScene.registry.events.on.mock.calls[0];
            expect(eventName).toBe('changedata-soundVolume');

            // Simulate volume change through registry
            callback(null, 0.7);

            // Verify all sounds had their volume updated
            const sounds = Array.from(soundManager.sounds.values());
            sounds.forEach(sound => {
                expect(sound.setVolume).toHaveBeenCalledWith(0.7);
            });
        });
    });

    describe('sound management', () => {
        it('should add sounds to the collection', () => {
            soundManager.add('test');
            expect(mockScene.sound.add).toHaveBeenCalledWith('test', undefined);
            expect(soundManager.sounds.has('test')).toBe(true);
        });

        it('should play existing sounds', () => {
            // Add a sound
            soundManager.add('test');
            const sound = soundManager.sounds.get('test');

            // Play it
            soundManager.play('test');
            expect(sound.play).toHaveBeenCalled();
        });

        it('should create and play new sounds automatically', () => {
            // Play without adding first
            soundManager.play('test');

            // Should create new sound
            expect(mockScene.sound.add).toHaveBeenCalledWith('test', {
                volume: 1
            });

            // Should play the sound
            const sound = soundManager.sounds.get('test');
            expect(sound.play).toHaveBeenCalled();
        });

        it('should stop specific sounds', () => {
            // Add and get a sound
            soundManager.add('test');
            const sound = soundManager.sounds.get('test');

            // Stop it
            soundManager.stop('test');
            expect(sound.stop).toHaveBeenCalled();
        });

        it('should stop all sounds', () => {
            // Add multiple sounds
            soundManager.add('test1');
            soundManager.add('test2');
            const sound1 = soundManager.sounds.get('test1');
            const sound2 = soundManager.sounds.get('test2');

            // Stop all
            soundManager.stopAll();

            // Verify all sounds were stopped
            expect(sound1.stop).toHaveBeenCalled();
            expect(sound2.stop).toHaveBeenCalled();
        });

        it('should not play already playing sounds', () => {
            // Add a sound that's already playing
            soundManager.add('test');
            const sound = soundManager.sounds.get('test');
            sound.isPlaying = true;

            // Try to play it
            soundManager.play('test');
            expect(sound.play).not.toHaveBeenCalled();
        });
    });
});
