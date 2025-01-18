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
        this.scene.load.image('default_sprite', 'assets/sprites/default.png');
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
            { key: 'character_idle', file: 'character_Idle.png' },     // Standing
            { key: 'character_jump', file: 'character_Jump.png' },     // Jumping
            { key: 'character_crouch', file: 'character_Crouch.png' }, // Ducking
            { key: 'character_death', file: 'character_Death.png' },   // Death
            { key: 'character_rollover', file: 'character_Rollover.png' }, // Dodge
            { key: 'character_walking', file: 'character_Walking.png' }   // Movement
        ];

        // Load each sprite with consistent dimensions
        characterSprites.forEach(sprite => {
            this.scene.load.spritesheet(sprite.key, `assets/character/${sprite.file}`, {
                frameWidth: 32,
                frameHeight: 48
            });
        });
    }

    /**
     * Load enemy sprite variations
     * Multiple enemy types with states
     */
    loadEnemySprites() {
        // Basic enemy sprite
        this.scene.load.image('enemy', 'assets/enemy.png');

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
        this.scene.load.image('spark', 'assets/effects/spark.png');
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
        // Load zapper sprite sheet for animations
        this.scene.load.spritesheet('zapper_sheet', 'assets/hazards/zapper.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // Create animations once assets are loaded
        this.scene.load.once('complete', () => {
            this.createZapperAnimations();
        });
    }

    createZapperAnimations() {
        // Idle animation
        this.scene.anims.create({
            key: 'zapper_idle',
            frames: this.scene.anims.generateFrameNumbers('zapper_sheet', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        // Attack animation if needed
        this.scene.anims.create({
            key: 'zapper_attack',
            frames: this.scene.anims.generateFrameNumbers('zapper_sheet', { start: 4, end: 7 }),
            frameRate: 15,
            repeat: 0
        });
    }

    getTextureKeyForEntity(entityType) {
        // Map of entity types to their texture/animation keys
        const textureMap = {
            'Zapper': {
                spritesheet: 'zapper_sheet',
                defaultAnim: 'zapper_idle',
                animations: ['zapper_idle', 'zapper_attack']
            },
            'Player': {
                spritesheet: 'character_sheet',
                defaultAnim: 'character_idle'
            },
            // Add more entity mappings as needed
        };

        const entityData = textureMap[entityType];
        if (!entityData) {
            console.warn(`No texture mapping found for entity type: ${entityType}`);
            return {
                spritesheet: 'default_sprite',
                defaultAnim: 'default_idle'
            };
        }

        return entityData;
    }

    validateTexture(textureKey) {
        if (!this.scene.textures.exists(textureKey)) {
            console.warn(`Texture ${textureKey} not found, using default`);
            return false;
        }
        return true;
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
            !this.scene.textures.exists('health_2') || 
            !this.scene.textures.exists('lifebar') || 
            !this.scene.textures.exists('stamina')) {
            console.error('PlayerHUD assets not loaded. Make sure loadUI() was called first.');
            return null;
        }

        // Create and return HUD
        return new PlayerHUD(this.scene, x, y, fixedToCamera);
    }
}
