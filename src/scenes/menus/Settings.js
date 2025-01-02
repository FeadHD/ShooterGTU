import 'phaser';

export default class Settings extends Phaser.Scene {
    constructor() {
        super('Settings');
        this.isMusicOn = true;
    }

    preload() {
        this.load.image('settingsBackground', 'assets/settings/settings.png');
    }

    create() {
        const { width: canvasWidth, height: canvasHeight } = this.cameras.main;

        // Add background
        const bg = this.add.image(canvasWidth / 2, canvasHeight / 2, 'settingsBackground');
        bg.setDisplaySize(canvasWidth, canvasHeight);

        // Add title with a darker color to be visible on the background
        this.add.text(canvasWidth / 2, canvasHeight * 0.2, 'SETTINGS', {
            fontSize: '32px',
            fill: '#000',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Create music toggle button with darker text
        const bgMusic = this.sound.get('bgMusic');
        const musicText = this.add.text(canvasWidth / 2, canvasHeight * 0.4, 
            bgMusic && bgMusic.isPlaying ? 'Music: ON' : 'Music: OFF', {
            fontSize: '24px',
            fill: '#000',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        musicText.setInteractive({ useHandCursor: true })
            .on('pointerover', () => musicText.setStyle({ fill: '#444' }))
            .on('pointerout', () => musicText.setStyle({ fill: '#000' }))
            .on('pointerdown', () => {
                if (bgMusic) {
                    if (bgMusic.isPlaying) {
                        bgMusic.pause();
                        this.registry.set('musicEnabled', false);
                        musicText.setText('Music: OFF');
                    } else {
                        bgMusic.resume();
                        this.registry.set('musicEnabled', true);
                        musicText.setText('Music: ON');
                    }
                }
            });

        // Create back button with darker text
        const backButton = this.add.text(canvasWidth / 2, canvasHeight * 0.8, 'BACK', {
            fontSize: '24px',
            fill: '#000',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        backButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => backButton.setStyle({ fill: '#444' }))
            .on('pointerout', () => backButton.setStyle({ fill: '#000' }))
            .on('pointerdown', () => {
                this.scene.start('MainMenu');
            });
    }
}
