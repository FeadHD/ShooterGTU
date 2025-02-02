/**
 * ControlsSettings.js
 * Manages key bindings and control configuration for the game
 * Provides UI for viewing, modifying, and resetting control schemes
 */
import { Scene } from 'phaser';
import { PlayerController } from '../../controls/PlayerController';

export default class ControlsSettings extends Scene {
    /**
     * Initialize controls settings scene
     * Sets up state management for key binding process
     */
    constructor() {
        super('ControlsSettings');
        // Scene state
        this.selectedButton = null;        // Currently selected control button
        this.isWaitingForKey = false;      // Whether waiting for key input
        this.scrollPosition = 0;           // Current scroll position
        this.targetScrollPosition = 0;      // Target position for smooth scrolling
        this.controlsContainer = null;      // Container for scrollable controls
        this.fromPause = false;            // Whether accessed from pause menu
        this.parentScene = null;           // Reference to previous scene
        
        // Bind event handlers to maintain context
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleMousePress = this.handleMousePress.bind(this);
        this.preventDefault = this.preventDefault.bind(this);
    }

    /**
     * Setup scene based on entry point
     * Handles pause state when accessed from game
     */
    init(data) {
        this.fromPause = data?.fromPause || false;
        this.parentScene = data?.parentScene;
        
        // Maintain pause state if coming from game
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

    /**
     * Load required assets
     * Includes background, fonts and sound effects
     */
    preload() {
        this.load.image('settingsBackground', 'assets/settings/settings.png');
        this.load.font('Gameplay', 'assets/fonts/retronoid/Gameplay.ttf');
        this.load.audio('confirmSound', 'assets/sounds/confirmation.mp3');
    }

    /**
     * Build the controls settings interface
     * Creates scrollable list of configurable controls
     */
    create() {
        const { width: canvasWidth, height: canvasHeight } = this.cameras.main;

        // Setup background and overlay
        const bg = this.add.image(canvasWidth / 2, canvasHeight / 2, 'settingsBackground');
        bg.setDisplaySize(canvasWidth, canvasHeight);

        const overlay = this.add.rectangle(0, 0, canvasWidth, canvasHeight, 0x000000, 0.3);
        overlay.setOrigin(0, 0);

        // Add title text
        this.add.text(canvasWidth / 2, canvasHeight * 0.15, 'CONTROLS', {
            fontFamily: 'Gameplay',
            fontSize: '64px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Define scrollable area dimensions
        const scrollableArea = {
            x: 0,
            y: canvasHeight * 0.25,
            width: canvasWidth,
            height: canvasHeight * 0.5
        };

        // Setup scrollable container
        this.controlsContainer = this.add.container(0, scrollableArea.y + 50);

        // Create mask for scroll area
        const mask = this.add.graphics()
            .fillStyle(0x000000, 0)
            .fillRect(0, scrollableArea.y, canvasWidth, scrollableArea.height);
        this.controlsContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, mask));

        // Get current key bindings
        const playerController = new PlayerController(this);
        const currentBindings = playerController.keyBindings;

        // Define control buttons configuration
        const controlsConfig = [
            { action: 'up', label: 'UP' },
            { action: 'down', label: 'DOWN' },
            { action: 'left', label: 'LEFT' },
            { action: 'right', label: 'RIGHT' },
            { action: 'shoot', label: 'SHOOT' },
            { action: 'jump', label: 'JUMP' },
            { action: 'specialAttack', label: 'SPECIAL ATTACK' }
        ];

        // Create control buttons
        const spacing = canvasHeight * 0.09;
        controlsConfig.forEach((control, index) => {
            const y = index * spacing;
            
            // Create label
            const label = this.add.text(canvasWidth * 0.3, y, control.label, {
                fontFamily: 'Gameplay',
                fontSize: '36px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
                fontWeight: 'bold'
            }).setOrigin(1, 0.5);

            // Create key binding button
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
                .setData('action', control.action);

            // Setup button interactions
            button.on('pointerover', () => button.setStyle({ fill: '#00ff00' }));
            button.on('pointerout', () => {
                if (this.selectedButton?.button !== button) {
                    button.setStyle({ fill: '#ffffff' });
                }
            });

            // Handle key binding
            button.on('pointerdown', (pointer, localX, localY, event) => {
                event.stopPropagation();
                
                if (this.isWaitingForKey) {
                    if (this.selectedButton === button) {
                        this.handleMousePress(pointer);
                    }
                    return;
                }

                // Enter key binding mode
                this.isWaitingForKey = true;
                this.selectedButton = button;
                button.setText('PRESS ANY KEY');
                button.setStyle({ fill: '#ffff00' });

                // Disable context menu during binding
                const canvas = this.sys.game.canvas;
                canvas.addEventListener('contextmenu', this.preventDefault);

                // Setup input listeners
                this.time.delayedCall(100, () => {
                    this.input.keyboard.once('keydown', this.handleKeyPress, this);
                    this.input.on('pointerdown', this.handleMousePress, this);
                });
            });

            this.controlsContainer.add([label, button]);
        });

        // Setup scrolling
        const contentHeight = controlsConfig.length * spacing;
        const maxScroll = Math.max(0, contentHeight - scrollableArea.height);
        const startY = scrollableArea.y + 50;
        this.scrollPosition = startY;
        this.targetScrollPosition = startY;

        // Mouse wheel scrolling
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (pointer.y >= scrollableArea.y && pointer.y <= scrollableArea.y + scrollableArea.height) {
                const scrollSpeed = 0.5;
                this.targetScrollPosition = Phaser.Math.Clamp(
                    this.targetScrollPosition - (deltaY * scrollSpeed),
                    startY - maxScroll,
                    startY
                );
            }
        });

