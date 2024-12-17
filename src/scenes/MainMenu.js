import { Scene } from 'phaser';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        // Debug background color to see canvas size
        this.cameras.main.setBackgroundColor('#000000');

        // Add and center the background image
        const bg = this.add.image(0, 0, 'mainbg');
        bg.setOrigin(0, 0);
        
        // Get the canvas dimensions
        const canvasWidth = this.cameras.main.width;
        const canvasHeight = this.cameras.main.height;
        
        // Scale background to fit screen
        bg.setDisplaySize(canvasWidth, canvasHeight);

        // Create title with layered effect for 3D appearance
        const createTitle = () => {
            // Add shadow layers for 3D effect
            const shadowOffset = 4;
            const numLayers = 5;
            
            for (let i = numLayers; i >= 0; i--) {
                const layerColor = i === 0 ? '#4400ff' : '#ff00ff';
                this.add.text(canvasWidth/2 + (i * shadowOffset), canvasHeight * 0.25 + (i * shadowOffset), 'GOOD TIME UNIVERSE', {
                    fontFamily: 'Retronoid, Arial',
                    fontSize: '100px',
                    color: layerColor,
                    align: 'center',
                }).setOrigin(0.5);
            }

            // Add main title text with glow effect
            const mainTitle = this.add.text(canvasWidth/2, canvasHeight * 0.25, 'GOOD TIME UNIVERSE', {
                fontFamily: 'Retronoid, Arial',
                fontSize: '100px',
                color: '#00ffff',
                align: 'center',
                stroke: '#ffffff',
                strokeThickness: 2,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#ff00ff',
                    blur: 8,
                    fill: true
                }
            }).setOrigin(0.5);
        };

        // Create the title
        createTitle();

        // Create retro-style buttons
        const buttonStyle = {
            fontFamily: 'Retronoid, Arial',
            fontSize: '72px',
            color: '#00ffff',
            stroke: '#ffffff',
            strokeThickness: 4,
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#ff00ff',
                blur: 5,
                fill: true
            }
        };

        // Helper function to create buttons
        const createButton = (text, y) => {
            const button = this.add.text(canvasWidth / 2, y, text, buttonStyle)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            button.on('pointerover', () => {
                button.setScale(1.2);
                button.setColor('#ff00ff');
            });

            button.on('pointerout', () => {
                button.setScale(1);
                button.setColor('#00ffff');
            });

            return button;
        };

        // Create menu buttons - moved up for better spacing
        const startButton = createButton('START', canvasHeight * 0.5);
        const settingsButton = createButton('SETTINGS', canvasHeight * 0.6);
        const rulesButton = createButton('RULES', canvasHeight * 0.7);

        // Add click handlers
        startButton.on('pointerdown', () => this.scene.start('GameScene1'));
        settingsButton.on('pointerdown', () => {
            // Add settings functionality here
        });
        rulesButton.on('pointerdown', () => {
            // Add rules functionality here
        });
    }
}
