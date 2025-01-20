/**
 * AnimationManager.js
 * Manages sprite animations for all game entities
 * Handles creation, playback, and validation of animations
 */

export class AnimationManager {
    /**
     * Initialize animation system
     * @param {Phaser.Scene} scene - Scene to attach animations to
     */
    constructor(scene) {
        this.scene = scene;
        this.initialized = false;
    }

    /**
     * Initialize all game animations if not already done
     * Called once at scene startup
     */
    initialize() {
        if (!this.initialized) {
            this.createAllAnimations();
            this.initialized = true;
        }
    }

    /**
     * Check if animation exists in scene
     * @param {string} key - Animation identifier
     */
    hasAnimation(key) {
        return this.scene.anims.exists(key);
    }

    /**
     * Play animation on game object
     * @param {Phaser.GameObjects.Sprite} gameObject - Target sprite
     * @param {string} key - Animation to play
     * @param {boolean} ignoreIfPlaying - Skip if already playing
     */
    play(gameObject, key, ignoreIfPlaying = true) {
        if (this.hasAnimation(key)) {
            gameObject.play(key, ignoreIfPlaying);
            return true;
        }
        return false;
    }

    /**
     * Create bullet projectile animation
     * Two-frame looping animation
     */
    createBulletAnimation() {
        if (!this.scene.anims.exists('bullet')) {
            this.scene.anims.create({
                key: 'bullet',
                frames: this.scene.anims.generateFrameNumbers('bullet', { start: 0, end: 1 }),
                frameRate: 10,
                repeat: -1        // Loop indefinitely
            });
        }
    }

    /**
     * Create hit impact effect animation
     * Quick five-frame sequence
     */
    createHitEffectAnimation() {
        if (!this.scene.anims.exists('hit-effect')) {
            this.scene.anims.create({
                key: 'hit-effect',
                frames: this.scene.anims.generateFrameNumbers('hit-effect', { start: 0, end: 4 }),
                frameRate: 15,
                repeat: 0         // Play once
            });
        }
    }

