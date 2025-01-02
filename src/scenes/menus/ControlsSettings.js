import { Scene } from 'phaser';
import { PlayerController } from '../../modules/controls/PlayerController';

export default class ControlsSettings extends Scene {
    constructor() {
        super('ControlsSettings');
        this.selectedButton = null;
        this.isWaitingForKey = false;
        this.scrollPosition = 0;
        this.controlsContainer = null;
    }

    preload() {
        this.load.image('settingsBackground', 'assets/settings/settings.png');
        this.load.font('Gameplay', 'assets/fonts/retronoid/Gameplay.ttf');
    }

    create() {
        const { width: canvasWidth, height: canvasHeight } = this.cameras.main;

        // Add background
        const bg = this.add.image(canvasWidth / 2, canvasHeight / 2, 'settingsBackground');
        bg.setDisplaySize(canvasWidth, canvasHeight);

        // Add semi-transparent overlay for better text visibility
        const overlay = this.add.rectangle(0, 0, canvasWidth, canvasHeight, 0x000000, 0.3);
        overlay.setOrigin(0, 0);

        // Add title
        this.add.text(canvasWidth / 2, canvasHeight * 0.15, 'CONTROLS', {
            fontFamily: 'Gameplay',
            fontSize: '64px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Define scrollable area
        const scrollableArea = {
            x: 0,
            y: canvasHeight * 0.25,
            width: canvasWidth,
            height: canvasHeight * 0.5
        };

        // Create container for controls
        this.controlsContainer = this.add.container(0, scrollableArea.y + 50);

        // Create mask for scrollable area
        const mask = this.add.graphics()
            .fillStyle(0x000000, 0)
            .fillRect(0, scrollableArea.y, canvasWidth, scrollableArea.height);
        this.controlsContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, mask));

        // Create temporary PlayerController to access key bindings
        const playerController = new PlayerController(this);
        const currentBindings = playerController.keyBindings;

        // Create key binding buttons
        const controls = [
            { key: 'up', label: 'MOVE UP' },
            { key: 'down', label: 'MOVE DOWN' },
            { key: 'left', label: 'MOVE LEFT' },
            { key: 'right', label: 'MOVE RIGHT' },
            { key: 'jump', label: 'JUMP' },
            { key: 'specialAttack', label: 'SPECIAL ATTACK' }
        ];

        const spacing = canvasHeight * 0.09;
        controls.forEach((control, index) => {
            const y = index * spacing;
            
            // Add label with outline for better visibility
            const label = this.add.text(canvasWidth * 0.3, y, control.label, {
                fontFamily: 'Gameplay',
                fontSize: '36px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
                fontWeight: 'bold'
            }).setOrigin(1, 0.5);

            // Add key button
            const keyName = this.getKeyName(currentBindings[control.key]);
            const button = this.add.text(canvasWidth * 0.7, y, keyName, {
                fontFamily: 'Gameplay',
                fontSize: '36px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
                fontWeight: 'bold'
            }).setOrigin(0, 0.5)
                .setInteractive({ useHandCursor: true });

            // Add hover effects
            button.on('pointerover', () => button.setStyle({ fill: '#00ff00' }));
            button.on('pointerout', () => {
                if (this.selectedButton?.button !== button) {
                    button.setStyle({ fill: '#ffffff' });
                }
            });

            // Handle click
            button.on('pointerdown', () => {
                if (this.isWaitingForKey) return;

                this.isWaitingForKey = true;
                this.selectedButton = { button, control: control.key };
                button.setText('PRESS ANY KEY');
                button.setStyle({ fill: '#ffff00' });

                // Add one-time key listener
                this.input.keyboard.once('keydown', this.handleKeyPress, this);
            });

            this.controlsContainer.add([label, button]);
        });

        // Calculate max scroll based on content height
        const contentHeight = controls.length * spacing;
        const maxScroll = Math.max(0, contentHeight - scrollableArea.height);
        const startY = scrollableArea.y + 50; // Store initial Y position

        // Add mouse wheel scrolling
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (pointer.y >= scrollableArea.y && pointer.y <= scrollableArea.y + scrollableArea.height) {
                const newY = Phaser.Math.Clamp(
                    this.controlsContainer.y - deltaY,
                    startY - maxScroll,  // Use startY as the lower bound
                    startY  // Use startY as the upper bound
                );
                this.controlsContainer.y = newY;
            }
        });

        // Add reset button
        const resetButton = this.add.text(canvasWidth / 2, canvasHeight * 0.8, 'RESET TO DEFAULT', {
            fontFamily: 'Gameplay',
            fontSize: '36px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            fontWeight: 'bold'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        resetButton.on('pointerover', () => resetButton.setStyle({ fill: '#00ff00' }));
        resetButton.on('pointerout', () => resetButton.setStyle({ fill: '#ffffff' }));
        resetButton.on('pointerdown', () => this.resetBindings());

        // Add back button
        const backButton = this.add.text(canvasWidth / 2, canvasHeight * 0.9, 'BACK', {
            fontFamily: 'Gameplay',
            fontSize: '36px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            fontWeight: 'bold'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        backButton.on('pointerover', () => backButton.setStyle({ fill: '#00ff00' }));
        backButton.on('pointerout', () => backButton.setStyle({ fill: '#ffffff' }));
        backButton.on('pointerdown', () => this.scene.start('Settings'));
    }

    handleKeyPress(event) {
        if (!this.selectedButton) return;

        const { button, control } = this.selectedButton;
        const keyCode = event.keyCode;

        // Update the key binding
        const playerController = new PlayerController(this);
        playerController.keyBindings[control] = keyCode;
        playerController.saveKeyBindings();

        // Update the button text
        button.setText(this.getKeyName(keyCode));
        button.setStyle({ fill: '#ffffff' });

        // Reset state
        this.isWaitingForKey = false;
        this.selectedButton = null;
    }

    resetBindings() {
        const playerController = new PlayerController(this);
        playerController.resetToDefaults();
        
        // Refresh the scene to show default bindings
        this.scene.restart();
    }

    getKeyName(keyCode) {
        // Convert key code to readable name
        const keyMap = {
            [Phaser.Input.Keyboard.KeyCodes.W]: 'W',
            [Phaser.Input.Keyboard.KeyCodes.A]: 'A',
            [Phaser.Input.Keyboard.KeyCodes.S]: 'S',
            [Phaser.Input.Keyboard.KeyCodes.D]: 'D',
            [Phaser.Input.Keyboard.KeyCodes.UP]: '↑',
            [Phaser.Input.Keyboard.KeyCodes.DOWN]: '↓',
            [Phaser.Input.Keyboard.KeyCodes.LEFT]: '←',
            [Phaser.Input.Keyboard.KeyCodes.RIGHT]: '→',
            [Phaser.Input.Keyboard.KeyCodes.SPACE]: 'SPACE',
            [Phaser.Input.Keyboard.KeyCodes.Q]: 'Q'
        };
        return keyMap[keyCode] || String.fromCharCode(keyCode);
    }
}
