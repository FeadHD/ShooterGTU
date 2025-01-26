/**
 * AssetManager.js
 * Manages loading and initialization of all game assets
 * Handles sprites, audio, UI elements, and error handling
 */

import { PlayerHUD } from '../../prefabs/ui/PlayerHUD';
import { enemyAssets } from '../../config/enemyAssetsMap';

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
        //this.loadZapperAssets();   // Special enemy
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
            { key: 'player_idle', file: 'character_idle.png', frames: { start: 0, end: 3 }, frameRate: 10, repeat: -1 },
            { key: 'player_jump', file: 'character_jump.png', frames: { start: 0, end: 1 }, frameRate: 10, repeat: 0 },
            { key: 'player_death', file: 'character_death.png', frames: { start: 0, end: 5 }, frameRate: 8, repeat: 0 },
            { key: 'player_roll', file: 'character_roll.png', frames: { start: 0, end: 3 }, frameRate: 10, repeat: 0 },
            { key: 'player_walk', file: 'character_walk.png', frames: { start: 0, end: 5 }, frameRate: 12, repeat: 0 },
            { key: 'player_fall', file: 'character_fall.png', frames: { start: 0, end: 1 }, frameRate: 10, repeat: 0 }
        ];
    
        // Validate sprites before loading
        characterSprites.forEach(sprite => {
            if (!sprite.key || !sprite.file || !sprite.frames) {
                console.error('Invalid sprite configuration:', sprite);
            } else {
                console.log(`zzz Loading character sprite: ${sprite.key}`);
                this.scene.load.spritesheet(sprite.key, `assets/character/${sprite.file}`, {
                    frameWidth: 32,
                    frameHeight: 48
                });
            }
        });
    
        // Listen for load completion
        this.scene.load.once('complete', () => {
            console.log('zzz All character sprites loaded. Creating animations...');
    
            console.log('zzz All animations created successfully.');
        });
    
        this.scene.load.start(); // Start loading process
    }
    
    

    /**
     * Load enemy sprite variations
     * Multiple enemy types with states
     */

    loadEnemySprites() {
        console.log('loadEnemySprites called');
    
        Object.entries(enemyAssets).forEach(([folder, actions]) => {
            console.log(`Processing folder: ${folder}`);
            const fullPath = `assets/enemys/${folder}/`;
    
            actions.forEach(action => {
                const key = `${folder}_${action}`;
                const path = `${fullPath}${folder}_${action}.png`;
    
                // Define frame dimensions for spritesheets (modify as needed)
                const frameWidth = 32;  // Replace with the correct frame width
                const frameHeight = 32; // Replace with the correct frame height
    
                // Dynamically check if the file exists
                fetch(path, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        // Assume it's a spritesheet unless it's explicitly single-frame (like non-animated assets)
                        if (action === 'image') {
                            // Use `load.image` for non-animated assets
                            this.scene.load.image(key, path);
                            console.log(`Image queued for loading: ${key} -> ${path}`);
                        } else {
                            // Default to spritesheet for animated actions
                            this.scene.load.spritesheet(key, path, { frameWidth, frameHeight });
                            console.log(`Spritesheet queued for loading: ${key} -> ${path}`);
                        }
                    } else {
                        console.warn(`File not found: ${path}`);
                    }
                })
                .catch(error => {
                    console.warn(`Error checking file existence: ${path}`, error);
                });
            
            });
        });
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
    // loadZapperAssets() {
    //     console.log('zzz Loading Zapper assets...');
        
    //     // Load all Zapper spritesheets
    //     this.scene.load.spritesheet('zapper_idle', 'assets/zapper/zapper_idle.png', {
    //         frameWidth: 32,
    //         frameHeight: 32,
    //     });
    
    //     this.scene.load.spritesheet('zapper_walk', 'assets/zapper/zapper_walk.png', {
    //         frameWidth: 32,
    //         frameHeight: 32,
    //     });
    
    //     this.scene.load.spritesheet('zapper_attack', 'assets/zapper/zapper_attack.png', {
    //         frameWidth: 32,
    //         frameHeight: 32,
    //     });
    
    //     this.scene.load.spritesheet('zapper_wake', 'assets/zapper/zapper_wake.png', {
    //         frameWidth: 32,
    //         frameHeight: 32,
    //     });
    
    //     this.scene.load.spritesheet('zapper_shock', 'assets/zapper/zapper_shock.png', {
    //         frameWidth: 32,
    //         frameHeight: 32,
    //     });

    //     this.scene.load.spritesheet('zapper_death', 'assets/zapper/zapper_death.png', {
    //         frameWidth: 32,
    //         frameHeight: 32,
    //     });
    // }

    getTextureKeyForEntity(entityType) {
        console.log('zzz Asset Manager - Got Entity Type:', entityType);
        const type = entityType.toLowerCase();
    
        // Entity-to-texture mapping
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
                    'meleewarrior_death'
                ],
                width: 48,
                height: 48
            }
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
                height: 32
            };
        }
    
        // Check if texture exists in Phaser cache
        if (!this.scene.textures.exists(assetConfig.spritesheet)) {
            console.warn(`Spritesheet ${assetConfig.spritesheet} not found for entity type: ${entityType}`);
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
    
    
    //     const assetConfig = entityAssets[type];
    //     if (!assetConfig) {
    //         console.warn(`No asset configuration found for entity type: ${entityType}`);
    //         return {
    //             spritesheet: 'default_sprite',
    //             defaultAnim: null,
    //             animations: [],
    //             width: 32,
    //             height: 32
    //         };
    //     }
    
    //     if (!this.scene.textures.exists(assetConfig.spritesheet)) {
    //         console.warn(`Spritesheet ${assetConfig.spritesheet} not found in Phaser textures for entity type: ${entityType}`);
    //         return {
    //             spritesheet: 'default_sprite',
    //             defaultAnim: null,
    //             animations: [],
    //             width: assetConfig.width,
    //             height: assetConfig.height
    //         };
    //     }
    
    //     return assetConfig;
    // }
    
     
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
