import { PlayerHUD } from '../../prefabs/ui/PlayerHUD';

export class AssetManager {
    constructor(scene) {
        this.scene = scene;
        this.initialized = false;
    }

    /**
     * Initialize the asset manager
     */
    initialize() {
        if (this.initialized) return;
        this.initialized = true;
    }

    /**
     * Load all game assets
     */
    loadAssets() {
        this.loadTilesets();
        this.loadLevelData();
        this.loadCharacterSprites();
        this.loadEnemySprites();
        this.loadObjectSprites();
        this.loadEffects();
        this.loadUI();
        this.loadAudio();
        this.loadZapperAssets();
        this.setupErrorHandling();
    }

    /**
     * Load tileset assets
     */
    loadTilesets() {
        this.scene.load.image('GtuTileset', 'assets/levels/image/GtuTileset.png');
    }

    /**
     * Load level data
     */
    loadLevelData() {
        this.scene.load.json('combined-level', 'assets/levels/Json/WayneWorld.ldtk');
    }

    /**
     * Load character sprite assets
     */
    loadCharacterSprites() {
        const characterSprites = [
            { key: 'character_idle', file: 'character_Idle.png' },
            { key: 'character_jump', file: 'character_Jump.png' },
            { key: 'character_crouch', file: 'character_Crouch.png' },
            { key: 'character_death', file: 'character_Death.png' },
            { key: 'character_rollover', file: 'character_Rollover.png' },
            { key: 'character_walking', file: 'character_Walking.png' }
        ];

        characterSprites.forEach(sprite => {
            this.scene.load.spritesheet(sprite.key, `assets/character/${sprite.file}`, {
                frameWidth: 32,
                frameHeight: 48
            });
        });
    }

    /**
     * Load enemy sprite assets
     */
    loadEnemySprites() {
        // Basic enemy
        this.scene.load.image('enemy', 'assets/enemy.png');

        // Warrior sprites
        const warriorActions = [
            'idle', 'attack1', 'attack2', 'attack3', 'death',
            'defend', 'hurt', 'jump', 'run', 'walk'
        ];
        warriorActions.forEach(action => {
            const key = action === 'idle' ? 'warrior_idle' : `warrior_${action}`;
            const file = action === 'idle' ? 'IDLE.png' : `${action.toUpperCase()}.png`;
            this.scene.load.image(key, `assets/enemys/warrior/${file}`);
        });

        // Slime sprites
        const slimeActions = ['idle', 'jump', 'death'];
        slimeActions.forEach(action => {
            this.scene.load.image(`slime_${action}`, `assets/enemys/slime/slime_${action}.png`);
        });

        // Drone sprite
        this.scene.load.image('drone', 'assets/enemys/drone/Bot1v1.png');
    }

    /**
     * Load object sprite assets
     */
    loadObjectSprites() {
        this.scene.load.spritesheet('bullet_animation', 'assets/sprites/bullet.png', {
            frameWidth: 24,
            frameHeight: 24
        });
        this.scene.load.image('trampoline', 'assets/Objects/Trampoline/Trampoline.png');
        this.scene.load.image('bitcoin', 'assets/bitcoin/Bitcoin_1.png');
    }

    /**
     * Load effect assets
     */
    loadEffects() {
        this.scene.load.image('particle', 'assets/particles/particle.png');
        this.scene.load.image('spark', 'assets/effects/spark.png');
    }

    /**
     * Load UI assets
     */
    loadUI() {
        // Load all PlayerHUD assets using its static method
        PlayerHUD.preloadAssets(this.scene);
    }

    /**
     * Load audio assets
     */
    loadAudio() {
        const audioAssets = [
            { key: 'turretLaser', file: 'laser.wav' },
            { key: 'laser', file: 'laser.wav' },
            { key: 'hit', file: 'hit.wav' },
            { key: 'alarm', file: 'alarm.wav' },
            { key: 'bgMusic', file: 'thezucc.wav' }
        ];

        audioAssets.forEach(audio => {
            this.scene.load.audio(audio.key, `assets/sounds/${audio.file}`);
        });
    }

    /**
     * Load zapper assets and create animations
     */
    loadZapperAssets() {
        const zapperAnimations = [
            { key: 'idle', frames: 3, frameRate: 8, repeat: -1 },
            { key: 'wake', frames: 5, frameRate: 10, repeat: 0 },
            { key: 'walk', frames: 7, frameRate: 12, repeat: -1 },
            { key: 'shock', frames: 5, frameRate: 15, repeat: 0, frameWidth: 64 },
            { key: 'attack', frames: 5, frameRate: 12, repeat: 0 },
            { key: 'hit', frames: 3, frameRate: 15, repeat: 0 },
            { key: 'death', frames: 5, frameRate: 10, repeat: 0 }
        ];

        zapperAnimations.forEach(anim => {
            const spriteKey = `zapper_${anim.key}`;
            this.scene.load.spritesheet(spriteKey, `assets/zapper/zapper_${anim.key}.png`, {
                frameWidth: anim.frameWidth || 32,
                frameHeight: 32
            });

            this.scene.load.on(`filecomplete-spritesheet-${spriteKey}`, () => {
                console.log(`${spriteKey} loaded successfully`);
                this.scene.anims.create({
                    key: spriteKey,
                    frames: this.scene.anims.generateFrameNumbers(spriteKey, {
                        start: 0,
                        end: anim.frames
                    }),
                    frameRate: anim.frameRate,
                    repeat: anim.repeat
                });
            });
        });

        // Load base zapper image
        this.scene.load.image('zapper', 'assets/hazards/zapper.png');
    }

    /**
     * Set up error handling for asset loading
     */
    setupErrorHandling() {
        this.scene.load.on('loaderror', (fileObj) => {
            console.error('Error loading file:', fileObj.key, fileObj.src);
        });
    }

    /**
     * Create a PlayerHUD instance
     * @param {number} x - X position of the HUD
     * @param {number} y - Y position of the HUD
     * @param {boolean} fixedToCamera - Whether the HUD should be fixed to the camera
     * @returns {PlayerHUD} The created PlayerHUD instance
     */
    createPlayerHUD(x = 10, y = 10, fixedToCamera = true) {
        // Ensure UI assets are loaded
        if (!this.scene.textures.exists('health') || 
            !this.scene.textures.exists('health_2') || 
            !this.scene.textures.exists('lifebar') || 
            !this.scene.textures.exists('stamina')) {
            console.error('PlayerHUD assets not loaded. Make sure loadUI() was called first.');
            return null;
        }

        // Create and return the PlayerHUD instance
        return new PlayerHUD(this.scene, x, y, fixedToCamera);
    }
}
