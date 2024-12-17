import 'phaser';

export default class Settings extends Phaser.Scene {
    constructor() {
        super('Settings');
        this.isMusicOn = true;
    }

    create() {
        const { width: canvasWidth, height: canvasHeight } = this.cameras.main;

        // Add title
        this.add.text(canvasWidth / 2, canvasHeight * 0.2, 'SETTINGS', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Create music toggle button
        const musicText = this.add.text(canvasWidth / 2, canvasHeight * 0.4, 'Music: ON', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);
        
        musicText.setInteractive({ useHandCursor: true })
            .on('pointerover', () => musicText.setStyle({ fill: '#ff0' }))
            .on('pointerout', () => musicText.setStyle({ fill: '#fff' }))
            .on('pointerdown', () => {
                const bgMusic = this.sound.get('bgMusic');
                if (bgMusic) {
                    if (bgMusic.isPlaying) {
                        bgMusic.pause();
                        this.isMusicOn = false;
                        musicText.setText('Music: OFF');
                    } else {
                        bgMusic.resume();
                        this.isMusicOn = true;
                        musicText.setText('Music: ON');
                    }
                }
            });

        // Create back button
        const backButton = this.add.text(canvasWidth / 2, canvasHeight * 0.8, 'BACK', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        backButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => backButton.setStyle({ fill: '#ff0' }))
            .on('pointerout', () => backButton.setStyle({ fill: '#fff' }))
            .on('pointerdown', () => {
                this.scene.start('MainMenu');
            });
    }
}