        // Smooth scrolling update
        this.events.on('update', () => {
            if (this.scrollPosition !== this.targetScrollPosition) {
                const lerp = 0.2;
                this.scrollPosition = Phaser.Math.Linear(
                    this.scrollPosition,
                    this.targetScrollPosition,
                    lerp
                );
                this.controlsContainer.y = Math.round(this.scrollPosition);
            }
        });

        // Sound effect helper
        const playConfirmSound = () => {
            const sfxVolume = this.registry.get('sfxVolume') || 1;
            const confirmSound = this.sound.add('confirmSound');
            confirmSound.setVolume(sfxVolume);
            confirmSound.play();
            confirmSound.once('complete', () => {
                confirmSound.destroy();
            });
        };

        // Create reset button
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

        // Create back button
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

        // Cleanup on scene change
        this.events.on('shutdown', () => {
            const canvas = this.sys.game.canvas;
            canvas.removeEventListener('contextmenu', this.preventDefault);
        });
    }

    /**
     * Prevent default browser actions during key binding
     */
    preventDefault(e) {
        e.preventDefault();
    }

    /**
     * Handle mouse button binding
     * Maps mouse buttons to corresponding actions
     */
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

    /**
     * Handle keyboard key binding
     * Maps keyboard events to actions
     */
    handleKeyPress(event) {
        if (!this.isWaitingForKey || !this.selectedButton) return;
        this.updateBinding(event.keyCode);
    }

    /**
     * Update control binding and related UI
     * Propagates changes to active game scene
     */
    updateBinding(newBinding) {
        const action = this.selectedButton.getData('action');
        const playerController = new PlayerController(this);
        
        // Save new binding
        playerController.keyBindings[action] = newBinding;
        playerController.saveKeyBindings();

        // Update UI
        this.selectedButton.setText(playerController.getKeyName(newBinding));
        this.selectedButton.setStyle({ fill: '#ffffff' });

        // Reset binding state
        this.isWaitingForKey = false;
        this.selectedButton = null;

        // Cleanup listeners
        this.input.keyboard.off('keydown', this.handleKeyPress, this);
        this.input.off('pointerdown', this.handleMousePress, this);
        const canvas = this.sys.game.canvas;
        canvas.removeEventListener('contextmenu', this.preventDefault);

        // Update active game scene
        if (this.parentScene) {
            const gameScene = this.scene.get(this.parentScene);
            if (gameScene && gameScene.player && gameScene.player.controller) {
                // Update controller
                gameScene.player.controller.destroy();
                gameScene.player.controller = new PlayerController(gameScene);
                
                // Refresh shooting controls if needed
                if (action === 'shoot') {
                    gameScene.player.controller.setupShootingControls(gameScene.player);
                }

                // Update tutorial if active
                if (gameScene.tutorialManager) {
                    gameScene.tutorialManager.updateTutorialSteps();
                    gameScene.tutorialManager.showCurrentStep();
                }
            }
        }
    }

    /**
     * Reset all controls to default values
     * Updates both settings and active game
     */
    resetBindings() {
        const playerController = new PlayerController(this);
        playerController.resetToDefaults();
        
        // Update active game scene
        if (this.parentScene) {
            const gameScene = this.scene.get(this.parentScene);
            if (gameScene && gameScene.player && gameScene.player.controller) {
                // Reset controller
                gameScene.player.controller.destroy();
                gameScene.player.controller = new PlayerController(gameScene);
                gameScene.player.controller.setupShootingControls(gameScene.player);

                // Update tutorial if active
                if (gameScene.tutorialManager) {
                    gameScene.tutorialManager.updateTutorialSteps();
                    gameScene.tutorialManager.showCurrentStep();
                }
            }
        }
        
        // Refresh UI
        this.scene.restart();
    }

    /**
     * Convert key codes to readable names
     * Maps common keys to symbols or text
     */
    getKeyName(keyCode) {
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
