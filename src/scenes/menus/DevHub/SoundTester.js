/**
 * SoundTester.js
 * Interactive testing tool for procedural sound effects
 * Allows real-time adjustment of sound parameters and stereo positioning
 */
import { Scene } from 'phaser';
import ProceduralSoundGenerator from '../../../scripts/ProceduralSoundGenerator';

export class SoundTester extends Scene {
    /**
     * Initialize sound tester with default parameters
     * Sets up initial sound configurations for each effect type
     */
    constructor() {
        super({ key: 'SoundTester' });
        this.soundGenerator = null;
        this.selectedSound = 'laser';
        
        // Default parameters for each sound type
        this.soundParams = {
            laser: {
                frequency: 1000,  // Base frequency in Hz
                duration: 0.1     // Sound duration in seconds
            },
            explosion: {
                duration: 0.5     // Explosion length in seconds
            },
            powerup: {
                baseFrequency: 300,  // Starting frequency
                duration: 0.2        // Effect duration
            },
            coin: {
                baseFrequency: 1200, // High-pitched coin sound
                duration: 0.07       // Quick effect
            }
        };
    }

    /**
     * Set up the sound tester interface
     * Creates main layout and initializes sound generator
     */
    create() {
        this.soundGenerator = new ProceduralSoundGenerator();
        this.cameras.main.setBackgroundColor('#2c3e50');

        // Create main UI sections
        this.createLeftMenu();      // Sound selection and parameters
        this.createRightPanel();    // Sound testing area
        this.createBackButton();    // Navigation
    }

    /**
     * Creates the left menu panel with sound controls
     * Includes sound type selection and parameter sliders
     */
    createLeftMenu() {
        // Menu background
        const menuWidth = 200;
        this.add.rectangle(0, 0, menuWidth, this.cameras.main.height, 0x1a1a1a)
            .setOrigin(0)
            .setAlpha(0.8);

        // Menu title
        this.add.text(menuWidth/2, 30, 'Sound Types', {
            fontSize: '20px',
            fill: '#00ff00',
            fontFamily: 'Courier'
        }).setOrigin(0.5);

        // Sound type buttons with parameters
        const sounds = [
            { key: 'laser', name: 'Laser' },
            { key: 'explosion', name: 'Explosion' },
            { key: 'powerup', name: 'Power Up' },
            { key: 'coin', name: 'Coin Pickup' }
        ];

        // Create button for each sound type
        sounds.forEach((sound, index) => {
            const buttonY = 80 + (index * 120);
            const button = this.add.container(10, buttonY);
            
            // Button background
            const bg = this.add.rectangle(0, 0, menuWidth - 20, 100, 0x333333)
                .setOrigin(0)
                .setInteractive({ useHandCursor: true });

            // Button label
            const text = this.add.text(menuWidth/2 - 10, 15, sound.name, {
                fontSize: '16px',
                fill: '#ffffff',
                fontFamily: 'Courier'
            }).setOrigin(0.5);

            button.add([bg, text]);

            // Add parameter sliders
            const params = this.soundParams[sound.key];
            let paramY = 40;
            
            for (const [param, value] of Object.entries(params)) {
                const paramContainer = this.createParameterControl(
                    10, paramY, 
                    menuWidth - 40,
                    param, 
                    value,
                    sound.key
                );
                button.add(paramContainer);
                paramY += 25;
            }

            // Button interactions
            bg.on('pointerover', () => bg.setFillStyle(0x444444));
            bg.on('pointerout', () => bg.setFillStyle(0x333333));
            bg.on('pointerdown', () => {
                this.selectedSound = sound.key;
                sounds.forEach((s, i) => {
                    const otherBg = this.children.list.find(
                        child => child instanceof Phaser.GameObjects.Rectangle &&
                        child.y === 80 + (i * 120)
                    );
                    if (otherBg) {
                        otherBg.setFillStyle(i === index ? 0x00ff00 : 0x333333);
                    }
                });
            });
        });
    }

