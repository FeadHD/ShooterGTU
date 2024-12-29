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
        // Load WebFont first
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

        // Load font CSS
        this.load.css('fonts', 'assets/fonts/fonts.css');

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

        // Load styles and fonts
        // Load main menu background
        this.load.image('mainbg', './assets/mainbg.png');
        
        // Load parallax background layers
        this.load.image('bg-1', './assets/backgrounds/1.png');
        this.load.image('bg-2', './assets/backgrounds/2.png');
        this.load.image('bg-3', './assets/backgrounds/3fx.png');
        this.load.image('bg-4', './assets/backgrounds/4.png');
        this.load.image('bg-5', './assets/backgrounds/5.png');
        this.load.image('bg-6', './assets/backgrounds/6fx.png');
        this.load.image('bg-7', './assets/backgrounds/7.png');
        this.load.image('bg-8', './assets/backgrounds/8fx.png');
        this.load.image('bg-9', './assets/backgrounds/9.png');
        
        // Load drone image
        this.load.image('Bot1v1', 'assets/enemys/drone/Bot1v1.png');

        // Load character sprites with correct paths and frame sizes
        this.load.spritesheet('character_idle', './assets/character/character_Idle.png', {
            frameWidth: 48,
            frameHeight: 48,
            startFrame: 0,
            endFrame: 4
        });

        this.load.spritesheet('character_walking', './assets/character/character_Walking.png', {
            frameWidth: 48,
            frameHeight: 48,
            startFrame: 0,
            endFrame: 6,
            spacing: 0,
            margin: 0
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

        this.load.spritesheet('character_jump', './assets/character/character_Jump.png', {
            frameWidth: 48,
            frameHeight: 48,
            startFrame: 0,
            endFrame: 1,
            spacing: 0,
            margin: 0
        });
        console.log('Loading character_jump sprite');

        this.load.spritesheet('character_death', './assets/character/character_Death.png', {
            frameWidth: 48,
            frameHeight: 48,
            startFrame: 0,
            endFrame: 8,
            spacing: 0,
            margin: 0
        });
        console.log('Loading character_death sprite');

        // Load slime sprites
        console.log('Loading slime sprites...');
        this.load.spritesheet('slime_idle', './assets/enemys/slime/slime_idle.png', {
            frameWidth: 32,
            frameHeight: 32,
            startFrame: 0,
            endFrame: 3
        });
        
        this.load.spritesheet('slime_jump', './assets/enemys/slime/slime_jump.png', {
            frameWidth: 32,
            frameHeight: 32,
            startFrame: 0,
            endFrame: 3
        });

        this.load.spritesheet('slime_death', './assets/enemys/slime/slime_death.png', {
            frameWidth: 32,
            frameHeight: 32,
            startFrame: 0,
            endFrame: 4
        });

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
        
        // Load enemy melee warrior sprite sheets
        const meleeWarriorConfig = {
            frameWidth: 96,
            frameHeight: 84,
            spacing: 0,
            margin: 0,
            startFrame: 0
        };

        // Load all sprite sheets with the same config
        this.load.spritesheet('enemymeleewarrior_IDLE', '/assets/enemys/warrior/IDLE.png', {
            ...meleeWarriorConfig,
            endFrame: 5
        });
        this.load.spritesheet('enemymeleewarrior_WALK', '/assets/enemys/warrior/WALK.png', {
            ...meleeWarriorConfig,
            endFrame: 7
        });
        this.load.spritesheet('enemymeleewarrior_ATTACK 1', '/assets/enemys/warrior/ATTACK 1.png', {
            ...meleeWarriorConfig,
            endFrame: 6
        });
        this.load.spritesheet('enemymeleewarrior_DEATH', '/assets/enemys/warrior/DEATH.png', {
            ...meleeWarriorConfig,
            endFrame: 8
        });
        this.load.spritesheet('enemymeleewarrior_HURT', '/assets/enemys/warrior/HURT.png', {
            ...meleeWarriorConfig,
            endFrame: 3
        });
        this.load.spritesheet('enemymeleewarrior_DEFEND', '/assets/enemys/warrior/DEFEND.png', {
            ...meleeWarriorConfig,
            endFrame: 3
        });
        this.load.spritesheet('enemymeleewarrior_RUN', '/assets/enemys/warrior/RUN.png', {
            ...meleeWarriorConfig,
            endFrame: 7
        });
        this.load.spritesheet('enemymeleewarrior_JUMP', '/assets/enemys/warrior/JUMP.png', {
            ...meleeWarriorConfig,
            endFrame: 3
        });

        // Debug log when warrior sprite sheets are loaded
        ['IDLE', 'WALK', 'ATTACK 1', 'DEATH', 'HURT', 'DEFEND', 'RUN', 'JUMP'].forEach(animation => {
            this.load.on(`filecomplete-spritesheet-enemymeleewarrior_${animation}`, (key) => {
                const texture = this.textures.get(key);
                console.log(`Enemy melee warrior ${animation} sprite sheet loaded:`, {
                    key: key,
                    frameCount: texture.frameTotal,
                    width: texture.source[0].width,
                    height: texture.source[0].height
                });
            });
        });

        // Load sound effects
        this.load.audio('laser', './assets/sounds/laser.wav');
        this.load.audio('bgMusic', './assets/sounds/background_music.mp3');
        this.load.audio('hit', './assets/sounds/hit.wav');
        this.load.audio('bitcoin_collect', './assets/sounds/bitcoin_collect.mp3');
        this.load.audio('thezucc', './assets/sounds/thezucc.wav');
        
        // Add error handler for audio loading
        this.load.on('loaderror', (file) => {
            if (file.type === 'audio') {
                console.error('Preloader - Error loading audio file:', file.key, file.url);
            }
        });

        // Add success handler for audio loading
        this.load.on('filecomplete', (key, type) => {
            if (type === 'audio') {
                console.log('Preloader - Successfully loaded audio:', key);
            }
        });
        
        // Load bitcoin animation frames
        for (let i = 1; i <= 8; i++) {
            this.load.image(`bitcoin_${i}`, `assets/bitcoin/Bitcoin_${i}.png`);
        }

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
        // Wait for WebFont to load before starting game
        if (typeof WebFont !== 'undefined') {
            WebFont.load({
                custom: {
                    families: ['Retronoid'],
                    urls: ['assets/fonts/fonts.css']
                },
                active: () => {
                    console.log('Font loaded successfully');
                    this.scene.start('MainMenu');
                },
                inactive: () => {
                    console.warn('Font failed to load, using fallback');
                    // Set fallback font in game registry for other scenes to use
                    this.registry.set('fontFamily', 'Arial');
                    this.scene.start('MainMenu');
                },
                timeout: 3000 // Set timeout to 3 seconds
            });
        } else {
            console.warn('WebFont not loaded, using fallback');
            this.registry.set('fontFamily', 'Arial');
            this.scene.start('MainMenu');
        }

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
    }
}
