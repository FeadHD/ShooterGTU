import { Scene } from 'phaser';
import { PlayerController } from '../../modules/controls/PlayerController';

export class ControlsSettingsScene extends Scene {
    constructor() {
        super({ key: 'ControlsSettingsScene' });
    }

    create() {
        const canvasWidth = this.cameras.main.width;
        const canvasHeight = this.cameras.main.height;

        // Add background
        const bg = this.add.image(0, 0, 'mainbg');
        bg.setOrigin(0, 0);
        bg.setDisplaySize(canvasWidth, canvasHeight);

        // Add semi-transparent overlay
        this.add.rectangle(0, 0, canvasWidth, canvasHeight, 0x000000, 0.7)
            .setOrigin(0, 0);

        // Add title with retro style
        const titleStyle = {
            fontFamily: 'Retronoid, Arial',
            fontSize: '92px',
            color: '#00ffff',
            align: 'center',
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

        this.add.text(canvasWidth / 2, 100, 'CONTROLS', titleStyle)
            .setOrigin(0.5);

        // Button style matching main menu
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

        // Create container for control buttons
        const container = this.add.container(canvasWidth / 2, 250);
        
        // Create temporary PlayerController instance for key bindings
        const controller = new PlayerController(this);
        
        // Helper function to create interactive buttons
        const createButton = (text, y) => {
            const button = this.add.text(0, y, text, buttonStyle)
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

        // Create buttons for each control
        const controls = ['up', 'down', 'left', 'right'];
        const controlButtons = {};
        
        controls.forEach((action, index) => {
            const yPos = index * 100;
            const button = createButton(
                `${action.toUpperCase()}: ${controller.getKeyName(controller.keyBindings[action])}`,
                yPos
            );
            
            button.on('pointerdown', () => {
                // Update all button texts to show current bindings
                controls.forEach(ctrl => {
                    controlButtons[ctrl].setText(
                        `${ctrl.toUpperCase()}: ${controller.getKeyName(controller.keyBindings[ctrl])}`
                    );
                });
                
                // Show 'Press any key' for the selected button
                button.setText(`${action.toUpperCase()}: PRESS ANY KEY`);
                
                const keyHandler = (event) => {
                    event.preventDefault();
                    controller.changeKeyBinding(action, event);
                    button.setText(
                        `${action.toUpperCase()}: ${controller.getKeyName(controller.keyBindings[action])}`
                    );
                    this.input.keyboard.off('keydown', keyHandler);
                };
                
                this.input.keyboard.on('keydown', keyHandler);
            });
            
            container.add(button);
            controlButtons[action] = button;
        });

        // Add reset button
        const resetButton = createButton('RESET TO DEFAULT', controls.length * 100 + 50);
        resetButton.on('pointerdown', () => {
            controller.resetToDefaults();
            controls.forEach(action => {
                controlButtons[action].setText(
                    `${action.toUpperCase()}: ${controller.getKeyName(controller.keyBindings[action])}`
                );
            });
        });
        container.add(resetButton);

        // Add back button
        const backButton = createButton('BACK', controls.length * 100 + 150);
        backButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
        container.add(backButton);
    }
}
