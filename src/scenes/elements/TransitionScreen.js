import { TextStyleManager } from '../../modules/managers/TextStyleManager';
import { UIManager } from './UIManager';
import { ManagerFactory } from '../../modules/di/ManagerFactory';

export class TransitionScreen {
    constructor(scene) {
        this.scene = scene;
        this.elements = [];
        this.isTransitioning = false;
        this.managers = scene.managers; // Store managers reference
        
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

        // Make sure UIManager exists
        if (!this.scene.gameUI) {
            if (!this.scene.managers) {
                this.scene.managers = ManagerFactory.createManagers(this.scene);
            }
            this.scene.gameUI = this.scene.managers.ui;
        }

        // Fade in black screen
        this.scene.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 500,
            onComplete: () => this.showElements(onComplete)
        });
    }

    showElements(onComplete) {
        // Create black overlay at GameScene1 size
        const overlay = this.elements[0]; // The black overlay

        // Start the UI animation sequence
        if (this.scene.gameUI) {
            this.scene.gameUI.animateUIElements();
        }

        // After animations complete, start scene transition
        this.scene.time.delayedCall(4500, () => { // Wait for all UI animations
            if (onComplete) {
                onComplete();
                
                // After scene transition, fade out the black overlay
                this.scene.time.delayedCall(100, () => {
                    if (overlay) {
                        this.scene.tweens.add({
                            targets: overlay,
                            alpha: 0,
                            duration: 500,
                            ease: 'Power2',
                            onComplete: () => {
                                overlay.destroy();
                                // Make sure UI elements persist in GameScene1
                                if (this.scene.gameUI) {
                                    this.scene.gameUI.container.setDepth(100);
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    destroy() {
        this.elements.forEach(element => element.destroy());
        this.elements = [];
        this.isTransitioning = false;
    }
}
