/**
 * Settings.js
 * Main settings scene that provides access to controls and sound configuration.
 * Handles both standalone settings access and in-game pause menu settings.
 */

import 'phaser';

export default class Settings extends Phaser.Scene {
    constructor() {
        super('Settings');
        this.isMusicOn = true;          // Music toggle state
        this.fromPause = false;         // Whether accessed from pause menu
        this.parentScene = null;        // Reference to paused game scene
    }

    /**
     * ASSET LOADING
     * Load required images, fonts, and sounds
     */
    preload() {
        this.load.image('settingsBackground', 'assets/settings/settings.png');
        this.load.font('Gameplay', 'assets/fonts/retronoid/Gameplay.ttf');
        this.load.audio('confirmSound', 'assets/sounds/confirmation.mp3');
    }

    /**
     * SCENE INITIALIZATION
     * Setup scene state based on how it was launched
     */
    init(data) {
        // Store navigation context
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
     * SCENE CREATION
     * Build the settings menu interface
     */
    create() {
        const { width: canvasWidth, height: canvasHeight } = this.cameras.main;

        // Get navigation context from scene data
        this.fromPause = this.scene.settings.data?.fromPause;
        this.parentScene = this.scene.settings.data?.parentScene;

        // Setup background
        const bg = this.add.image(canvasWidth / 2, canvasHeight / 2, 'settingsBackground');
        bg.setDisplaySize(canvasWidth, canvasHeight);

        // Add settings title
        this.add.text(canvasWidth / 2, canvasHeight * 0.2, 'SETTINGS', {
            fontFamily: 'Gameplay',
            fontSize: '64px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            fontWeight: 'bold'
        }).setOrigin(0.5);

        /**
         * SOUND EFFECT HANDLER
         * Plays confirmation sound with proper volume
         */
        const playConfirmSound = () => {
            const sfxVolume = this.registry.get('sfxVolume') ?? 1;
            // Only create sound if volume > 0
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
         * NAVIGATION BUTTONS
         * Create interactive menu buttons with hover effects
         */
        // Controls settings button
        const controlsButton = this.add.text(canvasWidth / 2, canvasHeight * 0.4, 'Controls', {
            fontFamily: 'Gameplay',
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            fontWeight: 'bold'
        }).setOrigin(0.5);

        controlsButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => controlsButton.setStyle({ fill: '#00ff00' }))
            .on('pointerout', () => controlsButton.setStyle({ fill: '#ffffff' }))
            .on('pointerdown', () => {
                playConfirmSound();
                this.scene.start('ControlsSettings', { fromPause: this.fromPause, parentScene: this.parentScene });
            });

        // Sound settings button
        const soundButton = this.add.text(canvasWidth / 2, canvasHeight * 0.5, 'Sound Settings', {
            fontFamily: 'Gameplay',
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            fontWeight: 'bold'
        }).setOrigin(0.5);

        soundButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => soundButton.setStyle({ fill: '#00ff00' }))
            .on('pointerout', () => soundButton.setStyle({ fill: '#ffffff' }))
            .on('pointerdown', () => {
                playConfirmSound();
                this.scene.start('SoundSettings', { fromPause: this.fromPause, parentScene: this.parentScene });
            });

        // Back navigation button
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
                if (this.fromPause) {
                    // Return to pause menu while maintaining game pause state
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
                    // Resume existing pause menu or create new one
                    const pauseMenu = this.scene.get('PauseMenu');
                    if (pauseMenu) {
                        this.scene.wake('PauseMenu');
                        this.scene.moveAbove('PauseMenu', 'Settings');
                    } else {
                        this.scene.launch('PauseMenu');
                    }
                    this.scene.stop();
                } else {
                    // Return to main menu
                    this.scene.start('MainMenu');
                }
            });
    }

    /**
     * SETTINGS PERSISTENCE
     * Save current settings to local storage
     */
    saveSettings() {
        const settings = {
            // Add your settings here
            timestamp: Date.now() // Add timestamp for versioning
        };
        localStorage.setItem('gameSettings', JSON.stringify(settings));
    }
}
