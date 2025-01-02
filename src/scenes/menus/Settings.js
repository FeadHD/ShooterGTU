import 'phaser';

export default class Settings extends Phaser.Scene {
    constructor() {
        super('Settings');
        this.isMusicOn = true;
    }

    preload() {
        this.load.image('settingsBackground', 'assets/settings/settings.png');
        this.load.font('Gameplay', 'assets/fonts/retronoid/Gameplay.ttf');
        this.load.audio('confirmSound', 'assets/sounds/confirmation.mp3');
    }

    create() {
        const { width: canvasWidth, height: canvasHeight } = this.cameras.main;

        // Helper function to play confirmation sound
        const playConfirmSound = () => {
            const sfxVolume = this.registry.get('sfxVolume') ?? 1;
            const confirmSound = this.sound.add('confirmSound', { volume: sfxVolume });
            confirmSound.play();
        };

        // Add background
        const bg = this.add.image(canvasWidth / 2, canvasHeight / 2, 'settingsBackground');
        bg.setDisplaySize(canvasWidth, canvasHeight);

        // Add title with a darker color to be visible on the background
        this.add.text(canvasWidth / 2, canvasHeight * 0.2, 'SETTINGS', {
            fontFamily: 'Gameplay',
            fontSize: '64px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            fontWeight: 'bold'
        }).setOrigin(0.5);

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
                this.scene.start('ControlsSettings');
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
                this.scene.start('SoundSettings');
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
                this.scene.start('MainMenu');
            });
    }
}
