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
        // Player idle animation
        if (!this.scene.anims.exists('player-idle')) {
            this.scene.anims.create({
                key: 'player-idle',
                frames: this.scene.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Player run animation
        if (!this.scene.anims.exists('player-run')) {
            this.scene.anims.create({
                key: 'player-run',
                frames: this.scene.anims.generateFrameNumbers('player', { start: 8, end: 13 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // Player jump animation
        if (!this.scene.anims.exists('player-jump')) {
            this.scene.anims.create({
                key: 'player-jump',
                frames: this.scene.anims.generateFrameNumbers('player', { start: 16, end: 23 }),
                frameRate: 12,
                repeat: 0
            });
        }

        // Player shoot animation
        if (!this.scene.anims.exists('player-shoot')) {
            this.scene.anims.create({
                key: 'player-shoot',
                frames: this.scene.anims.generateFrameNumbers('player', { start: 24, end: 26 }),
                frameRate: 15,
                repeat: 0
            });
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

    createAllAnimations() {
        this.createBulletAnimation();
        this.createHitEffectAnimation();
        this.createCharacterAnimations();
        this.createEnemyAnimations();
    }
}