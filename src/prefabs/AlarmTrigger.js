import Phaser from 'phaser';

class AlarmTrigger extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        
        // Add to scene
        scene.add.existing(this);
        
        // Set up physics body size
        this.setSize(32, 32);
        
        // Create visible graphics
        const graphics = scene.add.graphics();
        graphics.lineStyle(2, 0xff0000);
        graphics.strokeRect(-16, -16, 32, 32);  // Center the graphics
        graphics.fillStyle(0xff0000, 0.3);
        graphics.fillRect(-16, -16, 32, 32);    // Center the graphics
        this.add(graphics);

        // Add an icon or symbol to make it more visible
        const icon = scene.add.text(-8, -12, '⚠️', { 
            fontSize: '24px',
            color: '#ffffff'
        });
        this.add(icon);

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
        if (this.alarmSound.isPlaying) {
            this.alarmSound.stop();
        }
    }
}

export { AlarmTrigger };
