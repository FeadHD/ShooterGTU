/**
 * AssetManager.js
 * Manages loading and initialization of all game assets
 * Handles sprites, audio, UI elements, and error handling
 */

import { PlayerHUD } from '../../prefabs/ui/PlayerHUD';

export class AssetManager {
    /**
     * Initialize asset management system
     * @param {Phaser.Scene} scene - Scene to load assets into
     */
    constructor(scene) {
        this.scene = scene;
        this.initialized = false;
        console.log('AssetManager initialized for scene:', scene.sys.settings.key);
    }
    
    /**
     * One-time initialization check
     * Prevents duplicate asset loading
     */
    initialize() {
        if (this.initialized) return;
        this.initialized = true;
    }

    /**
     * Load all game assets in sequence
     * Called during scene preload phase
     */
    loadAssets() {
        this.loadDefaultSprite();
        this.loadTilesets();        // Level tiles
        this.loadLevelData();       // Level layout
        this.loadCharacterSprites();// Player animations
        this.loadEnemySprites();    // Enemy types
        this.loadObjectSprites();   // Interactive objects
        this.loadEffects();         // Particles and FX
        this.loadUI();             // HUD elements
        this.loadAudio();          // Sound effects
        this.loadZapperAssets();   // Special enemy
        this.setupErrorHandling(); // Error tracking
    }

    loadDefaultSprite() {
        // Load default sprite from public assets
        this.scene.load.image('default_sprite', 'assets/default.png');
    }

    /**
     * Load level tileset images
     * Used for building game world
     */
    loadTilesets() {
        this.scene.load.image('GtuTileset', 'assets/levels/image/GtuTileset.png');
    }

    /**
     * Load level layout data
     * LDTK format level design
     */
    loadLevelData() {
        this.scene.load.json('combined-level', 'assets/levels/Json/WayneWorld.ldtk');
    }

    /**
     * Load player character sprites
     * All animations and states
     */
    loadCharacterSprites() {
        const characterSprites = [
            { key: 'player_idle', file: 'character_Idle.png', frames: { start: 0, end: 3 }, frameRate: 10, repeat: -1 },
            { key: 'player_jump', file: 'character_Jump.png', frames: { start: 0, end: 1 }, frameRate: 10, repeat: 0 },
            { key: 'player_crouch', file: 'character_Crouch.png', frames: { start: 0, end: 1 }, frameRate: 10, repeat: 0 },
            { key: 'player_death', file: 'character_Death.png', frames: { start: 0, end: 5 }, frameRate: 8, repeat: 0 },
            { key: 'player_roll', file: 'character_Roll.png', frames: { start: 0, end: 3 }, frameRate: 10, repeat: 0 },
            { key: 'player_walk', file: 'character_Walk.png', frames: { start: 0, end: 5 }, frameRate: 12, repeat: -1 },
            { key: 'player_fall', file: 'character_Fall.png', frames: { start: 0, end: 1 }, frameRate: 10, repeat: 0 }
        ];
    
        // Load spritesheets
        characterSprites.forEach(sprite => {
            console.log(`zzz Loading character sprite: ${sprite.key}`);
            this.scene.load.spritesheet(sprite.key, `assets/character/${sprite.file}`, {
                frameWidth: 32,
                frameHeight: 48
            });
        });
    
        // Listen for load completion
        this.scene.load.once('complete', () => {
            console.log('zzz All character sprites loaded. Creating animations...');
            
            // Create animations dynamically based on sprite metadata
            characterSprites.forEach(sprite => {
                if (this.scene.textures.exists(sprite.key)) {
                    this.scene.anims.create({
                        key: sprite.key,
                        frames: this.scene.anims.generateFrameNumbers(sprite.key, sprite.frames),
                        frameRate: sprite.frameRate,
                        repeat: sprite.repeat
                    });
                    console.log(`zzz Animation ${sprite.key} created`);
                } else {
                    console.warn(`zzz Sprite not found for animation: ${sprite.key}`);
                }
            });
    
            console.log('zzz All animations created successfully.');
        });
    
        this.scene.load.start(); // Start loading if not done already
    }
    

    /**
     * Load enemy sprite variations
     * Multiple enemy types with states
     */
    loadEnemySprites() {
        // Melee warrior with combat states
        const warriorActions = [
            'idle', 'attack1', 'attack2', 'attack3', 'death',
            'defend', 'hurt', 'jump', 'run', 'walk'
        ];
        warriorActions.forEach(action => {
            const key = action === 'idle' ? 'warrior_idle' : `warrior_${action}`;
            const file = action === 'idle' ? 'IDLE.png' : `${action.toUpperCase()}.png`;
            this.scene.load.image(key, `assets/enemys/warrior/${file}`);
        });

        // Basic slime enemy states
        const slimeActions = ['idle', 'jump', 'death'];
        slimeActions.forEach(action => {
            this.scene.load.image(`slime_${action}`, `assets/enemys/slime/slime_${action}.png`);
        });

        // Flying drone enemy
        this.scene.load.image('drone', 'assets/enemys/drone/Bot1v1.png');
    }

