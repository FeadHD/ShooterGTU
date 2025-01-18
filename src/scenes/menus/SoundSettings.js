/**
 * SoundSettings.js
 * Manages audio configuration for both music and sound effects.
 * Provides interactive sliders for volume control and persists settings.
 */

import 'phaser';
import AudioManager from '../../modules/managers/AudioManager';

export default class SoundSettings extends Phaser.Scene {
    constructor() {
        super('SoundSettings');
    }

    /**
     * SCENE INITIALIZATION
     * Setup scene state and handle pause menu integration
     */
    init(data) {
        this.fromPause = data?.fromPause || false;
        this.parentScene = data?.parentScene;
        
        // Maintain pause state when accessed from game
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

    /**
     * ASSET LOADING
     * Load required images, fonts, and sounds
     */
    preload() {
        this.load.image('settingsBackground', 'public/assets/settings/settings.png');
        this.load.font('Gameplay', 'public/assets/fonts/retronoid/Gameplay.ttf');
        this.load.audio('confirmSound', 'public/assets/sounds/confirmation.mp3');
    }

    /**
     * SCENE CREATION
     * Build the sound settings interface with volume controls
     */
    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Setup audio management
        this.audioManager = new AudioManager(this);

        // Get stored volume preferences
        const musicVolume = this.registry.get('musicVolume') ?? 1;
        const sfxVolume = this.registry.get('soundVolume') ?? 1;

        // Get navigation context
        this.fromPause = this.scene.settings.data?.fromPause;
        this.parentScene = this.scene.settings.data?.parentScene;

        // Setup background and title
        const bg = this.add.image(centerX, centerY, 'settingsBackground');
        bg.setDisplaySize(width, height);

        this.add.text(centerX, height * 0.15, 'SOUND SETTINGS', {
            fontFamily: 'Gameplay',
            fontSize: '64px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            fontWeight: 'bold'
        }).setOrigin(0.5);

        /**
         * LAYOUT CONFIGURATION
         * Calculate positions for consistent UI spacing
         */
        const startY = height * 0.35;    // Vertical start position
        const spacing = height * 0.15;    // Space between controls
        const textX = width * 0.15;       // Left-aligned labels
        const sliderX = width * 0.40;     // Right-aligned sliders

        /**
         * MUSIC VOLUME CONTROL
         */
        const musicText = this.add.text(textX, startY, 'MUSIC', {
            fontFamily: 'Gameplay',
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            fontWeight: 'bold'
        }).setOrigin(0, 0.5);

        // Create interactive music volume slider
        this.createVolumeSlider(sliderX, startY, musicVolume, (value) => {
            value = Math.abs(value) < 0.01 ? 0 : value;
            if (Number.isFinite(value)) {
                this.audioManager.setMusicVolume(value);
            }
        });

        /**
         * SOUND EFFECTS VOLUME CONTROL
         */
        const sfxText = this.add.text(textX, startY + spacing, 'SOUND EFFECTS', {
            fontFamily: 'Gameplay',
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            fontWeight: 'bold'
        }).setOrigin(0, 0.5);

        // Create interactive SFX volume slider
        this.createVolumeSlider(sliderX, startY + spacing, sfxVolume, (value) => {
            value = Math.abs(value) < 0.01 ? 0 : value;
            if (Number.isFinite(value)) {
                this.audioManager.setSoundVolume(value);
            }
        });

        /**
         * SOUND EFFECT HANDLER
         * Plays confirmation sound with proper volume
         */
        const playConfirmSound = () => {
            const sfxVolume = this.registry.get('soundVolume') ?? 1;
            if (sfxVolume !== 0 && Number.isFinite(sfxVolume)) {
                const confirmSound = this.sound.add('confirmSound');
                confirmSound.setVolume(sfxVolume);
                confirmSound.play();
                confirmSound.once('complete', () => {
                    confirmSound.destroy();
                });
            }
        };

        /**
         * BACK NAVIGATION
         */
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
                // Maintain pause state if needed
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
                // Return to settings menu
                this.scene.start('Settings', { 
                    fromPause: this.fromPause, 
                    parentScene: this.parentScene 
                });
                this.scene.stop();
            });
    }

    /**
     * VOLUME SLIDER CREATION
     * Creates an interactive slider for volume control
     * @param {number} x - X position of slider
     * @param {number} y - Y position of slider
     * @param {number} initialValue - Initial volume value (0-1)
     * @param {Function} onChange - Callback when volume changes
     */
    createVolumeSlider(x, y, initialValue, onChange) {
        const width = 400;   // Slider width
        const height = 15;   // Slider height
        const padding = 15;  // Spacing between elements

        // Create slider track
        const sliderBg = this.add.rectangle(x, y, width, height, 0x333333);
        sliderBg.setOrigin(0, 0.5);
        sliderBg.setStrokeStyle(2, 0x666666);

        // Create volume level indicator
        const sliderFill = this.add.rectangle(x, y, width * initialValue, height, 0xFF8C00);
        sliderFill.setOrigin(0, 0.5);

        // Create draggable handle
        const handle = this.add.circle(x + (width * initialValue), y, height * 1.2, 0xffffff);
        handle.setStrokeStyle(2, 0x999999);

        // Add percentage display
        const percentText = this.add.text(x + width + padding * 2, y, Math.round(initialValue * 100) + '%', {
            fontFamily: 'Gameplay',
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);

        // Setup drag interaction
        handle.setInteractive({ draggable: true });
        let isDragging = false;

        handle.on('dragstart', () => {
            isDragging = true;
        });

        handle.on('drag', (pointer, dragX) => {
            if (!isDragging) return;

            // Keep handle within slider bounds
            dragX = Phaser.Math.Clamp(dragX, x, x + width);
            
            // Update UI elements
            handle.x = dragX;
            const value = (dragX - x) / width;
            sliderFill.width = (dragX - x);
            percentText.setText(Math.round(value * 100) + '%');
            
            // Update volume
            onChange(value);
        });

        handle.on('dragend', () => {
            isDragging = false;
        });

        // Allow clicking anywhere on slider
        sliderBg.setInteractive();
        sliderBg.on('pointerdown', (pointer) => {
            const value = (pointer.x - x) / width;
            const clampedValue = Phaser.Math.Clamp(value, 0, 1);
            
            // Update UI elements
            handle.x = x + (width * clampedValue);
            sliderFill.width = width * clampedValue;
            percentText.setText(Math.round(clampedValue * 100) + '%');
            
            // Update volume
            onChange(clampedValue);
        });
    }
}
