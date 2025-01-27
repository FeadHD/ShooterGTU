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
     * Creates preloader animation
     */
    init() {
        // Track loading start time
        this.loadStartTime = Date.now();
        
        // Create preloader animation
        this.anims.create({
            key: 'loading',
            frames: this.anims.generateFrameNumbers('preloader', { start: 0, end: 15 }), // 16 frames total
            frameRate: 12, // We'll show each frame for ~0.083s
            repeat: -1
        });

        // Create and play the preloader sprite
        this.preloaderSprite = this.add.sprite(this.scale.width / 2, this.scale.height / 2, 'preloader')
            .setOrigin(0.5)
            .setScale(1.5)
            .play('loading');

        // Track load progress
        this.load.on('progress', (value) => {
            const timeElapsed = (Date.now() - this.loadStartTime) / 1000; 
            console.log(`Loading progress: ${Math.round(value * 100)}% after ${timeElapsed.toFixed(2)} seconds`);

            // Adjust animation speed based on progress
            const baseSpeed = 1;
            const speedMultiplier = 1 + value; 
            this.preloaderSprite.anims.timeScale = baseSpeed * speedMultiplier;
        });

        // Log when loading completes
        this.load.on('complete', () => {
            const totalTime = (Date.now() - this.loadStartTime) / 1000;
            console.log(`Loading completed in ${totalTime.toFixed(2)} seconds`);
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
        // 1) Font scripts & CSS
        this.setupFonts();

        // 2) Debug logging
        this.setupLoadingDebug();

        // 3) Custom particle shape
        this.createParticleTexture();

        // 4) Load everything (images, sprites, audio, fonts):
        this.loadBackgrounds();
        this.loadCharacterSprites();
        this.loadProjectiles();
        this.loadCollectibles();
        this.loadAudio();

        // 5) Additional UI or menu assets
        this.loadSceneSpecificAssets();
        this.loadPlayerHUD();
    }

    /**
     * Player HUD ASSET LOADING
     */
    loadPlayerHUD() {
        // 1) Health bar frames
        this.load.spritesheet('health', 'assets/PlayerHUD/health.png', {
            frameWidth: 103,
            frameHeight: 32
        });
    
        // 2) Lifebar background
        this.load.image('lifebar', 'assets/PlayerHUD/lifebar.png');
    
        // 3) Stamina bar frames
        this.load.spritesheet('stamina', 'assets/PlayerHUD/stamina.png', {
            frameWidth: 103,
            frameHeight: 32
        });
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
        this.load.on('filecomplete', (key, type) => {
            console.log('Loaded:', key, type);
            if (type === 'spritesheet') {
                const texture = this.textures.get(key);
                console.log(`Spritesheet ${key} dimensions:`,
                    texture.source[0].width, 'x', texture.source[0].height);
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
        // Creates a 'particle' texture: small white circle
        const particleTexture = this.make.graphics({ x: 0, y: 0, add: false });
        particleTexture.lineStyle(1, 0xffffff);
        particleTexture.fillStyle(0xffffff);
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
            const fxSuffix = (i === 3 || i === 6 || i === 8) ? 'fx' : '';
            this.load.image(`bg-${i}`, `./assets/backgrounds/${i}${fxSuffix}.png`);
        }

        // Level tileset
        this.load.image('GtuTileset', 'assets/levels/image/GtuTileset.png');
    }

    /**
     * CHARACTER SPRITES
     */
    loadCharacterSprites() {
        // e.g. multiple states: idle, walk, jump, etc.
        const characterStates = {
            idle: { endFrame: 4 },
            walk: { endFrame: 6 },
            jump: { endFrame: 1 },
            death: { endFrame: 8 },
            fall: { endFrame: 1 },
            roll: { endFrame: 3 }
        };

        Object.entries(characterStates).forEach(([state, config]) => {
            this.load.spritesheet(
                `character_${state}`,
                `./assets/character/character_${state}.png`, 
                {
                    frameWidth: 48,
                    frameHeight: 48,
                    endFrame: config.endFrame
                }
            );
        });
    }

    /**
     * PROJECTILES AND EFFECTS
     */
    loadProjectiles() {
        // Example bullet anim
        const bulletConfigs = {
            bullet_animation: { endFrame: 4 }
        };

        Object.entries(bulletConfigs).forEach(([key, cfg]) => {
            this.load.spritesheet(key, `./assets/${key}.png`, {
                frameWidth: 32,
                frameHeight: 32,
                endFrame: cfg.endFrame
            });
        });
    }

    /**
     * COLLECTIBLES
     */
    loadCollectibles() {
        // Bitcoin frames
        for (let i = 1; i <= 8; i++) {
            this.load.image(`bitcoin_${i}`, `assets/bitcoin/Bitcoin_${i}.png`);
        }
    }

    /**
     * AUDIO ASSETS
     */
    loadAudio() {
        // Example audio mapping
        const audioFiles = {
            laser: './assets/sounds/laser.wav',
            bgMusic: './assets/sounds/mainmenumusic.mp3',
            hit: './assets/sounds/hit.wav',
            bitcoin_collect: './assets/sounds/bitcoin_collect.mp3',
            thezucc: './assets/sounds/thezucc.wav',

            // Additional sounds from your code
            confirmSound: './assets/sounds/confirmation.mp3',   
            victoryMusic: './assets/sounds/congratulations.mp3' 
        };

        Object.entries(audioFiles).forEach(([key, path]) => {
            this.load.audio(key, path);
        });
    }

    /**
     * Menu/UI/Scene-Specific Assets
     */
    loadSceneSpecificAssets() {
        // e.g. "settingsBackground"
        this.load.image('settingsBackground', 'assets/settings/settings.png');

        // If needed: pauseBackground, or they are the same asset
        // this.load.image('pauseBackground', 'assets/settings/settings.png'); // if it differs

        // If you have unique fonts for multiple scenes (like 'Gameplay'):
        // Typically, we use the same webfont approach or keep the .ttf in "fonts" folder
        // and load it like 'this.load.font()' if supported. 
        // For now, here's the 'Gameplay' font from various menus:
        this.load.font('Gameplay', 'assets/fonts/retronoid/Gameplay.ttf');
    }

    /**
     * SCENE TRANSITION
     * Handles font loading and game start
     */
    create() {
        // Then load custom web font or fallback
        this.loadFont('Retronoid', 'assets/fonts/fonts.css', 'MainMenu', 'Arial', 3000);
    }

    loadFont(fontFamily, fontUrl, nextScene, fallbackFont, timeout) {
        if (typeof WebFont !== 'undefined') {
            WebFont.load({
                custom: { families: [fontFamily], urls: [fontUrl] },
                active: () => {
                    console.log(`${fontFamily} loaded successfully`);
                    this.scene.start(nextScene);
                },
                inactive: () => {
                    console.warn(`${fontFamily} failed to load, using fallback`);
                    this.registry.set('fontFamily', fallbackFont);
                    this.scene.start(nextScene);
                },
                timeout
            });
        } else {
            console.warn('WebFont not loaded, using fallback');
            this.registry.set('fontFamily', fallbackFont);
            this.scene.start(nextScene);
        }
    }
}