    /**
     * Create player character animations
     * Includes idle, run, jump, fall, and roll states
     */
    createCharacterAnimations() {
        console.log('Creating character animations...');

        // Idle animation - Continuous loop
        if (!this.scene.anims.exists('character_Idle')) {
            this.scene.anims.create({
                key: 'character_Idle',
                frames: this.scene.anims.generateFrameNumbers('character_idle', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Run animation - Continuous movement
        if (!this.scene.anims.exists('character_Run')) {
            this.scene.anims.create({
                key: 'character_Run',
                frames: this.scene.anims.generateFrameNumbers('character_run', { start: 0, end: 5 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // Jump animation - Single upward motion
        if (!this.scene.anims.exists('character_Jump')) {
            this.scene.anims.create({
                key: 'character_Jump',
                frames: this.scene.anims.generateFrameNumbers('character_jump', { start: 0, end: 2 }),
                frameRate: 10,
                repeat: 0
            });
        }

        // Fall animation - Single downward motion
        if (!this.scene.anims.exists('character_Fall')) {
            this.scene.anims.create({
                key: 'character_Fall',
                frames: this.scene.anims.generateFrameNumbers('character_fall', { start: 0, end: 2 }),
                frameRate: 10,
                repeat: 0
            });
        }

        // Rollover animation - Evasive maneuver
        if (!this.scene.anims.exists('character_Rollover')) {
            this.scene.anims.create({
                key: 'character_Rollover',
                frames: this.scene.anims.generateFrameNumbers('character_rollover', { start: 0, end: 6 }),
                frameRate: 15,
                repeat: 0
            });
        }

        console.log('Character animations created');
        console.log('Available animations:', Object.keys(this.scene.anims.anims.entries));
    }

    /**
     * Create enemy NPC animations
     * Basic movement and attack sequences
     */
    createEnemyAnimations() {
        // Idle state - Continuous patrol
        if (!this.scene.anims.exists('enemy-idle')) {
            this.scene.anims.create({
                key: 'enemy-idle',
                frames: this.scene.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Chase state - Faster movement
        if (!this.scene.anims.exists('enemy-run')) {
            this.scene.anims.create({
                key: 'enemy-run',
                frames: this.scene.anims.generateFrameNumbers('enemy', { start: 8, end: 13 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // Attack sequence - Single strike
        if (!this.scene.anims.exists('enemy-attack')) {
            this.scene.anims.create({
                key: 'enemy-attack',
                frames: this.scene.anims.generateFrameNumbers('enemy', { start: 16, end: 19 }),
                frameRate: 12,
                repeat: 0
            });
        }
    }

    /**
     * Create warrior enemy animations
     * Complex state machine with multiple actions
     */
    createWarriorAnimations() {
        const animConfigs = {
            'IDLE': { endFrame: 5, repeat: -1, frameRate: 8 },      // Patrol state
            'WALK': { endFrame: 7, repeat: -1, frameRate: 8 },      // Slow movement
            'ATTACK': { endFrame: 6, repeat: 0, frameRate: 12, spriteKey: 'enemymeleewarrior_ATTACK 1' },
            'DEATH': { endFrame: 8, repeat: 0, frameRate: 8 },      // Defeat sequence
            'HURT': { endFrame: 3, repeat: 0, frameRate: 10 },      // Damage reaction
            'DEFEND': { endFrame: 3, repeat: 0, frameRate: 8 },     // Block stance
            'RUN': { endFrame: 7, repeat: -1, frameRate: 12 },      // Chase state
            'JUMP': { endFrame: 3, repeat: 0, frameRate: 8 }        // Leap attack
        };

        Object.entries(animConfigs).forEach(([key, config]) => {
            const spriteKey = config.spriteKey || `enemymeleewarrior_${key}`;
            const animKey = `enemymeleewarrior-${key.toLowerCase()}`;

            if (!this.scene.anims.exists(animKey)) {
                this.scene.anims.create({
                    key: animKey,
                    frames: this.scene.anims.generateFrameNumbers(spriteKey, {
                        start: 0,
                        end: config.endFrame
                    }),
                    frameRate: config.frameRate,
                    repeat: config.repeat
                });
                console.log(`Created warrior animation: ${animKey}`);
            }
        });
    }

    /**
     * Create zapper enemy animations
     * Electrical attack patterns
     */
    createZapperAnimations(scene) {
        // Idle animation
        scene.anims.create({
            key: 'zapper_idle',
            frames: scene.anims.generateFrameNumbers('zapper_idle', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1,
        });
    
        // Wake animation
        scene.anims.create({
            key: 'zapper_wake',
            frames: scene.anims.generateFrameNumbers('zapper_wake', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: 0,
        });
    
        // Walk animation
        scene.anims.create({
            key: 'zapper_walk',
            frames: scene.anims.generateFrameNumbers('zapper_walk', { start: 0, end: 7 }),
            frameRate: 12,
            repeat: -1,
        });
    
        // Shock animation
        scene.anims.create({
            key: 'zapper_shock',
            frames: scene.anims.generateFrameNumbers('zapper_shock', { start: 0, end: 5 }),
            frameRate: 15,
            repeat: 0,
        });
    
        console.log('Zapper animations created successfully');
    }

    /**
     * Create projectile animations
     * Bullet travel effects
     */
    createBulletAnimations(scene) {
        scene.anims.create({
            key: 'bullet-travel',
            frames: scene.anims.generateFrameNumbers('bullet', { start: 0, end: 7 }),
            frameRate: 16,
            repeat: -1           // Continuous motion
        });
    }

    /**
     * Initialize all game animations
     * Called once during scene setup
     */
    createAllAnimations() {
        console.log('Creating all game animations...');
        this.createBulletAnimation();
        this.createHitEffectAnimation();
        this.createCharacterAnimations();
        this.createEnemyAnimations();
        this.createWarriorAnimations();
        console.log('All animations created successfully');
    }
}