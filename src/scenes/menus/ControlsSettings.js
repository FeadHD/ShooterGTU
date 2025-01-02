import { Scene } from 'phaser';
import { PlayerController } from '../../modules/controls/PlayerController';

export default class ControlsSettings extends Scene {
    constructor() {
        super('ControlsSettings');
        this.selectedButton = null;
        this.isWaitingForKey = false;
        this.scrollPosition = 0;
        this.targetScrollPosition = 0;
        this.controlsContainer = null;
        this.fromPause = false;
        this.parentScene = null;
        
        // Bind the methods to maintain correct 'this' context
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleMousePress = this.handleMousePress.bind(this);
        this.preventDefault = this.preventDefault.bind(this);
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

    preload() {
        this.load.image('settingsBackground', 'assets/settings/settings.png');
        this.load.font('Gameplay', 'assets/fonts/retronoid/Gameplay.ttf');
        this.load.audio('confirmSound', 'assets/sounds/confirmation.mp3');
    }

    create() {
        const { width: canvasWidth, height: canvasHeight } = this.cameras.main;

        // Store the fromPause and parentScene values passed from Settings
        // this.fromPause = this.scene.settings.data?.fromPause;
        // this.parentScene = this.scene.settings.data?.parentScene;

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

        // Create controls buttons
        const controlsConfig = [
            { action: 'up', label: 'UP' },
            { action: 'down', label: 'DOWN' },
            { action: 'left', label: 'LEFT' },
            { action: 'right', label: 'RIGHT' },
            { action: 'shoot', label: 'SHOOT' },
            { action: 'jump', label: 'JUMP' },
            { action: 'specialAttack', label: 'SPECIAL ATTACK' }
        ];

        const spacing = canvasHeight * 0.09;
        controlsConfig.forEach((control, index) => {
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
            const keyName = playerController.getKeyName(currentBindings[control.action]);
            const button = this.add.text(canvasWidth * 0.7, y, keyName, {
                fontFamily: 'Gameplay',
                fontSize: '36px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
                fontWeight: 'bold'
            }).setOrigin(0, 0.5)
                .setInteractive({ useHandCursor: true })
                .setData('action', control.action);  // Store the action with the button

            // Add hover effects
            button.on('pointerover', () => button.setStyle({ fill: '#00ff00' }));
            button.on('pointerout', () => {
                if (this.selectedButton?.button !== button) {
                    button.setStyle({ fill: '#ffffff' });
                }
            });

            // Handle click
            button.on('pointerdown', (pointer, localX, localY, event) => {
                event.stopPropagation();
                
                if (this.isWaitingForKey) {
                    // If we're already waiting for a key, handle this click as a binding
                    if (this.selectedButton === button) {
                        this.handleMousePress(pointer);
                    }
                    return;
                }

                this.isWaitingForKey = true;
                this.selectedButton = button;
                button.setText('PRESS ANY KEY');
                button.setStyle({ fill: '#ffff00' });

                // Disable right-click menu
                const canvas = this.sys.game.canvas;
                canvas.addEventListener('contextmenu', this.preventDefault);

                // Add listeners after a short delay to avoid the current click
                this.time.delayedCall(100, () => {
                    this.input.keyboard.once('keydown', this.handleKeyPress, this);
                    this.input.on('pointerdown', this.handleMousePress, this);
                });
            });

            this.controlsContainer.add([label, button]);
        });

        // Calculate max scroll based on content height
        const contentHeight = controlsConfig.length * spacing;
        const maxScroll = Math.max(0, contentHeight - scrollableArea.height);
        const startY = scrollableArea.y + 50; // Store initial Y position
        this.scrollPosition = startY;
        this.targetScrollPosition = startY;

        // Add mouse wheel scrolling
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (pointer.y >= scrollableArea.y && pointer.y <= scrollableArea.y + scrollableArea.height) {
                // Adjust scroll speed and direction
                const scrollSpeed = 0.5; // Reduce this value to slow down scrolling
                this.targetScrollPosition = Phaser.Math.Clamp(
                    this.targetScrollPosition - (deltaY * scrollSpeed),
                    startY - maxScroll, // Use startY as the lower bound
                    startY // Use startY as the upper bound
                );
            }
        });