    /**
     * Creates a slider control for a sound parameter
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Slider width
     * @param {string} param - Parameter name
     * @param {number} value - Initial value
     * @param {string} soundKey - Associated sound type
     */
    createParameterControl(x, y, width, param, value, soundKey) {
        const container = this.add.container(x, y);
        
        // Parameter name
        const label = this.add.text(0, 0, param, {
            fontSize: '12px',
            fill: '#aaaaaa',
            fontFamily: 'Courier'
        });

        // Current value display
        const valueText = this.add.text(width - 40, 0, value.toString(), {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Courier'
        });

        // Slider track
        const sliderBg = this.add.rectangle(0, 12, width, 3, 0x666666)
            .setOrigin(0);
        
        // Draggable handle
        const handle = this.add.rectangle(0, 12, 8, 12, 0x00ff00)
            .setOrigin(0.5, 0.5)
            .setInteractive({ draggable: true });

        // Set handle to initial value
        const normalizedValue = this.normalizeValue(param, value);
        handle.x = normalizedValue * (width - 8) + 4;

        // Handle drag events
        handle.on('drag', (pointer, dragX) => {
            const boundedX = Phaser.Math.Clamp(dragX, 4, width - 4);
            handle.x = boundedX;

            const newNormalizedValue = (boundedX - 4) / (width - 8);
            const newValue = this.denormalizeValue(param, newNormalizedValue);
            
            this.soundParams[soundKey][param] = newValue;
            valueText.setText(newValue.toFixed(param.includes('duration') ? 2 : 0));
        });

        container.add([label, valueText, sliderBg, handle]);
        return container;
    }

    /**
     * Converts parameter values to 0-1 range for slider
     * @param {string} param - Parameter name
     * @param {number} value - Raw value
     * @returns {number} Normalized value (0-1)
     */
    normalizeValue(param, value) {
        if (param.includes('frequency')) {
            return (value - 200) / 2000;     // 200-2200 Hz range
        } else if (param.includes('duration')) {
            return (value - 0.05) / 0.95;    // 0.05-1.0 seconds range
        }
        return value;
    }

    /**
     * Converts slider position (0-1) to parameter value
     * @param {string} param - Parameter name
     * @param {number} normalized - Slider position (0-1)
     * @returns {number} Actual parameter value
     */
    denormalizeValue(param, normalized) {
        if (param.includes('frequency')) {
            return Math.round(normalized * 2000 + 200);    // 200-2200 Hz range
        } else if (param.includes('duration')) {
            return Number((normalized * 0.95 + 0.05).toFixed(2));  // 0.05-1.0 seconds range
        }
        return normalized;
    }

    /**
     * Creates the sound testing area
     * Click to play sounds with stereo positioning
     */
    createRightPanel() {
        // Interactive testing area
        const panel = this.add.rectangle(220, 20, 
            this.cameras.main.width - 240,
            this.cameras.main.height - 40, 
            0x2c3e50)
            .setOrigin(0)
            .setInteractive({ useHandCursor: true });

        // Instructions
        this.add.text(230, 30, 'Click anywhere to test sound position', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Courier'
        });

        // Position indicator
        const indicator = this.add.circle(0, 0, 5, 0x00ff00)
            .setVisible(false);

        // Track mouse position
        panel.on('pointermove', (pointer) => {
            indicator.setVisible(true);
            indicator.setPosition(pointer.x, pointer.y);
        });

        // Play sound on click
        panel.on('pointerdown', (pointer) => {
            // Calculate stereo pan based on click position
            const relativeX = (pointer.x - panel.x) / panel.width;
            const stereoPan = (relativeX * 2) - 1;  // -1 (left) to 1 (right)

            // Generate selected sound effect
            switch (this.selectedSound) {
                case 'laser':
                    this.soundGenerator.generateLaserSound({ 
                        stereoPan,
                        ...this.soundParams.laser
                    });
                    break;
                case 'explosion':
                    this.soundGenerator.generateExplosionSound({ 
                        stereoPan,
                        ...this.soundParams.explosion
                    });
                    break;
                case 'powerup':
                    this.soundGenerator.generatePowerupSound({ 
                        stereoPan,
                        ...this.soundParams.powerup
                    });
                    break;
                case 'coin':
                    this.soundGenerator.generateCoinSound({ 
                        stereoPan,
                        ...this.soundParams.coin
                    });
                    break;
            }

            // Visual feedback animation
            const flash = this.add.circle(pointer.x, pointer.y, 10, 0x00ff00, 0.8);
            this.tweens.add({
                targets: flash,
                scale: 2,
                alpha: 0,
                duration: 200,
                onComplete: () => flash.destroy()
            });
        });
    }

    /**
     * Creates back button for navigation
     * Returns to DevHub scene
     */
    createBackButton() {
        const backButton = this.add.text(
            this.cameras.main.width - 100,
            this.cameras.main.height - 40,
            'Back',
            { fontSize: '20px', fill: '#00ff00', fontFamily: 'Courier' }
        )
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => backButton.setStyle({ fill: '#0ff' }))
        .on('pointerout', () => backButton.setStyle({ fill: '#00ff00' }))
        .on('pointerdown', () => this.scene.start('DevHub'));
    }
}
