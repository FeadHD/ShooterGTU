import 'phaser';

export default class Settings extends Phaser.Scene {
    constructor() {
        super('Settings');
        this.isMusicOn = true;
        this.fromPause = false;
        this.parentScene = null;
    }

    preload() {
        this.load.image('settingsBackground', 'assets/settings/settings.png');
        this.load.font('Gameplay', 'assets/fonts/retronoid/Gameplay.ttf');
        this.load.audio('confirmSound', 'assets/sounds/confirmation.mp3');
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

    create() {
        const { width: canvasWidth, height: canvasHeight } = this.cameras.main;

        // Store the fromPause and parentScene values passed from PauseMenu
        this.fromPause = this.scene.settings.data?.fromPause;
        this.parentScene = this.scene.settings.data?.parentScene;

        // Add background
        const bg = this.add.image(canvasWidth / 2, canvasHeight / 2, 'settingsBackground');
        bg.setDisplaySize(canvasWidth, canvasHeight);

        // Add title
        this.add.text(canvasWidth / 2, canvasHeight * 0.2, 'SETTINGS', {
            fontFamily: 'Gameplay',
            fontSize: '64px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Helper function to play confirmation sound
        const playConfirmSound = () => {
            const sfxVolume = this.registry.get('sfxVolume') || 1;
            const confirmSound = this.sound.add('confirmSound');
            confirmSound.setVolume(sfxVolume);
            confirmSound.play();
            confirmSound.once('complete', () => {
                confirmSound.destroy();
            });
        };

        // Add Controls button
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

        // Add Sound Settings button
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
                if (this.fromPause) {
                    // Return to pause menu and ensure game stays paused
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
                    // Resume the pause menu scene instead of launching a new one
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

    saveSettings() {
        // Save current settings to local storage
        const settings = {
            // Add your settings here
            timestamp: Date.now() // Add timestamp for versioning
        };
        localStorage.setItem('gameSettings', JSON.stringify(settings));
    }
}
