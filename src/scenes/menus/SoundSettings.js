import 'phaser';
import { MusicManager } from '../../modules/managers/MusicManager';

export default class SoundSettings extends Phaser.Scene {
    constructor() {
        super('SoundSettings');
    }

    init(data) {
        this.fromPause = data?.fromPause || false;
        this.parentScene = data?.parentScene;
        
        // If we're coming from pause menu, make sure parent scene stays paused
        if (this.fromPause && this.parentScene) {
            const gameScene = this.scene.get(this.parentScene);
            if (gameScene) {
                gameScene.scene.pause();
                if (gameScene.physics?.world) {
                    try {
                        gameScene.physics.world.pause();
                    } catch (error) {
                        console.warn('Could not pause physics:', error);
                    }
                }
            }
        }
    }

    preload() {
        this.load.image('settingsBackground', 'assets/settings/settings.png');
        this.load.font('Gameplay', 'assets/fonts/retronoid/Gameplay.ttf');
        this.load.audio('confirmSound', 'assets/sounds/confirmation.mp3');
    }

    create() {
        const { width: canvasWidth, height: canvasHeight } = this.cameras.main;

        // Store the fromPause and parentScene values passed from Settings
        this.fromPause = this.scene.settings.data?.fromPause;
        this.parentScene = this.scene.settings.data?.parentScene;

        // Add background
        const bg = this.add.image(canvasWidth / 2, canvasHeight / 2, 'settingsBackground');
        bg.setDisplaySize(canvasWidth, canvasHeight);

        // Add title
        this.add.text(canvasWidth / 2, canvasHeight * 0.2, 'SOUND SETTINGS', {
            fontFamily: 'Gameplay',
            fontSize: '64px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Music Section
        this.add.text(canvasWidth * 0.3, canvasHeight * 0.4, 'MUSIC', {
            fontFamily: 'Gameplay',
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            fontWeight: 'bold'
        }).setOrigin(0, 0.5);

        // Create music volume controls
        const musicVolume = this.registry.get('musicVolume') ?? 1;
        this.createVolumeSlider(canvasWidth * 0.6, canvasHeight * 0.4, musicVolume, (value) => {
            // Ensure value is finite and handle 0 properly
            value = Math.abs(value) < 0.01 ? 0 : value;
            if (Number.isFinite(value)) {
                this.registry.set('musicVolume', value);
                
                // Update all music tracks in the game
                const allSounds = this.sound.getAll();
                allSounds.forEach(sound => {
                    if (sound.key && (
                        sound.key.toLowerCase().includes('music') || 
                        sound.key.toLowerCase().includes('bgm') ||
                        sound.key.toLowerCase() === 'bgmusic'
                    )) {
                        if (value === 0) {
                            sound.setMute(true);
                        } else {
                            sound.setMute(false);
                            sound.setVolume(value);
                        }
                    }
                });

                // Also update any music in other active scenes
                const gameScenes = ['GameScene1', 'GameScene2', 'GameScene3', 'GameScene4', 'GameScene5'];
                gameScenes.forEach(sceneName => {
                    const scene = this.scene.get(sceneName);
                    if (scene && scene.bgMusic) {
                        if (value === 0) {
                            scene.bgMusic.setMute(true);
                        } else {
                            scene.bgMusic.setMute(false);
                            scene.bgMusic.setVolume(value);
                        }
                    }
                });
            }
        });

        // Sound Effects Section
        this.add.text(canvasWidth * 0.3, canvasHeight * 0.55, 'SOUND EFFECTS', {
            fontFamily: 'Gameplay',
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            fontWeight: 'bold'
        }).setOrigin(0, 0.5);

        // Create SFX volume slider
        const sfxVolume = this.registry.get('sfxVolume') ?? 1;
        this.createVolumeSlider(canvasWidth * 0.6, canvasHeight * 0.55, sfxVolume, (value) => {
            // Ensure 0 is exactly 0 and value is finite
            value = Math.abs(value) < 0.01 ? 0 : value;
            if (Number.isFinite(value)) {
                this.registry.set('sfxVolume', value);
            }
        });

        // Helper function to play confirmation sound
        const playConfirmSound = () => {
            const sfxVolume = this.registry.get('sfxVolume') ?? 1;  // Use nullish coalescing
            // Do not create or play any sound if volume is 0
            if (sfxVolume !== 0 && Number.isFinite(sfxVolume)) {
                const confirmSound = this.sound.add('confirmSound');
                confirmSound.setVolume(sfxVolume);
                confirmSound.play();
                confirmSound.once('complete', () => {
                    confirmSound.destroy();
                });
            }
        };

        // Add Back button
        const backButton = this.add.text(canvasWidth / 2, canvasHeight * 0.8, 'Back', {
            fontFamily: 'Gameplay',
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            fontWeight: 'bold'
        }).setOrigin(0.5);

        backButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => backButton.setStyle({ fill: '#00ff00' }))
            .on('pointerout', () => backButton.setStyle({ fill: '#ffffff' }))
            .on('pointerdown', () => {
                playConfirmSound();
                // Return to Settings scene with the same pause state
                if (this.fromPause && this.parentScene) {
                    const gameScene = this.scene.get(this.parentScene);
                    if (gameScene) {
                        gameScene.scene.pause();
                        if (gameScene.physics?.world) {
                            try {
                                gameScene.physics.world.pause();
                            } catch (error) {
                                console.warn('Could not pause physics:', error);
                            }
                        }
                    }
                }
                // Start the settings scene with the same data
                this.scene.start('Settings', { 
                    fromPause: this.fromPause, 
                    parentScene: this.parentScene 
                });
                this.scene.stop();
            });
    }

    createVolumeSlider(x, y, initialValue, onChange) {
        const width = 300;
        const height = 10;
        const padding = 10;

        // Create slider background
        const sliderBg = this.add.rectangle(x, y, width, height, 0x000000);
        sliderBg.setOrigin(0, 0.5);
        sliderBg.setStrokeStyle(2, 0xffffff);

        // Create slider fill
        const sliderFill = this.add.rectangle(x, y, width * initialValue, height, 0x00ff00);
        sliderFill.setOrigin(0, 0.5);

        // Create slider handle
        const handle = this.add.circle(x + (width * initialValue), y, height * 1.5, 0xffffff);
        handle.setStrokeStyle(2, 0x000000);

        // Create interactive area (slightly larger than visible slider)
        const hitArea = this.add.rectangle(x, y, width, height * 4, 0xffffff, 0);
        hitArea.setOrigin(0, 0.5);
        hitArea.setInteractive({ useHandCursor: true });

        // Add percentage text
        const percentText = this.add.text(x + width + padding * 2, y, Math.round(initialValue * 100), {
            fontFamily: 'Gameplay',
            fontSize: '32px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0, 0.5);

        // Handle drag events
        let isDragging = false;
        
        hitArea.on('pointerdown', (pointer) => {
            isDragging = true;
            updateSlider(pointer);
        });

        this.input.on('pointermove', (pointer) => {
            if (isDragging) {
                updateSlider(pointer);
            }
        });

        this.input.on('pointerup', () => {
            isDragging = false;
        });

        const updateSlider = (pointer) => {
            const localX = pointer.x - x;
            let value = Phaser.Math.Clamp(localX / width, 0, 1);
            
            // Update visuals
            sliderFill.width = width * value;
            handle.x = x + (width * value);
            percentText.setText(Math.round(value * 100));
            
            // Call callback with exact value (can be 0)
            onChange(value);

            // Update handle color based on value
            if (value === 0) {
                handle.setFillStyle(0xff0000); // Red when muted
            } else {
                handle.setFillStyle(0xffffff); // White when not muted
            }
        };
    }
}
