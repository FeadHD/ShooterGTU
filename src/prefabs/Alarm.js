export default class Alarm {
    constructor(scene) {
        this.scene = scene;
        this.textConfig = {
            fontSize: '28px',
            fontFamily: 'Retronoid',
            color: '#ffffff'
        };
    }

    showVirusAlarm() {
        const { width, height } = this.scene.scale;
        
        // Create alarm container
        const alarmContainer = this.scene.add.container(width / 2, height / 4);
        alarmContainer.setDepth(1000);
        alarmContainer.setScrollFactor(0);
        
        // Create red background
        const bg = this.scene.add.rectangle(0, 0, 400, 60, 0xff0000);
        bg.setAlpha(0.8);
        
        // Create alarm text
        const text = this.scene.add.text(0, 0, 'VIRUS DETECTED IN LEDGER', this.textConfig);
        text.setOrigin(0.5);
        
        // Add to container
        alarmContainer.add([bg, text]);
        
        // Add flashing effect
        this.scene.tweens.add({
            targets: alarmContainer,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                alarmContainer.destroy();
            }
        });
        
        // Add slight shake effect
        this.scene.cameras.main.shake(2000, 0.003);
        
        // Play alarm sound if available
        if (this.scene.sound.get('alarm')) {
            this.scene.sound.play('alarm', { volume: 0.5 });
        }
    }

    // Generic method to show custom alarms
    showCustomAlarm(message, config = {}) {
        const {
            duration = 3000,
            backgroundColor = 0xff0000,
            alpha = 0.8,
            fontSize = '28px',
            flashCount = 5,
            position = { x: 0.5, y: 0.25 } // Percentages of screen width/height
        } = config;

        const { width, height } = this.scene.scale;
        
        // Create alarm container
        const alarmContainer = this.scene.add.container(
            width * position.x,
            height * position.y
        );
        alarmContainer.setDepth(1000);
        alarmContainer.setScrollFactor(0);
        
        // Create background
        const bg = this.scene.add.rectangle(0, 0, 400, 60, backgroundColor);
        bg.setAlpha(alpha);
        
        // Create text
        const text = this.scene.add.text(0, 0, message, {
            ...this.textConfig,
            fontSize
        });
        text.setOrigin(0.5);
        
        // Add to container
        alarmContainer.add([bg, text]);
        
        // Add flashing effect
        this.scene.tweens.add({
            targets: alarmContainer,
            alpha: 0,
            duration: duration / (flashCount * 2),
            yoyo: true,
            repeat: flashCount,
            onComplete: () => {
                alarmContainer.destroy();
            }
        });
        
        // Add shake effect
        this.scene.cameras.main.shake(duration, 0.003);
        
        return alarmContainer;
    }
}
