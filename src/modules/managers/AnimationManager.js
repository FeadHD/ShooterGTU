export class AnimationManager {
    constructor(scene) {
        this.scene = scene;
        this.initialized = false;
    }

    /**
     * Initialize all game animations
     */
    initialize() {
        if (!this.initialized) {
            this.createAllAnimations();
            this.initialized = true;
        }
    }

    /**
     * Check if an animation exists
     */
    hasAnimation(key) {
        return this.scene.anims.exists(key);
    }

    /**
     * Play an animation on a game object if it exists
     */
    play(gameObject, key, ignoreIfPlaying = true) {
        if (this.hasAnimation(key)) {
            gameObject.play(key, ignoreIfPlaying);
            return true;
        }
        return false;
    }

    createBulletAnimation() {
        if (!this.scene.anims.exists('bullet')) {
            this.scene.anims.create({
                key: 'bullet',
                frames: this.scene.anims.generateFrameNumbers('bullet', { start: 0, end: 1 }),
                frameRate: 10,
                repeat: -1
            });
        }
    }

    createHitEffectAnimation() {
        if (!this.scene.anims.exists('hit-effect')) {
            this.scene.anims.create({
                key: 'hit-effect',
                frames: this.scene.anims.generateFrameNumbers('hit-effect', { start: 0, end: 4 }),
                frameRate: 15,
                repeat: 0
            });
        }
    }

    createCharacterAnimations() {
        console.log('Creating character animations...');

        // Idle animation
        if (!this.scene.anims.exists('character_Idle')) {
            this.scene.anims.create({
                key: 'character_Idle',
                frames: this.scene.anims.generateFrameNumbers('character_idle', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Run animation
        if (!this.scene.anims.exists('character_Run')) {
            this.scene.anims.create({
                key: 'character_Run',
                frames: this.scene.anims.generateFrameNumbers('character_run', { start: 0, end: 5 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // Jump animation
        if (!this.scene.anims.exists('character_Jump')) {
            this.scene.anims.create({
                key: 'character_Jump',
                frames: this.scene.anims.generateFrameNumbers('character_jump', { start: 0, end: 2 }),
                frameRate: 10,
                repeat: 0
            });
        }

        // Fall animation
        if (!this.scene.anims.exists('character_Fall')) {
            this.scene.anims.create({
                key: 'character_Fall',
                frames: this.scene.anims.generateFrameNumbers('character_fall', { start: 0, end: 2 }),
                frameRate: 10,
                repeat: 0
            });
        }

        // Rollover animation
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

    createEnemyAnimations() {
        // Enemy idle animation
        if (!this.scene.anims.exists('enemy-idle')) {
            this.scene.anims.create({
                key: 'enemy-idle',
                frames: this.scene.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Enemy run animation
        if (!this.scene.anims.exists('enemy-run')) {
            this.scene.anims.create({
                key: 'enemy-run',
                frames: this.scene.anims.generateFrameNumbers('enemy', { start: 8, end: 13 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // Enemy attack animation
        if (!this.scene.anims.exists('enemy-attack')) {
            this.scene.anims.create({
                key: 'enemy-attack',
                frames: this.scene.anims.generateFrameNumbers('enemy', { start: 16, end: 19 }),
                frameRate: 12,
                repeat: 0
            });
        }
    }

    createWarriorAnimations() {
        const animConfigs = {
            'IDLE': { endFrame: 5, repeat: -1, frameRate: 8 },
            'WALK': { endFrame: 7, repeat: -1, frameRate: 8 },
            'ATTACK': { endFrame: 6, repeat: 0, frameRate: 12, spriteKey: 'enemymeleewarrior_ATTACK 1' },
            'DEATH': { endFrame: 8, repeat: 0, frameRate: 8 },
            'HURT': { endFrame: 3, repeat: 0, frameRate: 10 },
            'DEFEND': { endFrame: 3, repeat: 0, frameRate: 8 },
            'RUN': { endFrame: 7, repeat: -1, frameRate: 12 },
            'JUMP': { endFrame: 3, repeat: 0, frameRate: 8 }
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

    createZapperAnimations(scene) {
        scene.anims.create({
            key: 'zapper_idle',
            frames: scene.anims.generateFrameNumbers('zapper_idle', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });
    
        scene.anims.create({
            key: 'zapper_wake',
            frames: scene.anims.generateFrameNumbers('zapper_wake', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: 0
        });
    
        scene.anims.create({
            key: 'zapper_walk',
            frames: scene.anims.generateFrameNumbers('zapper_walk', { start: 0, end: 7 }),
            frameRate: 12,
            repeat: -1
        });
    
        scene.anims.create({
            key: 'zapper_shock',
            frames: scene.anims.generateFrameNumbers('zapper_shock', { start: 0, end: 5 }),
            frameRate: 15,
            repeat: 0
        });
    }

    createBulletAnimations(scene) {
        scene.anims.create({
            key: 'bullet-travel',
            frames: scene.anims.generateFrameNumbers('bullet', { start: 0, end: 7 }),
            frameRate: 16,
            repeat: -1
        });
    }

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