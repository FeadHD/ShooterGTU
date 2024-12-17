import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        // Create loading bar
        const loadingText = this.add.text(this.scale.width/2, this.scale.height/2, 'Loading...', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Progress bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(this.scale.width/2 - 160, this.scale.height/2 + 20, 320, 28);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ffff, 1);
            progressBar.fillRect(this.scale.width/2 - 156, this.scale.height/2 + 24, 312 * value, 20);
        });

        // Add load error handling
        this.load.on('loaderror', (file) => {
            console.error('Error loading file:', file.src);
        });
    }

    preload() {
        // Load styles
        this.load.css('style', './assets/css/style.css');
        
        // Load main menu background
        this.load.image('mainbg', './assets/mainbg.png');
        
        // Load bullet sprite
        this.load.image('bullet', './assets/bullet.png');
        
        // Load sound effects
        this.load.audio('laser', './assets/sounds/laser.wav');
        this.load.audio('bgMusic', './assets/sounds/background_music.mp3');
        
        // Load the font file directly
        this.load.binary('retronoid', './assets/fonts/retronoid/Retronoid.ttf');
    }

    create() {
        // Create a new style element
        const style = document.createElement('style');
        const fontData = this.cache.binary.get('retronoid');
        const fontFace = new FontFace('Retronoid', fontData);

        // Load the font face
        fontFace.load().then((loadedFace) => {
            document.fonts.add(loadedFace);
            console.log('Font loaded successfully');
        }).catch(error => {
            console.error('Font loading error:', error);
        });

        console.log('All assets loaded, starting MainMenu');
        this.scene.start('MainMenu');
    }
}
