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
        // Most assets are now loaded in Preloader.js
        this.loadLevelData();       // Level layout data
        this.loadEnemySprites();    // Enemy types (dynamic loading)
        this.setupErrorHandling();  // Error tracking
    }

    /**
     * Load level layout data
     * LDTK format level design
     */
    loadLevelData() {
        this.scene.load.json('combined-level', 'assets/levels/Json/WayneWorld.ldtk');
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
    
                // Define frame dimensions for spritesheets
                const frameWidth = 32;
                const frameHeight = 32;
    
                // Dynamically check if the file exists
                fetch(path, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        if (action === 'image') {
                            this.scene.load.image(key, path);
                            console.log(`Image queued for loading: ${key} -> ${path}`);
                        } else {
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
     * Set up asset loading error handlers
     * Logs failed asset loads
     */
    setupErrorHandling() {
        this.scene.load.on('loaderror', (fileObj) => {
            console.error('Error loading file:', fileObj.key, fileObj.src);
        });
    }

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
    
    validateTexture(textureKey) {
        return this.scene.textures.exists(textureKey);
    }

    getDefaultTexture() {
        return 'default_sprite';
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
