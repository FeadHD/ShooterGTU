jest.mock('phaser');

const { AudioManager } = require('../../AudioManager').default;

describe('AudioManager', () => {
    let audioManager;
    let mockScene;
    let mockSound;

    beforeEach(() => {
        // Create mock sound object
        mockSound = {
            play: jest.fn(),
            stop: jest.fn(),
            setVolume: jest.fn(),
            isPlaying: false,
            isPaused: false,
            pause: jest.fn(),
            resume: jest.fn()
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

        // Create AudioManager instance
        audioManager = new AudioManager(mockScene);
    });

    describe('volume management', () => {
        it('should initialize with default volume from registry', () => {
            expect(mockScene.registry.get).toHaveBeenCalledWith('soundVolume');
            expect(audioManager.getVolume()).toBe(1);
        });

        it('should update all sound volumes when volume is changed', () => {
            // Add some sounds
            audioManager.add('sound1');
            audioManager.add('sound2');

            // Change volume
            audioManager.setVolume(0.5);

            // Verify all sounds had their volume updated
            const sounds = Array.from(audioManager.sounds.values());
            sounds.forEach(sound => {
                expect(sound.setVolume).toHaveBeenCalledWith(0.5);
            });
        });

        it('should update volumes when registry volume changes', () => {
            // Add some sounds
            audioManager.add('sound1');
            audioManager.add('sound2');

            // Get the volume change callback
            const [eventName, callback] = mockScene.registry.events.on.mock.calls[0];
            expect(eventName).toBe('changedata-soundVolume');

            // Simulate volume change through registry
            callback(null, 0.7);

            // Verify all sounds had their volume updated
            const sounds = Array.from(audioManager.sounds.values());
            sounds.forEach(sound => {
                expect(sound.setVolume).toHaveBeenCalledWith(0.7);
            });
        });
    });

    describe('sound management', () => {
        it('should add sounds to the collection', () => {
            audioManager.add('test');
            expect(mockScene.sound.add).toHaveBeenCalledWith('test', undefined);
            expect(audioManager.sounds.has('test')).toBe(true);
        });

        it('should play existing sounds', () => {
            // Add a sound
            audioManager.add('test');
            const sound = audioManager.sounds.get('test');

            // Play it
            audioManager.play('test');
            expect(sound.play).toHaveBeenCalled();
        });

        it('should create and play new sounds automatically', () => {
            // Play without adding first
            audioManager.play('test');

            // Should create new sound
            expect(mockScene.sound.add).toHaveBeenCalledWith('test', {
                volume: 1
            });

            // Should play the sound
            const sound = audioManager.sounds.get('test');
            expect(sound.play).toHaveBeenCalled();
        });

        it('should stop specific sounds', () => {
            // Add and get a sound
            audioManager.add('test');
            const sound = audioManager.sounds.get('test');

            // Stop it
            audioManager.stop('test');
            expect(sound.stop).toHaveBeenCalled();
        });

        it('should stop all sounds', () => {
            // Add multiple sounds
            audioManager.add('test1');
            audioManager.add('test2');
            const sound1 = audioManager.sounds.get('test1');
            const sound2 = audioManager.sounds.get('test2');

            // Stop all
            audioManager.stopAll();

            // Verify all sounds were stopped
            expect(sound1.stop).toHaveBeenCalled();
            expect(sound2.stop).toHaveBeenCalled();
        });

        it('should not play already playing sounds', () => {
            // Add a sound that's already playing
            audioManager.add('test');
            const sound = audioManager.sounds.get('test');
            sound.isPlaying = true;

            // Try to play it
            audioManager.play('test');
            expect(sound.play).not.toHaveBeenCalled();
        });

        test('should add and play a sound', () => {
            audioManager.add('test');
            audioManager.play('test');
            expect(mockScene.sound.add).toHaveBeenCalled();
            expect(mockSound.play).toHaveBeenCalled();
        });

        test('should stop a sound', () => {
            audioManager.add('test');
            audioManager.stop('test');
            expect(mockSound.stop).toHaveBeenCalled();
        });

        test('should update volume', () => {
            audioManager.add('test');
            audioManager.setVolume(0.5);
            expect(mockSound.setVolume).toHaveBeenCalledWith(0.5);
        });

        test('should mute all sounds', () => {
            audioManager.add('test');
            audioManager.mute();
            expect(audioManager.isMuted).toBe(true);
        });

        test('should unmute all sounds', () => {
            audioManager.add('test');
            audioManager.mute();
            audioManager.unmute();
            expect(audioManager.isMuted).toBe(false);
        });
    });
});
