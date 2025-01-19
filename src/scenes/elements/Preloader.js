/**
 * Preloader.js
 * Handles asset loading and initialization before the game starts.
 * Includes loading screen, progress tracking, and asset management.
 */

import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    /**
     * LOADING UI SETUP
     * Creates loading bar and progress indicators
     */
    init() {
        // Create centered loading text
        const loadingText = this.add.text(this.scale.width/2, this.scale.height/2, 'Loading...', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Create progress bar container and fill
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(this.scale.width/2 - 160, this.scale.height/2 + 20, 320, 28);

        // Update progress bar as assets load
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ffff, 1);
            progressBar.fillRect(this.scale.width/2 - 156, this.scale.height/2 + 24, 312 * value, 20);
        });

        // Handle loading errors
        this.load.on('loaderror', (file) => {
            console.error('Error loading file:', file.src);
        });
    }

    /**
     * ASSET LOADING
     * Loads all game assets including sprites, audio, and fonts
     */
    preload() {
        // Load font dependencies
        this.setupFonts();
        
        // Setup debug logging for asset loading
        this.setupLoadingDebug();
        
        // Create particle texture for effects
        this.createParticleTexture();
        
        // Load game assets by category
        this.loadBackgrounds();
        this.loadCharacterSprites();
        this.loadEnemySprites();
        this.loadProjectiles();
        this.loadAudio();
        this.loadCollectibles();
    }

    /**
     * FONT SETUP
     */
    setupFonts() {
        // Load WebFont library and CSS
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
        this.load.css('fonts', 'assets/fonts/fonts.css');
    }

    /**
     * LOADING DEBUG
     */
    setupLoadingDebug() {
        // Track individual asset loading progress
        this.load.on('filecomplete', (key, type, data) => {
            console.log('Loaded:', key, type);
            if (type === 'spritesheet') {
                const texture = this.textures.get(key);
                console.log(`Spritesheet ${key} dimensions:`, texture.source[0].width, 'x', texture.source[0].height);
                console.log(`Frame config:`, this.textures.get(key).customData);
            }
        });

        // Log loading errors with details
        this.load.on('loaderror', (file) => {
            console.error('Error loading:', file.key, file.src);
            console.error('Error details:', file.data);
        });
    }

    /**
     * PARTICLE EFFECTS
     */
    createParticleTexture() {
        // Create white circle for particle effects
        const particleTexture = this.make.graphics({ x: 0, y: 0, add: false });
        particleTexture.lineStyle(1, 0xFFFFFF);
        particleTexture.fillStyle(0xFFFFFF);
        particleTexture.beginPath();
        particleTexture.arc(4, 4, 4, 0, Math.PI * 2);
        particleTexture.closePath();
        particleTexture.fillPath();
        particleTexture.strokePath();
        particleTexture.generateTexture('particle', 8, 8);
    }

    /**
     * BACKGROUND ASSETS
     */
    loadBackgrounds() {
        // Main menu background
        this.load.image('mainbg', './assets/mainbg.png');
        
        // Parallax background layers
        for (let i = 1; i <= 9; i++) {
            this.load.image(`bg-${i}`, `./assets/backgrounds/${i}${i === 3 || i === 6 || i === 8 ? 'fx' : ''}.png`);
        }
        
        // Level tileset
        this.load.image('GtuTileset', 'assets/levels/image/GtuTileset.png');
    }

    /**
     * CHARACTER SPRITES
     */
    loadCharacterSprites() {
        // Character animation states
        const characterStates = {
            'idle': { endFrame: 4 },
            'walking': { endFrame: 6 },
            'run': { endFrame: 6 },
            'jump': { endFrame: 1 },
            'death': { endFrame: 8 }
        };

        // Load all character states
        Object.entries(characterStates).forEach(([state, config]) => {
            this.load.spritesheet(`character_${state}`, `./assets/character/character_${state.charAt(0).toUpperCase() + state.slice(1)}.png`, {
                frameWidth: 48,
                frameHeight: 48,
                startFrame: 0,
                endFrame: config.endFrame,
                spacing: 0,
                margin: 0
            });
        });
    }

    /**
     * ENEMY SPRITES
     */
    loadEnemySprites() {
        const enemyAssets = {
            // Drone assets
            drone: [
                { key: 'Bot1v1', path: 'assets/enemys/drone/Bot1v1.png', type: 'image' }
            ],
    
            // Slime assets
            slime: [
                { key: 'slime_idle', path: './assets/enemys/slime/slime_idle.png', frameWidth: 32, frameHeight: 32, endFrame: 3 },
                { key: 'slime_jump', path: './assets/enemys/slime/slime_jump.png', frameWidth: 32, frameHeight: 32, endFrame: 3 },
                { key: 'slime_death', path: './assets/enemys/slime/slime_death.png', frameWidth: 32, frameHeight: 32, endFrame: 4 }
            ],
    
            // Zapper assets
            zapper: [
                { key: 'zapper_idle', path: 'assets/zapper/zapper_idle.png', frameWidth: 32, frameHeight: 32, endFrame: 3 },
                { key: 'zapper_attack', path: 'assets/zapper/zapper_attack.png', frameWidth: 32, frameHeight: 32, endFrame: 3 },
                { key: 'zapper_walk', path: 'assets/zapper/zapper_walk.png', frameWidth: 32, frameHeight: 32, endFrame: 5 },
                { key: 'zapper_hit', path: 'assets/zapper/zapper_hit.png', frameWidth: 32, frameHeight: 32, endFrame: 2 },
                { key: 'zapper_death', path: 'assets/zapper/zapper_death.png', frameWidth: 32, frameHeight: 32, endFrame: 7 },
                { key: 'zapper_shock', path: 'assets/zapper/zapper_shock.png', frameWidth: 32, frameHeight: 32, endFrame: 6 }
            ]
        };
    
        // Load drone assets
        enemyAssets.drone.forEach(asset => {
            if (asset.type === 'image') {
                this.load.image(asset.key, asset.path);
                console.log(`Loading drone asset: ${asset.key}`);
            }
        });
    
        // Load slime animations
        enemyAssets.slime.forEach(slime => {
            this.load.spritesheet(slime.key, slime.path, {
                frameWidth: slime.frameWidth,
                frameHeight: slime.frameHeight,
                startFrame: 0,
                endFrame: slime.endFrame
            });
            console.log(`Loading slime animation: ${slime.key}`);
        });
    
        // Load zapper animations
        enemyAssets.zapper.forEach(zapper => {
            this.load.spritesheet(zapper.key, zapper.path, {
                frameWidth: zapper.frameWidth,
                frameHeight: zapper.frameHeight,
                startFrame: 0,
                endFrame: zapper.endFrame
            });
            console.log(`Loading zapper animation: ${zapper.key}`);
        });
    }
    

    /**
     * PROJECTILES AND EFFECTS
     */
    loadProjectiles() {
        // Load bullet sprites and animations
        const bulletConfigs = {
            'bullet_animation': { endFrame: undefined },
            'bullet': { endFrame: 3 }
        };

        Object.entries(bulletConfigs).forEach(([key, config]) => {
            this.load.spritesheet(key, `./assets/${key}.png`, {
                frameWidth: 32,
                frameHeight: 32,
                startFrame: 0,
                endFrame: config.endFrame,
                spacing: 0,
                margin: 0
            });
        });
    }

    /**
     * AUDIO ASSETS
     */
    loadAudio() {
        // Load sound effects and music
        const audioFiles = {
            'laser': './assets/sounds/laser.wav',
            'bgMusic': './assets/sounds/mainmenumusic.mp3',
            'hit': './assets/sounds/hit.wav',
            'bitcoin_collect': './assets/sounds/bitcoin_collect.mp3',
            'thezucc': './assets/sounds/thezucc.wav'
        };

        Object.entries(audioFiles).forEach(([key, path]) => {
            this.load.audio(key, path);
        });

        // Audio loading error handling
        this.load.on('loaderror', (file) => {
            if (file.type === 'audio') {
                console.error('Preloader - Error loading audio file:', file.key, file.url);
            }
        });
    }

    /**
     * COLLECTIBLES
     */
    loadCollectibles() {
        // Load bitcoin animation frames
        for (let i = 1; i <= 8; i++) {
            this.load.image(`bitcoin_${i}`, `assets/bitcoin/Bitcoin_${i}.png`);
        }
    }

    /**
     * SCENE TRANSITION
     * Handles font loading and game start
     */
    create() {
        // Initialize WebFont if available
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
                    this.registry.set('fontFamily', 'Arial');
                    this.scene.start('MainMenu');
                },
                timeout: 3000
            });
        } else {
            console.warn('WebFont not loaded, using fallback');
            this.registry.set('fontFamily', 'Arial');
            this.scene.start('MainMenu');
        }

        // Verify critical assets loaded
        this.verifyAssets();
    }

    /**
     * ASSET VERIFICATION
     */
    verifyAssets() {
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
