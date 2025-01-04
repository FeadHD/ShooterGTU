import Phaser from 'phaser';

class AlarmTrigger extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        
        // Add to scene
        scene.add.existing(this);
        
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
        this.alarmDuration = 10000; // 10 seconds alarm duration
    }

    update() {
        if (this.triggered && (this.scene.time.now - this.triggerTime >= this.alarmDuration)) {
            this.deactivate();
        }
    }

    triggerAlarm() {
        if (!this.triggered) {
            this.triggered = true;
            this.triggerTime = this.scene.time.now;
            
            // Stop background music
            if (this.scene.bgMusic && this.scene.bgMusic.isPlaying) {
                this.scene.bgMusic.stop();
            }

            // Play alarm sound
            this.alarmSound.play();
            
            // Emit alarm triggered event
            this.scene.events.emit('alarmTriggered');
            
            // Flash the alarm trigger
            this.scene.tweens.add({
                targets: this,
                alpha: 0.2,
                duration: 200,
                yoyo: true,
                repeat: -1
            });
        }
    }

    deactivate() {
        if (this.triggered) {
            this.triggered = false;
            if (this.alarmSound.isPlaying) {
                this.alarmSound.stop();
            }
            
            // Emit alarm reset event
            this.scene.events.emit('alarmReset');
            
            // Stop flashing
            this.scene.tweens.killTweensOf(this);
            this.setAlpha(1);
        }
    }
}

export { AlarmTrigger };
