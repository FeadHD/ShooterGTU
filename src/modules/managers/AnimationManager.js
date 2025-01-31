/**
 * AnimationManager.js
 * Manages sprite animations for all game entities, UI, and objects.
 * Consolidates all anims in one place so they're easy to maintain.
 */

export class AnimationManager {
    /**
     * Initialize animation system
     * @param {Phaser.Scene} scene - The scene for anim creation
     */
    constructor(scene) {
        this.scene = scene;
        this.initialized = false;
    }

    /**
     * Called once at scene startup (in create())
     */
    initialize() {
        if (!this.initialized) {
            this.createAllAnimations();
            this.initialized = true;
        }
    }

    /**
     * Check if an animation with the given key exists
     */
    hasAnimation(key) {
        return this.scene.anims.exists(key);
    }

    /**
     * Play an existing animation on a sprite
     */
    play(gameObject, key, ignoreIfPlaying = true) {
        if (this.hasAnimation(key)) {
            gameObject.play(key, ignoreIfPlaying);
            return true;
        }
        return false;
    }

    // ------------------------------------------------------------------------
    //  DYNAMIC / EPHEMERAL ANIMATIONS
    // ------------------------------------------------------------------------

    /**
     * Example: If the HUD wants partial-step transitions between frames,
     * we can create a temporary animation, then remove it after playing.
     * The PlayerHUD will call this instead of creating its own anims.
     *
     * @param {Phaser.GameObjects.Sprite} sprite - The health sprite
     * @param {number} prevFrame - Frame index currently displayed
     * @param {number} targetFrame - Frame index we want to get to
     * @param {function} [onComplete] - Optional callback after finishing
     */
    playHealthTransition(sprite, prevFrame, targetFrame, onComplete = null) {
        // If frames are the same, just set it and exit
        if (prevFrame === targetFrame) {
            sprite.setFrame(targetFrame);
            if (onComplete) onComplete();
            return;
        }

        // Build ascending or descending frames
        const frames = [];
        if (targetFrame > prevFrame) {
            for (let i = prevFrame; i <= targetFrame; i++) {
                frames.push({ key: 'health', frame: i });
            }
        } else {
            for (let i = prevFrame; i >= targetFrame; i--) {
                frames.push({ key: 'health', frame: i });
            }
        }

        // If there's only 1 or 0 frames, just setFrame and exit
        if (frames.length <= 1) {
            sprite.setFrame(targetFrame);
            if (onComplete) onComplete();
            return;
        }

        // Create a unique key
        const animKey = `health_change_${Date.now()}`;

        // Create ephemeral animation
        this.scene.anims.create({
            key: animKey,
            frames,
            frameRate: 8,
            repeat: 0
        });

        // Play and remove the anim key after it's done
        sprite.play(animKey);
        sprite.once('animationcomplete', () => {
            this.scene.anims.remove(animKey);
            sprite.setFrame(targetFrame);
            if (onComplete) onComplete();
        });
    }

    // ------------------------------------------------------------------------
    //  CORE ANIMATIONS
    // ------------------------------------------------------------------------