        // Add smooth scrolling update
        this.events.on('update', () => {
            if (this.scrollPosition !== this.targetScrollPosition) {
                // Interpolate towards target position
                const lerp = 0.2; // Adjust this value to change smoothing (0-1)
                this.scrollPosition = Phaser.Math.Linear(
                    this.scrollPosition,
                    this.targetScrollPosition,
                    lerp
                );
                
                // Update container position
                this.controlsContainer.y = Math.round(this.scrollPosition);
            }
        });

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
        resetButton.on('pointerdown', () => {
            playConfirmSound();
            this.resetBindings();
        });

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
        backButton.on('pointerdown', () => {
            playConfirmSound();
            this.scene.start('Settings', { fromPause: this.fromPause, parentScene: this.parentScene });
        });

        // Clean up when scene changes
        this.events.on('shutdown', () => {
            const canvas = this.sys.game.canvas;
            canvas.removeEventListener('contextmenu', this.preventDefault);
        });
    }

    preventDefault(e) {
        e.preventDefault();
    }

    handleMousePress(pointer) {
        if (!this.isWaitingForKey || !this.selectedButton) return;

        let newBinding;
        switch (pointer.button) {
            case 0: newBinding = 'MOUSE_LEFT'; break;
            case 1: newBinding = 'MOUSE_MIDDLE'; break;
            case 2: newBinding = 'MOUSE_RIGHT'; break;
            default: return;
        }

        this.updateBinding(newBinding);
    }

    handleKeyPress(event) {
        if (!this.isWaitingForKey || !this.selectedButton) return;
        this.updateBinding(event.keyCode);
    }

    updateBinding(newBinding) {
        const action = this.selectedButton.getData('action');
        const playerController = new PlayerController(this);
        
        // Update the key binding
        playerController.keyBindings[action] = newBinding;
        playerController.saveKeyBindings();

        // Update the button text
        this.selectedButton.setText(playerController.getKeyName(newBinding));
        this.selectedButton.setStyle({ fill: '#ffffff' });

        // Reset state
        this.isWaitingForKey = false;
        this.selectedButton = null;

        // Remove event listeners
        this.input.keyboard.off('keydown', this.handleKeyPress, this);
        this.input.off('pointerdown', this.handleMousePress, this);

        // Re-enable right-click menu
        const canvas = this.sys.game.canvas;
        canvas.removeEventListener('contextmenu', this.preventDefault);

        // Update controls in the active game scene if it exists
        if (this.parentScene) {
            const gameScene = this.scene.get(this.parentScene);
            if (gameScene && gameScene.player && gameScene.player.controller) {
                // Destroy old controls
                gameScene.player.controller.destroy();
                
                // Create new controller with updated bindings
                gameScene.player.controller = new PlayerController(gameScene);
                
                // Re-setup shooting controls if needed
                if (action === 'shoot') {
                    gameScene.player.controller.setupShootingControls(gameScene.player);
                }
            }
        }
    }

    resetBindings() {
        const playerController = new PlayerController(this);
        playerController.resetToDefaults();
        
        // Update controls in the active game scene if it exists
        if (this.parentScene) {
            const gameScene = this.scene.get(this.parentScene);
            if (gameScene && gameScene.player && gameScene.player.controller) {
                // Destroy old controls
                gameScene.player.controller.destroy();
                
                // Create new controller with default bindings
                gameScene.player.controller = new PlayerController(gameScene);
                
                // Re-setup shooting controls
                gameScene.player.controller.setupShootingControls(gameScene.player);
            }
        }
        
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
