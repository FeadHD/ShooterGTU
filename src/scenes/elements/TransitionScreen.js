import { TextStyleManager } from '../../modules/managers/TextStyleManager';

export class TransitionScreen {
    constructor(scene) {
        this.scene = scene;
        this.elements = [];
        this.isTransitioning = false;
        
        this.styles = {
            score: {
                fontFamily: 'Retronoid',
                fontSize: '24px',
                color: TextStyleManager.colors.score,
                align: 'left',
                strokeThickness: 1,
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#005555',
                    blur: 4,
                    fill: true
                }
            },
            lives: {
                fontFamily: 'Retronoid',
                fontSize: '24px',
                color: TextStyleManager.colors.lives,
                align: 'left',
                strokeThickness: 1,
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#8b0a50',
                    blur: 4,
                    fill: true
                }
            },
            hp: {
                fontFamily: 'Retronoid',
                fontSize: '24px',
                color: TextStyleManager.colors.hp,
                align: 'left',
                strokeThickness: 1,
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#006400',
                    blur: 4,
                    fill: true
                }
            },
            bitcoin: {
                fontFamily: 'Retronoid',
                fontSize: '24px',
                color: TextStyleManager.colors.bitcoin,
                align: 'left',
                strokeThickness: 1,
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#b8860b',
                    blur: 4,
                    fill: true
                }
            },
            timer: {
                fontFamily: 'Retronoid',
                fontSize: '24px',
                color: TextStyleManager.colors.timer,
                align: 'left',
                strokeThickness: 1,
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#8b008b',
                    blur: 4,
                    fill: true
                }
            }
        };
    }

    start(onComplete) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Set up camera for transition screen to match GameScene1
        this.scene.scale.setGameSize(1920, 1080);
        const mainCamera = this.scene.cameras.main;
        mainCamera.setViewport(0, 0, 1920, 1080);
        mainCamera.setZoom(1); // Set zoom to 1

        // Create black overlay at GameScene1 size
        const overlay = this.scene.add.rectangle(
            0, 0,
            1920,
            1080,
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
        const centerX = 1920 / 2;
        const centerY = 1080 / 2;
        const spacing = 50;
        let delay = 0;
        const delayIncrement = 800;
        const finalPositions = {
            score: { x: 20, y: 20 },       // Exact match from GameUI
            lives: { x: 20, y: 50 },       // Exact match from GameUI
            hp: { x: 20, y: 80 },          // Exact match from GameUI
            bitcoin: { x: 20, y: 110 },     // Exact match from GameUI
            timer: { x: 20, y: 144 }        // Exact match from GameUI
        };

        // Create each UI element centered, then move to final position
        const createUIElement = (text, style, finalPos) => {
            const element = this.scene.add.text(centerX, centerY, text, this.styles[style]);
            element.setOrigin(0.5);
            element.setAlpha(0);
            element.setDepth(9001);
            this.elements.push(element);

            // First fade in at center
            this.scene.tweens.add({
                targets: element,
                alpha: 1,
                duration: 500,
                delay: delay,
                onComplete: () => {
                    // Then move to final position
                    this.scene.tweens.add({
                        targets: element,
                        x: finalPos.x,
                        y: finalPos.y,
                        duration: 1000,
                        ease: 'Power2',
                        onStart: () => {
                            element.setOrigin(0, 0); // Change origin for corner positioning
                        }
                    });
                }
            });
            delay += delayIncrement;
        };

        // Sequence of UI elements
        const elements = [
            { text: 'Score: 0', key: 'score', style: 'score' },
            { text: 'Lives: 3', key: 'lives', style: 'lives' },
            { text: 'HP: 100', key: 'hp', style: 'hp' },
            { text: 'Bitcoins: 0', key: 'bitcoin', style: 'bitcoin' },
            { text: 'Time: 0:00', key: 'timer', style: 'timer' }
        ];

        elements.forEach((element) => {
            createUIElement(element.text, element.style, finalPositions[element.key]);

            // Update text with actual values
            const value = this.scene.registry.get(element.key);
            if (element.key === 'timer') {
                const minutes = Math.floor(value / 60);
                const seconds = value % 60;
                this.elements[this.elements.length - 1].setText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`);
            } else {
                this.elements[this.elements.length - 1].setText(`${element.text.split(':')[0]}: ${value || 0}`);
            }
        });

        // After all elements are in position, wait a bit then complete
        this.scene.time.delayedCall(500 + delayIncrement * elements.length, () => {
            if (onComplete) onComplete();
        });
    }

    destroy() {
        this.elements.forEach(element => element.destroy());
        this.elements = [];
        this.isTransitioning = false;
    }
}
