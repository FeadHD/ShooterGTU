export class Bitcoin extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bitcoin_1');

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set up physics properties
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
        
        // Set circular hitbox
        const radius = 8; // Smaller radius for tighter circular collision
        this.body.setCircle(radius);
        // Center the circular hitbox
        this.body.setOffset(this.width/2 - radius, this.height/2 - radius);

        // Set up sprite properties
        this.setScale(1.7);
        this.setDepth(1000); // Match player's depth to ensure visibility

        // Create the bitcoin animation if it doesn't exist
        if (!scene.anims.exists('bitcoin_spin')) {
            scene.anims.create({
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

        // Start spinning animation
        this.play('bitcoin_spin');

        // Create floating animation
        this.startY = y;
        this.floatAmplitude = 5; // How many pixels up/down
        this.floatSpeed = 1500; // Speed of the floating motion

        // Start floating animation
        scene.tweens.add({
            targets: this,
            y: this.startY - this.floatAmplitude,
            duration: this.floatSpeed,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    collect() {
        // Increment bitcoin counter
        const currentBitcoins = this.scene.registry.get('bitcoins') || 0;
        this.scene.registry.set('bitcoins', currentBitcoins + 1);

        // Play collection sound
        this.scene.sound.play('bitcoin_collect', { volume: 0.08 });

        // Disable physics body immediately
        this.body.enable = false;

        // Play collection animation
        this.scene.tweens.add({
            targets: this,
            y: this.y - 50,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
            }
        });
    }
}
