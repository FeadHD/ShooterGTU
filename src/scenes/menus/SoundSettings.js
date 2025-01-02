import 'phaser';

export default class SoundSettings extends Phaser.Scene {
    constructor() {
        super('SoundSettings');
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

        // Add title
        this.add.text(canvasWidth / 2, canvasHeight * 0.2, 'SOUND SETTINGS', {
            fontFamily: 'Gameplay',
            fontSize: '64px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Music Section
        this.add.text(canvasWidth * 0.3, canvasHeight * 0.4, 'MUSIC', {
            fontFamily: 'Gameplay',
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            fontWeight: 'bold'
        }).setOrigin(0, 0.5);

        // Create music volume controls
        const bgMusic = this.sound.get('bgMusic');
        const musicVolume = bgMusic ? bgMusic.volume : (this.registry.get('musicVolume') || 1);
        this.createVolumeSlider(canvasWidth * 0.6, canvasHeight * 0.4, musicVolume, (value) => {
            // Store the volume in the registry for persistence across scenes
            this.registry.set('musicVolume', value);
            
            // Update volume for all active sounds
            this.sound.getAllPlaying().forEach(sound => {
                // Only adjust music tracks, not sound effects
                if (sound.key.toLowerCase().includes('music')) {
                    sound.setVolume(value);
                }
            });
        });

        // Sound Effects Section
        this.add.text(canvasWidth * 0.3, canvasHeight * 0.55, 'SOUND EFFECTS', {
            fontFamily: 'Gameplay',
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            fontWeight: 'bold'
        }).setOrigin(0, 0.5);

        // Create sound effects volume controls
        const sfxVolume = this.registry.get('sfxVolume') || 1;
        this.createVolumeSlider(canvasWidth * 0.6, canvasHeight * 0.55, sfxVolume, (value) => {
            this.registry.set('sfxVolume', value);
        });

        // Add Back button
        const backButton = this.add.text(canvasWidth / 2, canvasHeight * 0.8, 'Back', {
            fontFamily: 'Gameplay',
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            fontWeight: 'bold'
        }).setOrigin(0.5);

        backButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => backButton.setStyle({ fill: '#00ff00' }))
            .on('pointerout', () => backButton.setStyle({ fill: '#ffffff' }))
            .on('pointerdown', () => {
                this.scene.start('Settings');
            });
    }

    createVolumeSlider(x, y, initialValue, onChange) {
        const width = 300;
        const height = 10;
        const padding = 10;

        // Create slider background
        const sliderBg = this.add.rectangle(x, y, width, height, 0x000000);
        sliderBg.setOrigin(0, 0.5);
        sliderBg.setStrokeStyle(2, 0xffffff);

        // Create slider fill
        const sliderFill = this.add.rectangle(x, y, width * initialValue, height, 0x00ff00);
        sliderFill.setOrigin(0, 0.5);

        // Create slider handle
        const handle = this.add.circle(x + (width * initialValue), y, height * 1.5, 0xffffff);
        handle.setStrokeStyle(2, 0x000000);

        // Create interactive area (slightly larger than visible slider)
        const hitArea = this.add.rectangle(x, y, width, height * 4, 0xffffff, 0);
        hitArea.setOrigin(0, 0.5);
        hitArea.setInteractive({ useHandCursor: true });

        // Add percentage text
        const percentText = this.add.text(x + width + padding * 2, y, Math.round(initialValue * 100), {
            fontFamily: 'Gameplay',
            fontSize: '32px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0, 0.5);

        // Handle drag events
        let isDragging = false;
        
        hitArea.on('pointerdown', (pointer) => {
            isDragging = true;
            updateSlider(pointer);
        });

        this.input.on('pointermove', (pointer) => {
            if (isDragging) {
                updateSlider(pointer);
            }
        });

        this.input.on('pointerup', () => {
            isDragging = false;
        });

        const updateSlider = (pointer) => {
            const localX = pointer.x - x;
            let value = Phaser.Math.Clamp(localX / width, 0, 1);
            
            // Update visuals
            sliderFill.width = width * value;
            handle.x = x + (width * value);
            percentText.setText(Math.round(value * 100));
            
            // Call callback
            onChange(value);
        };
    }
}
