export class DisappearingPlatform extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, width = 64, height = 32) {
        // Create a simple rectangle graphic if no texture exists
        if (!scene.textures.exists('platform')) {
            const graphics = scene.add.graphics();
            graphics.fillStyle(0x00ff00, 1); // Green color
            graphics.fillRect(0, 0, width, height);
            graphics.generateTexture('platform', width, height);
            graphics.destroy();
        }

        super(scene, x, y, 'platform');
        
        this.scene = scene;
        this.initialX = x;
        this.initialY = y;
        this.platformWidth = width;
        this.platformHeight = height;
        this.respawnDelay = 10000; // 10 seconds in milliseconds
        this.isDisappeared = false;
        this.isRespawning = false;

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true makes it static

        // Set the platform's size
        this.setDisplaySize(width, height);
        
        // Add alpha tween for visual feedback
        this.alphaTween = scene.tweens.add({
            targets: this,
            alpha: 0.7,
            duration: 500,
            yoyo: true,
            repeat: -1,
            paused: true
        });
    }

    disappear() {
        if (this.isDisappeared || this.isRespawning) return;
        
        this.isDisappeared = true;
        
        // Fade out effect
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.body.enable = false;
                this.setVisible(false);
                this.startRespawnTimer();
            }
        });
    }

    startRespawnTimer() {
        this.isRespawning = true;
        this.scene.time.delayedCall(this.respawnDelay, () => {
            this.respawn();
        });
    }

    respawn() {
        this.isDisappeared = false;
        this.isRespawning = false;
        this.body.enable = true;
        this.setVisible(true);
        this.setAlpha(0);

        // Fade in effect
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 300
        });
    }

    startHoverEffect() {
        if (!this.isDisappeared && !this.isRespawning) {
            this.alphaTween.resume();
        }
    }

    stopHoverEffect() {
        this.alphaTween.pause();
        if (!this.isDisappeared && !this.isRespawning) {
            this.setAlpha(1);
        }
    }
}