    /**
     * Example bullet animation
     */
    createBulletAnimation() {
        if (!this.scene.anims.exists('bullet_animation')) {
            this.scene.anims.create({
                key: 'bullet_animation',
                frames: this.scene.anims.generateFrameNumbers('bullet_animation', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1 // Loop indefinitely
            });
        }
    }

    // /**
    //  * Additional bullet/travel anim
    //  */
    // createAdditionalBulletAnimations() {
    //     if (!this.scene.anims.exists('bullet-travel')) {
    //         this.scene.anims.create({
    //             key: 'bullet-travel',
    //             frames: this.scene.anims.generateFrameNumbers('bullet', { start: 0, end: 7 }),
    //             frameRate: 16,
    //             repeat: -1
    //         });
    //     }
    // }

    /**
     * Player character animations
     */
    createCharacterAnimations() {
        const animations = [
            {
                key: 'character_Idle',
                texture: 'character_idle',
                frames: { start: 0, end: 3 },
                frameRate: 8,
                repeat: -1
            },
            {
                key: 'character_Walk',
                texture: 'character_walk',
                frames: { start: 0, end: 5 },
                frameRate: 10,
                repeat: -1
            },
            {
                key: 'character_Death',
                texture: 'character_death',
                frames: { start: 0, end: 5 },
                frameRate: 8,
                repeat: 0
            },
            {
                key: 'character_Jump',
                texture: 'character_jump',
                frames: { start: 0, end: 1 },
                frameRate: 10,
                repeat: 0
            },
            {
                key: 'character_Fall',
                texture: 'character_fall',
                frames: { start: 0, end: 1 },
                frameRate: 10,
                repeat: 0
            },
            {
                key: 'character_Roll',
                texture: 'character_roll',
                frames: { start: 0, end: 3 },
                frameRate: 15,
                repeat: 0
            }
        ];

        animations.forEach(anim => {
            if (!this.scene.textures.exists(anim.texture)) {
                console.warn(`Texture not found for animation: ${anim.texture}`);
                return;
            }
            if (!this.scene.anims.exists(anim.key)) {
                this.scene.anims.create({
                    key: anim.key,
                    frames: this.scene.anims.generateFrameNumbers(anim.texture, anim.frames),
                    frameRate: anim.frameRate,
                    repeat: anim.repeat
                });
                console.log(`Created animation: ${anim.key}`);
            }
        });
    }

    /**
 * Dynamically creates animations for enemies based on loaded assets.
 */
    createEnemyAnimations() {
        console.log('Creating enemy animations dynamically...');
    
        const enemyAnimations = [
            // Melee Warrior Animations
            { key: 'meleewarrior_attack1', texture: 'melee_warrior_attack1', frames: { start: 0, end: 6 }, frameRate: 8, repeat: 0 },
            { key: 'meleewarrior_attack2', texture: 'melee_warrior_attack2', frames: { start: 0, end: 6 }, frameRate: 8, repeat: 0 },
            { key: 'meleewarrior_attack3', texture: 'melee_warrior_attack3', frames: { start: 0, end: 6 }, frameRate: 8, repeat: 0 },
            { key: 'meleewarrior_death', texture: 'melee_warrior_death', frames: { start: 0, end: 8 }, frameRate: 8, repeat: 0 },
            { key: 'meleewarrior_defend', texture: 'melee_warrior_defend', frames: { start: 0, end: 3 }, frameRate: 8, repeat: 0 },
            { key: 'meleewarrior_walk', texture: 'melee_warrior_walk', frames: { start: 0, end: 7 }, frameRate: 8, repeat: -1 },
            { key: 'meleewarrior_hurt', texture: 'melee_warrior_hurt', frames: { start: 0, end: 3 }, frameRate: 8, repeat: 0 },
            { key: 'meleewarrior_jump', texture: 'melee_warrior_jump', frames: { start: 0, end: 3 }, frameRate: 8, repeat: 0 },
            { key: 'meleewarrior_idle', texture: 'melee_warrior_idle', frames: { start: 0, end: 5 }, frameRate: 8, repeat: -1 },
    
            // Zapper Animations
            { key: 'zapper_idle', texture: 'zapper_idle', frames: { start: 0, end: 0 }, frameRate: 8, repeat: -1 },
            { key: 'zapper_wake', texture: 'zapper_wake', frames: { start: 0, end: 5 }, frameRate: 8, repeat: 0 },
            { key: 'zapper_walk', texture: 'zapper_walk', frames: { start: 0, end: 5 }, frameRate: 8, repeat: -1 },
            { key: 'zapper_attack', texture: 'zapper_attack', frames: { start: 0, end: 9 }, frameRate: 15, repeat: 0 },
            { key: 'zapper_shock', texture: 'zapper_shock', frames: { start: 0, end: 3 }, frameRate: 8, repeat: 0 },
            { key: 'zapper_death', texture: 'zapper_death', frames: { start: 0, end: 7 }, frameRate: 8, repeat: 0 },
        ];
    
        // Loop through animations and dynamically create them
        enemyAnimations.forEach(anim => {
            if (!this.scene.textures.exists(anim.texture)) {
                console.warn(`Texture not found for animation: ${anim.texture}`);
                return; // Skip if texture is not loaded
            }

            if (!this.scene.anims.exists(anim.key)) {
                const frames = this.scene.anims.generateFrameNumbers(anim.texture, anim.frames);
                if (!frames || frames.length === 0) {
                    console.warn(`No valid frames found for animation: ${anim.key}`);
                    return; // Skip if no valid frames are generated
                }

                this.scene.anims.create({
                    key: anim.key,
                    frames,
                    frameRate: anim.frameRate,
                    repeat: anim.repeat,
                });
                console.log(`Created animation: ${anim.key}`);
            }
        });
    }
    
    






    // /**
    //  * Basic enemy animations
    //  */
    // createEnemyAnimations() {
    //     // enemy-idle
    //     if (!this.scene.anims.exists('enemy-idle')) {
    //         this.scene.anims.create({
    //             key: 'enemy-idle',
    //             frames: this.scene.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
    //             frameRate: 8,
    //             repeat: -1
    //         });
    //     }
    //     // enemy-run
    //     if (!this.scene.anims.exists('enemy-run')) {
    //         this.scene.anims.create({
    //             key: 'enemy-run',
    //             frames: this.scene.anims.generateFrameNumbers('enemy', { start: 8, end: 13 }),
    //             frameRate: 10,
    //             repeat: -1
    //         });
    //     }
    //     // enemy-attack
    //     if (!this.scene.anims.exists('enemy-attack')) {
    //         this.scene.anims.create({
    //             key: 'enemy-attack',
    //             frames: this.scene.anims.generateFrameNumbers('enemy', { start: 16, end: 19 }),
    //             frameRate: 12,
    //             repeat: 0
    //         });
    //     }
    // }

    // /**
    //  * Warrior enemy animations
    //  */
    // createWarriorAnimations() {
    //     const animConfigs = {
    //         IDLE:   { endFrame: 5, repeat: -1, frameRate: 8 },
    //         WALK:   { endFrame: 7, repeat: -1, frameRate: 8 },
    //         ATTACK: { endFrame: 6, repeat: 0, frameRate: 12, spriteKey: 'enemymeleewarrior_ATTACK 1' },
    //         DEATH:  { endFrame: 8, repeat: 0, frameRate: 8 },
    //         HURT:   { endFrame: 3, repeat: 0, frameRate: 10 },
    //         DEFEND: { endFrame: 3, repeat: 0, frameRate: 8 },
    //         RUN:    { endFrame: 7, repeat: -1, frameRate: 12 },
    //         JUMP:   { endFrame: 3, repeat: 0, frameRate: 8 }
    //     };

    //     Object.entries(animConfigs).forEach(([key, config]) => {
    //         const spriteKey = config.spriteKey || `enemymeleewarrior_${key}`;
    //         const animKey = `enemymeleewarrior-${key.toLowerCase()}`;

    //         if (!this.scene.anims.exists(animKey)) {
    //             this.scene.anims.create({
    //                 key: animKey,
    //                 frames: this.scene.anims.generateFrameNumbers(spriteKey, {
    //                     start: 0,
    //                     end: config.endFrame
    //                 }),
    //                 frameRate: config.frameRate,
    //                 repeat: config.repeat
    //             });
    //             console.log(`Created warrior animation: ${animKey}`);
    //         }
    //     });
    // }

    // /**
    //  * Zapper enemy animations
    //  */
    // createZapperAnimations() {
    //     console.log('Creating Zapper animations...');

    //     const zapperAnims = {
    //         idle:   { key: 'zapper_idle',   frames: { start: 0, end: 3 },  frameRate: 8,  repeat: -1 },
    //         wake:   { key: 'zapper_wake',   frames: { start: 0, end: 5 },  frameRate: 10, repeat: 0 },
    //         walk:   { key: 'zapper_walk',   frames: { start: 0, end: 7 },  frameRate: 12, repeat: -1 },
    //         attack: { key: 'zapper_attack', frames: { start: 0, end: 5 },  frameRate: 15, repeat: 0 },
    //         shock:  { key: 'zapper_shock',  frames: { start: 0, end: 9 },  frameRate: 15, repeat: 0 },
    //         death:  { key: 'zapper_death',  frames: { start: 0, end: 4 },  frameRate: 10, repeat: 0 }
    //     };

    //     Object.values(zapperAnims).forEach(config => {
    //         if (!this.scene.anims.exists(config.key)) {
    //             const spriteKey = config.key.split('_')[1]; // e.g. "idle"
    //             this.scene.anims.create({
    //                 key: config.key,
    //                 frames: this.scene.anims.generateFrameNumbers(`zapper_${spriteKey}`, config.frames),
    //                 frameRate: config.frameRate,
    //                 repeat: config.repeat
    //             });
    //             console.log(`Created Zapper animation: ${config.key}`);
    //         }
    //     });

    //     console.log('Zapper animations created successfully');
    // }

    // ------------------------------------------------------------------------
    //  NON-CHARACTER (UI / OBJECTS / ETC.)
    // ------------------------------------------------------------------------

    /**
     * Bitcoin spin
     */
    createBitcoinAnimations() {
        if (!this.scene.anims.exists('bitcoin_spin')) {
            this.scene.anims.create({
                key: 'bitcoin_spin',
                frames: [
                    { key: 'bitcoin_1' },
                    { key: 'bitcoin_2' },
                    { key: 'bitcoin_3' },
                    { key: 'bitcoin_4' },
                    { key: 'bitcoin_5' },
                    { key: 'bitcoin_6' },
                    { key: 'bitcoin_7' },
                    { key: 'bitcoin_8' }
                ],
                frameRate: 10,
                repeat: -1
            });
        }
    }

    /**
     * HUD animations (simple frame-based)
     */
    createHUDAnimations() {
        // Health frames
        if (!this.scene.anims.exists('health_0')) {
            for (let i = 0; i <= 9; i++) {
                this.scene.anims.create({
                    key: `health_${i}`,
                    frames: [{ key: 'health', frame: i }],
                    frameRate: 0,
                    repeat: 0
                });
            }
        }

        // Stamina frames
        if (!this.scene.anims.exists('stamina_0')) {
            for (let i = 0; i <= 9; i++) {
                this.scene.anims.create({
                    key: `stamina_${i}`,
                    frames: [{ key: 'stamina', frame: i }],
                    frameRate: 0,
                    repeat: 0
                });
            }
        }
    }

    /**
     * Preloader "loading" animation
     */
    createPreloaderAnimations() {
        if (!this.scene.anims.exists('loading')) {
            this.scene.anims.create({
                key: 'loading',
                frames: this.scene.anims.generateFrameNumbers('preloader', { start: 0, end: 15 }),
                frameRate: 12,
                repeat: -1
            });
        }
    }

    // ------------------------------------------------------------------------
    //  MASTER CREATION CALL
    // ------------------------------------------------------------------------
    createAllAnimations() {
        console.log('Creating all game animations...');

        // Projectiles
        this.createBulletAnimation();
        //this.createAdditionalBulletAnimations();
        // (Optional) this.createHitEffectAnimation();

        // Characters
        this.createCharacterAnimations();
        this.createEnemyAnimations();
        // this.createWarriorAnimations();
        // this.createZapperAnimations();

        // Objects / HUD / Preloader
        this.createBitcoinAnimations();
        this.createHUDAnimations();
        this.createPreloaderAnimations();

        console.log('All animations created successfully.');
    }
}
