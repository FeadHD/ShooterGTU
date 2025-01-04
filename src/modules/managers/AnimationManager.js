export class AnimationManager {
    constructor(scene) {
        this.scene = scene;
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
        console.log('Creating character animations');
        
        // Idle animation
        if (!this.scene.anims.exists('character_Idle')) {
            this.scene.anims.create({
                key: 'character_Idle',
                frames: this.scene.anims.generateFrameNumbers('character_idle', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Walking animation
        if (!this.scene.anims.exists('character_Walking')) {
            this.scene.anims.create({
                key: 'character_Walking',
                frames: this.scene.anims.generateFrameNumbers('character_walking', { start: 0, end: 5 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // Running animation
        if (!this.scene.anims.exists('character_Run')) {
            this.scene.anims.create({
                key: 'character_Run',
                frames: this.scene.anims.generateFrameNumbers('character_run', { start: 0, end: 5 }),
                frameRate: 12,
                repeat: -1
            });
        }

        // Jump animation
        if (!this.scene.anims.exists('character_Jump')) {
            this.scene.anims.create({
                key: 'character_Jump',
                frames: this.scene.anims.generateFrameNumbers('character_jump', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: 0
            });
        }

        // Death animation
        if (!this.scene.anims.exists('character_Death')) {
            this.scene.anims.create({
                key: 'character_Death',
                frames: this.scene.anims.generateFrameNumbers('character_death', { start: 0, end: 5 }),
                frameRate: 8,
                repeat: 0
            });
        }

        // Rollover animation
        if (!this.scene.anims.exists('character_Rollover')) {
            console.log('Creating rollover animation');
            try {
                const rolloverConfig = {
                    key: 'character_Rollover',
                    frames: this.scene.anims.generateFrameNumbers('character_rollover', { 
                        start: 0, 
                        end: 7  // Adjust based on actual number of frames
                    }),
                    frameRate: 14,  // Slightly faster to complete in rollDuration
                    repeat: 0,
                    hideOnComplete: false
                };
                console.log('Rollover config:', rolloverConfig);
                this.scene.anims.create(rolloverConfig);
                console.log('Rollover animation created successfully');
                
                // Debug: list all animations
                console.log('Available animations:', Object.keys(this.scene.anims.anims.entries));
            } catch (error) {
                console.error('Error creating rollover animation:', error);
            }
        }
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

    createAllAnimations() {
        this.createBulletAnimation();
        this.createHitEffectAnimation();
        this.createCharacterAnimations();
        this.createEnemyAnimations();
        this.createWarriorAnimations();
    }
}