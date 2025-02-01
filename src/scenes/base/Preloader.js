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
            repeat: -1,
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
            this.preloaderSprite.anims.timeScale = 1 + value;
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
     * Retrieves the texture configuration for an entity type
     * @param {string} entityType - The type of entity
     * @returns {Object} - Configuration for the entity's texture, animations, etc.
     */
    getTextureKeyForEntity(entityType) {
        console.log('Preloader - Got Entity Type:', entityType);
        const type = entityType.toLowerCase();

        // Entity-to-texture mapping
        const entityAssets = {
            zapper: {
                spritesheet: 'zapper_idle',
                defaultAnim: 'zapper_idle',
                animations: ['zapper_idle', 'zapper_attack', 'zapper_walk', 'zapper_death'],
                width: 32,
                height: 32,
            },
            playerstart: {
                spritesheet: 'player_idle',
                defaultAnim: 'player_idle',
                animations: ['player_idle'],
                width: 48,
                height: 48,
            },
            meleewarrior: {
                spritesheet: 'meleewarrior_idle',
                defaultAnim: 'meleewarrior_idle',
                animations: [
                    'meleewarrior_idle',
                    'meleewarrior_walk',
                    'meleewarrior_attack1',
                    'meleewarrior_attack2',
                    'meleewarrior_attack3',
                    'meleewarrior_hurt',
                    'meleewarrior_death',
                ],
                width: 48,
                height: 48,
            },
            // Add more entities here as needed
        };

        const assetConfig = entityAssets[type];

        // Handle missing entity configurations
        if (!assetConfig) {
            console.warn(`No asset configuration found for entity type: ${entityType}`);
            return {
                spritesheet: 'default_sprite',
                defaultAnim: null,
                animations: [],
                width: 32,
                height: 32,
            };
        }

        // Check if texture exists in Phaser cache
        if (!this.textures.exists(assetConfig.spritesheet)) {
            console.warn(`Spritesheet ${assetConfig.spritesheet} not found for entity type: ${entityType}`);
            return {
                spritesheet: 'default_sprite',
                defaultAnim: null,
                animations: [],
                width: assetConfig.width,
                height: assetConfig.height,
            };
        }

        return assetConfig;
    }

    /**
     * Player HUD ASSET LOADING
     */
    loadPlayerHUD() {
        this.load.spritesheet('health', 'assets/PlayerHUD/health.png', {
            frameWidth: 103,
            frameHeight: 32,
        });
        this.load.image('lifebar', 'assets/PlayerHUD/lifebar.png');
        this.load.spritesheet('stamina', 'assets/PlayerHUD/stamina.png', {
            frameWidth: 103,
            frameHeight: 32,
        });
    }

    /**
     * FONT SETUP
     */
    setupFonts() {
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
        this.load.css('fonts', 'assets/fonts/fonts.css');
    }

    /**
     * LOADING DEBUG
     */
    setupLoadingDebug() {
        this.load.on('filecomplete', (key, type) => {
            console.log('Loaded:', key, type);
            if (type === 'spritesheet') {
                const texture = this.textures.get(key);
                console.log(`Spritesheet ${key} dimensions:`, texture.source[0].width, 'x', texture.source[0].height);
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
        this.load.image('mainbg', './assets/mainbg.png');
        for (let i = 1; i <= 9; i++) {
            const fxSuffix = i === 3 || i === 6 || i === 8 ? 'fx' : '';
            this.load.image(`bg-${i}`, `./assets/backgrounds/${i}${fxSuffix}.png`);
        }
        this.load.image('GtuTileset', 'assets/levels/image/GtuTileset.png');
    }

    /**
     * CHARACTER SPRITES
     */
    loadCharacterSprites() {
        const characterStates = {
            idle: { endFrame: 4 },
            walk: { endFrame: 6 },
            jump: { endFrame: 1 },
            death: { endFrame: 8 },
            fall: { endFrame: 1 },
            roll: { endFrame: 3 },
        };

        Object.entries(characterStates).forEach(([state, config]) => {
            this.load.spritesheet(
                `character_${state}`,
                `./assets/character/character_${state}.png`,
                {
                    frameWidth: 48,
                    frameHeight: 48,
                    endFrame: config.endFrame,
                }
            );
        });
    }

    /**
     * PROJECTILES AND EFFECTS
     */
    loadProjectiles() {
        const bulletConfigs = {
            bullet_animation: { endFrame: 4 },
        };

        Object.entries(bulletConfigs).forEach(([key, cfg]) => {
            this.load.spritesheet(key, `./assets/${key}.png`, {
                frameWidth: 32,
                frameHeight: 32,
                endFrame: cfg.endFrame,
            });
        });
    }

    /**
     * COLLECTIBLES
     */
    loadCollectibles() {
        for (let i = 1; i <= 8; i++) {
            this.load.image(`bitcoin_${i}`, `assets/bitcoin/Bitcoin_${i}.png`);
        }
    }

    /**
     * AUDIO ASSETS
     */
    loadAudio() {
        const audioFiles = {
            laser: './assets/sounds/laser.wav',
            bgMusic: './assets/sounds/mainmenumusic.mp3',
            hit: './assets/sounds/hit.wav',
            bitcoin_collect: './assets/sounds/bitcoin_collect.mp3',
            thezucc: './assets/sounds/thezucc.wav',
            confirmSound: './assets/sounds/confirmation.mp3',
            victoryMusic: './assets/sounds/congratulations.mp3',
        };

        Object.entries(audioFiles).forEach(([key, path]) => {
            this.load.audio(key, path);
        });
    }

    /**
     * Menu/UI/Scene-Specific Assets
     */
    loadSceneSpecificAssets() {
        this.load.image('settingsBackground', 'assets/settings/settings.png');
        this.load.font('Gameplay', 'assets/fonts/retronoid/Gameplay.ttf');
    }

    /**
     * SCENE TRANSITION
     */
    create() {
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
                timeout,
            });
        } else {
            console.warn('WebFont not loaded, using fallback');
            this.registry.set('fontFamily', fallbackFont);
            this.scene.start(nextScene);
        }
    }
}
