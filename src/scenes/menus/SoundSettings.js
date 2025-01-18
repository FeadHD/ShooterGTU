import 'phaser';
import AudioManager from '../../modules/managers/AudioManager';

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
        this.load.image('settingsBackground', 'public/assets/settings/settings.png');
        this.load.font('Gameplay', 'public/assets/fonts/retronoid/Gameplay.ttf');
        this.load.audio('confirmSound', 'public/assets/sounds/confirmation.mp3');
    }

    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Initialize audio manager instance
        this.audioManager = new AudioManager(this);

        // Load current volume settings
        const musicVolume = this.registry.get('musicVolume') ?? 1;
        const sfxVolume = this.registry.get('soundVolume') ?? 1;

        // Store the fromPause and parentScene values passed from Settings
        this.fromPause = this.scene.settings.data?.fromPause;
        this.parentScene = this.scene.settings.data?.parentScene;

        // Add background
        const bg = this.add.image(centerX, centerY, 'settingsBackground');
        bg.setDisplaySize(width, height);

        // Add title
        this.add.text(centerX, height * 0.15, 'SOUND SETTINGS', {
            fontFamily: 'Gameplay',
            fontSize: '64px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Calculate positions for better layout
        const startY = height * 0.35;  // Start lower down
        const spacing = height * 0.15;  // More vertical space between elements
        
        // Move text more to the left, and sliders more to the right
        const textX = width * 0.15;     // Text starts at 15% of screen width (moved left)
        const sliderX = width * 0.40;   // Slider starts at 40% of screen width

        // Music Section
        const musicText = this.add.text(textX, startY, 'MUSIC', {
            fontFamily: 'Gameplay',
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            fontWeight: 'bold'
        }).setOrigin(0, 0.5);

        // Create music volume controls
        this.createVolumeSlider(sliderX, startY, musicVolume, (value) => {
            value = Math.abs(value) < 0.01 ? 0 : value;
            if (Number.isFinite(value)) {
                // Update music volume through AudioManager
                this.audioManager.setMusicVolume(value);
            }
        });

        // Sound Effects Section
        const sfxText = this.add.text(textX, startY + spacing, 'SOUND EFFECTS', {
            fontFamily: 'Gameplay',
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            fontWeight: 'bold'
        }).setOrigin(0, 0.5);

        // Create SFX volume slider
        this.createVolumeSlider(sliderX, startY + spacing, sfxVolume, (value) => {
            value = Math.abs(value) < 0.01 ? 0 : value;
            if (Number.isFinite(value)) {
                // Update sound effects volume through AudioManager
                this.audioManager.setSoundVolume(value);
            }
        });

        // Helper function to play confirmation sound
        const playConfirmSound = () => {
            const sfxVolume = this.registry.get('soundVolume') ?? 1;  // Use nullish coalescing
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

        // Add Back button at the bottom
        const backButton = this.add.text(centerX, height * 0.8, 'BACK', {
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
        const width = 400;  // Increased width
        const height = 15;  // Increased height
        const padding = 15; // Increased padding

        // Create slider background with rounded corners
        const sliderBg = this.add.rectangle(x, y, width, height, 0x333333);
        sliderBg.setOrigin(0, 0.5);
        sliderBg.setStrokeStyle(2, 0x666666);

        // Create slider fill with orange color
        const sliderFill = this.add.rectangle(x, y, width * initialValue, height, 0xFF8C00);
        sliderFill.setOrigin(0, 0.5);

        // Create slider handle with a metallic look
        const handle = this.add.circle(x + (width * initialValue), y, height * 1.2, 0xffffff);
        handle.setStrokeStyle(2, 0x999999);

        // Add percentage text
        const percentText = this.add.text(x + width + padding * 2, y, Math.round(initialValue * 100) + '%', {
            fontFamily: 'Gameplay',
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);

        // Make handle interactive
        handle.setInteractive({ draggable: true });

        // Track if we're currently dragging
        let isDragging = false;

        handle.on('dragstart', () => {
            isDragging = true;
        });

        handle.on('drag', (pointer, dragX) => {
            if (!isDragging) return;

            // Clamp dragX to slider bounds
            dragX = Phaser.Math.Clamp(dragX, x, x + width);
            
            // Update handle position
            handle.x = dragX;
            
            // Calculate new value
            const value = (dragX - x) / width;
            
            // Update fill width
            sliderFill.width = (dragX - x);
            
            // Update percentage text
            percentText.setText(Math.round(value * 100) + '%');
            
            // Call onChange with new value
            onChange(value);
        });

        handle.on('dragend', () => {
            isDragging = false;
        });

        // Make background interactive for clicking
        sliderBg.setInteractive();
        sliderBg.on('pointerdown', (pointer) => {
            const value = (pointer.x - x) / width;
            const clampedValue = Phaser.Math.Clamp(value, 0, 1);
            
            // Update handle position
            handle.x = x + (width * clampedValue);
            
            // Update fill width
            sliderFill.width = width * clampedValue;
            
            // Update percentage text
            percentText.setText(Math.round(clampedValue * 100) + '%');
            
            // Call onChange with new value
            onChange(clampedValue);
        });
    }
}