    /**
     * Load interactive object sprites
     * Projectiles and collectibles
     */
    loadObjectSprites() {
        // Bullet projectile animation
        this.scene.load.spritesheet('bullet_animation', 'assets/sprites/bullet.png', {
            frameWidth: 24,
            frameHeight: 24
        });
        
        // Interactive objects
        this.scene.load.image('trampoline', 'assets/Objects/Trampoline/Trampoline.png');
        this.scene.load.image('bitcoin', 'assets/bitcoin/Bitcoin_1.png');
    }

    /**
     * Load particle and effect sprites
     * Visual feedback elements
     */
    loadEffects() {
        this.scene.load.image('particle', 'assets/particles/particle.png');
    }

    /**
     * Load UI elements and HUD
     * Player status display
     */
    loadUI() {
        PlayerHUD.preloadAssets(this.scene);
    }

    /**
     * Load game audio assets
     * Sound effects and music
     */
    loadAudio() {
        const audioAssets = [
            { key: 'turretLaser', file: 'laser.wav' },  // Weapon fire
            { key: 'laser', file: 'laser.wav' },        // Projectile
            { key: 'hit', file: 'hit.wav' },           // Impact
            { key: 'alarm', file: 'alarm.wav' },       // Alert
            { key: 'bgMusic', file: 'thezucc.wav' }    // Background
        ];

        audioAssets.forEach(audio => {
            this.scene.load.audio(audio.key, `assets/sounds/${audio.file}`);
        });
    }

    /**
     * Load zapper enemy assets
     * Special enemy with electrical attacks
     */
    loadZapperAssets() {
        console.log('zzz Loading Zapper assets...');
        
        // Load all Zapper spritesheets
        this.scene.load.spritesheet('zapper_idle', 'assets/zapper/zapper_idle.png', {
            frameWidth: 32,
            frameHeight: 32,
        });
    
        this.scene.load.spritesheet('zapper_walk', 'assets/zapper/zapper_walk.png', {
            frameWidth: 32,
            frameHeight: 32,
        });
    
        this.scene.load.spritesheet('zapper_attack', 'assets/zapper/zapper_attack.png', {
            frameWidth: 32,
            frameHeight: 32,
        });
    
        this.scene.load.spritesheet('zapper_wake', 'assets/zapper/zapper_wake.png', {
            frameWidth: 32,
            frameHeight: 32,
        });
    
        this.scene.load.spritesheet('zapper_shock', 'assets/zapper/zapper_shock.png', {
            frameWidth: 32,
            frameHeight: 32,
        });

        this.scene.load.spritesheet('zapper_death', 'assets/zapper/zapper_death.png', {
            frameWidth: 32,
            frameHeight: 32,
        });
    }

    getTextureKeyForEntity(entityType) {
        console.log('zzz Asset Manager - Got Entity Type:', entityType);
        const type = entityType.toLowerCase();
    
        const entityAssets = {
            zapper: {
                spritesheet: 'zapper_idle',
                defaultAnim: 'zapper_idle',
                animations: ['zapper_idle', 'zapper_attack', 'zapper_walk', 'zapper_death'],
                width: 32,
                height: 32
            },
            playerstart: {
                spritesheet: 'player_idle',
                defaultAnim: 'player_idle',
                animations: ['player_idle'],
                width: 48,
                height: 48
            }
            // Add more entities as needed
        };
    
        const assetConfig = entityAssets[type];
        if (!assetConfig) {
            console.warn(`No asset configuration found for entity type: ${entityType}`);
            return {
                spritesheet: 'default_sprite',
                defaultAnim: null,
                animations: [],
                width: 32,
                height: 32
            };
        }
    
        if (!this.scene.textures.exists(assetConfig.spritesheet)) {
            console.warn(`Spritesheet ${assetConfig.spritesheet} not found in Phaser textures for entity type: ${entityType}`);
            return {
                spritesheet: 'default_sprite',
                defaultAnim: null,
                animations: [],
                width: assetConfig.width,
                height: assetConfig.height
            };
        }
    
        return assetConfig;
    }
    
     
    validateTexture(textureKey) {
        return this.scene.textures.exists(textureKey);
    }

    getDefaultTexture() {
        return 'default_sprite';
    }

    /**
     * Set up asset loading error handlers
     * Logs failed asset loads
     */
    setupErrorHandling() {
        this.scene.load.on('loaderror', (fileObj) => {
            console.error('Error loading file:', fileObj.key, fileObj.src);
        });
    }

    /**
     * Create player HUD interface
     * @param {number} x - HUD x position
     * @param {number} y - HUD y position
     * @param {boolean} fixedToCamera - Lock to viewport
     * @returns {PlayerHUD} HUD instance
     */
    createPlayerHUD(x = 10, y = 10, fixedToCamera = true) {
        // Verify required assets are loaded
        if (!this.scene.textures.exists('health') ||  
            !this.scene.textures.exists('lifebar') || 
            !this.scene.textures.exists('stamina')) {
            console.error('PlayerHUD assets not loaded. Make sure loadUI() was called first.');
            return null;
        }

        // Create and return HUD
        return new PlayerHUD(this.scene, x, y, fixedToCamera);
    }
}
