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
        // Debug logging for asset loading
        this.load.on('filecomplete', (key, type, data) => {
            console.log('Loaded:', key, type);
            if (type === 'spritesheet') {
                const texture = this.textures.get(key);
                console.log(`Spritesheet ${key} dimensions:`, texture.source[0].width, 'x', texture.source[0].height);
                console.log(`Frame config:`, this.textures.get(key).customData);
            }
        });

        this.load.on('loaderror', (file) => {
            console.error('Error loading:', file.key, file.src);
            console.error('Error details:', file.data);
        });

        // Create a white circle texture for particles programmatically
        const particleTexture = this.make.graphics({ x: 0, y: 0, add: false });
        particleTexture.lineStyle(1, 0xFFFFFF);
        particleTexture.fillStyle(0xFFFFFF);
        particleTexture.beginPath();
        particleTexture.arc(4, 4, 4, 0, Math.PI * 2);
        particleTexture.closePath();
        particleTexture.fillPath();
        particleTexture.strokePath();
        particleTexture.generateTexture('particle', 8, 8);

        // Debug log when particle texture is loaded
        this.load.on('filecomplete-image-particle', () => {
            console.log('Particle texture loaded successfully');
        });

        // Load styles
        this.load.css('style', './assets/css/style.css');
        
        // Load main menu background
        this.load.image('mainbg', './assets/mainbg.png');
        
        // Load character sprites with correct paths and frame sizes
        this.load.spritesheet('character_idle', './assets/character/character_Idle.png', {
            frameWidth: 48,
            frameHeight: 48,
            startFrame: 0,
            endFrame: 3
        });

        this.load.spritesheet('character_run', './assets/character/character_Run.png', {
            frameWidth: 48,
            frameHeight: 48,
            startFrame: 0,
            endFrame: 6,
            spacing: 0,
            margin: 0
        });
        console.log('Loading character_run sprite');

        this.load.spritesheet('character_walk', './assets/character/character_walking.png', {
            frameWidth: 48,
            frameHeight: 48,
            startFrame: 0,
            endFrame: 7
        });
        console.log('Loading character_walk sprite');

        this.load.spritesheet('character_jump', './assets/character/character_Jump.png', {
            frameWidth: 48,
            frameHeight: 48,
            startFrame: 0,
            endFrame: 3
        });
        console.log('Loading character_jump sprite');

        this.load.spritesheet('character_death', './assets/character/character_Death.png', {
            frameWidth: 48,
            frameHeight: 48,
            startFrame: 0,
            endFrame: 5
        });
        console.log('Loading character_death sprite');

        // Load bullet animation sprite
        this.load.spritesheet('bullet_animation', './assets/bullet_animation.png', {
            frameWidth: 32,  // Adjust this based on your sprite's frame width
            frameHeight: 32, // Adjust this based on your sprite's frame height
            spacing: 0,
            margin: 0
        });

        // Load bullet sprite
        this.load.spritesheet('bullet', './assets/bullet.png', {
            frameWidth: 32,  // Adjust this based on your new sprite's frame width
            frameHeight: 32, // Adjust this based on your new sprite's frame height
            startFrame: 0,
            endFrame: 3,     // Adjust this based on number of frames in your sprite
            spacing: 0,      // Adjust if there's spacing between frames
            margin: 0        // Adjust if there's margin around frames
        });
        
        // Load sound effects
        this.load.audio('laser', './assets/sounds/laser.wav');
        this.load.audio('bgMusic', './assets/sounds/background_music.mp3');
        this.load.audio('hit', './assets/sounds/hit.wav');
        
        // Load the font file directly
        this.load.binary('retronoid', './assets/fonts/retronoid/Retronoid.ttf');

        // Add load complete event
        this.load.on('complete', () => {
            console.log('All assets loaded');
            console.log('Available textures:', Object.keys(this.textures.list));
            
            // Log frame counts for each sprite
            ['character_idle', 'character_run', 'character_walk', 'character_jump', 'character_death'].forEach(key => {
                if (this.textures.exists(key)) {
                    console.log(`${key} frames:`, this.textures.get(key).frameTotal);
                } else {
                    console.error(`Missing texture: ${key}`);
                }
            });
        });
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

        // Debug logging for texture loading
        const textureKeys = ['character_idle', 'character_run', 'character_walk', 'character_jump', 'character_death'];
        textureKeys.forEach(key => {
            if (this.textures.exists(key)) {
                console.log(`${key} texture loaded successfully`);
                const texture = this.textures.get(key);
                console.log(`${key} dimensions:`, texture.source[0].width, 'x', texture.source[0].height);
                console.log(`${key} frames:`, texture.frameTotal);
            } else {
                console.error(`${key} texture failed to load`);
            }
        });

        console.log('All assets loaded, starting MainMenu');
        this.scene.start('MainMenu');
    }
}
