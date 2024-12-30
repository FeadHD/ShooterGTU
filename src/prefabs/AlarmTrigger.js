import Phaser from 'phaser';

class AlarmTrigger extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y, width = 100, height = 100) {
        super(scene, x, y, width, height, 0xff0000, 0.3);
        
        this.scene = scene;
        this.isTriggered = false;
        this.alarmDuration = 3000; // Duration in milliseconds
        this.triggerTime = 0;
        
        // Set initial alpha
        this.setAlpha(0.3);
    }

    update() {
        if (this.isTriggered && (this.scene.time.now - this.triggerTime >= this.alarmDuration)) {
            this.deactivate();
        }
    }

    trigger() {
        if (!this.isTriggered) {
            this.isTriggered = true;
            this.triggerTime = this.scene.time.now;
            this.setAlpha(0.8);
            
            // Play alarm sound if available
            try {
                if (this.scene.sound && this.scene.cache.audio.exists('alarm')) {
                    const alarm = this.scene.sound.add('alarm', { volume: 0.5 });
                    alarm.play();
                }
            } catch (error) {
                console.warn('Could not play alarm sound:', error);
            }
        }
    }

    deactivate() {
        this.isTriggered = false;
        this.setAlpha(0.3);
    }
}

export { AlarmTrigger };
