import { Scene } from 'phaser';

export class TitleScene extends Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        const { width, height } = this.scale;

        // Add title text
        const titleText = this.add.text(width / 2, height / 3, 'Good Time Universe', {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { color: '#000000', blur: 4, offsetX: 2, offsetY: 2 }
        });
        titleText.setOrigin(0.5);

        // Add skip button
        const skipButton = this.add.text(width / 2, height * 0.7, 'Skip', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        });
        skipButton.setOrigin(0.5);
        skipButton.setInteractive({ useHandCursor: true });

        // Add hover effect
        skipButton.on('pointerover', () => {
            skipButton.setStyle({ color: '#ffff00' });
        });
        skipButton.on('pointerout', () => {
            skipButton.setStyle({ color: '#ffffff' });
        });

        // Add click handler to move to preloader
        skipButton.on('pointerdown', () => {
            this.scene.start('Preloader');
        });
    }
}
