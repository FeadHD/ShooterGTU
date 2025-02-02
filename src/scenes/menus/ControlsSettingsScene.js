/**
 * ControlsSettingsScene.js
 * Manages the controls configuration screen where players can
 * customize their key bindings for game actions.
 */

import { Scene } from 'phaser';
import { PlayerController } from '../../controls/PlayerController';

export class ControlsSettingsScene extends Scene {
    constructor() {
        super({ key: 'ControlsSettingsScene' });
    }

    /**
     * SCENE CREATION
     * Builds the controls configuration interface
     */
    create() {
        const canvasWidth = this.cameras.main.width;
        const canvasHeight = this.cameras.main.height;

        /**
         * BACKGROUND SETUP
         * Creates layered background with overlay
         */
        // Set background image
        const bg = this.add.image(0, 0, 'mainbg');
        bg.setOrigin(0, 0);
        bg.setDisplaySize(canvasWidth, canvasHeight);

        // Add darkening overlay
        this.add.rectangle(0, 0, canvasWidth, canvasHeight, 0x000000, 0.7)
            .setOrigin(0, 0);

        /**
         * TEXT STYLES
         * Define consistent text appearance
         */
        // Title text style
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

        // Add scene title
        this.add.text(canvasWidth / 2, 100, 'CONTROLS', titleStyle)
            .setOrigin(0.5);

        // Button text style
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

        /**
         * CONTROLS CONTAINER
         * Groups all control buttons for organization
         */
        const container = this.add.container(canvasWidth / 2, 250);
        
        // Initialize controller for key management
        const controller = new PlayerController(this);
        
        /**
         * BUTTON FACTORY
         * Creates consistent interactive buttons
         */
        const createButton = (text, y) => {
            const button = this.add.text(0, y, text, buttonStyle)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            // Add hover effects
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

        /**
         * CONTROL BUTTONS
         * Create interactive buttons for each control action
         */
        const controls = ['up', 'down', 'left', 'right'];
        const controlButtons = {};
        
        controls.forEach((action, index) => {
            const yPos = index * 100;
            const button = createButton(
                `${action.toUpperCase()}: ${controller.getKeyName(controller.keyBindings[action])}`,
                yPos
            );
            
            // Handle key rebinding
            button.on('pointerdown', () => {
                // Refresh all button labels
                controls.forEach(ctrl => {
                    controlButtons[ctrl].setText(
                        `${ctrl.toUpperCase()}: ${controller.getKeyName(controller.keyBindings[ctrl])}`
                    );
                });
                
                // Show binding prompt
                button.setText(`${action.toUpperCase()}: PRESS ANY KEY`);
                
                // Listen for new key
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

        /**
         * UTILITY BUTTONS
         * Add reset and back navigation options
         */
        // Reset controls to defaults
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

        // Return to main menu
        const backButton = createButton('BACK', controls.length * 100 + 150);
        backButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
        container.add(backButton);
    }
}
