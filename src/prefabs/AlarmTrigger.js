import Phaser from 'phaser';

class AlarmTrigger extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y) {
        super(scene, x, y);
        
        // Add to scene
        scene.add.existing(this);
        
        // Set up graphics
        this.setSize(32, 32);
        
        // Only show if added through Zucc menu
        const fromZucc = scene.trapConfig && scene.trapConfig.AlarmTrigger > 0;
        if (fromZucc) {
            // Create a red rectangle for visibility
            const graphics = scene.add.graphics();
            graphics.lineStyle(2, 0xff0000);
            graphics.strokeRect(-16, -16, 32, 32);
            graphics.fillStyle(0xff0000, 0.3);
            graphics.fillRect(-16, -16, 32, 32);
            this.add(graphics);
        } else {
            // Make invisible if not from Zucc menu
            this.setAlpha(0);
        }

        // Initialize sound
        this.alarmSound = scene.sound.add('alarm', { loop: false });
        this.triggered = false;
    }

    update() {
        if (this.triggered && (this.scene.time.now - this.triggerTime >= this.alarmDuration)) {
            this.deactivate();
        }
    }

    triggerAlarm() {
        if (!this.triggered) {
            this.alarmSound.play();
            this.triggered = true;
            
            // Reset after sound duration
            this.scene.time.delayedCall(this.alarmSound.duration * 1000, () => {
                this.triggered = false;
            });
        }
    }

    deactivate() {
        this.triggered = false;
    }
}

export { AlarmTrigger };
