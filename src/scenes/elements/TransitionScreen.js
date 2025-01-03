export class TransitionScreen {
    constructor(scene) {
        this.scene = scene;
        this.elements = [];
        this.isTransitioning = false;
        this.textStyle = {
            fontFamily: 'Gameplay',
            fontSize: '24px',
            color: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 4
        };
    }

    start(onComplete) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Create black overlay
        const overlay = this.scene.add.rectangle(
            0, 0,
            this.scene.SCENE_WIDTH * 2,
            this.scene.SCENE_HEIGHT * 2,
            0x000000
        );
        overlay.setDepth(9000);
        overlay.setAlpha(0);
        overlay.setOrigin(0);
        this.elements.push(overlay);

        // Fade in black screen
        this.scene.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 500,
            onComplete: () => this.showElements(onComplete)
        });
    }

    showElements(onComplete) {
        const centerX = this.scene.SCENE_WIDTH / 2;
        const startY = this.scene.SCENE_HEIGHT / 3;
        const spacing = 50;
        let delay = 0;
        const delayIncrement = 800;

        // Sequence of UI elements
        const elements = [
            { text: 'Score: 0', key: 'score' },
            { text: 'Lives: 3', key: 'lives' },
            { text: 'HP: 100', key: 'hp' },
            { text: 'Bitcoins: 0', key: 'bitcoins' },
            { text: 'Time: 0:00', key: 'time' }
        ];

        elements.forEach((element, index) => {
            const text = this.scene.add.text(
                centerX,
                startY + (spacing * index),
                element.text,
                this.textStyle
            )
            .setDepth(9001)
            .setAlpha(0)
            .setOrigin(0.5);

            this.elements.push(text);

            // Fade in each element with delay
            this.scene.tweens.add({
                targets: text,
                alpha: 1,
                duration: 500,
                delay: delay,
                onComplete: () => {
                    // Update text with actual values from registry
                    const value = this.scene.registry.get(element.key);
                    if (element.key === 'time') {
                        const minutes = Math.floor(value / 60);
                        const seconds = value % 60;
                        text.setText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`);
                    } else {
                        text.setText(`${element.text.split(':')[0]}: ${value || 0}`);
                    }
                }
            });

            delay += delayIncrement;
        });

        // After all elements are shown, wait a bit then trigger scene transition
        this.scene.time.delayedCall(delay + delayIncrement, () => {
            if (onComplete) onComplete();
        });
    }

    destroy() {
        this.elements.forEach(element => element.destroy());
        this.elements = [];
        this.isTransitioning = false;
    }
}
