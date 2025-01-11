import { Scene } from 'phaser';
import ProceduralSoundGenerator from '../../../modules/managers/ProceduralSoundGenerator';

export class SoundTester extends Scene {
    constructor() {
        super({ key: 'SoundTester' });
        this.soundGenerator = null;
        this.selectedSound = 'laser';
        this.soundParams = {
            laser: {
                frequency: 1000,
                duration: 0.1
            },
            explosion: {
                duration: 0.5
            },
            powerup: {
                baseFrequency: 300,
                duration: 0.2
            },
            coin: {
                baseFrequency: 1200,
                duration: 0.07
            }
        };
    }

    create() {
        this.soundGenerator = new ProceduralSoundGenerator();
        this.cameras.main.setBackgroundColor('#2c3e50');

        // Create layout containers
        this.createLeftMenu();
        this.createRightPanel();
        this.createBackButton();
    }

    createLeftMenu() {
        // Left menu background
        const menuWidth = 200; // Reduced width
        this.add.rectangle(0, 0, menuWidth, this.cameras.main.height, 0x1a1a1a)
            .setOrigin(0)
            .setAlpha(0.8);

        // Title
        this.add.text(menuWidth/2, 30, 'Sound Types', {
            fontSize: '20px', // Slightly smaller font
            fill: '#00ff00',
            fontFamily: 'Courier'
        }).setOrigin(0.5);

        // Sound buttons
        const sounds = [
            { key: 'laser', name: 'Laser' },
            { key: 'explosion', name: 'Explosion' },
            { key: 'powerup', name: 'Power Up' },
            { key: 'coin', name: 'Coin Pickup' }
        ];

        sounds.forEach((sound, index) => {
            const buttonY = 80 + (index * 120); // Reduced spacing
            
            const button = this.add.container(10, buttonY); // Adjusted x position
            
            const bg = this.add.rectangle(0, 0, menuWidth - 20, 100, 0x333333) // Adjusted width and height
                .setOrigin(0)
                .setInteractive({ useHandCursor: true });

            const text = this.add.text(menuWidth/2 - 10, 15, sound.name, { // Adjusted y position
                fontSize: '16px', // Slightly smaller font
                fill: '#ffffff',
                fontFamily: 'Courier'
            }).setOrigin(0.5);

            button.add([bg, text]);

            // Add parameter controls
            const params = this.soundParams[sound.key];
            let paramY = 40; // Adjusted starting position
            
            for (const [param, value] of Object.entries(params)) {
                const paramContainer = this.createParameterControl(
                    10, paramY, 
                    menuWidth - 40, // Adjusted width
                    param, 
                    value,
                    sound.key
                );
                button.add(paramContainer);
                paramY += 25; // Reduced spacing between parameters
            }

            bg.on('pointerover', () => bg.setFillStyle(0x444444));
            bg.on('pointerout', () => bg.setFillStyle(0x333333));
            bg.on('pointerdown', () => {
                this.selectedSound = sound.key;
                sounds.forEach((s, i) => {
                    const otherBg = this.children.list.find(
                        child => child instanceof Phaser.GameObjects.Rectangle &&
                        child.y === 80 + (i * 120) // Match new spacing
                    );
                    if (otherBg) {
                        otherBg.setFillStyle(i === index ? 0x00ff00 : 0x333333);
                    }
                });
            });
        });
    }

    createParameterControl(x, y, width, param, value, soundKey) {
        const container = this.add.container(x, y);
        
        // Parameter label
        const label = this.add.text(0, 0, param, {
            fontSize: '12px', // Smaller font
            fill: '#aaaaaa',
            fontFamily: 'Courier'
        });

        // Parameter value display
        const valueText = this.add.text(width - 40, 0, value.toString(), { // Adjusted position
            fontSize: '12px', // Smaller font
            fill: '#ffffff',
            fontFamily: 'Courier'
        });

        // Slider background
        const sliderBg = this.add.rectangle(0, 12, width, 3, 0x666666).setOrigin(0); // Adjusted y position and height
        
        // Slider handle
        const handle = this.add.rectangle(0, 12, 8, 12, 0x00ff00).setOrigin(0.5, 0.5) // Adjusted size
            .setInteractive({ draggable: true });

        // Set initial handle position
        const normalizedValue = this.normalizeValue(param, value);
        handle.x = normalizedValue * (width - 8) + 4; // Adjusted for new handle width

        // Handle drag
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

    normalizeValue(param, value) {
        if (param.includes('frequency')) {
            return (value - 200) / 2000; // Range: 200-2200 Hz
        } else if (param.includes('duration')) {
            return (value - 0.05) / 0.95; // Range: 0.05-1.0 seconds
        }
        return value;
    }

    denormalizeValue(param, normalized) {
        if (param.includes('frequency')) {
            return Math.round(normalized * 2000 + 200); // Range: 200-2200 Hz
        } else if (param.includes('duration')) {
            return Number((normalized * 0.95 + 0.05).toFixed(2)); // Range: 0.05-1.0 seconds
        }
        return normalized;
    }

    createRightPanel() {
        // Create a large interactive area
        const panel = this.add.rectangle(220, 20, 
            this.cameras.main.width - 240, // Adjusted for new menu width
            this.cameras.main.height - 40, 
            0x2c3e50)
            .setOrigin(0)
            .setInteractive({ useHandCursor: true });

        // Add instructions
        this.add.text(230, 30, 'Click anywhere to test sound position', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Courier'
        });

        // Add visual indicator for stereo position
        const indicator = this.add.circle(0, 0, 5, 0x00ff00)
            .setVisible(false);

        panel.on('pointermove', (pointer) => {
            indicator.setVisible(true);
            indicator.setPosition(pointer.x, pointer.y);
        });

        panel.on('pointerdown', (pointer) => {
            // Calculate stereo position (-1 to 1) based on x position
            const relativeX = (pointer.x - panel.x) / panel.width;
            const stereoPan = (relativeX * 2) - 1;

            // Play the selected sound with stereo positioning
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

            // Visual feedback
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
