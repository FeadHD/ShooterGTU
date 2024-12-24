import { Scene } from 'phaser';
import { PlayerController } from '../../modules/controls/PlayerController';

export class ControlsSettingsScene extends Scene {
    constructor() {
        super({ key: 'ControlsSettingsScene' });
    }

    create() {
        // Add background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7)
            .setOrigin(0, 0);

        // Add title
        this.add.text(this.cameras.main.centerX, 100, 'Controls Settings', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Create container for key binding buttons
        const container = this.add.container(this.cameras.main.centerX, 200);
        
        // Create temporary PlayerController instance for key bindings
        const tempController = new PlayerController(this);
        
        // Create buttons for each control
        const controls = ['up', 'down', 'left', 'right'];
        controls.forEach((action, index) => {
            const button = this.add.text(0, index * 60, `${action.toUpperCase()}: ${tempController.getKeyName(tempController.keyBindings[action])}`, {
                fontSize: '24px',
                fill: '#fff',
                backgroundColor: '#333',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5);

            button.setInteractive();
            button.on('pointerdown', () => this.startKeyBinding(button, action, tempController));
            container.add(button);
        });

        // Add reset button
        const resetButton = this.add.text(0, controls.length * 60 + 40, 'Reset to Defaults', {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#660000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        resetButton.setInteractive();
        resetButton.on('pointerdown', () => {
            tempController.resetToDefaults();
            this.scene.restart();
        });
        container.add(resetButton);

        // Add back button
        const backButton = this.add.text(0, controls.length * 60 + 100, 'Back to Menu', {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        backButton.setInteractive();
        backButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
        container.add(backButton);
    }

    startKeyBinding(button, action, controller) {
        button.setText('Press any key...');
        
        const keyHandler = (event) => {
            event.preventDefault();
            controller.changeKeyBinding(action, event);
            button.setText(`${action.toUpperCase()}: ${controller.getKeyName(event.keyCode)}`);
            this.input.keyboard.off('keydown', keyHandler);
        };

        this.input.keyboard.on('keydown', keyHandler);
    }
}
